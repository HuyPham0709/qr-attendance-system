import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import TabBar from "../components/TabBar.jsx";

function ScannerLayout() {
  return (
    <div className="scanner-shell">
      <Header />
      <main className="scanner-content">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

export default ScannerLayout;
