import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, GraduationCap, Check } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Slider } from '../components/atoms/Slider';
import { Input, Skeleton } from '../shared/ui';
import { OptionCard } from '../components/onboarding/OptionCard';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { useSkillsCatalog } from '../hooks/useSkills';
import { useOnboarding } from '../hooks/useAuth';
import { useSessionStore } from '../store/session.store';
import { EDU_OPTIONS, isStudentLevel } from '../shared/lib/education';
import type { EducationLevel, OnboardingRequest } from '../types/api.types';

const STEPS = ['Educación', 'Experiencia', 'Skills'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const { data: catalog = [], isLoading: loadingCatalog } = useSkillsCatalog();
  const { mutate: submitOnboarding, isPending: submitting } = useOnboarding();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [studyYear, setStudyYear] = useState<string>('');
  const [worksInIT, setWorksInIT] = useState<boolean | null>(null);
  const [skillLevels, setSkillLevels] = useState<Record<number, number>>({});

  const isStudent = isStudentLevel(educationLevel);
  const selectedSkillCount = Object.keys(skillLevels).length;

  function canProceed(): boolean {
    if (step === 0) {
      if (!educationLevel) return false;
      if (isStudent && (!studyYear || Number(studyYear) < 1)) return false;
      return true;
    }
    if (step === 1) return worksInIT !== null;
    if (step === 2) return selectedSkillCount >= 1;
    return false;
  }

  function goNext() {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function toggleSkill(skillId: number) {
    setSkillLevels((prev) => {
      const next = { ...prev };
      if (next[skillId] !== undefined) delete next[skillId];
      else next[skillId] = 5;
      return next;
    });
  }

  function handleSubmit() {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const payload: OnboardingRequest = {
      educationLevel: educationLevel!,
      studyYear: isStudent ? Number(studyYear) : null,
      worksInIT: worksInIT!,
      skills: Object.entries(skillLevels).map(([id, level]) => ({ skillId: Number(id), level })),
    };
    submitOnboarding(
      { userId: user.userId, payload },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface-0)]">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
              Configurá tu perfil
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Esto permite al sistema experto adaptar las respuestas a tu nivel.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex-shrink-0">
            Continuar luego
          </Button>
        </div>

        <OnboardingProgress steps={STEPS} current={step} />

        {/* Step content */}
        <div className="glass rounded-2xl p-6 min-h-[320px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col gap-4"
            >
              {step === 0 && (
                <>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <GraduationCap size={16} className="text-[var(--color-aurora-1)]" />
                    ¿Cuál es tu nivel educativo?
                  </h2>
                  <div className="flex flex-col gap-2">
                    {EDU_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={educationLevel === opt.value}
                        onSelect={() => setEducationLevel(opt.value)}
                        title={opt.label}
                        description={opt.desc}
                      />
                    ))}
                  </div>
                  {isStudent && (
                    <Input
                      label="Año de cursada"
                      type="number"
                      min={1}
                      max={7}
                      placeholder="Ej: 3"
                      value={studyYear}
                      onChange={(e) => setStudyYear(e.target.value)}
                      className="max-w-[140px]"
                    />
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Briefcase size={16} className="text-[var(--color-aurora-1)]" />
                    ¿Trabajás en el sector IT?
                  </h2>
                  <div className="flex flex-col gap-2">
                    <OptionCard
                      selected={worksInIT === true}
                      onSelect={() => setWorksInIT(true)}
                      title="Sí, trabajo en IT"
                      description="Desarrollo, infraestructura, datos, etc."
                    />
                    <OptionCard
                      selected={worksInIT === false}
                      onSelect={() => setWorksInIT(false)}
                      title="No, todavía no"
                      description="Estudio o trabajo en otra área"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Check size={16} className="text-[var(--color-aurora-1)]" />
                    Elegí tus skills y nivel
                    <span className="ml-auto text-xs font-normal text-[var(--color-text-muted)]">
                      {selectedSkillCount} seleccionada{selectedSkillCount === 1 ? '' : 's'}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {loadingCatalog
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} shape="line" height={44} className="rounded-xl" />
                        ))
                      : catalog.map((skill) => {
                          const selected = skillLevels[skill.skillId] !== undefined;
                          return (
                            <div
                              key={skill.skillId}
                              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 flex flex-col gap-3"
                            >
                              <button
                                type="button"
                                onClick={() => toggleSkill(skill.skillId)}
                                aria-pressed={selected}
                                className="flex items-center justify-between gap-2 text-left"
                              >
                                <span>
                                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                    {skill.name}
                                  </span>
                                  <span className="ml-2 text-xs text-[var(--color-text-muted)] capitalize">
                                    {skill.category.toLowerCase().replace('_', ' ')}
                                  </span>
                                </span>
                                <span
                                  className={
                                    selected
                                      ? 'text-xs font-medium text-[var(--color-aurora-2)]'
                                      : 'text-xs text-[var(--color-text-muted)]'
                                  }
                                >
                                  {selected ? 'Quitar' : 'Agregar'}
                                </span>
                              </button>
                              {selected && (
                                <Slider
                                  id={`onb-slider-${skill.skillId}`}
                                  value={skillLevels[skill.skillId]}
                                  onChange={(v) =>
                                    setSkillLevels((prev) => ({ ...prev, [skill.skillId]: v }))
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={goBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft size={15} />
            Atrás
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!canProceed()}
            loading={submitting}
            className="gap-2 min-w-[140px]"
          >
            {step === STEPS.length - 1 ? 'Finalizar' : 'Continuar'}
            {step < STEPS.length - 1 && <ArrowRight size={15} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
