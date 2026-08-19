const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: 'super_admin' | 'organizer' | 'scanner_staff'
}

// Đăng nhập xong luôn về 1 trong 3 dạng — role/2FA có bật hay không đều
// do BACKEND quyết định (dựa trên user.role + user.twoFactorEnabled thật
// trong DB), FE không tự đoán hay tự chọn được nữa.
export type LoginResult =
  | { kind: 'session'; user: AuthUser }
  | { kind: 'requires2FA'; pendingToken: string }
  | { kind: 'requires2FASetup'; pendingToken: string }

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Bắt buộc để truyền/nhận HttpOnly Cookies
    body: JSON.stringify(body),
  })

  const result = await response.json()

  if (!response.ok || result.success === false) {
    throw new Error(result.message || result.error || 'Có lỗi xảy ra')
  }

  return result.data as T
}

export async function loginApi(email: string, password: string): Promise<LoginResult> {
  const data = await postAuth<any>('/api/auth/login', { email, password })

  if (data.requires2FA) return { kind: 'requires2FA', pendingToken: data.pendingToken }
  if (data.requires2FASetup) return { kind: 'requires2FASetup', pendingToken: data.pendingToken }
  return { kind: 'session', user: data.user }
}

/** Bước 2 khi tài khoản ĐÃ bật 2FA: gửi mã 6 số lấy từ app xác thực. */
export async function verify2FAApi(pendingToken: string, code: string): Promise<{ user: AuthUser }> {
  return postAuth('/api/auth/2fa/verify', { pendingToken, code })
}

/** Khởi tạo setup 2FA lần đầu — trả QR (data URL) + secret dạng text để nhập tay. */
export async function setup2FAApi(pendingToken: string): Promise<{ qrCodeDataUrl: string; secret: string }> {
  return postAuth('/api/auth/2fa/setup', { pendingToken })
}

/** Xác nhận mã đầu tiên sau khi quét QR -> bật 2FA thật + đăng nhập luôn. */
export async function confirmSetup2FAApi(pendingToken: string, code: string): Promise<{ user: AuthUser }> {
  return postAuth('/api/auth/2fa/confirm-setup', { pendingToken, code })
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}