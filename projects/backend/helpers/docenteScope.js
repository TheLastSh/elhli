import Course from '../api/courses/course.model.js';

export const getDocenteCourseIds = async (userId) => {
  if (!userId) return [];
  const rows = await Course.find({ professorId: userId }, '_id').lean();
  return rows.map((c) => c._id);
};

/** Verifica si un Docente puede acceder a un estudiante (member of one of his courses). */
export const isStudentInDocenteScope = async (user, studentId) => {
  if (!user || user.role !== 'Docente') return true;
  const ids = await getDocenteCourseIds(user.id);
  if (!ids.length) return false;
  return Course.exists({ _id: { $in: ids }, students: studentId });
};

/** Verifica acceso a un estudiante/estudianteId en lista, excluye estudiantes fuera del alcance. */
export const scopeStudents = async (user, where = {}) => {
  if (!user || user.role !== 'Docente') return where;
  const ids = await getDocenteCourseIds(user.id);
  if (!ids.length) return { ...where, _id: { $in: [] } }; // Docente sin cursos ve vacío
  const cursor = await Course.find({ professorId: user.id }, 'students').lean();
  const studentIds = [...new Set(cursor.flatMap((c) => (c.students || [])))];
  return { ...where, _id: { $in: studentIds } };
};

export default { getDocenteCourseIds, isStudentInDocenteScope, scopeStudents };
