'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { initDB, STORES, type LifeStage, type LifeProgress } from '@/lib/services/indexedDBService';

const SAMPLE_LIFE_STAGES: LifeStage[] = [
  {
    id: 1,
    name: 'Early Adulthood (20-30)',
    age_range: '20-30',
    description: 'Building foundations for career and relationships',
    social_goals: [
      'Develop meaningful relationships',
      'Build professional network',
      'Establish work-life balance'
    ],
    economic_goals: [
      'Start career path',
      'Build emergency fund',
      'Begin retirement savings'
    ],
    emotional_goals: [
      'Develop self-awareness',
      'Build resilience',
      'Establish healthy boundaries'
    ],
    milestones: [
      'First full-time job',
      'Financial independence',
      'Meaningful relationships'
    ]
  },
  {
    id: 2,
    name: 'Established Adulthood (30-45)',
    age_range: '30-45',
    description: 'Career advancement and family building',
    social_goals: [
      'Maintain strong relationships',
      'Mentor others',
      'Community involvement'
    ],
    economic_goals: [
      'Career advancement',
      'Home ownership',
      'Investment portfolio'
    ],
    emotional_goals: [
      'Emotional maturity',
      'Work-life integration',
      'Personal fulfillment'
    ],
    milestones: [
      'Career milestone',
      'Family establishment',
      'Financial stability'
    ]
  },
  {
    id: 3,
    name: 'Mid-Life (45-60)',
    age_range: '45-60',
    description: 'Peak career and preparing for transition',
    social_goals: [
      'Strengthen family bonds',
      'Expand social circle',
      'Give back to community'
    ],
    economic_goals: [
      'Peak earning years',
      'Retirement planning',
      'Wealth preservation'
    ],
    emotional_goals: [
      'Life balance',
      'Personal growth',
      'Legacy building'
    ],
    milestones: [
      'Career peak',
      'Financial security',
      'Life purpose'
    ]
  }
];

export default function LifeGuidePage() {
  const [stages, setStages] = useState<LifeStage[]>([]);
  const [progress, setProgress] = useState<LifeProgress[]>([]);
  const [selectedStage, setSelectedStage] = useState<LifeStage | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Initializing database...');
      const db = await initDB();
      console.log('Database initialized successfully');

      // First transaction for life stages
      const stagesTransaction = db.transaction([STORES.LIFE_STAGES], 'readonly');
      const stagesStore = stagesTransaction.objectStore(STORES.LIFE_STAGES);

      // Get all life stages
      const stagesRequest = stagesStore.getAll();
      const stages = await new Promise<LifeStage[]>((resolve, reject) => {
        stagesRequest.onsuccess = () => resolve(stagesRequest.result);
        stagesRequest.onerror = () => reject(new Error('Failed to get life stages'));
      });

      // If no stages exist, initialize with sample data
      if (stages.length === 0) {
        console.log('No life stages found, initializing with sample data...');
        const sampleStages: LifeStage[] = [
          {
            id: 1,
            name: 'Childhood',
            description: 'Early development and education',
            age_range: '0-12',
            social_goals: [
              'Make friends',
              'Learn social skills',
              'Develop communication'
            ],
            economic_goals: [
              'Learn value of money',
              'Start saving habits',
              'Understand basic economics'
            ],
            emotional_goals: [
              'Develop self-awareness',
              'Learn emotional regulation',
              'Build confidence'
            ],
            milestones: [
              'First words',
              'First steps',
              'Starting school'
            ]
          },
          {
            id: 2,
            name: 'Adolescence',
            description: 'Teenage years and self-discovery',
            age_range: '13-19',
            social_goals: [
              'Build strong friendships',
              'Develop romantic relationships',
              'Learn teamwork'
            ],
            economic_goals: [
              'Get first job',
              'Learn financial responsibility',
              'Start saving for future'
            ],
            emotional_goals: [
              'Develop independence',
              'Build self-identity',
              'Learn stress management'
            ],
            milestones: [
              'High school graduation',
              'First job',
              'Learning to drive'
            ]
          },
          {
            id: 3,
            name: 'Early Adulthood',
            description: 'Career and relationship building',
            age_range: '20-35',
            social_goals: [
              'Build professional network',
              'Establish meaningful relationships',
              'Develop leadership skills'
            ],
            economic_goals: [
              'Financial independence',
              'Career establishment',
              'Investment planning'
            ],
            emotional_goals: [
              'Work-life balance',
              'Emotional maturity',
              'Personal growth'
            ],
            milestones: [
              'College graduation',
              'First full-time job',
              'Buying a home'
            ]
          }
        ];

        const writeTransaction = db.transaction([STORES.LIFE_STAGES], 'readwrite');
        const writeStore = writeTransaction.objectStore(STORES.LIFE_STAGES);
        
        for (const stage of sampleStages) {
          writeStore.add(stage);
        }

        await new Promise<void>((resolve, reject) => {
          writeTransaction.oncomplete = () => resolve();
          writeTransaction.onerror = () => reject(new Error('Failed to initialize life stages'));
        });

        setStages(sampleStages);
      } else {
        console.log('Loaded existing life stages:', stages);
        setStages(stages);
      }

      // Second transaction for life progress
      const progressTransaction = db.transaction([STORES.LIFE_PROGRESS], 'readonly');
      const progressStore = progressTransaction.objectStore(STORES.LIFE_PROGRESS);

      // Get user's progress
      const progressRequest = progressStore.getAll();
      const progress = await new Promise<LifeProgress[]>((resolve, reject) => {
        progressRequest.onsuccess = () => resolve(progressRequest.result);
        progressRequest.onerror = () => reject(new Error('Failed to get life progress'));
      });

      console.log('Loaded life progress:', progress);
      setProgress(progress);
    } catch (error) {
      console.error('Error loading life guide data:', error);
      // Set default stages if loading fails
      setStages([
        {
          id: 1,
          name: 'Childhood',
          description: 'Early development and education',
          age_range: '0-12',
          social_goals: [
            'Make friends',
            'Learn social skills',
            'Develop communication'
          ],
          economic_goals: [
            'Learn value of money',
            'Start saving habits',
            'Understand basic economics'
          ],
          emotional_goals: [
            'Develop self-awareness',
            'Learn emotional regulation',
            'Build confidence'
          ],
          milestones: ['First words', 'First steps', 'Starting school']
        },
        {
          id: 2,
          name: 'Adolescence',
          description: 'Teenage years and self-discovery',
          age_range: '13-19',
          social_goals: [
            'Build strong friendships',
            'Develop romantic relationships',
            'Learn teamwork'
          ],
          economic_goals: [
            'Get first job',
            'Learn financial responsibility',
            'Start saving for future'
          ],
          emotional_goals: [
            'Develop independence',
            'Build self-identity',
            'Learn stress management'
          ],
          milestones: ['High school graduation', 'First job', 'Learning to drive']
        },
        {
          id: 3,
          name: 'Early Adulthood',
          description: 'Career and relationship building',
          age_range: '20-35',
          social_goals: [
            'Build professional network',
            'Establish meaningful relationships',
            'Develop leadership skills'
          ],
          economic_goals: [
            'Financial independence',
            'Career establishment',
            'Investment planning'
          ],
          emotional_goals: [
            'Work-life balance',
            'Emotional maturity',
            'Personal growth'
          ],
          milestones: ['College graduation', 'First full-time job', 'Buying a home']
        }
      ]);
    }
  };

  const handleStageSelect = (stage: LifeStage) => {
    setSelectedStage(stage);
    const stageProgress = progress.find(p => p.stage_id === stage.id);
    setNotes(stageProgress?.notes || '');
  };

  const handleSaveProgress = async () => {
    if (!selectedStage) return;

    try {
      const db = await initDB();
      const tx = db.transaction(STORES.LIFE_PROGRESS, 'readwrite');
      const store = tx.objectStore(STORES.LIFE_PROGRESS);

      const existingProgress = progress.find(p => p.stage_id === selectedStage.id);
      const newProgress: LifeProgress = {
        id: existingProgress?.id || Date.now(),
        user_id: 'current_user', // Replace with actual user ID
        stage_id: selectedStage.id,
        social_score: existingProgress?.social_score || 0,
        economic_score: existingProgress?.economic_score || 0,
        emotional_score: existingProgress?.emotional_score || 0,
        completed_milestones: existingProgress?.completed_milestones || [],
        notes,
        last_updated: new Date()
      };

      await store.put(newProgress);
      setProgress(prev => {
        const filtered = prev.filter(p => p.stage_id !== selectedStage.id);
        return [...filtered, newProgress];
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Life Guide</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stages.map(stage => (
          <Card 
            key={stage.id} 
            className={`cursor-pointer ${selectedStage?.id === stage.id ? 'border-primary' : ''}`}
            onClick={() => handleStageSelect(stage)}
          >
            <CardHeader>
              <CardTitle>{stage.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Social Progress</h4>
                  <Progress value={progress.find(p => p.stage_id === stage.id)?.social_score || 0} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Economic Progress</h4>
                  <Progress value={progress.find(p => p.stage_id === stage.id)?.economic_score || 0} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Emotional Progress</h4>
                  <Progress value={progress.find(p => p.stage_id === stage.id)?.emotional_score || 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedStage.name} Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="font-medium mb-2">Social Goals</h3>
                <ul className="list-disc list-inside">
                  {selectedStage.social_goals?.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Economic Goals</h3>
                <ul className="list-disc list-inside">
                  {selectedStage.economic_goals?.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Emotional Goals</h3>
                <ul className="list-disc list-inside">
                  {selectedStage.emotional_goals?.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Milestones</h3>
              <ul className="list-disc list-inside">
                {selectedStage.milestones?.map((milestone, index) => (
                  <li key={index}>{milestone}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your thoughts and progress..."
                className="min-h-[100px]"
              />
            </div>

            <Button onClick={handleSaveProgress}>Save Progress</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 