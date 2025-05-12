console.clear();
// Imports
import { load } from "cheerio";
import puppeteer from "puppeteer";
import { html } from "parse5";

// Usando o Puppeteer para coletar o HTML gerado dinamicamente
async function scrapePage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content();
  await browser.close();
  return html;
}

function convertoCurrencyToFloat(string) {
  if (!string) return string;
  string = string.replace(",", ".");
  return Number(string.replace("R$", ""));
}

// Coletar os resultados de pesquisa
async function getSearchResults(query) {
  // Coletar e parsear o HTML
  const HTML = await scrapePage(`https://lista.mercadolivre.com.br/${query}`);
  console.log(HTML);
  const $ = load(HTML);

  // Selecionando os resultados e criando a array de resultadis.
  const results = [];
  const resultsElements = $(".ui-search-layout__item");

  resultsElements.each((i, resultElement) => {
    // Definir resultado e criação do objeto do resultado
    const result = $(resultElement);
    const resultObj = {};

    // Título e imagem
    resultObj.title = result.find("a.poly-component__title").text();
    resultObj.image = result.find("img.poly-component__picture").attr("data-src") || result.find("img.poly-component__picture").attr("src");

    // Preços e disconto
    const oldPrice = result.find(".andes-money-amount.andes-money-amount--previous.andes-money-amount--cents-comma").text();
    const currentPrice = result.find(".andes-money-amount.andes-money-amount--cents-superscript").text();
    const discount = result.find(".andes-money-amount__discount").text();

    resultObj.oldPrice = convertoCurrencyToFloat(oldPrice !== "" ? oldPrice : null);
    resultObj.currentPrice = convertoCurrencyToFloat(currentPrice !== "" ? currentPrice : null);
    resultObj.discount = discount !== "" ? discount : null;

    // Compra internacional?
    const internationalPurchase = result.find('span:contains("COMPRA INTERNACIONAL")').text();
    results.push(resultObj);
  });
}

// getSearchResults("pesquisa vai aqui :)");
