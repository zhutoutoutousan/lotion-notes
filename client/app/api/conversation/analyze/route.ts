import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

if (!ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { audio_url } = await request.json();
    if (!audio_url) {
      return NextResponse.json({ error: 'audio_url is required' }, { status: 400 });
    }

    console.log('audio_url', audio_url);

    // Submit the audio URL to AssemblyAI
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

    console.log('transcriptResponse', transcriptResponse);

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

    return NextResponse.json({
      ...transcript,
      sentences: sentences.sentences
    });
  } catch (error) {
    console.error('Error in conversation analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audio' },
      { status: 500 }
    );
  }
} 