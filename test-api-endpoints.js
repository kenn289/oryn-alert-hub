// Test API endpoints
const testEndpoints = async () => {
  console.log('🧪 Testing API Endpoints...\n')
  
  const endpoints = [
    { name: 'Health', url: 'http://localhost:3000/api/health' },
    { name: 'Support Stats', url: 'http://localhost:3000/api/support/stats' },
    { name: 'Support Tickets', url: 'http://localhost:3000/api/support/tickets?userId=test' },
    { name: 'Admin Tickets', url: 'http://localhost:3000/api/admin/tickets' },
    { name: 'Admin Users', url: 'http://localhost:3000/api/admin/users' },
    { name: 'Admin Notifications', url: 'http://localhost:3000/api/admin/notifications' }
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`)
      const response = await fetch(endpoint.url)
      console.log(`  Status: ${response.status} ${response.ok ? '✅' : '❌'}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`  Error: ${errorText.substring(0, 100)}...`)
      } else {
        const data = await response.json()
        console.log(`  Data: ${JSON.stringify(data).substring(0, 50)}...`)
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`)
    }
    console.log('')
  }
}

testEndpoints()


