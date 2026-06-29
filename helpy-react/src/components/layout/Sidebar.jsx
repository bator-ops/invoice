import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: 'ti-dashboard', label: 'Хяналтын самбар', end: true },
  { to: '/invoices', icon: 'ti-file-invoice', label: 'Нэхэмжлэл' },
  // ЗАСВАР: Тансаг, зөв хаягийг массивт оруулж өгөв. Ингэснээр автомат идэвхждэг болно.
  { to: '/create-invoice', icon: 'ti-file-plus', label: 'Нэхэмжлэх үүсгэх' },
  { to: '/summary', icon: 'ti-chart-bar', label: 'Нийт хураангуй' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><i className="ti ti-file-invoice" /></div>
        <div>
          <div className="brand-name">Helpy</div>
          <div className="brand-sub">INVOICE SYSTEM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Үндсэн цэс</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`ti ${item.icon}`} /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginTop: 4, color: '#b0bec5' }}>Invoice JB © 2026</div>
      </div>
    </aside>
  );
}