'use strict';

const { query } = require('../utils/query');

const productsRoutes = [
  {
    method: 'GET',
    path: '/api/products',
    handler: async (request, h) => {
      try {
        let sql = 'SELECT p.*, c.nama as category_nama FROM products p JOIN categories c ON p.category_id = c.id';
        const params = [];
        const conditions = [];

        if (request.query.categoryId) {
          conditions.push('p.category_id = $' + (params.length + 1));
          params.push(request.query.categoryId);
        }
        if (request.query.readyOnly === 'true') {
          conditions.push('p.is_ready = true');
        }

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY p.id';

        const result = await query(sql, params);
        
        const products = result.rows.map(row => ({
          id: row.id,
          kode: row.kode,
          nama: row.nama,
          harga: row.harga,
          is_ready: row.is_ready,
          gambar: row.gambar,
          category: { id: row.category_id, nama: row.category_nama }
        }));
        
        return products;
      } catch (err) {
        console.error('Error fetching products:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  },
  {
    method: 'GET',
    path: '/api/products/{id}',
    handler: async (request, h) => {
      try {
        const result = await query(
          'SELECT p.*, c.nama as category_nama FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
          [request.params.id]
        );
        if (result.rows.length === 0) {
          return h.response({ error: 'Product not found' }).code(404);
        }
        const row = result.rows[0];
        return {
          id: row.id,
          kode: row.kode,
          nama: row.nama,
          harga: row.harga,
          is_ready: row.is_ready,
          gambar: row.gambar,
          category: { id: row.category_id, nama: row.category_nama }
        };
      } catch (err) {
        console.error('Error fetching product:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  }
];

module.exports = productsRoutes;