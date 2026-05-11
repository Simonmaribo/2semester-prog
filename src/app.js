const express = require('express');
const session = require('express-session');
const path = require('path');
const { requireLogin } = require('./middleware/authMiddleware.js');
const { errorHandler } = require('./middleware/errorHandler.js');

const authRoutes = require('./routes/authRoutes.js');
const propertyRoutes = require('./routes/propertyRoutes.js');
const caseRoutes = require('./routes/caseRoutes.js');
const simulationRoutes = require('./routes/simulationRoutes.js');
const comparisonRoutes = require('./routes/comparisonRoutes.js');
const apiRoutes = require('./routes/apiRoutes.js');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: '1234',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use('/auth', authRoutes);
app.use('/api', requireLogin, apiRoutes);
app.use('/properties', requireLogin, propertyRoutes);
app.use('/cases', requireLogin, caseRoutes);
app.use('/simulation', requireLogin, simulationRoutes);
app.use('/compare', requireLogin, comparisonRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/properties');
  } else {
    res.redirect('/auth/login');
  }
});

app.use(errorHandler);

module.exports = app;
