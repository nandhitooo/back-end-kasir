'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const init = async () => {
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

  // Plugin
  await server.register(Inert);

  // Koneksi Postgres Pool
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test koneksi
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }

  // Fungsi untuk seed data
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

  // Jalankan seed sekali
  await seedData();

  // Helper function untuk query
  const query = async (text, params) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  };

  // ========== ROUTES ==========

  // GET /api/categories
  server.route({
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
  });

  // GET /api/products (?categoryId=1&readyOnly=true)
  server.route({
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
  });

  // GET /api/products/{id}
  server.route({
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
  });

  // GET /api/keranjangs
  server.route({
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
  });

  // POST /api/keranjangs
  server.route({
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
  });

  // PUT /api/keranjangs/{id} - Update jumlah dan keterangan
  server.route({
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
  });

  // DELETE /api/keranjangs/{id}
  server.route({
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
  });

  // GET /api/pesanans
  server.route({
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
  });

  // POST /api/pesanans
  server.route({
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
  });

  // Health check
  server.route({
    method: 'GET',
    path: '/health',
    handler: (request, h) => {
      return { status: 'OK', message: 'Server is running with PostgreSQL' };
    }
  });

  // Static files (gambar di /public)
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        listing: false,
        index: false
      }
    }
  });

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