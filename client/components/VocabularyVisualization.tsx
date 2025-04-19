"use client";

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getVocabulary } from '@/lib/services/indexedDBService';
import { VocabularyItem } from '@/lib/services/indexedDBService';

interface ForgettingCurveData {
  timestamp: number;
  retention: number;
}

export function VocabularyVisualization({ 
  sourceLanguageId, 
  targetLanguageId 
}: { 
  sourceLanguageId: string;
  targetLanguageId: string;
}) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [forgettingCurve, setForgettingCurve] = useState<ForgettingCurveData[]>([]);
  const controls = useAnimation();

  useEffect(() => {
    const loadVocabulary = async () => {
      try {
        const vocab = await getVocabulary(sourceLanguageId, targetLanguageId, 'beginner');
        setVocabulary(vocab);
        
        // Generate forgetting curve data
        const now = Date.now();
        const curveData = [
          { timestamp: now, retention: 100 },
          { timestamp: now + 20 * 60 * 1000, retention: 58 }, // 20 minutes
          { timestamp: now + 60 * 60 * 1000, retention: 44 }, // 1 hour
          { timestamp: now + 9 * 60 * 60 * 1000, retention: 36 }, // 9 hours
          { timestamp: now + 24 * 60 * 60 * 1000, retention: 34 }, // 1 day
          { timestamp: now + 2 * 24 * 60 * 60 * 1000, retention: 28 }, // 2 days
          { timestamp: now + 6 * 24 * 60 * 60 * 1000, retention: 25 }, // 6 days
          { timestamp: now + 31 * 24 * 60 * 60 * 1000, retention: 21 }, // 31 days
        ];
        setForgettingCurve(curveData);
      } catch (error) {
        console.error('Error loading vocabulary:', error);
      }
    };

    loadVocabulary();
  }, [sourceLanguageId, targetLanguageId]);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    });
  }, [controls]);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vocabulary Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Words</span>
              <span className="text-sm font-medium">{vocabulary.length}</span>
            </div>
            <Progress value={(vocabulary.length / 100) * 100} />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgetting Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            <svg width="100%" height="100%" className="absolute">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={`${100 - y}%`}
                  x2="100%"
                  y2={`${100 - y}%`}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              ))}

              {/* Curve */}
              <motion.path
                d={`
                  M 0,${100 - forgettingCurve[0]?.retention || 0}
                  ${forgettingCurve.map((point, i) => 
                    `L ${(i / (forgettingCurve.length - 1)) * 100},${100 - point.retention}`
                  ).join(' ')}
                `}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {/* Points */}
              {forgettingCurve.map((point, i) => (
                <motion.circle
                  key={i}
                  cx={`${(i / (forgettingCurve.length - 1)) * 100}%`}
                  cy={`${100 - point.retention}%`}
                  r="4"
                  fill="hsl(var(--primary))"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                />
              ))}
            </svg>

            {/* Time labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              <span>Now</span>
              <span>20m</span>
              <span>1h</span>
              <span>9h</span>
              <span>1d</span>
              <span>2d</span>
              <span>6d</span>
              <span>31d</span>
            </div>

            {/* Retention labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Words</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vocabulary.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <div>
                  <div className="font-medium">{item.word}</div>
                  <div className="text-sm text-muted-foreground">{item.translation}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 