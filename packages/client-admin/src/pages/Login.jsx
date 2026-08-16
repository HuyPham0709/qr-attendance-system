import { QrCode } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
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
      // Redirect sau khi login thành công
      setTimeout(() => {
        navigate("/");
      }, 600);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="login-mark">
          <QrCode size={20} strokeWidth={2.4} />
        </span>
        <h1>Đăng nhập Organizer</h1>
        <p>Quản lý sự kiện và theo dõi check-in real-time.</p>

        {error && <div className="login-error">{error}</div>}

        <label className="login-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="ban-to-chuc@vidu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label className="login-field">
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
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        
        <p className="login-note">
          Demo: Dùng bất kỳ email nào để test (sẽ nối API ở Tuần 2).
          <br />
          Ví dụ: organizer@test.com
        </p>
      </form>
    </div>
  );
}

export default Login;
