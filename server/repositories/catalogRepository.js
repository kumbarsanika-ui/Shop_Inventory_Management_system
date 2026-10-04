import { pool, withTransaction } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';

const resources = {
  categories: {
    table: 'categories',
    fields: ['name', 'description'],
    sort: { name: 'name', created_at: 'created_at', updated_at: 'updated_at' }
  },
  suppliers: {
    table: 'suppliers',
    fields: ['name', 'contact_name', 'email', 'phone', 'address'],
    sort: { name: 'name', email: 'email', created_at: 'created_at' }
  }
};
const productSort = {
  name: 'p.name', sku: 'p.sku', quantity: 'p.quantity', selling_price: 'p.selling_price',
  purchase_price: 'p.purchase_price', created_at: 'p.created_at', updated_at: 'p.updated_at'
};

function resourceConfig(resource) {
  const config = resources[resource];
  if (!config) throw new AppError('Unknown catalog resource', 404, 'NOT_FOUND');
  return config;
}

export async function listProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const filters = [];
  const values = [];
  if (query.search) {
    filters.push('(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)');
    values.push(...Array(3).fill(`%${query.search}%`));
  }
  if (query.category_id) { filters.push('p.category_id = ?'); values.push(query.category_id); }
  if (query.supplier_id) { filters.push('p.supplier_id = ?'); values.push(query.supplier_id); }
  if (query.status) { filters.push('p.status = ?'); values.push(query.status); }
  if (query.low_stock === 'true') filters.push('p.quantity <= p.minimum_stock');
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sortBy = productSort[query.sortBy] || productSort.created_at;
  const sortOrder = query.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id ${where}`,
    values
  );
  const [rows] = await pool.execute(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id ${where}
     ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return { rows, page, limit, total: countRows[0].total };
}

export async function getProduct(id) {
  const [rows] = await pool.execute(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?`, [id]
  );
  return rows[0] || null;
}

export async function createProduct(data, userId) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO products
       (name, sku, category_id, supplier_id, description, purchase_price, selling_price, quantity, minimum_stock, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.sku, data.category_id, data.supplier_id ?? null, data.description ?? null,
       data.purchase_price, data.selling_price, data.quantity, data.minimum_stock, data.status]
    );
    if (data.quantity > 0) {
      await connection.execute(
        `INSERT INTO stock_transactions
         (product_id, user_id, transaction_type, quantity_change, quantity_before, quantity_after, reference, notes)
         VALUES (?, ?, 'stock_in', ?, 0, ?, 'initial-stock', 'Opening stock')`,
        [result.insertId, userId, data.quantity, data.quantity]
      );
    }
    return result.insertId;
  });
}

export async function updateProduct(id, data, userId) {
  return withTransaction(async (connection) => {
    const [currentRows] = await connection.execute('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [id]);
    if (!currentRows[0]) return null;
    const currentQuantity = currentRows[0].quantity;
    const updates = Object.entries(data).filter(([key]) => productSort[key] || ['category_id', 'supplier_id', 'description', 'minimum_stock', 'status'].includes(key));
    if (updates.length) {
      const columns = updates.map(([key]) => `${key} = ?`).join(', ');
      await connection.execute(`UPDATE products SET ${columns} WHERE id = ?`, [...updates.map(([, value]) => value), id]);
    }
    if (data.quantity !== undefined && data.quantity !== currentQuantity) {
      const delta = data.quantity - currentQuantity;
      await connection.execute(
        `INSERT INTO stock_transactions
         (product_id, user_id, transaction_type, quantity_change, quantity_before, quantity_after, reference, notes)
         VALUES (?, ?, 'adjustment', ?, ?, ?, 'product-update', 'Quantity changed from product editor')`,
        [id, userId, delta, currentQuantity, data.quantity]
      );
    }
    return id;
  });
}

export async function deleteProduct(id) {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function listResource(resource, query) {
  const config = resourceConfig(resource);
  const { page, limit, offset } = getPagination(query);
  const sortBy = config.sort[query.sortBy] || Object.values(config.sort)[0];
  const sortOrder = query.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const searchValue = query.search ? `%${query.search}%` : null;
  const search = query.search ? `WHERE ${config.fields.filter((field) => field === 'name' || field === 'email').map((field) => `${field} LIKE ?`).join(' OR ')}` : '';
  const searchValues = query.search ? config.fields.filter((field) => field === 'name' || field === 'email').map(() => searchValue) : [];
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM ${config.table} ${search}`, searchValues);
  const [rows] = await pool.execute(
    `SELECT * FROM ${config.table} ${search} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...searchValues, limit, offset]
  );
  return { rows, page, limit, total: countRows[0].total };
}

export async function getResource(resource, id) {
  const { table } = resourceConfig(resource);
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return rows[0] || null;
}

export async function createResource(resource, data) {
  const config = resourceConfig(resource);
  const fields = Object.keys(data).filter((field) => config.fields.includes(field));
  const [result] = await pool.execute(
    `INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    fields.map((field) => data[field] ?? null)
  );
  return result.insertId;
}

export async function updateResource(resource, id, data) {
  const config = resourceConfig(resource);
  const fields = Object.keys(data).filter((field) => config.fields.includes(field));
  if (!fields.length) throw new AppError('No valid fields supplied', 422, 'VALIDATION_ERROR');
  const [result] = await pool.execute(
    `UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
    [...fields.map((field) => data[field] ?? null), id]
  );
  return result.affectedRows > 0 || Boolean(await getResource(resource, id));
}

export async function deleteResource(resource, id) {
  const { table } = resourceConfig(resource);
  const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
