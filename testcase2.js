// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: "new" }).then(async browser => {
  const page = await browser.newPage();
  await page.goto("https://en.wikipedia.org/wiki/Web_scraping");
 
  headings = await page.evaluate(() => {
    headings_elements = document.querySelectorAll(".mw-headline");
    headings_array = Array.from(headings_elements);
    return headings_array.map(heading => heading.textContent);
  });
  console.log(headings);
  await browser.close();
});