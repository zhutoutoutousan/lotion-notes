// News service for handling API calls and translations

// Types
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  publishedAt: string;
  category: string;
  language: string;
  content?: string;
  location?: Location;
  translation?: {
    title?: string;
    description?: string;
    content?: string;
    vocabulary?: Array<{
      word: string;
      translation: string;
      example: string;
    }>;
    grammar?: string;
    bilingualExample?: string;
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
  query: string = "latest",
  language: string = "en",
  category: string = "all"
): Promise<NewsArticle[]> {
  try {
    // Ensure query is not empty
    const searchQuery = query.trim() || "latest";
    
    // Build the API URL with parameters
    const url = new URL("https://newsdata.io/api/1/news");
    url.searchParams.append("apikey", NEWSDATA_API_KEY);
    url.searchParams.append("q", searchQuery);
    url.searchParams.append("language", language);
    
    // Only add category if it's not "all"
    if (category !== "all") {
      url.searchParams.append("category", category);
    }
    
    // Make the API request
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`NewsData.io API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.status === "error") {
      console.error("NewsData.io API error:", data.results);
      throw new Error(data.results?.message || "Unknown error from NewsData.io API");
    }
    
    // Process and return the articles
    return data.results.map((article: any) => ({
      id: article.link || Math.random().toString(36).substring(2, 9),
      title: article.title,
      description: article.description,
      url: article.link,
      image: article.image_url,
      source: article.source_id,
      publishedAt: new Date(article.pubDate).toLocaleDateString(),
      category: article.category?.[0] || "general",
      language: article.language,
      content: article.content,
    }));
  } catch (error) {
    console.error("Error fetching news from NewsData.io:", error);
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
        id: article.uuid || Math.random().toString(36).substring(2, 9),
        title: article.title,
        description: article.description || "No description available",
        url: article.url,
        image: article.image_url || "https://via.placeholder.com/300x200?text=No+Image",
        source: article.source,
        publishedAt: new Date(article.published_at).toLocaleDateString(),
        category: article.categories?.[0] || "general",
        language: article.language || "en",
        content: article.content,
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
 * @returns A Location object or null if no location could be detected
 */
export async function detectLocationWithDeepSeek(
  title: string,
  description: string,
  content?: string
): Promise<Location | null> {
  try {
    // Combine the text for analysis
    const textToAnalyze = `${title}. ${description}${content ? `. ${content}` : ''}`;
    
    // Create a prompt for the DeepSeek API
    const prompt = `
      Analyze the following news article text and extract the primary geographic location mentioned.
      If multiple locations are mentioned, choose the most relevant one.
      If no specific location is mentioned, return null.
      
      Text: "${textToAnalyze}"
      
      Return a JSON object with the following structure:
      {
        "name": "Location Name",
        "latitude": latitude as number,
        "longitude": longitude as number
      }
      
      If no location is found, return null.
    `;
    
    // Call the DeepSeek API
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response
    try {
      // Extract the content from the DeepSeek API response
      const content = data.choices[0].message.content;
      
      // Extract the JSON string from the content (it's wrapped in ```json and ```)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        const locationData = JSON.parse(jsonMatch[1]);
        
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
            longitude: locationData.longitude,
          };
        }
      }
    } catch (parseError) {
      console.error('Failed to parse location data:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting location:', error);
    return null;
  }
} 