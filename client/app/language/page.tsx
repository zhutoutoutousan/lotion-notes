"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  getLanguages, 
  getProficiencyLevels,
  initializeSampleData,
  type Language,
  type ProficiencyLevel
} from "@/lib/services/indexedDBService";
import { LanguageTrainingTracker } from "@/components/LanguageTrainingTracker";
import { LanguageTrainingPlanner } from "@/components/LanguageTrainingPlanner";

// Sample languages in case IndexedDB fails
const FALLBACK_LANGUAGES: Language[] = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { id: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { id: 'ko', name: 'Korean', flag: '🇰🇷' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

export default function LanguageSelectionPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("languages");
  const router = useRouter();
  const { toast } = useToast();

  // Initialize database and load languages
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Initialize the database with sample data
        await initializeSampleData();
        
        // Load languages
        const languagesData = await getLanguages();
        
        if (languagesData && languagesData.length > 0) {
          setLanguages(languagesData);
        } else {
          // Fallback to hardcoded languages if IndexedDB fails
          console.warn("No languages found in IndexedDB, using fallback data");
          setLanguages(FALLBACK_LANGUAGES);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Fallback to hardcoded languages if IndexedDB fails
        setLanguages(FALLBACK_LANGUAGES);
        setError("Failed to load language data from database. Using fallback data.");
        toast({
          title: "Warning",
          description: "Using fallback language data. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadInitialData();
  }, [toast]);

  // Navigate to the selected language page
  const navigateToLanguage = (languageId: string) => {
    router.push(`/language/${languageId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading languages...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your learning experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Language Learning</h1>
      
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="planner">Training Planner</TabsTrigger>
          <TabsTrigger value="tracker">Progress Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="languages">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.map((language) => (
              <Card 
                key={language.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateToLanguage(language.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl">{language.flag}</span>
                    <CardTitle>{language.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Start learning {language.name} today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm text-muted-foreground">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Start Learning</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="planner">
          <LanguageTrainingPlanner languageId="en" />
        </TabsContent>
        
        <TabsContent value="tracker">
          <LanguageTrainingTracker languageId="en" languageName="English" />
        </TabsContent>
      </Tabs>
    </div>
  );
} 