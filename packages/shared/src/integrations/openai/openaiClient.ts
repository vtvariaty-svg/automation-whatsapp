import OpenAI from 'openai';

export const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not defined in environment variables');
  }

  return new OpenAI({
    apiKey: apiKey,
  });
};
