// Imports
import * as fs from "fs";
import { html } from "parse5";
import { load } from "cheerio";
import puppeteer from "puppeteer";

// Usando o Puppeteer para coletar o HTML gerado dinamicamente
async function scrapePage(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.content();
    await browser.close();
    return html;
  } catch (error) {
    console.log(`An error has occurred while scraping the page!: ${error}`);
  }
}

// Converter as strings de peço para valores em float
function convertoCurrencyToFloat(string) {
  if (!string) return string;
  string = string.replace(",", ".");
  return Number(string.replace("R$", ""));
}

// Converter objeto para arquivo JSON
function convertObjectToJsonFile(obj, filePath) {
  try {
    const jsonString = JSON.stringify(obj, null, 2);
    fs.writeFileSync(filePath, jsonString);
    console.log(`Object successfully written to ${filePath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Coletar os resultados de pesquisa
async function getSearchResults(query) {
  // Coletar e parsear o HTML
  const HTML = await scrapePage(`https://lista.mercadolivre.com.br/${query}`);
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
    const internationalPurchase = result.find('span:contains("COMPRA INTERNACIONAL")').text().trim();
    resultObj.internationalPurchase = internationalPurchase === "COMPRA INTERNACIONAL" ? true : false;

    // Adicionar resultado a array de resultados
    results.push(resultObj);
  });

  // Cria um JSON com os resultados
  convertObjectToJsonFile(results, `./results/${query}.json`);
}

// getSearchResults("pesquisa vai aqui :)");
