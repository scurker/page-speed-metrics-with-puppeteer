const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  await page.goto('https://example.com');

  const metrics = [];
  const runs = 10;
  const useCache = false;

  await page.setCacheEnabled(useCache);

  for(let i = 0; i < runs; i++) {
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

  await browser.close();
})();