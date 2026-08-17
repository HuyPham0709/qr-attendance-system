import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/", { replace: true });
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="login-mark">
          <QrCode size={20} strokeWidth={2.4} />
        </span>
        <h1>Đăng nhập Organizer</h1>
        <p>Quản lý sự kiện và theo dõi check-in real-time.</p>

        <label className="login-field">
          <span>Email</span>
          <input type="email" placeholder="ban-to-chuc@vidu.com" />
        </label>
        <label className="login-field">
          <span>Mật khẩu</span>
          <input type="password" placeholder="••••••••" />
        </label>

        <button type="submit" className="btn-primary">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}

export default Login;
