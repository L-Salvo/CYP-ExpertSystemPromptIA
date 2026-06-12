import client from './client';
import type { ProfileResponse, SkillResponse, UpdateSkillLevelRequest } from '../types/api.types';

/** GET /api/profile — Obtener el perfil completo del usuario */
export async function getProfile(): Promise<ProfileResponse> {
  const { data } = await client.get<ProfileResponse>('/profile');
  return data;
}

/** PUT /api/profile/skills/{skillId} — Actualizar nivel de una skill */
export async function updateSkillLevel(
  skillId: number,
  payload: UpdateSkillLevelRequest
): Promise<SkillResponse> {
  const { data } = await client.put<SkillResponse>(`/profile/skills/${skillId}`, payload);
  return data;
}
