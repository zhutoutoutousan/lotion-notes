import React, { useState, useEffect, useRef } from 'react';
import { createChatCompletion, Message } from '../lib/deepseek';

// Add type definitions for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface LanguageChatboxProps {
  targetLanguage: string;
  sourceLanguage: string;
}

// Add language ID mapping for Camb.ai
const LANGUAGE_IDS = {
  'en': 1,    // English
  'es': 2,    // Spanish
  'fr': 3,    // French
  'de': 4,    // German
  'it': 5,    // Italian
  'pt': 6,    // Portuguese
  'ru': 7,    // Russian
  'ja': 8,    // Japanese
  'ko': 9,    // Korean
  'zh': 10,   // Chinese
  'hi': 11,   // Hindi
  'ar': 12,   // Arabic
  'tr': 13,   // Turkish
  'nl': 14,   // Dutch
  'pl': 15,   // Polish
  'sv': 16,   // Swedish
  'da': 17,   // Danish
  'fi': 18,   // Finnish
  'no': 19,   // Norwegian
  'cs': 20,   // Czech
  'el': 21,   // Greek
  'he': 22,   // Hebrew
  'hu': 23,   // Hungarian
  'id': 24,   // Indonesian
  'ms': 25,   // Malay
  'ro': 26,   // Romanian
  'sk': 27,   // Slovak
  'th': 28,   // Thai
  'uk': 29,   // Ukrainian
  'vi': 30,   // Vietnamese
} as const;

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent: string;
    age: string;
    gender: string;
    usecase: string;
    language?: string;
  };
  high_quality_base_model_ids?: string[];
}

export const LanguageChatbox: React.FC<LanguageChatboxProps> = ({ targetLanguage, sourceLanguage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'chat' | 'listening'>('chat');
  const [listeningText, setListeningText] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const textToSpeech = async (text: string) => {
    try {
      setIsProcessing(true);

      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      // Fetch voices
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.voices || !Array.isArray(data.voices)) {
        throw new Error('Invalid response format from ElevenLabs API');
      }

      // Filter out cloned voices and only use premade ones
      const premadeVoices = data.voices.filter((voice: ElevenLabsVoice) => voice.category === 'premade');
      
      if (premadeVoices.length === 0) {
        throw new Error('No premade voices available');
      }

      // Pick a random voice from the premade voices
      const randomVoice = premadeVoices[Math.floor(Math.random() * premadeVoices.length)];
      console.log('Selected random voice:', randomVoice.name);

      if (!randomVoice.voice_id) {
        throw new Error('Failed to select a random voice');
      }

      // Get language code from target language (e.g., "en-US" -> "en")
      const languageCode = targetLanguage.split('-')[0];
      
      console.log('Creating WebSocket connection with voice ID:', randomVoice.voice_id);
      
      // Create WebSocket connection with proper authentication and language code
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/text-to-speech/${randomVoice.voice_id}/stream-input?model_id=eleven_multilingual_v2&xi-api-key=${apiKey}`);
      wsRef.current = ws;

      // Handle WebSocket events
      ws.onopen = () => {
        console.log('WebSocket connection opened');
        // Send initial configuration with voice settings
        ws.send(JSON.stringify({
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          },
          model_id: "eleven_multilingual_v2",
          xi_api_key: apiKey
        }));

        // Send the actual text
        ws.send(JSON.stringify({
          text: text,
          try_trigger_generation: true,
          model_id: "eleven_multilingual_v2",
          xi_api_key: apiKey
        }));

        // Send empty text to signal end
        ws.send(JSON.stringify({
          text: "",
          model_id: "eleven_multilingual_v2",
          xi_api_key: apiKey
        }));
      };

      // Create audio context and buffer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      let audioChunks: ArrayBuffer[] = [];

      ws.onmessage = async (event) => {
        console.log('Received WebSocket message');
        const data = JSON.parse(event.data);
        
        if (data.audio) {
          console.log('Received audio data');
          // Convert base64 to ArrayBuffer
          const binaryString = atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioChunks.push(bytes.buffer);
        }
      };

      ws.onclose = async (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (audioChunks.length > 0) {
          console.log('Processing audio chunks');
          try {
            // Combine all chunks into a single ArrayBuffer
            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
            const combinedBuffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of audioChunks) {
              combinedBuffer.set(new Uint8Array(chunk), offset);
              offset += chunk.byteLength;
            }

            // Decode the MP3 data
            const audioBuffer = await audioContext.decodeAudioData(combinedBuffer.buffer);
            
            // Play the decoded audio
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
            console.log('Audio playback started');
          } catch (error) {
            console.error('Error processing audio:', error);
          }
        } else {
          console.log('No audio chunks received');
        }
        setIsProcessing(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsProcessing(false);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Error occurred while generating speech. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      };

    } catch (error) {
      console.error('TTS Error:', error);
      setIsProcessing(false);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error while trying to speak. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = sourceLanguage;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize audio element
    audioRef.current = new Audio();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLanguage]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    const userMessage: Message = {
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await createChatCompletion([...messages, userMessage]);
      
      // Remove any translation/response markers and use the response directly
      const cleanResponse = response.replace(/^\*\*Response:\*\*\s*"|"$/g, '');
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Use the cleaned response for TTS
      await textToSpeech(cleanResponse);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Add function to generate listening comprehension exercise
  const generateListeningExercise = async () => {
    setIsProcessing(true);
    try {
      const prompt = `Generate a short listening comprehension exercise in ${targetLanguage}. 
        The exercise should be a simple dialogue or short story with 3-4 sentences. 
        Make it appropriate for language learners. 
        Format: Just the text, no additional markers or explanations.`;
      
      const response = await createChatCompletion([{
        role: 'system',
        content: prompt
      }]);
      
      setListeningText(response);
      await textToSpeech(response);
    } catch (error) {
      console.error('Error generating exercise:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add function to check user's answer
  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    setIsProcessing(true);
    try {
      const prompt = `Compare these two texts and determine if they match in meaning:
        Original: "${listeningText}"
        User's answer: "${userAnswer}"
        Respond with just "correct" or "incorrect" based on meaning, not exact wording.`;
      
      const response = await createChatCompletion([{
        role: 'system',
        content: prompt
      }]);
      
      setIsCorrect(response.toLowerCase().includes('correct'));
      
      // Provide feedback
      const feedbackMessage: Message = {
        role: 'assistant',
        content: isCorrect 
          ? 'Correct! Well done! 🎉' 
          : 'Not quite right. Here\'s the original text for reference: ' + listeningText
      };
      setMessages(prev => [...prev, feedbackMessage]);
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-2xl p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'chat' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMode('listening')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'listening' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            听力完形填空
          </button>
        </div>
      </div>

      {mode === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg max-w-[80%] transform transition-all duration-300 hover:scale-[1.02] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 ml-auto text-white' 
                    : 'bg-gray-800 text-gray-100'
                } shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold mb-1">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="text-base">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg shadow-lg">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder={`Type in ${sourceLanguage}...`}
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200"
              disabled={isProcessing}
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={isProcessing}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Send
            </button>
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-3 rounded-lg text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <span className="flex items-center">
                  <span className="animate-pulse mr-2">●</span>
                  Stop
                </span>
              ) : (
                'Listen'
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex-1 bg-gray-800 p-4 rounded-lg">
            {listeningText ? (
              <div className="space-y-4">
                <div className="text-gray-300">
                  <h3 className="font-semibold mb-2">Listen and type what you hear:</h3>
                  <button
                    onClick={() => textToSpeech(listeningText)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    Play Again
                  </button>
                </div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type what you hear..."
                  className="w-full h-32 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <div className="flex justify-between">
                  <button
                    onClick={checkAnswer}
                    disabled={isProcessing || !userAnswer.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Check Answer
                  </button>
                  <button
                    onClick={generateListeningExercise}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    New Exercise
                  </button>
                </div>
                {isCorrect !== null && (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-semibold mb-2 text-gray-300">Original Text:</h4>
                    <p className="text-white">{listeningText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-4">听力完形填空</h3>
                <p className="text-gray-400 mb-4">Practice your listening comprehension skills</p>
                <button
                  onClick={generateListeningExercise}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Start Exercise
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 