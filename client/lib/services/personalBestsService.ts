import { initDB, STORES } from './indexedDBService';

export type PersonalBestType = 
  | 'numeric'      // For achievements like weight lifted, distance run
  | 'duration'     // For time-based achievements like concentration time
  | 'streak'       // For consecutive achievements like days without takeout
  | 'boolean'      // For yes/no achievements like completing a challenge
  | 'custom';      // For achievements that don't fit other categories

export interface PersonalBest {
  id: number;
  title: string;
  description: string;
  type: PersonalBestType;
  category: string;
  currentValue: number | boolean | string;
  targetValue?: number | boolean | string;
  unit?: string;  // e.g., "kg", "hours", "days"
  achievedAt?: Date;
  history: PersonalBestRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalBestRecord {
  value: number | boolean | string;
  achievedAt: Date;
  notes?: string;
}

export interface PersonalBestGoal {
  id: number;
  personalBestId: number;
  targetValue: number | boolean | string;
  deadline?: Date;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database operations
export async function addPersonalBest(personalBest: Omit<PersonalBest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalBest> {
  const db = await initDB();
  const tx = db.transaction(STORES.PERSONAL_BESTS, 'readwrite');
  const store = tx.objectStore(STORES.PERSONAL_BESTS);

  const newPersonalBest: PersonalBest = {
    ...personalBest,
    id: Date.now(),
    createdAt: new Date(),
    updatedAt: new Date(),
    history: personalBest.history || []
  };

  await store.add(newPersonalBest);
  return newPersonalBest;
}

export async function updatePersonalBest(personalBest: PersonalBest): Promise<PersonalBest> {
  const db = await initDB();
  const tx = db.transaction(STORES.PERSONAL_BESTS, 'readwrite');
  const store = tx.objectStore(STORES.PERSONAL_BESTS);

  const updatedPersonalBest = {
    ...personalBest,
    updatedAt: new Date()
  };

  await store.put(updatedPersonalBest);
  return updatedPersonalBest;
}

export async function getPersonalBests(): Promise<PersonalBest[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_BESTS, 'readonly');
    const store = tx.objectStore(STORES.PERSONAL_BESTS);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getPersonalBestById(id: number): Promise<PersonalBest | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_BESTS, 'readonly');
    const store = tx.objectStore(STORES.PERSONAL_BESTS);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function addPersonalBestRecord(
  personalBestId: number,
  record: Omit<PersonalBestRecord, 'achievedAt'>
): Promise<PersonalBest> {
  const personalBest = await getPersonalBestById(personalBestId);
  if (!personalBest) {
    throw new Error('Personal best not found');
  }

  const newRecord: PersonalBestRecord = {
    ...record,
    achievedAt: new Date()
  };

  const updatedPersonalBest: PersonalBest = {
    ...personalBest,
    currentValue: record.value,
    achievedAt: new Date(),
    history: [...(personalBest.history || []), newRecord],
    updatedAt: new Date()
  };

  // Update the personal best
  const result = await updatePersonalBest(updatedPersonalBest);

  // Update any associated goals
  const db = await initDB();
  const tx = db.transaction(STORES.PERSONAL_BEST_GOALS, 'readwrite');
  const store = tx.objectStore(STORES.PERSONAL_BEST_GOALS);
  const index = store.index('personalBestId');
  const goals = await new Promise<PersonalBestGoal[]>((resolve, reject) => {
    const request = index.getAll(personalBestId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  // Update each goal's progress
  for (const goal of goals) {
    if (goal.status === 'active') {
      let progress = 0;
      if (typeof record.value === 'number' && typeof goal.targetValue === 'number') {
        progress = Math.min(100, Math.round((record.value / goal.targetValue) * 100));
      } else if (typeof record.value === 'boolean' && typeof goal.targetValue === 'boolean') {
        progress = record.value === goal.targetValue ? 100 : 0;
      }

      const updatedGoal: PersonalBestGoal = {
        ...goal,
        progress,
        status: progress >= 100 ? 'completed' : 'active',
        updatedAt: new Date()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(updatedGoal);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  return result;
}

export async function createPersonalBestGoal(
  goal: Omit<PersonalBestGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonalBestGoal> {
  const db = await initDB();
  const tx = db.transaction(STORES.PERSONAL_BEST_GOALS, 'readwrite');
  const store = tx.objectStore(STORES.PERSONAL_BEST_GOALS);

  const newGoal: PersonalBestGoal = {
    ...goal,
    id: Date.now(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await store.add(newGoal);
  return newGoal;
}

export async function updatePersonalBestGoal(goal: PersonalBestGoal): Promise<PersonalBestGoal> {
  const db = await initDB();
  const tx = db.transaction(STORES.PERSONAL_BEST_GOALS, 'readwrite');
  const store = tx.objectStore(STORES.PERSONAL_BEST_GOALS);

  const updatedGoal = {
    ...goal,
    updatedAt: new Date()
  };

  await store.put(updatedGoal);
  return updatedGoal;
}

export async function getPersonalBestGoals(): Promise<PersonalBestGoal[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_BEST_GOALS, 'readonly');
    const store = tx.objectStore(STORES.PERSONAL_BEST_GOALS);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deletePersonalBest(id: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PERSONAL_BESTS, STORES.PERSONAL_BEST_GOALS], 'readwrite');
    const personalBestsStore = tx.objectStore(STORES.PERSONAL_BESTS);
    const goalsStore = tx.objectStore(STORES.PERSONAL_BEST_GOALS);
    const goalsIndex = goalsStore.index('personalBestId');

    // First delete all associated goals
    const goalsRequest = goalsIndex.getAll(id);
    goalsRequest.onsuccess = () => {
      const goals = goalsRequest.result;
      goals.forEach(goal => {
        goalsStore.delete(goal.id);
      });

      // Then delete the personal best
      const request = personalBestsStore.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    };
    goalsRequest.onerror = () => reject(goalsRequest.error);
  });
}

export async function deletePersonalBestGoal(id: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PERSONAL_BEST_GOALS, 'readwrite');
    const store = tx.objectStore(STORES.PERSONAL_BEST_GOALS);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
} 