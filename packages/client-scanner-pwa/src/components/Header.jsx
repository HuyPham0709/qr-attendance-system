import { useState, useEffect } from 'react';
import { Wifi, WifiOff, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useScan } from "../contexts/ScanContext";
import "./Header.css";

function Header() {
  const { logout } = useAuth();
  const { selectedEvent } = useScan();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="scanner-header">
      <div className="scanner-header-info">
        <span className="scanner-header-event">
          {selectedEvent?.name || 'Chưa chọn sự kiện'}
        </span>
        <span className="scanner-header-gate">
          {selectedEvent?.gates?.[0]?.name || 'Cổng: —'}
        </span>
      </div>
      <div className="scanner-header-actions">
        <div
          className={
            "scanner-header-status" + (isOnline ? "" : " is-offline")
          }
        >
          {isOnline ? (
            <Wifi size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <WifiOff size={16} strokeWidth={2} aria-hidden="true" />
          )}
          <span>{isOnline ? "Trực tuyến" : "Offline · chờ đồng bộ"}</span>
        </div>
        <button
          className="scanner-logout-btn"
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
