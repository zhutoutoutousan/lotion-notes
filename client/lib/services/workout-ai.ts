import { generateResponse } from './deepseek';
import { WorkoutPlan, PeriodizationPlan } from '@/types/workout';

const WORKOUT_SYSTEM_MESSAGE = `You are an expert strength and conditioning coach specializing in powerlifting and strength training.
Your expertise includes:
- Periodization for intermediate to advanced lifters
- Exercise programming and progression
- Recovery and deload strategies
- Technique optimization
- Accessory exercise selection

When generating workout plans:
1. Focus on compound lifts (squat, bench, deadlift, overhead press)
2. Include appropriate volume and intensity
3. Consider the lifter's experience level and PRs
4. Provide clear progression schemes
5. Include relevant accessory work
6. Address recovery and deload strategies

When creating periodization plans:
1. Structure in 4-12 week blocks
2. Include volume and intensity waves
3. Plan deload weeks appropriately
4. Consider exercise variations
5. Address weak points
6. Include recovery recommendations

IMPORTANT: 
1. Always return responses in valid JSON format without any markdown formatting or code blocks.
2. Keep responses concise and within token limits.
3. If you can't complete the full plan, return a valid JSON structure with the most important information first.
4. Never leave strings unterminated - always close quotes and brackets properly.`;

function fixUnterminatedJson(jsonString: string): string {
  // First, try to fix any unterminated strings
  let fixedString = jsonString;
  const quoteCount = (fixedString.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // If we have an odd number of quotes, add a closing quote
    fixedString = fixedString.replace(/"([^"]*)$/, '"$1"');
  }

  // Then fix any unterminated objects or arrays
  const openBraces = (fixedString.match(/{/g) || []).length;
  const closeBraces = (fixedString.match(/}/g) || []).length;
  const openBrackets = (fixedString.match(/\[/g) || []).length;
  const closeBrackets = (fixedString.match(/\]/g) || []).length;

  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixedString += '}';
  }

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixedString += ']';
  }

  return fixedString;
}

export async function generateWorkoutPlan(prompt: string): Promise<WorkoutPlan> {
  const response = await generateResponse(prompt, WORKOUT_SYSTEM_MESSAGE);
  try {
    // Remove any markdown formatting
    const cleanResponse = response.replace(/```json\n|\n```/g, '').trim();
    
    // Try to parse the response directly first
    try {
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.warn('Initial parse failed, attempting to fix JSON structure');
      const fixedResponse = fixUnterminatedJson(cleanResponse);
      return JSON.parse(fixedResponse);
    }
  } catch (error) {
    console.error('Error parsing workout plan:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse workout plan response. The AI response may have been incomplete or malformed.');
  }
}

export async function generatePeriodizationPlan(prompt: string): Promise<PeriodizationPlan> {
  const response = await generateResponse(prompt, WORKOUT_SYSTEM_MESSAGE);
  try {
    // Remove any markdown formatting
    const cleanResponse = response.replace(/```json\n|\n```/g, '').trim();
    
    // Try to parse the response directly first
    try {
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.warn('Initial parse failed, attempting to fix JSON structure');
      const fixedResponse = fixUnterminatedJson(cleanResponse);
      return JSON.parse(fixedResponse);
    }
  } catch (error) {
    console.error('Error parsing periodization plan:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse periodization plan response. The AI response may have been incomplete or malformed.');
  }
} 