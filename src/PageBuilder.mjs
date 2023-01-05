import { Page } from "puppeteer";
import path from "path";
import fs from "fs-extra";

export class PageBuilder {
  /**
   * @param {Page} page
   */
  constructor(page) {
    this.page = page;
  }
  init = async (country) =>
    this.page
      .goto(`file://${path.resolve("src/index.html")}`)
      .then(async () => {
        await this.page.evaluate((country) => {
          const body = document.querySelector("body");
          const title = document.querySelector("title");
          const ulHTMLElement = document.createElement("ul");
          ulHTMLElement.id = "saleList";
          title.innerText = `ScaleMates ${country}`;
          body.appendChild(ulHTMLElement);
        }, country);
        await this.savePage(country);
        return this;
      });

  HTML = async () => {
    const HTML = await this.page.content();
    return HTML;
  };
  addListItem = async (mateName, mateLink, salesCount) => {
    const innerHTML = `
	<a class="name" href='${decodeURIComponent(
    mateLink
  )}' target="_blank">${mateName}</a>
	<span class="count">[${salesCount}]</span>
	`;
    return await this.page.evaluate((inner) => {
      const ulHTMLElement = document.querySelector("#saleList");
      const liHTMLElement = document.createElement("li");
      liHTMLElement.innerHTML = inner;
      ulHTMLElement.appendChild(liHTMLElement);
    }, innerHTML);
  };
  savePage = async (country) => {
    const fileName = path.join(path.resolve("./build"), `${country}.html`);
    const html = await this.HTML();
    await fs.writeFile(fileName, html);
  };
}
