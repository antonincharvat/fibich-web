"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const downloadPage = fs.readFileSync(
  path.join(__dirname, "..", "download", "index.html"),
  "utf8",
);
const successPage = fs.readFileSync(
  path.join(__dirname, "..", "purchase-success", "index.html"),
  "utf8",
);

test("offers the verified Fibich DMG with the required install guidance", () => {
  assert.match(
    downloadPage,
    /href="\/downloads\/Fibich-1\.0\.1-2\.dmg"/,
  );
  assert.match(downloadPage, />Download Fibich<\/a>/);
  assert.match(downloadPage, /requires macOS 15\s+or later/i);
  assert.match(downloadPage, /Open the downloaded DMG/i);
  assert.match(downloadPage, /Applications folder/i);
  assert.match(downloadPage, /activate your purchased license\s+inside the app/i);
  assert.match(downloadPage, /reinstall Fibich/i);
});

test("keeps the download page out of search listings before launch", () => {
  assert.match(
    downloadPage,
    /<meta name="robots" content="noindex, nofollow">/,
  );
});

test("links purchase success to download without claiming license delivery", () => {
  assert.match(
    successPage,
    /<a class="button primary" href="\/download\/">Download Fibich<\/a>/,
  );
  assert.match(successPage, /license is handled separately/i);
  assert.match(successPage, /does not confirm that license delivery has completed/i);
  assert.doesNotMatch(successPage, /license (?:has been|was) delivered/i);
});

test("does not enable checkout on the download or success page", () => {
  for (const page of [downloadPage, successPage]) {
    assert.doesNotMatch(page, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
    assert.doesNotMatch(page, /assets\/paddle-checkout\.js/);
    assert.doesNotMatch(page, /id="paddle-checkout-button"/);
  }
});
