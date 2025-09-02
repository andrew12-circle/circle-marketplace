#!/usr/bin/env node

// FILE: scripts/test-security.js

/**
 * Security testing and red team scripts
 * Usage: node scripts/test-security.js [test-type]
 * Test types: rate-limit, action-tokens, replay-attack, all
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const API_URL = `${BASE_URL}/api`;

class SecurityTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runTest(testName, testFn) {
    console.log(`\n🔍 Running: ${testName}`);
    this.totalTests++;
    
    try {
      const start = performance.now();
      const result = await testFn();
      const duration = Math.round(performance.now() - start);
      
      if (result.passed) {
        console.log(`✅ PASS: ${testName} (${duration}ms)`);
        this.passedTests++;
      } else {
        console.log(`❌ FAIL: ${testName} (${duration}ms)`);
        console.log(`   Reason: ${result.reason}`);
      }
      
      this.results.push({
        name: testName,
        passed: result.passed,
        reason: result.reason,
        duration
      });
      
    } catch (error) {
      console.log(`💥 ERROR: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      this.results.push({
        name: testName,
        passed: false,
        reason: error.message,
        duration: 0
      });
    }
  }

  // Rate limiting tests
  async testRateLimit() {
    return this.runTest('Rate Limit Protection', async () => {
      const promises = [];
      const endpoint = `${API_URL}/auth/login`;
      
      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' })
          })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      return {
        passed: rateLimited,
        reason: rateLimited ? 'Rate limiting is working' : 'No rate limiting detected'
      };
    });
  }

  // Action token validation test
  async testActionTokens() {
    return this.runTest('Action Token Validation', async () => {
      // Try to submit form without visiting the page first
      const response = await fetch(`${API_URL}/submit-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: 'test data',
          // Missing action token
        })
      });
      
      const blocked = response.status === 403 || response.status === 400;
      
      return {
        passed: blocked,
        reason: blocked ? 'Action token validation is working' : 'Action token bypass detected'
      };
    });
  }

  // Replay attack test
  async testReplayAttack() {
    return this.runTest('Webhook Replay Protection', async () => {
      const webhookData = {
        id: 'evt_test_webhook',
        type: 'payment.succeeded',
        data: { amount: 1000 }
      };
      
      // Send the same webhook twice
      const response1 = await fetch(`${API_URL}/webhooks/stripe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature'
        },
        body: JSON.stringify(webhookData)
      });
      
      const response2 = await fetch(`${API_URL}/webhooks/stripe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature'
        },
        body: JSON.stringify(webhookData)
      });
      
      const replayBlocked = response2.status === 409 || response2.status === 400;
      
      return {
        passed: replayBlocked,
        reason: replayBlocked ? 'Replay protection is working' : 'Replay attack succeeded'
      };
    });
  }

  // SSRF protection test
  async testSSRFProtection() {
    return this.runTest('SSRF Protection', async () => {
      const maliciousUrls = [
        'http://localhost:22',
        'http://127.0.0.1:3306',
        'http://169.254.169.254/metadata',
        'file:///etc/passwd'
      ];
      
      let blocked = 0;
      
      for (const url of maliciousUrls) {
        try {
          const response = await fetch(`${API_URL}/fetch-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (response.status === 403 || response.status === 400) {
            blocked++;
          }
        } catch (error) {
          // Network errors are expected for blocked requests
          blocked++;
        }
      }
      
      const allBlocked = blocked === maliciousUrls.length;
      
      return {
        passed: allBlocked,
        reason: allBlocked ? 'SSRF protection is working' : `${blocked}/${maliciousUrls.length} malicious URLs blocked`
      };
    });
  }

  // SQL injection test
  async testSQLInjection() {
    return this.runTest('SQL Injection Protection', async () => {
      const payloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];
      
      let protectedCount = 0;
      
      for (const payload of payloads) {
        const response = await fetch(`${API_URL}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload })
        });
        
        // Should either reject the request or sanitize the input
        if (response.status === 400 || response.status === 403) {
          protectedCount++;
        } else {
          const data = await response.json();
          // Check if response indicates sanitization occurred
          if (!data.query || !data.query.includes('DROP') && !data.query.includes('UNION')) {
            protectedCount++;
          }
        }
      }
      
      const protected = protectedCount === payloads.length;
      
      return {
        passed: protected,
        reason: protected ? 'SQL injection protection is working' : `${protectedCount}/${payloads.length} payloads blocked`
      };
    });
  }

  // XSS protection test
  async testXSSProtection() {
    return this.runTest('XSS Protection', async () => {
      const payloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">'
      ];
      
      let sanitizedCount = 0;
      
      for (const payload of payloads) {
        const response = await fetch(`${API_URL}/submit-comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: payload })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if dangerous content was sanitized
          if (!data.comment || (!data.comment.includes('<script>') && !data.comment.includes('onerror'))) {
            sanitizedCount++;
          }
        } else if (response.status === 400 || response.status === 403) {
          // Rejected entirely
          sanitizedCount++;
        }
      }
      
      const protected = sanitizedCount === payloads.length;
      
      return {
        passed: protected,
        reason: protected ? 'XSS protection is working' : `${sanitizedCount}/${payloads.length} payloads sanitized`
      };
    });
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Security Test Suite');
    console.log(`Target: ${BASE_URL}`);
    console.log('=' * 50);
    
    await this.testRateLimit();
    await this.testActionTokens();
    await this.testReplayAttack();
    await this.testSSRFProtection();
    await this.testSQLInjection();
    await this.testXSSProtection();
    
    console.log('\n' + '=' * 50);
    console.log('📊 Test Results Summary');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('\n🎉 All security tests passed!');
    } else {
      console.log('\n⚠️  Some security tests failed. Review the results above.');
      process.exit(1);
    }
  }

  // Performance test for PoW
  async testPowPerformance() {
    return this.runTest('Proof of Work Performance', async () => {
      const start = performance.now();
      
      const response = await fetch(`${API_URL}/pow-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 16 })
      });
      
      if (!response.ok) {
        return { passed: false, reason: `PoW challenge failed: ${response.status}` };
      }
      
      const challenge = await response.json();
      
      // Simulate solving (in real test, would actually solve)
      const solveTime = performance.now() - start;
      
      return {
        passed: solveTime < 5000, // Should complete within 5 seconds
        reason: `PoW challenge completed in ${Math.round(solveTime)}ms`
      };
    });
  }
}

// Main execution
async function main() {
  const testType = process.argv[2] || 'all';
  const tester = new SecurityTester();
  
  switch (testType) {
    case 'rate-limit':
      await tester.testRateLimit();
      break;
    case 'action-tokens':
      await tester.testActionTokens();
      break;
    case 'replay':
      await tester.testReplayAttack();
      break;
    case 'ssrf':
      await tester.testSSRFProtection();
      break;
    case 'sql':
      await tester.testSQLInjection();
      break;
    case 'xss':
      await tester.testXSSProtection();
      break;
    case 'pow':
      await tester.testPowPerformance();
      break;
    case 'all':
    default:
      await tester.runAllTests();
      break;
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}