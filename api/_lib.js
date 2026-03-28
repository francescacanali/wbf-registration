// lib/cloudflare.js — shared helpers for D1 and R2

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN  = process.env.CF_API_TOKEN;
const CF_D1_DB_ID   = process.env.CF_D1_DATABASE_ID;

// ── D1 Database ──────────────────────────────────────────────
export async function d1Query(sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  return json.result[0];
}

// ── R2 Storage (S3-compatible) ───────────────────────────────
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.CF_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToR2(key, buffer, contentType = 'image/jpeg') {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket:      process.env.CF_R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));
  return `${process.env.CF_R2_PUBLIC_URL}/${key}`;
}

// ── CORS headers ─────────────────────────────────────────────
export const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function corsResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
