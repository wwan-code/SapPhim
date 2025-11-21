# =============================================================================
# Script Chuyển Đổi Giữa Localhost và Network
# =============================================================================
# Sử dụng: .\switch-mode.ps1 [localhost|network]
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("localhost", "network", "")]
    [string]$Mode = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SAP PHIM - Mode Switch Script       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nếu không có tham số, hỏi người dùng
if ($Mode -eq "") {
    Write-Host "Chọn chế độ:" -ForegroundColor Yellow
    Write-Host "1. Localhost (chỉ máy này)" -ForegroundColor White
    Write-Host "2. Network (truy cập từ nhiều thiết bị)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Nhập lựa chọn (1/2)"
    
    if ($choice -eq "1") {
        $Mode = "localhost"
    } elseif ($choice -eq "2") {
        $Mode = "network"
    } else {
        Write-Host "❌ Lựa chọn không hợp lệ!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Paths
$backendEnvPath = ".\backend\.env"
$frontendEnvPath = ".\frontend\.env"
$backendIndexPath = ".\backend\index.js"

if ($Mode -eq "localhost") {
    Write-Host "🔄 Chuyển sang chế độ LOCALHOST..." -ForegroundColor Yellow
    Write-Host ""
    
    # Backend .env
    Write-Host "📝 Cập nhật backend/.env..." -ForegroundColor Cyan
    (Get-Content $backendEnvPath) -replace "CLIENT_URL=http://\d+\.\d+\.\d+\.\d+:\d+", "CLIENT_URL=http://localhost:5173" | Set-Content $backendEnvPath
    
    # Frontend .env
    Write-Host "📝 Cập nhật frontend/.env..." -ForegroundColor Cyan
    $frontendEnv = Get-Content $frontendEnvPath -Raw
    $frontendEnv = $frontendEnv -replace "# Localhost\s*#\s*VITE_API_BASE_URL=http://localhost:5000/api\s*#\s*VITE_SOCKET_URL=http://localhost:5000\s*#\s*VITE_SERVER_URL=http://localhost:5000\s*# Network \(LAN\)\s*VITE_API_BASE_URL=http://\d+\.\d+\.\d+\.\d+:5000/api\s*VITE_SOCKET_URL=http://\d+\.\d+\.\d+\.\d+:5000\s*VITE_SERVER_URL=http://\d+\.\d+\.\d+\.\d+:5000", @"
# Localhost
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000

# Network (LAN)
# VITE_API_BASE_URL=http://192.168.0.20:5000/api
# VITE_SOCKET_URL=http://192.168.0.20:5000
# VITE_SERVER_URL=http://192.168.0.20:5000
"@
    $frontendEnv | Set-Content $frontendEnvPath
    
    Write-Host ""
    Write-Host "✅ Đã chuyển sang chế độ LOCALHOST!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📡 Truy cập:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
    
} elseif ($Mode -eq "network") {
    Write-Host "🔄 Chuyển sang chế độ NETWORK..." -ForegroundColor Yellow
    Write-Host ""
    
    # Lấy IP hiện tại
    Write-Host "🔍 Đang kiểm tra địa chỉ IP..." -ForegroundColor Cyan
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
    
    if (-not $ipAddress) {
        Write-Host "❌ Không tìm thấy địa chỉ IP!" -ForegroundColor Red
        Write-Host "Vui lòng kiểm tra kết nối mạng." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ IP hiện tại: $ipAddress" -ForegroundColor Green
    Write-Host ""
    
    # Backend .env
    Write-Host "📝 Cập nhật backend/.env..." -ForegroundColor Cyan
    (Get-Content $backendEnvPath) -replace "CLIENT_URL=http://localhost:\d+", "CLIENT_URL=http://${ipAddress}:5173" | Set-Content $backendEnvPath
    
    # Frontend .env
    Write-Host "📝 Cập nhật frontend/.env..." -ForegroundColor Cyan
    $frontendEnv = Get-Content $frontendEnvPath -Raw
    $frontendEnv = $frontendEnv -replace "# Localhost\s*VITE_API_BASE_URL=http://localhost:5000/api\s*VITE_SOCKET_URL=http://localhost:5000\s*VITE_SERVER_URL=http://localhost:5000\s*# Network \(LAN\)\s*#\s*VITE_API_BASE_URL=http://\d+\.\d+\.\d+\.\d+:5000/api\s*#\s*VITE_SOCKET_URL=http://\d+\.\d+\.\d+\.\d+:5000\s*#\s*VITE_SERVER_URL=http://\d+\.\d+\.\d+\.\d+:5000", @"
# Localhost
# VITE_API_BASE_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
# VITE_SERVER_URL=http://localhost:5000

# Network (LAN)
VITE_API_BASE_URL=http://${ipAddress}:5000/api
VITE_SOCKET_URL=http://${ipAddress}:5000
VITE_SERVER_URL=http://${ipAddress}:5000
"@
    $frontendEnv | Set-Content $frontendEnvPath
    
    # Backend index.js
    Write-Host "📝 Cập nhật backend/index.js..." -ForegroundColor Cyan
    (Get-Content $backendIndexPath) -replace "'http://localhost:5173'", "'http://${ipAddress}:5173'" | Set-Content $backendIndexPath
    (Get-Content $backendIndexPath) -replace "http://\d+\.\d+\.\d+\.\d+:5173", "http://${ipAddress}:5173" | Set-Content $backendIndexPath
    (Get-Content $backendIndexPath) -replace "http://\d+\.\d+\.\d+\.\d+:\$\{PORT\}", "http://${ipAddress}:`${PORT}" | Set-Content $backendIndexPath
    
    Write-Host ""
    Write-Host "✅ Đã chuyển sang chế độ NETWORK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📡 Truy cập từ máy này:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "📱 Truy cập từ thiết bị khác (cùng mạng):" -ForegroundColor Cyan
    Write-Host "   Frontend: http://${ipAddress}:5173" -ForegroundColor White
    Write-Host "   Backend:  http://${ipAddress}:5000" -ForegroundColor White
}

Write-Host ""
Write-Host "⚠️  LƯU Ý: Cần RESTART Backend và Frontend để áp dụng!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Nhấn phím bất kỳ để thoát..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
