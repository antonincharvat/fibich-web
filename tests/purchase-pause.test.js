"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const homepage = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8",
);
const checkoutPage = fs.readFileSync(
  path.join(__dirname, "..", "checkout.html"),
  "utf8",
);
const sitemap = fs.readFileSync(
  path.join(__dirname, "..", "sitemap.xml"),
  "utf8",
);

test("keeps checkout unavailable while fulfillment setup is paused", () => {
  assert.match(homepage, /Purchases temporarily paused/);
  assert.match(homepage, /No payment can be made from this page right now\./);
  assert.match(homepage, /USD 9\.99/);
  assert.match(homepage, /Introductory one-time price\./);
  assert.match(homepage, /One license\. One Mac at a time\./);
  assert.match(homepage, /A separate license for each additional Mac/);
  assert.match(homepage, /href="\/license\.html"/);
  assert.doesNotMatch(homepage, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.doesNotMatch(homepage, /assets\/paddle-checkout\.js/);
  assert.doesNotMatch(homepage, /id="paddle-licensee-name"/);
  assert.doesNotMatch(homepage, /id="paddle-checkout-button"/);
  assert.doesNotMatch(homepage, /href="\/checkout\.html"/);
});

test("keeps the controlled live checkout unlinked and out of search indexes", () => {
  assert.match(checkoutPage, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(checkoutPage, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.match(checkoutPage, /assets\/paddle-checkout\.js/);
  assert.match(checkoutPage, /id="paddle-licensee-name"/);
  assert.match(checkoutPage, /id="paddle-checkout-button"/);
  assert.match(checkoutPage, /This is the live checkout/);
  assert.match(checkoutPage, /href="\/license\.html"/);
  assert.match(checkoutPage, /href="\/privacy\.html"/);
  assert.doesNotMatch(sitemap, /checkout\.html/);
});
