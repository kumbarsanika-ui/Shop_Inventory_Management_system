import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';

try {
  await pool.query('SELECT 1');
  const server = app.listen(env.PORT, () => {
    console.log(`Shop Inventory API listening on http://localhost:${env.PORT}`);
  });
  const shutdown = async () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(`Unable to connect to MySQL: ${error.message}`);
  process.exit(1);
}
