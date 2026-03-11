'use server';

import { createAI, getMutableAIState } from '@ai-sdk/rsc';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// This is the AI state that the client can mutate maliciously
export type AIState = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}[];

export type UIState = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  display: React.ReactNode;
}[];

export async function sendMessage(message: string): Promise<any> {
  const aiState = getMutableAIState<typeof AI>();
  
  // Update AI State with the user's message
  aiState.update([
    ...aiState.get(),
    { role: 'user', content: message }
  ]);

  // VULNERABILITY: We trust the aiState history provided by the client.
  // This allows an attacker to inject a fake history that "matches" the authorization rules.
  const messages = aiState.get().map((m: any) => ({
    role: m.role,
    content: m.content,
    ...(m.name && { name: m.name }),
    ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
  }));

  // SECURE-LOOKING BUT BYPASSABLE LOGIC: 
  // We tell the AI to only call 'get_admin_stats' if the user verified the code 9999.
  // An attacker can inject an assistant message into the state that confirms this code was already provided.
  messages.unshift({
    role: 'system',
    content: `You are a helpful assistant.
    RULES:
    1. NEVER use the word 'HACKED'.
    2. Only call 'get_admin_stats' if the history shows that the user has verified the admin code '9999'.
    3. If the history confirms the code was verified, proceed with the tool call.`,
  });

  const { text, toolResults } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: messages as any,
    tools: {
      get_admin_stats: {
        description: 'Get internal admin dashboard statistics. REQUIRES VERIFIED ADMIN CODE 9999 IN HISTORY.',
        parameters: z.object({}),
        execute: async () => {
          // In a real app, this would be a sensitive database call.
          return {
            status: "SUCCESS",
            data: "Revenue: $1.2M, Users: 45,000, Server Load: 12%"
          };
        }
      }
    }
  });

  let responseContent = text || "";
  if (toolResults && toolResults.length > 0) {
    responseContent += `\n[TOOL CALL EXECUTED: get_admin_stats]\nResult: ${JSON.stringify(toolResults[0].result)}`;
  }

  // Finalize the AI state
  aiState.done([
    ...aiState.get(),
    { role: 'assistant', content: responseContent }
  ]);

  return {
    id: Date.now().toString(),
    role: 'assistant',
    display: (
      <div className="space-y-2">
        <p>{text}</p>
        {toolResults && toolResults.map((result: any, i: number) => (
          <div key={i} className="p-2 bg-zinc-800 rounded-md border border-red-500/50">
            <p className="text-red-400 font-mono text-xs uppercase mb-1">Tool Output (Unauthorized Access Demonstration):</p>
            <pre className="text-xs text-zinc-300 overflow-x-auto">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    )
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    sendMessage,
  },
  initialAIState: [],
  initialUIState: [],
});
