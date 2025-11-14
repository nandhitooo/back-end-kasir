'use strict';

const categoriesRoutes = require('./categories');
const productsRoutes = require('./products');
const keranjangsRoutes = require('./keranjangs');
const pesanansRoutes = require('./pesanans');

const allRoutes = [
  ...categoriesRoutes,
  ...productsRoutes,
  ...keranjangsRoutes,
  ...pesanansRoutes,
  // Health check
  {
    method: 'GET',
    path: '/health',
    handler: (request, h) => {
      return { status: 'OK', message: 'Server is running with PostgreSQL' };
    }
  },
  // Static files (gambar di /public)
  {
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        listing: false,
        index: false
      }
    }
  }
];

module.exports = allRoutes;