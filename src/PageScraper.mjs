import { Page } from "puppeteer";
import path from "path";
import { sleep } from "./index.mjs";
const baseUrl = "https://www.scalemates.com";

export class PageScraper {
  /**
   *
   * @param {Page} page
   */
  constructor(page) {
    this.page = page;
  }
  getCountryMateLinks = async (country) => {
    await this.page.goto(matePage(country));
    await autoScroll(this.page);
    return await this.page.evaluate(() => {
      const mateLinkSelector = ".tsr > a";
      const aHTMLElements = document.querySelectorAll(mateLinkSelector);
      return [...aHTMLElements].map((element) => element.getAttribute("href"));
    });
  };
  getUserSaleDetails = async (userLink) => {
    const userUrl = path.join(baseUrl, userLink);
    const saleUrl = `${userUrl}${encodeURIComponent(
      '&p=forsale&fkGROUPS[]="Aircraft"&fkSCALENORMALISED[]="1:00072"&fkSECTION[]=Kits&fkYEARRANGE[]="2000-2009"&fkYEARRANGE[]="2010-2019"&fkYEARRANGE[]="2020-2029"&fkTYPENAME[]="Full kits"'
    )}`;
    try {
      await this.page.goto(decodeURIComponent(saleUrl));
      await autoScroll(this.page);

      const userDetails = await this.page.evaluate(() => {
        const userNameHTMLElement = document.querySelector("#mh .mhtn");
        const userName = userNameHTMLElement
          ? userNameHTMLElement.textContent
          : undefined;

        const results = document.querySelector("#results");
        const saleCount = results
          ? [...results.querySelectorAll(".ac.dg.bgl.cc.pr.mt4 >  a.al")].length
          : 0;

        return {
          name: userName,
          saleCount,
        };
      });
      userDetails.url = saleUrl;
      return userDetails;
    } catch (err) {
      console.log(err);
      return null;
    }
  };
}

const matePage = (country) =>
  path.join(
    baseUrl,
    `search.php?fkSECTION[]=Members&q=*&ssearch=&fkCOUNTRY[]=%22${country}%22&`
  );

const autoScroll = async (page) => {
  await page.setViewport({
    width: 1200,
    height: 3000,
  });
  await sleep(100);
  return page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};
