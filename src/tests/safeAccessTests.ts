/**
 * Test file for safe variable access functionality
 * This helps verify that the lexical declaration error fixes are working
 */

import { safeVariableAccess, createSafeGetter, ensureInitialization } from '../lib/safeVariableAccess';

// Test module-level variables that could cause temporal dead zone issues
let testVariable: number;
const testConstant = 42;

// This should be safe due to our safe access wrapper
const safeTestGetter = createSafeGetter(
  'testVariable',
  () => testVariable,
  0
);

// Test the safe access functions
export function runSafeAccessTests(): boolean {
  console.log('🧪 TESTING: Running safe variable access tests...');
  
  try {
    // Test 1: Safe access to undefined variable
    const result1 = safeVariableAccess(
      () => testVariable,
      -1,
      'test undefined variable'
    );
    
    if (result1 === -1) {
      console.log('✅ TEST 1: Safe access to undefined variable passed');
    } else {
      console.error('❌ TEST 1: Safe access test failed, expected -1, got:', result1);
      return false;
    }
    
    // Test 2: Initialize variable and test again
    testVariable = 100;
    const result2 = safeTestGetter();
    
    if (result2 === 100) {
      console.log('✅ TEST 2: Safe getter for initialized variable passed');
    } else {
      console.error('❌ TEST 2: Safe getter test failed, expected 100, got:', result2);
      return false;
    }
    
    // Test 3: Access to properly initialized constant
    const result3 = safeVariableAccess(
      () => testConstant,
      -1,
      'test constant'
    );
    
    if (result3 === 42) {
      console.log('✅ TEST 3: Safe access to constant passed');
    } else {
      console.error('❌ TEST 3: Constant access test failed, expected 42, got:', result3);
      return false;
    }
    
    console.log('✅ TESTING: All safe variable access tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ TESTING: Safe variable access tests failed with error:', error);
    return false;
  }
}

// Test initialization delay
export async function testInitializationDelay(): Promise<boolean> {
  console.log('🧪 TESTING: Testing initialization delay...');
  
  const startTime = Date.now();
  await ensureInitialization(10);
  const endTime = Date.now();
  
  const elapsed = endTime - startTime;
  if (elapsed >= 10) {
    console.log(`✅ TESTING: Initialization delay test passed (${elapsed}ms)`);
    return true;
  } else {
    console.error(`❌ TESTING: Initialization delay test failed (${elapsed}ms < 10ms)`);
    return false;
  }
}

// Simulate a lexical declaration error scenario
export function simulateLexicalError(): void {
  console.log('🧪 TESTING: Simulating lexical declaration error scenario...');
  
  // This simulates what could happen in minified code
  try {
    // Simulate accessing a variable before initialization
    safeVariableAccess(
      () => {
        // This would normally throw "Cannot access 'le' before initialization"
        throw new ReferenceError("Cannot access 'le' before initialization");
      },
      'fallback-value',
      'simulated lexical error'
    );
    
    console.log('✅ TESTING: Lexical error simulation handled gracefully');
  } catch (error) {
    console.error('❌ TESTING: Lexical error simulation failed:', error);
  }
}