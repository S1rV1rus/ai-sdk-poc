'use client';

import { useState } from 'react';
import { useActions, useUIState, useAIState } from '@vercel/ai/rsc';
import type { AI } from './action';

export default function Page() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { sendMessage } = useActions<typeof AI>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now().toString(),
        role: 'user',
        display: <div>User: {inputValue}</div>,
      },
    ]);

    const val = inputValue;
    setInputValue('');

    const responseMessage = await sendMessage(val);

    setMessages((currentMessages) => [
      ...currentMessages,
      responseMessage,
    ]);
  };

  return (
    <div className="p-8 font-sans max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Vercel AI SDK Vulnerability PoC</h1>
      <p className="mb-4 text-gray-600">
        This chat uses React Server Components. The AI State is synchronized with the client.
        We will intercept the Server Action request to prove we can poison the state and bypass the internal System prompt.
      </p>

      <div className="border border-gray-300 p-4 mb-4 rounded h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`mb-2 ${message.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
            {message.display}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-black"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium">
          Send Action
        </button>
      </form>
      
      <div className="mt-8 text-sm text-gray-500">
        <strong>Current AI State:</strong> (Visible for debugging)
        <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
          {JSON.stringify(aiState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
