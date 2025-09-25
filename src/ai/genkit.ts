import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase, googleCloud } from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    // The firebase() and googleCloud() plugins are not needed here for basic setup.
    // The strings in logSinks, traceSinks, etc., are sufficient.
  ],
  logSinks: ['firebase'],
  traceSinks: ['firebase'],
  enableTracing: true,
  flowStateStore: 'firebase',
  traceStore: 'firebase',
});
