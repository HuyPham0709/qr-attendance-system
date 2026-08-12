import { Routes, Route } from "react-router-dom";
import ScannerLayout from "./layouts/ScannerLayout.jsx";
import Scan from "./pages/Scan.jsx";
import History from "./pages/History.jsx";
import Login from "./pages/Login.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ScannerLayout />}>
        <Route path="/" element={<Scan />} />
        <Route path="/history" element={<History />} />
      </Route>
    </Routes>
  );
}

export default App;
