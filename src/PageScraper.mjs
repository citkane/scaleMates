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
  login = async (email, password) => {
    await this.page.goto(`${baseUrl}/login.php`);
    await this.page.evaluate(
      (email, password) => {
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("pass");
        const submitButton = document.querySelector('input[name="submit"]');

        emailInput.value = email;
        passwordInput.value = password;
        submitButton.click();
      },
      email,
      password
    );
    return await this.page.waitForSelector("#psc").then(() => {
      console.log("Logged In");
    });
  };
  getCountryMateLinks = async (url) => {
    await this.page.setViewport({
      width: 1200,
      height: 900,
    });

    await this.page.goto(url);
    let matesAndTowns = await this.page.evaluate(() => {
      const totalMates = [
        ...document.querySelectorAll("label.cfkTOWN > em.cntfkTOWN"),
      ].reduce(
        (a, em) => a + parseFloat(em.textContent.replace(/[(,)]/g, "")),
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
      const mateLinkSelector = ".tsr > a";

      await this.page.goto(townUrl);
      const count = await this.page.evaluate(
        (mateLinkSelector) =>
          document.querySelectorAll(mateLinkSelector).length,
        mateLinkSelector
      );
      if (!count) continue;
      if (count > 10) await autoScroll(this.page);
      const townMateLinks = await this.page.evaluate((mateLinkSelector) => {
        const aHTMLElements = document.querySelectorAll(mateLinkSelector);
        return [...aHTMLElements].map((element) =>
          element.getAttribute("href")
        );
      }, mateLinkSelector);
      console.log(
        `..........${towns[i] || "Unknown Town"} [${townMateLinks.length}]`
      );

      mateLinks.push(townMateLinks);
      sleep();
    }

    return mateLinks.flat();
  };

  getUserSaleDetails = async (userLink) => {
    const saleUrl = `${baseUrl}${userLink}`;

    await this.page.goto(saleUrl);

    const resultsSelector = "#results .ac.dg.bgl.cc.pr.mt4 > a.al";
    const count = await this.page.evaluate((resultsSelector) => {
      return document.querySelectorAll(resultsSelector).length;
    }, resultsSelector);

    if (!count) return null;

    await autoScroll(this.page);

    const userDetails = await this.page.evaluate((resultsSelector) => {
      const userNameHTMLElement = document.querySelector("#mh .mhtn");
      const userName = userNameHTMLElement
        ? userNameHTMLElement.textContent
        : undefined;

      const saleCount = document.querySelectorAll(resultsSelector).length;

      return {
        name: userName,
        saleCount,
      };
    }, resultsSelector);
    userDetails.url = saleUrl;
    return userDetails;
  };
}

export const matesPage = (country) =>
  `${baseUrl}/search.php?fkSECTION[]=Members&ssearch=&fkCOUNTRY[]="${country}"&of=alpha`;

export const saleUrlBuilder = (scales, decades, groups) => {
  scales = scales.map((scale) => normaliseScale(scale));
  groups = groups.map((group) => initCaps(group));
  const queries = {
    forSale: "p=forsale",
    groups: groups.map((group) => `fkGROUPS[]="${group}"`).join("&"),
    scale: scales.map((scale) => `fkSCALENORMALISED[]="1:${scale}"`).join("&"),
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

  const query = Object.values(queries).join("&");

  let text = `Looking for ${joinGroups(groups)} kits ${joinScales(
    scales
  )}`.replace(/\s\s+/g, " ");
  if (decades.length)
    text = `${text} released in the ${
      decades.length > 1 ? "decades" : "decades"
    } ${decades.join(", ")}`;

  return {
    query,
    text,
  };
};
const joinScales = (scales) => {
  if (!scales.length) return "";
  scales = scales.map((scale) => `1:${scale.replace(/0/g, "")}`);
  if (scales.length === 1) return `in scale ${scales[0]}`;
  return `in scales [${scales.join(", ")}]`;
};
const joinGroups = (groups) => {
  if (!groups.length) return "";
  if (groups.length === 1) return groups[0];
  return `[${groups.join(", ")}]`;
};
const normaliseScale = (scale) => {
  scale = scale.split(/[:|/|\\]/).pop();
  return `${"0".repeat(5 - scale.length)}${scale}`;
};
const initCaps = (string) =>
  `${string[0].toUpperCase()}${string.toLowerCase().substring(1)}`;

const autoScroll = async (page, idSelector) => {
  return page.evaluate(async (idSelector) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      if (idSelector) idSelector = document.getElementById(idSelector);
      let scrollHeight;

      const elementHeight = idSelector
        ? idSelector.clientHeight
        : window.innerHeight;
      const distance = elementHeight / 2;

      const timer = setInterval(() => {
        scrollHeight = (idSelector ? idSelector : document.body).scrollHeight;
        (idSelector ? idSelector : window).scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - elementHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  }, idSelector);
};
