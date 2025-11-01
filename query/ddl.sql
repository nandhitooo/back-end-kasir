-- Tabel Categories
CREATE TABLE categories (
    id VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL
);

-- Tabel Products
CREATE TABLE products (
    id VARCHAR(10) PRIMARY KEY,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    harga INTEGER NOT NULL,
    is_ready BOOLEAN DEFAULT true,
    gambar VARCHAR(255),
    category_id VARCHAR(10) REFERENCES categories(id) ON DELETE CASCADE
);

-- Tabel Keranjangs (Cart Items)
CREATE TABLE keranjangs (
    id VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(10) REFERENCES products(id) ON DELETE CASCADE,
    jumlah INTEGER NOT NULL DEFAULT 1,
    keterangan TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pesanans (Orders)
CREATE TABLE pesanans (
    id VARCHAR(10) PRIMARY KEY,
    total_bayar INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Order Menus (Items di pesanan)
CREATE TABLE order_menus (
    id VARCHAR(20) PRIMARY KEY,
    pesanan_id VARCHAR(10) REFERENCES pesanans(id) ON DELETE CASCADE,
    product_id VARCHAR(10) REFERENCES products(id) ON DELETE CASCADE,
    jumlah INTEGER NOT NULL DEFAULT 1,
    total_harga INTEGER NOT NULL,
    keterangan TEXT
);

-- Index untuk performa
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_keranjangs_product ON keranjangs(product_id);
CREATE INDEX idx_order_menus_pesanan ON order_menus(pesanan_id);
CREATE INDEX idx_order_menus_product ON order_menus(product_id);