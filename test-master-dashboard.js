#!/usr/bin/env node

/**
 * Comprehensive Master Dashboard Test
 * Tests the entire master dashboard functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testMasterDashboard() {
  console.log('🚀 Starting Master Dashboard Comprehensive Test\n');
  
  try {
    // Test 1: Master Users API
    console.log('📊 Testing Master Users API...');
    const usersResponse = await fetch(`${BASE_URL}/api/master/users`);
    const usersData = await usersResponse.json();
    
    if (usersResponse.ok) {
      console.log(`✅ Users API: Found ${usersData.length} users`);
      usersData.forEach(user => {
        console.log(`   - ${user.email} (${user.plan})`);
      });
    } else {
      console.log(`❌ Users API failed: ${usersData.error}`);
    }
    
    // Test 2: Master Tickets API
    console.log('\n🎫 Testing Master Tickets API...');
    const ticketsResponse = await fetch(`${BASE_URL}/api/master/tickets`);
    const ticketsData = await ticketsResponse.json();
    
    if (ticketsResponse.ok) {
      console.log(`✅ Tickets API: Found ${ticketsData.length} tickets`);
      ticketsData.forEach(ticket => {
        console.log(`   - ${ticket.subject} (${ticket.status})`);
      });
    } else {
      console.log(`❌ Tickets API failed: ${ticketsData.error}`);
    }
    
    // Test 3: Master Notifications API
    console.log('\n📢 Testing Master Notifications API...');
    const notificationData = {
      title: 'Test Notification',
      message: 'This is a test notification from the master dashboard',
      type: 'info'
    };
    
    const notificationResponse = await fetch(`${BASE_URL}/api/master/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });
    
    if (notificationResponse.ok) {
      const notificationResult = await notificationResponse.json();
      console.log(`✅ Notifications API: ${notificationResult.message}`);
    } else {
      const errorData = await notificationResponse.json();
      console.log(`❌ Notifications API failed: ${errorData.error}`);
    }
    
    // Test 4: Health Check
    console.log('\n🏥 Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log(`✅ Health Check: ${healthData.status}`);
    } else {
      console.log(`❌ Health Check failed`);
    }
    
    // Test 5: Master Dashboard Page
    console.log('\n🎨 Testing Master Dashboard Page...');
    const dashboardResponse = await fetch(`${BASE_URL}/master-dashboard`);
    
    if (dashboardResponse.ok) {
      console.log('✅ Master Dashboard page loads successfully');
    } else {
      console.log(`❌ Master Dashboard page failed: ${dashboardResponse.status}`);
    }
    
    console.log('\n🎉 Master Dashboard Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Users API: ${usersResponse.ok ? '✅' : '❌'}`);
    console.log(`   - Tickets API: ${ticketsResponse.ok ? '✅' : '❌'}`);
    console.log(`   - Notifications API: ${notificationResponse.ok ? '✅' : '❌'}`);
    console.log(`   - Health Check: ${healthResponse.ok ? '✅' : '❌'}`);
    console.log(`   - Dashboard Page: ${dashboardResponse.ok ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testMasterDashboard();


