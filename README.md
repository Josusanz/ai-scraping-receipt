# 🧾 AI Scraping Receipt

> **Find out how much AI crawlers owe your website in unpaid scraping fees.**
> Cloudflare Worker — live at [crawlerreceipt.com](https://crawlerreceipt.com)

---

## What it does

Enter any domain. We check how many pages are indexed in Common Crawl, then calculate what 15 AI crawlers would owe at $0.01/page × 12 crawls/year. The result is a dramatic, shareable receipt.

**Example:** a site with 1,000 indexed pages → **$1,800/year** owed by AI crawlers.

---

## How the math works

```
pages × 12 crawls/year × $0.01/page × 15 crawlers = annual debt
```

| Variable | Value |
|----------|-------|
| Crawlers tracked | 15 (GPTBot, ClaudeBot, GoogleOther, Bytespider...) |
| Crawl cadence | 12×/year (~monthly) |
| Price per page | $0.01 (HTTP 402 default) |
| Min pages | 50 |
| Max pages | 500,000 |

Page count comes from the [Common Crawl CDX Index API](https://index.commoncrawl.org/) — real data, no signup required. Falls back to a deterministic estimate if the API is unavailable.

---

## Routes

| Route | Description |
|-------|-------------|
| `GET /` | Landing page with domain input |
| `GET /receipt/:domain` | Full receipt page with OG tags |
| `GET /api/data?domain=x` | JSON data endpoint (CORS open) |

---

## Run locally

```bash
git clone https://github.com/Josusanz/ai-scraping-receipt.git
cd ai-scraping-receipt
npm install
npx wrangler dev
```

Open `localhost:8787`, enter a domain, get your receipt.

## Deploy

```bash
npx wrangler deploy
```

---

## Project structure

```
ai-scraping-receipt/
├── src/
│   ├── index.ts      # Worker — routing, CDX fetch, calculation
│   ├── receipt.ts    # HTML templates (landing + receipt page)
│   └── crawlers.ts   # 15 AI crawlers database
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## Protect your site

This receipt shows what's owed — to actually enforce it, deploy the HTTP 402 worker:

**[pay-per-crawl-worker →](https://github.com/Josusanz/pay-per-crawl-worker)**

---

## License

MIT — creado con ❤️ desde el Valle Sagrado del Cusco, Perú por [Josu Sanz](https://github.com/Josusanz)
