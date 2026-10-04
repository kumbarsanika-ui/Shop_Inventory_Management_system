import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Boxes, CircleAlert, Package, Plus, RefreshCw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: '2-digit' }).format(new Date()).toUpperCase();

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try { setDashboard((await api('/dashboard')).data); setError(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const transactions = dashboard?.recentTransactions || [];
  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'transaction_type', label: 'Movement', render: (row) => <span className={`movement movement-${row.transaction_type}`}><span />{row.transaction_type.replace('_', ' ')}</span> },
    { key: 'quantity_change', label: 'Units', render: (row) => <strong className={row.quantity_change > 0 ? 'positive' : 'negative'}>{row.quantity_change > 0 ? '+' : ''}{row.quantity_change}</strong> },
    { key: 'created_at', label: 'Date', render: (row) => date(row.created_at) }
  ];

  return <>
    <PageHeader eyebrow={todayLabel} title="Good morning." subtitle="Here’s the pulse of your stockroom today." action={<button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} />Refresh</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}</div>}
    <div className="metrics-grid">
      <Metric label="Active products" value={dashboard?.product_count ?? '—'} icon={Package} tone="mint" detail="Across your catalog" />
      <Metric label="Units in stock" value={dashboard?.units_in_stock?.toLocaleString() ?? '—'} icon={Boxes} tone="blue" detail="Available inventory" />
      <Metric label="Stock value" value={money(dashboard?.inventory_value)} icon={ArrowUpRight} tone="gold" detail="At purchase cost" />
      <Metric label="Need attention" value={dashboard?.low_stock_count ?? '—'} icon={CircleAlert} tone="coral" detail="At or below minimum" alert={dashboard?.low_stock_count > 0} />
    </div>
    <div className="dashboard-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><div className="panel-kicker">LATEST ACTIVITY</div><h2>Stock movements</h2></div><Link className="quiet-link" to="/inventory">View all <ArrowUpRight size={14} /></Link></div>
        <DataTable columns={columns} rows={transactions} empty={loading ? 'Loading activity…' : 'No stock movements yet'} />
      </section>
      <section className="panel low-stock-panel"><div className="panel-heading"><div><div className="panel-kicker">REORDER WATCH</div><h2>Low stock</h2></div><span className="count-pill">{dashboard?.lowStock?.length || 0}</span></div>
        <div className="low-stock-list">{(dashboard?.lowStock || []).map((item) => <div className="low-stock-row" key={item.id}><div className="product-icon"><Package size={16} /></div><div className="low-stock-copy"><strong>{item.name}</strong><small>{item.sku}</small></div><div className="stock-level"><strong>{item.quantity}</strong><span>min {item.minimum_stock}</span></div></div>)}
          {!loading && !dashboard?.lowStock?.length && <div className="quiet-empty"><span className="empty-check">✓</span>All products are above minimum stock.</div>}
        </div><Link className="low-stock-footer" to="/products?low_stock=true">Open product list <ArrowUpRight size={14} /></Link>
      </section>
    </div>
    <div className="quick-actions"><div className="quick-actions-title"><span>QUICK ACCESS</span><i /></div>
      <Link to="/products" className="quick-action"><span className="quick-icon quick-mint"><Plus size={17} /></span><span><strong>Add product</strong><small>Expand your catalog</small></span><ArrowUpRight size={15} /></Link>
      <Link to="/inventory" className="quick-action"><span className="quick-icon quick-blue"><ArrowDownRight size={17} /></span><span><strong>Record stock</strong><small>Log a stock movement</small></span><ArrowUpRight size={15} /></Link>
      <Link to="/suppliers" className="quick-action"><span className="quick-icon quick-gold"><Truck size={17} /></span><span><strong>Manage suppliers</strong><small>Keep partners up to date</small></span><ArrowUpRight size={15} /></Link>
    </div>
  </>;
}

function Metric({ label, value, icon: Icon, tone, detail, alert }) {
  return <section className={`metric metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div><strong className={alert ? 'metric-alert' : ''}>{value}</strong><small>{detail}</small></section>;
}
