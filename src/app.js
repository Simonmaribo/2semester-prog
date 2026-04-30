import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireLogin } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { User } from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import comparisonRoutes from './routes/comparisonRoutes.js';
import apiRoutes from './routes/apiRoutes.js';


// Somehow ville vores app ikke køre med JS modules, så Claude fiksede det med dette trick.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: Math.random().toString(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      res.locals.user = await User.findById(req.session.userId);
    } catch {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

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

export default app;
