# NEXUM — Tax Filing & Compliance Platform

India's intelligent GST, ITR filing and client data governance platform, powered by Claude AI.

## Modules

| Module | Description |
|--------|-------------|
| **GST Returns** | GSTR-1 (B2B/B2C/HSN) and GSTR-3B (tax payable & ITC) filing |
| **Income Tax** | ITR-1 (Sahaj) and ITR-2 (capital gains) with old vs new regime comparison |
| **VAULTIQ** | Client data lifecycle OS — collection, storage, sharing, retention, DPDP compliance |
| **Claude AI** | Integrated AI assistant with deep knowledge of GST, IT Act, DPDP Act 2023 |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude API (claude-opus-4-5)
- **Auth**: JWT + bcrypt

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Anthropic API key

### 1. Clone and install

```bash
cd nexum
npm install
npm install --workspace=backend
npm install --workspace=frontend
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/nexum"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

### 3. Database setup

```bash
# Create the database
createdb nexum

# Run migrations
npm run db:migrate --workspace=backend

# Generate Prisma client
npm run db:generate --workspace=backend
```

### 4. Run development servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

### 5. First login

Register at `/register`. Choose role:
- **CA** — full access including VAULTIQ
- **Taxpayer** — GST + ITR filing

## API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/v1/auth/register` | Create account |
| `POST /api/v1/auth/login` | Login |
| `GET /api/v1/auth/me` | Profile |
| `GET /api/v1/gst/summary` | GST summary |
| `POST /api/v1/gst` | Create GST return |
| `POST /api/v1/gst/:id/file` | File return |
| `POST /api/v1/gst/calculate` | Calculate tax |
| `GET /api/v1/itr/summary` | ITR summary |
| `POST /api/v1/itr` | Create ITR |
| `POST /api/v1/itr/calculate` | Compute tax |
| `GET /api/v1/vaultiq/clients` | List clients |
| `POST /api/v1/vaultiq/clients` | Onboard client |
| `POST /api/v1/vaultiq/clients/infer-risk` | AI risk inference |
| `POST /api/v1/vaultiq/assets/classify` | Classify document |
| `GET /api/v1/vaultiq/dpdp/:id/readiness` | DPDP score |
| `GET /api/v1/vaultiq/retention` | Retention items |
| `POST /api/v1/ai/chat` | Chat with Claude |
| `GET /api/v1/ai/conversations` | List conversations |

## VAULTIQ Features

- **Risk Inference**: AI-computed risk score from services × industry × employee count
- **Document Classification**: Filename-based sensitivity scoring aligned with DPDP Act 2023
- **DPDP Registers**: 8 compliance registers (notice, purpose, sharing, retention, deletion, access, vendor, consent)
- **Retention Engine**: Automated retention rules — Aadhaar deleted after use, financials retained 8 years
- **Data Movement Ledger**: Every external disclosure logged with approval and expiry

## Tax Computation

### GST
- GSTR-1: B2B (IGST/CGST/SGST), B2C, HSN summary
- GSTR-3B: Output liability − Net ITC = Tax payable

### Income Tax (AY 2025-26)
- Old Regime: Standard slabs + Chapter VI-A deductions (80C ₹1.5L, 80D, 80G, 87A rebate ≤₹5L)
- New Regime: Revised slabs + ₹75K standard deduction + 87A rebate ≤₹7L (₹25K)
- Automatic regime comparison — recommends lower-tax option

## Compliance Notes

- DPDP Act 2023 aligned — §5 notice, §8 accountability, §8(7) storage limitation
- Sensitive Data Points (Aadhaar, Passport, Biometric, Medical) flagged automatically
- Data retention rules based on statutory requirements (PF/ESI: 8yr, Tax: 6yr, Audit: 7yr)
- JWT auth with rate limiting (auth: 10/15min, AI: 30/15min)
