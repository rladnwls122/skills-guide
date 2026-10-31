$ErrorActionPreference = 'Stop'
$files = Get-ChildItem .\src\content\docs -Recurse -File -Filter *.mdx
$changedFiles = 0
$quizCount = 0
$positionCounts = @{}
foreach ($file in $files) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $newline = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($line in ($text -split "`r?`n")) { [void]$lines.Add($line) }
  $fileChanged = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -notmatch '^<Quiz\b') { continue }
    $end = $i + 1
    while ($end -lt $lines.Count -and $lines[$end] -notmatch '^</Quiz>') { $end++ }
    if ($end -ge $lines.Count) { continue }
    $starts = [System.Collections.Generic.List[int]]::new()
    for ($j = $i + 1; $j -lt $end; $j++) {
      if ($lines[$j] -match '^\s*- \[[ xX]\] ') { $starts.Add($j) }
    }
    if ($starts.Count -lt 3) { continue }
    $blocks = [System.Collections.Generic.List[object]]::new()
    for ($k = 0; $k -lt $starts.Count; $k++) {
      $a = $starts[$k]
      $b = if ($k + 1 -lt $starts.Count) { $starts[$k + 1] } else { $end }
      $z = $a + 1
      while ($z -lt $b -and ($lines[$z] -match '^\s*>|^\s*$')) { $z++ }
      $blocks.Add([pscustomobject]@{ Text = @($lines.GetRange($a, $z - $a)); Correct = ($lines[$a] -match '^\s*- \[x\]') })
    }
    $seedText = $file.FullName + '|' + $lines[$i]
    $sha = [System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::UTF8.GetBytes($seedText))
    $rng = [System.Random]::new([BitConverter]::ToInt32($sha, 0))
    $arr = @($blocks.ToArray())
    for ($k = $arr.Count - 1; $k -gt 0; $k--) {
      $r = $rng.Next($k + 1); $tmp = $arr[$k]; $arr[$k] = $arr[$r]; $arr[$r] = $tmp
    }
    if ($arr[0].Correct) { $r = 1 + $rng.Next($arr.Count - 1); $tmp = $arr[0]; $arr[0] = $arr[$r]; $arr[$r] = $tmp }
    $correctIndex = -1
    for ($k = 0; $k -lt $arr.Count; $k++) { if ($arr[$k].Correct) { $correctIndex = $k + 1; break } }
    if ($correctIndex -lt 1) { throw "No correct answer found in $($file.FullName):$($i + 1)" }
    if (-not $positionCounts.ContainsKey($correctIndex)) { $positionCounts[$correctIndex] = 0 }
    $positionCounts[$correctIndex]++
    $replacement = [System.Collections.Generic.List[string]]::new()
    foreach ($block in $arr) { foreach ($line in $block.Text) { $replacement.Add($line) } }
    $lastOption = $starts[$starts.Count - 1]
    $tail = $lastOption + 1
    while ($tail -lt $end -and ($lines[$tail] -match '^\s*>|^\s*$')) { $tail++ }
    $lines.RemoveRange($starts[0], $tail - $starts[0])
    $lines.InsertRange($starts[0], $replacement)
    $quizCount++
    $fileChanged = $true
  }
  if ($fileChanged) {
    [System.IO.File]::WriteAllText($file.FullName, ($lines -join $newline), [System.Text.UTF8Encoding]::new($false))
    $changedFiles++
  }
}
"MDX_FILES=$($files.Count) CHANGED_FILES=$changedFiles SHUFFLED_QUIZZES=$quizCount POSITIONS=$((($positionCounts.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name):$($_.Value)" }) -join ', '))"
