export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ScrapedWebPage {
  title: string;
  description: string;
  content: string;
  url: string;
}

export class WebSearchService {
  private endpoint = '/api/search';

  /**
   * Performs real-time web search for libraries, documentation, patterns and APIs.
   */
  public async searchWeb(query: string): Promise<WebSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) return [];

      const data = await res.json();
      return Array.isArray(data.results) ? data.results : [];
    } catch (err) {
      console.warn('Web search failed:', err);
      return [];
    }
  }

  /**
   * Scrapes reference URLs or competitor web apps provided by the user.
   */
  public async scrapeReferenceUrl(url: string): Promise<ScrapedWebPage | null> {
    if (!url || !url.trim().startsWith('http')) return null;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapeUrl: url.trim() }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      return {
        title: data.title || url,
        description: data.description || '',
        content: data.content || '',
        url: data.url || url,
      };
    } catch (err) {
      console.warn('Scrape URL failed:', err);
      return null;
    }
  }

  /**
   * Formats search results into a clean context block for agents.
   */
  public formatSearchResultsForPrompt(results: WebSearchResult[]): string {
    if (!results || results.length === 0) return '';

    return `\n--- 🌐 RESULTADOS DE BÚSQUEDA WEB EN VIVO ---\n` +
      results.map((r, i) => `[Fuente ${i + 1}]: ${r.title}\nURL: ${r.url}\nResumen: ${r.snippet}`).join('\n\n') +
      `\n--------------------------------------------\n`;
  }

  /**
   * Formats scraped reference web pages into prompt context.
   */
  public formatScrapedPageForPrompt(page: ScrapedWebPage): string {
    if (!page) return '';

    return `\n--- 🌐 APLICACIÓN / PÁGINA WEB DE REFERENCIA DEL USUARIO ---\n` +
      `Título: ${page.title}\n` +
      `URL: ${page.url}\n` +
      (page.description ? `Descripción: ${page.description}\n` : '') +
      `Contenido Extraído:\n${page.content.slice(0, 2500)}\n` +
      `-------------------------------------------------------------\n`;
  }
}

export const webSearchService = new WebSearchService();
