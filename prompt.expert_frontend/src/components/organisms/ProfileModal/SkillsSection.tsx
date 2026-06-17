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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[var(--color-text-muted)]">
        Ajustá tu nivel en cada tecnología. El sistema experto lo usa para adaptar las respuestas.
      </p>
      <CategoryFilter categories={categories} active={category} onChange={setCategory} />
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton shape="line" width={120} />
              <Skeleton shape="line" height={8} />
            </div>
          ))
        : catalog.map((skill) => {
            const inProfile = profile?.skills.some((s) => s.skillId === skill.skillId);
            return (
              <div key={skill.skillId} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{skill.name}</span>
                    {!inProfile && (
                      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">nueva</span>
                    )}
                  </div>
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
                <div className="border-b border-[var(--color-border)]" />
              </div>
            );
          })}
    </div>
  );
}
