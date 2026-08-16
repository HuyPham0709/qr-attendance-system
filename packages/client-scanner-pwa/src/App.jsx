import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { ScanProvider } from "./contexts/ScanContext.jsx";
import ScannerLayout from "./layouts/ScannerLayout.jsx";
import Scan from "./pages/Scan.jsx";
import History from "./pages/History.jsx";
import Login from "./pages/Login.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <ScanProvider>
              <ScannerLayout />
            </ScanProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Scan />} />
        <Route path="/history" element={<History />} />
      </Route>
    </Routes>
  );
}

export default App;
