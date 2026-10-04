import { useDeferredValue, useEffect, useState } from 'react';
import { CircleAlert, CirclePlus, Pencil, Search, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { api, send } from '../services/api.js';
import { currency } from '../utils/format.js';

const blank = { name: '', sku: '', category_id: '', supplier_id: '', description: '', purchase_price: '', selling_price: '', quantity: '0', minimum_stock: '5', status: 'active' };

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [lowStock, setLowStock] = useState(searchParams.get('low_stock') === 'true');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'created_at', sortOrder: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder });
      if (deferredSearch) params.set('search', deferredSearch);
      if (lowStock) params.set('low_stock', 'true');
      if (categoryId) params.set('category_id', categoryId);
      if (status) params.set('status', status);
      setResult(await api(`/products?${params}`));
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, [page, deferredSearch, lowStock, categoryId, status, sort]);
  useEffect(() => {
    Promise.all([api('/categories?limit=100'), api('/suppliers?limit=100')]).then(([categoryResult, supplierResult]) => {
      setCategories(categoryResult.data);
      setSuppliers(supplierResult.data);
    }).catch((requestError) => setError(requestError.message));
  }, []);
  useEffect(() => { setSearchParams(lowStock ? { low_stock: 'true' } : {}); }, [lowStock, setSearchParams]);

  function openCreate() { setEditing(null); setForm(blank); setError(''); setModal(true); }
  function openEdit(product) {
    setEditing(product);
    setForm(Object.fromEntries(Object.keys(blank).map((key) => [key, product[key] ?? ''])));
    setError(''); setModal(true);
  }
  function setField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      quantity: Number(form.quantity),
      minimum_stock: Number(form.minimum_stock)
    };
    try {
      await send(editing ? `/products/${editing.id}` : '/products', editing ? 'PUT' : 'POST', payload);
      setModal(false); setNotice(editing ? 'Product updated.' : 'Product added to your catalog.');
      await loadProducts();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function remove(product) {
    if (!window.confirm(`Delete ${product.name}? Products with stock history cannot be deleted.`)) return;
    try { await send(`/products/${product.id}`, 'DELETE'); setNotice('Product deleted.'); await loadProducts(); }
    catch (requestError) { setError(requestError.message); }
  }

  function changeSort(key) {
    setSort((current) => ({ sortBy: key, sortOrder: current.sortBy === key && current.sortOrder === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  }

  const columns = [
    { key: 'name', label: 'Product', sortable: true, render: (row) => <div className="product-cell"><span className="product-icon"><span>{row.name.slice(0, 1).toUpperCase()}</span></span><span><strong>{row.name}</strong><small>{row.sku}</small></span></div> },
    { key: 'category_name', label: 'Category' },
    { key: 'quantity', label: 'On hand', sortable: true, render: (row) => <span className={`stock-pill${row.quantity <= row.minimum_stock ? ' stock-low' : ' stock-ok'}`}>{row.quantity} {row.quantity === 1 ? 'unit' : 'units'}</span> },
    { key: 'purchase_price', label: 'Cost', sortable: true, render: (row) => currency(row.purchase_price) },
    { key: 'selling_price', label: 'Price', sortable: true, render: (row) => currency(row.selling_price) },
    { key: 'status', label: 'Status', render: (row) => <span className={`status-pill status-${row.status}`}>{row.status}</span> },
    { key: 'actions', label: '', render: (row) => <div className="row-actions"><button className="icon-button" aria-label={`Edit ${row.name}`} title="Edit product" onClick={() => openEdit(row)}><Pencil size={15} /></button><button className="icon-button danger-icon" aria-label={`Delete ${row.name}`} title="Delete product" onClick={() => remove(row)}><Trash2 size={15} /></button></div> }
  ];

  return <>
    <PageHeader eyebrow="CATALOG" title="Products" subtitle="Your catalog, stock levels and pricing in one place." action={<button className="primary-button" onClick={openCreate}><CirclePlus size={16} />Add product</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
    {notice && <div className="notice notice-success">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <section className="panel listing-panel">
      <div className="list-toolbar"><div className="search-control"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or SKU" aria-label="Search products" /></div>
        <label className="toolbar-select"><span className="sr-only">Category filter</span><select aria-label="Filter by category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="toolbar-select"><span className="sr-only">Product status filter</span><select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="filter-toggle"><input type="checkbox" checked={lowStock} onChange={(event) => { setLowStock(event.target.checked); setPage(1); }} /><span className="toggle-track" /><span>Low stock only</span></label>
        <span className="result-count">{result.pagination.total || 0} products</span>
      </div>
      <DataTable columns={columns} rows={result.data} sortBy={sort.sortBy} sortOrder={sort.sortOrder} onSort={changeSort} empty={loading ? 'Loading products…' : 'No products match these filters'} />
      <Pagination page={result.pagination.page || page} totalPages={result.pagination.totalPages || 1} onChange={setPage} />
    </section>
    {modal && <Modal title={editing ? 'Edit product' : 'Add product'} onClose={() => setModal(false)} wide>
      <form className="entity-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Product name" name="name" value={form.name} onChange={setField} required />
          <Field label="SKU" name="sku" value={form.sku} onChange={setField} required />
          <label className="form-field"><span>Category</span><select name="category_id" value={form.category_id} onChange={setField} required><option value="">Choose category</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="form-field"><span>Supplier</span><select name="supplier_id" value={form.supplier_id || ''} onChange={setField}><option value="">No supplier</option>{suppliers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <Field label="Purchase price" name="purchase_price" type="number" min="0" step="0.01" value={form.purchase_price} onChange={setField} required />
          <Field label="Selling price" name="selling_price" type="number" min="0" step="0.01" value={form.selling_price} onChange={setField} required />
          <Field label="Quantity on hand" name="quantity" type="number" min="0" value={form.quantity} onChange={setField} required />
          <Field label="Minimum stock" name="minimum_stock" type="number" min="0" value={form.minimum_stock} onChange={setField} required />
          <label className="form-field"><span>Status</span><select name="status" value={form.status} onChange={setField}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <label className="form-field form-field-wide"><span>Description</span><textarea name="description" value={form.description || ''} onChange={setField} rows="3" /></label>
        </div>
        {error && <div role="alert" className="form-error"><CircleAlert size={16} />{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button></div>
      </form>
    </Modal>}
  </>;
}

function Field({ label, ...props }) {
  return <label className="form-field"><span>{label}</span><input {...props} /></label>;
}
