# =============================================================================
# Script Test Ket Noi Network
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SAP PHIM - Network Test Script      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Test 1: Check IP
Write-Host "Test 1: Check IP Address" -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "   OK - Current IP: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "   FAIL - No IP found!" -ForegroundColor Red
    $allPassed = $false
}
Write-Host ""

# Test 2: Check Backend Port
Write-Host "Test 2: Check Backend (Port 5000)" -ForegroundColor Yellow
$backendProcess = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if ($backendProcess) {
    Write-Host "   OK - Backend running on port 5000" -ForegroundColor Green
    
    # Test health endpoint
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "   OK - Health endpoint working" -ForegroundColor Green
        }
    } catch {
        Write-Host "   WARN - Backend running but health endpoint not responding" -ForegroundColor Yellow
    }
} else {
    Write-Host "   FAIL - Backend not running on port 5000" -ForegroundColor Red
    Write-Host "      Run: cd backend; npm run dev" -ForegroundColor Gray
    $allPassed = $false
}
Write-Host ""

# Test 3: Check Frontend Port
Write-Host "Test 3: Check Frontend (Port 5173)" -ForegroundColor Yellow
$frontendProcess = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($frontendProcess) {
    Write-Host "   OK - Frontend running on port 5173" -ForegroundColor Green
} else {
    Write-Host "   FAIL - Frontend not running on port 5173" -ForegroundColor Red
    Write-Host "      Run: cd frontend; npm run dev" -ForegroundColor Gray
    $allPassed = $false
}
Write-Host ""

# Test 4: Check .env files
Write-Host "Test 4: Check .env configuration" -ForegroundColor Yellow

$backendEnvPath = ".\backend\.env"
$frontendEnvPath = ".\frontend\.env"

if (Test-Path $backendEnvPath) {
    $backendEnv = Get-Content $backendEnvPath -Raw
    
    if ($backendEnv -match "CLIENT_URL=(.+)") {
        $clientUrl = $matches[1]
        Write-Host "   OK - Backend CLIENT_URL: $clientUrl" -ForegroundColor Green
    } else {
        Write-Host "   WARN - CLIENT_URL not found in backend/.env" -ForegroundColor Yellow
    }
    
    if ($backendEnv -match "DB_HOST=(.+)") {
        Write-Host "   OK - Database configured" -ForegroundColor Green
    } else {
        Write-Host "   WARN - Database not configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "   FAIL - backend/.env not found" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path $frontendEnvPath) {
    $frontendEnv = Get-Content $frontendEnvPath -Raw
    
    if ($frontendEnv -match "VITE_API_BASE_URL=(.+)") {
        $apiUrl = $matches[1]
        Write-Host "   OK - Frontend API URL: $apiUrl" -ForegroundColor Green
    } else {
        Write-Host "   WARN - VITE_API_BASE_URL not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "   FAIL - frontend/.env not found" -ForegroundColor Red
    $allPassed = $false
}
Write-Host ""

# Test 5: Check Firewall
Write-Host "Test 5: Check Windows Firewall" -ForegroundColor Yellow

$backendRule = Get-NetFirewallRule -DisplayName "*Backend*Sap*Phim*" -ErrorAction SilentlyContinue
$frontendRule = Get-NetFirewallRule -DisplayName "*Frontend*Sap*Phim*" -ErrorAction SilentlyContinue

if ($backendRule) {
    Write-Host "   OK - Firewall rule for Backend exists" -ForegroundColor Green
} else {
    Write-Host "   WARN - No firewall rule for Backend (port 5000)" -ForegroundColor Yellow
    Write-Host "      Run (as Admin): New-NetFirewallRule -DisplayName 'Backend Sap Phim' -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow" -ForegroundColor Gray
}

if ($frontendRule) {
    Write-Host "   OK - Firewall rule for Frontend exists" -ForegroundColor Green
} else {
    Write-Host "   WARN - No firewall rule for Frontend (port 5173)" -ForegroundColor Yellow
    Write-Host "      Run (as Admin): New-NetFirewallRule -DisplayName 'Frontend Sap Phim' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow" -ForegroundColor Gray
}
Write-Host ""

# Test 6: Test network connection
if ($ipAddress -and $backendProcess) {
    Write-Host "Test 6: Test connection via Network IP" -ForegroundColor Yellow
    
    try {
        $networkResponse = Invoke-WebRequest -Uri "http://${ipAddress}:5000/health" -UseBasicParsing -TimeoutSec 5
        if ($networkResponse.StatusCode -eq 200) {
            Write-Host "   OK - Backend accessible via network IP" -ForegroundColor Green
        }
    } catch {
        Write-Host "   FAIL - Cannot access Backend via network IP" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "      Check firewall or network settings" -ForegroundColor Gray
        $allPassed = $false
    }
    Write-Host ""
}

# Test 7: Check Database
Write-Host "Test 7: Check MySQL Database" -ForegroundColor Yellow
$mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

if ($mysqlProcess) {
    Write-Host "   OK - MySQL is running" -ForegroundColor Green
} else {
    Write-Host "   WARN - MySQL not running" -ForegroundColor Yellow
    Write-Host "      Start MySQL via XAMPP Control Panel" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS                        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Cyan
    Write-Host "   Localhost:" -ForegroundColor White
    Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   - Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "   Network (from other devices):" -ForegroundColor White
    Write-Host "   - Frontend: http://${ipAddress}:5173" -ForegroundColor White
    Write-Host "   - Backend:  http://${ipAddress}:5000" -ForegroundColor White
} else {
    Write-Host "SOME TESTS FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Review errors above and fix them." -ForegroundColor Yellow
    Write-Host "See: NETWORK_SETUP.md or DEPLOYMENT_CHECKLIST.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
