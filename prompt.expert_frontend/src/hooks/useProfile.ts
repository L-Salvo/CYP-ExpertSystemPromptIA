import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateSkillLevel } from '../api/profile.api';
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
