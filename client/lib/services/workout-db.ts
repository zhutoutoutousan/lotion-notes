import { WorkoutPlan, PeriodizationPlan } from '@/types/workout';

const DB_NAME = 'workout-plans';
const DB_VERSION = 1;

const STORES = {
  WORKOUT_PLANS: 'workout-plans',
  PERIODIZATION_PLANS: 'periodization-plans'
};

export async function initDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.WORKOUT_PLANS)) {
        db.createObjectStore(STORES.WORKOUT_PLANS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PERIODIZATION_PLANS)) {
        db.createObjectStore(STORES.PERIODIZATION_PLANS, { keyPath: 'id' });
      }
    };
  });
}

export async function saveWorkoutPlan(plan: WorkoutPlan) {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.WORKOUT_PLANS, 'readwrite');
    const store = transaction.objectStore(STORES.WORKOUT_PLANS);
    const request = store.put(plan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function savePeriodizationPlan(plan: PeriodizationPlan) {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.PERIODIZATION_PLANS, 'readwrite');
    const store = transaction.objectStore(STORES.PERIODIZATION_PLANS);
    const request = store.put(plan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkoutPlans() {
  const db = await initDB();
  return new Promise<WorkoutPlan[]>((resolve, reject) => {
    const transaction = db.transaction(STORES.WORKOUT_PLANS, 'readonly');
    const store = transaction.objectStore(STORES.WORKOUT_PLANS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPeriodizationPlans() {
  const db = await initDB();
  return new Promise<PeriodizationPlan[]>((resolve, reject) => {
    const transaction = db.transaction(STORES.PERIODIZATION_PLANS, 'readonly');
    const store = transaction.objectStore(STORES.PERIODIZATION_PLANS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
} 