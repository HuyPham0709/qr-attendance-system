import { NavLink } from "react-router-dom";
import { ScanLine, History } from "lucide-react";
import "./TabBar.css";

const TABS = [
  { to: "/", label: "Quét QR", icon: ScanLine, end: true },
  { to: "/history", label: "Lịch sử", icon: History },
];

function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Điều hướng chính">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            "tab-bar-item" + (isActive ? " is-active" : "")
          }
        >
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default TabBar;
