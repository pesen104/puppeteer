// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer     = require('puppeteer-extra');
const VIEWPORT      = { width: 1200, height: 900 };
const FILE_PATH     = 'lock.txt';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

//stealth.enabledEvasions.delete('chrome.runtime');
//stealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(StealthPlugin());

puppeteer.launch({   
        headless: "new",
        args: [
            "--disable-infobars",
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
        ignoreDefaultArgs: [
            "--enable-automation"
    ]}).then(async browser => {

        var   reloadIntervalInSeconds; // Anzahl der Sekunden, nach denen die Seite neu geladen werden soll
        const page   = await browser.newPage();
        
        const client = await page.target().createCDPSession();       
        await client.send('Network.clearBrowserCookies');

        await page.viewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36');
        await page.goto("https://sports.tipico.de/de/live/default");
   
        var lock    = "0";
        var n       = 0;
        var ergArr  = [];


        while(lock == "0") {

            reloadIntervalInSeconds = getRandomInt(250, 400);
            var mannschaften_raw    = [];
            var mannschaften        = [];
            var spielzeit           = [];
            var tore                = [];
            var quotenHeim          = [];
            var quotenAuswaerts     = [];

            console.log("Durchlauf: "   + n);
            console.log("Pause: "       + reloadIntervalInSeconds);
            
            spielzeit = await page.evaluate(() => {
                spielzeit_elements = document.querySelectorAll(".EventDateTime-styles-live-date");
                spielzeit_tmp_array = Array.from(spielzeit_elements);
                return spielzeit_tmp_array.map(spielzeit => spielzeit.textContent);
            });

            mannschaften_raw = await page.evaluate(() => {
                mannschaften_elements = document.querySelectorAll(".EventTeams-styles-team-title,.EventFirstHalfDetails-styles-event-halftime-details");
                mannschaften_tmp_array = Array.from(mannschaften_elements);
                return mannschaften_tmp_array.map(mannschaften => mannschaften.textContent);
            }); 

            tore = await page.evaluate(() => {
                tore_elements = document.querySelectorAll(".EventScores-styles-large-current-point");
                tore_tmp_array = Array.from(tore_elements);
                return tore_tmp_array.map(tore => tore.textContent);
            });

            quotenHeim = await page.evaluate(() => {
                quoten_elements = document.querySelectorAll(".EventRow-styles-event-row div:nth-child(4) div div button:nth-child(1)");
                quoten_tmp_array = Array.from(quoten_elements, (x) => x);
                return quoten_tmp_array.map(quoten => quoten.textContent);
            });

            quotenAuswaerts = await page.evaluate(() => {
                quoten_elements = document.querySelectorAll(".EventRow-styles-event-row div:nth-child(4) div div button:nth-child(3)");
                quoten_tmp_array = Array.from(quoten_elements, (x) => x);
                return quoten_tmp_array.map(quoten => quoten.textContent);
            });

            for(u=0; u<mannschaften_raw.length; u++) {
                if(mannschaften_raw[u] != "1. Halbzeit") 
                    mannschaften.push(mannschaften_raw[u])
            }

            for(u=0;u<mannschaften.length;u++) {
                //console.log(mannschaften[u]);
            }

            console.log("\n\n");
            
            i   = 0;
            erg = "";  
            while(i < quotenHeim.length) {
            
                console.log(spielzeit[i] + " " + mannschaften[(i*2)] + " " + tore[(i*2)] + " " + tore[(i*2)+1] + " " + mannschaften[(i*2)+1] + ": " + quotenHeim[i] + " - " + quotenAuswaerts[i] + "");
                
                if(tore[(i*2)] - tore[(i*2)+1] == 2 && quotenHeim[i].length > 2 && !ergArr.includes(mannschaften[(i*2)])) {
                    mannschaftHeim_Arr      = mannschaften[(i*2)].split(" ");
                    mannschaftAuswaerts_Arr = mannschaften[(i*2)+1].split(" ");
                    erg = erg + spielzeit[i] + "+" + quotenHeim[i] + "+" + mannschaftHeim_Arr[0] + "+" + mannschaftAuswaerts_Arr[0] + "+%0A+" ;
                    ergArr.push(mannschaften[(i*2)]);
                }
                    
                i++;
            }

            if(erg != "") {
                fetch( 'https://api.callmebot.com/whatsapp.php?phone=491703430007&text="' + erg + '"&apikey=8786161' )
                    .then( response => {
                        console.log("Whatsapp Send");
                });
            }

            console.log("\n\n");
            await page.waitForTimeout(reloadIntervalInSeconds * 1000);            

            lock = await readAsync(FILE_PATH, 1, 'utf8');
            console.log("Filecontent: " + lock);

            n++;
        }
        await browser.close();
    
});

async function readAsync(inputFilePath, lines, encoding='utf8') {

    try {
        const fs = require('fs');

        // stat will throw a catched error if file does not exist.
        const stat = await fs.promises.stat(inputFilePath);

        // Open file for reading.
        const file = await fs.promises.open(inputFilePath, 'r');
 
        const bufferSize = Math.min(16384, stat.size);
        const readBuffer = Buffer.alloc(bufferSize);
        let readBufferRemaining = 0;
        let allBytes = [];
        let lineCount = 0;
        let fileOffset = stat.size;
 
        while (lineCount < lines && fileOffset > 0) {

            // Read the next chunk of the file
            const readSize = Math.min(readBuffer.length, fileOffset);
            fileOffset -= readSize;
            // https://nodejs.org/docs/latest-v14.x/api/fs.html#fs_filehandle_read_options
            const readResult = await file.read(readBuffer, 0, readSize, fileOffset);
            // If there's still data in our read buffer, then finish processing that
            readBufferRemaining = readResult.bytesRead;
            while(readBufferRemaining > 0) {
                const bufferIndex = readBufferRemaining - 1;
                if(readBuffer[bufferIndex] === 0x0a && allBytes.length) {
                    ++lineCount;					
                    if(lineCount >= lines) {
                        break;
                    }
                }

                allBytes.push(readBuffer[readBufferRemaining - 1]);
                --readBufferRemaining;
            }
        }

        await file.close();

        // Reverse the array
        allBytes.reverse();

        if (encoding === 'buffer') {
            return Buffer.from(allBytes);
        } else {
            // @ts-ignore - encoding as toString() parameter is actually valid.
            return Buffer.from(allBytes).toString(encoding);
        }
    } catch(error) {
        log(`readAsync() error - ${error.stack}`, 'error');
        return '';
    }
}

Array.prototype.remove = function(value) {
    var index = this.indexOf(value);
    if (index !== -1) {
        this.splice(index, 1);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}