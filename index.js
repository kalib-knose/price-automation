const puppeteer = require("puppeteer-extra");
const fs = require("fs");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
const breeds = require("./breed");

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

const generateRandomString = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// create a function that will generate a random date of birth from 1/1/2022 to 31/12/2022
const generateRandomDate = () => {
  const start = new Date(2022, 0, 1);
  const end = new Date(2022, 11, 31);
  const randomDate = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return randomDate.toLocaleDateString("en-AU");
};

async function run() {
  let browser;
  try {
    let dataInput = {};
    let logData = [];
    browser = await puppeteer.launch({
      executablePath: executablePath(),
      headless: false,
      devtools: true,
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    
    page.setDefaultNavigationTimeout(0);
    await page.authenticate({
      username: "quotetool",
      password: "U9GnXsdV438rHWND",
    });
    await page.goto("https://quick-quote-staging.knose.com.au/details");
    await page.waitForTimeout(10000);


    // for (let breed of breeds) {
    // loop five times for testing
    for (let i = 0; i < 5; i++) {
      const breed = breeds[i];
      console.log(breed);
      console.log("Processing breed:", breed.filterGroup);
  

      // Pet name
      const pet_name = generateRandomString(10);
      await typeInput(page, 'input[name="pet_name"]', pet_name);
      dataInput.name = pet_name;

      // Pet type
      const pet_type = breed.filterGroup === "Dog" ? ".pet-dog" : ".pet-cat";
      await clickElement(page, pet_type);

      // Pet gender
      const pet_gender = [".pet-male", ".pet-female"].sort(
        () => Math.random() - 0.5
      )[0];
      await clickElement(page, pet_gender);

      // Breed selection
      await clickElement(page, ".css-1pcexqc-container.auto-suggest-breed");
      await page.type(".css-1hwfws3", breed.displayName);
      await page.waitForTimeout(3000);
      // await page.keyboard.press('ArrowDown');
      await page.keyboard.press("Enter");

      // Pet DOB
      await typeInput(page, 'input[name="pet_birth_date"]', generateRandomDate());
      const dob = await page.evaluate(() => document.querySelector('input[name="pet_birth_date"]').value);

      // Email
      const owner_email = generateRandomString(10) + "@gmail.com";
      await typeInput(page, 'input[name="owner_email"]', owner_email);
      await page.waitForTimeout(2000);

      //Suburb
      await typeInput(page, 'input[name="suburb"]', "3000");
      await page.waitForTimeout(2000);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");

      //Fetch suburb value
      const suburb = await page.evaluate(
        () => document.querySelector("#suburb").value
      );

      //Proceed
      await clickElement(page, ".btn.btn-primary");

      //Wait for further navigation
      await page.waitForTimeout(5000);

      // Extract and log pricing information
      await page.waitForSelector(".big-money");
      const total = await page.evaluate(
        () => document.querySelector(".big-money").textContent
      );

      logData.push({
        name: pet_name,
        type: breed.filterGroup,
        gender: pet_gender == ".pet-male" ? "Male" : "Female",
        breed: breed.displayName,
        birthDate: dob,
        email: owner_email,
        suburb: suburb,
        total: total,
      });

      // Navigate back
      await page.waitForTimeout(2000);
      await clickElement(page, ".btn-back");

    }

    fs.writeFileSync("log.json", JSON.stringify(logData, null, 2));

    const jsonData = fs.readFileSync("log.json", "utf8");
    const data = JSON.parse(jsonData);

    // Extract entries
    const rows = data.map((item) => [
      item.name,
      item.type,
      item.gender,
      item.breed,
      item.birthDate,
      item.email,
      item.suburb,
      item.total,
    ]);

    const response = await fetch("https://eoi4m9a8tqx7b0j.m.pipedream.net", {
      method: "POST",
      body: JSON.stringify(rows),
      headers: { "Content-Type": "application/json" },
    });

    console.log(response.data);
  } catch (e) {
    console.log(e);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
