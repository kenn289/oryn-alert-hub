# Master Dashboard Comprehensive Test
Write-Host "🚀 Starting Master Dashboard Comprehensive Test" -ForegroundColor Green
Write-Host ""

try {
    # Test 1: Master Users API
    Write-Host "📊 Testing Master Users API..." -ForegroundColor Yellow
    $usersResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/master/users" -Method GET -ErrorAction SilentlyContinue
    
    if ($usersResponse.StatusCode -eq 200) {
        $usersData = $usersResponse.Content | ConvertFrom-Json
        Write-Host "✅ Users API: Found $($usersData.Count) users" -ForegroundColor Green
        foreach ($user in $usersData) {
            Write-Host "   - $($user.email) ($($user.plan))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Users API failed: $($usersResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Test 2: Master Tickets API
    Write-Host "`n🎫 Testing Master Tickets API..." -ForegroundColor Yellow
    $ticketsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/master/tickets" -Method GET -ErrorAction SilentlyContinue
    
    if ($ticketsResponse.StatusCode -eq 200) {
        $ticketsData = $ticketsResponse.Content | ConvertFrom-Json
        Write-Host "✅ Tickets API: Found $($ticketsData.Count) tickets" -ForegroundColor Green
        foreach ($ticket in $ticketsData) {
            Write-Host "   - $($ticket.subject) ($($ticket.status))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Tickets API failed: $($ticketsResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Test 3: Health Check
    Write-Host "`n🏥 Testing Health Check..." -ForegroundColor Yellow
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -ErrorAction SilentlyContinue
    
    if ($healthResponse.StatusCode -eq 200) {
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "✅ Health Check: $($healthData.status)" -ForegroundColor Green
    } else {
        Write-Host "❌ Health Check failed: $($healthResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Test 4: Master Dashboard Page
    Write-Host "`n🎨 Testing Master Dashboard Page..." -ForegroundColor Yellow
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3000/master-dashboard" -Method GET -ErrorAction SilentlyContinue
    
    if ($dashboardResponse.StatusCode -eq 200) {
        Write-Host "✅ Master Dashboard page loads successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Master Dashboard page failed: $($dashboardResponse.StatusCode)" -ForegroundColor Red
    }
    
    Write-Host "`n🎉 Master Dashboard Test Complete!" -ForegroundColor Green
    Write-Host "`n📋 Summary:" -ForegroundColor Yellow
    Write-Host "   - Users API: $(if ($usersResponse.StatusCode -eq 200) { '✅' } else { '❌' })" -ForegroundColor White
    Write-Host "   - Tickets API: $(if ($ticketsResponse.StatusCode -eq 200) { '✅' } else { '❌' })" -ForegroundColor White
    Write-Host "   - Health Check: $(if ($healthResponse.StatusCode -eq 200) { '✅' } else { '❌' })" -ForegroundColor White
    Write-Host "   - Dashboard Page: $(if ($dashboardResponse.StatusCode -eq 200) { '✅' } else { '❌' })" -ForegroundColor White
    
} catch {
    Write-Host "❌ Test failed with error: $($_.Exception.Message)" -ForegroundColor Red
}
