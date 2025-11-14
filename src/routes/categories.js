'use strict';

const { query } = require('../utils/query');

const categoriesRoutes = [
  {
    method: 'GET',
    path: '/api/categories',
    handler: async (request, h) => {
      try {
        const result = await query('SELECT * FROM categories ORDER BY id');
        return result.rows;
      } catch (err) {
        console.error('Error fetching categories:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  }
];

module.exports = categoriesRoutes;