# Shop Inventory Management

A full-stack inventory workspace for a small shop. Track products, reorder points, suppliers, categories, and every stock movement from a responsive admin portal. The API uses a layered Express architecture and MySQL transactions for inventory changes.

## Features

- Product, category, supplier, user, and role management
- Search, filtering, sorting, and pagination on catalog and inventory lists
- Low-stock detection and dashboard alerts
- Stock-in, stock-out, and count-adjustment workflows with immutable movement history
- Category valuation and 30-day stock movement reporting
- JWT authentication, bcrypt password hashing, and admin/manager/staff role-based permissions
- Parameterized MySQL queries, request validation, centralized errors, and transaction handling
- Postman collection and local environment

## Technology and architecture

React 18, Vite, Express 4, Node.js 20+, MySQL 8+, `mysql2`, JWT, bcrypt, Zod, and Postman.

```text
React admin portal
	-> REST API (Express routes and middleware)
	-> Controllers (HTTP only)
	-> Services (business rules)
	-> Repositories (parameterized SQL)
	-> MySQL (InnoDB)
```

The repository is split into `client/`, `server/`, `database/`, `docs/`, and `postman/`. Backend models define request/data schemas; repositories own SQL; services own domain behavior; controllers translate service results into JSON. Inventory writes lock the product row and update quantity plus movement history in one transaction.

## Prerequisites

- Node.js 20 or later and npm
- MySQL 8.0 or later
- Postman (optional, for the included API collection)

## Database setup

Create the schema, then load sample data:

```sh
mysql -u root -p < database/schema.sql
mysql -u root -p shop_inventory < database/seed.sql
```

The SQL creates the `shop_inventory` database. Seed data includes fictional products, suppliers, users, stock levels, and movement history. Importing the seed repeatedly is safe for these fixed sample records.

## Environment and install

From the repository root:

```sh
npm install
```

Copy `server/.env.example` to `server/.env` and set your local MySQL credentials. PowerShell users can run:

```powershell
Copy-Item server/.env.example server/.env
```

Set `JWT_SECRET` to a random value of at least 32 characters. Never use the example secret in a deployed environment. The API loads its `.env` from `server/`; the Vite client defaults to `http://localhost:5000/api`. To change it, create `client/.env.local` with `VITE_API_URL=http://localhost:5000/api`.

## Run the application

Ensure MySQL is running and the schema and seed data are loaded. From the repository root, start both applications:

```sh
npm run dev
```

The portal is at `http://localhost:5173`; the API is at `http://localhost:5000/api`. `GET /api/health` checks API and database connectivity. To run only one workspace, use `npm run dev -w server` or `npm run dev -w client`. Production client build: `npm run build`. API tests: `npm test`.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin@123` |
| Manager | `manager@example.com` | `Manager@123` |
| Staff | `staff@example.com` | `Staff@123` |

These are local demo credentials only. The matching database values are bcrypt hashes. Change or remove them before deployment. Public registration creates staff accounts only; admins assign elevated roles from Team & roles.

## API and Postman

See [API documentation](docs/API_DOCUMENTATION.md) for methods, permissions, query parameters, schemas, and responses. Import [postman/shop-inventory-management.postman_collection.json](postman/shop-inventory-management.postman_collection.json) and [postman/environment.json](postman/environment.json) into Postman, select the `Shop Inventory Local` environment, then run **01 - Authentication → Login** to save the JWT token. Update collection/environment IDs if you create records with different IDs.

Protected requests use `Authorization: Bearer {{token}}`. Postman tests check successful status, the common success envelope, and pagination metadata. The included automated API tests cover route guards, validation, ID handling, pagination, and stock quantity rules. Database-backed CRUD/report flows can be exercised after importing the schema and seed.

## Screenshots

<!-- Add dashboard, product catalog, and inventory history screenshots here. -->

## Future enhancements

- Refresh tokens and server-side token revocation
- Automated integration tests against a disposable MySQL instance
- CSV export, barcode label printing, and scheduled low-stock notifications
- Multi-location stock and supplier purchase order workflows
- Fine-grained permissions and audit retention controls