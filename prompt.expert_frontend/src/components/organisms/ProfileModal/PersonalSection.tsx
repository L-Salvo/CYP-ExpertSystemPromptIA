import { useState, useEffect } from 'react';
import { Button } from '../../atoms/Button';
import { Input, Select, SkeletonText } from '../../../shared/ui';
import { OptionCard } from '../../onboarding/OptionCard';
import { useProfile } from '../../../hooks/useProfile';
import { useOnboarding } from '../../../hooks/useAuth';
import { useSessionStore } from '../../../store/session.store';
import { EDU_OPTIONS, isStudentLevel } from '../../../shared/lib/education';
import type { EducationLevel } from '../../../types/api.types';

export function PersonalSection() {
  const userId = useSessionStore((s) => s.user?.userId);
  const { data: profile, isLoading } = useProfile();
  const { mutate: save, isPending: saving } = useOnboarding();

  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [studyYear, setStudyYear] = useState('');
  const [worksInIT, setWorksInIT] = useState<boolean | null>(null);

  // Hydrate from profile when it loads.
  useEffect(() => {
    if (!profile) return;
    setEducationLevel(profile.educationLevel ?? '');
    setStudyYear(profile.studyYear != null ? String(profile.studyYear) : '');
    setWorksInIT(profile.worksInIT ?? null);
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonText lines={4} />
      </div>
    );
  }
  if (!profile) {
    return <p className="text-sm text-[var(--color-text-muted)]">No se pudo cargar el perfil.</p>;
  }

  const isStudent = isStudentLevel(educationLevel || null);
  const hasNoSkills = profile.skills.length === 0;

  const dirty =
    educationLevel !== (profile.educationLevel ?? '') ||
    (studyYear || '') !== (profile.studyYear != null ? String(profile.studyYear) : '') ||
    worksInIT !== (profile.worksInIT ?? null);

  const canSave =
    !!educationLevel &&
    worksInIT !== null &&
    !hasNoSkills &&
    (!isStudent || (!!studyYear && Number(studyYear) >= 1)) &&
    dirty;

  function handleSave() {
    if (!userId || !educationLevel || worksInIT === null) return;
    // Onboarding PUT reemplaza todo: conservamos las skills actuales del perfil.
    save({
      userId,
      payload: {
        educationLevel,
        studyYear: isStudent ? Number(studyYear) : null,
        worksInIT,
        skills: profile!.skills.map((s) => ({ skillId: s.skillId, level: s.level })),
      },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identity (read-only) */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-3)] border border-[var(--color-border)] flex items-center justify-center text-xl font-semibold text-[var(--color-text-primary)]">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--color-text-primary)] truncate">{profile.name}</p>
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Nivel educativo"
          placeholder="Seleccioná…"
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
          options={EDU_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        {isStudent && (
          <Input
            label="Año de cursada"
            type="number"
            min={1}
            max={7}
            placeholder="Ej: 3"
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">¿Trabajás en IT?</span>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={worksInIT === true} onSelect={() => setWorksInIT(true)} title="Sí" />
          <OptionCard selected={worksInIT === false} onSelect={() => setWorksInIT(false)} title="No" />
        </div>
      </div>

      {hasNoSkills && (
        <p className="text-xs text-[var(--color-warning)]">
          Agregá al menos una skill (pestaña Skills) para poder guardar tu perfil.
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave} loading={saving} disabled={!canSave}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
