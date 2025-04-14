import React from 'react';
import { useNotes } from '../contexts/NotesContext';
import { useEditor } from '../contexts/EditorContext';
import Sidebar from './Sidebar';
import Editor from './Editor';
import Header from './Header';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
  const { notes } = useNotes();
  const { activeNoteId } = useEditor();

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <motion.div
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="w-64 border-r dark:border-gray-800"
        >
          <Sidebar notes={notes} />
        </motion.div>
        <main className={cn(
          "flex-1 overflow-hidden",
          activeNoteId ? "block" : "hidden"
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Editor />
          </motion.div>
        </main>
        {!activeNoteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-muted-foreground">Select a note or create a new one</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Layout; 