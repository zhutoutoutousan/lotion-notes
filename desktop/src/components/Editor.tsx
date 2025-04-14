import React, { useEffect, useState } from 'react';
import { useNotes, useEditor } from '../contexts';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Editor: React.FC = () => {
  const { activeNoteId, isPreviewMode, togglePreviewMode } = useEditor();
  const { getNote, updateNote } = useNotes();
  const [note, setNote] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (activeNoteId) {
      const currentNote = getNote(activeNoteId);
      if (currentNote) {
        setNote({ title: currentNote.title, content: currentNote.content });
      }
    }
  }, [activeNoteId, getNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (note && activeNoteId) {
      const newTitle = e.target.value;
      setNote({ ...note, title: newTitle });
      updateNote(activeNoteId, { title: newTitle });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (note && activeNoteId) {
      const newContent = e.target.value;
      setNote({ ...note, content: newContent });
      updateNote(activeNoteId, { content: newContent });
    }
  };

  if (!note) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          className="flex-1 bg-transparent text-lg font-semibold outline-none"
          placeholder="Untitled Note"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePreviewMode}
        >
          {isPreviewMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isPreviewMode ? (
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={note.content}
            onChange={handleContentChange}
            className="h-full w-full resize-none bg-transparent outline-none"
            placeholder="Start writing..."
          />
        )}
      </div>
    </div>
  );
};

export default Editor; 