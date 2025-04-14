import React, { createContext, useContext, useEffect, useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Load notes from electron store
    const loadNotes = async () => {
      const savedNotes = await window.electron.store.get('notes');
      if (savedNotes) {
        setNotes(savedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        })));
      }
    };
    loadNotes();
  }, []);

  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    await window.electron.store.set('notes', updatedNotes);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          ...updates,
          updatedAt: new Date()
        };
      }
      return note;
    });
    setNotes(updatedNotes);
    await window.electron.store.set('notes', updatedNotes);
  };

  const deleteNote = async (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    await window.electron.store.set('notes', updatedNotes);
  };

  const getNote = (id: string) => notes.find(note => note.id === id);

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, getNote }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}; 