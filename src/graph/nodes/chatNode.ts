import type { Runtime } from '@langchain/langgraph';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/chatResponse.ts';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ChatResponseSchema } from '../../prompts/v1/chatResponse.ts';

export function createChatNode(llmClient: OpenRouterService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {

    const userContext = state.userContext || '';
    const systemPrompt = getSystemPrompt(userContext)

    const conversetionHistory = state.messages
     .map(msg => `${HumanMessage.isInstance(msg) ? 'Human' : 'AI'}: ${msg.content}`)
     .join('\n');

    const userMessage = state.messages.at(-1)?.text as string;
    const userPrompt = getUserPromptTemplate(
      userMessage,
      conversetionHistory
    )

    const result = await llmClient.generateStructured(
      systemPrompt,
      userPrompt,
      ChatResponseSchema,
    )

    if(!result.success || !result.data) {
      console.error('❌ Erro ao gerar resposta estruturada:', result);
    return {
      messages:[
        new AIMessage('Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.')
      ]
    };
  };


    const response = result.data
    return {
      messages: [
        new AIMessage(response.message)
      ],
      extractedPreferences: response .shouldSavePreferences ? response.preferences : undefined,
      needsSummarization: false,
    };
  }
};
