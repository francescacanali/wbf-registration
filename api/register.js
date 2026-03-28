// api/register.js
// POST /api/register
// Saves player data to D1 (photo already uploaded via /api/upload-photo)

import { d1Query } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name, family_name, gender, date_of_birth,
      country_of_birth, country_of_residence,
      email, phone, nbo_code, photo_url,
      wbf_form_signed, ebl_form_signed, minor_form_signed,
      minor_guardian_name, is_minor,
    } = req.body;

    // Validation
    if (!first_name || !family_name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const today = new Date().toISOString().slice(0, 10);

    const result = await d1Query(
      `INSERT INTO players (
        first_name, family_name, gender, date_of_birth,
        country_of_birth, country_of_residence,
        email, phone, nbo_code, photo_url,
        wbf_form_signed, wbf_form_date,
        ebl_form_signed, ebl_form_date,
        minor_form_signed, minor_form_date,
        minor_guardian_name, is_minor,
        registered_at, registration_source
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),'web_form')
      RETURNING id`,
      [
        first_name, family_name, gender || null, date_of_birth || null,
        country_of_birth || null, country_of_residence || null,
        email, phone || null, nbo_code || null, photo_url || null,
        wbf_form_signed   ? 1 : 0, wbf_form_signed   ? today : null,
        ebl_form_signed   ? 1 : 0, ebl_form_signed   ? today : null,
        minor_form_signed ? 1 : 0, minor_form_signed ? today : null,
        minor_guardian_name || null, is_minor ? 1 : 0,
      ]
    );

    const newId = result?.results?.[0]?.id;
    return res.status(201).json({ success: true, id: newId });

  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: err.message });
  }
}
