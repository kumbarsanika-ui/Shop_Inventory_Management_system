import { useEffect, useState } from 'react';
import { CircleAlert, CirclePlus, Pencil, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { api, send } from '../services/api.js';
import SearchField from '../components/SearchField.jsx';

const blankUser = { full_name: '', email: '', password: '', role_id: '', is_active: true };
const blankRole = { name: '', description: '' };

export default function TeamPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadUsers() {
    setLoading(true);
    try { const query = new URLSearchParams({ page, limit: 10 }); if (search) query.set('search', search); setUsers(await api(`/users?${query}`)); setError(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  async function loadRoles() {
    try { setRoles((await api('/users/roles')).data); }
    catch (requestError) { setError(requestError.message); }
  }
  useEffect(() => { loadUsers(); }, [page, search]);
  useEffect(() => { loadRoles(); }, []);

  function openUser(user) {
    setEditing(user || null);
    setForm(user ? { full_name: user.full_name, email: user.email, password: '', role_id: user.role_id, is_active: Boolean(user.is_active) } : { ...blankUser, role_id: roles.find((role) => role.name === 'staff')?.id || '' });
    setError(''); setModal(true);
  }
  function openRole(role) { setEditing(role || null); setForm(role ? { name: role.name, description: role.description || '' } : blankRole); setError(''); setModal(true); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = tab === 'users'
      ? { ...form, role_id: Number(form.role_id), ...(form.password ? {} : { password: undefined }) }
      : form;
    if (tab === 'users' && editing && !form.password) delete payload.password;
    try {
      const path = tab === 'users' ? '/users' : '/users/roles';
      await send(`${path}${editing ? `/${editing.id}` : ''}`, editing ? (tab === 'users' ? 'PATCH' : 'PUT') : 'POST', payload);
      setModal(false); setNotice(`${tab === 'users' ? 'User' : 'Role'} ${editing ? 'updated' : 'created'}.`);
      if (tab === 'users') await loadUsers(); else await loadRoles();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }
  async function remove(item, kind) {
    if (!window.confirm(`Delete ${kind === 'users' ? item.full_name : item.name}?`)) return;
    try { await send(`${kind === 'users' ? '/users' : '/users/roles'}/${item.id}`, 'DELETE'); setNotice(`${kind === 'users' ? 'User' : 'Role'} deleted.`); kind === 'users' ? await loadUsers() : await loadRoles(); }
    catch (requestError) { setError(requestError.message); }
  }

  const userColumns = [
    { key: 'full_name', label: 'Team member', render: (row) => <div className="product-cell"><span className="avatar avatar-table">{row.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{row.full_name}</strong><small>{row.email}</small></span></div> },
    { key: 'role', label: 'Role', render: (row) => <span className="role-chip"><ShieldCheck size={13} />{row.role}</span> },
    { key: 'is_active', label: 'Access', render: (row) => <span className={`status-pill ${row.is_active ? 'status-active' : 'status-inactive'}`}>{row.is_active ? 'Active' : 'Disabled'}</span> },
    { key: 'created_at', label: 'Joined', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' },
    { key: 'actions', label: '', render: (row) => <div className="row-actions"><button className="icon-button" title="Edit user" aria-label={`Edit ${row.full_name}`} onClick={() => openUser(row)}><Pencil size={15} /></button><button className="icon-button danger-icon" title="Delete user" aria-label={`Delete ${row.full_name}`} onClick={() => remove(row, 'users')}><Trash2 size={15} /></button></div> }
  ];
  const roleColumns = [
    { key: 'name', label: 'Role', render: (row) => <div className="product-cell"><span className="role-symbol"><ShieldCheck size={17} /></span><span><strong className="capitalize">{row.name}</strong><small>{row.description || 'No description'}</small></span></div> },
    { key: 'created_at', label: 'Created', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' },
    { key: 'actions', label: '', render: (row) => <div className="row-actions"><button className="icon-button" title="Edit role" aria-label={`Edit ${row.name}`} onClick={() => openRole(row)}><Pencil size={15} /></button><button className="icon-button danger-icon" title="Delete role" aria-label={`Delete ${row.name}`} onClick={() => remove(row, 'roles')}><Trash2 size={15} /></button></div> }
  ];

  return <>
    <PageHeader eyebrow="ACCESS CONTROL" title="Team & roles" subtitle="Manage staff accounts and their workspace permissions." action={<button className="primary-button" onClick={() => tab === 'users' ? openUser(null) : openRole(null)}><CirclePlus size={16} />Add {tab === 'users' ? 'member' : 'role'}</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}<button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
    {notice && <div className="notice notice-success">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <section className="panel listing-panel"><div className="team-toolbar"><div className="segmented-control"><button className={tab === 'users' ? 'segment-active' : ''} onClick={() => { setTab('users'); setModal(false); }}>Members <span>{users.pagination.total || 0}</span></button><button className={tab === 'roles' ? 'segment-active' : ''} onClick={() => { setTab('roles'); setModal(false); }}>Roles <span>{roles.length}</span></button></div>{tab === 'users' && <SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search team" label="Search team members" />}</div>
      <DataTable columns={tab === 'users' ? userColumns : roleColumns} rows={tab === 'users' ? users.data : roles} empty={loading && tab === 'users' ? 'Loading team…' : `No ${tab} yet`} />
      {tab === 'users' && <Pagination page={users.pagination.page || page} totalPages={users.pagination.totalPages || 1} onChange={setPage} />}
    </section>
    {modal && <Modal title={`${editing ? 'Edit' : 'Add'} ${tab === 'users' ? 'team member' : 'role'}`} onClose={() => setModal(false)}>
      <form className="entity-form" onSubmit={submit}><div className="form-grid">
        {tab === 'users' ? <>
          <FormField label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required />
          <FormField label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
          <label className="form-field"><span>Role</span><select value={form.role_id} onChange={(event) => setForm({ ...form, role_id: event.target.value })} required>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
          <FormField label={editing ? 'New password (optional)' : 'Temporary password'} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={!editing} minLength="8" />
          {editing && <label className="filter-toggle access-toggle"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /><span className="toggle-track" /><span>Account active</span></label>}
        </> : <>
          <FormField label="Role name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <FormField label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        </>}
      </div>{error && <div role="alert" className="form-error"><CircleAlert size={16} />{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</button></div></form>
    </Modal>}
  </>;
}

function FormField({ label, value, onChange, type = 'text', ...props }) {
  return <label className="form-field"><span>{label}</span><input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
