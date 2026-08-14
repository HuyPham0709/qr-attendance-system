import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  QrCode,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/events", label: "Sự kiện", icon: CalendarDays },
  { to: "/attendees", label: "Người tham dự", icon: Users },
  { to: "/reports", label: "Báo cáo", icon: BarChart3 },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <QrCode size={18} strokeWidth={2.4} />
        </span>
        <div className="sidebar-brand-text">
          <strong>QR Attendance</strong>
          <span>Bảng điều khiển</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " is-active" : "")
            }
          >
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Realtime: đang kết nối…</span>
        </div>
        <button type="button" className="sidebar-link sidebar-logout">
          <LogOut size={18} strokeWidth={2} aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
