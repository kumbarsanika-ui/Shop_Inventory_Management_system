import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CircleAlert, CirclePlus, History, Search, X } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { api, send } from '../services/api.js';
import { shortDate } from '../utils/format.js';

const blank = { product_id: '', transaction_type: 'stock_in', quantity: '', reference: '', notes: '' };

export default function InventoryPage() {
  const [view, setView] = useState('levels');
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page, limit: 10 });
      if (view === 'levels') {
        if (search) query.set('search', search);
        if (lowStock) query.set('low_stock', 'true');
        query.set('sortBy', sortBy);
        query.set('sortOrder', sortOrder);
        setResult(await api(`/inventory?${query}`));
      } else {
        if (search) query.set('search', search);
        if (transactionType) query.set('transaction_type', transactionType);
        query.set('sortBy', sortBy);
        query.set('sortOrder', sortOrder);
        setResult(await api(`/inventory/transactions?${query}`));
      }
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [view, page, search, lowStock, transactionType, sortBy, sortOrder]);
  useEffect(() => { api('/products?limit=100').then((data) => setProducts(data.data)).catch((requestError) => setError(requestError.message)); }, []);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, product_id: Number(form.product_id), quantity: Number(form.quantity) };
    try { await send('/inventory/transactions', 'POST', payload); setModal(false); setForm(blank); setNotice('Stock movement recorded.'); setView('transactions'); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  const levelColumns = [
    { key: 'name', label: 'Product', render: (row) => <div className="product-cell"><span className="product-icon"><span>{row.name.slice(0, 1).toUpperCase()}</span></span><span><strong>{row.name}</strong><small>{row.sku}</small></span></div> },
    { key: 'category_name', label: 'Category' },
    { key: 'quantity', label: 'Available', render: (row) => <strong>{row.quantity} units</strong> },
    { key: 'minimum_stock', label: 'Reorder point', render: (row) => `Minimum ${row.minimum_stock}` },
    { key: 'is_low_stock', label: 'Status', render: (row) => <span className={`status-pill ${row.is_low_stock ? 'status-low' : 'status-active'}`}>{row.is_low_stock ? 'Reorder' : 'Healthy'}</span> }
  ];
  const transactionColumns = [
    { key: 'product_name', label: 'Product', render: (row) => <div className="product-cell"><span className="product-icon"><span>{row.product_name.slice(0, 1).toUpperCase()}</span></span><span><strong>{row.product_name}</strong><small>{row.sku}</small></span></div> },
    { key: 'transaction_type', label: 'Movement', render: (row) => <span className={`movement movement-${row.transaction_type}`}><span />{row.transaction_type.replace('_', ' ')}</span> },
    { key: 'quantity_change', label: 'Change', render: (row) => <strong className={row.quantity_change >= 0 ? 'positive' : 'negative'}>{row.quantity_change > 0 ? '+' : ''}{row.quantity_change}</strong> },
    { key: 'quantity_after', label: 'Balance', render: (row) => `${row.quantity_after} units` },
    { key: 'reference', label: 'Reference' },
    { key: 'created_at', label: 'Date', render: (row) => shortDate(row.created_at) }
  ];

  return <>
    <PageHeader eyebrow="STOCK CONTROL" title="Inventory" subtitle="Monitor availability and keep a dependable movement history." action={<button className="primary-button" onClick={() => { setError(''); setForm(blank); setModal(true); }}><CirclePlus size={16} />Record movement</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
    {notice && <div className="notice notice-success">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="inventory-summary"><span className="summary-symbol"><History size={18} /></span><div><strong>Every adjustment leaves a trace.</strong><span>Current quantity is reconciled against an audit-ready movement log.</span></div><span className="summary-tag">LIVE STOCK</span></div>
    <section className="panel listing-panel"><div className="inventory-toolbar">
      <div className="segmented-control" role="tablist" aria-label="Inventory view"><button role="tab" aria-selected={view === 'levels'} className={view === 'levels' ? 'segment-active' : ''} onClick={() => { setView('levels'); setSortBy('name'); setSortOrder('asc'); setPage(1); }}>Stock levels</button><button role="tab" aria-selected={view === 'transactions'} className={view === 'transactions' ? 'segment-active' : ''} onClick={() => { setView('transactions'); setSortBy('created_at'); setSortOrder('desc'); setPage(1); }}>Movement history</button></div>
      <div className="inventory-filters"><label className="search-control"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={view === 'levels' ? 'Search product or SKU' : 'Search product or reference'} aria-label="Search inventory" /></label>{view === 'levels' ? <label className="filter-toggle"><input type="checkbox" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} /><span className="toggle-track" /><span>Low only</span></label> : <label className="toolbar-select"><span className="sr-only">Movement type</span><select value={transactionType} onChange={(event) => { setTransactionType(event.target.value); setPage(1); }}><option value="">All movements</option><option value="stock_in">Stock in</option><option value="stock_out">Stock out</option><option value="adjustment">Adjustments</option></select></label>}<label className="toolbar-select"><span className="sr-only">Sort inventory</span><select value={`${sortBy}:${sortOrder}`} onChange={(event) => { const [field, direction] = event.target.value.split(':'); setSortBy(field); setSortOrder(direction); }}><option value="name:asc">Name A–Z</option>{view === 'levels' ? <><option value="sku:asc">SKU A–Z</option><option value="quantity:asc">Lowest quantity</option><option value="minimum_stock:desc">Reorder point</option><option value="updated_at:desc">Recently updated</option></> : <><option value="created_at:desc">Newest first</option><option value="quantity_change:desc">Largest change</option><option value="product_name:asc">Product A–Z</option><option value="transaction_type:asc">Movement type</option></>}</select></label></div>
    </div><DataTable columns={view === 'levels' ? levelColumns : transactionColumns} rows={result.data} empty={loading ? 'Loading inventory…' : 'No records found'} /><Pagination page={result.pagination.page || page} totalPages={result.pagination.totalPages || 1} onChange={setPage} /></section>
    {modal && <Modal title="Record stock movement" onClose={() => setModal(false)}>
      <form className="entity-form" onSubmit={submit}><div className="form-grid">
        <label className="form-field form-field-wide"><span>Product</span><select required value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })}><option value="">Choose a product</option>{products.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.sku} · {item.quantity} in stock</option>)}</select></label>
        <label className="form-field"><span>Movement type</span><select value={form.transaction_type} onChange={(event) => setForm({ ...form, transaction_type: event.target.value })}><option value="stock_in">Stock in</option><option value="stock_out">Stock out</option><option value="adjustment">Set actual quantity</option></select></label>
        <label className="form-field"><span>{form.transaction_type === 'adjustment' ? 'New actual quantity' : 'Units'}</span><input type="number" min={form.transaction_type === 'adjustment' ? 0 : 1} step="1" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
        <label className="form-field form-field-wide"><span>Reference</span><input maxLength="120" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="e.g. delivery note or count sheet" /></label>
        <label className="form-field form-field-wide"><span>Notes</span><textarea rows="3" maxLength="500" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
      </div>{error && <div role="alert" className="form-error"><CircleAlert size={16} />{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Recording…' : 'Record movement'}</button></div></form>
    </Modal>}
  </>;
}
