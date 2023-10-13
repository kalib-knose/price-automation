const puppeteer = require("puppeteer-extra");
const fs = require('fs')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const breeds = require("./breed");

let logData = {
  entries: [],
};

const logToFile = (message) => {
  const formattedMessage = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync("logs.txt", formattedMessage);
};

function logToJSON(key, value) {
  const entry = {};
  entry[key] = value;
  logData.entries.push(entry);
}

function saveLogToJSONFile() {
  fs.writeFileSync("log.json", JSON.stringify(logData, null, 2));
}

const generateRandomString = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

async function run() {
  let browser;
  try {
    browser = await puppeteer.launch( { 
    executablePath: executablePath(),
      headless: false,
      devtools: true,
    //args: ["--proxy-server=brd.superproxy.io:9222"],
    });

    const context = await browser.createIncognitoBrowserContext();

    //const page = await browser.newPage();
    const page = await context.newPage();
    //await page.setUserAgent(
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36"
    // );
    // await page.authenticate({
    //   username: "brd-customer-hl_c03d3b67-zone-scraping_browser",
    //   password: "ltoke16615rk",
    // });
    page.setDefaultNavigationTimeout(0);
    await page.authenticate({
      username: "quotetool",
      password: "U9GnXsdV438rHWND",
    });

    await page.goto("https://quick-quote-staging.knose.com.au/details");
    let dataInput = {};
    for (let i = 0; i < 5; i++) {
      let breed = breeds[i];
      console.log("breed", breed.filterGroup);
      await page.waitForSelector('input[name="pet_name"]');

      // pet name
      const pet_name = generateRandomString(10);
      await page.click('input[name="pet_name"]', { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type('input[name="pet_name"]', pet_name);
      dataInput.name = pet_name;

      console.log("\n");

      //     // pet type
      const pet_type = breed.filterGroup === "Dog" ? ".pet-dog" : ".pet-cat";

      console.log("clicking... pet type", pet_type);
      await page.waitForSelector(pet_type);
      await page.click(pet_type);
      console.log("pet type done...");
      dataInput.type = pet_type;

      console.log("\n");

      //     // pet gender
      const pet_gender = [".pet-male", ".pet-female"].sort(
        () => Math.random() - 0.5
      )[0];
      console.log("clicking... pet gender", pet_gender);
      await page.waitForSelector(pet_gender);
      await page.click(pet_gender);
      console.log("pet gender done...");
      dataInput.gender = pet_gender;

      //     console.log('\n')

      // pet breed
      await page.waitForTimeout(3000);
      // const breed = pet_type === '.pet-dog' ? 'Persian Greyhound' : 'Colorpoint Persian'
      //const breed = pet_type === '.pet-dog' ? generateRandomBreed('Dog').displayName : generateRandomBreed('Cat').displayName
      const breedName = breed.displayName;

      await page.waitForSelector('.css-1pcexqc-container.auto-suggest-breed');
      await page.click('.css-1pcexqc-container.auto-suggest-breed');
      await page.type('#react-select-2-input', breedName);
      await page.waitForTimeout(3000);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(3000);
      await page.keyboard.press('Enter');
      console.log("\n");

      //     // pet dob
      const pet_birth_date = "01/01/2022";
      await page.click('input[name="pet_birth_date"]', { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type('input[name="pet_birth_date"]', pet_birth_date);
      dataInput.birthDate = pet_birth_date;
      // email
      const owner_email = generateRandomString(10) + "@gmail.com";
      await page.click('input[name="owner_email"]', { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type('input[name="owner_email"]', owner_email);
      dataInput.email = owner_email;

  
      await page.type('input[name="suburb"]', "3000");
      await page.waitForTimeout(3000);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");

      // click btn btn-primary class
      await page.click(".btn.btn-primary");

      // value of suburb
      await page.waitForSelector("#suburb");
      const suburb = await page.evaluate(
        () => document.querySelector("#suburb").value
      );
      dataInput.suburb = suburb;

      // wait for btn-back class
      console.log("looking for btn back");
      console.log(dataInput);
      await page.waitForTimeout(5000);
      await page.waitForSelector(".btn-back");
      console.log("clicking back");
      // wait 1 sec
      await page.waitForTimeout(1000);

      // get the text content of big-money class
      const big_money = await page.evaluate(
        () => document.querySelector(".big-money").textContent
      );
      console.log("======", big_money, "======");
      dataInput.total = big_money;
      logToJSON("data", dataInput);

      // then click
      await page.click(".btn-back");
      console.log("done!");
    }
  } catch (e) {
    console.log(e);
  } finally {
    if (browser) {
      await browser.close()
    }

    /// save log to json file
    saveLogToJSONFile();
    // send log to google sheet 
    // sendLogToGoogleSheet();

     
  }
}

run();
