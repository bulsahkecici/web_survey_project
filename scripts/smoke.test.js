/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop, no-continue */
/**
 * Smoke Test - Basic health checks
 * Usage: node scripts/smoke.test.js
 * Exit code: 0 if all pass, 1 if any fail
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function smokeTest() {
  console.log('🔍 Running smoke tests...\n');

  const tests = [
    {
      name: 'Healthz (Liveness)',
      url: `${BASE_URL}/healthz`,
      expectedStatus: 200,
      expectedBody: { ok: true },
    },
    {
      name: 'Readyz (Readiness + DB)',
      url: `${BASE_URL}/readyz`,
      expectedStatus: 200,
      expectedBody: { ok: true },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const res = await fetch(test.url);
      const data = await res.json();

      // Check status
      if (res.status !== test.expectedStatus) {
        console.log(`❌ ${test.name}`);
        console.log(
          `   Expected status: ${test.expectedStatus}, got: ${res.status}`,
        );
        failed += 1;
        continue;
      }

      // Check body
      if (test.expectedBody && data.ok !== test.expectedBody.ok) {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected ok: ${test.expectedBody.ok}, got: ${data.ok}`);
        failed += 1;
        continue;
      }

      console.log(`✅ ${test.name}`);
      console.log(`   Status: ${res.status}, Response: ${JSON.stringify(data)}`);
      passed += 1;
    } catch (err) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\n${  '='.repeat(50)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n❌ SMOKE TESTS FAILED');
    process.exit(1);
  }

  console.log('\n✅ SMOKE OK');
  process.exit(0);
}

smokeTest();

