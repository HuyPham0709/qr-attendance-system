function ok(res, dataOrPayload = {}, metaOrStatus) {
  // Trường hợp 1: Gọi theo HEAD -> ok(res, payload, status_code) với status là số
  if (typeof metaOrStatus === 'number') {
    return res.status(metaOrStatus).json({
      success: true,
      ...(typeof dataOrPayload === 'object' && dataOrPayload !== null ? dataOrPayload : { data: dataOrPayload })
    });
  }

  // Trường hợp 2: Gọi theo origin/dev -> ok(res, data, meta)
  const response = { success: true, data: dataOrPayload };
  if (metaOrStatus && typeof metaOrStatus === 'object') {
    response.meta = metaOrStatus;
  }
  return res.status(200).json(response);
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).send();
}

function fail(res, status = 400, message = 'Có lỗi xảy ra', code = 'ERROR') {
  const response = { success: false, message };
  if (code) {
    response.code = code;
  }
  return res.status(status).json(response);
}

module.exports = { ok, created, noContent, fail };