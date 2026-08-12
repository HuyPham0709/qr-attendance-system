import { Search, Bell } from "lucide-react";
import "./Header.css";

function Header() {
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
            TP
          </span>
          <div className="app-header-user-text">
            <strong>Organizer</strong>
            <span>Chưa đăng nhập</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
