'use client';

import { useState } from 'react';
import { useActions, useUIState, useAIState } from '@ai-sdk/rsc';
import type { AI } from './action';

export default function Page() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { sendMessage } = useActions<typeof AI>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const val = inputValue;
    setInputValue('');

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now().toString(),
        role: 'user',
        display: `User: ${val}`,
      },
    ]);

    try {
      const responseMessage = await sendMessage(val);
      setMessages((currentMessages) => [
        ...currentMessages,
        responseMessage,
      ]);
    } catch (error) {
      console.error("Server Action Error:", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          display: "Error: Failed to process Server Action. Check server logs.",
        },
      ]);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Vercel AI SDK Vulnerability PoC</h1>
        <p className="mb-6 text-zinc-400 text-sm leading-relaxed max-w-xl">
          This chat uses React Server Components. The AI State is synchronized with the client. 
          We will intercept the Server Action request to prove we can poison the state and bypass the internal System prompt.
        </p>

        <div className="border border-zinc-800 bg-zinc-950 p-6 mb-6 rounded-xl shadow-2xl h-[500px] overflow-y-auto flex flex-col gap-4">
          {messages.map((message) => (
            <div key={message.id} className={`p-3 rounded-lg max-w-[85%] ${
              message.role === 'user' 
                ? 'bg-blue-900/30 border border-blue-500/20 text-blue-200 self-end' 
                : 'bg-zinc-900 border border-zinc-700 text-zinc-200 self-start'
            }`}>
               <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </p>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.display}
              </pre>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            placeholder="Type a message..."
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95">
            Send Action
          </button>
        </form>
        
        <div className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Current AI State (Visible for debugging)</h2>
          <pre className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg overflow-x-auto text-[10px] text-zinc-500 font-mono shadow-inner">
            {JSON.stringify(aiState, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
