import { createInitialDemoState, processDemoMessage } from '../src/lib/demo/demo-engine';

function debug() {
  let state = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  console.log('Turn 1 pendingProductId:', state.updatedState.pendingProductId);
  console.log('Turn 1 pendingPurchaseIntent:', state.updatedState.pendingPurchaseIntent);

  state = processDemoMessage(state.updatedState, 'how much is delivery to Ikeja?');
  console.log('Turn 2 response:', state.responseText);
  console.log('Turn 2 pendingProductId:', state.updatedState.pendingProductId);
  console.log('Turn 2 pendingPurchaseIntent:', state.updatedState.pendingPurchaseIntent);
  console.log('Turn 2 pendingLocation:', state.updatedState.pendingLocation);

  state = processDemoMessage(state.updatedState, 'L');
  console.log('Turn 3 response:', state.responseText);
  console.log('Turn 3 orders length:', state.updatedState.orders.length);
}

debug();
