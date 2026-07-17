param(
  [string]$RootDir = "docs/claude-source"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$manifestPath = Join-Path $RootDir "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestPath | ConvertFrom-Json

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Claude Source") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Local archive of `claude-code-from-source.com`.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Contents:") | Out-Null
$lines.Add("- `en/`: English markdown chapters") | Out-Null
$lines.Add("- `zh-CN/`: Simplified Chinese translated copies") | Out-Null
$lines.Add("- `html/`: Raw HTML pages") | Out-Null
$lines.Add("- `manifest.json`: Fetch manifest") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Table of Contents") | Out-Null
$lines.Add("") | Out-Null

foreach ($item in $manifest) {
  $enPath = Join-Path $RootDir $item.en
  $zhPath = Join-Path $RootDir $item.zhCN

  $enTitle = (Get-Content -Encoding UTF8 -LiteralPath $enPath | Select-Object -First 1).Trim()
  $zhTitle = (Get-Content -Encoding UTF8 -LiteralPath $zhPath | Select-Object -First 1).Trim()

  $enRel = $item.en -replace '\\', '/'
  $zhRel = $item.zhCN -replace '\\', '/'
  $htmlRel = $item.html -replace '\\', '/'

  $lines.Add("### $($item.slug)") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("- English: [$enTitle](./$enRel)") | Out-Null
  $lines.Add("- Chinese: [$zhTitle](./$zhRel)") | Out-Null
  $lines.Add("- HTML: [$($item.slug)](./$htmlRel)") | Out-Null
  $lines.Add("- Source: <$($item.url)>") | Out-Null
  $lines.Add("") | Out-Null
}

$readmePath = Join-Path $RootDir "README.md"
[System.IO.File]::WriteAllLines($readmePath, $lines, [System.Text.Encoding]::UTF8)
