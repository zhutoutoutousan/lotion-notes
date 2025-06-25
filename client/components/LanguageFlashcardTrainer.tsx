"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createChatCompletion } from "@/lib/deepseek";
import { 
  saveFlashcardSet, 
  getFlashcardSets, 
  updateFlashcard, 
  deleteFlashcardSet,
  getVocabulary,
  type Flashcard,
  type FlashcardSet,
  type VocabularyItem as DBVocabularyItem
} from "@/lib/services/indexedDBService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Check, X, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AnswerFeedback {
  score: number;
  feedback: string;
  isCorrect: boolean;
}

interface LanguageFlashcardTrainerProps {
  languageId: string;
  languageName: string;
}

export function LanguageFlashcardTrainer({ languageId, languageName }: LanguageFlashcardTrainerProps) {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedSets, setSavedSets] = useState<FlashcardSet[]>([]);
  const [vocabularyItems, setVocabularyItems] = useState<DBVocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVocabLoading, setIsVocabLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);

  // Load saved flashcard sets and vocabulary
  useEffect(() => {
    loadSavedSets();
    loadVocabulary();
  }, [languageId]);

  const loadSavedSets = async () => {
    try {
      const sets = await getFlashcardSets(languageId);
      setSavedSets(sets);
    } catch (error) {
      console.error("Error loading flashcard sets:", error);
      toast.error("Failed to load saved flashcard sets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVocabulary = async () => {
    setIsVocabLoading(true);
    try {
      // Load vocabulary for both directions (source to target and target to source)
      const sourceToTarget = await getVocabulary(languageId, 'en', 'beginner');
      const targetToSource = await getVocabulary('en', languageId, 'beginner');
      
      // Combine and shuffle the vocabulary items
      const allItems = [...sourceToTarget, ...targetToSource];
      
      if (allItems.length === 0) {
        toast.info("No vocabulary items found for this language pair. Try adding some vocabulary first.");
        return;
      }
      
      const shuffledItems = allItems.sort(() => Math.random() - 0.5);
      setVocabularyItems(shuffledItems);
    } catch (error) {
      console.error("Error loading vocabulary:", error);
      toast.error("Failed to load vocabulary items");
    } finally {
      setIsVocabLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (numCards < 1 || numCards > 6) {
      toast.error("Please choose between 1 and 6 cards");
      return;
    }

    setIsGenerating(true);
    try {
      const messages: Message[] = [
        {
          role: "system" as const,
          content: `You are a language learning expert. Create ${numCards} flashcards for learning ${languageName}.
            Each flashcard should have:
            1. Front side (in ${languageName})
            2. Back side (translation and explanation in English)
            3. Context or usage example
            
            You must respond with ONLY a valid JSON object in this exact format, nothing else:
            {
              "cards": [
                {
                  "front": "text in ${languageName}",
                  "back": "translation and explanation in English",
                  "context": "example usage or context"
                }
              ]
            }`
        },
        {
          role: "user" as const,
          content: `Create ${numCards} flashcards for learning ${languageName} about: ${topic}. Remember to respond with ONLY the JSON object, no other text.`
        }
      ];

      const response = await createChatCompletion(messages);
      
      // Try to extract JSON from the response if it's not already valid JSON
      let jsonStr = response;
      if (!jsonStr.trim().startsWith('{')) {
        // Try to find JSON object in the response
        const match = response.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        } else {
          throw new Error("Could not find valid JSON in the response");
        }
      }

      // Clean up the JSON string
      jsonStr = jsonStr
        // Handle escaped quotes
        .replace(/\\"/g, '"')
        // Handle double escaped quotes
        .replace(/\\\\/g, '\\')
        // Remove any potential Unicode escape sequences
        .replace(/\\u[\dA-F]{4}/gi, match => 
          String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
        );

      let flashcardsData;
      try {
        // First try direct parsing
        flashcardsData = JSON.parse(jsonStr);
      } catch (firstError) {
        try {
          // If that fails, try parsing after cleaning up newlines and extra spaces
          const cleanedStr = jsonStr
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .replace(/\t/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          flashcardsData = JSON.parse(cleanedStr);
        } catch (secondError) {
          console.error("Failed to parse response. Original:", jsonStr);
          console.error("First parse error:", firstError);
          console.error("Second parse error:", secondError);
          throw new Error("Could not parse the AI response. Please try again.");
        }
      }

      // Validate the response structure
      if (!flashcardsData || !flashcardsData.cards || !Array.isArray(flashcardsData.cards)) {
        throw new Error("Invalid response format: missing cards array");
      }

      // Validate each card
      const validCards = flashcardsData.cards.filter((card: { front: string; back: string; context: string }) => 
        card && 
        typeof card.front === 'string' && 
        typeof card.back === 'string' && 
        typeof card.context === 'string'
      );

      if (validCards.length === 0) {
        throw new Error("No valid cards found in the response");
      }

      if (validCards.length < flashcardsData.cards.length) {
        console.warn(`Some cards were invalid and filtered out. Original: ${flashcardsData.cards.length}, Valid: ${validCards.length}`);
      }

      const newSet: FlashcardSet = {
        id: Date.now().toString(),
        languageId,
        topic,
        cards: validCards.map(card => ({
          id: Math.random().toString(36).substr(2, 9),
          front: card.front.trim(),
          back: card.back.trim(),
          context: card.context.trim(),
          lastReviewed: null,
          nextReview: null,
          repetitions: 0,
          easeFactor: 2.5,
          interval: 0
        })),
        createdAt: new Date(),
        lastReviewed: null
      };

      // Save to IndexedDB
      await saveFlashcardSet(newSet);
      await loadSavedSets();

      setCurrentSet(newSet);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setActiveTab("practice");
      
      toast.success(`Generated ${validCards.length} flashcards successfully!`);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAnswer = async () => {
    if ((!currentSet && !vocabularyItems.length) || !userAnswer.trim()) return;

    setIsChecking(true);
    try {
      // Get the current item based on whether we're practicing flashcards or vocabulary
      const currentItem = activeTab === "practice" 
        ? currentSet!.cards[currentCardIndex]
        : vocabularyItems[currentVocabIndex];

      // Prepare the prompt and answer based on the item type
      const prompt = activeTab === "practice" 
        ? (currentItem as Flashcard).front 
        : (currentItem as DBVocabularyItem).word;
      const correctAnswer = activeTab === "practice" 
        ? (currentItem as Flashcard).back 
        : (currentItem as DBVocabularyItem).translation;
      const context = activeTab === "practice" 
        ? (currentItem as Flashcard).context 
        : (currentItem as DBVocabularyItem).example;

      const systemPrompt = activeTab === "practice" 
        ? `You are a language learning expert and professional ${languageName} teacher evaluating student answers.
            Analyze the answer comprehensively and provide detailed feedback on:

            1. ACCURACY (30%):
            - Exact meaning match
            - Alternative valid expressions
            - Context appropriateness

            2. GRAMMAR (25%):
            - Verb conjugation
            - Tense usage
            - Agreement (gender, number)
            - Word order
            - Sentence structure

            3. VOCABULARY (25%):
            - Word choice
            - Idiomatic expressions
            - Register (formal/informal)
            - Collocations

            4. STYLE & FLUENCY (20%):
            - Natural flow
            - Cultural appropriateness
            - Clarity of expression
            - Elegance of phrasing

            Respond with ONLY a JSON object in this format:
            {
              "score": number (0-100),
              "isCorrect": boolean,
              "feedback": {
                "summary": "brief overall assessment",
                "accuracy": {
                  "score": number (0-30),
                  "comments": "specific feedback"
                },
                "grammar": {
                  "score": number (0-25),
                  "comments": "specific feedback",
                  "corrections": ["list of grammar corrections"]
                },
                "vocabulary": {
                  "score": number (0-25),
                  "comments": "specific feedback",
                  "suggestions": ["list of better word choices if any"]
                },
                "style": {
                  "score": number (0-20),
                  "comments": "specific feedback"
                }
              },
              "improvedAnswer": "corrected version of the answer"
            }`
        : `You are a language learning expert and professional ${languageName} teacher helping students master vocabulary.
            Analyze the student's answer and provide comprehensive feedback and examples.
            
            For this vocabulary item, provide:
            1. ACCURACY (30%):
            - Exact meaning match
            - Alternative translations
            - Context appropriateness
            - Common synonyms and antonyms
            
            2. USAGE (25%):
            - Common collocations
            - Idiomatic expressions
            - Register (formal/informal)
            - Cultural context
            
            3. PRACTICAL EXAMPLES (25%):
            - 3-4 example sentences showing different contexts
            - Real-life situations where this word is commonly used
            - Common phrases or expressions containing this word
            - Variations in meaning based on context
            
            4. CULTURAL & LEARNING TIPS (20%):
            - Cultural nuances
            - Common mistakes to avoid
            - Memory tricks or mnemonics
            - Related vocabulary
            
            Respond with ONLY a JSON object in this format:
            {
              "score": number (0-100),
              "isCorrect": boolean,
              "feedback": {
                "summary": "brief overall assessment",
                "accuracy": {
                  "score": number (0-30),
                  "comments": "specific feedback",
                  "alternatives": ["list of alternative translations"],
                  "synonyms": ["list of synonyms"],
                  "antonyms": ["list of antonyms"]
                },
                "usage": {
                  "score": number (0-25),
                  "comments": "specific feedback",
                  "collocations": ["common word combinations"],
                  "expressions": ["idiomatic expressions"],
                  "register": "formal/informal usage notes"
                },
                "examples": {
                  "score": number (0-25),
                  "sentences": [
                    {
                      "original": "example in ${languageName}",
                      "translation": "English translation",
                      "context": "usage context"
                    }
                  ],
                  "situations": ["real-life usage scenarios"]
                },
                "cultural_tips": {
                  "score": number (0-20),
                  "cultural_notes": ["cultural usage notes"],
                  "common_mistakes": ["mistakes to avoid"],
                  "memory_tricks": ["learning tips"],
                  "related_words": ["related vocabulary"]
                }
              },
              "improvedAnswer": "corrected version of the answer"
            }`;

      const messages: Message[] = [
        {
          role: "system" as const,
          content: systemPrompt
        },
        {
          role: "user" as const,
          content: `Evaluate this ${languageName} answer:
            
            Question/Prompt: "${prompt}"
            Student's answer: "${userAnswer}"
            Context: "${context}"
            Correct answer: "${correctAnswer}"
            
            Provide detailed feedback focusing on ${languageName}-specific language usage.`
        }
      ];

      const response = await createChatCompletion(messages);
      
      let jsonStr = response;
      if (!jsonStr.trim().startsWith('{')) {
        const match = response.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        } else {
          throw new Error("Could not find valid JSON in the response");
        }
      }

      const feedbackData = JSON.parse(jsonStr);
      
      // Calculate total score from components
      const totalScore = activeTab === "practice"
        ? feedbackData.feedback.accuracy.score +
          feedbackData.feedback.grammar.score +
          feedbackData.feedback.vocabulary.score +
          feedbackData.feedback.style.score
        : feedbackData.feedback.accuracy.score +
          feedbackData.feedback.usage.score +
          feedbackData.feedback.examples.score +
          feedbackData.feedback.cultural_tips.score;

      // Format the feedback based on the active tab
      const formattedFeedback = activeTab === "practice"
        ? `
${feedbackData.feedback.summary}

📝 Accuracy (${feedbackData.feedback.accuracy.score}/30):
${feedbackData.feedback.accuracy.comments}

🔤 Grammar (${feedbackData.feedback.grammar.score}/25):
${feedbackData.feedback.grammar.comments}
${feedbackData.feedback.grammar.corrections.length > 0 ? 
  `\nCorrections:\n${feedbackData.feedback.grammar.corrections.map((c: string) => `• ${c}`).join('\n')}` : 
  ''}

📚 Vocabulary (${feedbackData.feedback.vocabulary.score}/25):
${feedbackData.feedback.vocabulary.comments}
${feedbackData.feedback.vocabulary.suggestions.length > 0 ? 
  `\nSuggestions:\n${feedbackData.feedback.vocabulary.suggestions.map((s: string) => `• ${s}`).join('\n')}` : 
  ''}

✨ Style & Fluency (${feedbackData.feedback.style.score}/20):
${feedbackData.feedback.style.comments}

✅ Improved Answer:
${feedbackData.improvedAnswer}`
        : `
${feedbackData.feedback.summary}

📝 Accuracy (${feedbackData.feedback.accuracy.score}/30):
${feedbackData.feedback.accuracy.comments}

Alternative Translations:
${feedbackData.feedback.accuracy.alternatives.map((alt: string) => `• ${alt}`).join('\n')}

Synonyms: ${feedbackData.feedback.accuracy.synonyms.join(', ')}
Antonyms: ${feedbackData.feedback.accuracy.antonyms.join(', ')}

🔤 Usage (${feedbackData.feedback.usage.score}/25):
${feedbackData.feedback.usage.comments}

Common Collocations:
${feedbackData.feedback.usage.collocations.map((col: string) => `• ${col}`).join('\n')}

Expressions:
${feedbackData.feedback.usage.expressions.map((exp: string) => `• ${exp}`).join('\n')}

Register: ${feedbackData.feedback.usage.register}

📚 Examples (${feedbackData.feedback.examples.score}/25):
${feedbackData.feedback.examples.sentences.map((sentence: { original: string; translation: string; context: string }) => 
  `• ${sentence.original}
   ${sentence.translation}
   (${sentence.context})`
).join('\n\n')}

Common Usage Situations:
${feedbackData.feedback.examples.situations.map((sit: string) => `• ${sit}`).join('\n')}

✨ Cultural & Learning Tips (${feedbackData.feedback.cultural_tips.score}/20):
Cultural Notes:
${feedbackData.feedback.cultural_tips.cultural_notes.map((note: string) => `• ${note}`).join('\n')}

Common Mistakes to Avoid:
${feedbackData.feedback.cultural_tips.common_mistakes.map((mistake: string) => `• ${mistake}`).join('\n')}

Memory Tricks:
${feedbackData.feedback.cultural_tips.memory_tricks.map((trick: string) => `• ${trick}`).join('\n')}

Related Words:
${feedbackData.feedback.cultural_tips.related_words.map((word: string) => `• ${word}`).join('\n')}

✅ Improved Answer:
${feedbackData.improvedAnswer}`;

      setFeedback({
        score: totalScore,
        feedback: formattedFeedback,
        isCorrect: feedbackData.isCorrect
      });
      setTotalAttempts(prev => prev + 1);
      setSessionScore(prev => prev + totalScore);
      
      // Update flashcard data with the attempt if we're in practice mode
      if (activeTab === "practice" && currentSet) {
        await updateFlashcard(currentSet.id, (currentItem as Flashcard).id, {
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + (totalScore >= 80 ? 2 : 1) * 24 * 60 * 60 * 1000),
          repetitions: (currentItem as Flashcard).repetitions + 1,
          easeFactor: (currentItem as Flashcard).easeFactor * (
            totalScore >= 90 ? 1.3 :
            totalScore >= 80 ? 1.2 :
            totalScore >= 70 ? 1.1 :
            totalScore >= 60 ? 1 : 0.9
          ),
          interval: (currentItem as Flashcard).interval
        });
      }

      // Show the answer after feedback
      setShowAnswer(true);
    } catch (error) {
      console.error("Error checking answer:", error);
      toast.error("Failed to check answer");
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextCard = async () => {
    if (!currentSet) return;
    
    if (currentCardIndex < currentSet.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      resetCardState();
    } else {
      // End of set
      const averageScore = Math.round(sessionScore / totalAttempts);
      toast.success(`Set completed! Average score: ${averageScore}%`);
      
      try {
        await saveFlashcardSet({
          ...currentSet,
          lastReviewed: new Date()
        });
        await loadSavedSets();
      } catch (error) {
        console.error("Error updating flashcard set:", error);
        toast.error("Failed to update flashcard set");
      }

      setCurrentCardIndex(0);
      resetCardState();
      setSessionScore(0);
      setTotalAttempts(0);
    }
  };

  const handlePrevCard = () => {
    if (!currentSet) return;
    
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteFlashcardSet(setId);
      await loadSavedSets();
      if (currentSet?.id === setId) {
        setCurrentSet(null);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
      toast.success("Flashcard set deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcard set:", error);
      toast.error("Failed to delete flashcard set");
    }
  };

  const handleSelectSet = (set: FlashcardSet) => {
    setCurrentSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setActiveTab("practice");
  };

  const resetCardState = () => {
    setUserAnswer("");
    setFeedback(null);
    setShowAnswer(false);
    setIsFlipped(false);
  };

  const handleSkip = () => {
    setShowAnswer(true);
    setFeedback({
      score: 0,
      feedback: "Card skipped",
      isCorrect: false
    });
  };

  const handleNextVocabCard = () => {
    if (currentVocabIndex < vocabularyItems.length - 1) {
      setCurrentVocabIndex(prev => prev + 1);
      resetCardState();
    } else {
      // End of vocabulary set
      const averageScore = Math.round(sessionScore / totalAttempts);
      toast.success(`Vocabulary practice completed! Average score: ${averageScore}%`);
      setCurrentVocabIndex(0);
      resetCardState();
      setSessionScore(0);
      setTotalAttempts(0);
    }
  };

  const handlePrevVocabCard = () => {
    if (currentVocabIndex > 0) {
      setCurrentVocabIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const renderCard = (card: Flashcard | DBVocabularyItem) => {
    const isFlashcard = 'front' in card;
    const front = isFlashcard ? card.front : card.word;
    const back = isFlashcard ? card.back : card.translation;
    const context = isFlashcard ? card.context : card.example;

    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">{front}</div>
        {showAnswer && (
          <>
            <div className="text-lg">{back}</div>
            {context && (
              <div className="text-sm text-muted-foreground">
                Context: {context}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="saved">Saved Sets</TabsTrigger>
          <TabsTrigger value="practice" disabled={!currentSet}>Practice</TabsTrigger>
          <TabsTrigger value="vocabulary" disabled={vocabularyItems.length === 0}>Vocabulary</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Flashcards</CardTitle>
              <CardDescription>Generate AI-powered flashcards for {languageName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">What would you like to learn?</Label>
                  <Textarea
                    id="topic"
                    placeholder="Enter a topic, theme, or specific words you want to learn..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numCards">Number of Cards</Label>
                  <Select 
                    value={numCards.toString()} 
                    onValueChange={(value) => setNumCards(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of cards" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} cards
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateFlashcards} 
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Flashcard Sets</CardTitle>
              <CardDescription>Review and practice your saved flashcard sets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedSets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flashcard sets yet. Create your first set in the "Create New" tab.
                  </div>
                ) : (
                  savedSets.map(set => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium">{set.topic}</h3>
                        <p className="text-sm text-muted-foreground">
                          {set.cards.length} cards • Last reviewed: {set.lastReviewed ? new Date(set.lastReviewed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSelectSet(set)}
                        >
                          Practice
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteSet(set.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice">
          {currentSet && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{currentSet.topic}</CardTitle>
                      <CardDescription>
                        Card {currentCardIndex + 1} of {currentSet.cards.length}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Session Score</div>
                      <div className="text-2xl font-bold">
                        {totalAttempts > 0 ? Math.round(sessionScore / totalAttempts) : 0}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <motion.div
                      key={currentCardIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <Card className="min-h-[200px]">
                        <CardContent className="p-6">
                          {renderCard(currentSet.cards[currentCardIndex])}
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <Label htmlFor="answer">Your Answer</Label>
                        <Textarea
                          id="answer"
                          placeholder={`Type your answer in ${languageName}...`}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          disabled={showAnswer}
                        />
                      </div>

                      {!showAnswer ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={checkAnswer}
                            disabled={isChecking || !userAnswer.trim()}
                            className="flex-1"
                          >
                            {isChecking ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              "Check Answer"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleSkip}
                          >
                            Skip
                          </Button>
                        </div>
                      ) : (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            {feedback && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Badge variant={feedback.isCorrect ? "default" : "destructive"}>
                                    Score: {feedback.score}%
                                  </Badge>
                                  {feedback.isCorrect && (
                                    <Badge variant="default">
                                      <Award className="h-4 w-4 mr-1" />
                                      Correct!
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm space-y-2">
                                  <div className="font-medium">Feedback:</div>
                                  <div className="text-muted-foreground">{feedback.feedback}</div>
                                </div>
                              </>
                            )}
                            <Button
                              onClick={handleNextCard}
                              className="w-full"
                            >
                              {currentCardIndex === currentSet.cards.length - 1 ? "Finish Set" : "Next Card"}
                            </Button>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Progress 
                    value={(currentCardIndex + 1) / currentSet.cards.length * 100} 
                    className="w-full"
                  />
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vocabulary">
          {isVocabLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : vocabularyItems.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Vocabulary Practice</CardTitle>
                      <CardDescription>
                        Card {currentVocabIndex + 1} of {vocabularyItems.length}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Session Score</div>
                      <div className="text-2xl font-bold">
                        {totalAttempts > 0 ? Math.round(sessionScore / totalAttempts) : 0}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <motion.div
                      key={currentVocabIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <Card className="min-h-[200px]">
                        <CardContent className="p-6">
                          {renderCard(vocabularyItems[currentVocabIndex])}
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <Label htmlFor="answer">Your Answer</Label>
                        <Textarea
                          id="answer"
                          placeholder={`Type your answer in ${languageName}...`}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          disabled={showAnswer}
                        />
                      </div>

                      {!showAnswer ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={checkAnswer}
                            disabled={isChecking || !userAnswer.trim()}
                            className="flex-1"
                          >
                            {isChecking ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              "Check Answer"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleSkip}
                          >
                            Skip
                          </Button>
                        </div>
                      ) : (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            {feedback && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Badge variant={feedback.isCorrect ? "default" : "destructive"}>
                                    Score: {feedback.score}%
                                  </Badge>
                                  {feedback.isCorrect && (
                                    <Badge variant="default">
                                      <Award className="h-4 w-4 mr-1" />
                                      Correct!
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm space-y-2">
                                  <div className="font-medium">Feedback:</div>
                                  <div className="text-muted-foreground whitespace-pre-wrap">{feedback.feedback}</div>
                                </div>
                                
                                {/* Display all vocabulary fields */}
                                <div className="mt-4 space-y-2 border-t pt-4">
                                  <div className="font-medium">Vocabulary Details:</div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-medium">Source Language:</div>
                                    <div>{vocabularyItems[currentVocabIndex].source_language_id}</div>
                                    
                                    <div className="font-medium">Target Language:</div>
                                    <div>{vocabularyItems[currentVocabIndex].target_language_id}</div>
                                    
                                    <div className="font-medium">Word:</div>
                                    <div>{vocabularyItems[currentVocabIndex].word}</div>
                                    
                                    <div className="font-medium">Translation:</div>
                                    <div>{vocabularyItems[currentVocabIndex].translation}</div>
                                    
                                    <div className="font-medium">Example:</div>
                                    <div>{vocabularyItems[currentVocabIndex].example}</div>
                                    
                                    <div className="font-medium">Context:</div>
                                    <div>{vocabularyItems[currentVocabIndex].context}</div>
                                    
                                    <div className="font-medium">Difficulty:</div>
                                    <div>{vocabularyItems[currentVocabIndex].difficulty}</div>
                                  </div>
                                </div>
                              </>
                            )}
                            <Button
                              onClick={handleNextVocabCard}
                              className="w-full"
                            >
                              {currentVocabIndex === vocabularyItems.length - 1 ? "Finish Set" : "Next Card"}
                            </Button>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Progress 
                    value={(currentVocabIndex + 1) / vocabularyItems.length * 100} 
                    className="w-full"
                  />
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">No Vocabulary Available</h2>
              <p className="text-muted-foreground mb-4">
                There are no vocabulary items available for practice. Try adding some vocabulary first.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 