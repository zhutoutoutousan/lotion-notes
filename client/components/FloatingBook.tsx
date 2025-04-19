"use client"
import React, { useState, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { BookOpen, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { addVocabulary } from '../lib/services/indexedDBService';
import { generateVocabularyContent } from '../lib/services/aiService';
import { useToast } from './ui/use-toast';

interface VocabularyFormData {
  word: string;
  translation: string;
  example: string;
  context: string;
  source_language_id: string;
  target_language_id: string;
}

const SUPPORTED_LANGUAGES = [
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

export const FloatingBook: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<VocabularyFormData>({
    word: '',
    translation: '',
    example: '',
    context: '',
    source_language_id: 'en', // Default source language
    target_language_id: 'es'  // Default target language
  });
  const dragControls = useDragControls();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVocabulary(formData);
      setIsOpen(false);
      setFormData({
        word: '',
        translation: '',
        example: '',
        context: '',
        source_language_id: 'en',
        target_language_id: 'es'
      });
      toast({
        title: "Success",
        description: "Vocabulary added successfully!",
      });
    } catch (error) {
      console.error('Error adding vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to add vocabulary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateWithAI = async () => {
    console.log('Generate with AI clicked');
    if (!formData.word) {
      toast({
        title: "Error",
        description: "Please enter a word first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Calling generateVocabularyContent with:', formData);
      const { translation, example, context } = await generateVocabularyContent({
        word: formData.word,
        source_language_id: formData.source_language_id,
        target_language_id: formData.target_language_id
      });
      
      console.log('Received response:', { translation, example, context });
      
      setFormData(prev => ({
        ...prev,
        translation: translation || prev.translation,
        example,
        context
      }));
      
      toast({
        title: "Success",
        description: "AI-generated content added!",
      });
    } catch (error) {
      console.error('Error in generateWithAI:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-50"
      drag
      dragControls={dragControls}
      dragMomentum={false}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(true)}
          >
            <BookOpen className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Vocabulary</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_language_id">From</Label>
                <select
                  id="source_language_id"
                  name="source_language_id"
                  value={formData.source_language_id}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_language_id">To</Label>
                <select
                  id="target_language_id"
                  name="target_language_id"
                  value={formData.target_language_id}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="word">Word</Label>
              <Input
                id="word"
                name="word"
                value={formData.word}
                onChange={handleInputChange}
                placeholder="Enter word"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="translation">Translation</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateWithAI}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <Input
                id="translation"
                name="translation"
                value={formData.translation}
                onChange={handleInputChange}
                placeholder="Enter translation or generate with AI"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="example">Example Sentence</Label>
              <Textarea
                id="example"
                name="example"
                value={formData.example}
                onChange={handleInputChange}
                placeholder="Enter example sentence"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                placeholder="Enter additional context"
              />
            </div>
            <Button type="submit" className="w-full">
              Add Vocabulary
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};