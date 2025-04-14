import React from 'react';
import { useNotes, useEditor } from '../contexts';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface SidebarProps {
  notes: Array<{
    id: string;
    title: string;
    updatedAt: Date;
  }>;
}

const Sidebar: React.FC<SidebarProps> = ({ notes }) => {
  const { addNote } = useNotes();
  const { activeNoteId, setActiveNoteId } = useEditor();

  const handleNewNote = async () => {
    const newNote = await addNote({
      title: 'Untitled Note',
      content: ''
    });
    setActiveNoteId(newNote.id);
  };

  return (
    <div className="w-64 border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleNewNote}
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>
      <div className="p-2">
        {notes.map(note => (
          <button
            key={note.id}
            className={cn(
              "w-full rounded-md p-2 text-left hover:bg-muted",
              activeNoteId === note.id && "bg-muted"
            )}
            onClick={() => setActiveNoteId(note.id)}
          >
            <div className="font-medium">{note.title}</div>
            <div className="text-xs text-muted-foreground">
              {format(note.updatedAt, 'MMM d, yyyy')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 