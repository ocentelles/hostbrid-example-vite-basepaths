/* Un Chrome de verdad, conducido por CDP. Nada de leer el HTML: lo que se
   comprueba es lo que queda pintado después de que corra el guion. */
import { spawn } from 'node:child_process';

const CHROME = process.env.HOSTBRID_CHROME_PATH || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);

export async function abrirChrome(puerto, perfil) {
  const p = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${puerto}`, '--disable-gpu',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/json/version`);
      if (r.ok) return { proc: p, puerto };
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Chrome no levantó');
}

export async function nuevaPestana(puerto, ancho, alto) {
  const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(lista.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pend = new Map();
  const sucesos = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method) sucesos.push(m);
  };
  const enviar = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await enviar('Page.enable');
  await enviar('Runtime.enable');
  await enviar('Emulation.setDeviceMetricsOverride', {
    width: ancho, height: alto, deviceScaleFactor: 2, mobile: ancho < 500,
  });

  const api = {
    sucesos,
    viewport: Object.freeze({width: ancho, height: alto, dpr: 2}),
    async cdp(method, params = {}) {
      const response = await enviar(method, params);
      if (response.error) throw new Error(JSON.stringify(response.error));
      return response.result;
    },
    cerrar: () => { ws.close(); return fetch(`http://127.0.0.1:${puerto}/json/close/${lista.id}`); },
    async ir(url) {
      const r = await enviar('Page.navigate', { url });
      if (r.result && r.result.errorText) throw new Error(`no cargó ${url}: ${r.result.errorText}`);
      await new Promise((res) => setTimeout(res, 300));
    },
    async evaluar(expr) {
      const r = await enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails)
        throw new Error('JS reventó: ' + JSON.stringify(r.result.exceptionDetails.exception));
      return r.result.result.value;
    },
    async esperar(expr, quees, ms = 12000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (await api.evaluar(expr)) return true;
        await new Promise((r) => setTimeout(r, 120));
      }
      throw new Error(`se agotó la espera de: ${quees}`);
    },
    async fotoRecorte(ruta, caja) {
      const r = await enviar('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { ...caja, scale: 2 },
      });
      const { writeFile } = await import('node:fs/promises');
      await writeFile(ruta, Buffer.from(r.result.data, 'base64'));
    },
    async foto(ruta) {
      const r = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      const { writeFile } = await import('node:fs/promises');
      await writeFile(ruta, Buffer.from(r.result.data, 'base64'));
    },
  };
  return api;
}
