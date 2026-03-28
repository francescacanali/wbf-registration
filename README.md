// api/upload-photo.js
// POST /api/upload-photo
// Body: { photo: "data:image/jpeg;base64,..." , filename: "rossi_marco.jpg" }
// Returns: { url: "https://..." }

import { uploadToR2, CORS, corsResponse } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photo, filename } = req.body;

    if (!photo || !filename) {
      return res.status(400).json({ error: 'Missing photo or filename' });
    }

    // Strip data URI prefix
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Sanitize filename
    const safeFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/__+/g, '_');

    const key = `players/${safeFilename}`;
    const url = await uploadToR2(key, buffer, 'image/jpeg');

    return res.status(200).json({ url });
  } catch (err) {
    console.error('upload-photo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
