const notFound = (req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    ok: false,
    code: err.code || 'ERROR',
    message: err.message || 'Error interno del servidor',
    suggestion: err.suggestion || '',
  });
};

export { notFound, errorHandler };
