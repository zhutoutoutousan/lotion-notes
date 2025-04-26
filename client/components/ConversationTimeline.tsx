import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface Sentence {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string | null;
}

interface SalesInsight {
  red_flags?: Array<{ title: string; details: string }>;
  missed_opportunities?: string[];
  coaching_suggestion?: string;
  ai_insight?: string;
  loading: boolean;
  error: string | null;
}

interface ConversationTimelineProps {
  sentences: Sentence[];
  audioUrl: string;
  transcriptId: string;
}

const BATCH_SIZE = 5; // Number of sentences to analyze in each batch
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay between batches
const DELAY_BETWEEN_REQUESTS = 500; // 500ms delay between individual requests

const getStatusColor = (status: SalesInsight['status']) => {
  switch (status) {
    case 'red':
      return 'bg-red-50 border-red-200';
    case 'yellow':
      return 'bg-yellow-50 border-yellow-200';
    case 'green':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: SalesInsight['status']) => {
  switch (status) {
    case 'red':
      return '🔴';
    case 'yellow':
      return '🟡';
    case 'green':
      return '🟢';
    default:
      return '';
  }
};

const getInsightColor = (type: 'positive' | 'warning' | 'critical') => {
  switch (type) {
    case 'positive':
      return 'text-green-700';
    case 'warning':
      return 'text-yellow-700';
    case 'critical':
      return 'text-red-700';
  }
};

export function ConversationTimeline({ sentences, audioUrl, transcriptId }: ConversationTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [salesInsights, setSalesInsights] = useState<SalesInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // Initialize sales insights state
    setSalesInsights(sentences.map(() => ({
      loading: true,
      error: null
    })));

    // Analyze all sentences with throttling
    const analyzeAllSentences = async () => {
      try {
        // Split sentences into batches
        const batches = [];
        for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
          batches.push(sentences.slice(i, i + BATCH_SIZE));
        }

        // Process each batch with delay
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          // Process each sentence in the batch with delay
          for (let sentenceIndex = 0; sentenceIndex < batch.length; sentenceIndex++) {
            const sentence = batch[sentenceIndex];
            const globalIndex = batchIndex * BATCH_SIZE + sentenceIndex;

            try {
              const response = await fetch('/api/conversation/analyze-sentence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  sentence: sentence.text,
                  transcript_id: transcriptId
                })
              });

              if (!response.ok) {
                if (response.status === 429) {
                  // If rate limited, wait for the retry-after time
                  const retryAfter = parseInt(response.headers.get('retry-after') || '30');
                  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                  // Retry the same request
                  sentenceIndex--;
                  continue;
                }
                throw new Error('Failed to analyze sentence');
              }

              const data = await response.json();
              let parsedInsight: any = {};
              try {
                parsedInsight = data.response ? JSON.parse(data.response) : {};
              } catch (error) {
                parsedInsight = {};
              }
              setSalesInsights(prev => {
                const newInsights = [...prev];
                newInsights[globalIndex] = {
                  ...parsedInsight,
                  loading: false,
                  error: null
                };
                return newInsights;
              });

              // Add delay between individual requests
              if (sentenceIndex < batch.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
              }
            } catch (error) {
              console.error(`Error analyzing sentence ${globalIndex}:`, error);
              setSalesInsights(prev => {
                const newInsights = [...prev];
                newInsights[globalIndex] = {
                  loading: false,
                  error: 'Failed to analyze sentence'
                };
                return newInsights;
              });
            }
          }

          // Add delay between batches
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
          }
        }
      } catch (error) {
        console.error('Error in batch processing:', error);
        setSalesInsights(prev => prev.map(insight => ({
          ...insight,
          loading: false,
          error: 'Failed to analyze sentences'
        })));
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeAllSentences();
  }, [sentences, transcriptId]);

  const handlePlaySegment = (start: number, end: number, index: number) => {
    if (!audioRef.current) return;

    // Set the current time to the start of the segment
    audioRef.current.currentTime = start / 1000; // Convert milliseconds to seconds
    audioRef.current.play();
    setIsPlaying(true);

    // Set up an interval to check if we've reached the end of the segment
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime * 1000); // Convert seconds to milliseconds
        if (audioRef.current.currentTime * 1000 >= end) {
          audioRef.current.pause();
          setIsPlaying(false);
          clearInterval(interval);
        }
      }
    }, 100);

    // Clean up interval when component unmounts or when playing a new segment
    return () => clearInterval(interval);
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden audio element for controlling playback */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime * 1000)}
      />
      
      <div className="space-y-4">
        {sentences.map((sentence, index) => {
          const isCurrentSegment = currentTime >= sentence.start && currentTime <= sentence.end;
          const duration = (sentence.end - sentence.start) / 1000; // Convert to seconds
          const insight = salesInsights[index];
          // If the object is empty or only has loading/error, show nothing
          const hasInsight = insight && (
            (insight.red_flags && insight.red_flags.length > 0) ||
            (insight.missed_opportunities && insight.missed_opportunities.length > 0) ||
            (insight.coaching_suggestion && insight.coaching_suggestion.trim() !== '') ||
            (insight.ai_insight && insight.ai_insight.trim() !== '')
          );
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isCurrentSegment ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {sentence.speaker ? `Speaker ${sentence.speaker}: ` : ''}
                      {sentence.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.floor(sentence.start / 1000)}s - {Math.floor(sentence.end / 1000)}s
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => isCurrentSegment && isPlaying ? handlePause() : handlePlaySegment(sentence.start, sentence.end, index)}
                    className="shrink-0"
                  >
                    {isCurrentSegment && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Mini audio player for this segment */}
                <div className="w-full">
                  <audio
                    ref={el => { segmentRefs.current[index] = el; }}
                    src={audioUrl}
                    controls
                    className="w-full"
                    onPlay={() => {
                      if (segmentRefs.current[index]) {
                        segmentRefs.current[index]!.currentTime = sentence.start / 1000;
                      }
                      handlePlaySegment(sentence.start, sentence.end, index);
                    }}
                    onPause={handlePause}
                    onTimeUpdate={(e) => {
                      const currentTimeMs = e.currentTarget.currentTime * 1000;
                      if (currentTimeMs >= sentence.end) {
                        e.currentTarget.pause();
                      }
                    }}
                  >
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Sales Insights */}
                {insight?.loading && (
                  <div className="text-sm text-gray-500">Analyzing sales performance...</div>
                )}
                
                {insight?.error && (
                  <div className="text-sm text-red-500">{insight.error}</div>
                )}
                
                {hasInsight && (
                  <div className="space-y-3 mt-2">
                    {insight.red_flags && insight.red_flags.length > 0 && (
                      <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                        <div className="font-bold text-red-700 mb-1">Red Flag{insight.red_flags.length > 1 ? 's' : ''}:</div>
                        {insight.red_flags.map((flag, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="font-semibold text-red-600">{flag.title}</div>
                            <div className="text-red-700 text-sm">{flag.details}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {insight.missed_opportunities && insight.missed_opportunities.length > 0 && (
                      <div className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
                        <div className="font-bold text-red-600 mb-1">Missed Opportunity{insight.missed_opportunities.length > 1 ? 'ies' : 'y'}:</div>
                        <ul className="list-disc pl-5">
                          {insight.missed_opportunities.map((op, idx) => (
                            <li key={idx} className="text-red-700 text-sm">{op}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.coaching_suggestion && insight.coaching_suggestion.trim() !== '' && (
                      <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                        <div className="font-bold text-green-700 mb-1">Coaching Suggestion:</div>
                        <div className="text-green-800 text-sm">{insight.coaching_suggestion}</div>
                      </div>
                    )}
                    {insight.ai_insight && insight.ai_insight.trim() !== '' && (
                      <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                        <div className="font-bold text-blue-700 mb-1">AI Insight:</div>
                        <div className="text-blue-800 text-sm">{insight.ai_insight}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 