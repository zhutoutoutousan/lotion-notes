import { NextResponse } from 'next/server';

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_API_URL = 'https://api.venice.ai/api/v1/image/generate';

if (!VENICE_API_KEY) {
  throw new Error('VENICE_API_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, width, height, steps, cfgScale, model } = body;

    const response = await fetch(VENICE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        steps,
        cfg_scale: cfgScale,
        model,
        format: 'png',
        return_binary: false,
        safe_mode: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    return NextResponse.json({ image: data.images[0] });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 