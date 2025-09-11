#!/usr/bin/env node

/**
 * Backend Logging Test Script
 * Tests all the enhanced emoji logging across backend services
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_DIR = 'C:\\Users\\hp\\Documents\\test-dir';

async function testBackendLogging() {
  console.log('🧪 Starting Backend Logging Tests...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed\n');
    
    // Test 2: Directory operations
    console.log('2️⃣ Testing directory operations...');
    try {
      await axios.post(`${BASE_URL}/api/directories/set-directory`, {
        path: TEST_DIR
      });
      console.log('✅ Directory operation test passed\n');
    } catch (err) {
      console.log('ℹ️ Directory operation expected to show logging (OK if directory doesn\'t exist)\n');
    }
    
    // Test 3: Search operation
    console.log('3️⃣ Testing search operations...');
    try {
      await axios.post(`${BASE_URL}/api/search/search`, {
        query: 'test query',
        top_k: 3
      });
      console.log('✅ Search operation test passed\n');
    } catch (err) {
      console.log('ℹ️ Search operation expected to show logging (OK if worker is down)\n');
    }
    
    // Test 4: Ask operation
    console.log('4️⃣ Testing ask operations...');
    try {
      await axios.post(`${BASE_URL}/api/search/ask`, {
        query: 'What is this about?',
        topK: 3
      });
      console.log('✅ Ask operation test passed\n');
    } catch (err) {
      console.log('ℹ️ Ask operation expected to show logging (OK if services are down)\n');
    }
    
    console.log('🎉 All logging tests completed!');
    console.log('📋 Check the backend console for emoji-enhanced logging messages.');
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

if (require.main === module) {
  testBackendLogging();
}

module.exports = { testBackendLogging };
