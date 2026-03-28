# WBF / EBL Player Registration System

Stack: GitHub → Vercel (frontend + API) + Cloudflare R2 (photos) + Cloudflare D1 (database)

---

## Setup (one time, ~20 minutes)

### 1. Cloudflare D1 — Database

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **D1**
2. Click **Create database** → name it `wbf-registration`
3. Open the database → click **Console**
4. Copy and paste the contents of `scripts/schema.sql` → click **Execute**
5. Copy the **Database ID** (you'll need it for env vars)

### 2. Cloudflare R2 — Photo Storage

1. Go to Cloudflare dashboard → **R2**
2. Click **Create bucket** → name it `wbf-players-photos`
3. Go to **Settings** → enable **Public access** (or set a custom domain like `photos.worldbridge.org`)
4. Go to **R2 → Manage R2 API Tokens** → **Create API Token**
   - Permissions: **Object Read & Write**
   - Scope: specific bucket → `wbf-players-photos`
5. Copy: **Access Key ID**, **Secret Access Key**
6. Your Account ID is in the URL: `dash.cloudflare.com/{ACCOUNT_ID}/...`

### 3. GitHub — Code Repository

1. Create a new repository on GitHub called `wbf-registration`
2. Upload all files from this folder to the repository
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/wbf-registration.git
   git push -u origin main
   ```

### 4. Vercel — Hosting & API

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository `wbf-registration`
3. Go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |
| `CF_API_TOKEN` | Cloudflare API token (D1 + R2 permissions) |
| `CF_D1_DATABASE_ID` | D1 database ID from step 1 |
| `CF_R2_BUCKET` | `wbf-players-photos` |
| `CF_R2_ACCESS_KEY_ID` | R2 access key from step 2 |
| `CF_R2_SECRET_ACCESS_KEY` | R2 secret key from step 2 |
| `CF_R2_PUBLIC_URL` | `https://pub-XXXX.r2.dev` (or your custom domain) |
| `STAFF_PASSWORD` | A strong password for the staff dashboard |
| `ADOBE_WID_WBF` | WBF Adobe Sign widget ID |
| `ADOBE_WID_EBL` | EBL Adobe Sign widget ID |
| `ADOBE_WID_MINOR` | Minor Adobe Sign widget ID |

4. Click **Deploy** — Vercel will build and deploy automatically

### 5. Cloudflare API Token (for D1 access from Vercel)

1. Go to Cloudflare → **Profile → API Tokens → Create Token**
2. Use template **Edit Cloudflare Workers** or create custom with:
   - **D1**: Read + Write on your `wbf-registration` database
   - **R2**: (not needed here, R2 uses separate S3 credentials)
3. Copy the token → set as `CF_API_TOKEN` in Vercel

---

## How it works

**Player flow:**
1. Player opens `https://your-project.vercel.app`
2. Fills in personal details (4 steps)
3. Uploads and crops photo → sent to `/api/upload-photo` → stored in Cloudflare R2
4. Selects WBF/EBL forms
5. Clicks "Open Adobe Sign" → data saved to `/api/register` → D1 database
6. Redirected to Adobe Sign with all fields pre-filled

**Staff flow:**
1. Staff opens same URL → clicks "Staff ↗" → enters password
2. Dashboard loads all players from `/api/players` → D1 database
3. Can filter, search, send reminders
4. Clicks "↓ CSV" → downloads from `/api/export-csv` → imports into Fotis's Access DB

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload-photo` | Upload player photo to R2 |
| `POST` | `/api/register` | Save player registration to D1 |
| `GET`  | `/api/players` | List all players (requires `Authorization: Bearer PASSWORD`) |
| `GET`  | `/api/export-csv` | Download CSV (requires `Authorization: Bearer PASSWORD`) |

---

## Adobe Sign Pre-fill

The form passes player data to Adobe Sign via URL parameters:
```
https://eu1.documents.adobe.com/public/esignWidget?wid=XXX
  &field:First_name=Marco
  &field:Family_name=Rossi
  &field:Date_birth=15/03/1990
  ...
```

For this to work, each field in Adobe Sign must have **"Default value may come from URL"** checked.

---

## Updating the system

Any push to the `main` branch on GitHub will automatically redeploy on Vercel.
