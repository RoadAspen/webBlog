param(
  [string]$Proxy = "http://10.195.228.247:5005",
  [string]$BaseUrl = "https://claude-code-from-source.com",
  [string]$OutputDir = "claude-source"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Fetch {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $args = @(
    "-L",
    "-k",
    "--ssl-no-revoke",
    "--proxy", $Proxy,
    "--connect-timeout", "15",
    "--max-time", "120",
    $Url
  )

  $result = & curl.exe @args
  return ($result | Out-String)
}

function Get-ChapterLinks {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Html
  )

  $matches = [regex]::Matches($Html, '<a href="(/ch\d{2}-[^/"]+/)"')
  $links = New-Object System.Collections.Generic.List[string]

  foreach ($match in $matches) {
    $href = $match.Groups[1].Value
    if (-not $links.Contains($href)) {
      $links.Add($href)
    }
  }

  return $links
}

function Convert-ToText {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Html
  )

  $content = $Html
  $content = [regex]::Replace($content, '(?s)<script\b.*?</script>', '')
  $content = [regex]::Replace($content, '(?s)<style\b.*?</style>', '')
  $content = [regex]::Replace($content, '(?s)<nav id="sidebar".*?</nav>', '')
  $content = [regex]::Replace($content, '(?s)<aside.*?</aside>', '')

  $articleMatch = [regex]::Match($content, '(?s)<article\b[^>]*>(.*?)</article>')
  if ($articleMatch.Success) {
    $content = $articleMatch.Groups[1].Value
  }

  $content = [regex]::Replace($content, '(?i)<br\s*/?>', "`n")
  $content = [regex]::Replace($content, '(?i)</p>', "`n`n")
  $content = [regex]::Replace($content, '(?i)</h[1-6]>', "`n`n")
  $content = [regex]::Replace($content, '(?i)</li>', "`n")
  $content = [regex]::Replace($content, '(?i)<li[^>]*>', "- ")
  $content = [regex]::Replace($content, '(?i)<pre[^>]*>', "`n```text`n")
  $content = [regex]::Replace($content, '(?i)</pre>', "`n```n")
  $content = [regex]::Replace($content, '(?i)<code[^>]*>', '`')
  $content = [regex]::Replace($content, '(?i)</code>', '`')

  $content = [regex]::Replace($content, '(?is)<h1[^>]*>(.*?)</h1>', '# $1`n`n')
  $content = [regex]::Replace($content, '(?is)<h2[^>]*>(.*?)</h2>', '## $1`n`n')
  $content = [regex]::Replace($content, '(?is)<h3[^>]*>(.*?)</h3>', '### $1`n`n')
  $content = [regex]::Replace($content, '(?is)<h4[^>]*>(.*?)</h4>', '#### $1`n`n')

  $content = [regex]::Replace($content, '<[^>]+>', ' ')

  $content = $content.Replace('&amp;', '&')
  $content = $content.Replace('&lt;', '<')
  $content = $content.Replace('&gt;', '>')
  $content = $content.Replace('&quot;', '"')
  $content = $content.Replace('&#39;', "'")
  $content = $content.Replace('&nbsp;', ' ')

  $content = [regex]::Replace($content, "[`r`t]+", " ")
  $content = [regex]::Replace($content, " +`n", "`n")
  $content = [regex]::Replace($content, "`n{3,}", "`n`n")
  $content = $content.Trim()

  return $content
}

function Invoke-Translate {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Text
  )

  $encoded = [System.Uri]::EscapeDataString($Text)
  $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=$encoded"
  $response = Invoke-Fetch -Url $url
  $json = $response | ConvertFrom-Json

  $builder = New-Object System.Text.StringBuilder
  foreach ($segment in $json[0]) {
    [void]$builder.Append($segment[0])
  }
  return $builder.ToString()
}

function Split-ForTranslation {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Text,
    [int]$ChunkSize = 3000
  )

  $chunks = New-Object System.Collections.Generic.List[string]
  $buffer = New-Object System.Text.StringBuilder

  foreach ($line in ($Text -split "`n")) {
    if (($buffer.Length + $line.Length + 1) -gt $ChunkSize -and $buffer.Length -gt 0) {
      $chunks.Add($buffer.ToString().Trim())
      $buffer.Clear() | Out-Null
    }
    [void]$buffer.AppendLine($line)
  }

  if ($buffer.Length -gt 0) {
    $chunks.Add($buffer.ToString().Trim())
  }

  return $chunks
}

$root = Join-Path $PWD $OutputDir
$enDir = Join-Path $root "en"
$zhDir = Join-Path $root "zh-CN"
$htmlDir = Join-Path $root "html"

New-Item -ItemType Directory -Force -Path $root, $enDir, $zhDir, $htmlDir | Out-Null

$homeHtml = Invoke-Fetch -Url "$BaseUrl/"
[System.IO.File]::WriteAllText((Join-Path $htmlDir "index.html"), $homeHtml, [System.Text.Encoding]::UTF8)

$chapterPaths = Get-ChapterLinks -Html $homeHtml

$manifest = New-Object System.Collections.Generic.List[object]

foreach ($chapterPath in $chapterPaths) {
  $url = "$BaseUrl$chapterPath"
  $slug = $chapterPath.Trim("/").Replace("/", "")

  Write-Host "Fetching $slug"
  $html = Invoke-Fetch -Url $url
  [System.IO.File]::WriteAllText((Join-Path $htmlDir "$slug.html"), $html, [System.Text.Encoding]::UTF8)

  $text = Convert-ToText -Html $html
  $enPath = Join-Path $enDir "$slug.md"
  [System.IO.File]::WriteAllText($enPath, $text, [System.Text.Encoding]::UTF8)

  $translatedChunks = New-Object System.Collections.Generic.List[string]
  $chunks = Split-ForTranslation -Text $text
  foreach ($chunk in $chunks) {
    if ([string]::IsNullOrWhiteSpace($chunk)) {
      continue
    }
    $translatedChunks.Add((Invoke-Translate -Text $chunk))
    Start-Sleep -Milliseconds 250
  }

  $zhText = ($translatedChunks -join "`n`n").Trim()
  $zhPath = Join-Path $zhDir "$slug.zh-CN.md"
  [System.IO.File]::WriteAllText($zhPath, $zhText, [System.Text.Encoding]::UTF8)

  $manifest.Add([pscustomobject]@{
    slug = $slug
    url = $url
    en = "en/$slug.md"
    zhCN = "zh-CN/$slug.zh-CN.md"
    html = "html/$slug.html"
  }) | Out-Null
}

$manifest | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $root "manifest.json")
