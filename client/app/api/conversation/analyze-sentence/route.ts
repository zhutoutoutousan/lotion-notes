import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/lemur/v3/generate/task';

if (!ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { sentence, transcript_id } = await request.json();
    if (!sentence) {
      return NextResponse.json({ error: 'sentence is required' }, { status: 400 });
    }
    if (!transcript_id) {
      return NextResponse.json({ error: 'transcript_id is required' }, { status: 400 });
    }

    const prompt = `You are an expert sales coach analyzing a car dealership sales conversation. For the following sentence and its context, provide a detailed, actionable review in this JSON format:

{
  "red_flags": [ { "title": string, "details": string } ],
  "missed_opportunities": [ string ],
  "coaching_suggestion": string,
  "ai_insight": string
}

- If there are any major sales mistakes, list them as red_flags (with a short title and details).
- If there are any missed opportunities (e.g., not handling objections, not setting next steps, not tying features to pain points), list them in missed_opportunities.
- For each red flag or missed opportunity, provide a specific, actionable coaching_suggestion tailored to this moment.
- If the sentence is neutral or positive, provide a concise ai_insight (e.g., "Rep identified pain points but didn't ask follow-up questions").
- If there is nothing significant to note, return an empty object {}.

Focus on:
- Objection handling (e.g., price, competitor, timing)
- Next steps and closing
- Needs assessment and value proposition
- Rapport building and information gathering
- Tying features to pain points

Be specific, concise, and actionable. Do not return generic or vague feedback.

Sentence: "${sentence}"
`;

    const response = await fetch(ASSEMBLYAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        final_model: "anthropic/claude-3-sonnet",
        prompt,
        transcript_ids: [transcript_id],
        max_output_size: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze sentence');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in sentence analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentence' },
      { status: 500 }
    );
  }
} 