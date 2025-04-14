"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Globe, Languages, BookOpen, ArrowRight, Loader2, Newspaper, Search, Download, MapPin, Calendar, LayoutGrid } from "lucide-react";
import { 
  NewsArticle, 
  fetchNewsDataArticles, 
  fetchTheNewsAPIArticles, 
  translateWithDeepSeek,
  detectLocationWithDeepSeek,
  fetchAllNewsArticles
} from "@/services/news-service";
import { openDB, IDBPDatabase } from 'idb';
import dynamic from 'next/dynamic';
import Image from "next/image";
import NewsCard from '@/components/NewsCard';
import { ArticleDetails } from '@/components/ArticleDetails';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TranslationResult {
  text: string;
  vocabulary?: Array<{
    word: string;
    translation: string;
    example: string;
  }>;
  grammar?: string;
  bilingualExample?: string;
}

interface LocationReasoning {
  analysis: string;
  creative_connection: string;
  metaphor: string;
  confidence: "high" | "medium" | "low";
  alternative_locations: Array<{
    name: string;
    latitude: number;
    longitude: number;
    relevance: string;
  }>;
}

interface LocationWithReasoning {
  name: string;
  latitude: number;
  longitude: number;
  reasoning?: LocationReasoning;
}

// Supported languages for translation
const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

// List of news categories
const CATEGORIES = [
  "all",
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "technology",
  "world",
];

// List of supported languages
const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

// Dynamically import the NewsMap component with no SSR
const NewsMap = dynamic(() => import('@/components/NewsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
});

function NewsPageContent() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState("newsdata");
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [detectingLocations, setDetectingLocations] = useState(false);
  const [locationProgress, setLocationProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'map'>('card');
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [mapSettings, setMapSettings] = useState({
    accumulateArticles: true,
    autoDetectLocations: true,
    showArticleCount: true,
    maxArticles: 100
  });

  // Debounce the search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // New function to detect locations for specific articles
  const detectLocationsForArticles = async (articlesToProcess: NewsArticle[]) => {
    setDetectingLocations(true);
    setLocationProgress(0);

    // Create a copy of the articles array to update incrementally
    const articlesWithLocations = [...articles];
    const totalArticles = articlesToProcess.length;
    
    // Process articles in batches to update the UI more frequently
    const batchSize = 3;
    for (let i = 0; i < totalArticles; i += batchSize) {
      const batch = articlesToProcess.slice(i, Math.min(i + batchSize, totalArticles));
      
      // Process each article in the batch
      await Promise.all(batch.map(async (article, index) => {
        try {
          const location = await detectLocationWithDeepSeek(
            article.title,
            article.description,
            article.content
          );
          
          // Find the index of the article in the full array
          const articleIndex = articlesWithLocations.findIndex(a => a.article_id === article.article_id);
          if (articleIndex !== -1) {
            // Update the article with location data
            articlesWithLocations[articleIndex] = {
              ...articlesWithLocations[articleIndex],
              location
            };
          }
          
          // Update progress
          setLocationProgress(((i + index + 1) / totalArticles) * 100);
          
          // Update the articles state after each article is processed
          setArticles(prevArticles => {
            const updatedArticles = [...prevArticles];
            const existingIndex = updatedArticles.findIndex(a => a.article_id === article.article_id);
            if (existingIndex !== -1) {
              updatedArticles[existingIndex] = {
                ...updatedArticles[existingIndex],
                location
              };
            }
            return updatedArticles;
          });
          setFilteredArticles(prevArticles => {
            const updatedArticles = [...prevArticles];
            const existingIndex = updatedArticles.findIndex(a => a.article_id === article.article_id);
            if (existingIndex !== -1) {
              updatedArticles[existingIndex] = {
                ...updatedArticles[existingIndex],
                location
              };
            }
            return updatedArticles;
          });
        } catch (error) {
          console.error(`Failed to detect location for article ${i + index}:`, error);
        }
      }));
      
      // Add a small delay between batches to avoid overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setDetectingLocations(false);
  };

  // Handle search
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      
      let fetchedArticles: NewsArticle[] = [];
      
      if (searchQuery) {
        fetchedArticles = await fetchNewsDataArticles(
          searchQuery,
          selectedCategory,
          selectedCountry,
          selectedLanguage
        );
      } else {
        fetchedArticles = await fetchAllNewsArticles();
      }
      
      if (viewMode === 'map') {
        if (mapSettings.accumulateArticles) {
          // Create a Set of existing article IDs for quick lookup
          const existingArticleIds = new Set(articles.map(article => article.article_id));
          
          // Filter out articles that are already in the map
          const newArticles = fetchedArticles.filter(article => !existingArticleIds.has(article.article_id));
          
          // Combine existing and new articles, respecting maxArticles limit
          const combinedArticles = [...articles, ...newArticles].slice(-mapSettings.maxArticles);
          
          // Update state with new articles
          setArticles(combinedArticles);
          setFilteredArticles(combinedArticles);
          
          // Only detect locations for new articles if autoDetectLocations is enabled
          if (mapSettings.autoDetectLocations && newArticles.length > 0) {
            await detectLocationsForArticles(newArticles);
          }
        } else {
          // Replace articles if accumulation is disabled
          setArticles(fetchedArticles);
          setFilteredArticles(fetchedArticles);
          if (mapSettings.autoDetectLocations) {
            await detectLocationsForArticles(fetchedArticles);
          }
        }
      } else {
        setArticles(fetchedArticles);
        setFilteredArticles(fetchedArticles);
      }
    } catch (err) {
      setError('Failed to fetch news articles');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch articles when search query changes
  useEffect(() => {
    handleSearch();
  }, [debouncedSearchQuery, selectedCategory, selectedCountry, selectedLanguage]);

  // Filter articles based on filters
  useEffect(() => {
    let filtered = [...articles];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.category?.includes(selectedCategory)
      );
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(article => 
        article.country?.includes(selectedCountry)
      );
    }

    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(article => {
        const articleDate = article.pubDate ? new Date(article.pubDate) : null;
        return articleDate && articleDate >= dateRange.from && articleDate <= dateRange.to;
      });
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, selectedCountry, dateRange]);

  // Get unique categories and countries for filters
  const categories = Array.from(new Set(articles.flatMap(article => article.category || [])));
  const countries = Array.from(new Set(articles.flatMap(article => article.country || [])));

  // Handle article selection
  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
    // Reset translation state when selecting a new article
    setTranslationError(null);
  };

  // Handle translation request
  const handleTranslate = async (targetLanguage: string) => {
    if (!selectedArticle || !selectedArticle.content) return;
    
    setTranslating(true);
    setTranslationError(null);
    
    try {
      const translation = await translateWithDeepSeek(
        selectedArticle.description,
        targetLanguage
      );
      
      setSelectedArticle({
        ...selectedArticle,
        translation: {
          ...selectedArticle.translation,
          description: translation.text,
          vocabulary: translation.vocabulary,
          grammar: translation.grammar,
          bilingualExample: translation.bilingualExample
        }
      });
    } catch (err) {
      setTranslationError("Failed to translate the article. Please try again later.");
      console.error(err);
    } finally {
      setTranslating(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchQuery(value || "latest");
  };

  // Add exportVocabulary function
  const exportVocabulary = async (vocabulary: Array<{ word: string; translation: string; example: string }>, language: string) => {
    try {
      const db = await openDB('lotionNotesDB', 1, {
        upgrade(db: IDBPDatabase) {
          if (!db.objectStoreNames.contains('vocabulary')) {
            db.createObjectStore('vocabulary', { keyPath: 'id', autoIncrement: true });
          }
        },
      });

      const tx = db.transaction('vocabulary', 'readwrite');
      const store = tx.objectStore('vocabulary');

      for (const item of vocabulary) {
        await store.add({
          word: item.word,
          translation: item.translation,
          example: item.example,
          language_id: language,
          difficulty: 'advanced', // Default to advanced since these are from news articles
        });
      }

      await tx.done;
      return true;
    } catch (error) {
      console.error('Error exporting vocabulary:', error);
      return false;
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'card' | 'map') => {
    setViewMode(mode);
    setIsFirstVisit(false);
    // Remove automatic location detection when switching to map view
  };

  if (viewMode === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to News Explorer
            </h1>
            <p className="text-xl text-gray-600">
              Discover news from around the world with our interactive map and card views.
              Explore articles, track global events, and stay informed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="flex items-center gap-2"
              onClick={() => handleViewModeChange('card')}
            >
              <LayoutGrid className="h-5 w-5" />
              Card View
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleViewModeChange('map')}
            >
              <Globe className="h-5 w-5" />
              Map View
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {viewMode === 'map' ? (
          <>
            <NewsMap articles={articles} isDetectingLocations={detectingLocations} />
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Search news..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedLanguage}
                        onValueChange={setSelectedLanguage}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Languages</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Search
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setViewMode('card')}
                        className="flex items-center gap-2"
                      >
                        <LayoutGrid className="h-4 w-4" />
                        Card View
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="accumulate-articles"
                        checked={mapSettings.accumulateArticles}
                        onCheckedChange={(checked) => 
                          setMapSettings(prev => ({ ...prev, accumulateArticles: checked }))
                        }
                        className="bg-gray-200 data-[state=checked]:bg-gray-400"
                      />
                      <Label htmlFor="accumulate-articles" className="text-gray-800 font-medium">Accumulate Articles</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-detect-locations"
                        checked={mapSettings.autoDetectLocations}
                        onCheckedChange={(checked) => 
                          setMapSettings(prev => ({ ...prev, autoDetectLocations: checked }))
                        }
                        className="bg-gray-200 data-[state=checked]:bg-gray-400"
                      />
                      <Label htmlFor="auto-detect-locations" className="text-gray-800 font-medium">Auto-detect Locations</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-article-count"
                        checked={mapSettings.showArticleCount}
                        onCheckedChange={(checked) => 
                          setMapSettings(prev => ({ ...prev, showArticleCount: checked }))
                        }
                        className="bg-gray-200 data-[state=checked]:bg-gray-400"
                      />
                      <Label htmlFor="show-article-count" className="text-gray-800 font-medium">Show Article Count</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="max-articles" className="text-gray-800 font-medium">Max Articles:</Label>
                      <Input
                        id="max-articles"
                        type="number"
                        min="1"
                        max="1000"
                        value={mapSettings.maxArticles}
                        onChange={(e) => 
                          setMapSettings(prev => ({ 
                            ...prev, 
                            maxArticles: Math.min(1000, Math.max(1, parseInt(e.target.value) || 100))
                          }))
                        }
                        className="w-20 bg-gray-200 text-black"
                      />
                    </div>
                    {mapSettings.showArticleCount && (
                      <div className="ml-auto text-sm font-medium text-gray-800">
                        Showing {articles.length} articles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">News Explorer</h1>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  onClick={() => setViewMode('card')}
                  className="flex items-center gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Card View
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  onClick={() => handleViewModeChange('map')}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Map View
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <NewsCard
                  key={article.article_id}
                  article={article}
                  onSelect={() => setSelectedArticle(article)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading news...</p>
        </div>
      </div>
    }>
      <NewsPageContent />
    </Suspense>
  );
} 