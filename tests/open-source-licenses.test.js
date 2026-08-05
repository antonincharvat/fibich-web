"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..");
const legalRoot = path.join(repositoryRoot, "legal", "open-source");
const sourceRoot = path.join(legalRoot, "source");

const homepage = fs.readFileSync(path.join(repositoryRoot, "index.html"), "utf8");
const licensePage = fs.readFileSync(path.join(repositoryRoot, "license.html"), "utf8");
const privacyPage = fs.readFileSync(path.join(repositoryRoot, "privacy.html"), "utf8");
const openSourcePage = fs.readFileSync(path.join(legalRoot, "index.html"), "utf8");
const notices = fs.readFileSync(path.join(legalRoot, "ThirdPartyNotices.txt"));
const sitemap = fs.readFileSync(path.join(repositoryRoot, "sitemap.xml"), "utf8");
const llms = fs.readFileSync(path.join(repositoryRoot, "llms.txt"), "utf8");
const sourceContents = fs.readFileSync(
  path.join(sourceRoot, "SOURCE-CONTENTS.txt"),
  "utf8",
);
const sourceChecksums = fs.readFileSync(path.join(sourceRoot, "SHA256SUMS"), "utf8");

const sha256 = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

test("publishes the exact third-party notices artifact", () => {
  assert.equal(notices.byteLength, 407855);
  assert.equal(
    sha256(notices),
    "4d0f937db6b7dc933cd9e8aad65bd20b0f9a7b81cf4f081431d4bc7d520f6311",
  );
  assert.match(
    openSourcePage,
    /href="\/legal\/open-source\/ThirdPartyNotices\.txt"/,
  );
  assert.match(openSourcePage, /407,855 bytes/);
});

test("makes the canonical open-source URL discoverable from every legal surface", () => {
  for (const page of [homepage, licensePage, privacyPage]) {
    assert.match(page, /href="\/legal\/open-source\/"/);
  }

  assert.match(
    openSourcePage,
    /<link rel="canonical" href="https:\/\/fibich\.app\/legal\/open-source\/">/,
  );
  assert.match(sitemap, /<loc>https:\/\/fibich\.app\/legal\/open-source\/<\/loc>/);
  assert.match(llms, /Open-source software: https:\/\/fibich\.app\/legal\/open-source\//);
  assert.match(
    llms,
    /Complete third-party notices: https:\/\/fibich\.app\/legal\/open-source\/ThirdPartyNotices\.txt/,
  );
});

test("keeps the resolved component versions synchronized with the notices inventory", () => {
  const inventory = [
    ["AVFAudioExtensions", "0.5.1"],
    ["CDUMB", "2.0.3"],
    ["CSpeex", "1.2.1"],
    ["CXXAudioRingBuffer", "0.1.1"],
    ["CXXDispatchSemaphore", "0.4.1"],
    ["CXXMonkeysAudio", "12.13.0"],
    ["CXXRingBuffer", "0.6.1"],
    ["CXXTagLib", "2.3.0"],
    ["CXXUnfairLock", "0.3.1"],
    ["FLAC binary XCFramework package", "0.2.0"],
    ["LAME binary XCFramework package", "0.1.2"],
    ["Musepack binary XCFramework package", "0.1.2"],
    ["mpg123 binary XCFramework package", "0.3.1"],
    ["Ogg binary XCFramework package", "0.1.3"],
    ["Opus binary XCFramework package", "0.3.0"],
    ["SFBAudioEngine", "0.13.0"],
    ["libsndfile binary XCFramework package", "0.1.2"],
    ["Sparkle", "2.9.4"],
    ["Swift Collections", "1.6.0"],
    ["TTA binary XCFramework package", "0.1.2"],
    ["Vorbis binary XCFramework package", "0.1.2"],
    ["WavPack binary XCFramework package", "0.2.0"],
  ];

  for (const [component, version] of inventory) {
    assert.match(openSourcePage, new RegExp(`${component}<\\/td><td>${version}<\\/td>`));
    assert.match(notices.toString("utf8"), new RegExp(`${component} ${version}`));
  }

  const swiftTagLibRevision = "c2dc5436a4c82502d667dab57bb474a6743116ce";
  assert.match(openSourcePage, new RegExp(swiftTagLibRevision));
  assert.match(notices.toString("utf8"), new RegExp(`SwiftTagLib revision ${swiftTagLibRevision}`));
});

test("preserves the copyleft license families and version choices", () => {
  const requiredMarkers = [
    ["GNU Library General Public License 2 or later", "GNU LIBRARY GENERAL PUBLIC LICENSE"],
    ["BSD-3-Clause and LGPL-2.1-or-later", "BSD-3-Clause and LGPL-2.1-or-later"],
    ["LGPL-2.1", "LGPL-2.1"],
    ["LGPL-2.1-or-later", "LGPL-2.1-or-later"],
    ["LGPL-3.0", "LGPL-3.0"],
    ["Mozilla Public License 1.1", "Mozilla Public License 1.1"],
    ["Mozilla Public License 2.0", "Mozilla Public License Version 2.0"],
  ];

  for (const [pageMarker, noticeMarker] of requiredMarkers) {
    assert.ok(openSourcePage.includes(pageMarker), `open-source page is missing ${pageMarker}`);
    assert.ok(notices.includes(noticeMarker), `notices are missing ${noticeMarker}`);
  }
});

test("publishes exact source archives with an integrity manifest", () => {
  const archives = new Map([
    [
      "CXXTagLib-2.3.0-source.tar.gz",
      "05a9815efb2774ba40d4520c7261313e8c5b2b0c2dcdfac735a2d984052b8aa8",
    ],
    [
      "Fibich-1.0.1-lgpl-corresponding-source.tar.gz",
      "fffe8ee42e5a29559e5f823505b977fdfb00de2ce17de5cb2b96789aee6a4fee",
    ],
    [
      "SwiftTagLib-c2dc5436a4c82502d667dab57bb474a6743116ce-source.tar.gz",
      "85e5512688241dabe3e61aeb2a8745ee8eeecbeea6d8eb7e1df374045f524f9b",
    ],
  ]);

  for (const [filename, expectedHash] of archives) {
    const archive = fs.readFileSync(path.join(sourceRoot, filename));
    assert.equal(sha256(archive), expectedHash);
    assert.ok(sourceChecksums.includes(`${expectedHash}  ${filename}`));
    assert.ok(openSourcePage.includes(`/legal/open-source/source/${filename}`));
    assert.ok(openSourcePage.includes(expectedHash));
  }

  for (const revision of [
    "ca0bf41fb01a612a9176ff480e3252cf91a2cbed",
    "3d17c859b8af5e37ef9bde9b6402310f4980e77c",
    "07703e040231d50f2e7f160c670f356f129a00e4",
    "de4b45fa64ed88467806c50217e9da7032a99d80",
    "acc2c651cbd8fff8bc8cdeb4faf14b35ba81adee",
    "52f73460dc04ba789ad3007ad004faa328b732dd",
    "b68cf8a127936434cae93aa2c613d4b47eb34de4",
    "9005dc2cd455765fb6824eb215c9703429bbe8ff",
    "48cbf24e7fb5d329b1f5e24cd2e5b048585ff770",
    "8e23828b9d88f0ff1ff2d7c4bcb65739a4bdeff8",
    "842020eabcebe410e698c68545d6597b2d232e51",
  ]) {
    assert.match(sourceContents, new RegExp(revision));
  }
});

test("does not invent fees, royalties, or a working modified-library replacement", () => {
  assert.match(openSourcePage, /do not ask Fibich users to pay fees or royalties/);
  assert.doesNotMatch(
    openSourcePage,
    /(?:users?|you)\s+(?:owe|must pay|are required to pay)\s+(?:license\s+)?(?:fees?|royalt(?:y|ies))/i,
  );
  assert.doesNotMatch(openSourcePage, /(?:simple|simply)\s+(?:swap|replace)/i);
  assert.match(openSourcePage, /does not claim[\s\S]*modified-library replacement is currently usable/);
  assert.match(openSourcePage, /Modified-library replacement status/);
  assert.match(openSourcePage, /Before Fibich is publicly distributed/);
  assert.match(openSourcePage, /publish the validated installation information required for the LGPL-3\.0 TTA framework/);
});
