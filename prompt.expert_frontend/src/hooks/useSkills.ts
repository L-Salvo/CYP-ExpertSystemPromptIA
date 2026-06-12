import { useQuery } from '@tanstack/react-query';
import { getSkillsCatalog } from '../api/skills.api';

export const SKILLS_CATALOG_KEY = ['skills', 'catalog'] as const;

/** Query: GET /api/skills */
export function useSkillsCatalog(category?: string) {
  return useQuery({
    queryKey: [...SKILLS_CATALOG_KEY, category],
    queryFn: () => getSkillsCatalog(category),
    staleTime: 1000 * 60 * 10, // 10 min — el catálogo cambia poco
  });
}
