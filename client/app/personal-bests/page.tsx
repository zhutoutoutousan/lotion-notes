'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UpdateRecordDialog } from '@/components/UpdateRecordDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  type PersonalBest,
  type PersonalBestGoal,
  type PersonalBestType,
  addPersonalBest,
  getPersonalBests,
  getPersonalBestGoals,
  createPersonalBestGoal,
  updatePersonalBestGoal,
  addPersonalBestRecord,
  deletePersonalBest,
  deletePersonalBestGoal,
  updatePersonalBest
} from '@/lib/services/personalBestsService';

export default function PersonalBestsPage() {
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [goals, setGoals] = useState<PersonalBestGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPersonalBest, setNewPersonalBest] = useState<Partial<PersonalBest>>({
    type: 'numeric',
    category: 'fitness'
  });
  const [selectedPersonalBest, setSelectedPersonalBest] = useState<PersonalBest | null>(null);
  const [selectedGoalPersonalBest, setSelectedGoalPersonalBest] = useState<PersonalBest | null>(null);
  const [goalTargetValue, setGoalTargetValue] = useState<string>('');
  const [personalBestToDelete, setPersonalBestToDelete] = useState<PersonalBest | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<PersonalBestGoal | null>(null);
  const [editingPersonalBest, setEditingPersonalBest] = useState<PersonalBest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bests, personalBestGoals] = await Promise.all([
        getPersonalBests(),
        getPersonalBestGoals()
      ]);
      setPersonalBests(bests);
      setGoals(personalBestGoals);
    } catch (error) {
      console.error('Error loading personal bests:', error);
      toast.error('Failed to load personal bests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPersonalBest = async () => {
    if (!newPersonalBest.title || !newPersonalBest.type || !newPersonalBest.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const best = await addPersonalBest({
        ...newPersonalBest as Omit<PersonalBest, 'id' | 'createdAt' | 'updatedAt'>,
        currentValue: 0,
        history: []
      });
      setPersonalBests(prev => [...prev, best]);
      setNewPersonalBest({ type: 'numeric', category: 'fitness' });
      toast.success('Personal best added successfully');
    } catch (error) {
      console.error('Error adding personal best:', error);
      toast.error('Failed to add personal best');
    }
  };

  const handleUpdateRecord = async (value: number | boolean | string, notes?: string) => {
    if (!selectedPersonalBest) return;

    try {
      const updated = await addPersonalBestRecord(selectedPersonalBest.id, { value, notes });
      const [bests, personalBestGoals] = await Promise.all([
        getPersonalBests(),
        getPersonalBestGoals()
      ]);
      setPersonalBests(bests);
      setGoals(personalBestGoals);
      toast.success('Record updated successfully');
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    }
  };

  const handleCreateGoal = async (personalBest: PersonalBest) => {
    setSelectedGoalPersonalBest(personalBest);
    setGoalTargetValue('');
  };

  const handleSubmitGoal = async () => {
    if (!selectedGoalPersonalBest) return;

    let targetValue: number | boolean | string;
    switch (selectedGoalPersonalBest.type) {
      case 'numeric':
      case 'duration':
        targetValue = parseFloat(goalTargetValue);
        if (isNaN(targetValue)) {
          toast.error('Please enter a valid number');
          return;
        }
        break;
      case 'streak':
        targetValue = parseInt(goalTargetValue);
        if (isNaN(targetValue)) {
          toast.error('Please enter a valid number');
          return;
        }
        break;
      case 'boolean':
        targetValue = goalTargetValue.toLowerCase() === 'true';
        break;
      default:
        targetValue = goalTargetValue;
    }

    try {
      const goal = await createPersonalBestGoal({
        personalBestId: selectedGoalPersonalBest.id,
        targetValue,
        status: 'active',
        progress: 0
      });
      setGoals(prev => [...prev, goal]);
      toast.success('Goal created successfully');
      setSelectedGoalPersonalBest(null);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleDeletePersonalBest = async () => {
    if (!personalBestToDelete) return;

    try {
      await deletePersonalBest(personalBestToDelete.id);
      setPersonalBests(prev => prev.filter(pb => pb.id !== personalBestToDelete.id));
      setGoals(prev => prev.filter(g => g.personalBestId !== personalBestToDelete.id));
      toast.success('Personal best deleted successfully');
    } catch (error) {
      console.error('Error deleting personal best:', error);
      toast.error('Failed to delete personal best');
    } finally {
      setPersonalBestToDelete(null);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      await deletePersonalBestGoal(goalToDelete.id);
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
      toast.success('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleEditPersonalBest = async (personalBest: PersonalBest) => {
    setEditingPersonalBest(personalBest);
  };

  const handleUpdatePersonalBest = async () => {
    if (!editingPersonalBest) return;

    try {
      const updated = await updatePersonalBest(editingPersonalBest);
      setPersonalBests(prev => prev.map(pb => pb.id === updated.id ? updated : pb));
      toast.success('Personal best updated successfully');
      setEditingPersonalBest(null);
    } catch (error) {
      console.error('Error updating personal best:', error);
      toast.error('Failed to update personal best');
    }
  };

  const getBestRecords = () => {
    const categories = Array.from(new Set(personalBests.map(pb => pb.category)));
    const bestRecords: { [key: string]: PersonalBest[] } = {};

    categories.forEach(category => {
      const categoryRecords = personalBests.filter(pb => pb.category === category);
      bestRecords[category] = categoryRecords.sort((a, b) => {
        if (typeof a.currentValue === 'number' && typeof b.currentValue === 'number') {
          return b.currentValue - a.currentValue;
        }
        return 0;
      }).slice(0, 3); // Get top 3 records for each category
    });

    return bestRecords;
  };

  if (isLoading) {
    return <div>Loading personal bests...</div>;
  }

  const bestRecords = getBestRecords();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Personal Bests</h1>

      {/* Dashboard Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Best Records</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(bestRecords).map(([category, records]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">{record.title}</span>
                        {record.description && (
                          <p className="text-xs text-muted-foreground">{record.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {record.currentValue}
                          {record.unit && ` ${record.unit}`}
                        </span>
                        {record.achievedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.achievedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Records</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalBests.map((best) => (
              <Card key={best.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{best.title}</CardTitle>
                      <CardDescription>{best.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPersonalBest(best)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPersonalBestToDelete(best)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <span className="font-medium">
                        {best.currentValue}
                        {best.unit && ` ${best.unit}`}
                      </span>
                    </div>
                    {best.achievedAt && (
                      <div className="text-sm text-muted-foreground">
                        Achieved on {new Date(best.achievedAt).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPersonalBest(best)}
                      >
                        Update Record
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateGoal(best)}
                      >
                        Set Goal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const personalBest = personalBests.find(pb => pb.id === goal.personalBestId);
              if (!personalBest) return null;

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{personalBest.title}</CardTitle>
                        <CardDescription>Goal: {goal.targetValue}{personalBest.unit}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setGoalToDelete(goal)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <Badge
                        className={
                          goal.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : goal.status === 'abandoned'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Add New Personal Best</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newPersonalBest.title || ''}
                    onChange={(e) => setNewPersonalBest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Bench Press"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newPersonalBest.description || ''}
                    onChange={(e) => setNewPersonalBest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your personal best..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newPersonalBest.type}
                      onValueChange={(value: PersonalBestType) => setNewPersonalBest(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">Numeric</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                        <SelectItem value="streak">Streak</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={newPersonalBest.category || ''}
                      onChange={(e) => setNewPersonalBest(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., fitness"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Unit (optional)</label>
                  <Input
                    value={newPersonalBest.unit || ''}
                    onChange={(e) => setNewPersonalBest(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., kg, hours, days"
                  />
                </div>
                <Button onClick={handleAddPersonalBest} className="w-full">
                  Add Personal Best
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPersonalBest && (
        <UpdateRecordDialog
          personalBest={selectedPersonalBest}
          isOpen={!!selectedPersonalBest}
          onClose={() => setSelectedPersonalBest(null)}
          onUpdate={handleUpdateRecord}
        />
      )}

      <Dialog open={!!selectedGoalPersonalBest} onOpenChange={() => setSelectedGoalPersonalBest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Goal for {selectedGoalPersonalBest?.title}</DialogTitle>
            <DialogDescription>
              Enter your target value for this personal best.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Target Value</label>
              {selectedGoalPersonalBest?.type === 'boolean' ? (
                <Select
                  value={goalTargetValue}
                  onValueChange={setGoalTargetValue}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={selectedGoalPersonalBest?.type === 'numeric' || selectedGoalPersonalBest?.type === 'duration' ? 'number' : 'text'}
                  value={goalTargetValue}
                  onChange={(e) => setGoalTargetValue(e.target.value)}
                  placeholder={`Enter target value${selectedGoalPersonalBest?.unit ? ` in ${selectedGoalPersonalBest.unit}` : ''}`}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGoalPersonalBest(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitGoal}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!personalBestToDelete} onOpenChange={() => setPersonalBestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the personal best and all associated goals.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePersonalBest}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the goal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingPersonalBest} onOpenChange={() => setEditingPersonalBest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Personal Best</DialogTitle>
            <DialogDescription>
              Update the details of your personal best.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editingPersonalBest?.title || ''}
                onChange={(e) => setEditingPersonalBest(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingPersonalBest?.description || ''}
                onChange={(e) => setEditingPersonalBest(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={editingPersonalBest?.category || ''}
                onChange={(e) => setEditingPersonalBest(prev => prev ? { ...prev, category: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unit (optional)</label>
              <Input
                value={editingPersonalBest?.unit || ''}
                onChange={(e) => setEditingPersonalBest(prev => prev ? { ...prev, unit: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPersonalBest(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePersonalBest}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 