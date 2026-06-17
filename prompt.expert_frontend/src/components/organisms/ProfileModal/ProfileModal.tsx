import { useState } from 'react';
import { User, Palette, ListChecks } from 'lucide-react';
import { Modal } from '../../../shared/ui';
import { cn } from '../../../shared/lib/cn';
import { useUIStore } from '../../../store/ui.store';
import { PersonalSection } from './PersonalSection';
import { AppearanceSection } from './AppearanceSection';
import { SkillsSection } from './SkillsSection';

type Tab = 'personal' | 'appearance' | 'skills';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Perfil', icon: User },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'skills', label: 'Skills', icon: ListChecks },
];

export function ProfileModal() {
  const { isProfileModalOpen, setProfileModalOpen } = useUIStore();
  const [tab, setTab] = useState<Tab>('personal');

  return (
    <Modal
      open={isProfileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      title="Ajustes"
      description="Gestioná tu perfil, apariencia y skills"
      size="lg"
    >
      <div className="px-6 pt-4 pb-6 flex flex-col gap-5">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Secciones de ajustes"
          className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-[var(--color-surface-4)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div role="tabpanel">
          {tab === 'personal' && <PersonalSection />}
          {tab === 'appearance' && <AppearanceSection />}
          {tab === 'skills' && <SkillsSection />}
        </div>
      </div>
    </Modal>
  );
}
