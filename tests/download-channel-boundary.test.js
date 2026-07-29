"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..");
const checkoutScript = fs.readFileSync(
  path.join(repositoryRoot, "assets", "paddle-checkout.js"),
  "utf8",
);
const homepage = fs.readFileSync(
  path.join(repositoryRoot, "index.html"),
  "utf8",
);
const appcast = fs.readFileSync(
  path.join(repositoryRoot, "appcast.xml"),
  "utf8",
);

test("routes completed checkout to the WEDOS-hosted success page", () => {
  assert.match(
    checkoutScript,
    /const PURCHASE_SUCCESS_URL = "https:\/\/api\.fibich\.app\/purchase-success\/"/,
  );
});

test("keeps the private download route out of the public website", () => {
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "purchase-success")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "get")),
    false,
  );
  assert.doesNotMatch(checkoutScript, /fibich-macos-[a-f0-9]{32}/);
  assert.doesNotMatch(homepage, /fibich-macos-[a-f0-9]{32}/);
});

test("keeps the DMG artifact out of the public repository", () => {
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "downloads")),
    false,
  );
  assert.match(
    appcast,
    /url="https:\/\/api\.fibich\.app\/releases\/[a-f0-9]{32}\/Fibich-1\.0\.1-2\.dmg"/,
  );
  assert.doesNotMatch(appcast, /fibich\.app\/downloads\//);
  assert.doesNotMatch(appcast, /\/get\/fibich-macos-/);
});
