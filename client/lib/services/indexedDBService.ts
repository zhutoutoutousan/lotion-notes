// IndexedDB service for language learning

// Database name and version
const DB_NAME = 'lotionNotesDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  LANGUAGES: 'languages',
  PROFICIENCY_LEVELS: 'proficiencyLevels',
  VOCABULARY: 'vocabulary',
  GRAMMAR_SECTIONS: 'grammarSections',
  GRAMMAR_EXERCISES: 'grammarExercises',
  USER_PROGRESS: 'userProgress'
};

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
  language_id: string;
  word: string;
  translation: string;
  example: string | null;
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

// Initialize the database
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Failed to open database:", event);
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log("Database opened successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log("Database upgrade needed");
      
      // Check if stores already exist before creating them
      const existingStores = Array.from(db.objectStoreNames);
      console.log("Existing stores:", existingStores);
      
      // Create object stores only if they don't exist
      if (!existingStores.includes(STORES.LANGUAGES)) {
        console.log("Creating languages store");
        const languagesStore = db.createObjectStore(STORES.LANGUAGES, { keyPath: "id" });
        languagesStore.createIndex("name", "name", { unique: true });
      }
      
      if (!existingStores.includes(STORES.PROFICIENCY_LEVELS)) {
        console.log("Creating proficiency levels store");
        const proficiencyLevelsStore = db.createObjectStore(STORES.PROFICIENCY_LEVELS, { keyPath: "id" });
        proficiencyLevelsStore.createIndex("name", "name", { unique: true });
      }
      
      if (!existingStores.includes(STORES.VOCABULARY)) {
        console.log("Creating vocabulary store");
        const vocabularyStore = db.createObjectStore(STORES.VOCABULARY, { keyPath: "id", autoIncrement: true });
        vocabularyStore.createIndex("language_id", "language_id", { unique: false });
        vocabularyStore.createIndex("difficulty", "difficulty", { unique: false });
        vocabularyStore.createIndex("language_difficulty", ["language_id", "difficulty"], { unique: false });
      }
      
      if (!existingStores.includes(STORES.GRAMMAR_SECTIONS)) {
        console.log("Creating grammar sections store");
        const grammarSectionsStore = db.createObjectStore(STORES.GRAMMAR_SECTIONS, { keyPath: "id", autoIncrement: true });
        grammarSectionsStore.createIndex("language_id", "language_id", { unique: false });
        grammarSectionsStore.createIndex("difficulty", "difficulty", { unique: false });
        grammarSectionsStore.createIndex("language_difficulty", ["language_id", "difficulty"], { unique: false });
      }
      
      if (!existingStores.includes(STORES.GRAMMAR_EXERCISES)) {
        console.log("Creating grammar exercises store");
        const grammarExercisesStore = db.createObjectStore(STORES.GRAMMAR_EXERCISES, { keyPath: "id", autoIncrement: true });
        grammarExercisesStore.createIndex("section_id", "section_id", { unique: false });
      }
      
      if (!existingStores.includes(STORES.USER_PROGRESS)) {
        console.log("Creating user progress store");
        const userProgressStore = db.createObjectStore(STORES.USER_PROGRESS, { keyPath: "id", autoIncrement: true });
        userProgressStore.createIndex("user_id", "user_id", { unique: false });
        userProgressStore.createIndex("language_id", "language_id", { unique: false });
        userProgressStore.createIndex("user_language", ["user_id", "language_id"], { unique: true });
      }
    };
  });
}

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

// Get vocabulary for a specific language and difficulty
export async function getVocabulary(
  languageId: string, 
  difficulty: string
): Promise<VocabularyItem[]> {
  // First get all vocabulary for the language
  const allVocabulary = await getItemsByIndex<VocabularyItem>(
    STORES.VOCABULARY, 
    'language_id', 
    languageId
  );
  
  // Then filter by difficulty
  return allVocabulary.filter(item => item.difficulty === difficulty);
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
      
      // Add sample proficiency levels
      const sampleLevels: ProficiencyLevel[] = [
        { id: 'beginner', name: 'Beginner' },
        { id: 'intermediate', name: 'Intermediate' },
        { id: 'advanced', name: 'Advanced' },
      ];
      
      await addItemsToStore(STORES.PROFICIENCY_LEVELS, sampleLevels);
      
      // Add sample vocabulary for English
      const englishVocabulary: VocabularyItem[] = [
        { language_id: 'en', word: 'Hello', translation: 'Hello', example: 'Hello, how are you?', difficulty: 'beginner' },
        { language_id: 'en', word: 'Goodbye', translation: 'Goodbye', example: 'Goodbye, see you tomorrow!', difficulty: 'beginner' },
        { language_id: 'en', word: 'Thank you', translation: 'Thank you', example: 'Thank you for your help.', difficulty: 'beginner' },
        { language_id: 'en', word: 'Please', translation: 'Please', example: 'Please pass me the salt.', difficulty: 'beginner' },
        { language_id: 'en', word: 'Yes', translation: 'Yes', example: 'Yes, I understand.', difficulty: 'beginner' },
        { language_id: 'en', word: 'Nevertheless', translation: 'Nevertheless', example: 'Nevertheless, I will try again.', difficulty: 'intermediate' },
        { language_id: 'en', word: 'Furthermore', translation: 'Furthermore', example: 'Furthermore, we need to consider other options.', difficulty: 'intermediate' },
        { language_id: 'en', word: 'Consequently', translation: 'Consequently', example: 'Consequently, the project was delayed.', difficulty: 'intermediate' },
        { language_id: 'en', word: 'Ubiquitous', translation: 'Ubiquitous', example: 'Smartphones are now ubiquitous in modern society.', difficulty: 'advanced' },
        { language_id: 'en', word: 'Pragmatic', translation: 'Pragmatic', example: 'We need a pragmatic approach to solve this problem.', difficulty: 'advanced' },
      ];
      
      await addItemsToStore(STORES.VOCABULARY, englishVocabulary);
      
      // Add sample vocabulary for Spanish
      const spanishVocabulary: VocabularyItem[] = [
        { language_id: 'es', word: 'Hola', translation: 'Hello', example: '¡Hola! ¿Cómo estás?', difficulty: 'beginner' },
        { language_id: 'es', word: 'Adiós', translation: 'Goodbye', example: 'Adiós, ¡hasta mañana!', difficulty: 'beginner' },
        { language_id: 'es', word: 'Gracias', translation: 'Thank you', example: 'Gracias por tu ayuda.', difficulty: 'beginner' },
        { language_id: 'es', word: 'Por favor', translation: 'Please', example: 'Por favor, pásame la sal.', difficulty: 'beginner' },
        { language_id: 'es', word: 'Sí', translation: 'Yes', example: 'Sí, entiendo.', difficulty: 'beginner' },
        { language_id: 'es', word: 'Sin embargo', translation: 'However', example: 'Sin embargo, no estoy de acuerdo.', difficulty: 'intermediate' },
        { language_id: 'es', word: 'Además', translation: 'Moreover', example: 'Además, necesitamos considerar otras opciones.', difficulty: 'intermediate' },
        { language_id: 'es', word: 'Ubicuo', translation: 'Ubiquitous', example: 'Los smartphones son ahora ubicuos en la sociedad moderna.', difficulty: 'advanced' },
      ];
      
      await addItemsToStore(STORES.VOCABULARY, spanishVocabulary);
      
      // Add sample grammar sections for English
      const englishGrammarSections: GrammarSection[] = [
        {
          language_id: 'en',
          title: 'Present Simple',
          description: 'Learn how to use the present simple tense',
          difficulty: 'beginner',
          exercises: [
            {
              question: 'Complete the sentence: She ___ to school every day.',
              options: ['go', 'goes', 'going', 'went'],
              correct: 1
            },
            {
              question: 'Complete the sentence: They ___ English very well.',
              options: ['speak', 'speaks', 'speaking', 'spoke'],
              correct: 0
            }
          ]
        },
        {
          language_id: 'en',
          title: 'Past Simple',
          description: 'Learn how to use the past simple tense',
          difficulty: 'beginner',
          exercises: [
            {
              question: 'Complete the sentence: I ___ to the cinema yesterday.',
              options: ['go', 'goes', 'going', 'went'],
              correct: 3
            },
            {
              question: 'Complete the sentence: She ___ her homework last night.',
              options: ['do', 'does', 'doing', 'did'],
              correct: 3
            }
          ]
        },
        {
          language_id: 'en',
          title: 'Present Perfect',
          description: 'Learn how to use the present perfect tense',
          difficulty: 'intermediate',
          exercises: [
            {
              question: 'Complete the sentence: I ___ never ___ to Paris.',
              options: ['have', 'has', 'had', 'having'],
              correct: 0
            }
          ]
        },
        {
          language_id: 'en',
          title: 'Conditionals',
          description: 'Learn how to use conditional sentences',
          difficulty: 'advanced',
          exercises: [
            {
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
          language_id: 'es',
          title: 'Presente Simple',
          description: 'Aprende a usar el presente simple',
          difficulty: 'beginner',
          exercises: [
            {
              question: 'Completa la frase: Ella ___ a la escuela todos los días.',
              options: ['va', 'vas', 'vamos', 'van'],
              correct: 0
            },
            {
              question: 'Completa la frase: Ellos ___ inglés muy bien.',
              options: ['hablan', 'habla', 'hablamos', 'habláis'],
              correct: 0
            }
          ]
        },
        {
          language_id: 'es',
          title: 'Pretérito Indefinido',
          description: 'Aprende a usar el pretérito indefinido',
          difficulty: 'intermediate',
          exercises: [
            {
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
      
      console.log("Sample data initialized successfully");
    } else {
      console.log("Languages already exist, skipping sample data initialization");
    }
  } catch (error) {
    console.error("Error initializing sample data:", error);
    throw error;
  }
} 