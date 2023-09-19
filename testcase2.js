// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');
const VIEWPORT  = {width: 1200, height: 900};

// add stealth plugin and use defaults (all evasion techniques);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
//stealth.enabledEvasions.delete('chrome.runtime');
//stealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(StealthPlugin());



puppeteer.launch(
    {   headless: "new",
        args: [
            "--disable-infobars",
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
        ignoreDefaultArgs: [
            "--enable-automation"
    ]}).then(async browser => {

        const page   = await browser.newPage();
        const client = await page.target().createCDPSession();       
        await client.send('Network.clearBrowserCookies');

        await page.viewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36');
        await page.goto("https://en.wikipedia.org/wiki/Web_scraping");
            
        headings = await page.evaluate(() => {
            headings_elements = document.querySelectorAll("h2 .mw-headline");
            headings_array = Array.from(headings_elements);
            return headings_array.map(heading => heading.textContent);
        });
        console.log(headings);
        await browser.close();
});