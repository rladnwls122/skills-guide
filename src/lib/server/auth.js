/* 로그인 — 아이디와 비밀번호, 그리고 쿠키 세션.
 *
 * 공개 URL 이라 다음 넷은 줄이지 않는다.
 *
 * - 비밀번호는 scrypt 로 해시한다. 사용자마다 다른 소금을 쓰고, 비교는 상수 시간이다.
 *   scrypt 는 노드 표준 라이브러리라 의존성이 늘지 않는다. SHA 같은 빠른 해시는
 *   초당 수억 번 시도할 수 있어서 비밀번호에 쓰지 않는다.
 * - 세션은 무작위 값이고 저장소에만 산다. 쿠키는 httpOnly·Secure·SameSite=Lax 다.
 *   localStorage 에 토큰을 두면 문서 어느 스크립트든 읽어 갈 수 있다.
 * - 로그인 실패는 아이디와 주소별로 센다. 막히면 잠시 잠근다.
 * - 오류 문구는 아이디가 있는지 없는지를 알려 주지 않는다.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { store } from './store.js';

const scrypt = promisify(scryptCb);

const SESSION_COOKIE = 'sg_session';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30일
const KEY_LEN = 64;

/** 로그인 시도 제한. 창 안에서 이 횟수를 넘기면 창이 끝날 때까지 잠근다. */
const ATTEMPT_WINDOW = 60 * 15;
const ATTEMPT_MAX = 10;

export const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const PASSWORD_MIN = 10;

const userKey = (id) => `sg:user:${id}`;
const sessionKey = (sid) => `sg:session:${sid}`;
export const progressKey = (id) => `sg:progress:${id}`;

/** 아이디는 대소문자를 구분하지 않는다 — 같은 계정을 둘로 만들지 않기 위해서다. */
export function normalizeId(raw) {
	return String(raw || '')
		.trim()
		.toLowerCase();
}

export async function hashPassword(password) {
	const salt = randomBytes(16);
	const key = await scrypt(password, salt, KEY_LEN);
	return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
	if (typeof stored !== 'string') return false;
	const [scheme, salt, expected] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !expected) return false;

	const expectedBuf = Buffer.from(expected, 'base64');
	const actual = await scrypt(password, Buffer.from(salt, 'base64'), expectedBuf.length);
	/* 길이가 다르면 timingSafeEqual 이 예외를 던진다 — 먼저 거른다. */
	if (actual.length !== expectedBuf.length) return false;
	return timingSafeEqual(actual, expectedBuf);
}

export async function readUser(id) {
	const raw = await store().get(userKey(id));
	if (!raw) return null;
	return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/** 이미 있으면 false. 경쟁 조건은 저장소의 조건부 쓰기가 막는다. */
export async function createUser(id, password) {
	const record = { id, hash: await hashPassword(password), createdAt: Date.now() };
	return await store().setIfAbsent(userKey(id), JSON.stringify(record));
}

/* ── 시도 제한 ─────────────────────────────────────────────────────────── */

/** 아이디와 주소를 각각 센다. 한쪽만 세면 다른 축으로 우회할 수 있다. */
export async function throttle(id, ip) {
	const db = store();
	const counts = await Promise.all([
		db.incrWithTtl(`sg:try:id:${id}`, ATTEMPT_WINDOW),
		db.incrWithTtl(`sg:try:ip:${ip}`, ATTEMPT_WINDOW),
	]);
	return counts.some((n) => n > ATTEMPT_MAX);
}

export async function clearThrottle(id, ip) {
	const db = store();
	await Promise.all([db.del(`sg:try:id:${id}`), db.del(`sg:try:ip:${ip}`)]);
}

/* ── 세션 ──────────────────────────────────────────────────────────────── */

export async function startSession(id) {
	const sid = randomBytes(32).toString('base64url');
	await store().set(sessionKey(sid), id, SESSION_TTL);
	return sid;
}

export async function readSession(request) {
	const sid = readCookie(request, SESSION_COOKIE);
	if (!sid) return null;
	const id = await store().get(sessionKey(sid));
	return id ? { sid, id: String(id) } : null;
}

export async function endSession(sid) {
	await store().del(sessionKey(sid));
}

function readCookie(request, name) {
	const header = request.headers.get('cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const eq = part.indexOf('=');
		if (eq < 0) continue;
		if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
	}
	return null;
}

/* Secure 는 배포에서만 붙인다 — 로컬 http 개발에서 쿠키가 통째로 버려지는 것을 막는다. */
export function sessionCookie(sid) {
	const bits = [
		`${SESSION_COOKIE}=${sid}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${SESSION_TTL}`,
	];
	if (import.meta.env.PROD) bits.push('Secure');
	return bits.join('; ');
}

export function clearedCookie() {
	const bits = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
	if (import.meta.env.PROD) bits.push('Secure');
	return bits.join('; ');
}

/* ── 응답 ──────────────────────────────────────────────────────────────── */

export function json(body, init = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			/* 진도와 계정 상태는 사용자마다 다르다. 어디에도 캐시되면 안 된다. */
			'cache-control': 'no-store',
			...(init.headers || {}),
		},
	});
}

export function clientIp(request) {
	const forwarded = request.headers.get('x-forwarded-for');
	return (forwarded ? forwarded.split(',')[0] : '').trim() || 'unknown';
}
