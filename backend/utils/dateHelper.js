/**
 * Date Helper for User Local Timezone handling
 */

/**
 * Returns YYYY-MM-DD from a Date object in local components
 */
function formatDateLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Extracts target date string (YYYY-MM-DD) from request query, body, or headers,
 * respecting user's local timezone offset instead of raw UTC.
 */
function getRequestDate(req) {
  if (req.query && req.query.date) return req.query.date;
  if (req.body && req.body.date) return req.body.date;
  if (req.headers && req.headers['x-client-date']) return req.headers['x-client-date'];

  const offsetMinutes = parseInt(req.headers?.['x-timezone-offset'] || '0', 10);
  if (!isNaN(offsetMinutes) && offsetMinutes !== 0) {
    // Note: getTimezoneOffset() returns minutes that local time is BEHIND UTC (e.g. India is -330)
    // Date.now() - (-330 * 60000) = Date.now() + 5.5 hours = local time in India!
    const localMs = Date.now() - offsetMinutes * 60 * 1000;
    const d = new Date(localMs);
    // Use UTC getters on the shifted timestamp
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return formatDateLocal(new Date());
}

module.exports = {
  formatDateLocal,
  getRequestDate
};
