// api/players.js
// GET /api/players?search=&filter=all&page=1
// Protected by STAFF_PASSWORD header

import { d1Query } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Simple password protection
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.STAFF_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { search = '', filter = 'all', page = 1 } = req.query;
    const limit  = 50;
    const offset = (parseInt(page) - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (first_name LIKE ? OR family_name LIKE ? OR email LIKE ? OR nbo_code LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (filter === 'nwbf')  { where += ' AND wbf_form_signed = 0'; }
    if (filter === 'nebl')  { where += ' AND ebl_form_signed = 0'; }
    if (filter === 'nmin')  { where += ' AND is_minor = 1 AND minor_form_signed = 0'; }
    if (filter === 'minor') { where += ' AND is_minor = 1'; }

    const [rows, countRow] = await Promise.all([
      d1Query(
        `SELECT * FROM players ${where} ORDER BY registered_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      d1Query(
        `SELECT COUNT(*) as total FROM players ${where}`,
        params
      ),
    ]);

    const stats = await d1Query(`
      SELECT
        COUNT(*)                                          AS total,
        SUM(CASE WHEN wbf_form_signed=0 THEN 1 ELSE 0 END) AS missing_wbf,
        SUM(CASE WHEN ebl_form_signed=0 THEN 1 ELSE 0 END) AS missing_ebl,
        SUM(CASE WHEN is_minor=1 AND minor_form_signed=0 THEN 1 ELSE 0 END) AS missing_minor
      FROM players
    `);

    return res.status(200).json({
      players: rows.results || [],
      total:   countRow.results?.[0]?.total || 0,
      page:    parseInt(page),
      stats:   stats.results?.[0] || {},
    });

  } catch (err) {
    console.error('players error:', err);
    return res.status(500).json({ error: err.message });
  }
}
