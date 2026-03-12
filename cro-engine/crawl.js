#!/usr/bin/env node
/**
 * Crawl script for the CRO Engine.
 * Fetches all pages from a sitemap URL and outputs pages.json.
 *
 * Usage:
 *   node crawl.js                                          # Uses default Rove sitemap
 *   node crawl.js https://www.go-rove.com/sitemap.xml     # Custom sitemap URL
 *
 * Output: pages.json in the current directory
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const { URL } = require("url");

const DEFAULT_SITEMAP = "https://www.go-rove.com/sitemap.xml";
const FALLBACK_PAGES = [
  "https://www.go-rove.com/",
  "https://www.go-rove.com/free-trial/",
  "https://www.go-rove.com/book-a-demo/",
  "https://www.go-rove.com/pricing/",
  "https://www.go-rove.com/about-us/",
  "https://www.go-rove.com/case-study/",
  "https://www.go-rove.com/roi-calculator/",
  "https://www.go-rove.com/partners/chamber-international/",
  "https://www.go-rove.com/blog/",
  "https://www.go-rove.com/webinars/",
];

function fetchUrl(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "RoveCROCrawler/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
          const redirect = new URL(res.headers.location, url).href;
          return fetchUrl(redirect, maxRedirects - 1).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseSitemap(xml) {
  const urls = [];
  const regex = /<loc>\s*(.*?)\s*<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const sitemapUrl = process.argv[2] || DEFAULT_SITEMAP;
  console.log(`Fetching sitemap: ${sitemapUrl}`);

  let pageUrls;
  try {
    const xml = await fetchUrl(sitemapUrl);
    pageUrls = parseSitemap(xml);
    if (pageUrls.length === 0) throw new Error("No URLs found in sitemap");
    console.log(`Found ${pageUrls.length} URLs in sitemap`);
  } catch (err) {
    console.log(`Sitemap fetch failed (${err.message}). Using fallback page list.`);
    pageUrls = FALLBACK_PAGES;
  }

  const results = [];
  for (const url of pageUrls) {
    process.stdout.write(`  Fetching ${url} ... `);
    try {
      const html = await fetchUrl(url);
      results.push({
        url,
        html,
        fetched_at: new Date().toISOString(),
      });
      console.log(`OK (${html.length} bytes)`);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
    await sleep(1000); // Be polite
  }

  const outPath = "pages.json";
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nDone. ${results.length} pages saved to ${outPath}`);
  console.log("Import this file into the CRO Engine app.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
