'use strict';

const { query } = require('../utils/query');

const pesanansRoutes = [
  {
    method: 'GET',
    path: '/api/pesanans',
    handler: async (request, h) => {
      try {
        const result = await query('SELECT * FROM pesanans ORDER BY timestamp DESC');
        const pesanans = result.rows;

        // Fetch order_menus dan products untuk setiap pesanan
        for (let pesanan of pesanans) {
          const menuResult = await query(
            `SELECT om.*, p.*, c.nama as category_nama 
             FROM order_menus om 
             JOIN products p ON om.product_id = p.id 
             JOIN categories c ON p.category_id = c.id 
             WHERE om.pesanan_id = $1`, 
            [pesanan.id]
          );
          pesanan.menus = menuResult.rows.map(row => ({
            id: row.id,
            jumlah: row.jumlah,
            total_harga: row.total_harga,
            keterangan: row.keterangan,
            product: {
              id: row.product_id,
              kode: row.kode,
              nama: row.nama,
              harga: row.harga,
              is_ready: row.is_ready,
              gambar: row.gambar,
              category: { id: row.category_id, nama: row.category_nama }
            }
          }));
        }
        return pesanans;
      } catch (err) {
        console.error('Error fetching pesanans:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  },
  {
    method: 'POST',
    path: '/api/pesanans',
    handler: async (request, h) => {
      const { menus, total_bayar } = request.payload;
      if (!menus || !total_bayar) {
        return h.response({ error: 'menus and total_bayar are required' }).code(400);
      }
      try {
        const id = Math.random().toString(36).substr(2, 4);
        await query('INSERT INTO pesanans (id, total_bayar) VALUES ($1, $2)', [id, total_bayar]);

        for (const menu of menus) {
          const menuId = Math.random().toString(36).substr(2, 4);
          await query(
            'INSERT INTO order_menus (id, pesanan_id, product_id, jumlah, total_harga, keterangan) VALUES ($1, $2, $3, $4, $5, $6)',
            [menuId, id, menu.product.id, menu.jumlah || 1, menu.total_harga, menu.keterangan || '']
          );
        }

        return h.response({ id, total_bayar }).code(201);
      } catch (err) {
        console.error('Error creating pesanan:', err);
        return h.response({ error: 'Database error' }).code(500);
      }
    }
  }
];

module.exports = pesanansRoutes;