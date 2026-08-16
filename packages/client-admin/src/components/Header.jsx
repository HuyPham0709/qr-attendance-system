import { Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./Header.css";

function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="app-header">
      <div className="app-header-search">
        <Search size={16} strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          placeholder="Tìm sự kiện, người tham dự…"
          aria-label="Tìm kiếm"
        />
      </div>

      <div className="app-header-actions">
        <button type="button" className="icon-btn" aria-label="Thông báo">
          <Bell size={18} strokeWidth={2} />
        </button>
        <div className="app-header-user">
          <span className="app-header-avatar" aria-hidden="true">
            {getInitials(user?.name)}
          </span>
          <div className="app-header-user-text">
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.email || 'Chưa đăng nhập'}</span>
          </div>
        </div>
        <button
          type="button"
          className="icon-btn logout-btn"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

export default Header;
