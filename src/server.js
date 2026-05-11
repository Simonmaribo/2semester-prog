const app = require('./app.js');
const { config } = require('./config.js');
const { DatabaseController } = require('./controllers/DatabaseController.js');

async function start() {
  try {
    console.log("starter db, azure warmer op")
    await DatabaseController.getPool();
    console.log('db ok');

    app.listen(config.PORT, () => {
      console.log(`kører på http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error('kunne ikke starte:', error);
    process.exit(1);
  }
}

start();
