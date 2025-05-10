'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type PersonalBest } from '@/lib/services/personalBestsService';

interface UpdateRecordDialogProps {
  personalBest: PersonalBest;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (value: number | boolean | string, notes?: string) => Promise<void>;
}

export function UpdateRecordDialog({
  personalBest,
  isOpen,
  onClose,
  onUpdate
}: UpdateRecordDialogProps) {
  const [value, setValue] = useState<string | number | boolean>(personalBest.currentValue);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(value, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderValueInput = () => {
    switch (personalBest.type) {
      case 'numeric':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            placeholder={`Enter value${personalBest.unit ? ` in ${personalBest.unit}` : ''}`}
          />
        );
      case 'duration':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            placeholder={`Enter duration${personalBest.unit ? ` in ${personalBest.unit}` : ''}`}
          />
        );
      case 'streak':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => setValue(parseInt(e.target.value))}
            placeholder="Enter number of days"
          />
        );
      case 'boolean':
        return (
          <div className="flex gap-2">
            <Button
              variant={value === true ? 'default' : 'outline'}
              onClick={() => setValue(true)}
            >
              Yes
            </Button>
            <Button
              variant={value === false ? 'default' : 'outline'}
              onClick={() => setValue(false)}
            >
              No
            </Button>
          </div>
        );
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {personalBest.title}</DialogTitle>
          <DialogDescription>
            Enter your new record value and any notes about this achievement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Current Value</label>
            <div className="mt-1 text-sm text-muted-foreground">
              {personalBest.currentValue}
              {personalBest.unit && ` ${personalBest.unit}`}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">New Value</label>
            {renderValueInput()}
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this achievement..."
            />
          </div>
          {personalBest.achievedAt && (
            <div>
              <label className="text-sm font-medium">Last Updated</label>
              <div className="mt-1 text-sm text-muted-foreground">
                {new Date(personalBest.achievedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 