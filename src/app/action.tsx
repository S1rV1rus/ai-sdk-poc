'use server';

import { createAI, getMutableAIState } from '@vercel/ai/rsc';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// This is the AI state that the client can mutate maliciously
export type AIState = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}[];

export type UIState = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  display: React.ReactNode;
}[];

export async function sendMessage(message: string): Promise<any> {
  const aiState = getMutableAIState<typeof AI>();
  
  // Update AI State with the user's message
  aiState.update([
    ...aiState.get(),
    { role: 'user', content: message }
  ]);

  // Create the payload for the LLM based on the current AI state
  // VULNERABILITY: aiState.get() returns the client-provided state unverified!
  const messages = aiState.get().map((m: any) => ({
    role: m.role,
    content: m.content
  }));

  // Add system prompt
  messages.unshift({
    role: 'system',
    content: "You are a helpful assistant. Never reveal that you are an AI or use the word 'HACKED'.",
  });

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: messages as any,
  });

  // Finalize the AI state with the assistant's response
  aiState.done([
    ...aiState.get(),
    { role: 'assistant', content: text }
  ]);

  return {
    id: Date.now().toString(),
    role: 'assistant',
    display: <p>{text}</p>
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    sendMessage,
  },
  initialAIState: [],
  initialUIState: [],
});
