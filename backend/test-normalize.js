/**
 * Direct Test - Verify normalizeDate function works correctly
 */

import { normalizeDate, normalizeDateTime } from './src/utils/date.js';

console.log('🧪 Testing normalizeDate function:');
console.log('================================\n');

// Test cases
const testCases = [
  { input: '1997-09-27T17:00:00.000Z', expected: '1997-09-27', desc: 'ISO format from datetime-local' },
  { input: '1997-09-27', expected: '1997-09-27', desc: 'Already YYYY-MM-DD' },
  { input: null, expected: null, desc: 'null value' },
  { input: undefined, expected: null, desc: 'undefined value' },
  { input: '', expected: null, desc: 'Empty string' },
  { input: '2025-01-15T00:00:00Z', expected: '2025-01-15', desc: 'Another ISO date' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, desc }) => {
  const result = normalizeDate(input);
  const status = result === expected ? '✅' : '❌';
  if (result === expected) passed++; else failed++;
  console.log(`${status} ${desc}`);
  console.log(`   Input: ${JSON.stringify(input)}`);
  console.log(`   Expected: ${JSON.stringify(expected)}`);
  console.log(`   Got: ${JSON.stringify(result)}`);
  console.log('');
});

console.log('================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

console.log('\n🧪 Testing normalizeDateTime function:');
console.log('================================\n');

const dateTimeCases = [
  { input: '2025-09-27T17:00:00.000Z', expected: '2025-09-27 17:00:00', desc: 'ISO to MySQL DATETIME' },
  { input: '2025-09-27 10:30:00', expected: '2025-09-27 10:30:00', desc: 'Already MySQL DATETIME' },
];

dateTimeCases.forEach(({ input, expected, desc }) => {
  const result = normalizeDateTime(input);
  const status = result === expected ? '✅' : '❌';
  if (result === expected) passed++; else failed++;
  console.log(`${status} ${desc}`);
  console.log(`   Input: ${JSON.stringify(input)}`);
  console.log(`   Expected: ${JSON.stringify(expected)}`);
  console.log(`   Got: ${JSON.stringify(result)}`);
  console.log('');
});

console.log('================================');
console.log(`Total Results: ${passed} passed, ${failed} failed`);
