// IndexedDB service for language learning

// Database name and version
const DB_NAME = "language_learning";
const DB_VERSION = 7;

// Store names
export const STORES = {
  LANGUAGES: 'languages',
  PROFICIENCY_LEVELS: 'proficiencyLevels',
  VOCABULARY: 'vocabulary',
  GRAMMAR_SECTIONS: 'grammarSections',
  GRAMMAR_EXERCISES: 'grammarExercises',
  USER_PROGRESS: 'userProgress',
  LIFE_STAGES: 'lifeStages',
  LIFE_PROGRESS: 'lifeProgress',
  HEALTH_REMINDERS: 'healthReminders',
  HEALTH_METRICS: 'healthMetrics',
  NEWS_ARTICLES: 'newsArticles',
  LANGUAGE_TRAINING: 'languageTraining',
  TRAINING_TEMPLATES: 'trainingTemplates',
  DAILY_TRAINING: 'dailyTraining',
  PERSONAL_BESTS: 'personal_bests',
  PERSONAL_BEST_GOALS: 'personal_best_goals'
} as const;

// Add new store name
const STORE_NAMES = {
  LANGUAGES: 'languages',
  PROFICIENCY_LEVELS: 'proficiency_levels',
  VOCABULARY: 'vocabulary',
  USER_PROGRESS: 'user_progress',
  DAILY_TRAINING: 'daily_training'
} as const;

// Types
export interface Language {
  id: string;
  name: string;
  flag: string;
}

export interface ProficiencyLevel {
  id: string;
  name: string;
}

export interface VocabularyItem {
  id: number;
  source_language_id: string;
  target_language_id: string;
  word: string;
  translation: string;
  example: string;
  context: string;
  difficulty: string;
}

export interface GrammarSection {
  id: number;
  language_id: string;
  title: string;
  description: string | null;
  difficulty: string;
  exercises: GrammarExercise[];
}

export interface GrammarExercise {
  id: number;
  section_id: number;
  question: string;
  options: string[];
  correct: number;
  severity: number;
}

export interface UserLanguageProgress {
  id: number;
  user_id: string;
  language_id: string;
  proficiency_level: string;
  vocabulary_progress: number;
  grammar_progress: number;
  pronunciation_progress: number;
}

export interface LifeStage {
  id: number;
  name: string;
  age_range: string;
  description: string;
  social_goals: string[];
  economic_goals: string[];
  emotional_goals: string[];
  milestones: string[];
}

export interface LifeProgress {
  id: number;
  user_id: string;
  stage_id: number;
  social_score: number;
  economic_score: number;
  emotional_score: number;
  completed_milestones: number[];
  notes: string;
  last_updated: Date;
}

export interface HealthReminder {
  id: number;
  user_id: string;
  type: 'dental' | 'medical' | 'fitness' | 'mental';
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  last_completed: Date | null;
  next_due: Date;
  is_active: boolean;
}

export interface HealthCheckup {
  id: number;
  user_id: string;
  type: string;
  date: Date;
  notes: string;
  results: string;
  next_due: Date;
}

export interface NewsArticle {
  article_id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
  category: string;
  language: string;
  country: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    reasoning?: {
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
    };
  };
}

// Add new interfaces for training tracking
export interface TrainingItem {
  language_id: string;
  date: string;
  item_name: string;
  percentage: number;
  minutes: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  description?: string;
  bookmarks: string[];
}

export interface DailyTraining {
  language_id: string;
  date: string;
  total_minutes: number;
  items: TrainingItem[];
}

// Add new types for training templates
export interface TrainingTemplate {
  id: string;
  name: string;
  activities: {
    id: number;
    name: string;
    percentage: number;
    minutes: number;
    status: "Not Started" | "In Progress" | "Completed";
  }[];
  language_id: string;
  created_at: string;
}

export interface Activity {
  name: string;
  percentage: number;
  minutes: number;
  status: "Not Started" | "In Progress" | "Completed";
}

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Error opening database");
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("Database opened successfully");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or upgrade stores
      if (!db.objectStoreNames.contains(STORES.LANGUAGES)) {
        const languageStore = db.createObjectStore(STORES.LANGUAGES, { keyPath: "id" });
        languageStore.createIndex("name", "name", { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.PROFICIENCY_LEVELS)) {
        const proficiencyStore = db.createObjectStore(STORES.PROFICIENCY_LEVELS, { keyPath: "id" });
        proficiencyStore.createIndex("language_id", "language_id", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.VOCABULARY)) {
        const vocabularyStore = db.createObjectStore(STORES.VOCABULARY, { keyPath: "id" });
        vocabularyStore.createIndex("language_id", "language_id", { unique: false });
        vocabularyStore.createIndex("word", "word", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.GRAMMAR_EXERCISES)) {
        const grammarStore = db.createObjectStore(STORES.GRAMMAR_EXERCISES, { keyPath: "id" });
        grammarStore.createIndex("language_id", "language_id", { unique: false });
        grammarStore.createIndex("topic", "topic", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.NEWS_ARTICLES)) {
        const newsStore = db.createObjectStore(STORES.NEWS_ARTICLES, { keyPath: "id" });
        newsStore.createIndex("category", "category", { unique: false });
        newsStore.createIndex("language", "language", { unique: false });
        newsStore.createIndex("country", "country", { unique: false });
        newsStore.createIndex("published_at", "published_at", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DAILY_TRAINING)) {
        const trainingStore = db.createObjectStore(STORES.DAILY_TRAINING, { keyPath: "id" });
        trainingStore.createIndex("language_id", "language_id", { unique: false });
        trainingStore.createIndex("date", "date", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TRAINING_TEMPLATES)) {
        const templatesStore = db.createObjectStore(STORES.TRAINING_TEMPLATES, { keyPath: "id" });
        templatesStore.createIndex("language_id", "language_id", { unique: false });
        templatesStore.createIndex("name", "name", { unique: false });
      }

      // Create personal bests store
      if (!db.objectStoreNames.contains(STORES.PERSONAL_BESTS)) {
        const personalBestsStore = db.createObjectStore(STORES.PERSONAL_BESTS, { keyPath: 'id' });
        personalBestsStore.createIndex('category', 'category', { unique: false });
        personalBestsStore.createIndex('type', 'type', { unique: false });
      }

      // Create personal best goals store
      if (!db.objectStoreNames.contains(STORES.PERSONAL_BEST_GOALS)) {
        const personalBestGoalsStore = db.createObjectStore(STORES.PERSONAL_BEST_GOALS, { keyPath: 'id' });
        personalBestGoalsStore.createIndex('personalBestId', 'personalBestId', { unique: false });
        personalBestGoalsStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

// Generic function to get all items from a store
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

// Generic function to get items from a store by index
async function getItemsByIndex<T>(
  storeName: string, 
  indexName: string, 
  value: any
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName} by ${indexName}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

// Generic function to get items from a store by compound index
async function getItemsByCompoundIndex<T>(
  storeName: string, 
  indexName: string, 
  values: any[]
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(values);

    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName} by ${indexName}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

// Generic function to add items to a store
async function addItemsToStore<T>(storeName: string, items: T[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    let completed = 0;
    const total = items.length;
    
    if (total === 0) {
      resolve();
      return;
    }
    
    items.forEach(item => {
      const request = store.add(item);
      
      request.onerror = () => {
        reject(new Error(`Failed to add item to ${storeName}`));
      };
      
      request.onsuccess = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };
    });
  });
}

// Language learning specific functions

// Get all languages
export async function getLanguages(): Promise<Language[]> {
  return getAllFromStore<Language>(STORES.LANGUAGES);
}

// Get all proficiency levels
export async function getProficiencyLevels(): Promise<ProficiencyLevel[]> {
  return getAllFromStore<ProficiencyLevel>(STORES.PROFICIENCY_LEVELS);
}

// Get vocabulary for a specific language pair and difficulty
export async function getVocabulary(
  sourceLanguageId: string,
  targetLanguageId: string,
  difficulty: string
): Promise<VocabularyItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.VOCABULARY, "readonly");
    const store = transaction.objectStore(STORES.VOCABULARY);
    const index = store.index("language_pair_difficulty");
    
    // Ensure all values are strings and not null/undefined
    if (!sourceLanguageId || !targetLanguageId || !difficulty) {
      reject(new Error("Invalid parameters: sourceLanguageId, targetLanguageId, and difficulty must be non-empty strings"));
      return;
    }

    // Create a key range for the compound index with valid key types
    const keyRange = IDBKeyRange.only([
      String(sourceLanguageId),
      String(targetLanguageId),
      String(difficulty)
    ]);
    
    const request = index.getAll(keyRange);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get vocabulary items"));
    };
  });
}

// Get grammar sections for a specific language and difficulty
export async function getGrammarSections(
  languageId: string, 
  difficulty: string
): Promise<GrammarSection[]> {
  // First get all grammar sections for the language
  const allSections = await getItemsByIndex<GrammarSection>(
    STORES.GRAMMAR_SECTIONS, 
    'language_id', 
    languageId
  );
  
  // Then filter by difficulty
  const filteredSections = allSections.filter(section => section.difficulty === difficulty);
  
  // Get exercises for each section
  const sectionsWithExercises = await Promise.all(
    filteredSections.map(async (section) => {
      const exercises = await getGrammarExercises(section.id);
      return {
        ...section,
        exercises,
      };
    })
  );
  
  return sectionsWithExercises;
}

// Get grammar exercises for a specific section
export async function getGrammarExercises(sectionId: number): Promise<GrammarExercise[]> {
  return getItemsByIndex<GrammarExercise>(
    STORES.GRAMMAR_EXERCISES, 
    'section_id', 
    sectionId
  );
}

// Get user's language progress
export async function getUserLanguageProgress(
  userId: string, 
  languageId: string
): Promise<UserLanguageProgress | null> {
  const progress = await getItemsByCompoundIndex<UserLanguageProgress>(
    STORES.USER_PROGRESS, 
    'user_language', 
    [userId, languageId]
  );
  
  return progress.length > 0 ? progress[0] : null;
}

// Update user's language progress
export async function updateUserLanguageProgress(
  userId: string, 
  languageId: string, 
  proficiencyLevel: string, 
  progress: {
    vocabulary_progress?: number;
    grammar_progress?: number;
    pronunciation_progress?: number;
  }
): Promise<boolean> {
  const db = await initDB();
  
  // Check if progress record exists
  const existingProgress = await getUserLanguageProgress(userId, languageId);
  
  if (existingProgress) {
    // Update existing record
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.USER_PROGRESS, 'readwrite');
      const store = transaction.objectStore(STORES.USER_PROGRESS);
      
      const updatedProgress = {
        ...existingProgress,
        ...progress,
        proficiency_level: proficiencyLevel,
      };
      
      const request = store.put(updatedProgress);
      
      request.onerror = () => {
        reject(new Error('Failed to update user progress'));
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
    });
  } else {
    // Create new record
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.USER_PROGRESS, 'readwrite');
      const store = transaction.objectStore(STORES.USER_PROGRESS);
      
      const newProgress: UserLanguageProgress = {
        id: 0, // Will be auto-generated
        user_id: userId,
        language_id: languageId,
        proficiency_level: proficiencyLevel,
        vocabulary_progress: progress.vocabulary_progress || 0,
        grammar_progress: progress.grammar_progress || 0,
        pronunciation_progress: progress.pronunciation_progress || 0,
      };
      
      const request = store.add(newProgress);
      
      request.onerror = () => {
        reject(new Error('Failed to create user progress'));
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
    });
  }
}

// Initialize with sample data
export async function initializeSampleData(): Promise<void> {
  try {
    const db = await initDB();
    
    // Check if languages already exist
    const languages = await getAllFromStore<Language>(STORES.LANGUAGES);
    
    if (languages.length === 0) {
      console.log("Initializing sample languages");
      try {
        // Add sample languages
        const sampleLanguages: Language[] = [
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
        
        await addItemsToStore(STORES.LANGUAGES, sampleLanguages);
        console.log("Successfully added sample languages");
      } catch (error) {
        console.error("Error adding languages:", error);
        throw error;
      }
      
      try {
        // Add sample proficiency levels
        const sampleLevels: ProficiencyLevel[] = [
          { id: 'beginner', name: 'Beginner' },
          { id: 'intermediate', name: 'Intermediate' },
          { id: 'advanced', name: 'Advanced' },
        ];
        
        await addItemsToStore(STORES.PROFICIENCY_LEVELS, sampleLevels);
        console.log("Successfully added proficiency levels");
      } catch (error) {
        console.error("Error adding proficiency levels:", error);
        throw error;
      }
      
      // Add sample vocabulary for English
      const sampleVocabulary: VocabularyItem[] = [
        {
          id: 1,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Hello',
          translation: 'Hola',
          example: 'Hello, how are you?',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 2,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Goodbye',
          translation: 'Adiós',
          example: 'Goodbye, see you tomorrow!',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 3,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Thank you',
          translation: 'Gracias',
          example: 'Thank you for your help',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 4,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Please',
          translation: 'Por favor',
          example: 'Please pass the salt',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 5,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Sorry',
          translation: 'Lo siento',
          example: 'I am sorry for being late',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 6,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Yes',
          translation: 'Sí',
          example: 'Yes, I understand',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 7,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'No',
          translation: 'No',
          example: 'No, I don\'t want to go',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 8,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Maybe',
          translation: 'Quizás',
          example: 'Maybe we can meet tomorrow',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 9,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Help',
          translation: 'Ayuda',
          example: 'I need help with this problem',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 10,
          source_language_id: 'en',
          target_language_id: 'es',
          word: 'Water',
          translation: 'Agua',
          example: 'Can I have some water, please?',
          context: '',
          difficulty: 'beginner'
        }
      ];
      
      await addItemsToStore(STORES.VOCABULARY, sampleVocabulary);
      
      // Add sample vocabulary for Spanish
      const spanishVocabulary: VocabularyItem[] = [
        {
          id: 11,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Hola',
          translation: 'Hello',
          example: 'Hola, ¿cómo estás?',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 12,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Adiós',
          translation: 'Goodbye',
          example: 'Adiós, hasta mañana',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 13,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Gracias',
          translation: 'Thank you',
          example: 'Gracias por tu ayuda',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 14,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Por favor',
          translation: 'Please',
          example: 'Por favor, pásame la sal',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 15,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Lo siento',
          translation: 'Sorry',
          example: 'Lo siento por llegar tarde',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 16,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Sí',
          translation: 'Yes',
          example: 'Sí, entiendo',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 17,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'No',
          translation: 'No',
          example: 'No, no quiero ir',
          context: '',
          difficulty: 'beginner'
        },
        {
          id: 18,
          source_language_id: 'es',
          target_language_id: 'en',
          word: 'Quizás',
          translation: 'Maybe',
          example: 'Quizás nos vemos mañana',
          context: '',
          difficulty: 'beginner'
        }
      ];
      
      await addItemsToStore(STORES.VOCABULARY, spanishVocabulary);
      
      // Add sample grammar sections for English
      const englishGrammarSections: GrammarSection[] = [
        {
          id: 3,
          language_id: 'en',
          title: 'Present Simple',
          description: 'Learn how to use the present simple tense',
          difficulty: 'beginner',
          exercises: [
            {
              id: 19,
              section_id: 3,
              severity: 1,
              question: 'Complete the sentence: She ___ to school every day.',
              options: ['go', 'goes', 'going', 'went'],
              correct: 1
            },
            {
              id: 20,
              section_id: 3,
              severity: 1,
              question: 'Complete the sentence: They ___ English very well.',
              options: ['speak', 'speaks', 'speaking', 'spoke'],
              correct: 0
            }
          ]
        },
        {
          id: 4,
          language_id: 'en',
          title: 'Past Simple',
          description: 'Learn how to use the past simple tense',
          difficulty: 'beginner',
          exercises: [
            {
              id: 21,
              section_id: 4,
              severity: 1,
              question: 'Complete the sentence: I ___ to the cinema yesterday.',
              options: ['go', 'goes', 'going', 'went'],
              correct: 3
            },
            {
              id: 22,
              section_id: 4,
              severity: 1,
              question: 'Complete the sentence: She ___ her homework last night.',
              options: ['do', 'does', 'doing', 'did'],
              correct: 3
            }
          ]
        },
        {
          id: 5,
          language_id: 'en',
          title: 'Present Perfect',
          description: 'Learn how to use the present perfect tense',
          difficulty: 'intermediate',
          exercises: [
            {
              id: 23,
              section_id: 5,
              severity: 1,
              question: 'Complete the sentence: I ___ never ___ to Paris.',
              options: ['have', 'has', 'had', 'having'],
              correct: 0
            }
          ]
        },
        {
          id: 6,
          language_id: 'en',
          title: 'Conditionals',
          description: 'Learn how to use conditional sentences',
          difficulty: 'advanced',
          exercises: [
            {
              id: 24,
              section_id: 6,
              severity: 1,
              question: 'Complete the sentence: If I ___ rich, I would travel the world.',
              options: ['am', 'was', 'were', 'be'],
              correct: 2
            }
          ]
        }
      ];
      
      for (const section of englishGrammarSections) {
        const sectionId = await addItemsToStore(STORES.GRAMMAR_SECTIONS, [section]);
        
        for (const exercise of section.exercises) {
          await addItemsToStore(STORES.GRAMMAR_EXERCISES, [exercise]);
        }
      }
      
      // Add sample grammar sections for Spanish
      const spanishGrammarSections: GrammarSection[] = [
        {
          id: 7,
          language_id: 'es',
          title: 'Presente Simple',
          description: 'Aprende a usar el presente simple',
          difficulty: 'beginner',
          exercises: [
            {
              id: 25,
              section_id: 7,
              severity: 1,
              question: 'Completa la frase: Ella ___ a la escuela todos los días.',
              options: ['va', 'vas', 'vamos', 'van'],
              correct: 0
            },
            {
              id: 26,
              section_id: 7,
              severity: 1,
              question: 'Completa la frase: Ellos ___ inglés muy bien.',
              options: ['hablan', 'habla', 'hablamos', 'habláis'],
              correct: 0
            }
          ]
        },
        {
          id: 8,
          language_id: 'es',
          title: 'Pretérito Indefinido',
          description: 'Aprende a usar el pretérito indefinido',
          difficulty: 'intermediate',
          exercises: [
            {
              id: 27,
              section_id: 8,
              severity: 1,
              question: 'Completa la frase: Yo ___ al cine ayer.',
              options: ['fui', 'fuiste', 'fue', 'fuimos'],
              correct: 0
            }
          ]
        }
      ];
      
      for (const section of spanishGrammarSections) {
        const sectionId = await addItemsToStore(STORES.GRAMMAR_SECTIONS, [section]);
        
        for (const exercise of section.exercises) {
          await addItemsToStore(STORES.GRAMMAR_EXERCISES, [exercise]);
        }
      }
      
      // Add sample grammar exercises
      const grammarExercises: GrammarExercise[] = [
        {
          id: 10,
          section_id: 2,
          severity: 1,
          question: 'Which is the correct form of "to be" in past tense?',
          options: ['era', 'estaba', 'tenía', 'había'],
          correct: 0
        },
        {
          id: 11,
          section_id: 2,
          severity: 1,
          question: 'What is the correct form of "to have" in past tense?',
          options: ['era', 'estaba', 'tenía', 'había'],
          correct: 2
        },
        {
          id: 12,
          section_id: 2,
          severity: 1,
          question: 'Which verb means "to go" in past tense?',
          options: ['iba', 'venía', 'salía', 'entraba'],
          correct: 0
        },
        {
          id: 13,
          section_id: 2,
          severity: 1,
          question: 'What is the correct form of "to do/make" in past tense?',
          options: ['hacía', 'decía', 'ponía', 'traía'],
          correct: 0
        },
        {
          id: 14,
          section_id: 2,
          severity: 1,
          question: 'Which verb means "to want" in past tense?',
          options: ['quería', 'podía', 'sabía', 'conocía'],
          correct: 0
        },
        {
          id: 15,
          section_id: 2,
          severity: 1,
          question: 'What is the correct form of "to know" in past tense?',
          options: ['sabía', 'conocía', 'entendía', 'aprendía'],
          correct: 0
        },
        {
          id: 16,
          section_id: 2,
          severity: 1,
          question: 'Which verb means "to be able to" in past tense?',
          options: ['podía', 'quería', 'necesitaba', 'debía'],
          correct: 0
        },
        {
          id: 17,
          section_id: 2,
          severity: 1,
          question: 'What is the correct form of "to need" in past tense?',
          options: ['necesitaba', 'debía', 'tenía que', 'podía'],
          correct: 0
        },
        {
          id: 18,
          section_id: 2,
          severity: 1,
          question: 'Which verb means "to have to" in past tense?',
          options: ['tenía que', 'debía', 'necesitaba', 'podía'],
          correct: 0
        }
      ];
      
      for (const exercise of grammarExercises) {
        await addItemsToStore(STORES.GRAMMAR_EXERCISES, [exercise]);
      }
      
      // Add more grammar exercises
      const moreGrammarExercises: GrammarExercise[] = [
        {
          id: 10,
          section_id: 1,
          severity: 1,
          question: 'Which is the correct form of "to be" in present tense?',
          options: ['ser', 'estar', 'tener', 'haber'],
          correct: 0
        },
        {
          id: 11,
          section_id: 1,
          severity: 1,
          question: 'What is the correct form of "to have" in present tense?',
          options: ['ser', 'estar', 'tener', 'haber'],
          correct: 2
        },
        {
          id: 12,
          section_id: 1,
          severity: 1,
          question: 'Which verb means "to go"?',
          options: ['ir', 'venir', 'salir', 'entrar'],
          correct: 0
        },
        {
          id: 13,
          section_id: 1,
          severity: 1,
          question: 'What is the correct form of "to do/make"?',
          options: ['hacer', 'decir', 'poner', 'traer'],
          correct: 0
        },
        {
          id: 14,
          section_id: 1,
          severity: 1,
          question: 'Which verb means "to want"?',
          options: ['querer', 'poder', 'saber', 'conocer'],
          correct: 0
        },
        {
          id: 15,
          section_id: 1,
          severity: 1,
          question: 'What is the correct form of "to know"?',
          options: ['saber', 'conocer', 'entender', 'aprender'],
          correct: 0
        },
        {
          id: 16,
          section_id: 1,
          severity: 1,
          question: 'Which verb means "to be able to"?',
          options: ['poder', 'querer', 'necesitar', 'deber'],
          correct: 0
        },
        {
          id: 17,
          section_id: 1,
          severity: 1,
          question: 'What is the correct form of "to need"?',
          options: ['necesitar', 'deber', 'tener que', 'poder'],
          correct: 0
        },
        {
          id: 18,
          section_id: 1,
          severity: 1,
          question: 'Which verb means "to have to"?',
          options: ['tener que', 'deber', 'necesitar', 'poder'],
          correct: 0
        }
      ];
      
      for (const exercise of moreGrammarExercises) {
        await addItemsToStore(STORES.GRAMMAR_EXERCISES, [exercise]);
      }
      
      console.log("Sample data initialized successfully");
    } else {
      console.log("Sample data already exists, skipping initialization");
    }
  } catch (error) {
    console.error("Error initializing sample data:", error);
    throw error;
  }
}

export async function addVocabulary(data: {
  word: string;
  translation: string;
  example: string;
  context: string;
  source_language_id: string;
  target_language_id: string;
}): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.VOCABULARY, 'readwrite');
    const store = transaction.objectStore(STORES.VOCABULARY);
    
    const vocabularyItem = {
      ...data,
      difficulty: 'beginner' // Default difficulty
    };
    
    const request = store.add(vocabularyItem);
    
    request.onerror = () => {
      reject(new Error('Failed to add vocabulary'));
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

// News articles functions
export async function saveNewsArticles(articles: NewsArticle[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.NEWS_ARTICLES, 'readwrite');
    const store = transaction.objectStore(STORES.NEWS_ARTICLES);
    
    let completed = 0;
    const total = articles.length;
    
    if (total === 0) {
      resolve();
      return;
    }
    
    articles.forEach(article => {
      const request = store.put(article);
      
      request.onerror = () => {
        reject(new Error(`Failed to save article ${article.article_id}`));
      };
      
      request.onsuccess = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };
    });
  });
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  return getAllFromStore<NewsArticle>(STORES.NEWS_ARTICLES);
}

export async function clearNewsArticles(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.NEWS_ARTICLES, 'readwrite');
    const store = transaction.objectStore(STORES.NEWS_ARTICLES);
    const request = store.clear();
    
    request.onerror = () => {
      reject(new Error('Failed to clear news articles'));
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

// Add new functions for training planner
export async function saveDailyTraining(training: DailyTraining): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      // Check if the store exists
      if (!db.objectStoreNames.contains("dailyTraining")) {
        throw new Error("dailyTraining store does not exist");
      }

      const transaction = db.transaction(["dailyTraining"], 'readwrite');
      const store = transaction.objectStore("dailyTraining");
      
      // Add an id to the training data
      const trainingWithId = {
        ...training,
        id: `${training.language_id}_${training.date}` // Create a unique id
      };
      
      const request = store.put(trainingWithId);
      
      request.onsuccess = () => {
        console.log("Training plan saved successfully");
        resolve();
      };
      
      request.onerror = () => {
        console.error("Error saving training plan:", request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error("Error in saveDailyTraining:", error);
      reject(error);
    }
  });
}

export async function getDailyTraining(languageId: string, date: string): Promise<DailyTraining | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains("dailyTraining")) {
        throw new Error("dailyTraining store does not exist");
      }

      const transaction = db.transaction(["dailyTraining"], 'readonly');
      const store = transaction.objectStore("dailyTraining");
      
      const id = `${languageId}_${date}`;
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove the id before returning
          const { id, ...training } = result;
          resolve(training);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error("Error getting training plan:", request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error("Error in getDailyTraining:", error);
      reject(error);
    }
  });
}

export async function getTrainingHistory(languageId: string): Promise<DailyTraining[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains("dailyTraining")) {
        throw new Error("dailyTraining store does not exist");
      }

      const transaction = db.transaction(["dailyTraining"], 'readonly');
      const store = transaction.objectStore("dailyTraining");
      
      const index = store.index("language_id");
      const request = index.getAll(languageId);
      
      request.onsuccess = () => {
        const results = request.result.map(({ id, ...training }) => training);
        resolve(results);
      };
      
      request.onerror = () => {
        console.error("Error getting training history:", request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error("Error in getTrainingHistory:", error);
      reject(error);
    }
  });
}

// Training template functions
export async function saveTrainingTemplate(template: Omit<TrainingTemplate, "id" | "created_at">): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TRAINING_TEMPLATES, 'readwrite');
    const store = transaction.objectStore(STORES.TRAINING_TEMPLATES);
    
    const templateWithId = {
      ...template,
      id: `${template.language_id}_${template.name}_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    const request = store.add(templateWithId);
    
    request.onerror = () => {
      reject(new Error('Failed to save training template'));
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getTrainingTemplates(languageId: string): Promise<TrainingTemplate[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TRAINING_TEMPLATES, 'readonly');
    const store = transaction.objectStore(STORES.TRAINING_TEMPLATES);
    const index = store.index("language_id");
    const request = index.getAll(languageId);

    request.onerror = () => {
      reject(new Error('Failed to get training templates'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export async function deleteTrainingTemplate(templateId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TRAINING_TEMPLATES, 'readwrite');
    const store = transaction.objectStore(STORES.TRAINING_TEMPLATES);
    const request = store.delete(templateId);

    request.onerror = () => {
      reject(new Error('Failed to delete training template'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
} 