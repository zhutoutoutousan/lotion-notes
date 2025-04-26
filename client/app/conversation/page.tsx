'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { ConversationTimeline } from '@/components/ConversationTimeline';

export default function ConversationPage() {
  const [audioUrl, setAudioUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setAudioUrl('');
  };

  // Upload file to /public/audio/ and get the URL
  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-audio', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      setError('Failed to upload audio file');
      return null;
    }
    const data = await res.json();
    return data.url;
  };

  // Handle analysis
  const handleAnalyze = async () => {
    setError(null);
    setAnalysis(null);
    setLoading(true);
    let url = audioUrl;
    if (file) {
      const uploadedUrl = await uploadFile();
      if (!uploadedUrl) {
        setLoading(false);
        return;
      }
      url = uploadedUrl;
    }
    if (!url) {
      setError('Please provide an audio URL or upload a file.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/conversation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: url }),
      });
      if (!res.ok) throw new Error('Failed to analyze audio');
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError('Error analyzing audio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation Audio Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="file"
                accept="audio/mp3,audio/mpeg"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="mb-2 md:mb-0"
              />
              <span className="mx-2 text-gray-500">or</span>
              <input
                type="text"
                placeholder="Paste audio URL (e.g. http://localhost:3000/audio/yourfile.mp3)"
                value={audioUrl}
                onChange={e => { setAudioUrl(e.target.value); setFile(null); }}
                className="border rounded px-2 py-1 w-full md:w-96"
              />
              <Button onClick={handleAnalyze} disabled={loading} className="ml-2">
                <Send className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {loading && <div>Analyzing audio, please wait...</div>}
            {analysis && (
              <div className="mt-6 space-y-6">
                <h2 className="text-xl font-bold mb-2">Analysis Results</h2>
                
                {/* Conversation Timeline */}
                {analysis.sentences && (
                  <div>
                    <h3 className="font-semibold mb-1">Conversation Timeline</h3>
                    <ConversationTimeline 
                      sentences={analysis.sentences} 
                      audioUrl={audioUrl || (file ? URL.createObjectURL(file) : '')}
                      transcriptId={analysis.id}
                    />
                  </div>
                )}

                {analysis.chapters && analysis.chapters.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">Chapters</h3>
                    <ul className="space-y-2">
                      {analysis.chapters.map((chapter: any, idx: number) => (
                        <li key={idx} className="border rounded p-3 bg-gray-50">
                          <div className="font-semibold">{chapter.gist}</div>
                          <div className="text-xs text-gray-500">{chapter.start} - {chapter.end} sec</div>
                          <div>{chapter.headline}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.auto_highlights_result && analysis.auto_highlights_result.results && analysis.auto_highlights_result.results.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1 mt-4">Key Highlights</h3>
                    <ul className="space-y-2">
                      {analysis.auto_highlights_result.results.map((highlight: any, idx: number) => (
                        <li key={idx} className="border rounded p-3 bg-blue-50">
                          <div className="font-semibold">{highlight.text}</div>
                          <div className="text-xs text-gray-500">{highlight.rank} | {highlight.count} mentions</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.sentiment_analysis_results && (
                  <div>
                    <h3 className="font-semibold mb-1 mt-4">Sentiment Analysis</h3>
                    <ul className="space-y-2">
                      {analysis.sentiment_analysis_results.map((sent: any, idx: number) => (
                        <li key={idx} className="border rounded p-3 bg-green-50">
                          <div className="font-semibold">{sent.text}</div>
                          <div className="text-xs text-gray-500">{sent.sentiment} | {sent.confidence.toFixed(2)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.summary && (
                  <div>
                    <h3 className="font-semibold mb-1 mt-4">Summary</h3>
                    <div className="border rounded p-3 bg-yellow-50">{analysis.summary}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 