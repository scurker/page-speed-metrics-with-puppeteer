const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  await page.goto('https://example.com');

  const metrics = [];
  const runs = 10;
  const networkSpeed = NETWORK_SPEED.SLOW_3G;
  const useCache = false;
  const useServiceWorker = false;

  await throttleNetwork(networkSpeed);

  await page.setCacheEnabled(useCache);

  for(let i = 0; i < runs; i++) {
    await disableServiceWorker(true);

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

  async function throttleNetwork(option) {
    if(option !== NETWORK_SPEED.DISABLED) {
      console.log(`Using Network Profile [${option.toString()}]\n`);
      return client.send('Network.emulateNetworkConditions', NetworkOptions.get(option));
    }
  };

  async function disableServiceWorker(disable) {
    if(disable) {
      await client.send('ServiceWorker.enable');
      await client.send('ServiceWorker.unregister', { scopeURL: new URL(page.url()).origin });
    }
  }
})();

const NETWORK_SPEED = {
  DISABLED: 'off',
  SLOW_3G: 'Slow 3G',
  REGULAR_3G: 'Regular 3G',
  FAST_3G: 'Fast 3G',
  SLOW_4G: 'Slow 4G',
  REGULAR_4G: 'Regular 4G',
  FAST_4G: 'Fast 4G',
  WIFI: 'Wifi'
};

const NetworkOptions = new Map([
  [NETWORK_SPEED.SLOW_3G, {
    offline: false,
    downloadThroughput: 400 * 1024 / 8, // 400 kb/s
    uploadThroughput: 400 * 1024 / 8, // 400 kb/s
    latency: 400
  }],
  [NETWORK_SPEED.REGULAR_3G, {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 mb/s
    uploadThroughput: 768 * 1024 / 8, // 400 kb/s
    latency: 300
  }],
  [NETWORK_SPEED.FAST_3G, {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 mb/s
    uploadThroughput: 768 * 1024 / 8, // 400 kb/s
    latency: 150
  }],
  [NETWORK_SPEED.SLOW_4G, {
    offline: false,
    downloadThroughput: 3 * 1024 * 1024 / 8, // 3 mb/s
    uploadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 mb/s
    latency: 200
  }],
  [NETWORK_SPEED.REGULAR_4G, {
    offline: false,
    downloadThroughput: 9 * 1024 * 1024 / 8, // 9 mb/s
    uploadThroughput: 9 * 1024 * 1024 / 8, // 9 mb/s
    latency: 170
  }],
  [NETWORK_SPEED.FAST_4G, {
    offline: false,
    downloadThroughput: 12 * 1024 * 1024 / 8, // 12 mb/s
    uploadThroughput: 12 * 1024 * 1024 / 8, // 12 mb/s
    latency: 70
  }],
  [NETWORK_SPEED.Wifi, {
    offline: false,
    downloadThroughput: 30 * 1024 * 1024 / 8, // 30 mb/s
    uploadThroughput: 5 * 1024 * 1024 / 8, // 5 mb/s
    latency: 2
  }]
]);