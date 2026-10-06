import { createInitialDemoState, processDemoMessage } from './src/lib/demo/demo-engine';

let s = createInitialDemoState();
let r: ReturnType<typeof processDemoMessage>;

r = processDemoMessage(s, 'howfar boss, wetin una get?');
console.log('Turn 1 pendingProductId:', r.updatedState.pendingProductId);
console.log('Turn 1 lastProductListIds:', r.updatedState.lastProductListIds);
console.log('Turn 1 response:', r.responseText.substring(0, 150));
s = r.updatedState;

r = processDemoMessage(s, 'how much is the black hoodie?');
console.log('\nTurn 2 pendingProductId:', r.updatedState.pendingProductId);
console.log('Turn 2 response:', r.responseText.substring(0, 150));
s = r.updatedState;

r = processDemoMessage(s, 'give me size L');
console.log('\nTurn 3 pendingSize:', r.updatedState.pendingSize);
console.log('Turn 3 response:', r.responseText.substring(0, 150));
s = r.updatedState;

r = processDemoMessage(s, 'send am go Ikeja');
console.log('\nTurn 4 pendingLocation:', r.updatedState.pendingLocation);
console.log('Turn 4 orders:', r.updatedState.orders?.length);
console.log('Turn 4 response:', r.responseText.substring(0, 250));
