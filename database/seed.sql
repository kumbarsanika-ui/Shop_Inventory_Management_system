USE shop_inventory;

INSERT INTO roles (id, name, description) VALUES
  (1, 'admin', 'Full workspace and access administration'),
  (2, 'manager', 'Catalog, inventory, dashboard and reports'),
  (3, 'staff', 'Read catalog and record day-to-day stock activity')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO users (id, role_id, full_name, email, password_hash, is_active) VALUES
  (1, 1, 'Alex Morgan', 'admin@example.com', '$2a$12$85okIMia4//Gidcwiok.P.48DaQ25bzDo7VrLSI.tHzhQM4DElCvu', TRUE),
  (2, 2, 'Jordan Lee', 'manager@example.com', '$2a$12$sfvR43MtcdWQEUQ5WHOgvuWz/Rv4QdkX/EeORhm7c9lFofox2qOgq', TRUE),
  (3, 3, 'Casey Rivera', 'staff@example.com', '$2a$12$Wk8xnqh7epTj/Wuqhw.LQOPZlfXyFFglknNyD7wXz8faRhxB.vgq2', TRUE)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id), is_active = VALUES(is_active);

INSERT INTO categories (id, name, description) VALUES
  (1, 'Stationery', 'Paper goods, writing tools and desk essentials'),
  (2, 'Shipping supplies', 'Packing and dispatch materials'),
  (3, 'Drinkware', 'Reusable bottles and cups'),
  (4, 'Workspace', 'Organization and small office equipment')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO suppliers (id, name, contact_name, email, phone, address) VALUES
  (1, 'Cedar & Finch Paper Co.', 'Morgan Ellis', 'orders@cedarfinch.example', '+1-555-0101', '18 Wren Street, Portland, OR'),
  (2, 'Northstar Packing Supply', 'Avery Chen', 'hello@northstarpacking.example', '+1-555-0102', '2400 Harbor Way, Tacoma, WA'),
  (3, 'Fieldhouse Home Goods', 'Riley Bennett', 'trade@fieldhousegoods.example', '+1-555-0103', '72 Orchard Road, Eugene, OR'),
  (4, 'Common Desk Works', 'Taylor Brooks', 'sales@commondesk.example', '+1-555-0104', '905 Alder Avenue, Seattle, WA')
ON DUPLICATE KEY UPDATE contact_name = VALUES(contact_name), phone = VALUES(phone), address = VALUES(address);

INSERT INTO products (id, category_id, supplier_id, name, sku, description, purchase_price, selling_price, quantity, minimum_stock, status) VALUES
  (1, 1, 1, 'Field Notes Grid Notebook', 'STN-NBK-014', 'A5 recycled-paper grid notebook, 160 pages.', 3.25, 8.50, 78, 15, 'active'),
  (2, 2, 2, 'Direct Thermal Labels 4x6', 'SHP-LBL-046', 'Roll of 250 direct thermal shipping labels.', 7.40, 14.95, 8, 12, 'active'),
  (3, 2, 2, 'Kraft Packaging Tape', 'SHP-TAP-021', 'Quiet-release kraft paper tape, 50 mm x 50 m.', 2.10, 5.75, 42, 10, 'active'),
  (4, 3, 3, 'Insulated Travel Cup', 'DRK-CUP-088', 'Double-wall stainless steel cup with ceramic lining.', 11.80, 27.00, 5, 8, 'active'),
  (5, 4, 4, 'Modular Desk Tray', 'WRK-TRY-032', 'Stackable powder-coated steel organizer tray.', 8.25, 19.50, 26, 6, 'active'),
  (6, 4, 4, 'Compact Barcode Scanner', 'WRK-SCN-006', 'USB handheld scanner with stand, 1D/2D support.', 31.00, 59.00, 3, 3, 'active'),
  (7, 1, 1, 'Softcover Daily Planner', 'STN-PLN-009', 'Undated weekly planner with lay-flat binding.', 5.10, 12.00, 34, 8, 'active'),
  (8, 2, 2, 'Recycled Mailer 10x13', 'SHP-MAL-101', 'Recycled padded mailer, case of 50.', 18.00, 34.50, 0, 10, 'inactive')
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), supplier_id = VALUES(supplier_id), name = VALUES(name), description = VALUES(description), purchase_price = VALUES(purchase_price), selling_price = VALUES(selling_price), quantity = VALUES(quantity), minimum_stock = VALUES(minimum_stock), status = VALUES(status);

INSERT INTO stock_transactions (id, product_id, user_id, transaction_type, quantity_change, quantity_before, quantity_after, reference, notes) VALUES
  (1, 1, 2, 'stock_in', 80, 0, 80, 'PO-2401', 'Opening receipt from Cedar & Finch'),
  (2, 1, 3, 'stock_out', -2, 80, 78, 'SO-2401', 'Damaged units removed during count'),
  (3, 2, 2, 'stock_in', 18, 0, 18, 'PO-2402', 'Initial shipment'),
  (4, 2, 3, 'stock_out', -10, 18, 8, 'COUNT-041', 'Packing bench usage'),
  (5, 3, 2, 'stock_in', 42, 0, 42, 'PO-2403', 'Initial shipment'),
  (6, 4, 2, 'stock_in', 12, 0, 12, 'PO-2404', 'Initial shipment'),
  (7, 4, 3, 'stock_out', -7, 12, 5, 'COUNT-044', 'Damaged and display units'),
  (8, 5, 2, 'stock_in', 26, 0, 26, 'PO-2405', 'Initial shipment'),
  (9, 6, 2, 'stock_in', 3, 0, 3, 'PO-2406', 'Initial shipment'),
  (10, 7, 2, 'stock_in', 34, 0, 34, 'PO-2407', 'Initial shipment'),
  (11, 8, 2, 'stock_in', 10, 0, 10, 'PO-2408', 'Initial shipment'),
  (12, 8, 3, 'adjustment', -10, 10, 0, 'COUNT-048', 'Stock retired; item discontinued')
ON DUPLICATE KEY UPDATE notes = VALUES(notes);
