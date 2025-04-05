/**
 * DeepSeek AI Service
 * 
 * This service handles communication with the DeepSeek AI API.
 * It provides functions to generate responses based on user input.
 */

// API endpoint for DeepSeek
const DEEPSEEK_API_URL = process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

// Default system message for the AI
const DEFAULT_SYSTEM_MESSAGE = `You are a helpful AI assistant for Lotion Notes, a note-taking application with a dark house music theme.
You help users organize their thoughts, create knowledge graphs, and manage their notes.
Your responses should be concise, helpful, and maintain the nightclub-inspired aesthetic of the application.`;

/**
 * Generate a response from the DeepSeek AI
 * 
 * @param userMessage - The message from the user
 * @param systemMessage - Optional system message to guide the AI's behavior
 * @returns A promise that resolves to the AI's response
 */
export async function generateResponse(
  userMessage: string,
  systemMessage: string = DEFAULT_SYSTEM_MESSAGE
): Promise<string> {
  // If no API key is available, return a fallback response
  if (!DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API key is not available. Using fallback response.');
    return getFallbackResponse(userMessage);
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return getFallbackResponse(userMessage);
  }
}

/**
 * Get a fallback response when the API is not available
 * 
 * @param userMessage - The message from the user
 * @returns A fallback response
 */
function getFallbackResponse(userMessage: string): string {
  // Simple keyword-based responses for common queries
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hey there! I'm your AI assistant for Lotion Notes. How can I help you organize your thoughts today?";
  }
  
  if (lowerMessage.includes('note') || lowerMessage.includes('create')) {
    return "To create a new note, click on the 'Start Your Journey' button and then select 'New Note' from the sidebar.";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you create notes, organize your thoughts, and build knowledge graphs. Just let me know what you need!";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Let me know if you need anything else.";
  }
  
  // Default response
  return "I'm your AI assistant for Lotion Notes. I can help you organize your thoughts and manage your notes. What would you like to know?";
} 