// News service for handling API calls and translations

// Types
export interface NewsArticle {
  id: string;
  article_id: string;
  title: string;
  link: string;
  keywords: string[];
  creator: string | null;
  description: string;
  content: string;
  pubDate: string;
  pubDateTZ: string;
  image_url: string | null;
  video_url: string | null;
  source_id: string;
  source_name: string;
  source_priority: number;
  source_url: string;
  source_icon: string;
  language: string;
  country: string[];
  category: string[];
  sentiment: string;
  sentiment_stats: string;
  ai_tag: string;
  ai_region: string;
  ai_org: string;
  duplicate: boolean;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  translation?: {
    title?: string;
    description?: string;
    content?: string;
    vocabulary?: Array<{
      word: string;
      translation: string;
      context: string;
    }>;
  };
}

export interface TranslationResult {
  text: string;
  vocabulary: Array<{
    word: string;
    translation: string;
    example: string;
  }>;
  grammar: string;
  bilingualExample: string;
}

// Define the location interface
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

// API Keys - In a real app, these would be stored in environment variables
const NEWSDATA_API_KEY = process.env.NEXT_PUBLIC_NEWSDATA_API_KEY || "YOUR_NEWSDATA_API_KEY";
const THENEWSAPI_API_KEY = process.env.NEXT_PUBLIC_THENEWSAPI_API_KEY || "YOUR_THENEWSAPI_API_KEY";
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "YOUR_DEEPSEEK_API_KEY";

// NewsData.io API
export async function fetchNewsDataArticles(
  query: string = '',
  category: string = 'all',
  country: string = 'all',
  language: string = 'en'
): Promise<NewsArticle[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEWSDATA_API_KEY;
    if (!apiKey) {
      throw new Error('NewsData.io API key not configured');
    }

    // Build the query parameters
    const params = new URLSearchParams({
      apikey: apiKey,
      q: query || '',
      language: language !== 'all' ? language : 'en',
    });

    const response = await fetch(`https://newsdata.io/api/1/news?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.results?.message || 'Failed to fetch news articles');
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from NewsData.io API');
    }

    return data.results.map((article: any) => ({
      article_id: article.article_id || article.link,
      title: article.title,
      description: article.description,
      content: article.content,
      image_url: article.image_url,
      source_name: article.source_id,
      source_url: article.link,
      source_icon: article.source_icon,
      pubDate: article.pubDate,
      country: article.country ? [article.country] : [],
      category: article.category ? [article.category] : [],
      creator: article.creator ? [article.creator] : [],
      language: article.language,
    }));
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }
}

// TheNewsAPI API
export const fetchTheNewsAPIArticles = async (
  query: string = "",
  language: string = "en",
  category: string = "all"
): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `https://api.thenewsapi.com/v1/news/top?api_token=${THENEWSAPI_API_KEY}&search=${query}&language=${language}${
        category !== "all" ? `&categories=${category}` : ""
      }`
    );

    if (!response.ok) {
      throw new Error(`Error fetching news: ${response.status}`);
    }

    const data = await response.json();

    if (data.data) {
      return data.data.map((article: any) => ({
        article_id: article.uuid || Math.random().toString(36).substring(2, 9),
        title: article.title,
        link: article.url,
        keywords: article.keywords || [],
        creator: article.creator || null,
        description: article.description || "No description available",
        content: article.content,
        pubDate: article.published_at,
        pubDateTZ: article.published_at_tz,
        image_url: article.image_url || "https://via.placeholder.com/300x200?text=No+Image",
        video_url: article.video_url,
        source_id: article.source,
        source_name: article.source_name,
        source_priority: article.source_priority,
        source_url: article.url,
        source_icon: article.source_icon,
        language: article.language || "en",
        country: article.country || [],
        category: article.categories || [],
        sentiment: article.sentiment,
        sentiment_stats: article.sentiment_stats,
        ai_tag: article.ai_tag,
        ai_region: article.ai_region,
        ai_org: article.ai_org,
        duplicate: article.duplicate,
        location: article.location
      }));
    } else {
      throw new Error("Failed to fetch news");
    }
  } catch (error) {
    console.error("Error fetching news from TheNewsAPI:", error);
    throw error;
  }
};

// Function to translate text using DeepSeek API
export async function translateWithDeepSeek(
  text: string,
  targetLanguage: string,
  maxRetries: number = 3
): Promise<TranslationResult> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a professional translator and language learning assistant. 
              Translate the following text to ${targetLanguage}. 
              Also provide:
              1. Key vocabulary with examples (at least 5 words)
              2. Grammar insights
              3. A bilingual example sentence
              
              IMPORTANT: Your response MUST be valid JSON with the following structure:
              {
                "translation": "translated text",
                "vocabulary": [
                  {
                    "word": "original word",
                    "translation": "translated word",
                    "example": "example sentence in original language"
                  }
                ],
                "grammar": "grammar insights",
                "bilingualExample": "original text / translated text"
              }
              
              For vocabulary, focus on:
              - Advanced or technical words
              - Words that appear frequently in the text
              - Words with interesting grammar patterns
              
              Do not include any markdown formatting, code blocks, or additional text outside the JSON structure.`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Extract JSON from the content, handling code blocks if present
        let jsonContent = content;
        
        // Check if the content is wrapped in a code block
        if (content.includes('```json')) {
          // Extract the JSON part from the code block
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          // Try to extract any code block
          const codeMatch = content.match(/```\n([\s\S]*?)\n```/);
          if (codeMatch && codeMatch[1]) {
            jsonContent = codeMatch[1];
          }
        }
        
        // Try to parse the JSON response
        const parsedContent = JSON.parse(jsonContent);
        
        // Validate the required fields are present
        if (!parsedContent.translation || !parsedContent.vocabulary || 
            !parsedContent.grammar || !parsedContent.bilingualExample) {
          throw new Error('Missing required fields in translation response');
        }
        
        return {
          text: parsedContent.translation,
          vocabulary: parsedContent.vocabulary,
          grammar: parsedContent.grammar,
          bilingualExample: parsedContent.bilingualExample
        };
      } catch (parseError) {
        console.error('Error parsing translation response:', parseError);
        console.error('Raw content:', content);
        
        // If this is the last retry, throw the error
        if (retryCount === maxRetries - 1) {
          throw new Error('Failed to parse translation response after multiple attempts');
        }
        
        // Otherwise, increment retry count and try again
        retryCount++;
        console.log(`Retrying translation (attempt ${retryCount + 1}/${maxRetries})...`);
        
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // If this is the last retry, throw the error
      if (retryCount === maxRetries - 1) {
        throw error;
      }
      
      // Otherwise, increment retry count and try again
      retryCount++;
      console.log(`Retrying translation (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw new Error('Translation failed after maximum retries');
}

// Helper functions for mock translations
function getTranslationForWord(word: string, language: string): string {
  const translations: Record<string, Record<string, string>> = {
    example: {
      es: "ejemplo",
      fr: "exemple",
      de: "Beispiel",
      it: "esempio",
      pt: "exemplo",
      ru: "пример",
      zh: "例子",
      ja: "例",
      ko: "예시",
    },
    translation: {
      es: "traducción",
      fr: "traduction",
      de: "Übersetzung",
      it: "traduzione",
      pt: "tradução",
      ru: "перевод",
      zh: "翻译",
      ja: "翻訳",
      ko: "번역",
    },
  };
  
  return translations[word]?.[language] || word;
}

function getGrammarInsight(text: string, language: string): string {
  const insights: Record<string, string> = {
    es: "En este texto, podemos ver el uso del tiempo presente simple y los artículos.",
    fr: "Dans ce texte, nous pouvons voir l'utilisation du présent simple et des articles.",
    de: "In diesem Text können wir die Verwendung der einfachen Gegenwart und der Artikel sehen.",
    it: "In questo testo, possiamo vedere l'uso del presente semplice e degli articoli.",
    pt: "Neste texto, podemos ver o uso do presente simples e dos artigos.",
    ru: "В этом тексте мы можем увидеть использование простого настоящего времени и артиклей.",
    zh: "在这段文字中，我们可以看到一般现在时和冠词的使用。",
    ja: "このテキストでは、単純現在時制と冠詞の使用を見ることができます。",
    ko: "이 텍스트에서 우리는 단순 현재 시제와 관사의 사용을 볼 수 있습니다.",
  };
  
  return insights[language] || "In this text, we can see the use of present simple tense and articles.";
}

function getBilingualExample(language: string): string {
  const examples: Record<string, string> = {
    es: "This is an example sentence. / Esta es una frase de ejemplo.",
    fr: "This is an example sentence. / Voici une phrase d'exemple.",
    de: "This is an example sentence. / Dies ist ein Beispielsatz.",
    it: "This is an example sentence. / Questa è una frase di esempio.",
    pt: "This is an example sentence. / Esta é uma frase de exemplo.",
    ru: "This is an example sentence. / Это пример предложения.",
    zh: "This is an example sentence. / 这是一个示例句子。",
    ja: "This is an example sentence. / これは例文です。",
    ko: "This is an example sentence. / 이것은 예시 문장입니다.",
  };
  
  return examples[language] || "This is an example sentence. / This is an example sentence.";
}

/**
 * Detects the location mentioned in a news article using DeepSeek
 * @param title The article title
 * @param description The article description
 * @param content Optional article content
 * @returns A Location object with creative reasoning
 */
export async function detectLocationWithDeepSeek(
  title: string,
  description: string,
  content?: string
): Promise<Location> {
  try {
    // Combine the text for analysis
    const textToAnalyze = `${title}. ${description}${content ? `. ${content}` : ''}`;
    
    // Create a prompt for the DeepSeek API
    const prompt = `
      You are a creative location detective with a flair for storytelling. Your task is to analyze news articles and determine the most relevant geographic location, even when no location is explicitly mentioned.

      For the following article text, provide a creative and thoughtful analysis that includes:
      1. The chosen location
      2. Your reasoning process
      3. A creative narrative about why this location is significant
      4. Any interesting connections or metaphors you discovered

      Text: "${textToAnalyze}"

      Return a JSON object with the following structure:
      {
        "name": "Location Name",
        "latitude": latitude as number,
        "longitude": longitude as number,
        "reasoning": {
          "analysis": "Your detailed analysis of the text",
          "creative_connection": "A creative narrative connecting the article to the location",
          "metaphor": "An interesting metaphor or analogy",
          "confidence": "high|medium|low",
          "alternative_locations": ["List of other possible locations that could fit"]
        }
      }

      Be creative and imaginative in your analysis. For example:
      - If it's about AI: "Like a digital phoenix rising from the silicon ashes of Moore's Law, this story finds its home in Silicon Valley..."
      - If it's about climate change: "The Arctic, a frozen sentinel of our planet's health, stands as the perfect backdrop for this environmental narrative..."
      - If it's about space: "Houston, we have a story! The Johnson Space Center becomes the gravitational center of this cosmic tale..."
      - If it's about art: "Paris, the city of light and inspiration, illuminates this creative journey..."

      IMPORTANT: Always provide a location, even if you need to make an imaginative connection.
      Your reasoning should be creative and engaging, making the location choice feel meaningful and intentional.
    `;
    
    // Call the DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: prompt
          }
        ],
        temperature: 0.8 // Increased temperature for more creative responses
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response
    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        const locationData = JSON.parse(jsonMatch[1]);
        
        // Log the creative reasoning to console
        console.log('Location Analysis:', {
          article: textToAnalyze,
          location: locationData.name,
          reasoning: locationData.reasoning
        });
        
        // Validate the location data
        if (
          locationData &&
          typeof locationData.name === 'string' &&
          typeof locationData.latitude === 'number' &&
          typeof locationData.longitude === 'number'
        ) {
          return {
            name: locationData.name,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          };
        }
      }
    } catch (parseError) {
      console.error('Failed to parse location data:', parseError);
    }
    
    // Fallback location (New York City) if parsing fails
    return {
      name: "New York City, USA",
      latitude: 40.7128,
      longitude: -74.0060
    };
  } catch (error) {
    console.error('Error detecting location:', error);
    // Fallback location (New York City) if API call fails
    return {
      name: "New York City, USA",
      latitude: 40.7128,
      longitude: -74.0060
    };
  }
}

export async function fetchAllNewsArticles(
  query: string = "latest",
  language: string = "en",
  category: string = "all"
): Promise<NewsArticle[]> {
  try {
    const [newsDataArticles, theNewsAPIArticles] = await Promise.all([
      fetchNewsDataArticles(query, language, category),
      fetchTheNewsAPIArticles(query, language, category)
    ]);

    // Combine and deduplicate articles
    const combinedArticles = [...newsDataArticles, ...theNewsAPIArticles];
    const uniqueArticles = Array.from(new Map(
      combinedArticles.map(article => [article.article_id, article])
    ).values());

    return uniqueArticles;
  } catch (error) {
    console.error('Error fetching combined news articles:', error);
    return [];
  }
}

// Add language learning game interface
export interface LanguageGame {
  word: string;
  translation: string;
  context: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateLanguageGame(
  article: NewsArticle,
  targetLanguage: string
): Promise<LanguageGame[]> {
  try {
    const prompt = `Create a language learning game based on this news article:
Title: ${article.title}
Description: ${article.description}
Content: ${article.content}

Create 5 vocabulary questions with:
1. The word in the original language
2. Its translation in ${targetLanguage}
3. The context from the article
4. 4 multiple choice options (including the correct answer)
5. Difficulty level based on word complexity

Return the response in this JSON format:
{
  "questions": [
    {
      "word": "original word",
      "translation": "translated word",
      "context": "sentence from article",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct option",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const gameData = JSON.parse(data.choices[0].message.content);
    return gameData.questions;
  } catch (error) {
    console.error('Error generating language game:', error);
    return [];
  }
} 