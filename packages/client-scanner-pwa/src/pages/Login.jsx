import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine } from "lucide-react";
import { useAuth } from '../contexts/AuthContext.jsx';
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    if (!email.includes("@")) {
      setError("Email không hợp lệ");
      return;
    }

    try {
      login(email, password);
      setTimeout(() => {
        navigate("/");
      }, 600);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="scanner-login">
      <span className="scanner-login-mark">
        <ScanLine size={22} strokeWidth={2.2} />
      </span>
      <h1>Đăng nhập nhân viên soát vé</h1>
      <p>Chọn sự kiện và cổng để bắt đầu quét QR.</p>

      {error && <div className="scanner-login-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className="scanner-login-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="nhanvien@vidu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label className="scanner-login-field">
          <span>Mật khẩu</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <button
          type="submit"
          className="scanner-login-btn"
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="scanner-login-note">
        Demo: Dùng bất kỳ email nào để test (sẽ nối API ở Tuần 2).
      </p>
    </div>
  );
}

export default Login;
