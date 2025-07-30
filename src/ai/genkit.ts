import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  // By setting a default model here, all flows that don't specify a model
  // will use this reliable and fast text generation model.
  model: 'googleai/gemini-2.0-flash',
});
