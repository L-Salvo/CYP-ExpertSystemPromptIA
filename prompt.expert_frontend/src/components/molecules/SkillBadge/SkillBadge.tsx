import type { SkillResponse } from '../../../types/api.types';

interface SkillBadgeProps {
  skill: SkillResponse;
}

function getLevelColor(level: number): string {
  if (level <= 3) return 'bg-[var(--color-aurora-1)]';
  if (level <= 7) return 'bg-[var(--color-aurora-2)]';
  return 'bg-[var(--color-aurora-3)]';
}

export function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <div className="flex flex-col gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-3 hover:bg-[var(--color-surface-3)] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{skill.name}</span>
        <span className="text-xs text-[var(--color-text-muted)] tabular-nums">{skill.level}/10</span>
      </div>
      <div className="w-full h-1 rounded-full bg-[var(--color-surface-4)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getLevelColor(skill.level)}`}
          style={{ width: `${skill.level * 10}%` }}
        />
      </div>
    </div>
  );
}
