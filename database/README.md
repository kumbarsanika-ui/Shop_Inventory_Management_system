# Database setup

The application uses MySQL 8.0+ and InnoDB. From this directory, create the schema and load the sample records:

```sh
mysql -u root -p < schema.sql
mysql -u root -p shop_inventory < seed.sql
```

Set the matching `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` values in `server/.env`. The schema is intentionally MySQL-specific; it uses InnoDB foreign keys, `ENUM`, checks, and MySQL timestamp behavior.
