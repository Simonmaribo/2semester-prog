import app from './app.js';
import { config } from './config.js';
import { DatabaseController } from './controllers/DatabaseController.js';

async function start() {
  try {
    console.log('Opretter forbindelse til databasen...');
    await DatabaseController.getPool();
    console.log('Database-forbindelse oprettet.');

    app.listen(config.PORT, () => {
      console.log(`Serveren kører på http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error('Kunne ikke starte serveren:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nLukker server...');
  await DatabaseController.closePool();
  process.exit(0);
});

start();
