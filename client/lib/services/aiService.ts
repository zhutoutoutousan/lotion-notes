import { generateResponse } from './deepseek';

// Use the correct DeepSeek API endpoint
const DEEPSEEK_API_URL = 'https://api.deepseek.ai/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

interface GenerateVocabularyContentParams {
  word: string;
  source_language_id: string;
  target_language_id: string;
}

interface Example {
  [key: string]: string;
}

interface VocabularyResponse {
  translation: string;
  example: Example;
  context: string;
}

export async function generateVocabularyContent({ word, source_language_id, target_language_id }: GenerateVocabularyContentParams) {
  console.log('Generating content with:', { word, source_language_id, target_language_id });
  console.log('API Key exists:', !!DEEPSEEK_API_KEY);

  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key is not configured');
    throw new Error('DeepSeek API key is not configured');
  }

  const systemMessage = `You are a language learning assistant. Generate a translation, example sentence, and additional context for a vocabulary word.
  The word is "${word}" in ${source_language_id} and needs to be translated to ${target_language_id}.
  Provide the response in JSON format with three fields: "translation", "example", and "context".
  The translation should be accurate and natural in the target language.
  The example should be a natural sentence using the word in the source language with its translation.
  The context should explain usage, grammar notes, or cultural context.`;

  try {
    const content = await generateResponse('Generate vocabulary content', systemMessage);
    console.log('AI Response content:', content);
    
    try {
      // Remove the ```json wrapper if present
      const cleanContent = content.replace(/```json\n|\n```/g, '');
      const parsedContent: VocabularyResponse = JSON.parse(cleanContent);
      
      // Format the example as a single string with both languages
      const exampleText = `${parsedContent.example}`;
      
      return {
        translation: parsedContent.translation,
        example: exampleText,
        context: parsedContent.context
      };
    } catch (error) {
      console.log('Failed to parse JSON, trying to extract content');
      // If the response isn't valid JSON, try to extract the content
      const lines = content.split('\n');
      const translation = lines.find((line: string) => line.toLowerCase().includes('translation')) || '';
      const example = lines.find((line: string) => line.toLowerCase().includes('example')) || '';
      const context = lines.find((line: string) => line.toLowerCase().includes('context')) || '';
      
      return {
        translation: translation.replace(/^translation:?\s*/i, ''),
        example: example.replace(/^example:?\s*/i, ''),
        context: context.replace(/^context:?\s*/i, '')
      };
    }
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
} 