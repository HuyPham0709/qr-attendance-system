import { ScanLine } from "lucide-react";
import "./Login.css";

function Login() {
  return (
    <div className="scanner-login">
      <span className="scanner-login-mark">
        <ScanLine size={22} strokeWidth={2.2} />
      </span>
      <h1>Đăng nhập nhân viên soát vé</h1>
      <p>Chọn sự kiện và cổng để bắt đầu quét QR.</p>

      <label className="scanner-login-field">
        <span>Email</span>
        <input type="email" placeholder="nhanvien@vidu.com" disabled />
      </label>
      <label className="scanner-login-field">
        <span>Mật khẩu</span>
        <input type="password" placeholder="••••••••" disabled />
      </label>

      <button type="button" className="scanner-login-btn" disabled>
        Đăng nhập
      </button>
      <p className="scanner-login-note">
        Form này chưa nối API — sẽ hoàn thiện ở Tuần 2 (Auth API).
      </p>
    </div>
  );
}

export default Login;
