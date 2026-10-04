import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Boxes, ChartNoAxesCombined, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu, PackageSearch, Tags, Truck, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { to: '/products', label: 'Products', icon: PackageSearch },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/team', label: 'Team & roles', icon: UsersRound, roles: ['admin'] },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined, roles: ['admin', 'manager'] }
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find((item) => item.to === location.pathname);

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return <div className="app-frame">
    <button className="mobile-menu icon-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>
      {menuOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Boxes size={19} /></span><span>stockroom<span className="brand-period">.</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navigation.filter((item) => !item.roles || item.roles.includes(user?.role?.toLowerCase())).map(({ to, label, icon: Icon }) =>
          <NavLink end={to === '/'} to={to} key={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{to === '/inventory' && <span className="nav-dot" />}
          </NavLink>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="system-status"><span className="status-light" /><span>System operational</span></div>
        <button className="profile-button" onClick={signOut} title="Sign out">
          <span className="avatar">{user?.full_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <span className="profile-copy"><strong>{user?.full_name}</strong><small>{user?.role}</small></span>
          <LogOut size={16} className="logout-icon" />
        </button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Stockroom</span><span className="crumb-divider">/</span><strong>{current?.label || 'Workspace'}</strong></div><div className="topbar-right"><span className="today-label">INVENTORY CONTROL</span><span className="topbar-avatar">{user?.full_name?.slice(0, 1).toUpperCase()}</span></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}
