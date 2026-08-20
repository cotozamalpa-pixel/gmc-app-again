// Central place that defines the Muzenza role hierarchy and what each
// role is allowed to do. Keep this as the single source of truth so
// pages/API routes don't reimplement permission checks differently.

export const ROLES = [
  'ALUNO',
  'GRADUADO',
  'MONITOR',
  'INSTRUTOR',
  'PROFESSOR',
  'CONTRAMESTRE',
  'MESTRE',
  'ADMIN'
] as const;

export type AppRole = (typeof ROLES)[number];

// Roles from MONITOR upward are considered "teaching staff" and can
// generate/display the daily class QR code and see attendance for
// their own city without needing full admin rights.
export const TEACHING_ROLES: AppRole[] = ['MONITOR', 'INSTRUTOR', 'PROFESSOR', 'CONTRAMESTRE', 'MESTRE', 'ADMIN'];

export function isTeachingStaff(role: string) {
  return TEACHING_ROLES.includes(role as AppRole);
}

export function isAdmin(role: string) {
  return role === 'ADMIN';
}

export const ROLE_LABELS: Record<AppRole, string> = {
  ALUNO: 'Aluno',
  GRADUADO: 'Graduado',
  MONITOR: 'Monitor',
  INSTRUTOR: 'Instrutor',
  PROFESSOR: 'Professor',
  CONTRAMESTRE: 'Contramestre',
  MESTRE: 'Mestre',
  ADMIN: 'Administrator'
};
