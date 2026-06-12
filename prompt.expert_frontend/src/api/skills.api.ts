import client from './client';
import type { SkillCatalogItem } from '../types/api.types';

/** GET /api/skills — Obtener el catálogo completo de skills */
export async function getSkillsCatalog(category?: string): Promise<SkillCatalogItem[]> {
  const { data } = await client.get<SkillCatalogItem[]>('/skills', {
    params: category ? { category } : undefined,
  });
  return data;
}
