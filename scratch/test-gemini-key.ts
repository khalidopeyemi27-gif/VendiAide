import { parseCustomerMessageWithGemini } from '../src/lib/engine/gemini-nlu';

async function main() {
  console.log('--- STARTING GEMINI NLU TEST ---');
  const res = await parseCustomerMessageWithGemini('abeg make you keep that black one for me');
  console.log('Result received:', res !== undefined);
  if (res) {
    console.log('Intent:', res.intent);
    console.log('Product:', res.extractedProduct);
  } else {
    console.log('Fallback triggered (key invalid or endpoint returned non-200)');
  }
}

main();
