const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  await page.goto('https://example.com');

  const metrics = [];
  const runs = 10;
  const useServiceWorker = false;

  for(let i = 0; i < runs; i++) {
    await disableServiceWorker(!useServiceWorker);

    await page.reload({ waitUntil: 'networkidle0' });

    let navigationMetrics = JSON.parse(await page.evaluate(() => JSON.stringify(performance.getEntriesByType('navigation'))));
    let firstContentfulPaint = JSON.parse(await page.evaluate(() => JSON.stringify(performance.getEntriesByName('first-contentful-paint'))));

    metrics.push({
      responseEnd: navigationMetrics[0].responseEnd,
      loaded: navigationMetrics[0].domContentLoadedEventEnd,
      complete: navigationMetrics[0].domComplete,
      firstContentfulPaint: firstContentfulPaint[0].startTime
    });
  }

  console.log(metrics);

  browser.close();

  async function disableServiceWorker(disable) {
    if(disable) {
      await client.send('ServiceWorker.enable');
      await client.send('ServiceWorker.unregister', { scopeURL: new URL(page.url()).origin });
    }
  }
})();