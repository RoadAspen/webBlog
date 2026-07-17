param(
  [string]$RootDir = "docs/claude-source",
  [string]$Proxy = "http://10.195.228.247:5005"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-TranslateLine {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Text
  )

  $encoded = [System.Uri]::EscapeDataString($Text)
  $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=$encoded"
  $args = @(
    "-L",
    "-k",
    "--ssl-no-revoke",
    "--proxy", $Proxy,
    "--connect-timeout", "15",
    "--max-time", "60",
    $url
  )
  $response = (& curl.exe @args | Out-String)
  $json = $response | ConvertFrom-Json

  $builder = New-Object System.Text.StringBuilder
  foreach ($segment in $json[0]) {
    [void]$builder.Append($segment[0])
  }
  return $builder.ToString()
}

function Convert-Line {
  param(
    [string]$Line
  )

  $line = $Line.TrimEnd()

  if ([string]::IsNullOrWhiteSpace($line)) {
    return ""
  }

  if ($line -match '^```') {
    return $line
  }

  $line = [regex]::Replace($line, '^\s+', '')
  $line = $line -replace '\s+([,.;:!?])', '$1'
  $line = $line -replace '\s{2,}', ' '

  $isCodeLike = $line -match '`' -or $line -match '^[\-\*\d\.\s]*[A-Za-z0-9_/:\-\(\)]+$'
  $asciiOnly = ($line -replace '[^\u0000-\u007F]', '')
  $cjkOnly = ($line -replace '[^\u4e00-\u9fff]', '')

  if (-not $isCodeLike -and $asciiOnly.Length -ge 24 -and $cjkOnly.Length -lt 10) {
    try {
      $translated = Invoke-TranslateLine -Text $line
      if (-not [string]::IsNullOrWhiteSpace($translated)) {
        Start-Sleep -Milliseconds 200
        return $translated.Trim()
      }
    } catch {
      return $line
    }
  }

  return $line
}

$zhDir = Join-Path $RootDir "zh-CN"
$files = Get-ChildItem -LiteralPath $zhDir -Filter '*.md' -File | Sort-Object Name

foreach ($file in $files) {
  $rawLines = Get-Content -Encoding UTF8 -LiteralPath $file.FullName
  $out = New-Object System.Collections.Generic.List[string]
  $insideFence = $false

  foreach ($line in $rawLines) {
    if ($line -match '^```') {
      $insideFence = -not $insideFence
      $out.Add($line) | Out-Null
      continue
    }

    if ($insideFence) {
      $out.Add($line) | Out-Null
      continue
    }

    $out.Add((Convert-Line -Line $line)) | Out-Null
  }

  $joined = ($out -join "`n")
  $joined = [regex]::Replace($joined, "`n{3,}", "`n`n")
  $joined = $joined.Trim() + "`n"
  [System.IO.File]::WriteAllText($file.FullName, $joined, [System.Text.Encoding]::UTF8)
}
