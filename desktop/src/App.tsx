import React from 'react';
import { Toaster } from 'sonner';
import { NotesProvider } from './contexts/NotesContext';
import { EditorProvider } from './contexts/EditorContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Landing from './components/Landing';
import './styles/globals.css';
import { useNotes } from './contexts';

const AppContent: React.FC = () => {
  const { notes } = useNotes();
  
  if (notes.length === 0) {
    return <Landing />;
  }
  
  return <Layout />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotesProvider>
        <EditorProvider>
          <AppContent />
          <Toaster position="bottom-right" />
        </EditorProvider>
      </NotesProvider>
    </ThemeProvider>
  );
};

export default App; 