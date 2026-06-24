# NEXUM — Deployment Guide
## Stack: Neon (DB) → Render (Backend) → Vercel (Frontend)
## All free tiers. Takes ~15 minutes.

---

## STEP 1 — Install Git (if not installed)
Download from https://git-scm.com/download/win → Install with defaults.
Open a new terminal after installing.

---

## STEP 2 — Create GitHub Repository

1. Go to https://github.com → Sign in → Click "New repository"
2. Name: `nexum`
3. Set to **Public** (required for free Render/Vercel)
4. Do NOT add README/gitignore (we have our own)
5. Click **Create repository**
6. Copy the repo URL, e.g. `https://github.com/YOUR_USERNAME/nexum.git`

Now push from this folder (open Command Prompt or PowerShell):

```bash
cd C:\Users\KAVITHA\Desktop\SAI\nexum

git init
git add .
git commit -m "Initial commit — NEXUM MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nexum.git
git push -u origin main
```

---

## STEP 3 — Get your Database URL (Neon — Free PostgreSQL)

1. Go to **https://neon.tech** → Sign up with GitHub
2. Click **"New Project"**
   - Name: `nexum`
   - Region: `ap-southeast-1 (Singapore)` — closest to India
   - PostgreSQL version: 16
3. Click **Create Project**
4. On the dashboard, click **"Connection string"** → Select **Prisma** from the dropdown
5. You will see TWO URLs — copy both:

   **DATABASE_URL** (pooled, for the app):
   ```
   postgresql://nexum_owner:PASSWORD@ep-XXXX.ap-southeast-1.aws.neon.tech/nexum?sslmode=require&pgbouncer=true&connection_limit=1
   ```

   **DIRECT_URL** (direct, for migrations):
   ```
   postgresql://nexum_owner:PASSWORD@ep-XXXX.ap-southeast-1.aws.neon.tech/nexum?sslmode=require
   ```

   ⚠️ Save both — you need them in Step 4.

---

## STEP 4 — Deploy Backend to Render

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New +"** → **Web Service**
3. Connect your GitHub account → Select the `nexum` repository
4. Configure:
   - **Name**: `nexum-backend`
   - **Region**: Singapore (or closest)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run db:migrate:deploy && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free
5. Click **"Advanced"** → **Add Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste pooled URL from Neon)* |
   | `DIRECT_URL` | *(paste direct URL from Neon)* |
   | `JWT_SECRET` | *(click "Generate" or type 32+ random chars)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `ANTHROPIC_API_KEY` | *(your key from console.anthropic.com)* |
   | `CORS_ORIGIN` | *(leave blank for now — fill after Step 5)* |
   | `PORT` | `5000` |

6. Click **"Create Web Service"**
7. Wait 3–5 minutes for build to complete
8. Copy your backend URL: `https://nexum-backend.onrender.com`

---

## STEP 5 — Deploy Frontend to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"New Project"** → Import `nexum` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **"Environment Variables"** → Add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://nexum-backend.onrender.com` |

5. Click **"Deploy"**
6. Wait 2 minutes → Vercel gives you a URL like `https://nexum-abc123.vercel.app`

---

## STEP 6 — Update CORS on Render

1. Go back to **Render** → nexum-backend → **Environment**
2. Update `CORS_ORIGIN` to your Vercel URL: `https://nexum-abc123.vercel.app`
3. Click **Save Changes** → Render will redeploy automatically

---

## STEP 7 — Get your Anthropic API Key

1. Go to **https://console.anthropic.com**
2. Sign up / Log in
3. Click **"API Keys"** → **"Create Key"**
4. Copy the key (starts with `sk-ant-...`)
5. Paste it into Render env var `ANTHROPIC_API_KEY`

---

## STEP 8 — Verify everything works

1. Open your Vercel URL in browser
2. Click **Register** → Create an account
3. You should see the NEXUM dashboard
4. Test:
   - Create a GST Return → Calculate tax
   - Create an ITR → Compare regimes
   - Add a VAULTIQ client → Infer risk
   - Open AI Assistant → Ask "What is GSTR-3B?"

---

## Troubleshooting

### "Application error" on Render
- Check Render logs → Dashboard → nexum-backend → Logs
- Most common: wrong DATABASE_URL → copy again from Neon

### "Network Error" on frontend
- CORS_ORIGIN in Render must match your exact Vercel URL (no trailing slash)
- VITE_API_URL must match your Render URL exactly

### AI not responding
- Check ANTHROPIC_API_KEY is correct in Render env vars
- The API key must have credits (new accounts get free credits)

### Database migration failed
- In Render, check that DIRECT_URL is set (not just DATABASE_URL)
- Neon free tier: make sure project is not paused (it auto-pauses after 5 days idle)

---

## Custom Domain (Optional)

### Vercel custom domain:
1. Vercel → Project → Settings → Domains → Add your domain
2. Point your domain's DNS A record to Vercel's IP

### Update CORS after custom domain:
- Update `CORS_ORIGIN` in Render to your custom domain

---

## Free Tier Limits

| Service | Free Limit | Notes |
|---------|-----------|-------|
| Neon DB | 0.5 GB storage, 190 compute hours/month | Pauses after 5 days idle — wakes on first request |
| Render | 750 hours/month, sleeps after 15 min idle | First request after sleep takes ~30 sec |
| Vercel | 100 GB bandwidth, unlimited deployments | No sleep — always fast |

For production use, upgrade Render to Starter ($7/month) to avoid sleep.

---

## Local Development (after cloning)

```bash
# Install dependencies
cd nexum
npm install
cd backend && npm install
cd ../frontend && npm install

# Setup local DB (requires PostgreSQL installed)
cd ../backend
npx prisma migrate dev
npx prisma generate

# Start both servers
cd ..
# Terminal 1:
cd backend && npm run dev
# Terminal 2:
cd frontend && npm run dev
```
