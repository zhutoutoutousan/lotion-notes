"use client";

import { useState, useEffect } from "react";
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
import { AlertCircle, Globe, Languages, BookOpen, ArrowRight, Loader2, Newspaper, Search, Download, MapPin } from "lucide-react";
import { 
  NewsArticle, 
  fetchNewsDataArticles, 
  fetchTheNewsAPIArticles, 
  translateWithDeepSeek,
  detectLocationWithDeepSeek
} from "@/services/news-service";
import { openDB, IDBPDatabase } from 'idb';
import NewsMap from "@/components/NewsMap";

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

export default function NewsPage() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("latest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState("newsdata");
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectingAllLocations, setDetectingAllLocations] = useState(false);
  const [allLocationsProgress, setAllLocationsProgress] = useState(0);

  // Fetch articles when search parameters change
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedArticles: NewsArticle[] = [];
        
        if (activeTab === "newsdata") {
          fetchedArticles = await fetchNewsDataArticles(
            searchQuery,
            selectedLanguage,
            selectedCategory
          );
        } else {
          fetchedArticles = await fetchTheNewsAPIArticles(
            searchQuery,
            selectedLanguage,
            selectedCategory
          );
        }
        
        setArticles(fetchedArticles);
      } catch (err) {
        setError("Failed to fetch news articles. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [searchQuery, selectedCategory, selectedLanguage, activeTab]);

  // Handle article selection
  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
    // Reset translation state when selecting a new article
    setTranslationError(null);
    setLocationError(null);
  };

  // Handle location detection
  const handleDetectLocation = async (article: NewsArticle) => {
    if (!article) return;
    
    setDetectingLocation(true);
    setLocationError(null);
    
    try {
      const location = await detectLocationWithDeepSeek(
        article.title,
        article.description,
        article.content
      );
      
      if (location) {
        // Update the article with location data
        const updatedArticle = {
          ...article,
          location
        };
        
        // Update the article in the articles array
        setArticles(articles.map(a => 
          a.id === article.id ? updatedArticle : a
        ));
        
        // Update the selected article if it's the same one
        if (selectedArticle && selectedArticle.id === article.id) {
          setSelectedArticle(updatedArticle);
        }
      } else {
        setLocationError("Could not determine the location for this article.");
      }
    } catch (err) {
      setLocationError("Failed to detect location. Please try again later.");
      console.error(err);
    } finally {
      setDetectingLocation(false);
    }
  };

  // Handle detecting locations for all articles
  const handleDetectAllLocations = async () => {
    if (articles.length === 0) return;
    
    setDetectingAllLocations(true);
    setAllLocationsProgress(0);
    setLocationError(null);
    
    // Create a copy of the articles array
    const updatedArticles = [...articles];
    let progress = 0;
    
    try {
      // Process articles in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, Math.min(i + batchSize, articles.length));
        
        // Process each article in the batch
        await Promise.all(batch.map(async (article) => {
          try {
            // Skip if article already has location data
            if (article.location) {
              progress++;
              setAllLocationsProgress(Math.round((progress / articles.length) * 100));
              return;
            }
            
            const location = await detectLocationWithDeepSeek(
              article.title,
              article.description,
              article.content
            );
            
            if (location) {
              // Update the article with location data
              const updatedArticle = {
                ...article,
                location
              };
              
              // Update the article in the array
              const index = updatedArticles.findIndex(a => a.id === article.id);
              if (index !== -1) {
                updatedArticles[index] = updatedArticle;
              }
              
              // Update the selected article if it's the same one
              if (selectedArticle && selectedArticle.id === article.id) {
                setSelectedArticle(updatedArticle);
              }
            }
          } catch (err) {
            console.error(`Failed to detect location for article: ${article.title}`, err);
          } finally {
            progress++;
            setAllLocationsProgress(Math.round((progress / articles.length) * 100));
          }
        }));
        
        // Update the articles state after each batch
        setArticles(updatedArticles);
        
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      setLocationError("Failed to detect locations for some articles. Please try again later.");
      console.error(err);
    } finally {
      setDetectingAllLocations(false);
      setAllLocationsProgress(0);
    }
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
        translation
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">News Explorer</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search news..."
            value={searchQuery === "latest" ? "" : searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleDetectAllLocations}
            disabled={detectingAllLocations || articles.length === 0}
            className="whitespace-nowrap"
          >
            {detectingAllLocations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {allLocationsProgress}% Complete
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Detect All Locations
              </>
            )}
          </Button>
        </div>
      </div>
      
      {locationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Detection Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="newsdata" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="newsdata">
            <Newspaper className="mr-2 h-4 w-4" />
            NewsData.io
          </TabsTrigger>
          <TabsTrigger value="thenewsapi">
            <Newspaper className="mr-2 h-4 w-4" />
            TheNewsAPI
          </TabsTrigger>
        </TabsList>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TabsContent value="newsdata" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Card 
                      key={article.id} 
                      className={`cursor-pointer transition-colors ${selectedArticle?.id === article.id ? 'border-primary' : ''}`}
                      onClick={() => handleArticleSelect(article)}
                    >
                      <CardHeader>
                        <CardTitle>{article.title}</CardTitle>
                        <CardDescription>
                          {article.source} • {article.publishedAt}
                          {article.location && (
                            <Badge variant="outline" className="ml-2">
                              <MapPin className="mr-1 h-3 w-3" />
                              {article.location.name}
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{article.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                          <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Read More
                          </a>
                        </Button>
                        {!article.location && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDetectLocation(article);
                            }}
                            disabled={detectingLocation}
                          >
                            {detectingLocation ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Detecting Location...
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-2 h-4 w-4" />
                                Detect Location
                              </>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No articles found</AlertTitle>
                  <AlertDescription>
                    Try changing your search query or filters.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="thenewsapi" className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Card 
                      key={article.id} 
                      className={`cursor-pointer transition-colors ${selectedArticle?.id === article.id ? 'border-primary' : ''}`}
                      onClick={() => handleArticleSelect(article)}
                    >
                      <CardHeader>
                        <CardTitle>{article.title}</CardTitle>
                        <CardDescription>
                          {article.source} • {article.publishedAt}
                          {article.location && (
                            <Badge variant="outline" className="ml-2">
                              <MapPin className="mr-1 h-3 w-3" />
                              {article.location.name}
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{article.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                          <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Read More
                          </a>
                        </Button>
                        {!article.location && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDetectLocation(article);
                            }}
                            disabled={detectingLocation}
                          >
                            {detectingLocation ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Detecting Location...
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-2 h-4 w-4" />
                                Detect Location
                              </>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No articles found</AlertTitle>
                  <AlertDescription>
                    Try changing your search query or filters.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </div>
          
          <div className="md:col-span-1 space-y-6">
            {/* News Map Component */}
            <NewsMap 
              articles={articles.filter(article => article.location)} 
              selectedArticle={selectedArticle} 
              onArticleSelect={handleArticleSelect} 
            />
            
            {/* Article Details */}
            {selectedArticle ? (
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                  <CardDescription>
                    {selectedArticle.source} • {selectedArticle.publishedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Title</h3>
                      <p>{selectedArticle.title}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p>{selectedArticle.description}</p>
                    </div>
                    {selectedArticle.content && (
                      <div>
                        <h3 className="font-medium mb-2">Content</h3>
                        <p className="line-clamp-6">{selectedArticle.content}</p>
                      </div>
                    )}
                    
                    {selectedArticle.location && (
                      <div>
                        <h3 className="font-medium mb-2">Location</h3>
                        <Badge variant="outline" className="text-base py-1">
                          <MapPin className="mr-1 h-4 w-4" />
                          {selectedArticle.location.name}
                        </Badge>
                      </div>
                    )}
                    
                    {!selectedArticle.location && (
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleDetectLocation(selectedArticle)}
                          disabled={detectingLocation}
                        >
                          {detectingLocation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Detecting Location...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Detect Location
                            </>
                          )}
                        </Button>
                        {locationError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{locationError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    
                    {selectedArticle.translation ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Translated Text</h3>
                          <p>{selectedArticle.translation.text}</p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Vocabulary</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {selectedArticle.translation.vocabulary.map((item, index) => (
                              <li key={index}>
                                <span className="font-medium">{item.word}</span> → {item.translation}
                                <p className="text-sm text-muted-foreground">{item.example}</p>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            variant="outline" 
                            className="mt-2 w-full"
                            onClick={async () => {
                              if (selectedArticle?.translation?.vocabulary) {
                                const success = await exportVocabulary(
                                  selectedArticle.translation.vocabulary,
                                  selectedLanguage
                                );
                                if (success) {
                                  // Show success message
                                  alert('Vocabulary exported successfully!');
                                } else {
                                  // Show error message
                                  alert('Failed to export vocabulary. Please try again.');
                                }
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Vocabulary
                          </Button>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Grammar Insight</h3>
                          <p>{selectedArticle.translation.grammar}</p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Bilingual Example</h3>
                          <p>{selectedArticle.translation.bilingualExample}</p>
                        </div>
                      </div>
                    ) : selectedArticle.content ? (
                      <div className="space-y-2">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <Button 
                            key={lang.code}
                            onClick={(e) => {
                              e.preventDefault();
                              handleTranslate(lang.code);
                            }} 
                            disabled={translating}
                            className="w-full"
                          >
                            {translating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Translating to {lang.name}...
                              </>
                            ) : (
                              <>
                                <Globe className="mr-2 h-4 w-4" />
                                Translate to {lang.name}
                              </>
                            )}
                          </Button>
                        ))}
                        {translationError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{translationError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                      Read Full Article
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Select an article to view details and translation options.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
} 