function ok(res, payload = {}, status = 200) {
  return res.status(status).json({
    success: true,
    ...payload
  });
}

function fail(res, status = 400, message = 'Có lỗi xảy ra', code = 'ERROR') {
  return res.status(status).json({
    success: false,
    message,
    code
  });
}

module.exports = { ok, fail };
