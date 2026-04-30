export function errorHandler(err, req, res, next) {
  console.error('Uventet fejl:', err.stack);

  res.status(500).render('error', {
    title: 'Fejl',
    message: 'Der opstod en fejl. Prøv venligst igen.',
    error: err.message,
    user: res.locals.user || null,
  });
}
