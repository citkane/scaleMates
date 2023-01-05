import puppeteer from "puppeteer";
import { PageBuilder } from "./PageBuilder.mjs";
import { PageScraper } from "./PageScraper.mjs";

const queryRate = 100;
const country = "CA";

(async () => {
  const browser = await puppeteer.launch();
  const sourcePage = await browser.newPage();
  const targetPage = await browser.newPage();
  const pageBuilder = await new PageBuilder(targetPage).init(country);
  const pageScraper = new PageScraper(sourcePage);

  const countryMateLinks = await pageScraper.getCountryMateLinks(country);

  for (const i in countryMateLinks) {
    const link = countryMateLinks[i];
    await sleep();
    const userDetail = await pageScraper.getUserSaleDetails(link);
    if (!userDetail) continue;

    const { name, url, saleCount } = userDetail;
    if (saleCount) {
      await pageBuilder.addListItem(name, url, saleCount);
      pageBuilder.savePage(country);
    }
    console.log(`${Number(i) + 1} of ${countryMateLinks.length}`);
  }
})();

export const sleep = async (delay = queryRate) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, delay)
  );
