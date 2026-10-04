import { pool } from '../config/database.js';
import { getPagination } from '../utils/pagination.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`, [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.role_id, u.is_active, u.created_at, u.updated_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`, [id]
  );
  return rows[0] || null;
}

export async function findRoleByName(name) {
  const [rows] = await pool.execute('SELECT * FROM roles WHERE name = ?', [name]);
  return rows[0] || null;
}

export async function findRoleById(id) {
  const [rows] = await pool.execute('SELECT id, name, description, created_at FROM roles WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function listUsers(query) {
  const { page, limit, offset } = getPagination(query);
  const filters = [];
  const values = [];
  if (query.search) {
    filters.push('(u.full_name LIKE ? OR u.email LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`);
  }
  if (query.role) { filters.push('r.name = ?'); values.push(query.role); }
  if (query.status === 'active') filters.push('u.is_active = 1');
  if (query.status === 'inactive') filters.push('u.is_active = 0');
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sortColumns = { name: 'u.full_name', email: 'u.email', role: 'r.name', created_at: 'u.created_at' };
  const sortBy = sortColumns[query.sortBy] || 'u.created_at';
  const sortOrder = query.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`, values
  );
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.role_id, u.is_active, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id ${where}
     ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`, [...values, limit, offset]
  );
  return { rows, page, limit, total: countRows[0].total };
}

export async function createUser({ full_name, email, password_hash, role_id, is_active = true }) {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?)',
    [full_name, email, password_hash, role_id, is_active]
  );
  return result.insertId;
}

export async function updateUser(id, fields) {
  const updates = Object.entries(fields).filter(([key]) => ['full_name', 'email', 'password_hash', 'role_id', 'is_active'].includes(key));
  if (!updates.length) return Boolean(await findUserById(id));
  const [result] = await pool.execute(
    `UPDATE users SET ${updates.map(([key]) => `${key} = ?`).join(', ')} WHERE id = ?`,
    [...updates.map(([, value]) => value), id]
  );
  return result.affectedRows > 0 || Boolean(await findUserById(id));
}

export async function deleteUser(id) {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function listRoles() {
  const [rows] = await pool.execute('SELECT id, name, description, created_at FROM roles ORDER BY name');
  return rows;
}

export async function createRole({ name, description = null }) {
  const [result] = await pool.execute('INSERT INTO roles (name, description) VALUES (?, ?)', [name.toLowerCase(), description]);
  return result.insertId;
}

export async function updateRole(id, { name, description }) {
  const [result] = await pool.execute('UPDATE roles SET name = COALESCE(?, name), description = ? WHERE id = ?', [name?.toLowerCase() ?? null, description ?? null, id]);
  return result.affectedRows > 0 || Boolean(await findRoleById(id));
}

export async function deleteRole(id) {
  const [result] = await pool.execute('DELETE FROM roles WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
