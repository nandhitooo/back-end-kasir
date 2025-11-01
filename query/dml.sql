-- Insert Categories
INSERT INTO categories (id, nama) VALUES
('1', 'Makanan'),
('2', 'Minuman'),
('3', 'Cemilan');

-- Insert Products (dengan category_id sebagai string)
INSERT INTO products (id, kode, nama, harga, is_ready, gambar, category_id) VALUES
('1', 'K-01', 'Sate Ayam', 16000, true, 'sate-ayam.jpg', '1'),
('2', 'K-02', 'Nasi Goreng Telur', 14000, true, 'nasi-goreng-telor.jpg', '1'),
('3', 'K-03', 'Nasi Rames', 12000, true, 'nasi-rames.jpg', '1'),
('4', 'K-04', 'Lontong Opor Ayam', 18000, true, 'lontong-opor-ayam.jpg', '1'),
('5', 'K-05', 'Mie Goreng', 13000, true, 'mie-goreng.jpg', '1'),
('6', 'K-06', 'Bakso', 10000, true, 'bakso.jpg', '1'),
('7', 'K-07', 'Mie Ayam Bakso', 14000, true, 'mie-ayam-bakso.jpg', '1'),
('8', 'K-08', 'Pangsit 6 pcs', 5000, true, 'pangsit.jpg', '3'),
('9', 'K-09', 'Kentang Goreng', 5000, true, 'kentang-goreng.jpg', '3'),
('10', 'K-010', 'Cheese Burger', 15000, true, 'cheese-burger.jpg', '3'),
('11', 'K-011', 'Coffe Late', 15000, true, 'coffe-late.jpg', '2'),
('12', 'K-012', 'Es Jeruk', 7000, true, 'es-jeruk.jpg', '2'),
('13', 'K-013', 'Es Teh', 5000, true, 'es-teh.jpg', '2'),
('14', 'K-014', 'Teh Hangat', 3000, true, 'teh-hangat.jpg', '2');

-- Insert Pesanans (contoh beberapa, sesuaikan ID dan total_bayar dari JSON)
INSERT INTO pesanans (id, total_bayar) VALUES
('9fdf', 42000),
('26f8', 42000),
('f087', 55000),
('1685', 55000),
('fb33', 64000),
('b27a', 67000),
('c660', 58000),
('bc9b', 99000),
('83ef', 68000),
('08cb', 82000),
('c071', 39000);

-- Insert Order Menus (contoh untuk satu pesanan, ulangi untuk yang lain berdasarkan JSON)
-- Misal untuk pesanan '9fdf'
INSERT INTO order_menus (id, pesanan_id, product_id, jumlah, total_harga, keterangan) VALUES
('cce7', '9fdf', '3', 1, 12000, ''),
('2421', '9fdf', '6', 1, 10000, ''),
('a0e7', '9fdf', '11', 1, 15000, ''),
('9522', '9fdf', '8', 1, 5000, '');

-- Keranjangs kosong, jadi skip. Tambahkan jika perlu.
-- Catatan: Untuk semua pesanans, Anda perlu insert manual atau buat script Node.js untuk parse JSON dan insert.