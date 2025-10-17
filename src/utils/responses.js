/**
 * Standart başarılı response helper
 * @param {Response} res - Express response object
 * @param {*} data - Dönülecek veri
 * @param {number} code - HTTP status code (default: 200)
 * @returns {Response}
 */
export function ok(res, data = null, code = 200) {
  return res.status(code).json({
    ok: true,
    data,
  });
}

/**
 * Standart hata response helper
 * @param {Response} res - Express response object
 * @param {string} message - Hata mesajı
 * @param {number} code - HTTP status code (default: 500)
 * @returns {Response}
 */
export function fail(res, message = 'Internal server error', code = 500) {
  return res.status(code).json({
    ok: false,
    message,
  });
}
