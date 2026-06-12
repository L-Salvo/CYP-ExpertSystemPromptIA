import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SkillBadge } from '../../molecules/SkillBadge';
import { useProfile } from '../../../hooks/useProfile';
import { useUIStore } from '../../../store/ui.store';

const EDU_LABELS: Record<string, string> = {
  SECONDARY_STUDENT: 'Estudiante secundario',
  TERTIARY_STUDENT: 'Estudiante terciario',
  UNIVERSITY_STUDENT: 'Estudiante universitario',
  GRADUATED: 'Graduado',
  POSTGRADUATE: 'Posgrado',
};

export function ProfileDrawer() {
  const { isProfileDrawerOpen, toggleProfileDrawer, toggleSkillsModal } = useUIStore();
  const { data: profile, isLoading } = useProfile();

  return (
    <AnimatePresence>
      {isProfileDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={toggleProfileDrawer}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed inset-y-0 right-0 z-50 w-[360px] glass-deep flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/08">
              <h2 className="text-base font-semibold text-white/90">Mi perfil</h2>
              <Button
                id="close-profile-drawer"
                variant="ghost"
                size="icon"
                onClick={toggleProfileDrawer}
                aria-label="Cerrar perfil"
              >
                <X size={16} />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm text-white/30 animate-pulse">Cargando perfil...</span>
              </div>
            ) : profile ? (
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
                {/* User info */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/08 border border-white/12 flex items-center justify-center text-xl font-semibold text-white/70 mb-2">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-semibold text-white/90">{profile.name}</h3>
                  <p className="text-sm text-white/45">{profile.email}</p>
                </div>

                {/* Attributes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/04 border border-white/08 rounded-xl p-3">
                    <p className="text-xs text-white/35 mb-1">Educación</p>
                    <p className="text-sm text-white/75 font-medium">
                      {EDU_LABELS[profile.educationLevel] ?? profile.educationLevel}
                    </p>
                  </div>
                  {profile.studyYear != null && (
                    <div className="bg-white/04 border border-white/08 rounded-xl p-3">
                      <p className="text-xs text-white/35 mb-1">Año de cursada</p>
                      <p className="text-sm text-white/75 font-medium">{profile.studyYear}°</p>
                    </div>
                  )}
                  <div className="bg-white/04 border border-white/08 rounded-xl p-3">
                    <p className="text-xs text-white/35 mb-1">Trabaja en IT</p>
                    <p className="text-sm text-white/75 font-medium">
                      {profile.worksInIT ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white/70">Skills</h4>
                    <Button
                      id="manage-skills-btn"
                      variant="ghost"
                      size="sm"
                      onClick={toggleSkillsModal}
                      className="gap-1.5 text-white/40"
                    >
                      <Settings size={12} />
                      Gestionar
                    </Button>
                  </div>
                  {profile.skills.length === 0 ? (
                    <p className="text-xs text-white/25">Sin skills registradas aún.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {profile.skills.map((skill) => (
                        <SkillBadge key={skill.skillId} skill={skill} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-6">
                <p className="text-sm text-white/30 text-center">No se pudo cargar el perfil.</p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
