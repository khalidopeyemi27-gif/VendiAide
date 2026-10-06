import { createInitialDemoState, processDemoMessage } from '../src/lib/demo/demo-engine';

function debug() {
  console.log('--- TEST 130 STEP 1 ---');
  let state = processDemoMessage(createInitialDemoState(), 'What sizes does the Black Velvet Abaya come in?');
  console.log('STEP 1 RESPONSE:', state.responseText);
  console.log('STEP 1 lastIntent:', state.updatedState.lastIntent);
  console.log('STEP 1 pendingProductId:', state.updatedState.pendingProductId);

  console.log('--- TEST 130 STEP 2 ---');
  state = processDemoMessage(state.updatedState, '42');
  console.log('STEP 2 RESPONSE:', state.responseText);
  console.log('STEP 2 lastIntent:', state.updatedState.lastIntent);
  console.log('STEP 2 pendingProductId:', state.updatedState.pendingProductId);
}

debug();
