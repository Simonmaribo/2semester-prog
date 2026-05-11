const { DatabaseController } = require('../controllers/DatabaseController.js');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.created_at = data.created_at;
  }

  static async findByEmail(email) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM users WHERE email = @email');

    if (result.recordset.length === 0) return null;
    return new User(result.recordset[0]);
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM users WHERE id = @id');

    if (result.recordset.length === 0) return null;
    return new User(result.recordset[0]);
  }

  static async create(email, passwordHash, name) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('email', email)
      .input('password', passwordHash)
      .input('name', name)
      .query(`
        INSERT INTO users (email, password, name)
        OUTPUT INSERTED.*
        VALUES (@email, @password, @name)
      `);

    return new User(result.recordset[0]);
  }
}

module.exports = { User };
