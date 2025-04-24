'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Model {
  id: string;
  model_spec: {
    constraints: {
      steps: {
        default: number;
        max: number;
      };
      widthHeightDivisor: number;
    };
  };
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(20);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/image/models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0].id);
        }
      } catch (err) {
        setError('Failed to load available models');
      }
    };

    fetchModels();
  }, []);

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          width,
          height,
          steps,
          cfgScale,
          model: selectedModel,
          safe_mode: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">AI Image Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="negativePrompt">Negative Prompt</Label>
              <Textarea
                id="negativePrompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Describe what you don't want in the image..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={64}
                  max={1280}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={64}
                  max={1280}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Steps ({steps})</Label>
              <Slider
                value={[steps]}
                onValueChange={([value]) => setSteps(value)}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>CFG Scale ({cfgScale})</Label>
              <Slider
                value={[cfgScale]}
                onValueChange={([value]) => setCfgScale(value)}
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <Button
              onClick={generateImage}
              disabled={isLoading || !prompt || !selectedModel}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </Button>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[512px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <img
                  src={`data:image/png;base64,${generatedImage}`}
                  alt="Generated"
                  className="w-full rounded-lg"
                />
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:image/png;base64,${generatedImage}`;
                    link.download = 'generated-image.png';
                    link.click();
                  }}
                  className="w-full"
                >
                  Download Image
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[512px] text-muted-foreground">
                No image generated yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 