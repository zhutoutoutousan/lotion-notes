"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  getLanguages, 
  getProficiencyLevels, 
  getVocabulary, 
  getGrammarSections,
  type Language,
  type ProficiencyLevel,
  type VocabularyItem,
  type GrammarSection,
  type GrammarExercise
} from "@/lib/services/indexedDBService";

// Fallback data in case IndexedDB fails
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

const FALLBACK_LEVELS: ProficiencyLevel[] = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

// Sample vocabulary data
const SAMPLE_VOCABULARY: Record<string, Record<string, VocabularyItem[]>> = {
  'en': {
    'beginner': [
      { id: 1, language_id: 'en', word: 'Hello', translation: 'Hello', example: 'Hello, how are you?', difficulty: 'beginner' },
      { id: 2, language_id: 'en', word: 'Goodbye', translation: 'Goodbye', example: 'Goodbye, see you tomorrow!', difficulty: 'beginner' },
      { id: 3, language_id: 'en', word: 'Thank you', translation: 'Thank you', example: 'Thank you for your help.', difficulty: 'beginner' },
      { id: 4, language_id: 'en', word: 'Please', translation: 'Please', example: 'Please pass me the salt.', difficulty: 'beginner' },
      { id: 5, language_id: 'en', word: 'Yes', translation: 'Yes', example: 'Yes, I understand.', difficulty: 'beginner' },
    ],
    'intermediate': [
      { id: 6, language_id: 'en', word: 'Nevertheless', translation: 'Nevertheless', example: 'Nevertheless, I will try again.', difficulty: 'intermediate' },
      { id: 7, language_id: 'en', word: 'Furthermore', translation: 'Furthermore', example: 'Furthermore, we need to consider other options.', difficulty: 'intermediate' },
      { id: 8, language_id: 'en', word: 'Consequently', translation: 'Consequently', example: 'Consequently, the project was delayed.', difficulty: 'intermediate' },
    ],
    'advanced': [
      { id: 9, language_id: 'en', word: 'Ubiquitous', translation: 'Ubiquitous', example: 'Smartphones are now ubiquitous in modern society.', difficulty: 'advanced' },
      { id: 10, language_id: 'en', word: 'Pragmatic', translation: 'Pragmatic', example: 'We need a pragmatic approach to solve this problem.', difficulty: 'advanced' },
    ],
  },
  'es': {
    'beginner': [
      { id: 11, language_id: 'es', word: 'Hola', translation: 'Hello', example: '¡Hola! ¿Cómo estás?', difficulty: 'beginner' },
      { id: 12, language_id: 'es', word: 'Adiós', translation: 'Goodbye', example: 'Adiós, ¡hasta mañana!', difficulty: 'beginner' },
      { id: 13, language_id: 'es', word: 'Gracias', translation: 'Thank you', example: 'Gracias por tu ayuda.', difficulty: 'beginner' },
      { id: 14, language_id: 'es', word: 'Por favor', translation: 'Please', example: 'Por favor, pásame la sal.', difficulty: 'beginner' },
      { id: 15, language_id: 'es', word: 'Sí', translation: 'Yes', example: 'Sí, entiendo.', difficulty: 'beginner' },
    ],
    'intermediate': [
      { id: 16, language_id: 'es', word: 'Sin embargo', translation: 'However', example: 'Sin embargo, no estoy de acuerdo.', difficulty: 'intermediate' },
      { id: 17, language_id: 'es', word: 'Además', translation: 'Moreover', example: 'Además, necesitamos considerar otras opciones.', difficulty: 'intermediate' },
    ],
    'advanced': [
      { id: 18, language_id: 'es', word: 'Ubicuo', translation: 'Ubiquitous', example: 'Los smartphones son ahora ubicuos en la sociedad moderna.', difficulty: 'advanced' },
    ],
  },
};

// Sample grammar data
const SAMPLE_GRAMMAR: Record<string, Record<string, GrammarSection[]>> = {
  'en': {
    'beginner': [
      {
        id: 1,
        language_id: 'en',
        title: 'Present Simple',
        description: 'Learn how to use the present simple tense',
        difficulty: 'beginner',
        exercises: [
          {
            id: 1,
            section_id: 1,
            question: 'Complete the sentence: She ___ to school every day.',
            options: ['go', 'goes', 'going', 'went'],
            correct: 1
          },
          {
            id: 2,
            section_id: 1,
            question: 'Complete the sentence: They ___ English very well.',
            options: ['speak', 'speaks', 'speaking', 'spoke'],
            correct: 0
          }
        ]
      },
      {
        id: 2,
        language_id: 'en',
        title: 'Past Simple',
        description: 'Learn how to use the past simple tense',
        difficulty: 'beginner',
        exercises: [
          {
            id: 3,
            section_id: 2,
            question: 'Complete the sentence: I ___ to the cinema yesterday.',
            options: ['go', 'goes', 'going', 'went'],
            correct: 3
          },
          {
            id: 4,
            section_id: 2,
            question: 'Complete the sentence: She ___ her homework last night.',
            options: ['do', 'does', 'doing', 'did'],
            correct: 3
          }
        ]
      }
    ],
    'intermediate': [
      {
        id: 3,
        language_id: 'en',
        title: 'Present Perfect',
        description: 'Learn how to use the present perfect tense',
        difficulty: 'intermediate',
        exercises: [
          {
            id: 5,
            section_id: 3,
            question: 'Complete the sentence: I ___ never ___ to Paris.',
            options: ['have', 'has', 'had', 'having'],
            correct: 0
          }
        ]
      }
    ],
    'advanced': [
      {
        id: 4,
        language_id: 'en',
        title: 'Conditionals',
        description: 'Learn how to use conditional sentences',
        difficulty: 'advanced',
        exercises: [
          {
            id: 6,
            section_id: 4,
            question: 'Complete the sentence: If I ___ rich, I would travel the world.',
            options: ['am', 'was', 'were', 'be'],
            correct: 2
          }
        ]
      }
    ]
  },
  'es': {
    'beginner': [
      {
        id: 5,
        language_id: 'es',
        title: 'Presente Simple',
        description: 'Aprende a usar el presente simple',
        difficulty: 'beginner',
        exercises: [
          {
            id: 7,
            section_id: 5,
            question: 'Completa la frase: Ella ___ a la escuela todos los días.',
            options: ['va', 'vas', 'vamos', 'van'],
            correct: 0
          },
          {
            id: 8,
            section_id: 5,
            question: 'Completa la frase: Ellos ___ inglés muy bien.',
            options: ['hablan', 'habla', 'hablamos', 'habláis'],
            correct: 0
          }
        ]
      }
    ],
    'intermediate': [
      {
        id: 6,
        language_id: 'es',
        title: 'Pretérito Indefinido',
        description: 'Aprende a usar el pretérito indefinido',
        difficulty: 'intermediate',
        exercises: [
          {
            id: 9,
            section_id: 6,
            question: 'Completa la frase: Yo ___ al cine ayer.',
            options: ['fui', 'fuiste', 'fue', 'fuimos'],
            correct: 0
          }
        ]
      }
    ]
  }
};

export default function LanguageLearningPage() {
  const params = useParams();
  const router = useRouter();
  const languageId = params.languageId as string;
  
  const [languages, setLanguages] = useState<Language[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState<ProficiencyLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("beginner");
  const [activeTab, setActiveTab] = useState("vocabulary");
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarSection[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<GrammarSection | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load languages and proficiency levels
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load languages and proficiency levels
        const [languagesData, levelsData] = await Promise.all([
          getLanguages(),
          getProficiencyLevels()
        ]);
        
        // Use fallback data if IndexedDB fails
        const languagesToUse = languagesData && languagesData.length > 0 
          ? languagesData 
          : FALLBACK_LANGUAGES;
          
        const levelsToUse = levelsData && levelsData.length > 0
          ? levelsData
          : FALLBACK_LEVELS;
        
        setLanguages(languagesToUse);
        setProficiencyLevels(levelsToUse);
        
        // Check if the language exists
        const languageExists = languagesToUse.some(lang => lang.id === languageId);
        if (!languageExists) {
          toast({
            title: "Language not found",
            description: "The selected language does not exist.",
            variant: "destructive",
          });
          router.push("/language");
          return;
        }
        
        // Set default level if available
        if (levelsToUse.length > 0) {
          setSelectedLevel(levelsToUse[0].id);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Use fallback data
        setLanguages(FALLBACK_LANGUAGES);
        setProficiencyLevels(FALLBACK_LEVELS);
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
  }, [languageId, router, toast]);

  // Load vocabulary and grammar based on selected language and level
  useEffect(() => {
    async function loadLanguageData() {
      if (!languageId || !selectedLevel) return;
      
      setIsLoading(true);
      try {
        // Try to load from IndexedDB first
        const [vocabularyData, grammarData] = await Promise.all([
          getVocabulary(languageId, selectedLevel),
          getGrammarSections(languageId, selectedLevel)
        ]);
        
        // Use fallback data if IndexedDB fails
        const vocabularyToUse = vocabularyData && vocabularyData.length > 0
          ? vocabularyData
          : SAMPLE_VOCABULARY[languageId]?.[selectedLevel] || [];
          
        const grammarToUse = grammarData && grammarData.length > 0
          ? grammarData
          : SAMPLE_GRAMMAR[languageId]?.[selectedLevel] || [];
        
        setVocabulary(vocabularyToUse);
        setGrammar(grammarToUse);
        setCurrentCardIndex(0);
        setShowTranslation(false);
        setCurrentExercise(null);
        setSelectedAnswer(null);
        setShowResult(false);
        
        // Set progress based on user's progress in the database
        // This would be implemented in a real app
        setProgress(0);
      } catch (error) {
        console.error("Error loading language data:", error);
        // Use fallback data
        setVocabulary(SAMPLE_VOCABULARY[languageId]?.[selectedLevel] || []);
        setGrammar(SAMPLE_GRAMMAR[languageId]?.[selectedLevel] || []);
        setError("Failed to load language content from database. Using fallback data.");
        toast({
          title: "Warning",
          description: "Using fallback language content. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadLanguageData();
  }, [languageId, selectedLevel, toast]);

  // Handle next vocabulary card
  const handleNextCard = () => {
    if (currentCardIndex < vocabulary.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowTranslation(false);
    } else {
      // Completed all cards
      toast({
        title: "Congratulations!",
        description: "You've completed all vocabulary cards for this level.",
      });
      setProgress(Math.min(progress + 10, 100));
    }
  };

  // Handle previous vocabulary card
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowTranslation(false);
    }
  };

  // Handle vocabulary card flip
  const handleFlipCard = () => {
    setShowTranslation(!showTranslation);
  };

  // Start a grammar exercise
  const startExercise = (exercise: GrammarSection) => {
    setCurrentExercise(exercise);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Handle answer selection
  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  // Check answer
  const checkAnswer = () => {
    if (selectedAnswer === null || !currentExercise) return;
    
    setShowResult(true);
    if (selectedAnswer === currentExercise.exercises[0].correct) {
      toast({
        title: "Correct!",
        description: "Well done! You got the right answer.",
      });
      setProgress(Math.min(progress + 5, 100));
    } else {
      toast({
        title: "Incorrect",
        description: "Try again! The correct answer was: " + 
          currentExercise.exercises[0].options[currentExercise.exercises[0].correct],
        variant: "destructive",
      });
    }
  };

  // Next exercise
  const nextExercise = () => {
    if (currentExercise && currentExercise.exercises.length > 1) {
      setCurrentExercise({
        ...currentExercise,
        exercises: currentExercise.exercises.slice(1),
      });
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCurrentExercise(null);
      toast({
        title: "Exercise completed!",
        description: "You've completed all exercises in this section.",
      });
      setProgress(Math.min(progress + 15, 100));
    }
  };

  // Get current language
  const currentLanguage = languages.find(lang => lang.id === languageId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading language data...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your learning experience.</p>
        </div>
      </div>
    );
  }

  if (!currentLanguage) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Language not found</h1>
        <p className="mb-4">The language you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/language")}>Back to Language Selection</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          className="mr-4"
          onClick={() => router.push("/language")}
        >
          Back to Languages
        </Button>
        <div className="flex items-center">
          <span className="text-3xl mr-2">{currentLanguage.flag}</span>
          <h1 className="text-3xl font-bold">{currentLanguage.name} Learning</h1>
        </div>
      </div>
      
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Proficiency Level</label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              {proficiencyLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Your Progress</label>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">{progress}% Complete</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="grammar">Grammar</TabsTrigger>
          <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vocabulary">
          {vocabulary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="h-[300px] flex flex-col">
                <CardHeader>
                  <CardTitle>Flashcard {currentCardIndex + 1} of {vocabulary.length}</CardTitle>
                  <CardDescription>
                    {currentLanguage.name} - {proficiencyLevels.find(level => level.id === selectedLevel)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                    onClick={handleFlipCard}
                  >
                    {showTranslation ? (
                      <>
                        <p className="text-2xl font-bold mb-4">{vocabulary[currentCardIndex].translation}</p>
                        <p className="text-sm text-muted-foreground">{vocabulary[currentCardIndex].example}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-4">{vocabulary[currentCardIndex].word}</p>
                        <p className="text-sm text-muted-foreground">Click to see translation</p>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button onClick={handleFlipCard}>
                    {showTranslation ? "Hide Translation" : "Show Translation"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleNextCard}
                    disabled={currentCardIndex === vocabulary.length - 1}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Vocabulary List</CardTitle>
                  <CardDescription>
                    All words for your current level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vocabulary.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`p-2 rounded-md ${index === currentCardIndex ? 'bg-muted' : ''}`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{item.word}</span>
                          <span className="text-muted-foreground">{item.translation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Vocabulary Available</CardTitle>
                <CardDescription>
                  There are no vocabulary items available for the selected language and level.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="grammar">
          {grammar.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentExercise ? (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>{currentExercise.title}</CardTitle>
                    <CardDescription>{currentExercise.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-lg">{currentExercise.exercises[0].question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentExercise.exercises[0].options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedAnswer === index ? "default" : "outline"}
                            className={`w-full ${
                              showResult && index === currentExercise.exercises[0].correct
                                ? "bg-green-500 hover:bg-green-600"
                                : showResult && selectedAnswer === index && selectedAnswer !== currentExercise.exercises[0].correct
                                ? "bg-red-500 hover:bg-red-600"
                                : ""
                            }`}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showResult}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentExercise(null)}
                    >
                      Back to Exercises
                    </Button>
                    {!showResult ? (
                      <Button 
                        onClick={checkAnswer}
                        disabled={selectedAnswer === null}
                      >
                        Check Answer
                      </Button>
                    ) : (
                      <Button onClick={nextExercise}>
                        Next Exercise
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <>
                  {grammar.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">This section contains {section.exercises.length} exercises.</p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => startExercise(section)}>
                          Start Exercises
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Grammar Exercises Available</CardTitle>
                <CardDescription>
                  There are no grammar exercises available for the selected language and level.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="pronunciation">
          <Card>
            <CardHeader>
              <CardTitle>Pronunciation Practice</CardTitle>
              <CardDescription>
                Practice your pronunciation with AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This feature is coming soon! You'll be able to practice your pronunciation
                and receive AI-powered feedback to improve your speaking skills.
              </p>
              <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                <p className="text-muted-foreground">Pronunciation practice module under development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 