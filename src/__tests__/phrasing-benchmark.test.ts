import { processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';

export async function runPhrasingBenchmarkTestSuite() {
  console.log('🧪 Starting VendiAide 28-Phrase Customer Language Benchmark Suite...\n');

  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let dangerousCount = 0;

  function evaluate(
    category: string,
    phrase: string,
    setupStateFn: () => ReturnType<typeof createInitialDemoState>,
    checkFn: (res: ReturnType<typeof processDemoMessage>, stateBefore: ReturnType<typeof createInitialDemoState>) => { score: 'GREEN' | 'YELLOW' | 'RED' | 'DANGEROUS'; note: string }
  ) {
    const stateBefore = setupStateFn();
    const res = processDemoMessage(stateBefore, phrase);
    const { score, note } = checkFn(res, stateBefore);

    let icon = '🟢';
    if (score === 'GREEN') greenCount++;
    if (score === 'YELLOW') { yellowCount++; icon = '🟡'; }
    if (score === 'RED') { redCount++; icon = '🔴'; }
    if (score === 'DANGEROUS') { dangerousCount++; icon = '💀'; }

    console.log(`  ${icon} [${category}] "${phrase.padEnd(28)}" -> ${score.padEnd(9)} | ${note}`);
  }

  // ==========================================
  // CATEGORY 1: PURCHASE AUTHORIZATION PHRASES
  // (Setup: State with Product: Hoodie, Size: L, Location: Ikeja -> READY_FOR_CHECKOUT)
  // ==========================================
  console.log('--- Category 1: Purchase Authorization (Ready for Checkout) ---');

  const purchasePhrases = [
    'I wan take am',
    'I go collect this one',
    "I'll take this",
    'make I buy this one',
    'I dey buy am',
    "let's do it",
    'make we run am',
    'I want this one',
    "I'll go with this",
    'this one na my choice'
  ];

  function setupReadyState() {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'I want the hoodie size L send to Ikeja').updatedState;
    return s;
  }

  for (const phrase of purchasePhrases) {
    evaluate('Purchase', phrase, setupReadyState, (res) => {
      if (res.updatedState.orders.length === 1 && res.intent === 'PURCHASE_INTENT') {
        return { score: 'GREEN', note: 'Created 1 order cleanly' };
      }
      if (res.updatedState.orders.length === 0 && res.responseText.includes('reserve')) {
        return { score: 'YELLOW', note: 'Asked safe clarification prompt without auto-ordering' };
      }
      if (res.updatedState.orders.length > 1) {
        return { score: 'DANGEROUS', note: `Duplicate order created! (${res.updatedState.orders.length})` };
      }
      return { score: 'RED', note: `Failed to recognize purchase authorization (intent: ${res.intent})` };
    });
  }

  // ==========================================
  // CATEGORY 2: CONTEXTUAL LANGUAGE
  // ==========================================
  console.log('\n--- Category 2: Contextual Language ---');

  // "bring am like that" when Hoodie is active
  evaluate('Contextual', 'bring am like that', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'how much is the hoodie?').updatedState;
    return s;
  }, (res) => {
    if (res.responseText.toLowerCase().includes('keep') || res.responseText.toLowerCase().includes('hoodie')) {
      return { score: 'GREEN', note: 'Confirmed active product configuration' };
    }
    if (res.responseText.includes('bring am like that')) {
      return { score: 'RED', note: 'Treated phrase as unlisted product name' };
    }
    return { score: 'YELLOW', note: `Safe clarification: "${res.responseText.substring(0, 45)}..."` };
  });

  // "make e remain like this"
  evaluate('Contextual', 'make e remain like this', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'I want the abaya').updatedState;
    return s;
  }, (res) => {
    if (res.responseText.toLowerCase().includes('abaya') || res.responseText.toLowerCase().includes('keep')) {
      return { score: 'GREEN', note: 'Confirmed active product selection' };
    }
    return { score: 'YELLOW', note: 'Safe clarification' };
  });

  // "that first one" after catalog listing
  evaluate('Contextual', 'that first one', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'wetin una get').updatedState;
    return s;
  }, (res) => {
    if (res.responseText.toLowerCase().includes('hoodie') || res.updatedState.pendingProductId === 'demo_prod_1') {
      return { score: 'GREEN', note: 'Selected 1st product (Hoodie)' };
    }
    return { score: 'RED', note: 'Failed to resolve first item' };
  });

  // "the one wey you show"
  evaluate('Contextual', 'the one wey you show', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'I want the hoodie size L').updatedState;
    return s;
  }, (res) => {
    if (res.updatedState.pendingProductId === 'demo_prod_1') {
      return { score: 'GREEN', note: 'Retained active hoodie focus' };
    }
    return { score: 'YELLOW', note: 'Safe clarification' };
  });

  // "that black one"
  evaluate('Contextual', 'that black one', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'wetin una get').updatedState;
    return s;
  }, (res) => {
    if (res.updatedState.pendingProductId === 'demo_prod_1' || res.responseText.toLowerCase().includes('hoodie') || res.responseText.toLowerCase().includes('abaya')) {
      return { score: 'GREEN', note: 'Resolved black product option' };
    }
    return { score: 'YELLOW', note: 'Safe clarification' };
  });

  // "the other one"
  evaluate('Contextual', 'the other one', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'I want the hoodie').updatedState;
    return s;
  }, (res) => {
    if (res.responseText.toLowerCase().includes('abaya') || res.responseText.toLowerCase().includes('sneaker') || res.intent === 'CATALOG_DISCOVERY') {
      return { score: 'GREEN', note: 'Presented alternative catalog options' };
    }
    return { score: 'YELLOW', note: 'Safe clarification' };
  });

  // "this one here"
  evaluate('Contextual', 'this one here', () => {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'how much is the hoodie?').updatedState;
    return s;
  }, (res) => {
    if (res.updatedState.pendingProductId === 'demo_prod_1') {
      return { score: 'GREEN', note: 'Retained active hoodie reference' };
    }
    return { score: 'YELLOW', note: 'Safe clarification' };
  });

  // ==========================================
  // CATEGORY 3: SIZE SELECTION
  // ==========================================
  console.log('\n--- Category 3: Size Selection ---');

  const sizePhrases = [
    { phrase: 'make am large', expected: 'L' },
    { phrase: 'I wear L', expected: 'L' },
    { phrase: 'give me L', expected: 'L' },
    { phrase: 'large dey?', expected: 'L' },
    { phrase: 'XL abeg', expected: 'XL' }
  ];

  for (const { phrase, expected } of sizePhrases) {
    evaluate('Size', phrase, () => {
      let s = createInitialDemoState();
      s = processDemoMessage(s, 'I want the hoodie').updatedState;
      return s;
    }, (res) => {
      if (res.updatedState.pendingSize === expected) {
        return { score: 'GREEN', note: `Extracted size ${expected} correctly` };
      }
      return { score: 'RED', note: `Expected size ${expected}, got ${res.updatedState.pendingSize}` };
    });
  }

  // ==========================================
  // CATEGORY 4: LOCATION INPUT
  // ==========================================
  console.log('\n--- Category 4: Location Input ---');

  const locationPhrases = [
    'I dey Ikeja',
    "I'm around Ikeja",
    'send am Ikeja',
    'make you deliver Ikeja',
    'I stay for Ikeja'
  ];

  for (const phrase of locationPhrases) {
    evaluate('Location', phrase, () => {
      let s = createInitialDemoState();
      s = processDemoMessage(s, 'I want the hoodie size L').updatedState;
      return s;
    }, (res) => {
      if (res.updatedState.pendingLocation === 'Ikeja') {
        return { score: 'GREEN', note: 'Extracted canonical location Ikeja' };
      }
      if (res.updatedState.orders.length > 0 && res.updatedState.orders[0].deliveryLocation === 'Ikeja') {
        return { score: 'GREEN', note: 'Extracted location Ikeja and created order' };
      }
      return { score: 'RED', note: `Failed to extract location Ikeja (got ${res.updatedState.pendingLocation})` };
    });
  }

  console.log(`\n==========================================`);
  console.log(`BENCHMARK SUMMARY:`);
  console.log(`  🟢 GREEN (Correct):           ${greenCount}`);
  console.log(`  🟡 YELLOW (Safe Clarification): ${yellowCount}`);
  console.log(`  🔴 RED (Wrong Interpretation): ${redCount}`);
  console.log(`  💀 DANGEROUS (State Mutation):  ${dangerousCount}`);
  console.log(`==========================================\n`);

  if (dangerousCount > 0) {
    throw new Error(`DANGEROUS state mutation occurred in ${dangerousCount} benchmark phrases!`);
  }
}

runPhrasingBenchmarkTestSuite().catch((err) => {
  console.error('❌ Phrasing Benchmark Suite Failed:', err);
  process.exit(1);
});
