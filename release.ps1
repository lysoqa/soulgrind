# Erstellt ein neues Soulgrind-Release auf GitHub.
# Beispiel:  .\release.ps1 0.2.0 "Neue Gegner und schnellere Pfeile"
#            .\release.ps1 0.2.0 -NotesFile patchnotes.md
param(
  [Parameter(Mandatory = $true)] [string]$Version,
  [string]$Notes = '',
  [string]$NotesFile = ''
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Version = $Version.TrimStart('v')
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Version bitte als 1.2.3 angeben.' }
if (git status --porcelain) { throw 'Es gibt noch nicht committete Änderungen. Bitte erst committen.' }
if (-not (Select-String -Path js/main.js -SimpleMatch "GAME_VERSION = '$Version'" -Quiet)) {
  throw "In js/main.js steht eine andere GAME_VERSION. Bitte auf '$Version' setzen und committen."
}

# Zip mit "/" als Trenner bauen (Compress-Archive in Windows PowerShell nutzt "\", das mögen andere Programme nicht)
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force dist | Out-Null
$zip = Join-Path $PSScriptRoot "dist\Soulgrind-$Version.zip"
if (Test-Path $zip) { Remove-Item $zip }
$jsRoot = (Resolve-Path js).Path
$files = @('index.html') + (Get-ChildItem js -Recurse -File | ForEach-Object {
  'js/' + $_.FullName.Substring($jsRoot.Length + 1).Replace('\', '/')
})
$stream = [IO.File]::Open($zip, 'Create')
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
foreach ($f in $files) {
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $PSScriptRoot $f), $f) | Out-Null
}
$archive.Dispose()
$stream.Dispose()
Write-Host "Gepackt: $zip ($($files.Count) Dateien)"

git push
if ($NotesFile) {
  gh release create "v$Version" $zip --title "Soulgrind $Version" --notes-file $NotesFile
} else {
  if (-not $Notes) { $Notes = "Soulgrind $Version" }
  gh release create "v$Version" $zip --title "Soulgrind $Version" --notes $Notes
}
