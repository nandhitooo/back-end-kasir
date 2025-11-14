'use strict';

const fs = require('fs');
const { pool } = require('../config/database');

const seedData = async () => {
  try {
    const initialDataPath = './contoh db/db.json';
    if (!fs.existsSync(initialDataPath)) {
      console.log('db.json not found, skipping seed.');
      return;
    }

    const initialData = JSON.parse(fs.readFileSync(initialDataPath, 'utf8'));

    // Cek apakah categories kosong
    const catCount = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCount.rows[0].count) === 0) {
      console.log('Seeding data from db.json...');

      // Insert categories
      const categories = initialData.categories;
      for (const cat of categories) {
        await pool.query('INSERT INTO categories (id, nama) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [cat.id, cat.nama]);
      }
      console.log('Seeded categories');

      // Insert products
      const products = initialData.products;
      for (const prod of products) {
        const categoryId = String(prod.category.id);
        await pool.query(
          'INSERT INTO products (id, kode, nama, harga, is_ready, gambar, category_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          [prod.id, prod.kode, prod.nama, prod.harga, prod.is_ready, prod.gambar, categoryId]
        );
      }
      console.log('Seeded products');

      // Insert pesanans dan order_menus
      const pesanans = initialData.pesanans.filter(p => p.menus && p.menus.length > 0);
      for (const pesanan of pesanans) {
        const pesananId = pesanan.id;
        await pool.query('INSERT INTO pesanans (id, total_bayar) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [pesananId, pesanan.total_bayar]);

        for (const menu of pesanan.menus) {
          const menuId = menu.id;
          await pool.query(
            'INSERT INTO order_menus (id, pesanan_id, product_id, jumlah, total_harga, keterangan) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
            [menuId, pesananId, menu.product.id, menu.jumlah || 1, menu.total_harga, menu.keterangan || '']
          );
        }
      }
      console.log('Seeded pesanans and order_menus');
    } else {
      console.log('Data already exists, skipping seed.');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

module.exports = { seedData };