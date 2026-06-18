import { useMemo, useState } from 'react';
import { Button } from '../../atoms/Button';
import { Slider } from '../../atoms/Slider';
import { CategoryFilter } from '../../atoms/CategoryFilter';
import { Skeleton } from '../../../shared/ui';
import { useSkillsCatalog } from '../../../hooks/useSkills';
import { useProfile, useUpdateSkill } from '../../../hooks/useProfile';

export function SkillsSection() {
  const { data: fullCatalog = [] } = useSkillsCatalog();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: catalog = [], isLoading } = useSkillsCatalog(category);
  const { data: profile } = useProfile();
  const { mutate: updateSkill } = useUpdateSkill();

  const categories = useMemo(
    () => Array.from(new Set(fullCatalog.map((s) => s.category))).sort(),
    [fullCatalog],
  );

  const [levels, setLevels] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  function currentLevel(skillId: number): number {
    if (levels[skillId] !== undefined) return levels[skillId];
    return profile?.skills.find((s) => s.skillId === skillId)?.level ?? 1;
  }

  function save(skillId: number) {
    setSavingId(skillId);
    updateSkill(
      { skillId, payload: { level: currentLevel(skillId) } },
      { onSettled: () => setSavingId(null) },
    );
  }

  const mySkills = useMemo(() => {
    return catalog.filter((skill) =>
      profile?.skills.some((s) => s.skillId === skill.skillId)
    );
  }, [catalog, profile]);

  const availableSkills = useMemo(() => {
    return catalog.filter((skill) =>
      !profile?.skills.some((s) => s.skillId === skill.skillId)
    );
  }, [catalog, profile]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[var(--color-text-muted)]">
        Ajustá tu nivel en cada tecnología. El sistema experto lo usa para adaptar las respuestas.
      </p>
      
      <CategoryFilter categories={categories} active={category} onChange={setCategory} />
      
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton shape="line" width={120} />
              <Skeleton shape="line" height={8} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* SECCIÓN: MIS HABILIDADES */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
              Mis Habilidades ({mySkills.length})
            </h4>
            {mySkills.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic py-2">
                No tenés habilidades seleccionadas en esta categoría.
              </p>
            ) : (
              mySkills.map((skill) => (
                <div key={skill.skillId} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {skill.name}
                    </span>
                    <Button
                      variant="glass"
                      size="sm"
                      loading={savingId === skill.skillId}
                      onClick={() => save(skill.skillId)}
                    >
                      Guardar
                    </Button>
                  </div>
                  <Slider
                    id={`profile-slider-${skill.skillId}`}
                    value={currentLevel(skill.skillId)}
                    onChange={(v) => setLevels((prev) => ({ ...prev, [skill.skillId]: v }))}
                  />
                </div>
              ))
            )}
          </div>

          {/* SECCIÓN: DISPONIBLES PARA AGREGAR */}
          <div className="flex flex-col gap-4 mt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">
              Habilidades Disponibles ({availableSkills.length})
            </h4>
            {availableSkills.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic py-2">
                No hay más habilidades disponibles en esta categoría.
              </p>
            ) : (
              availableSkills.map((skill) => (
                <div key={skill.skillId} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">
                      {skill.name}
                    </span>
                    <Button
                      variant="glass"
                      size="sm"
                      loading={savingId === skill.skillId}
                      onClick={() => save(skill.skillId)}
                    >
                      Agregar
                    </Button>
                  </div>
                  <Slider
                    id={`profile-slider-${skill.skillId}`}
                    value={currentLevel(skill.skillId)}
                    onChange={(v) => setLevels((prev) => ({ ...prev, [skill.skillId]: v }))}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
