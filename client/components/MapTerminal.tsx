import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronDown, ChevronUp, MapPin, Globe, AlertCircle } from "lucide-react";

interface TerminalLine {
  type: 'info' | 'success' | 'error' | 'warning' | 'command';
  text: string;
  timestamp?: string;
}

interface MapTerminalProps {
  isDetectingLocations: boolean;
  locationProgress: number;
  articles: any[];
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function MapTerminal({ 
  isDetectingLocations, 
  locationProgress, 
  articles,
  isOpen = true,
  onToggle 
}: MapTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (isDetectingLocations) {
      addLine('info', `Detecting locations... ${locationProgress.toFixed(0)}%`);
    }
  }, [locationProgress, isDetectingLocations]);

  useEffect(() => {
    if (articles.length > 0) {
      const newLines: TerminalLine[] = [];
      
      // Group articles by location
      const locationGroups = articles.reduce((groups, article) => {
        if (article.location) {
          const key = `${article.location.latitude},${article.location.longitude}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(article);
        }
        return groups;
      }, {} as Record<string, any[]>);

      // Add info about overlapping markers
      Object.entries(locationGroups).forEach(([location, articles]) => {
        if (articles.length > 1) {
          newLines.push({
            type: 'warning',
            text: `Found ${articles.length} articles at ${location}. Using cluster marker.`
          });
        }
      });

      // Add summary
      newLines.push({
        type: 'success',
        text: `Map updated: ${articles.length} articles, ${Object.keys(locationGroups).length} unique locations`
      });

      setLines(prev => [...prev, ...newLines]);
    }
  }, [articles]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLines(prev => [...prev, { type, text, timestamp }]);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'command': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 w-96 transition-all duration-300 ${isOpen ? 'h-64' : 'h-12'}`}>
      <div className="bg-black/90 rounded-lg shadow-lg overflow-hidden">
        <div 
          className="flex items-center justify-between p-2 bg-gray-800 cursor-pointer"
          onClick={() => onToggle?.(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-green-400" />
            <span className="text-white font-mono">map-terminal</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
        
        {isOpen && (
          <div className="p-2">
            <ScrollArea ref={scrollRef} className="h-48">
              <div className="font-mono text-sm space-y-1">
                {lines.map((line, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-gray-500">[{line.timestamp}]</span>
                    <span className={getLineColor(line.type)}>
                      {line.type === 'command' ? '$ ' : ''}{line.text}
                    </span>
                  </div>
                ))}
                {isDetectingLocations && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Processing locations...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
} 