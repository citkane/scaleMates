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
    const url = matePage(country);
    console.log(`Loading "${country}" mates: ${decodeURIComponent(url)}`);
    await this.page.goto(url);

    let matesAndTowns = await this.page.evaluate(() => {
      const totalMates = [
        ...document.querySelectorAll("label.cfkTOWN > em.cntfkTOWN"),
      ].reduce(
        (a, em) => a + parseFloat(em.textContent.replace(/[\(,\)]/g, "")),
        0
      );
      const towns = [...document.querySelectorAll("label.cfkTOWN > input")].map(
        (inputElement) => inputElement.value
      );
      return {
        towns,
        totalMates,
      };
    });

    const { totalMates, towns } = matesAndTowns;
    console.log(`Found [${totalMates}] mates in [${towns.length}] towns.`);
    console.log("Scraping each town for mates - this may take a while...");

    const mateLinks = [];
    for (const i in towns) {
      const townUrl = `${url}&fkTOWN[]="${towns[i]}"`;
      await this.page.goto(townUrl);
      await autoScroll(this.page);
      const townMateLinks = await this.page.evaluate(() => {
        const mateLinkSelector = ".tsr > a";
        const aHTMLElements = document.querySelectorAll(mateLinkSelector);
        return [...aHTMLElements].map((element) =>
          element.getAttribute("href")
        );
      });
      console.log(
        `..........${towns[i] || "Unknown Town"} [${townMateLinks.length}]`
      );

      mateLinks.push(townMateLinks);
      sleep();
    }
    return mateLinks.flat();
  };

  getUserSaleDetails = async (userLink) => {
    const saleUrl = path.join(baseUrl, userLink);

    try {
      await this.page.goto(saleUrl);
      await autoScroll(this.page);

      const userDetails = await this.page.evaluate(() => {
        const userNameHTMLElement = document.querySelector("#mh .mhtn");
        const userName = userNameHTMLElement
          ? userNameHTMLElement.textContent
          : undefined;

        const results = document.querySelector("#results");
        const saleCount = results
          ? [...results.querySelectorAll(".ac.dg.bgl.cc.pr.mt4 > a.al")].length
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

export const saleUrlBuilder = (scale, decades, groups) => {
  groups = initCaps(groups);
  scale = normaliseScale(scale);
  const queries = {
    forSale: "p=forsale",
    groups: `fkGROUPS[]="${groups}"`,
    scale: `fkSCALENORMALISED[]="1:${scale}"`,
    section: "fkSECTION[]=Kits",
    type: 'fkTYPENAME[]="Full kits"',
  };
  queries.yearRanges = decades
    .map((decade) => {
      const centurySplit = [decade.substring(0, 2), decade.substring(2)[0] + 0];
      return `fkYEARRANGE[]="${centurySplit.join("")}-${[
        centurySplit[0],
        centurySplit[1][0] + "9",
      ].join("")}"`;
    })
    .join("&");

  console.log(`\n\n${"-".repeat(60)}`);
  console.log(
    `Looking for ${groups} kits in scale 1:${scale} released in the ${
      decades.length > 1 ? "decades" : "decades"
    } ${decades.join()}`
  );
  console.log("-".repeat(60), "\n\n");

  return Object.values(queries).join("&");
};
const normaliseScale = (scale) => {
  scale = scale.split(/[:|\/|\\]/).pop();
  return `${"0".repeat(5 - scale.length)}${scale}`;
};
const initCaps = (string) =>
  `${string[0].toUpperCase()}${string.toLowerCase().substring(1)}`;
const matePage = (country) =>
  path.join(
    baseUrl,
    `search.php?fkSECTION[]=Members&q=*&ssearch=&fkCOUNTRY[]=%22${country}%22`
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
