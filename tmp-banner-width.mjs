const version = await fetch('http://127.0.0.1:9333/json/version').then((r) => r.json()).catch(() => null);
if (!version) {
  console.log('NO_CHROME');
  process.exit(2);
}
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    const payload = { id: msgId, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
  });
}
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
await new Promise((resolve) => ws.addEventListener('open', resolve));
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);

async function measure(width) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 750,
  }, sessionId);
  await send('Page.navigate', { url: 'http://127.0.0.1:9292/' }, sessionId);
  await new Promise((r) => setTimeout(r, 3500));
  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const image = document.querySelector('.lame-trust-banner--bleed .lame-trust-banner__image');
      if (!image) return JSON.stringify({ missing: true });
      const box = image.getBoundingClientRect();
      return JSON.stringify({
        viewport: window.innerWidth,
        left: Math.round(box.left),
        width: Math.round(box.width),
        rightGap: Math.round(window.innerWidth - box.right)
      });
    })()`,
    returnByValue: true,
  }, sessionId);
  return JSON.stringify(result);
}

console.log('MOBILE', await measure(390));
console.log('DESKTOP', await measure(1440));
ws.close();
process.exit(0);
