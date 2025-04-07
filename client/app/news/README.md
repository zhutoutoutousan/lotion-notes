# News Explorer

The News Explorer is a feature that allows users to browse and read news articles from around the world with built-in translation capabilities.

## Features

- **Multiple News Sources**: Fetch news from NewsData.io and TheNewsAPI
- **Search Functionality**: Search for specific topics or keywords
- **Category Filtering**: Filter news by categories like Business, Entertainment, Health, etc.
- **Language Selection**: View news in different languages
- **Translation**: Translate articles into multiple languages with:
  - Full text translation
  - Vocabulary highlights with examples
  - Grammar insights
  - Bilingual examples

## Supported Languages

- English (en)
- Spanish (es)
- Chinese (zh)
- French (fr)
- German (de)
- Russian (ru)
- Japanese (ja)
- Korean (ko)

## API Keys

To use this feature, you need to set up the following API keys in your environment variables:

```
NEXT_PUBLIC_NEWSDATA_API_KEY=your_newsdata_api_key
NEXT_PUBLIC_THENEWSAPI_API_KEY=your_thenewsapi_api_key
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
```

## Usage

1. Navigate to the `/news` route in the application
2. Use the search bar to find specific news articles
3. Filter by category or language using the dropdown menus
4. Click on an article to view its details and translation
5. Select a target language for translation
6. Explore vocabulary, grammar insights, and bilingual examples

## Implementation Details

The News Explorer is implemented using:

- Next.js for the frontend framework
- React for UI components
- Tailwind CSS for styling
- Radix UI for accessible components
- NewsData.io and TheNewsAPI for news content
- DeepSeek for translations

## File Structure

- `page.tsx`: Main news page component
- `layout.tsx`: Layout component for the news page
- `news-service.ts`: Service for handling API calls and translations 