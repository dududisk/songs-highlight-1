import type { Runtime } from '@langchain/langgraph';
import type { GraphState } from '../graph.ts';
import { PreferencesService } from '../../services/preferencesService.ts';

export function createSavePreferencesNode(preferencesService: PreferencesService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {
    if (!state.extractedPreferences) return{}

    const userId = String(runtime?.context?.userID || state.userId || 'unknown')
    await preferencesService.mergePreferences(userId, state.extractedPreferences)

    const basicInfo = await preferencesService.getBasicInfo(userId);
    if (basicInfo && runtime?.store) {
    await runtime.store.put(['memories', userId], 'preferences', { data: basicInfo });
    }
  
    return {
      extractedPreferences: undefined,
    };
  };
}
