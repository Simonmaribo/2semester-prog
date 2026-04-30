import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

const SALT_ROUNDS = 12;

export class AuthController {
  static showLogin(req, res) {
    res.render('auth/login', { title: 'Log ind', error: null, user: null });
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Email og password er påkrævet.',
          user: null,
        });
        return;
      }

      const user = await User.findByEmail(email);
      if (!user) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Forkert email eller password.',
          user: null,
        });
        return;
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Forkert email eller password.',
          user: null,
        });
        return;
      }

      req.session.userId = user.id;
      res.redirect('/properties');
    } catch (error) {
      console.error('Fejl ved login:', error);
      res.render('auth/login', {
        title: 'Log ind',
        error: 'Der opstod en fejl. Prøv igen.',
        user: null,
      });
    }
  }

  static showRegister(req, res) {
    res.render('auth/register', { title: 'Opret konto', error: null, user: null });
  }

  static async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Alle felter er påkrævet.',
          user: null,
        });
        return;
      }

      if (password.length < 8) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Password skal være mindst 8 tegn.',
          user: null,
        });
        return;
      }

      if (name.length < 2) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Navn skal være mindst 2 tegn.',
          user: null,
        });
        return;
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Denne email er allerede registreret.',
          user: null,
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const newUser = await User.create(email, passwordHash, name);

      req.session.userId = newUser.id;
      res.redirect('/properties');
    } catch (error) {
      console.error('Fejl ved registrering:', error);
      res.render('auth/register', {
        title: 'Opret konto',
        error: 'Der opstod en fejl. Prøv igen.',
        user: null,
      });
    }
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  }
}
