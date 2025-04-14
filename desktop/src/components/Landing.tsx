import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts';
import { Button } from './ui/button';
import { FileText, Moon, Sun, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center space-y-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center space-x-2"
        >
          <FileText className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Lotion Notes</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-md text-lg text-muted-foreground"
        >
          A beautiful, distraction-free note-taking app that helps you focus on what matters.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={toggleTheme}
            className="group"
          >
            {theme === 'light' ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <h3 className="mb-2 text-lg font-semibold">Simple & Clean</h3>
          <p className="text-sm text-muted-foreground">
            Focus on your thoughts with a minimal, distraction-free interface.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <h3 className="mb-2 text-lg font-semibold">Markdown Support</h3>
          <p className="text-sm text-muted-foreground">
            Write and format your notes using Markdown syntax.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <h3 className="mb-2 text-lg font-semibold">Local Storage</h3>
          <p className="text-sm text-muted-foreground">
            Your notes are stored locally, ensuring privacy and quick access.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing; 