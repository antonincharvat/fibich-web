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
const privacyPage = fs.readFileSync(
  path.join(__dirname, "..", "privacy.html"),
  "utf8",
);

test("publishes the tested checkout from the homepage", () => {
  assert.match(homepage, /Available now for macOS/);
  assert.match(homepage, /Purchase Fibich\./);
  assert.match(homepage, /USD 9\.99/);
  assert.match(homepage, /Introductory one-time price\./);
  assert.match(homepage, /One license\. One Mac at a time\./);
  assert.match(homepage, /A separate license for each additional Mac/);
  assert.match(homepage, /Requires macOS 15 or later/);
  assert.match(homepage, /href="\/license\.html"/);
  assert.match(homepage, /href="\/privacy\.html"/);
  assert.match(homepage, /href="\/checkout\.html"/);
  assert.doesNotMatch(homepage, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.doesNotMatch(homepage, /assets\/paddle-checkout\.js/);
  assert.doesNotMatch(homepage, /id="paddle-licensee-name"/);
  assert.doesNotMatch(homepage, /id="paddle-checkout-button"/);
});

test("keeps the live checkout isolated and out of search indexes", () => {
  assert.match(checkoutPage, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(checkoutPage, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.match(checkoutPage, /assets\/paddle-checkout\.js/);
  assert.match(checkoutPage, /id="paddle-licensee-name"/);
  assert.match(checkoutPage, /id="paddle-checkout-button"/);
  assert.match(checkoutPage, /This is the live checkout/);
  assert.match(checkoutPage, /Requires macOS 15 or later/);
  assert.match(checkoutPage, /href="\/license\.html"/);
  assert.match(checkoutPage, /href="\/privacy\.html"/);
  assert.doesNotMatch(sitemap, /checkout\.html/);
});

test("discloses purchase and fulfillment data handling", () => {
  assert.match(privacyPage, /Purchases and license delivery/);
  assert.match(privacyPage, /Paddle is the merchant of record/);
  assert.match(privacyPage, /does not receive or store your full payment-card\s+details/);
  assert.match(privacyPage, /transactional license emails/);
  assert.match(privacyPage, /WEDOS/);
  assert.match(privacyPage, /payment-adjustment records/);
});
