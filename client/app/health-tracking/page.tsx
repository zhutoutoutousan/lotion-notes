'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { initDB, STORES, type HealthReminder, type HealthCheckup } from '@/lib/services/indexedDBService';

const SAMPLE_REMINDERS: HealthReminder[] = [
  {
    id: 1,
    user_id: 'current_user',
    type: 'fitness',
    title: 'Morning Exercise',
    description: '30 minutes of cardio or strength training',
    frequency: 'daily',
    last_completed: new Date(),
    next_due: new Date(Date.now() + 24 * 60 * 60 * 1000),
    is_active: true
  },
  {
    id: 2,
    user_id: 'current_user',
    type: 'mental',
    title: 'Meditation',
    description: '20 minutes of mindfulness meditation',
    frequency: 'weekly',
    last_completed: new Date(),
    next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_active: true
  }
];

const SAMPLE_CHECKUPS: HealthCheckup[] = [
  {
    id: 1,
    user_id: 'current_user',
    type: 'annual',
    date: new Date(),
    notes: 'Annual physical examination',
    results: 'All vitals normal',
    next_due: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
];

export default function HealthTrackingPage() {
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [checkups, setCheckups] = useState<HealthCheckup[]>([]);
  const [newReminder, setNewReminder] = useState<Partial<HealthReminder>>({
    type: 'fitness',
    frequency: 'daily',
    is_active: true
  });
  const [newCheckup, setNewCheckup] = useState<Partial<HealthCheckup>>({
    type: 'annual'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = await initDB();
      const tx = db.transaction([STORES.HEALTH_REMINDERS, STORES.HEALTH_CHECKUPS], 'readonly');
      const remindersStore = tx.objectStore(STORES.HEALTH_REMINDERS);
      const checkupsStore = tx.objectStore(STORES.HEALTH_CHECKUPS);

      const [reminders, checkups] = await Promise.all([
        new Promise<HealthReminder[]>((resolve) => {
          const request = remindersStore.getAll();
          request.onsuccess = () => resolve(request.result);
        }),
        new Promise<HealthCheckup[]>((resolve) => {
          const request = checkupsStore.getAll();
          request.onsuccess = () => resolve(request.result);
        })
      ]);

      if (reminders.length === 0) {
        // Initialize with sample data
        const tx = db.transaction(STORES.HEALTH_REMINDERS, 'readwrite');
        const store = tx.objectStore(STORES.HEALTH_REMINDERS);
        SAMPLE_REMINDERS.forEach(reminder => store.add(reminder));
        setReminders(SAMPLE_REMINDERS);
      } else {
        setReminders(reminders);
      }

      if (checkups.length === 0) {
        // Initialize with sample data
        const tx = db.transaction(STORES.HEALTH_CHECKUPS, 'readwrite');
        const store = tx.objectStore(STORES.HEALTH_CHECKUPS);
        SAMPLE_CHECKUPS.forEach(checkup => store.add(checkup));
        setCheckups(SAMPLE_CHECKUPS);
      } else {
        setCheckups(checkups);
      }
    } catch (error) {
      console.error('Error loading health tracking data:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.description) return;

    try {
      const db = await initDB();
      const tx = db.transaction(STORES.HEALTH_REMINDERS, 'readwrite');
      const store = tx.objectStore(STORES.HEALTH_REMINDERS);

      const reminder: HealthReminder = {
        id: Date.now(),
        user_id: 'current_user',
        type: newReminder.type || 'fitness',
        title: newReminder.title,
        description: newReminder.description,
        frequency: newReminder.frequency || 'daily',
        last_completed: new Date(),
        next_due: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_active: true
      };

      await store.add(reminder);
      setReminders(prev => [...prev, reminder]);
      setNewReminder({
        type: 'fitness',
        frequency: 'daily',
        is_active: true
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const handleAddCheckup = async () => {
    if (!newCheckup.type || !newCheckup.date) return;

    try {
      const db = await initDB();
      const tx = db.transaction(STORES.HEALTH_CHECKUPS, 'readwrite');
      const store = tx.objectStore(STORES.HEALTH_CHECKUPS);

      const checkup: HealthCheckup = {
        id: Date.now(),
        user_id: 'current_user',
        type: newCheckup.type,
        date: new Date(newCheckup.date),
        notes: newCheckup.notes || '',
        results: newCheckup.results || '',
        next_due: new Date(newCheckup.date.getTime() + 365 * 24 * 60 * 60 * 1000)
      };

      await store.add(checkup);
      setCheckups(prev => [...prev, checkup]);
      setNewCheckup({ type: 'annual' });
    } catch (error) {
      console.error('Error adding checkup:', error);
    }
  };

  const handleCompleteReminder = async (reminder: HealthReminder) => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORES.HEALTH_REMINDERS, 'readwrite');
      const store = tx.objectStore(STORES.HEALTH_REMINDERS);

      const updatedReminder = {
        ...reminder,
        last_completed: new Date(),
        next_due: new Date(Date.now() + (reminder.frequency === 'daily' ? 24 : 7 * 24) * 60 * 60 * 1000)
      };

      await store.put(updatedReminder);
      setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r));
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Health Tracking</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminders.map(reminder => (
                <Card key={reminder.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{reminder.title}</h3>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Next due: {new Date(reminder.next_due).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCompleteReminder(reminder)}
                    >
                      Complete
                    </Button>
                  </div>
                </Card>
              ))}

              <div className="space-y-2">
                <Input
                  placeholder="Reminder Title"
                  value={newReminder.title || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Reminder Description"
                  value={newReminder.description || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, type: e.target.value as HealthReminder['type'] }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="dental">Dental</option>
                    <option value="medical">Medical</option>
                    <option value="fitness">Fitness</option>
                    <option value="mental">Mental</option>
                  </select>
                  <select
                    value={newReminder.frequency}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value as HealthReminder['frequency'] }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <Button onClick={handleAddReminder}>Add Reminder</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Checkups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkups.map(checkup => (
                <Card key={checkup.id} className="p-4">
                  <div>
                    <h3 className="font-medium">{checkup.type} Checkup</h3>
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(checkup.date).toLocaleDateString()}
                    </p>
                    {checkup.notes && (
                      <p className="text-sm text-muted-foreground">Notes: {checkup.notes}</p>
                    )}
                    {checkup.results && (
                      <p className="text-sm text-muted-foreground">Results: {checkup.results}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Next due: {new Date(checkup.next_due).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}

              <div className="space-y-2">
                <select
                  value={newCheckup.type}
                  onChange={(e) => setNewCheckup(prev => ({ ...prev, type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="annual">Annual</option>
                  <option value="dental">Dental</option>
                  <option value="vision">Vision</option>
                </select>
                <Input
                  type="date"
                  value={newCheckup.date ? newCheckup.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewCheckup(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
                <Textarea
                  placeholder="Checkup Notes"
                  value={newCheckup.notes || ''}
                  onChange={(e) => setNewCheckup(prev => ({ ...prev, notes: e.target.value }))}
                />
                <Textarea
                  placeholder="Checkup Results"
                  value={newCheckup.results || ''}
                  onChange={(e) => setNewCheckup(prev => ({ ...prev, results: e.target.value }))}
                />
                <Button onClick={handleAddCheckup}>Add Checkup</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 