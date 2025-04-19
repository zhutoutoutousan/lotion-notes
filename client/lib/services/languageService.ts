import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

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

/**
 * Get all available languages
 */
export async function getLanguages(): Promise<Language[]> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get all proficiency levels
 */
export async function getProficiencyLevels(): Promise<ProficiencyLevel[]> {
  const { data, error } = await supabase
    .from('proficiency_levels')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Error fetching proficiency levels:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get vocabulary items for a specific language and difficulty level
 */
export const getVocabulary = async (
  sourceLanguageId: string,
  targetLanguageId: string,
  difficulty: ProficiencyLevel = 'beginner'
): Promise<VocabularyItem[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORES.VOCABULARY, 'readonly');
    const store = transaction.objectStore(STORES.VOCABULARY);
    const index = store.index('language_pair_difficulty');
    
    const request = index.getAll([sourceLanguageId, targetLanguageId, difficulty]);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting vocabulary:', error);
    throw error;
  }
};

/**
 * Get grammar sections for a specific language and difficulty level
 */
export async function getGrammarSections(
  languageId: string,
  difficulty: string
): Promise<GrammarSection[]> {
  const { data, error } = await supabase
    .from('grammar_sections')
    .select('*')
    .eq('language_id', languageId)
    .eq('difficulty', difficulty)
    .order('id');
  
  if (error) {
    console.error('Error fetching grammar sections:', error);
    return [];
  }
  
  // Fetch exercises for each section
  const sectionsWithExercises = await Promise.all(
    (data || []).map(async (section) => {
      const exercises = await getGrammarExercises(section.id);
      return {
        ...section,
        exercises,
      };
    })
  );
  
  return sectionsWithExercises;
}

/**
 * Get grammar exercises for a specific section
 */
export async function getGrammarExercises(sectionId: number): Promise<GrammarExercise[]> {
  const { data, error } = await supabase
    .from('grammar_exercises')
    .select('*')
    .eq('section_id', sectionId)
    .order('id');
  
  if (error) {
    console.error('Error fetching grammar exercises:', error);
    return [];
  }
  
  // Parse the JSON options string
  return (data || []).map(exercise => ({
    ...exercise,
    options: typeof exercise.options === 'string' 
      ? JSON.parse(exercise.options) 
      : exercise.options,
  }));
}

/**
 * Get user's language learning progress
 */
export async function getUserLanguageProgress(
  userId: string,
  languageId: string
): Promise<UserLanguageProgress | null> {
  const { data, error } = await supabase
    .from('user_language_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('language_id', languageId)
    .single();
  
  if (error) {
    console.error('Error fetching user language progress:', error);
    return null;
  }
  
  return data;
}

/**
 * Update user's language learning progress
 */
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
  // Check if progress record exists
  const existingProgress = await getUserLanguageProgress(userId, languageId);
  
  if (existingProgress) {
    // Update existing record
    const { error } = await supabase
      .from('user_language_progress')
      .update({
        ...progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProgress.id);
    
    if (error) {
      console.error('Error updating user language progress:', error);
      return false;
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from('user_language_progress')
      .insert({
        user_id: userId,
        language_id: languageId,
        proficiency_level: proficiencyLevel,
        ...progress,
      });
    
    if (error) {
      console.error('Error creating user language progress:', error);
      return false;
    }
  }
  
  return true;
} 