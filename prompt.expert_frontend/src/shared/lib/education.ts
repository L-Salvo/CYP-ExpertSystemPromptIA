import type { EducationLevel } from '../../types/api.types';

export interface EducationOption {
  value: EducationLevel;
  label: string;
  desc: string;
}

export const EDU_OPTIONS: EducationOption[] = [
  { value: 'SECONDARY_STUDENT', label: 'Estudiante secundario', desc: 'Cursando la escuela secundaria' },
  { value: 'TERTIARY_STUDENT', label: 'Estudiante terciario', desc: 'Carrera terciaria en curso' },
  { value: 'UNIVERSITY_STUDENT', label: 'Estudiante universitario', desc: 'Carrera de grado en curso' },
  { value: 'GRADUATED', label: 'Graduado', desc: 'Título de grado finalizado' },
  { value: 'POSTGRADUATE', label: 'Posgrado', desc: 'Maestría o doctorado' },
];

export const EDU_LABELS: Record<EducationLevel, string> = Object.fromEntries(
  EDU_OPTIONS.map((o) => [o.value, o.label]),
) as Record<EducationLevel, string>;

export const STUDENT_LEVELS: EducationLevel[] = [
  'SECONDARY_STUDENT',
  'TERTIARY_STUDENT',
  'UNIVERSITY_STUDENT',
];

export function isStudentLevel(level: EducationLevel | null | undefined): boolean {
  return level != null && STUDENT_LEVELS.includes(level);
}
