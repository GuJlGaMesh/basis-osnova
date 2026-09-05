# Запускать через dot-source: `. .\.tl-ai-kit\load-secrets.ps1`
# (без точки переменные останутся в child-scope и в текущей сессии не появятся).

$SecretsFile = Join-Path $PSScriptRoot 'secrets.local.env'
if (-not (Test-Path $SecretsFile)) {
    Write-Error "[tl-ai-kit] secrets.local.env not found: $SecretsFile"
    return
}

$TlakLoaded = [System.Collections.Generic.List[string]]::new()
Get-Content -LiteralPath $SecretsFile | ForEach-Object {
    $raw = $_
    $trimmed = $raw.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) { return }
    $eq = $raw.IndexOf('=')
    if ($eq -lt 1) { return }
    $key = $raw.Substring(0, $eq).Trim()
    $value = $raw.Substring($eq + 1)
    if ($key -match '^[A-Z_][A-Z0-9_]*$') {
        Set-Item -Path ("Env:{0}" -f $key) -Value $value
        $TlakLoaded.Add($key) | Out-Null
    } else {
        Write-Warning "[tl-ai-kit] Skipped '$key' from secrets.local.env: name does not match ^[A-Z_][A-Z0-9_]*$ (env-loader accepts only UPPER_SNAKE_CASE)."
    }
}
Write-Host ("[tl-ai-kit] Секреты загружены: {0} переменных из .tl-ai-kit\secrets.local.env" -f $TlakLoaded.Count) -ForegroundColor Green
Write-Host "[tl-ai-kit] Можно запускать агента в этом же окне: claude / codex / opencode" -ForegroundColor Green
Remove-Variable SecretsFile, TlakLoaded -ErrorAction SilentlyContinue
