import puppeteer from "puppeteer";
import fs from "fs-extra";
import { PageBuilder } from "./PageBuilder.mjs";
import { PageScraper, saleUrlBuilder, matesPage } from "./PageScraper.mjs";

const queryRate = 100;

let options = fs.readJsonSync("./defaultOptions.json");
const userOptions = fs.existsSync("./customOptions.json")
  ? fs.readJsonSync("./customOptions.json")
  : null;
if (userOptions) options = { ...options, ...userOptions };
const { country, scale, decades, groups, credentials } = options;
const { email, password } = credentials;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const targetPage = await browser.newPage();
  const sourcePage = await browser.newPage();

  const matesPageUrl = matesPage(country);
  const saleUrlQuery = saleUrlBuilder(scale, decades, groups);

  const pageBuilder = await new PageBuilder(targetPage).init(
    country,
    saleUrlQuery.text,
    matesPageUrl
  );

  const pageScraper = new PageScraper(sourcePage);

  if (email && password) await pageScraper.login(email, password);

  console.log(`Loading "${country}" mates: ${matesPageUrl}`);
  console.log(`\n\n${"-".repeat(100)}`);
  console.log(saleUrlQuery.text);
  console.log("-".repeat(100), "\n\n");

  const countryMateLinks = await pageScraper.getCountryMateLinks(matesPageUrl);

  //return;

  console.log(
    `Found [${countryMateLinks.length}] mates in ${country}. \nNow checking how many have items for sale or swap...`
  );

  for (const i in countryMateLinks) {
    const link = `${countryMateLinks[i]}&${saleUrlQuery.query}`;
    await sleep();
    console.log(`Scraping mate ${Number(i) + 1} of ${countryMateLinks.length}`);

    const userDetail = await pageScraper.getUserSaleDetails(link);
    if (!userDetail) continue;

    const { name, url, saleCount } = userDetail;
    if (saleCount) {
      await pageBuilder.addListItem(name, url, saleCount);
      pageBuilder.savePage(country);
      console.log(`${name} has [${saleCount}] items for sale.`);
    }
  }

  console.log(
    `\nDONE!`,
    `\n\nOpen ./build/${country}.html locally in your browser.`
  );
})();

export const sleep = async (delay = queryRate) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, delay)
  );
