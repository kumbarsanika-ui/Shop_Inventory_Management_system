# Shop Inventory Management API

Base URL: `http://localhost:5000/api`. JSON is used for request and response bodies. Protected routes require `Authorization: Bearer <token>`. IDs are positive integers.

## Authentication

| Method | Endpoint | Description | Auth / role | Body | Status |
|---|---|---|---|---|---|
| POST | `/auth/register` | Create a staff account; role assignment is never accepted from public input | Public | `{ "full_name": "Sam Park", "email": "sam@example.com", "password": "StrongPass9" }` | 201, 409, 422 |
| POST | `/auth/login` | Validate credentials and issue a JWT | Public | `{ "email": "admin@example.com", "password": "Admin@123" }` | 200, 401, 422 |
| POST | `/auth/logout` | Acknowledge sign-out; clients must discard the stateless JWT | Any authenticated user | None | 200, 401 |

A successful login returns `{ "success": true, "message": "Signed in successfully", "data": { "token": "...", "user": { "id": 1, "full_name": "Alex Morgan", "email": "admin@example.com", "role": "admin" } } }`. Password hashes are never returned.

## Users and roles

All routes below require an admin JWT. `GET /users` supports `page`, `limit` (1-100), `search` (name/email), `role`, `status` (`active`/`inactive`), `sortBy` (`name`, `email`, `role`, `created_at`) and `sortOrder` (`asc`/`desc`). Response lists include `data` and `pagination`.

| Method | Endpoint | Description | Body / parameters | Status |
|---|---|---|---|---|
| GET | `/users` | Search and page through users | Query parameters above | 200 |
| POST | `/users` | Create a user with a configurable role | `{ "full_name": "Sam Park", "email": "sam@example.com", "password": "StrongPass9", "role_id": 3, "is_active": true }` | 201, 409, 422 |
| GET | `/users/:id` | Retrieve a user without password data | ID | 200, 404 |
| PUT | `/users/:id` | Replace user fields | Complete create-user body | 200, 404, 409, 422 |
| PATCH | `/users/:id` | Update supplied user fields | Any non-empty subset; password is optional | 200, 404, 409, 422 |
| DELETE | `/users/:id` | Delete a user (not the current admin) | ID | 200, 404, 422 |
| GET | `/users/roles` | List configurable roles | None | 200 |
| GET | `/users/roles/:id` | Retrieve one role | ID | 200, 404 |
| POST | `/users/roles` | Create a role | `{ "name": "auditor", "description": "Read-only access" }` | 201, 409, 422 |
| PUT | `/users/roles/:id` | Update role name/description | `{ "name": "auditor", "description": "Read-only access" }` | 200, 404, 409 |
| PATCH | `/users/roles/:id` | Partially update a role | Non-empty subset of role fields | 200, 404, 409 |
| DELETE | `/users/roles/:id` | Delete an unassigned role | ID | 200, 404, 409 |

## Dashboard and reports

These routes require an admin or manager JWT.

| Method | Endpoint | Description | Response data | Status |
|---|---|---|---|---|
| GET | `/dashboard` | Active product count, units, inventory cost value, low-stock count/list and recent stock activity | `{ product_count, units_in_stock, inventory_value, low_stock_count, category_count, supplier_count, lowStock, recentTransactions }` | 200 |
| GET | `/dashboard/reports` | Category valuation and daily stock movements for 30 days | `{ categories, movement }` | 200 |

## Products

All product routes require authentication. Listing accepts `page`, `limit`, `search` (name/SKU/category), `category_id`, `supplier_id`, `status`, `low_stock=true`, `sortBy` (`name`, `sku`, `quantity`, `purchase_price`, `selling_price`, `created_at`, `updated_at`) and `sortOrder` (`asc`/`desc`). Sort fields are allowlisted.

| Method | Endpoint | Description | Auth / role | Body / parameters | Status |
|---|---|---|---|---|---|
| GET | `/products` | Search/filter/sort/paginate catalog | Any authenticated user | Query parameters above | 200 |
| POST | `/products` | Create product; opening stock is transaction-logged | Admin or manager | `{ "name": "Grid Notebook", "sku": "STN-NBK-014", "category_id": 1, "supplier_id": 1, "description": "A5 notebook", "purchase_price": 3.25, "selling_price": 8.5, "quantity": 20, "minimum_stock": 5, "status": "active" }` | 201, 409, 422 |
| GET | `/products/:id` | Retrieve product, category and supplier | Any authenticated user | ID | 200, 404 |
| PUT | `/products/:id` | Replace product data | Admin or manager | Complete product body | 200, 404, 409, 422 |
| PATCH | `/products/:id` | Partially update product | Admin or manager | Non-empty subset of product fields | 200, 404, 409, 422 |
| DELETE | `/products/:id` | Delete a product only if it has no stock history | Admin | ID | 200, 404, 409 |

Changing quantity through product create/update creates a stock transaction in the same MySQL transaction as the product write. Prefer `/inventory/transactions` for named receipts, issues and count adjustments.

## Categories and suppliers

Both resource groups support `GET`, `POST`, `GET /:id`, `PUT /:id`, `PATCH /:id`, and `DELETE /:id` at `/categories` and `/suppliers`. List endpoints support `page`, `limit`, `search`, `sortBy`, and `sortOrder`. `sortBy` is allowlisted per resource.

All routes require a JWT to read; create/update requires admin or manager; delete requires admin. Category body: `{ "name": "Stationery", "description": "Paper goods" }`. Supplier body: `{ "name": "Cedar & Finch Paper Co.", "contact_name": "Morgan Ellis", "email": "orders@example.com", "phone": "+1-555-0101", "address": "Portland, OR" }`. Category and supplier IDs referenced by products must exist. Deleting a category with products is rejected by the foreign key. Supplier removal detaches products from that supplier.

## Inventory and stock transactions

All routes require authentication. Creating a stock transaction requires admin or manager.

| Method | Endpoint | Description | Query/body | Status |
|---|---|---|---|---|
| GET | `/inventory` | Current per-product quantity, reorder point and low-stock state | `page`, `limit`, `search`, `category_id`, `low_stock=true`, `sortBy` (`name`, `sku`, `quantity`, `minimum_stock`, `updated_at`), `sortOrder` | 200 |
| GET | `/inventory/transactions` | Paginated immutable movement history | `page`, `limit`, `search` (product/SKU/reference), `product_id`, `transaction_type`, `sortBy` (`created_at`, `product_name`, `transaction_type`, `quantity_change`), `sortOrder` | 200 |
| POST | `/inventory/transactions` | Lock product row, validate quantity, update stock and insert history atomically | `{ "product_id": 1, "transaction_type": "stock_in", "quantity": 12, "reference": "PO-2409", "notes": "Supplier delivery" }` | 201, 404, 422 |

`transaction_type` is `stock_in`, `stock_out`, or `adjustment`. For stock in/out, `quantity` is a positive change. For adjustment, it is the desired on-hand quantity and may be zero. Issuing more than available returns 422 `INSUFFICIENT_STOCK`. Every list response uses `{ "success": true, "message": "...", "data": [], "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 } }`.

## Common responses and security

A successful write returns HTTP 201 for creation or HTTP 200 for retrieval/update/deletion. Errors use `{ "success": false, "message": "...", "error": "ERROR_CODE" }` with 400 malformed request, 401 missing/invalid token, 403 insufficient role, 404 missing route/record, 409 duplicate/conflicting record, 422 validation/reference/stock error, or sanitized 500. The API uses parameterized SQL, request schemas, helmet, CORS allowlisting, auth rate limits and environment-only secrets. Inactive users cannot log in.

Health check: `GET /api/health` executes `SELECT 1` and reports API/database availability.
