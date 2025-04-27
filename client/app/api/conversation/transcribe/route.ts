import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

if (!ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // First, upload the audio file to AssemblyAI
    const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
      },
      body: audioFile,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio file');
    }

    const { upload_url } = await uploadResponse.json();

    console.log('upload_url', upload_url);

    // Then, submit the transcription job
    const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_detection: true,
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
        transcript = result.text;
      } else if (result.status === 'error') {
        throw new Error('Transcription failed');
      } else {
        // Wait for 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error('Error in transcription:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 