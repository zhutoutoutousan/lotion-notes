import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface Sentence {
  text: string;
  start: number;
  end: number;
  analysis?: {
    traffic_light: 'red' | 'yellow' | 'green';
    red_flags: Array<{ title: string; details: string }>;
    missed_opportunities: string[];
    coaching_suggestion: string;
    ai_insight: string;
  } | null;
}

interface TrafficLightAnalysis {
  sentences: Array<{
    text: string;
    traffic_light: 'red' | 'yellow' | 'green';
    analysis: {
      red_flags: Array<{ title: string; details: string }>;
      missed_opportunities: string[];
      coaching_suggestion: string;
      ai_insight: string;
    };
  }>;
  overall_analysis: {
    strengths: string[];
    areas_for_improvement: string[];
    key_insights: string[];
    recommendations: string[];
  };
}

interface ConversationTimelineProps {
  sentences: Sentence[];
  audioUrl: string;
  transcriptId: string;
  useTrafficLight?: boolean;
  trafficLightAnalysis?: TrafficLightAnalysis;
}

export function ConversationTimeline({
  sentences,
  audioUrl,
  transcriptId,
  useTrafficLight = false,
  trafficLightAnalysis,
}: ConversationTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(audioUrl));
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const sentenceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const handleTimeUpdate = () => {
    setCurrentTime(audio.currentTime);
  };

  const handlePlay = () => {
    audio.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audio.pause();
    setIsPlaying(false);
  };

  const getTrafficLightColor = (sentence: Sentence) => {
    if (!useTrafficLight || !sentence.analysis) return '';
    switch (sentence.analysis.traffic_light) {
      case 'red':
        return 'bg-red-100 border-red-500';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-500';
      case 'green':
        return 'bg-green-100 border-green-500';
      default:
        return '';
    }
  };

  const scrollToSentence = (sentence: Sentence) => {
    const element = sentenceRefs.current[sentence.text];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedSentence(sentence);
      audio.currentTime = sentence.start;
      handlePlay();
    }
  };

  const analyzedSentences = sentences.map(sentence => {
    const matchingAnalysis = trafficLightAnalysis?.sentences.find(
      a => a.text === sentence.text
    );
    return {
      ...sentence,
      analysis: matchingAnalysis ? {
        traffic_light: matchingAnalysis.traffic_light,
        red_flags: matchingAnalysis.analysis.red_flags,
        missed_opportunities: matchingAnalysis.analysis.missed_opportunities,
        coaching_suggestion: matchingAnalysis.analysis.coaching_suggestion,
        ai_insight: matchingAnalysis.analysis.ai_insight
      } : null
    };
  });

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isPlaying ? handlePause : handlePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-gray-500">
            {Math.floor(currentTime)}s
          </span>
        </div>
        <div className="space-y-2">
          {analyzedSentences.map((sentence, index) => {
            const isCurrent = currentTime >= sentence.start && currentTime < sentence.end;
            const analysis = sentence.analysis;

            return (
              <Card
                key={index}
                ref={el => { sentenceRefs.current[sentence.text] = el; }}
                className={`p-4 cursor-pointer transition-colors ${
                  isCurrent ? 'bg-blue-50' : ''
                } ${getTrafficLightColor(sentence)}`}
                onClick={() => {
                  audio.currentTime = sentence.start;
                  handlePlay();
                }}
              >
                <CardContent className="p-0">
                  <p className="mb-2">{sentence.text}</p>
                  {analysis && (
                    <div className="text-sm space-y-2">
                      {analysis.red_flags?.length > 0 && (
                        <div className="text-red-700">
                          <strong>Red Flags:</strong>
                          <ul className="list-disc list-inside">
                            {analysis.red_flags.map((flag, idx) => (
                              <li key={idx}>
                                <strong>{flag.title}:</strong> {flag.details}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.missed_opportunities?.length > 0 && (
                        <div className="text-yellow-700">
                          <strong>Missed Opportunities:</strong>
                          <ul className="list-disc list-inside">
                            {analysis.missed_opportunities.map((opp, idx) => (
                              <li key={idx}>{opp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.coaching_suggestion && (
                        <div className="text-blue-700">
                          <strong>Coaching Suggestion:</strong> {analysis.coaching_suggestion}
                        </div>
                      )}
                      {analysis.ai_insight && (
                        <div className="text-green-700">
                          <strong>AI Insight:</strong> {analysis.ai_insight}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {useTrafficLight && trafficLightAnalysis && (
        <div className="w-80 fixed right-4 top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          <Card className="h-full bg-gray-900">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-white">Traffic Light Analysis</h3>
              
              {/* Overall Analysis */}
              <div className="mb-6">
                <h4 className="font-medium mb-2 text-white">Overall Analysis</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-green-300 mb-1">Strengths</h5>
                    <ul className="list-disc list-inside text-sm text-gray-200">
                      {trafficLightAnalysis.overall_analysis.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-yellow-300 mb-1">Areas for Improvement</h5>
                    <ul className="list-disc list-inside text-sm text-gray-200">
                      {trafficLightAnalysis.overall_analysis.areas_for_improvement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-300 mb-1">Key Insights</h5>
                    <ul className="list-disc list-inside text-sm text-gray-200">
                      {trafficLightAnalysis.overall_analysis.key_insights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-purple-300 mb-1">Recommendations</h5>
                    <ul className="list-disc list-inside text-sm text-gray-200">
                      {trafficLightAnalysis.overall_analysis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sentence Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium mb-2 text-white">Sentence Analysis</h4>
                {trafficLightAnalysis.sentences.map((sentence, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSentence?.text === sentence.text ? 'ring-2 ring-blue-500' : ''
                    } ${
                      sentence.traffic_light === 'red' ? 'bg-red-900/50' :
                      sentence.traffic_light === 'yellow' ? 'bg-yellow-900/50' :
                      'bg-green-900/50'
                    }`}
                    onClick={() => {
                      const matchingSentence = sentences.find(s => s.text === sentence.text);
                      if (matchingSentence) {
                        scrollToSentence(matchingSentence);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        sentence.traffic_light === 'red' ? 'bg-red-500' :
                        sentence.traffic_light === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-200">{sentence.text}</p>
                        <div className="mt-2 text-xs space-y-2">
                          {sentence.analysis.red_flags?.length > 0 && (
                            <div className="text-red-300">
                              <strong className="text-red-200">Red Flags:</strong>
                              <ul className="list-disc list-inside">
                                {sentence.analysis.red_flags.map((flag, idx) => (
                                  <li key={idx}>
                                    <strong>{flag.title}:</strong> {flag.details}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sentence.analysis.missed_opportunities?.length > 0 && (
                            <div className="text-yellow-300">
                              <strong className="text-yellow-200">Missed Opportunities:</strong>
                              <ul className="list-disc list-inside">
                                {sentence.analysis.missed_opportunities.map((opp, idx) => (
                                  <li key={idx}>{opp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sentence.analysis.coaching_suggestion && (
                            <div className="text-blue-300">
                              <strong className="text-blue-200">Coaching Suggestion:</strong> {sentence.analysis.coaching_suggestion}
                            </div>
                          )}
                          {sentence.analysis.ai_insight && (
                            <div className="text-green-300">
                              <strong className="text-green-200">AI Insight:</strong> {sentence.analysis.ai_insight}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 