import { pool, withTransaction } from '../config/database.js';
import { getPagination } from '../utils/pagination.js';

export async function createStockTransaction(data, userId) {
  return withTransaction(async (connection) => {
    const [products] = await connection.execute('SELECT id, quantity FROM products WHERE id = ? FOR UPDATE', [data.product_id]);
    if (!products[0]) return null;
    const before = products[0].quantity;
    let after;
    if (data.transaction_type === 'stock_in') after = before + data.quantity;
    else if (data.transaction_type === 'stock_out') after = before - data.quantity;
    else after = data.quantity;
    if (after < 0) return { insufficientStock: true, available: before };
    const delta = after - before;
    await connection.execute('UPDATE products SET quantity = ? WHERE id = ?', [after, data.product_id]);
    const [result] = await connection.execute(
      `INSERT INTO stock_transactions
       (product_id, user_id, transaction_type, quantity_change, quantity_before, quantity_after, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.product_id, userId, data.transaction_type, delta, before, after, data.reference ?? null, data.notes ?? null]
    );
    return { id: result.insertId, before, after };
  });
}

export async function listStockTransactions(query) {
  const { page, limit, offset } = getPagination(query);
  const filters = [];
  const values = [];
  if (query.product_id) { filters.push('t.product_id = ?'); values.push(query.product_id); }
  if (query.transaction_type) { filters.push('t.transaction_type = ?'); values.push(query.transaction_type); }
  if (query.search) {
    filters.push('(p.name LIKE ? OR p.sku LIKE ? OR t.reference LIKE ?)');
    values.push(...Array(3).fill(`%${query.search}%`));
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sortColumns = { created_at: 't.created_at', product_name: 'p.name', transaction_type: 't.transaction_type', quantity_change: 't.quantity_change' };
  const sortBy = sortColumns[query.sortBy] || sortColumns.created_at;
  const sortOrder = query.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM stock_transactions t JOIN products p ON p.id = t.product_id ${where}`, values
  );
  const [rows] = await pool.execute(
    `SELECT t.*, p.name AS product_name, p.sku, u.full_name AS changed_by
     FROM stock_transactions t JOIN products p ON p.id = t.product_id
     LEFT JOIN users u ON u.id = t.user_id ${where}
     ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`, [...values, limit, offset]
  );
  return { rows, page, limit, total: countRows[0].total };
}

export async function listInventory(query) {
  const { page, limit, offset } = getPagination(query);
  const filters = [];
  const values = [];
  if (query.search) {
    filters.push('(p.name LIKE ? OR p.sku LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`);
  }
  if (query.low_stock === 'true') filters.push('p.quantity <= p.minimum_stock');
  if (query.category_id) { filters.push('p.category_id = ?'); values.push(query.category_id); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sortColumns = { name: 'p.name', sku: 'p.sku', quantity: 'p.quantity', minimum_stock: 'p.minimum_stock', updated_at: 'p.updated_at' };
  const sortBy = sortColumns[query.sortBy] || sortColumns.name;
  const sortOrder = query.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM products p ${where}`, values);
  const [rows] = await pool.execute(
    `SELECT p.id, p.name, p.sku, p.quantity, p.minimum_stock, p.updated_at, c.name AS category_name,
      (p.quantity <= p.minimum_stock) AS is_low_stock
     FROM products p JOIN categories c ON c.id = p.category_id ${where}
    ORDER BY is_low_stock DESC, ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`, [...values, limit, offset]
  );
  return { rows, page, limit, total: countRows[0].total };
}

export async function getDashboard() {
  const [[counts]] = await pool.execute(
    `SELECT COUNT(*) AS product_count,
      COALESCE(SUM(quantity), 0) AS units_in_stock,
      COALESCE(SUM(quantity * purchase_price), 0) AS inventory_value,
      COALESCE(SUM(quantity <= minimum_stock), 0) AS low_stock_count
     FROM products WHERE status = 'active'`
  );
  const [[relations]] = await pool.execute(
    'SELECT (SELECT COUNT(*) FROM categories) AS category_count, (SELECT COUNT(*) FROM suppliers) AS supplier_count'
  );
  const [lowStock] = await pool.execute(
    `SELECT id, name, sku, quantity, minimum_stock FROM products
     WHERE status = 'active' AND quantity <= minimum_stock ORDER BY quantity ASC, name ASC LIMIT 6`
  );
  const [recentTransactions] = await pool.execute(
    `SELECT t.id, t.transaction_type, t.quantity_change, t.quantity_after, t.created_at, p.name AS product_name, p.sku
     FROM stock_transactions t JOIN products p ON p.id = t.product_id ORDER BY t.created_at DESC LIMIT 6`
  );
  return { ...counts, ...relations, lowStock, recentTransactions };
}

export async function getReports() {
  const [categories] = await pool.execute(
    `SELECT c.id, c.name, COUNT(p.id) AS product_count, COALESCE(SUM(p.quantity), 0) AS units_in_stock,
      COALESCE(SUM(p.quantity * p.purchase_price), 0) AS inventory_value
     FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name ORDER BY inventory_value DESC`
  );
  const [movement] = await pool.execute(
    `SELECT DATE(created_at) AS day,
      SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) AS stock_in,
      SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) AS stock_out
     FROM stock_transactions WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
     GROUP BY DATE(created_at) ORDER BY day ASC`
  );
  return { categories, movement };
}
