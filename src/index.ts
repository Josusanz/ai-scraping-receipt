import { renderLanding, renderReceiptPage, ReceiptData, CrawlerLine } from './receipt';
import { KNOWN_AI_CRAWLERS } from './crawlers';

const CRAWLS_PER_YEAR = 12;
const PRICE_PER_PAGE = 0.01;
const MIN_PAGES = 50;
const MAX_PAGES = 500_000;

// Recent Common Crawl indexes to query in parallel (most recent first)
const CC_INDEXES = [
  'CC-MAIN-2025-05',
  'CC-MAIN-2024-51',
  'CC-MAIN-2024-46',
  'CC-MAIN-2024-42',
];

// Deterministic domain-based fallback estimate (100–10,000 pages)
function estimatePages(domain: string): number {
  let h = 5381;
  for (let i = 0; i < domain.length; i++) {
    h = (((h << 5) + h) ^ domain.charCodeAt(i)) >>> 0;
  }
  return (h % 9901) + 100;
}

// Query a single CC index and return block count (0 on any failure)
async function queryIndex(index: string, domain: string, signal: AbortSignal): Promise<number> {
  try {
    const url =
      `https://index.commoncrawl.org/${index}-index` +
      `?url=*.${encodeURIComponent(domain)}&showNumPages=true`;
    const res = await fetch(url, { signal });
    if (!res.ok) return 0;
    const text = (await res.text()).trim();
    // Response: {"pages": P, "pageSize": 5, "blocks": B}
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return typeof parsed.blocks === 'number' ? parsed.blocks : 0;
  } catch (_) {
    return 0;
  }
}

async function fetchPageCount(domain: string): Promise<{ pages: number; source: 'commoncrawl' | 'estimate' }> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);

  try {
    // Query all indexes in parallel; take the highest block count found
    const results = await Promise.all(
      CC_INDEXES.map(idx => queryIndex(idx, domain, controller.signal))
    );
    clearTimeout(tid);

    // Each block ≈ 1,300 actual CDX records (calibrated on real data)
    const maxBlocks = Math.max(...results);
    if (maxBlocks > 0) {
      const count = Math.min(Math.max(maxBlocks * 1300, MIN_PAGES), MAX_PAGES);
      return { pages: count, source: 'commoncrawl' };
    }

    // No results across any index — domain likely blocks Common Crawl
    return { pages: estimatePages(domain), source: 'estimate' };
  } catch (_) {
    clearTimeout(tid);
    return { pages: estimatePages(domain), source: 'estimate' };
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
