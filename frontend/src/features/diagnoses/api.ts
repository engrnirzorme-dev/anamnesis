import { api } from '@/shared/api/client';
import { EP } from '@/shared/api/endpoints';
import type { Diagnosis, AiRequest } from '@/shared/types';

export const fetchDiagnoses = (): Promise<Diagnosis[]> => api.get<Diagnosis[]>(EP.diagnoses);

/**
 * List pending AI-зAprосов (используется for отображения «отправлено»)
 */
export const fetchPendingAiRequests = (): Promise<AiRequest[]> =>
  api.get<AiRequest[]>(`${EP.aiRequests}?status=pending`);

/**
 * Create AI-зAprос for сущности (диагноз, препарат, вofит, ...)
 */
export const createAiRequest = (entity_type: string, entity_id: number): Promise<AiRequest> =>
  api.post<AiRequest>(EP.aiRequests, { entity_type, entity_id });
