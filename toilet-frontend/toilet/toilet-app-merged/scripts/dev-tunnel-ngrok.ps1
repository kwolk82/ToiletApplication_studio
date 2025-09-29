param(
  [int]$Port = 3000
)

function Require-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Error "$name not found. Please install it."
    exit 1
  }
}

Require-Cmd ngrok
Require-Cmd curl
Require-Cmd powershell

# Start ngrok if API not available
try {
  $null = Invoke-RestMethod http://localhost:4040/api/tunnels -ErrorAction Stop
} catch {
  Write-Host "Starting ngrok on port $Port..."
  Start-Process -FilePath ngrok -ArgumentList "http $Port" -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

# Fetch https public URL
$tunnels = Invoke-RestMethod http://localhost:4040/api/tunnels
$public = ($tunnels.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1).public_url

if (-not $public) {
  Write-Error "Could not resolve ngrok https public URL."
  exit 1
}

Write-Host "Tunnel URL: $public"

# Write .env
"API_BASE_URL=$public" | Out-File -FilePath .env -Encoding utf8
"KAKAO_JAVASCRIPT_KEY=$env:KAKAO_JAVASCRIPT_KEY" | Out-File -FilePath .env -Append -Encoding utf8

# Start Expo
$env:API_BASE_URL = $public
npx expo start --tunnel
