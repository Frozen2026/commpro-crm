# Commercial Pro Marketing Site (`commpro.ai`)

Standalone Next.js marketing website for **https://commpro.ai**.

The CRM stays at **https://app.commpro.ai** (`Frozen2026/commpro-crm`).

## Local development

```bash
cd marketing-site
npm install
npm run dev
```

## Deploy to commpro.ai (Vercel)

1. Create a **new** Vercel project (do not reuse the CRM project).
2. Import `Frozen2026/commpro-crm` (or copy this folder into `Frozen2026/commpro.ai`).
3. Set **Root Directory** to `marketing-site`.
4. Deploy Production.
5. Assign domains: `commpro.ai` and `www.commpro.ai`.

CRM links (login / COI) point to `https://app.commpro.ai`.
