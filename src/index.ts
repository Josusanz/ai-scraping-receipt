import { renderLanding, renderReceiptPage, ReceiptData, CrawlerLine } from './receipt';
import { KNOWN_AI_CRAWLERS } from './crawlers';

const CRAWLS_PER_YEAR = 12;
const PRICE_PER_PAGE = 0.01;
const MIN_PAGES = 50;
const MAX_PAGES = 500_000;

// Deterministic domain-based fallback estimate (100–10,000 pages)
function estimatePages(domain: string): number {
  let h = 5381;
  for (let i = 0; i < domain.length; i++) {
    h = (((h << 5) + h) ^ domain.charCodeAt(i)) >>> 0;
  }
  return (h % 9901) + 100;
}

async function fetchPageCount(domain: string): Promise<{ pages: number; source: 'commoncrawl' | 'estimate' }> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 3000);

  try {
    const cdxUrl =
      `https://index.commoncrawl.org/CC-MAIN-2024-51-index` +
      `?url=*.${encodeURIComponent(domain)}&output=json&limit=1&showNumPages=true`;

    const res = await fetch(cdxUrl, { signal: controller.signal });
    clearTimeout(tid);

    if (!res.ok) {
      return { pages: Math.max(estimatePages(domain), MIN_PAGES), source: 'estimate' };
    }

    const text = (await res.text()).trim();

    // Response may be a JSON object {"pages": N, "pageSize": M}
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (typeof parsed.pages === 'number') {
        const pageSize = typeof parsed.pageSize === 'number' ? parsed.pageSize : 5;
        const count = Math.min(Math.max(parsed.pages * pageSize, MIN_PAGES), MAX_PAGES);
        return { pages: count, source: 'commoncrawl' };
      }
    } catch (_) {
      // not a JSON object
    }

    // Response may be a plain integer (number of CDX pages)
    const n = parseInt(text, 10);
    if (!isNaN(n) && n >= 0) {
      const count = Math.min(Math.max(n * 5, MIN_PAGES), MAX_PAGES);
      return { pages: count, source: 'commoncrawl' };
    }

    return { pages: Math.max(estimatePages(domain), MIN_PAGES), source: 'estimate' };
  } catch (_) {
    clearTimeout(tid);
    return { pages: Math.max(estimatePages(domain), MIN_PAGES), source: 'estimate' };
  }
}

function buildReceiptData(
  domain: string,
  pages: number,
  source: 'commoncrawl' | 'estimate',
): ReceiptData {
  const lines: CrawlerLine[] = KNOWN_AI_CRAWLERS.map(crawler => ({
    name: crawler.name,
    company: crawler.company,
    pages,
    crawls: CRAWLS_PER_YEAR,
    subtotal: pages * CRAWLS_PER_YEAR * PRICE_PER_PAGE,
  }));

  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  return { domain, pages, lines, total, source };
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function sanitizeDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
    .trim();
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /
    if (path === '/' || path === '') {
      return htmlResponse(renderLanding());
    }

    // GET /api/data?domain=example.com
    if (path === '/api/data') {
      const raw = url.searchParams.get('domain') ?? '';
      const domain = sanitizeDomain(raw);
      if (!domain) {
        return jsonResponse({ error: 'domain parameter is required' }, 400);
      }
      const { pages, source } = await fetchPageCount(domain);
      const data = buildReceiptData(domain, pages, source);
      return jsonResponse(data);
    }

    // GET /receipt/:domain
    const receiptMatch = path.match(/^\/receipt\/(.+)$/);
    if (receiptMatch) {
      const raw = decodeURIComponent(receiptMatch[1]);
      const domain = sanitizeDomain(raw);
      if (!domain) {
        return Response.redirect(new URL('/', request.url).toString(), 302);
      }
      const { pages, source } = await fetchPageCount(domain);
      const data = buildReceiptData(domain, pages, source);
      return htmlResponse(renderReceiptPage(data));
    }

    return new Response('Not Found', { status: 404 });
  },
};
