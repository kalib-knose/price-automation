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

async function typeInput(page, selector, value) {
  await page.waitForSelector(selector);
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value);
}

async function clickElement(page, selector) {
  await page.waitForSelector(selector);
  await page.click(selector);
}

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
    });

    const context = await browser.createIncognitoBrowserContext({
      ignoreHTTPSErrors: true,
      
    });
    const page = await context.newPage();
   // const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);
    await page.authenticate({
      username: "quotetool",
      password: "U9GnXsdV438rHWND",
    });

    await page.goto("https://quick-quote-staging.knose.com.au/details");




    await page.waitForTimeout(10000);

    let dataInput = {};

    for (let breed of breeds) {
      console.log("Processing breed:", breed.filterGroup);
  
      // Pet name
      const pet_name = generateRandomString(10);
      await typeInput(page, 'input[name="pet_name"]', pet_name);
      dataInput.name = pet_name;
  
      // Pet type
      const pet_type = breed.filterGroup === "Dog" ? ".pet-dog" : ".pet-cat";
      await clickElement(page, pet_type);
      dataInput.type = pet_type;
  
      // Pet gender
      const pet_gender = [".pet-male", ".pet-female"].sort(() => Math.random() - 0.5)[0];
      await clickElement(page, pet_gender);
      dataInput.gender = pet_gender === '.pet-male' ? "Male" : "Female";
  
      // Breed selection
      await clickElement(page, '.css-1pcexqc-container.auto-suggest-breed');
      await page.type('.css-1hwfws3', breed.displayName);
      await page.waitForTimeout(3000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      dataInput.breed = await page.evaluate(() => document.querySelector('.css-1pcexqc-container.auto-suggest-breed').value);
  
      // Pet DOB
      await typeInput(page, 'input[name="pet_birth_date"]', "01/01/2022");
      dataInput.birthDate = "01/01/2022";
  
      // Email
      const owner_email = generateRandomString(10) + "@gmail.com";
      await typeInput(page, 'input[name="owner_email"]', owner_email);
      dataInput.email = owner_email;
      await page.waitForTimeout(2000);
  
      // Suburb
      await typeInput(page, 'input[name="suburb"]', "3000");
      await page.waitForTimeout(2000);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
  
      // Proceed
      await clickElement(page, ".btn.btn-primary");
  
      // Fetch suburb value
      dataInput.suburb = await page.evaluate(() => document.querySelector("#suburb").value);
  
      // Wait for further navigation
      await page.waitForTimeout(5000);
  
      // Extract and log pricing information
      await page.waitForSelector(".big-money");
      dataInput.total = await page.evaluate(() => document.querySelector(".big-money").textContent);
      logToJSON(owner_email, dataInput);
  
      // Navigate back
      await clickElement(page, ".btn-back");
  }
    //await browser.close()
    saveLogToJSONFile();

   const jsonData = fs.readFileSync('log.json', 'utf8')
    const data = JSON.parse(jsonData)
    let rows = [];

// Header
rows.push(["ID", "Name", "Type", "Gender", "Birth Date", "Email", "Suburb", "Total"]);

// Extract entries
for (let entry of data.entries) {
    for (let key in entry) {
        rows.push([
            key,
            entry[key].name,
            entry[key].type,
            entry[key].gender,
            entry[key].birthDate,
            entry[key].email,
            entry[key].suburb,
            entry[key].total
        ]);
    }
}

       const response = await fetch('https://eoi4m9a8tqx7b0j.m.pipedream.net', {
      method: 'POST',
      body: JSON.stringify(rows),
      headers: { 'Content-Type': 'application/json' },
    })

    console.log(response)


  } catch (e) {
    console.log(e);
  } finally {
    if (browser) {
      // await browser.close()
    }
  }
}

run();
