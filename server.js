'use strict';

const { createServer } = require('./src/config/server');
const { testConnection } = require('./src/config/database');
const { seedData } = require('./src/utils/seed');
const routes = require('./src/routes');

const init = async () => {
  const server = await createServer();

  // Test koneksi database
  await testConnection();

  // Jalankan seed data
  await seedData();

  // Register semua routes
  server.route(routes);

  await server.start();
  console.log('Server running on %s', server.info.uri);
  console.log('Available routes:');
  console.log('- GET    /api/categories');
  console.log('- GET    /api/products');
  console.log('- GET    /api/products/{id}');
  console.log('- GET    /api/keranjangs');
  console.log('- POST   /api/keranjangs');
  console.log('- PUT    /api/keranjangs/{id}');
  console.log('- DELETE /api/keranjangs/{id}');
  console.log('- GET    /api/pesanans');
  console.log('- POST   /api/pesanans');
  console.log('- GET    /health');
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();