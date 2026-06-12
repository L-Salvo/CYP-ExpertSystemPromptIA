import type { SkillResponse } from '../../../types/api.types';

interface SkillBadgeProps {
  skill: SkillResponse;
}

function getLevelColor(level: number): string {
  if (level <= 3) return 'bg-white/20';
  if (level <= 7) return 'bg-white/50';
  return 'bg-white/90';
}

export function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <div className="flex flex-col gap-1.5 bg-white/04 border border-white/08 rounded-xl p-3 hover:bg-white/06 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{skill.name}</span>
        <span className="text-xs text-white/40 tabular-nums">{skill.level}/10</span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/08 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getLevelColor(skill.level)}`}
          style={{ width: `${skill.level * 10}%` }}
        />
      </div>
    </div>
  );
}
