import puppeteer from "puppeteer";
import fs from "fs-extra";
import { PageBuilder } from "./PageBuilder.mjs";
import { PageScraper, saleUrlBuilder } from "./PageScraper.mjs";

const queryRate = 100;

let options = fs.readJsonSync("./defaultOptions.json");
const userOptions = fs.existsSync("./customOptions.json")
  ? fs.readJsonSync("./customOptions.json")
  : null;
if (userOptions) options = { ...options, ...userOptions };
const { country, scale, decades, groups } = options;

(async () => {
  const browser = await puppeteer.launch();
  const sourcePage = await browser.newPage();
  const targetPage = await browser.newPage();
  const pageBuilder = await new PageBuilder(targetPage).init(country);
  const pageScraper = new PageScraper(sourcePage);

  const countryMateLinks = await pageScraper.getCountryMateLinks(country);

  console.log(
    `Found [${countryMateLinks.length}] mates in ${country}. \nNow checking how many have items for sale or swap...`
  );

  const saleUrlQuery = saleUrlBuilder(scale, decades, groups);

  for (const i in countryMateLinks) {
    const link = `${countryMateLinks[i]}&${saleUrlQuery}`;
    await sleep();
    const userDetail = await pageScraper.getUserSaleDetails(link);
    if (!userDetail) continue;

    const { name, url, saleCount } = userDetail;
    if (saleCount) {
      await pageBuilder.addListItem(name, url, saleCount);
      pageBuilder.savePage(country);
    }
    console.log(`Scraping mate ${Number(i) + 1} of ${countryMateLinks.length}`);
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
