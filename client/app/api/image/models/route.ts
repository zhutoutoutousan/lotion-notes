import { NextResponse } from 'next/server';

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_API_URL = 'https://api.venice.ai/api/v1/models';

if (!VENICE_API_KEY) {
  throw new Error('VENICE_API_KEY is not defined in environment variables');
}

export async function GET() {
  try {
    const response = await fetch(`${VENICE_API_URL}?type=image`, {
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();

    console.log(data);

    // Filter for image models only
    const imageModels = data.data.filter((model: any) => model.type === 'image');
    
    return NextResponse.json({ models: imageModels });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 