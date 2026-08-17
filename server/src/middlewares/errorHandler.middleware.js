// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  // Không leak stack trace / chi tiết lỗi nội bộ ra client khi là lỗi 500 không xác định.
  const status = err.status || 500;
  const message = status === 500 ? 'Đã có lỗi xảy ra, vui lòng thử lại sau' : err.message;

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;