import path from "path";
import fs from "fs-extra";
import fix from "js-beautify";

export class PageBuilder {
  /**
   * @param {Page} page
   */
  constructor(page) {
    this.page = page;
  }
  init = async (country, detailsText, matesPageUrl) =>
    this.page
      .goto(`file://${path.resolve("src/index.html")}`)
      .then(async () => {
        await this.page.evaluate(
          (country, detailsText, matesPageUrl) => {
            const contentHTMLElement = document.getElementById("content");
            const titleHTMLElement = document.querySelector("title");
            const matesLinkHTMLElement =
              document.getElementById("matesLink").content;
            const linkHTMLElement = matesLinkHTMLElement.querySelector("a");
            const ulHTMLElement = document.createElement("ul");
            const h1HTMLElement = document.createElement("h1");

            linkHTMLElement.setAttribute("href", matesPageUrl);
            linkHTMLElement.innerText = `"${country}" mates`;
            h1HTMLElement.innerText = detailsText;
            ulHTMLElement.id = "saleList";
            titleHTMLElement.innerText = `ScaleMates ${country}`;

            contentHTMLElement.appendChild(h1HTMLElement);
            contentHTMLElement.appendChild(matesLinkHTMLElement);
            contentHTMLElement.appendChild(ulHTMLElement);
          },
          country,
          detailsText,
          matesPageUrl
        );
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

      const childHTMLElements = [...ulHTMLElement.querySelectorAll("li")].sort(
        (a, b) => {
          const aCount = parseFloat(
            a.querySelector(".count").innerText.replace(/[[,\]]/g, "")
          );
          const bCount = parseFloat(
            b.querySelector(".count").innerText.replace(/[[,\]]/g, "")
          );

          if (aCount === bCount) return 0;
          return aCount < bCount ? 1 : -1;
        }
      );

      ulHTMLElement.replaceChildren(...childHTMLElements);
    }, innerHTML);
  };
  savePage = async (country) => {
    const fileName = path.join(path.resolve("./build"), `${country}.html`);
    const html = await this.HTML();
    await fs.writeFile(fileName, fix.html(html));
  };
}
