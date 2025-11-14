'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true
      }
    }
  });

  await server.register(Inert);
  return server;
};

module.exports = { createServer };