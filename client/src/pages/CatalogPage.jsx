import { useDeferredValue, useEffect, useState } from 'react';
import { CircleAlert, CirclePlus, Pencil, Search, Trash2, X } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { api, send } from '../services/api.js';

const blankCategory = { name: '', description: '' };
const blankSupplier = { name: '', contact_name: '', email: '', phone: '', address: '' };

export default function CatalogPage({ resource }) {
  const suppliers = resource === 'suppliers';
  const fields = suppliers
    ? [['name', 'Supplier name', true], ['contact_name', 'Contact person'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']]
    : [['name', 'Category name', true], ['description', 'Description']];
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(suppliers ? blankSupplier : blankCategory);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page, limit: 10 });
      if (deferredSearch) query.set('search', deferredSearch);
      setResult(await api(`/${resource}?${query}`)); setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [resource, page, deferredSearch]);

  function openForm(item) {
    setEditing(item || null);
    setForm(item ? Object.fromEntries(fields.map(([key]) => [key, item[key] ?? ''])) : suppliers ? blankSupplier : blankCategory);
    setError(''); setModal(true);
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' && ['email', 'contact_name', 'phone', 'address', 'description'].includes(key) ? null : value]));
    try {
      await send(`/${resource}${editing ? `/${editing.id}` : ''}`, editing ? 'PUT' : 'POST', payload);
      setModal(false); setNotice(`${suppliers ? 'Supplier' : 'Category'} ${editing ? 'updated' : 'created'}.`); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try { await send(`/${resource}/${item.id}`, 'DELETE'); setNotice('Record deleted.'); await load(); }
    catch (requestError) { setError(requestError.message); }
  }
  const columns = suppliers ? [
    { key: 'name', label: 'Supplier', render: (row) => <div className="product-cell"><span className="product-icon supplier-icon">{row.name.slice(0, 1)}</span><span><strong>{row.name}</strong><small>{row.contact_name || 'Supplier'}</small></span></div> },
    { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' },
    { key: 'actions', label: '', render: (row) => <Actions item={row} edit={openForm} remove={remove} /> }
  ] : [
    { key: 'name', label: 'Category', render: (row) => <div className="product-cell"><span className="category-swatch" /><span><strong>{row.name}</strong><small>{row.description || 'No description'}</small></span></div> },
    { key: 'created_at', label: 'Created', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' },
    { key: 'actions', label: '', render: (row) => <Actions item={row} edit={openForm} remove={remove} /> }
  ];

  return <>
    <PageHeader eyebrow={suppliers ? 'PARTNERS' : 'PRODUCT TAXONOMY'} title={suppliers ? 'Suppliers' : 'Categories'} subtitle={suppliers ? 'The partners who keep your shelves stocked.' : 'Keep products organized and easy to find.'} action={<button className="primary-button" onClick={() => openForm(null)}><CirclePlus size={16} />Add {suppliers ? 'supplier' : 'category'}</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
    {notice && <div className="notice notice-success">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <section className="panel listing-panel"><div className="list-toolbar"><div className="search-control"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${suppliers ? 'suppliers' : 'categories'}`} /></div><span className="result-count">{result.pagination.total || 0} records</span></div>
      <DataTable columns={columns} rows={result.data} empty={loading ? 'Loading records…' : `No ${resource} found`} /><Pagination page={result.pagination.page || page} totalPages={result.pagination.totalPages || 1} onChange={setPage} />
    </section>
    {modal && <Modal title={`${editing ? 'Edit' : 'Add'} ${suppliers ? 'supplier' : 'category'}`} onClose={() => setModal(false)}>
      <form className="entity-form" onSubmit={submit}><div className="form-grid">{fields.map(([key, label, required]) => <label className={`form-field${key === 'address' || key === 'description' ? ' form-field-wide' : ''}`} key={key}><span>{label}</span>{key === 'address' || key === 'description' ? <textarea rows="3" value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={required} /> : <input type={key === 'email' ? 'email' : 'text'} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={required} />}</label>)}</div>
        {error && <div role="alert" className="form-error"><CircleAlert size={16} />{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</button></div>
      </form>
    </Modal>}
  </>;
}

function Actions({ item, edit, remove }) {
  return <div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.name}`} title="Edit" onClick={() => edit(item)}><Pencil size={15} /></button><button className="icon-button danger-icon" aria-label={`Delete ${item.name}`} title="Delete" onClick={() => remove(item)}><Trash2 size={15} /></button></div>;
}
