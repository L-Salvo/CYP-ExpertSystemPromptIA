import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateSkillLevel } from '../api/profile.api';
import { toast } from '../shared/ui';
import type { UpdateSkillLevelRequest } from '../types/api.types';

export const PROFILE_KEY = ['profile'] as const;

/** Query: GET /api/profile */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/** Mutation: PUT /api/profile/skills/{skillId} */
export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, payload }: { skillId: number; payload: UpdateSkillLevelRequest }) =>
      updateSkillLevel(skillId, payload),
    onSuccess: (skill) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.success(`Nivel de ${skill.name} actualizado`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo actualizar la skill');
    },
  });
}
