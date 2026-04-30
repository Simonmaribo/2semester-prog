import sql from 'mssql';
import { config } from '../config.js';

const sqlConfig = {
  server: config.DB_SERVER,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export class DatabaseController {
  static pool = null;

  static async getPool() {
    if (!DatabaseController.pool) {
      DatabaseController.pool = await sql.connect(sqlConfig);
    }
    return DatabaseController.pool;
  }

  static async closePool() {
    if (DatabaseController.pool) {
      await DatabaseController.pool.close();
      DatabaseController.pool = null;
    }
  }
}
