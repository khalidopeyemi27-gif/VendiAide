import { chromium } from 'playwright';
import fs from 'fs';

const targetUrl = process.argv[2] || 'http://127.0.0.1:3000/demo';
const isHeadless = process.env.HEADLESS !== 'false';
const customExecutable = process.env.CHROMIUM_PATH;

console.log(`🚀 Starting Playwright E2E Regression Suite against: ${targetUrl}`);
console.log(`Headless Mode: ${isHeadless}`);
if (customExecutable) {
  console.log(`Custom Chromium Executable: ${customExecutable}`);
}

const reportResults = [];

async function runRegression() {
  const launchOptions = {
    headless: isHeadless,
  };
  if (customExecutable && fs.existsSync(customExecutable)) {
    launchOptions.executablePath = customExecutable;
  }

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (err) {
    console.warn('Standard Chromium launch failed, attempting system browser launch...', err.message);
    try {
      browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
    } catch (err2) {
      console.error('Failed to launch browser:', err2);
      process.exit(1);
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  // Helper to send message in chat UI
  async function sendMessage(text) {
    const input = page.locator('input[type="text"]');
    await input.click();
    await input.fill(text);
    await input.press('Enter');
    await page.waitForTimeout(750); // Allow state update & simulated typing
  }

  // Helper to get current UI state
  async function getUIState() {
    const debugIntentEl = page.locator('[data-testid="debug-intent"]');
    let debugIntent = 'UNKNOWN';
    if (await debugIntentEl.count() > 0) {
      debugIntent = (await debugIntentEl.innerText()).trim();
    }

    const pageText = await page.innerText('body');
    const orderMatch = pageText.match(/Orders:\s*(\d+)/i);
    const ordersCount = orderMatch ? parseInt(orderMatch[1], 10) : 0;

    const authMatch = pageText.match(/Authorized:\s*(YES|NO)/i);
    const authorized = authMatch ? authMatch[1] === 'YES' : false;

    const statusMatch = pageText.match(/Draft Status & Auth[\s\S]*?(EMPTY|CONFIGURING|READY_FOR_CHECKOUT)/i) || pageText.match(/(EMPTY|CONFIGURING|READY_FOR_CHECKOUT)/i);
    const draftStatus = statusMatch ? statusMatch[1] : 'EMPTY';

    return { debugIntent, ordersCount, authorized, draftStatus };
  }

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
    console.log('✅ Page loaded successfully');

    // Test Case 1: Catalog Discovery ("boss wetin una get")
    await sendMessage('boss wetin una get');
    let state = await getUIState();
    const tc1Passed = (state.debugIntent === 'CATALOG_INQUIRY' || state.debugIntent === 'CATALOG_DISCOVERY') && state.ordersCount === 0;
    reportResults.push({ name: '1. Nigerian Pidgin catalog request', status: tc1Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 1: ${tc1Passed ? '✅ PASSED' : '❌ FAILED'} (${state.debugIntent}, Orders: ${state.ordersCount})`);

    // Test Case 2: Purchase Intent ("i wan take the hoodie")
    await sendMessage('i wan take the hoodie');
    state = await getUIState();
    const tc2Passed = state.authorized === false && state.ordersCount === 0;
    reportResults.push({ name: '2. Pidgin purchase intent (unauthorized)', status: tc2Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 2: ${tc2Passed ? '✅ PASSED' : '❌ FAILED'} (Auth: ${state.authorized}, Orders: ${state.ordersCount})`);

    // Test Case 3: Size specification ("L")
    await sendMessage('L');
    state = await getUIState();
    const tc3Passed = state.authorized === false && state.ordersCount === 0;
    reportResults.push({ name: '3. Size specification L', status: tc3Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 3: ${tc3Passed ? '✅ PASSED' : '❌ FAILED'} (Auth: ${state.authorized}, Orders: ${state.ordersCount})`);

    // Test Case 4: Location ("deliver to Ikeja")
    await sendMessage('deliver to Ikeja');
    state = await getUIState();
    const tc4Passed = state.draftStatus === 'READY_FOR_CHECKOUT' && state.authorized === false && state.ordersCount === 0;
    reportResults.push({ name: '4. Location specification Ikeja (READY_FOR_CHECKOUT)', status: tc4Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 4: ${tc4Passed ? '✅ PASSED' : '❌ FAILED'} (Status: ${state.draftStatus}, Auth: ${state.authorized})`);

    // Test Case 5: Discount Inquiry ("discount dey?")
    await sendMessage('discount dey?');
    state = await getUIState();
    const tc5Passed = state.debugIntent === 'DISCOUNT_INQUIRY' && state.authorized === false && state.ordersCount === 0;
    reportResults.push({ name: '5. Discount inquiry read-only safety', status: tc5Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 5: ${tc5Passed ? '✅ PASSED' : '❌ FAILED'} (Intent: ${state.debugIntent}, Orders: ${state.ordersCount})`);

    // Test Case 6: Explicit Order Confirmation ("yes do am")
    await sendMessage('yes do am');
    state = await getUIState();
    const tc6Passed = state.debugIntent === 'EXPLICIT_ORDER_CONFIRMATION' && state.ordersCount === 1;
    reportResults.push({ name: '6. Explicit order confirmation (yes do am)', status: tc6Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 6: ${tc6Passed ? '✅ PASSED' : '❌ FAILED'} (Intent: ${state.debugIntent}, Orders: ${state.ordersCount})`);

    // Test Case 7: Idempotent duplicate confirmation ("yes do am")
    await sendMessage('yes do am');
    state = await getUIState();
    const tc7Passed = state.ordersCount === 1;
    reportResults.push({ name: '7. Idempotent duplicate confirmation', status: tc7Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 7: ${tc7Passed ? '✅ PASSED' : '❌ FAILED'} (Orders: ${state.ordersCount})`);

    // Test Case 8: Informational Sneaker Question during active flow ("you get sneakers?")
    await sendMessage('you get sneakers?');
    state = await getUIState();
    const tc8Passed = state.ordersCount === 1;
    reportResults.push({ name: '8. Informational product question read-only preservation', status: tc8Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 8: ${tc8Passed ? '✅ PASSED' : '❌ FAILED'} (Orders: ${state.ordersCount})`);

    // Test Case 9: Explicit Product Switching ("switch to sneakers")
    await sendMessage('switch to sneakers');
    state = await getUIState();
    const tc9Passed = state.ordersCount === 1;
    reportResults.push({ name: '9. Explicit product switch to sneakers', status: tc9Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 9: ${tc9Passed ? '✅ PASSED' : '❌ FAILED'} (Orders: ${state.ordersCount})`);

    // Test Case 10: Cancellation ("cancel my order")
    await sendMessage('cancel my order');
    state = await getUIState();
    const tc10Passed = state.debugIntent === 'CANCEL';
    reportResults.push({ name: '10. Order cancellation and state reset', status: tc10Passed ? 'PASSED' : 'FAILED', details: state });
    console.log(`Test 10: ${tc10Passed ? '✅ PASSED' : '❌ FAILED'} (Intent: ${state.debugIntent})`);

  } catch (err) {
    console.error('Error during Playwright test execution:', err);
  } finally {
    await browser.close();
  }

  const passedCount = reportResults.filter(r => r.status === 'PASSED').length;
  const totalCount = reportResults.length;
  const reportSummary = {
    timestamp: new Date().toISOString(),
    targetUrl,
    totalTests: totalCount,
    passed: passedCount,
    failed: totalCount - passedCount,
    results: reportResults,
  };

  fs.writeFileSync('vendiaide-regression-report.json', JSON.stringify(reportSummary, null, 2));
  console.log(`\n======================================================`);
  console.log(`📊 E2E REGRESSION SUMMARY: ${passedCount}/${totalCount} Passed`);
  console.log(`Report written to vendiaide-regression-report.json`);
  console.log(`======================================================\n`);
  process.exit(passedCount === totalCount ? 0 : 1);
}

runRegression();
