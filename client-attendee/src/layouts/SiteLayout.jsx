import { Link, NavLink, Outlet } from "react-router-dom";
import { Ticket } from "lucide-react";
import "./SiteLayout.css";

function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="site-brand">
          <span className="site-brand-mark">
            <Ticket size={18} strokeWidth={2.3} />
          </span>
          QR Attendance
        </Link>
        <nav className="site-nav">
          <NavLink to="/" end className="site-nav-link">
            Sự kiện
          </NavLink>
          <NavLink to="/lookup" className="site-nav-link">
            Tra cứu vé
          </NavLink>
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Mất vé? Vào mục "Tra cứu vé" để lấy lại mã QR bằng email đã đăng ký.</p>
      </footer>
    </div>
  );
}

export default SiteLayout;
