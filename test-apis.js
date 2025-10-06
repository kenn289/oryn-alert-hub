// Simple API test
console.log('Testing APIs...')

const testAPI = async (name, url) => {
  try {
    const response = await fetch(url)
    console.log(`${name}: ${response.status} ${response.ok ? '✅' : '❌'}`)
    if (!response.ok) {
      const error = await response.text()
      console.log(`  Error: ${error.substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`${name}: Error - ${error.message}`)
  }
}

const runTests = async () => {
  await testAPI('Health', 'http://localhost:3000/api/health')
  await testAPI('Support Stats', 'http://localhost:3000/api/support/stats')
  await testAPI('Support Tickets', 'http://localhost:3000/api/support/tickets?userId=test')
  console.log('Done!')
}

runTests()


