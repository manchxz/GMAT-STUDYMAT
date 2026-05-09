import { createGoogleGenerativeAI } from '@ai-sdk/google';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const google = createGoogleGenerativeAI({
  apiKey: apiKey || undefined,
});

/// Default chat model for the tutor MVP. Cheap, fast, large context.
/// Swap to `gemini-2.5-pro` for harder Quant if needed.
export const TUTOR_MODEL = 'gemini-2.0-flash';

export function assertGeminiKey() {
  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to .env (see .env.example).',
    );
  }
}
