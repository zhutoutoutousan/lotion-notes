import React, { createContext, useContext, useState } from 'react';

interface EditorContextType {
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const togglePreviewMode = () => setIsPreviewMode(prev => !prev);

  return (
    <EditorContext.Provider value={{
      activeNoteId,
      setActiveNoteId,
      isPreviewMode,
      togglePreviewMode
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}; 