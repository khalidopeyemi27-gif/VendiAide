import { processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';

export async function runColorInquiryTestSuite() {
  console.log('🧪 Starting VendiAide Color Inquiry & Specificity Test Suite...\n');

  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✅ [Test ${total}] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${total}] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. Single-turn "only black?" on Black Hoodie
  runTest('"only black?" answers that Black Hoodie is only in Black', () => {
    const state = createInitialDemoState();
    const { responseText, intent } = processDemoMessage(state, 'how much is the hoodie and is it only black?');
    if (!responseText.toLowerCase().includes('only available in black') && !responseText.toLowerCase().includes('only in black')) {
      throw new Error(`Expected 'only available in Black', got: ${responseText}`);
    }
    if (intent !== 'COLOR_AVAILABILITY_QUERY' && intent !== 'PRODUCT_INQUIRY') {
      throw new Error(`Expected COLOR_AVAILABILITY_QUERY, got: ${intent}`);
    }
  });

  // 2. Multi-turn follow-up: Turn 1: "how much is the hoodie?", Turn 2: "only black?"
  runTest('Multi-turn: "how much is the hoodie?" -> "only black?"', () => {
    let state = createInitialDemoState();
    const turn1 = processDemoMessage(state, 'how much is the hoodie?');
    state = turn1.updatedState;
    const turn2 = processDemoMessage(state, 'only black?');
    if (!turn2.responseText.toLowerCase().includes('only available in black') && !turn2.responseText.toLowerCase().includes('only in black')) {
      throw new Error(`Expected 'only available in Black', got: ${turn2.responseText}`);
    }
  });

  // 3. Multi-turn follow-up: Turn 1: "how much is the hoodie?", Turn 2: "is there any other color?"
  runTest('Multi-turn: "how much is the hoodie?" -> "is there any other color?"', () => {
    let state = createInitialDemoState();
    const turn1 = processDemoMessage(state, 'how much is the hoodie?');
    state = turn1.updatedState;
    const turn2 = processDemoMessage(state, 'is there any other color?');
    if (!turn2.responseText.toLowerCase().includes("don't have other colors") && !turn2.responseText.toLowerCase().includes('only available in black')) {
      throw new Error(`Expected 'don't have other colors' / 'only available in Black', got: ${turn2.responseText}`);
    }
  });

  // 4. "any other color?" on active item
  runTest('Single turn: "is there any other color for the hoodie?"', () => {
    const state = createInitialDemoState();
    const { responseText } = processDemoMessage(state, 'is there any other color for the hoodie?');
    if (!responseText.toLowerCase().includes("don't have other colors") && !responseText.toLowerCase().includes('only available in black')) {
      throw new Error(`Expected 'don't have other colors', got: ${responseText}`);
    }
  });

  // 5. Pidgin: "na only black?"
  runTest('Pidgin: "how much be hoodie, na only black?"', () => {
    const state = createInitialDemoState();
    const { responseText } = processDemoMessage(state, 'how much be hoodie, na only black?');
    if (!responseText.toLowerCase().includes('only') || !responseText.toLowerCase().includes('black')) {
      throw new Error(`Expected Pidgin single color answer, got: ${responseText}`);
    }
  });

  // 6. Test product with multiple colors
  runTest('Multi-color product answers with remaining color options', () => {
    const customCatalog = [
      {
        id: 'prod_multi',
        name: 'Classic Silk Shirt',
        price_ngn: 20000,
        sizes: ['M', 'L'],
        colors: ['Black', 'White', 'Navy'],
        in_stock: true,
        category: 'Shirts',
      },
    ];
    const state = createInitialDemoState();
    state.pendingProductId = 'prod_multi';
    const turn = processDemoMessage(state, 'is there any other color?', customCatalog);
    if (!turn.responseText.toLowerCase().includes('white') || !turn.responseText.toLowerCase().includes('navy')) {
      throw new Error(`Expected White and Navy in response, got: ${turn.responseText}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} COLOR INQUIRY & SPECIFICITY TESTS PASSED 100% CLEANLY!\n`);
}

runColorInquiryTestSuite().catch((err) => {
  console.error('❌ Color Inquiry Test Suite Failed:', err);
  process.exit(1);
});
