const bcrypt = require('bcrypt');
const { User } = require('../models/User.js');

class AuthController {
  static showLogin(req, res) {
    res.render('auth/login', { title: 'Log ind', error: null });
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Email og password er påkrævet.',
        });
        return;
      }

      const user = await User.findByEmail(email);
      if (!user) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Forkert email eller password.',
        });
        return;
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        res.render('auth/login', {
          title: 'Log ind',
          error: 'Forkert email eller password.',
        });
        return;
      }

      req.session.userId = user.id;
      res.redirect('/properties');
    } catch (error) {
      console.error('login fejl:', error);
      res.render('auth/login', {
        title: 'Log ind',
        error: 'Der opstod en fejl. Prøv igen.',
      });
    }
  }

  static showRegister(req, res) {
    res.render('auth/register', { title: 'Opret konto', error: null });
  }

  static async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Alle felter er påkrævet.',
        });
        return;
      }

      if (password.length < 8) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Password skal være mindst 8 tegn.',
        });
        return;
      }

      if (name.length < 2) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Navn skal være mindst 2 tegn.',
        });
        return;
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.render('auth/register', {
          title: 'Opret konto',
          error: 'Denne email er allerede registreret.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await User.create(email, passwordHash, name);

      req.session.userId = newUser.id;
      res.redirect('/properties');
    } catch (error) {
      console.error('register fejl:', error);
      res.render('auth/register', {
        title: 'Opret konto',
        error: 'Der opstod en fejl. Prøv igen.',
      });
    }
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  }
}

module.exports = { AuthController };
