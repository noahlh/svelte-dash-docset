const puppeteer = require("puppeteer");
const { URL } = require("url");
const fse = require("fs-extra");
const path = require("path");
const fullBasePath = path.resolve("svelte.dev");
const baseUrl = "https://svelte.dev/";

fetchSvelte();

async function fetchSvelte() {
  console.log("Loading headless browser");
  let browser = await puppeteer.launch({ userDataDir: "./data" });

  let page = await browser.newPage();
  page.on("response", handleAssets);
  page.on("console", (msg) => console.log(msg.text()));

  await page.goto("https://svelte.dev/favicon.png", { waitUntil: "networkidle0" });

  // await crawl({ page, url: "tutorial/basics", pathModifier: "../../" });
  await crawl({ page, url: "docs", pathModifier: "../" });

  console.log(`All done!  Closing browser`);
  browser.close();
}

async function handleAssets(response) {
  console.log(`Response:  code ${response.status()} URL: ${response.url()}`);
  if (isRedirect(response.status())) return;

  let url = new URL(response.url());
  let fullFilePath = path.join(fullBasePath, url.pathname);
  let extension = path.extname(url.pathname).trim();

  if (extension === "" || extension === ".html") return;

  try {
    let responseBuffer = await response.buffer();
  } catch (e) {
    console.log(`Failed to load response for ${url.pathname}: ${e.message}`);
    return;
  }

  if (extension === ".css") {
    await writeFileToDisk(fullFilePath, updateCss({ buffer: await response.buffer(), fullFilePath }));
  } else {
    await writeFileToDisk(fullFilePath, await response.buffer());
  }
}

function isRedirect(status) {
  return status >= 300 && status <= 399;
}

async function writeFileToDisk(fullFilePath, file) {
  await fse.outputFile(fullFilePath, file);
}

function updateCss({ buffer, fullFilePath }) {
  return (
    buffer
      .toString()
      // Fix relative paths for client/ fonts/ and icons/ in CSS URLs
      .replace(/(?<=url\(\'?)(?:\/?client|\/?fonts|\/?icons).+?(?=\'?\))/g, (match, offset, original) => {
        return path.relative(path.dirname(fullFilePath), path.join(fullBasePath, match));
      })
      // Fix padding to adjust for removed nav bar
      .replace(/--nav-h:\s*.+;/g, "--nav-h: 0.1px;")
  );
}

async function crawl({ page, url, pathModifier }) {
  console.log(`Loading ${baseUrl + url}`);
  await page.goto(baseUrl + url, { waitUntil: "networkidle2" });

  console.log(`Finding next tutorial page to crawl`);
  let nextUrl = await page.evaluate(findNextPage);

  console.log(`Updating HTML`);
  try {
    await page.exposeFunction("pathJoin", path.join);
  } catch {}

  await page.evaluate(updateHtml, { pathModifier });

  console.log(`Writing HTML`);
  let html = await page.content();
  await writeFileToDisk(path.join(fullBasePath, url, "index.html"), html);

  if (nextUrl) await crawl({ page, url: nextUrl });
}

async function findNextPage() {
  // If next tutorial step AND not disabled
  let nextPage = document.querySelector("a[aria-label='Next tutorial step']:not(.disabled)");
  if (nextPage) {
    return nextPage.getAttribute("href");
  } else {
    return;
  }
}

async function updateHtml({ pathModifier }) {
  // The <base> tag needs an absolute path to work locally (we don't have that), so we're removing it
  let baseTag = document.querySelector("base");
  baseTag.parentNode.removeChild(baseTag);

  // Stripping out the <header> since we don't want to navigate outside the docset
  let headerTag = document.querySelector("header");
  headerTag.parentNode.removeChild(headerTag);

  // Find all <link> tags and rewrite path
  rewritePaths({ tag: "link", attribute: "href" });

  // Find all <script> tags and rewrite path
  rewritePaths({ tag: "script", attribute: "src" });

  // Find all <a> tags and re-write the href to have the proper relative path
  rewritePaths({ tag: "a", attribute: "href" });

  function rewritePaths({ tag, attribute }) {
    [...document.getElementsByTagName(tag)].forEach(async (_tag) => {
      let newValue;
      let originalAttributeValue = _tag.getAttribute(attribute);
      if (originalAttributeValue.match(/^http.*/)) {
        newValue = originalAttributeValue;
      } else if (originalAttributeValue.match(/\..{2,5}$/)) {
        newValue = await window.pathJoin(pathModifier, originalAttributeValue);
      } else if (originalAttributeValue.match(/#/)) {
        newValue = `#${originalAttributeValue.split("#").pop()}`;
      } else {
        newValue = await window.pathJoin(pathModifier, originalAttributeValue, "/index.html");
      }

      console.log(`${originalAttributeValue} -> ${newValue}`);
      _tag.setAttribute(attribute, newValue);
    });
  }
}
