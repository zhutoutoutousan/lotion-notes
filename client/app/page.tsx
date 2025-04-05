"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { generateResponse } from "@/lib/services/deepseek";

export default function HomePage() {
  const [isChatActive, setIsChatActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Focus the input when chat becomes active
  useEffect(() => {
    if (isChatActive && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isChatActive]);

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!isChatActive && e.target.value.length > 0) {
      setIsChatActive(true);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;

    // Add user message
    const userMessage = chatInput;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setChatInput("");
    setIsLoading(true);
    
    try {
      // Get AI response from deepseek service
      const response = await generateResponse(userMessage);
      
      // Add AI response to messages
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again later.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    setIsChatActive(false);
    setChatInput("");
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {!isChatActive ? (
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
              Lotion Notes
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              Where your thoughts become a symphony of knowledge. 
              Let your ideas flow like the bass drops in a dark room, 
              creating connections that pulse with the rhythm of understanding.
            </p>

            <div className="space-y-4">
              <Link 
                href="/notes"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
              >
                Start Your Journey
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Sync Your Mind</h2>
                <p className="text-gray-300">
                  Let your thoughts sync like a perfect beat, creating a seamless flow of ideas that dance through your mind.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-pink-500 transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-4 text-pink-400">Build Your Universe</h2>
                <p className="text-gray-300">
                  Create your own digital dance floor where every note, every idea, every connection builds your unique universe.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-red-500 transition-colors duration-300">
                <h2 className="text-2xl font-bold mb-4 text-red-400">Share Your Vibe</h2>
                <p className="text-gray-300">
                  Drop your knowledge like a DJ drops beats. Share your unique sound with the world and let others dance to your rhythm.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <button 
                onClick={handleBackToHome}
                className="mr-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Chat with AI
              </h2>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4 h-[400px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Ask me anything about your notes or start a new conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.isUser 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'bg-gray-700 text-gray-200'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-gray-200 p-3 rounded-lg">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleChatSubmit} className="flex">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-l-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-r-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Send"
                )}
              </button>
            </form>
          </div>
        )}
        
        {!isChatActive && (
          <div className="max-w-3xl mx-auto mt-16">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-400"
                  onFocus={() => setIsChatActive(true)}
                />
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setIsChatActive(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

