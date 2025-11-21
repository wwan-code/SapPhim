# =============================================================================
# Script Khởi Động Dự Án Trên Network (LAN)
# =============================================================================
# Tác giả: GitHub Copilot
# Mô tả: Script tự động khởi động Backend và Frontend với cấu hình Network
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SAP PHIM - Network Startup Script   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lấy IP hiện tại
Write-Host "🔍 Đang kiểm tra địa chỉ IP..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    Write-Host "❌ Không tìm thấy địa chỉ IP!" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra kết nối mạng." -ForegroundColor Red
    exit 1
}

Write-Host "✅ IP hiện tại: $ipAddress" -ForegroundColor Green
Write-Host ""

# Kiểm tra xem IP có thay đổi không
$backendEnvPath = ".\backend\.env"
$frontendEnvPath = ".\frontend\.env"
$backendIndexPath = ".\backend\index.js"

$currentBackendIP = Select-String -Path $backendEnvPath -Pattern "CLIENT_URL=http://(\d+\.\d+\.\d+\.\d+):" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($currentBackendIP -and $currentBackendIP -ne $ipAddress) {
    Write-Host "⚠️  IP đã thay đổi từ $currentBackendIP sang $ipAddress" -ForegroundColor Yellow
    Write-Host "📝 Đang cập nhật cấu hình..." -ForegroundColor Yellow
    
    # Cập nhật backend/.env
    (Get-Content $backendEnvPath) -replace "CLIENT_URL=http://\d+\.\d+\.\d+\.\d+:", "CLIENT_URL=http://${ipAddress}:" | Set-Content $backendEnvPath
    
    # Cập nhật frontend/.env
    (Get-Content $frontendEnvPath) -replace "http://\d+\.\d+\.\d+\.\d+:", "http://${ipAddress}:" | Set-Content $frontendEnvPath
    
    # Cập nhật backend/index.js
    (Get-Content $backendIndexPath) -replace "http://\d+\.\d+\.\d+\.\d+:5173", "http://${ipAddress}:5173" | Set-Content $backendIndexPath
    (Get-Content $backendIndexPath) -replace "http://\d+\.\d+\.\d+\.\d+:\$\{PORT\}", "http://${ipAddress}:`${PORT}" | Set-Content $backendIndexPath
    
    Write-Host "✅ Cấu hình đã được cập nhật!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Khởi động Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "🚀 Khởi động Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ Dự án đã được khởi động!          " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Truy cập từ máy này:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "📱 Truy cập từ thiết bị khác (cùng mạng):" -ForegroundColor Cyan
Write-Host "   Frontend: http://${ipAddress}:5173" -ForegroundColor White
Write-Host "   Backend:  http://${ipAddress}:5000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Để dừng server, đóng các cửa sổ PowerShell đã mở." -ForegroundColor Yellow
Write-Host ""

# Mở trình duyệt
Write-Host "🌐 Đang mở trình duyệt..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Nhấn phím bất kỳ để thoát script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
