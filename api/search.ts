export const config = {
  runtime: 'edge',
};

interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { query, scrapeUrl } = await req.json();

    // MODE 1: Scrape Reference Web Page / App URL
    if (scrapeUrl) {
      try {
        const targetUrl = scrapeUrl.startsWith('http') ? scrapeUrl : `https://${scrapeUrl}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          return new Response(
            JSON.stringify({ 
              title: targetUrl, 
              description: `HTTP ${res.status}: No se pudo leer la página de referencia.`, 
              content: '', 
              url: targetUrl 
            }), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const html = await res.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : targetUrl;

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract clean text content (strip script, style, comments, tags)
        const cleanContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3500);

        return new Response(
          JSON.stringify({
            title,
            description,
            content: cleanContent,
            url: targetUrl,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (scrapeErr: any) {
        return new Response(
          JSON.stringify({
            title: scrapeUrl,
            description: `Error al acceder a ${scrapeUrl}: ${scrapeErr.message}`,
            content: '',
            url: scrapeUrl,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // MODE 2: Web Search for Libraries, Docs, APIs, and Tech Solutions
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400 });
    }

    const searchQuery = query.trim();
    const results: SearchResultItem[] = [];

    // Attempt 1: DuckDuckGo Instant Answer API
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`,
        { headers: { 'User-Agent': 'NONA-AI-Software-Factory' } }
      );
      if (ddgRes.ok) {
        const data = await ddgRes.json();
        if (data.Heading && data.AbstractText) {
          results.push({
            title: data.Heading,
            url: data.AbstractURL || 'https://duckduckgo.com',
            snippet: data.AbstractText,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0] || searchQuery,
                url: topic.FirstURL,
                snippet: topic.Text,
              });
            }
          });
        }
      }
    } catch {}

    // Attempt 2: DuckDuckGo HTML Scraping fallback for richer search snippets
    if (results.length < 3) {
      try {
        const htmlRes = await fetch(
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          }
        );
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          // Regex to parse DuckDuckGo search result links and snippets
          const resultRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = resultRegex.exec(html)) !== null && results.length < 5) {
            const rawUrl = match[1];
            const rawSnippet = match[2].replace(/<[^>]+>/g, '').trim();
            // DuckDuckGo redirects through /l/?kh=-1&uddg=...
            const parsedUrlMatch = rawUrl.match(/uddg=([^&]+)/);
            const finalUrl = parsedUrlMatch ? decodeURIComponent(parsedUrlMatch[1]) : rawUrl;

            if (finalUrl.startsWith('http') && rawSnippet) {
              results.push({
                title: searchQuery,
                url: finalUrl,
                snippet: rawSnippet,
              });
            }
          }
        }
      } catch {}
    }

    return new Response(
      JSON.stringify({
        query: searchQuery,
        results: results.slice(0, 5),
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
