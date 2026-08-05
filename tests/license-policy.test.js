"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..");
const homepage = fs.readFileSync(path.join(repositoryRoot, "index.html"), "utf8");
const licensePage = fs.readFileSync(path.join(repositoryRoot, "license.html"), "utf8");
const sitemap = fs.readFileSync(path.join(repositoryRoot, "sitemap.xml"), "utf8");
const llms = fs.readFileSync(path.join(repositoryRoot, "llms.txt"), "utf8");

test("states the one-Mac license before checkout", () => {
  assert.match(homepage, /One license\. One Mac at a time\./);
  assert.match(homepage, /One perpetual Fibich license for one Mac at a time/);
  assert.match(homepage, /A separate license for each additional Mac/);
  assert.match(homepage, /href="\/license\.html"/);
});

test("publishes consistent reinstall and transfer rules", () => {
  assert.match(licensePage, /One purchased Fibich license covers one Mac at a time/);
  assert.match(licensePage, /every additional Mac/);
  assert.match(licensePage, /reactivate the same license on the same Mac/);
  assert.match(licensePage, /remove the license from the previous Mac/);
  assert.match(licensePage, /lost, damaged, or inaccessible/);
  assert.match(licensePage, /does not expire/);
});

test("makes the license-use page discoverable", () => {
  assert.match(sitemap, /https:\/\/fibich\.app\/license\.html/);
  assert.match(llms, /License use: https:\/\/fibich\.app\/license\.html/);
  assert.match(llms, /License: One perpetual license for one Mac at a time/);
});
