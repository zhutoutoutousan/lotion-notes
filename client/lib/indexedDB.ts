import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CalendarEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  created: Date;
}

interface KnowledgeNode {
  id?: number;
  title: string;
  content: string;
  connections: number[];
  created: Date;
  updated: Date;
}

interface Task {
  id?: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  created: Date;
}

interface MyDB extends DBSchema {
  calendar: {
    key: number;
    value: CalendarEvent;
    indexes: { 'by-date': Date };
  };
  knowledge: {
    key: number;
    value: KnowledgeNode;
    indexes: { 'by-title': string };
  };
  tasks: {
    key: number;
    value: Task;
    indexes: { 'by-created': Date };
  };
}

export class DBManager {
  private db: IDBPDatabase<MyDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      try {
        // Create or open the database
        const dbName = 'lotion-notes';
        
        // Create a new database with the correct schema
        this.db = await openDB<MyDB>(dbName, 1, {
          upgrade(db) {
            console.log('Upgrading database...');
            
            // Calendar store
            if (!db.objectStoreNames.contains('calendar')) {
              console.log('Creating calendar store');
              const calendarStore = db.createObjectStore('calendar', { keyPath: 'id', autoIncrement: true });
              calendarStore.createIndex('by-date', 'start');
            }

            // Knowledge store
            if (!db.objectStoreNames.contains('knowledge')) {
              console.log('Creating knowledge store');
              const knowledgeStore = db.createObjectStore('knowledge', { keyPath: 'id', autoIncrement: true });
              knowledgeStore.createIndex('by-title', 'title');
            }
            
            // Tasks store
            if (!db.objectStoreNames.contains('tasks')) {
              console.log('Creating tasks store');
              const tasksStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
              tasksStore.createIndex('by-created', 'created');
            }
            
            console.log('Database upgrade complete');
          },
        });
        
        console.log('Database initialized successfully');
        console.log('Object stores:', this.db.objectStoreNames);
      } catch (error) {
        console.error('Error initializing database:', error);
        this.initPromise = null;
        throw error;
      }
    })();
    
    return this.initPromise;
  }

  async addCalendarEvent(event: Omit<CalendarEvent, 'id'>) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('calendar', event);
  }

  async getCalendarEvents() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('calendar');
  }

  async updateCalendarEvent(event: CalendarEvent) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    if (!event.id) throw new Error('Event ID is required for update');
    return this.db.put('calendar', event);
  }

  async addKnowledgeNode(node: Omit<KnowledgeNode, 'id'>) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('knowledge', node);
  }

  async getKnowledgeNodes() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('knowledge');
  }

  async addTask(task: Omit<Task, 'id'>) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    console.log('Adding task:', task);
    console.log('Available stores:', this.db.objectStoreNames);
    return this.db.add('tasks', task);
  }

  async getTasks() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('tasks');
  }

  async updateTask(task: Task) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    if (!task.id) throw new Error('Task ID is required for update');
    console.log('Updating task:', task);
    return this.db.put('tasks', task);
  }

  async deleteTask(id: number) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.delete('tasks', id);
  }

  async exportData() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const calendarEvents = await this.getCalendarEvents();
    const knowledgeNodes = await this.getKnowledgeNodes();
    const tasks = await this.getTasks();
    return {
      calendar: calendarEvents,
      knowledge: knowledgeNodes,
      tasks: tasks,
    };
  }

  async importData(data: { calendar: CalendarEvent[]; knowledge: KnowledgeNode[]; tasks: Task[] }) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    // Clear existing data
    await this.db.clear('calendar');
    await this.db.clear('knowledge');
    await this.db.clear('tasks');

    // Import new data
    for (const event of data.calendar) {
      await this.db.add('calendar', event);
    }
    for (const node of data.knowledge) {
      await this.db.add('knowledge', node);
    }
    for (const task of data.tasks) {
      await this.db.add('tasks', task);
    }
  }

  async purgeData(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction(['calendar', 'knowledge', 'tasks'], 'readwrite');
    
    const calendarStore = tx.objectStore('calendar');
    const knowledgeStore = tx.objectStore('knowledge');
    const tasksStore = tx.objectStore('tasks');
    
    await Promise.all([
      calendarStore.clear(),
      knowledgeStore.clear(),
      tasksStore.clear()
    ]);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async purgeCalendarEvents(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('calendar', 'readwrite');
    const store = tx.objectStore('calendar');
    
    await store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async purgeKnowledgeNodes(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('knowledge', 'readwrite');
    const store = tx.objectStore('knowledge');
    
    await store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('calendar', 'readwrite');
    const store = tx.objectStore('calendar');
    
    await store.delete(id);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbManager = new DBManager();
export type { CalendarEvent, KnowledgeNode, Task }; 