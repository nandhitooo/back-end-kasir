'use strict';

const { query } = require('../utils/query');

const keranjangsRoutes = [
  {
    method: 'GET',
    path: '/api/keranjangs',
    handler: async (request, h) => {
      try {
        const result = await query(`
          SELECT k.*, p.nama as product_nama, p.harga as product_harga, 
                 p.gambar as product_gambar, p.kode as product_kode, 
                 p.is_ready as product_is_ready, p.category_id,
                 c.nama as category_nama
          FROM keranjangs k 
          JOIN products p ON k.product_id = p.id 
          JOIN categories c ON p.category_id = c.id 
          ORDER BY k.timestamp DESC
        `);
        
        const keranjangs = result.rows.map(row => ({
          id: row.id,
          product_id: row.product_id,
          jumlah: row.jumlah,
          keterangan: row.keterangan,
          timestamp: row.timestamp,
          product: {
            id: row.product_id,
            kode: row.product_kode,
            nama: row.product_nama,
            harga: row.product_harga,
            is_ready: row.product_is_ready,
            gambar: row.product_gambar,
            category: { 
              id: row.category_id, 
              nama: row.category_nama 
            }
          }
        }));
        
        return keranjangs;
      } catch (err) {
        console.error('Error fetching keranjangs:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  },
  {
    method: 'POST',
    path: '/api/keranjangs',
    handler: async (request, h) => {
      const { productId, jumlah = 1, keterangan = '' } = request.payload;
      if (!productId) {
        return h.response({ error: 'productId is required' }).code(400);
      }
      try {
        const id = Date.now().toString();
        await query(
          'INSERT INTO keranjangs (id, product_id, jumlah, keterangan) VALUES ($1, $2, $3, $4)',
          [id, productId, jumlah, keterangan]
        );
        
        // Return the created keranjang with product details
        const result = await query(`
          SELECT k.*, p.nama as product_nama, p.harga as product_harga, 
                 p.gambar as product_gambar, p.kode as product_kode, 
                 p.is_ready as product_is_ready, p.category_id,
                 c.nama as category_nama
          FROM keranjangs k 
          JOIN products p ON k.product_id = p.id 
          JOIN categories c ON p.category_id = c.id 
          WHERE k.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          return h.response({ error: 'Failed to create keranjang' }).code(500);
        }
        
        const row = result.rows[0];
        const keranjang = {
          id: row.id,
          product_id: row.product_id,
          jumlah: row.jumlah,
          keterangan: row.keterangan,
          timestamp: row.timestamp,
          product: {
            id: row.product_id,
            kode: row.product_kode,
            nama: row.product_nama,
            harga: row.product_harga,
            is_ready: row.product_is_ready,
            gambar: row.product_gambar,
            category: { 
              id: row.category_id, 
              nama: row.category_nama 
            }
          }
        };
        
        return h.response(keranjang).code(201);
      } catch (err) {
        console.error('Error adding to keranjang:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/keranjangs/{id}',
    handler: async (request, h) => {
      const { jumlah, keterangan = '' } = request.payload;
      
      if (!jumlah || jumlah < 1) {
        return h.response({ error: 'Jumlah harus lebih dari 0' }).code(400);
      }
      
      try {
        // Update keranjang
        await query(
          'UPDATE keranjangs SET jumlah = $1, keterangan = $2 WHERE id = $3',
          [jumlah, keterangan, request.params.id]
        );
        
        // Return updated keranjang with product details
        const result = await query(`
          SELECT k.*, p.nama as product_nama, p.harga as product_harga, 
                 p.gambar as product_gambar, p.kode as product_kode, 
                 p.is_ready as product_is_ready, p.category_id,
                 c.nama as category_nama
          FROM keranjangs k 
          JOIN products p ON k.product_id = p.id 
          JOIN categories c ON p.category_id = c.id 
          WHERE k.id = $1
        `, [request.params.id]);
        
        if (result.rows.length === 0) {
          return h.response({ error: 'Keranjang not found' }).code(404);
        }
        
        const row = result.rows[0];
        const keranjang = {
          id: row.id,
          product_id: row.product_id,
          jumlah: row.jumlah,
          keterangan: row.keterangan,
          timestamp: row.timestamp,
          product: {
            id: row.product_id,
            kode: row.product_kode,
            nama: row.product_nama,
            harga: row.product_harga,
            is_ready: row.product_is_ready,
            gambar: row.product_gambar,
            category: { 
              id: row.category_id, 
              nama: row.category_nama 
            }
          }
        };
        
        return h.response(keranjang).code(200);
      } catch (err) {
        console.error('Error updating keranjang:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  },
  {
    method: 'DELETE',
    path: '/api/keranjangs/{id}',
    handler: async (request, h) => {
      try {
        const result = await query('DELETE FROM keranjangs WHERE id = $1', [request.params.id]);
        if (result.rowCount === 0) {
          return h.response({ error: 'Item not found' }).code(404);
        }
        return h.response({ message: 'Item deleted successfully' }).code(200);
      } catch (err) {
        console.error('Error deleting keranjang:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  }
];

module.exports = keranjangsRoutes;