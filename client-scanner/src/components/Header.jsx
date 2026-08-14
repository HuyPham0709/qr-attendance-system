import { Wifi, WifiOff } from "lucide-react";
import "./Header.css";

// Placeholder connection state — will read from Socket.io / Dexie sync
// status once offline-first sync lands in Tuần 6.
const isOnline = true;

function Header() {
  return (
    <header className="scanner-header">
      <div className="scanner-header-info">
        <span className="scanner-header-event">Chưa chọn sự kiện</span>
        <span className="scanner-header-gate">Cổng: —</span>
      </div>
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
    </header>
  );
}

export default Header;
