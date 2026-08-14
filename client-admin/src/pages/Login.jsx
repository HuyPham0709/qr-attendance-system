import { QrCode } from "lucide-react";
import "./Login.css";

function Login() {
  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={(e) => e.preventDefault()}>
        <span className="login-mark">
          <QrCode size={20} strokeWidth={2.4} />
        </span>
        <h1>Đăng nhập Organizer</h1>
        <p>Quản lý sự kiện và theo dõi check-in real-time.</p>

        <label className="login-field">
          <span>Email</span>
          <input type="email" placeholder="ban-to-chuc@vidu.com" disabled />
        </label>
        <label className="login-field">
          <span>Mật khẩu</span>
          <input type="password" placeholder="••••••••" disabled />
        </label>

        <button type="submit" className="btn-primary" disabled>
          Đăng nhập
        </button>
        <p className="login-note">
          Form này chưa nối API — sẽ hoàn thiện ở Tuần 2 (Auth API).
        </p>
      </form>
    </div>
  );
}

export default Login;
