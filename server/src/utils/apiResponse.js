// server/src/utils/apiResponse.js
//
// File gốc bạn gửi rỗng (0 byte) nhưng auth.controller.js đã gọi:
//   ok(res, { user })
//   ok(res, { message: '...' })
//   fail(res, err.status, err.message, err.code)
//   fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR')
// validate.middleware.js (mình viết ở lượt trước) còn gọi thêm 1 tham số
// thứ 5 là `details`. File này viết khớp với TẤT CẢ các cách gọi trên.

function ok(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * @param {import('express').Response} res
 * @param {number} [status=400]
 * @param {string} [message='Có lỗi xảy ra']
 * @param {string} [code='ERROR']
 * @param {any} [details] - optional, vd danh sách lỗi validate theo từng field
 */
function fail(res, status = 400, message = 'Có lỗi xảy ra', code = 'ERROR', details) {
  const body = { success: false, message, code };
  if (details !== undefined) {
    body.details = details;
  }
  return res.status(status).json(body);
}

module.exports = { ok, fail };