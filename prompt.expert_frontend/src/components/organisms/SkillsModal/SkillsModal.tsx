import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { Slider } from '../../atoms/Slider';
import { useSkillsCatalog } from '../../../hooks/useSkills';
import { useProfile, useUpdateSkill } from '../../../hooks/useProfile';
import { useUIStore } from '../../../store/ui.store';

export function SkillsModal() {
  const { isSkillsModalOpen, toggleSkillsModal } = useUIStore();
  const { data: catalog = [], isLoading: loadingCatalog } = useSkillsCatalog();
  const { data: profile } = useProfile();
  const { mutate: updateSkill, isPending: saving } = useUpdateSkill();

  // Local state: skillId -> level
  const [levels, setLevels] = useState<Record<number, number>>({});

  // Initialize with profile levels when catalog loads
  function getCurrentLevel(skillId: number): number {
    if (levels[skillId] !== undefined) return levels[skillId];
    const existing = profile?.skills.find((s) => s.skillId === skillId);
    return existing?.level ?? 1;
  }

  function handleSave(skillId: number) {
    const level = levels[skillId] ?? getCurrentLevel(skillId);
    updateSkill({ skillId, payload: { level } });
  }

  return (
    <AnimatePresence>
      {isSkillsModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="skills-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md"
            onClick={toggleSkillsModal}
          />

          {/* Modal */}
          <motion.div
            key="skills-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-deep rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/08">
                <div>
                  <h2 className="text-base font-semibold text-white/90">Gestionar Skills</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    Ajustá tu nivel de conocimiento en cada tecnología
                  </p>
                </div>
                <Button
                  id="close-skills-modal"
                  variant="ghost"
                  size="icon"
                  onClick={toggleSkillsModal}
                  aria-label="Cerrar modal de skills"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                {loadingCatalog ? (
                  <p className="text-sm text-white/30 text-center animate-pulse">
                    Cargando catálogo...
                  </p>
                ) : (
                  catalog.map((skill) => {
                    const level = getCurrentLevel(skill.skillId);
                    return (
                      <div key={skill.skillId} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-white/80">{skill.name}</span>
                            <span className="ml-2 text-xs text-white/30 capitalize">{skill.category}</span>
                          </div>
                          <Button
                            id={`save-skill-${skill.skillId}`}
                            variant="glass"
                            size="sm"
                            loading={saving}
                            onClick={() => handleSave(skill.skillId)}
                          >
                            Guardar
                          </Button>
                        </div>
                        <Slider
                          id={`slider-${skill.skillId}`}
                          value={level}
                          onChange={(v) =>
                            setLevels((prev) => ({ ...prev, [skill.skillId]: v }))
                          }
                        />
                        <div className="border-b border-white/05" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
