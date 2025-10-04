// Quick API test
const testAPI = async () => {
  try {
    console.log('Testing API endpoints...')
    
    // Test support stats
    const response = await fetch('http://localhost:3000/api/support/stats')
    console.log('Stats API:', response.status, response.ok ? '✅' : '❌')
    
    if (response.ok) {
      const data = await response.json()
      console.log('Stats data:', data)
    } else {
      const error = await response.text()
      console.log('Error:', error)
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testAPI()
