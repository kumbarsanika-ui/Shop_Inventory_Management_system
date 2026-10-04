import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CircleAlert, Package, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { currency } from '../utils/format.js';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try { setReport((await api('/dashboard/reports')).data); setError(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const categories = report?.categories || [];
  const movement = report?.movement || [];
  const totalValue = categories.reduce((sum, category) => sum + Number(category.inventory_value || 0), 0);
  const maxMovement = Math.max(1, ...movement.map((day) => Number(day.stock_in) + Number(day.stock_out)));
  const columns = [
    { key: 'name', label: 'Category' }, { key: 'product_count', label: 'Products' },
    { key: 'units_in_stock', label: 'Units in stock', render: (row) => Number(row.units_in_stock).toLocaleString() },
    { key: 'inventory_value', label: 'Value at cost', render: (row) => currency(row.inventory_value) },
    { key: 'share', label: 'Share of value', render: (row) => <div className="share-cell"><span className="share-track"><i style={{ width: `${totalValue ? Number(row.inventory_value) / totalValue * 100 : 0}%` }} /></span><small>{totalValue ? `${Math.round(Number(row.inventory_value) / totalValue * 100)}%` : '0%'}</small></div> }
  ];

  return <>
    <PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Reports" subtitle="A practical view of your stock position and activity." action={<button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} />Refresh</button>} />
    {error && <div className="notice notice-error"><CircleAlert size={16} />{error}</div>}
    <div className="report-summary"><div className="report-summary-title"><span className="panel-kicker">PORTFOLIO SNAPSHOT</span><strong>{currency(totalValue)}</strong><small>Total inventory value at purchase cost</small></div><div className="report-summary-stat"><span className="report-icon report-icon-mint"><Package size={17} /></span><strong>{categories.reduce((sum, row) => sum + Number(row.product_count), 0)}</strong><small>Products tracked</small></div><div className="report-summary-stat"><span className="report-icon report-icon-blue"><ArrowDownToLine size={17} /></span><strong>{movement.reduce((sum, row) => sum + Number(row.stock_in), 0).toLocaleString()}</strong><small>Units received · 30 days</small></div><div className="report-summary-stat"><span className="report-icon report-icon-coral"><ArrowUpFromLine size={17} /></span><strong>{movement.reduce((sum, row) => sum + Number(row.stock_out), 0).toLocaleString()}</strong><small>Units issued · 30 days</small></div></div>
    <div className="report-grid"><section className="panel report-panel"><div className="panel-heading"><div><div className="panel-kicker">INVENTORY MIX</div><h2>Value by category</h2></div><span className="panel-unit">AT PURCHASE COST</span></div><DataTable columns={columns} rows={categories} empty={loading ? 'Loading report…' : 'No category data'} /></section>
      <section className="panel report-panel movement-report"><div className="panel-heading"><div><div className="panel-kicker">LAST 30 DAYS</div><h2>Stock movement</h2></div></div><div className="chart-legend"><span><i className="legend-in" />Stock in</span><span><i className="legend-out" />Stock out</span></div><div className="bar-chart" role="img" aria-label="Daily stock received and issued over the last 30 days">{movement.map((day) => <div className="bar-group" key={day.day} title={`${day.day}: ${day.stock_in} in, ${day.stock_out} out`}><div className="bar-pair"><i className="bar-in" style={{ height: `${Number(day.stock_in) / maxMovement * 100}%` }} /><i className="bar-out" style={{ height: `${Number(day.stock_out) / maxMovement * 100}%` }} /></div><small>{new Date(day.day).toLocaleDateString('en-US', { day: 'numeric' })}</small></div>)}{!movement.length && <div className="chart-empty">No movement recorded in this period.</div>}</div><div className="chart-axis"><span>30 days ago</span><span>Today</span></div></section></div>
  </>;
}
