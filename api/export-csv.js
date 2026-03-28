// api/export-csv.js
// GET /api/export-csv
// Returns CSV file with all players for import into Fotis's Access DB

import { d1Query } from './_lib.js';

const COLUMNS = [
  'family_name','first_name','gender','date_of_birth',
  'country_of_birth','country_of_residence',
  'email','phone','nbo_code','photo_url',
  'wbf_form_signed','wbf_form_date',
  'ebl_form_signed','ebl_form_date',
  'minor_form_signed','minor_form_date','minor_guardian_name',
  'is_minor','registered_at','registration_source',
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.STAFF_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await d1Query(
      `SELECT ${COLUMNS.join(',')} FROM players ORDER BY registered_at DESC`
    );

    const rows  = result.results || [];
    const lines = [COLUMNS.join(',')];

    for (const row of rows) {
      lines.push(COLUMNS.map(col => escapeCSV(row[col])).join(','));
    }

    const date = new Date().toISOString().slice(0,10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wbf_players_${date}.csv"`);
    return res.status(200).send(lines.join('\n'));

  } catch (err) {
    console.error('export-csv error:', err);
    return res.status(500).json({ error: err.message });
  }
}
