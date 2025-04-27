import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
const ASSEMBLYAI_LEMUR_URL = 'https://api.assemblyai.com/lemur/v3/generate/task';

if (!ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { audio_url } = await request.json();
    if (!audio_url) {
      return NextResponse.json({ error: 'audio_url is required' }, { status: 400 });
    }

    // Submit the audio URL to AssemblyAI for transcription
    const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url
      }),
    });

    if (!transcriptResponse.ok) {
      throw new Error('Failed to submit transcription job');
    }

    const { id } = await transcriptResponse.json();

    // Poll for the transcription result
    let transcript = null;
    while (!transcript) {
      const pollingResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${id}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY as string,
        },
      });

      if (!pollingResponse.ok) {
        throw new Error('Failed to get transcription status');
      }

      const result = await pollingResponse.json();
      if (result.status === 'completed') {
        transcript = result;
      } else if (result.status === 'error') {
        throw new Error('Transcription failed');
      } else {
        // Wait for 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Get sentences from the transcript
    const sentencesResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${id}/sentences`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
      },
    });

    if (!sentencesResponse.ok) {
      throw new Error('Failed to get sentences from transcript');
    }

    const sentences = await sentencesResponse.json();

    // Now perform traffic light analysis on the transcript
    const prompt = `You are an expert sales coach analyzing a car dealership sales conversation. Review the transcript and identify the most important sentences that need analysis. For each selected sentence, provide a detailed, actionable review in this JSON format:

{
  "sentences": [
    {
      "text": string,
      "traffic_light": "red" | "yellow" | "green",
      "analysis": {
        "red_flags": [ { "title": string, "details": string } ],
        "missed_opportunities": [ string ],
        "coaching_suggestion": string,
        "ai_insight": string
      }
    }
  ],
  "overall_analysis": {
    "strengths": [ string ],
    "areas_for_improvement": [ string ],
    "key_insights": [ string ],
    "recommendations": [ string ]
  }
}

Guidelines for selecting sentences:
- Focus on critical moments in the sales conversation
- Include sentences that demonstrate good or bad sales techniques
- Select sentences where objections are handled or missed
- Include key moments of rapport building or missed opportunities
- Choose sentences that show effective or ineffective needs assessment
- Include moments where features are tied to pain points or where this connection is missed

For each selected sentence:
- Assign a traffic light rating (red, yellow, green) based on the quality of the sales interaction
- If there are any major sales mistakes, list them as red_flags (with a short title and details)
- If there are any missed opportunities, list them in missed_opportunities
- Provide a specific, actionable coaching_suggestion tailored to this moment
- If the sentence is neutral or positive, provide a concise ai_insight

For the overall analysis:
- List key strengths in the conversation
- Identify areas for improvement
- Provide key insights about the sales approach
- Give specific recommendations for future conversations

Focus on:
- Objection handling (e.g., price, competitor, timing)
- Next steps and closing
- Needs assessment and value proposition
- Rapport building and information gathering
- Tying features to pain points

Be specific, concise, and actionable. Do not return generic or vague feedback.`;

    const analysisResponse = await fetch(ASSEMBLYAI_LEMUR_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        final_model: "anthropic/claude-3-sonnet",
        prompt,
        transcript_ids: [id],
        max_output_size: 4000,
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze transcript');
    }

    const analysisData = await analysisResponse.json();
    
    // Parse the LeMUR response to get pure JSON
    let trafficLightAnalysis;
    try {
      // Extract the JSON from the response string
      const jsonMatch = analysisData.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        trafficLightAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing LeMUR response:', error);
      throw new Error('Failed to parse analysis response');
    }

    // Create a map of analyzed sentences for quick lookup
    const analyzedSentencesMap = new Map(
      trafficLightAnalysis.sentences.map((s: any) => [s.text, s])
    );

    // Attach traffic light analysis to the sentences
    const sentencesWithAnalysis = sentences.sentences.map((sentence: any) => ({
      ...sentence,
      analysis: analyzedSentencesMap.get(sentence.text) || null
    }));

    return NextResponse.json({
      ...transcript,
      sentences: sentencesWithAnalysis,
      traffic_light_analysis: {
        sentences: trafficLightAnalysis.sentences,
        overall_analysis: trafficLightAnalysis.overall_analysis
      }
    });
  } catch (error) {
    console.error('Error in transcript analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    );
  }
} 