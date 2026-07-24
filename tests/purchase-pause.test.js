"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const homepage = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8",
);

test("keeps checkout unavailable while fulfillment setup is paused", () => {
  assert.match(homepage, /Purchases temporarily paused/);
  assert.match(homepage, /No payment can be made from this page right now\./);
  assert.doesNotMatch(homepage, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.doesNotMatch(homepage, /assets\/paddle-checkout\.js/);
  assert.doesNotMatch(homepage, /id="paddle-licensee-name"/);
  assert.doesNotMatch(homepage, /id="paddle-checkout-button"/);
});
