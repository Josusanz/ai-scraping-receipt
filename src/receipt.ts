export interface CrawlerLine {
  name: string;
  company: string;
  pages: number;
  crawls: number;
  subtotal: number;
}

export interface ReceiptData {
  domain: string;
  pages: number;
  lines: CrawlerLine[];
  total: number;
  source: 'commoncrawl' | 'estimate';
}

function money(n: number): string {
  const cents = Math.round(n * 100);
  const whole = Math.floor(cents / 100);
  const frac = (cents % 100).toString().padStart(2, '0');
  const withCommas = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '$' + withCommas + '.' + frac;
}

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0A0F1C;
    --card: #0D1B35;
    --border: #1E3A5F;
    --cyan: #22D3EE;
    --red: #F87171;
    --yellow: #FBBF24;
    --green: #4ADE80;
    --text: #E2E8F0;
    --muted: #64748B;
  }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }
  a { color: var(--cyan); text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

export function renderLanding(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Scraping Receipt — How much do AI crawlers owe your site?</title>
  <meta name="description" content="Find out how much AI crawlers owe your website in unpaid scraping fees. Real data from Common Crawl.">
  <meta property="og:title" content="AI Scraping Receipt">
  <meta property="og:description" content="Find out how much AI crawlers owe your website in unpaid scraping fees. Real data from Common Crawl.">
  <meta name="twitter:card" content="summary">
  <style>
    ${BASE_CSS}
    .landing { max-width: 600px; width: 100%; text-align: center; }
    .badge {
      display: inline-block;
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 0.25rem 0.75rem;
      border-radius: 2px;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: clamp(1.8rem, 5vw, 2.8rem);
      font-weight: 700;
      color: var(--text);
      line-height: 1.2;
      margin-bottom: 1rem;
    }
    h1 span { color: var(--cyan); }
    .subtitle {
      font-size: 0.95rem;
      color: var(--muted);
      line-height: 1.6;
      margin-bottom: 2.5rem;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .search-form {
      display: flex;
      gap: 0;
      max-width: 480px;
      margin: 0 auto 1rem;
    }
    .search-form input {
      flex: 1;
      background: var(--card);
      border: 1px solid var(--border);
      border-right: none;
      color: var(--text);
      font-family: inherit;
      font-size: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 2px 0 0 2px;
      outline: none;
    }
    .search-form input:focus { border-color: var(--cyan); }
    .search-form input::placeholder { color: var(--muted); }
    .search-form button {
      background: var(--cyan);
      border: 1px solid var(--cyan);
      color: var(--bg);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      border-radius: 0 2px 2px 0;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .search-form button:hover { background: #06B6D4; border-color: #06B6D4; }
    .hint { font-size: 0.75rem; color: var(--muted); margin-bottom: 3rem; }
    .how-it-works {
      border-top: 1px dashed var(--border);
      padding-top: 2rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      text-align: left;
    }
    @media (max-width: 500px) {
      .how-it-works { grid-template-columns: 1fr; }
      .search-form { flex-direction: column; }
      .search-form input { border-right: 1px solid var(--border); border-bottom: none; border-radius: 2px 2px 0 0; }
      .search-form button { border-radius: 0 0 2px 2px; text-align: center; }
    }
    .step-num {
      font-size: 1.5rem;
      color: var(--cyan);
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .step-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.4rem;
      letter-spacing: 0.05em;
    }
    .step-desc { font-size: 0.75rem; color: var(--muted); line-height: 1.5; }
    .footer-links {
      margin-top: 3rem;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .footer-links a { color: var(--cyan); }
  </style>
</head>
<body>
  <div class="landing">
    <div class="badge">HTTP 402 · PAY PER CRAWL</div>
    <h1>AI Scraping<br><span>Receipt Generator</span></h1>
    <p class="subtitle">
      Find out how much AI crawlers owe your website in unpaid scraping fees —
      using real indexed page data from Common Crawl.
    </p>

    <form class="search-form" id="receiptForm">
      <input
        type="text"
        id="domainInput"
        placeholder="example.com"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      >
      <button type="submit">Generate Receipt →</button>
    </form>
    <p class="hint">No signup required · Free · Real data</p>

    <div class="how-it-works">
      <div>
        <div class="step-num">01</div>
        <div class="step-title">INDEX LOOKUP</div>
        <div class="step-desc">We query Common Crawl's CDX index to count how many pages of your site have been crawled.</div>
      </div>
      <div>
        <div class="step-num">02</div>
        <div class="step-title">CALCULATE DEBT</div>
        <div class="step-desc">15 AI crawlers × 12 crawls/year × $0.01/page. Every page, every bot, every month.</div>
      </div>
      <div>
        <div class="step-num">03</div>
        <div class="step-title">SHARE RECEIPT</div>
        <div class="step-desc">Download a PNG receipt or share directly to X and LinkedIn with a pre-filled post.</div>
      </div>
    </div>

    <div class="footer-links">
      Protect your site with <a href="https://github.com/Josusanz/pay-per-crawl-worker" target="_blank" rel="noopener">pay-per-crawl-worker</a> →
      · <a href="https://github.com/Josusanz/ai-scraping-receipt" target="_blank" rel="noopener">source code</a>
    </div>
  </div>

  <script>
    document.getElementById('receiptForm').addEventListener('submit', function(e) {
      e.preventDefault();
      let domain = document.getElementById('domainInput').value.trim().toLowerCase();
      if (!domain) return;
      domain = domain.replace(/^https?:\\/\\//, '').replace(/\\/.*$/, '').trim();
      if (domain) {
        window.location.href = '/receipt/' + encodeURIComponent(domain);
      }
    });
  </script>
</body>
</html>`;
}

export function renderReceiptPage(data: ReceiptData): string {
  const { domain, pages, lines, total, source } = data;
  const year = new Date().getFullYear();
  const totalFormatted = money(total);
  const pagesFormatted = formatNum(pages);

  const crawlerRows = lines.map(line => `
    <div class="crawler-row">
      <span class="crawler-name">${line.name} <span class="crawler-company">(${line.company})</span></span>
      <span class="crawler-price">${money(line.subtotal)}</span>
    </div>
    <div class="crawler-detail">${pagesFormatted} pages × ${line.crawls} crawls/yr</div>`
  ).join('');

  const shareUrl = `https://crawlerreceipt.com/receipt/${encodeURIComponent(domain)}`;
  const shareText = `AI crawlers owe ${domain} ${totalFormatted} in unpaid scraping fees.\n\nSee yours → ${shareUrl}\n\nDeploy HTTP 402 in 5 min: github.com/Josusanz/pay-per-crawl-worker`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const sourceNote = source === 'estimate'
    ? '* Estimated (Common Crawl unavailable)'
    : `* Source: Common Crawl CDX Index ${year}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Scraping Receipt — ${domain}</title>
  <meta name="description" content="AI crawlers owe ${domain} an estimated ${totalFormatted}/year in unpaid scraping fees.">
  <meta property="og:title" content="AI Scraping Receipt — ${domain}">
  <meta property="og:description" content="AI crawlers owe ${domain} an estimated ${totalFormatted}/year in unpaid scraping fees.">
  <meta property="og:url" content="${shareUrl}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="AI Scraping Receipt — ${domain}">
  <meta name="twitter:description" content="AI crawlers owe ${domain} an estimated ${totalFormatted}/year in unpaid scraping fees.">
  <style>
    ${BASE_CSS}
    .page { width: 100%; max-width: 560px; }
    .back-link {
      font-size: 0.8rem;
      color: var(--muted);
      display: block;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .back-link:hover { color: var(--cyan); text-decoration: none; }
    #receipt-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1.75rem;
      width: 100%;
    }
    .receipt-header {
      text-align: center;
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px dashed var(--border);
    }
    .receipt-warning {
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      color: var(--red);
      margin-bottom: 0.75rem;
    }
    .receipt-domain {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--cyan);
      margin-bottom: 0.4rem;
      word-break: break-all;
    }
    .receipt-meta {
      font-size: 0.72rem;
      color: var(--muted);
      letter-spacing: 0.06em;
    }
    .crawler-section {
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px dashed var(--border);
    }
    .crawler-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.1rem;
    }
    .crawler-name {
      font-size: 0.85rem;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .crawler-company {
      color: var(--muted);
      font-size: 0.78rem;
    }
    .crawler-price {
      font-size: 0.85rem;
      color: var(--text);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .crawler-detail {
      font-size: 0.72rem;
      color: var(--muted);
      padding-left: 1rem;
      margin-bottom: 0.65rem;
    }
    .totals-section {
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px dashed var(--border);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 0.35rem;
    }
    .total-row.subtotal { color: var(--text); }
    .total-row.payment { color: var(--muted); }
    .outstanding-section {
      background: rgba(248, 113, 113, 0.06);
      border: 1px solid rgba(248, 113, 113, 0.25);
      border-radius: 2px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      text-align: center;
    }
    .outstanding-label {
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      color: var(--red);
      margin-bottom: 0.5rem;
    }
    .outstanding-amount {
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--yellow);
      line-height: 1;
    }
    .outstanding-period {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 0.4rem;
    }
    .receipt-footer {
      font-size: 0.72rem;
      color: var(--muted);
      line-height: 1.6;
    }
    .receipt-footer .method { color: var(--cyan); }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
      justify-content: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      cursor: pointer;
      border-radius: 2px;
      text-decoration: none;
      transition: all 0.15s;
      border: 1px solid;
    }
    .btn-download {
      background: transparent;
      border-color: var(--cyan);
      color: var(--cyan);
    }
    .btn-download:hover { background: rgba(34,211,238,0.1); }
    .btn-tweet {
      background: transparent;
      border-color: #e2e8f0;
      color: #e2e8f0;
    }
    .btn-tweet:hover { background: rgba(226,232,240,0.08); }
    .btn-linkedin {
      background: transparent;
      border-color: #60A5FA;
      color: #60A5FA;
    }
    .btn-linkedin:hover { background: rgba(96,165,250,0.08); }
    .cta {
      margin-top: 1.25rem;
      font-size: 0.78rem;
      color: var(--muted);
      text-align: center;
    }
    .source-note {
      font-size: 0.68rem;
      color: var(--muted);
      text-align: center;
      margin-top: 0.75rem;
      opacity: 0.6;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .page { animation: fadeIn 0.4s ease; }
    @media (max-width: 400px) {
      #receipt-card { padding: 1.25rem; }
      .outstanding-amount { font-size: 1.8rem; }
      .actions { flex-direction: column; align-items: stretch; }
      .btn { justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="page">
    <a href="/" class="back-link">← Generate another receipt</a>

    <div id="receipt-card">
      <div class="receipt-header">
        <div class="receipt-warning">⚠  AI SCRAPING RECEIPT  ⚠</div>
        <div class="receipt-domain">${domain}</div>
        <div class="receipt-meta">${year} · UNPAID ESTIMATE · ${pagesFormatted} PAGES INDEXED</div>
      </div>

      <div class="crawler-section">
        ${crawlerRows}
      </div>

      <div class="totals-section">
        <div class="total-row subtotal">
          <span>SUBTOTAL (15 crawlers)</span>
          <span>${totalFormatted}</span>
        </div>
        <div class="total-row payment">
          <span>PAYMENT RECEIVED</span>
          <span>$0.00</span>
        </div>
      </div>

      <div class="outstanding-section">
        <div class="outstanding-label">OUTSTANDING BALANCE</div>
        <div class="outstanding-amount">${totalFormatted}</div>
        <div class="outstanding-period">per year · unpaid</div>
      </div>

      <div class="receipt-footer">
        <div>Method: <span class="method">HTTP 402 Payment Required</span></div>
        <div>Protect your site: <a href="https://github.com/Josusanz/pay-per-crawl-worker" target="_blank" rel="noopener">github.com/Josusanz/pay-per-crawl-worker</a></div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-download" id="downloadBtn" onclick="downloadReceipt()">
        ↓ Download PNG
      </button>
      <a class="btn btn-tweet" href="${tweetUrl}" target="_blank" rel="noopener">
        𝕏 Share on X
      </a>
      <a class="btn btn-linkedin" href="${linkedinUrl}" target="_blank" rel="noopener">
        in Share
      </a>
    </div>

    <div class="cta">
      Protect your site with HTTP 402 →
      <a href="https://github.com/Josusanz/pay-per-crawl-worker" target="_blank" rel="noopener">pay-per-crawl-worker</a>
    </div>

    <div class="source-note">
      ${sourceNote} ·
      <a href="https://github.com/Josusanz/ai-scraping-receipt" target="_blank" rel="noopener" style="color:inherit;opacity:0.7">source code</a>
    </div>
  </div>

  <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
  <script>
    async function downloadReceipt() {
      const btn = document.getElementById('downloadBtn');
      const card = document.getElementById('receipt-card');
      btn.textContent = '...capturing';
      btn.disabled = true;

      try {
        const canvas = await html2canvas(card, {
          backgroundColor: '#0D1B35',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const link = document.createElement('a');
        link.download = 'receipt-${domain}.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch(e) {
        alert('Could not capture screenshot. Try right-clicking and "Save as image".');
      } finally {
        btn.textContent = '↓ Download PNG';
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
