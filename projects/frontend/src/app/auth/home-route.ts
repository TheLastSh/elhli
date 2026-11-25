export type UserRole = 'Docente' | 'Estudiante' | 'Coordinador' | 'Admin';

/**
 * Ruta principal de un rol. Used by login redirect and the navbar brand.
 * Admin counts as Coordinador (same as the backend and guards).
 */
export function homeRouteFor(role: string | null | undefined): string {
  switch (role) {
    case 'Docente': return '/dash/docente';
    case 'Estudiante': return '/dash/estudiante';
    case 'Coordinador':
    case 'Admin': return '/dash/coordinacion';
    default: return '/system';
  }
}
