/** Abre cada app generada en Chromium (con internet) y guarda captura de escritorio y móvil + errores. */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const { VirtualMultiFileBundler } = await import('../../src/core/sandbox/VirtualMultiFileBundler.ts');

const root = path.resolve('eval-out');
const browser = await chromium.launch();
for (const mode of fs.readdirSync(root)) {
  for (const id of fs.readdirSync(path.join(root, mode)).sort()) {
    const dir = path.join(root, mode, id);
    const appDir = path.join(dir, 'app');
    if (!fs.existsSync(appDir)) continue;
    const files: Record<string, string> = {};
    const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files[path.relative(appDir, p)] = fs.readFileSync(p, 'utf8'); } };
    walk(appDir);
    let html = '';
    try { html = VirtualMultiFileBundler.bundle(files).srcDoc.replace('<head>', '<head><base href="https://interfaz-hazel.vercel.app/">'); } catch (e: any) { fs.writeFileSync(path.join(dir, 'errors.json'), JSON.stringify(['bundle: ' + e.message])); continue; }
    const errors: string[] = [];
    for (const [name, vp] of [['desktop', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]] as const) {
      const page = await browser.newPage({ viewport: vp });
      page.on('pageerror', e => errors.push(e.message.slice(0, 300)));
      page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(0, 200)}`); });
      page.on('requestfailed', r => errors.push(`FALLO ${r.failure()?.errorText} ${r.url().slice(0, 200)}`));
      // Origen http real (con setContent la página queda en about:blank y localStorage está bloqueado)
      await page.route('https://interfaz-hazel.vercel.app/__eval__', route => route.fulfill({ contentType: 'text/html', body: html }));
      page.on('console', m => { if (m.type() === 'error' && !/favicon|DevTools/.test(m.text())) errors.push(m.text().slice(0, 300)); });
      await page.goto('https://interfaz-hazel.vercel.app/__eval__', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await page.waitForTimeout(3000);
      if (name === 'desktop') {
        const html2 = await page.content();
        if (/Error al Cargar|Error de Ejecución/.test(html2)) errors.push('PANTALLA DE ERROR: ' + (await page.evaluate(() => document.body.innerText.slice(0, 300))));
      }
      await page.evaluate(() => document.getElementById('nona-badge')?.remove()).catch(() => {});
      await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 70 });
      if (name === 'desktop') {
        const stats = await page.evaluate(() => ({
          text: (document.getElementById('root')?.innerText || '').length,
          buttons: document.querySelectorAll('button, a').length,
          inputs: document.querySelectorAll('input, select, textarea').length,
          images: document.images.length,
          fonts: [...document.querySelectorAll('link[rel=stylesheet]')].filter((l: any) => /fonts\.googleapis/.test(l.href)).length,
        })).catch(() => ({}));
        fs.writeFileSync(path.join(dir, 'stats.json'), JSON.stringify(stats));
      }
      await page.close();
    }
    fs.writeFileSync(path.join(dir, 'errors.json'), JSON.stringify([...new Set(errors)].slice(0, 10), null, 1));
    console.log(mode, id, errors.length ? `${errors.length} errores` : 'ok');
  }
}
await browser.close();
