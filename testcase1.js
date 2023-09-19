const pt = require('puppeteer');
pt.launch({headless:"new"}).then(async browser => {
   //browser new page
   const p = await browser.newPage();
   //set viewpoint of browser page
   await p.setViewport({ width: 1000, height: 500 })
   //launch URL
   await p.goto('https://www.tutorialspoint.com/index.htm')
   //capture screenshot
   await p.screenshot({
      path: 'tutorialspoint.png'
   });
   //browser close
   await browser.close()
})