import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-that-is-at-least-32-characters-long';
const { default: app } = await import('../app.js');
const { getPagination, paginationMeta } = await import('../utils/pagination.js');
const { productCreateSchema } = await import('../models/Product.js');
const { stockTransactionSchema } = await import('../models/Catalog.js');

function token(role = 'admin') {
  return jwt.sign({ id: 1, role, name: 'Test User' }, process.env.JWT_SECRET);
}

test('protected catalog routes reject missing credentials', async () => {
  const response = await request(app).get('/api/products');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'UNAUTHENTICATED');
});

test('admin-only writes reject staff before database access', async () => {
  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token('staff')}`)
    .send({});
  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'FORBIDDEN');
});

test('malformed product input returns a validation response', async () => {
  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token('admin')}`)
    .send({ name: '', sku: 'x' });
  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
});

test('public registration rejects invalid email and short password', async () => {
  const response = await request(app).post('/api/auth/register').send({
    full_name: 'Sam Park', email: 'not-an-email', password: 'tiny'
  });
  assert.equal(response.status, 422);
  assert.equal(response.body.success, false);
});

test('invalid IDs and unknown routes use consistent error responses', async () => {
  const invalidId = await request(app)
    .get('/api/products/nope')
    .set('Authorization', `Bearer ${token()}`);
  assert.equal(invalidId.status, 422);
  assert.equal(invalidId.body.error, 'VALIDATION_ERROR');
  const missing = await request(app).get('/api/not-a-module');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error, 'NOT_FOUND');
});

test('pagination clamps untrusted values and reports totals', () => {
  assert.deepEqual(getPagination({ page: '-4', limit: '500' }), { page: 1, limit: 100, offset: 0 });
  assert.deepEqual(paginationMeta(2, 10, 21), { page: 2, limit: 10, total: 21, totalPages: 3 });
});

test('product model requires valid prices and foreign-key IDs', () => {
  const valid = productCreateSchema.safeParse({
    name: 'Grid notebook', sku: 'STN-001', category_id: 1,
    purchase_price: 3.25, selling_price: 8.5
  });
  assert.equal(valid.success, true);
  assert.equal(productCreateSchema.safeParse({ name: 'x', sku: 'A', category_id: 0, purchase_price: -1, selling_price: 2 }).success, false);
});

test('stock count can be adjusted to zero but movements must be positive', () => {
  const base = { product_id: 1, transaction_type: 'adjustment', quantity: 0 };
  assert.equal(stockTransactionSchema.safeParse(base).success, true);
  assert.equal(stockTransactionSchema.safeParse({ ...base, transaction_type: 'stock_in' }).success, false);
  assert.equal(stockTransactionSchema.safeParse({ ...base, transaction_type: 'stock_out', quantity: 2 }).success, true);
});

test('demo account passwords match their seeded bcrypt hashes', async () => {
  const seed = await readFile(new URL('../../database/seed.sql', import.meta.url), 'utf8');
  for (const [email, password] of [
    ['admin@example.com', 'Admin@123'],
    ['manager@example.com', 'Manager@123'],
    ['staff@example.com', 'Staff@123']
  ]) {
    const row = seed.split(/\r?\n/).find((line) => line.includes(email));
    assert.ok(row, `Missing seed user ${email}`);
    const hash = row.split("'")[5];
    assert.equal(await bcrypt.compare(password, hash), true, `Incorrect seed password hash for ${email}`);
  }
});
