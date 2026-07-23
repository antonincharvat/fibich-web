"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const PRODUCT_ID = "pro_01ky5k4hsfrn8zfvc55nf5tkha";
const LAUNCH_PRICE_ID = "pri_01ky5kgaftp3bea23rtfkhmk0t";
const SCRIPT_PATH = path.join(__dirname, "..", "assets", "paddle-checkout.js");
const SCRIPT_SOURCE = fs.readFileSync(SCRIPT_PATH, "utf8");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createElement(initialText = "") {
  const attributes = new Map();
  const listeners = new Map();

  return {
    disabled: false,
    textContent: initialText,
    addEventListener(type, listener) {
      const typeListeners = listeners.get(type) || [];
      typeListeners.push(listener);
      listeners.set(type, typeListeners);
    },
    click() {
      for (const listener of listeners.get("click") || []) {
        listener();
      }
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function previewResult({
  formattedTotal = "$9.99",
  priceId = LAUNCH_PRICE_ID,
  productId = PRODUCT_ID,
} = {}) {
  return {
    data: {
      details: {
        lineItems: [
          {
            formattedTotals: { total: formattedTotal },
            price: { id: priceId },
            product: { id: productId },
          },
        ],
      },
    },
  };
}

function runCheckoutScript({
  paddleAvailable = true,
  pricePreviewError,
  pricePreviewResult = previewResult(),
  checkoutOpenError,
} = {}) {
  const calls = {
    checkoutOpen: [],
    environment: [],
    initialize: [],
    pricePreview: [],
    warnings: [],
    errors: [],
  };
  const elements = {
    "paddle-price": createElement("Loading your local price…"),
    "paddle-price-note": createElement("Paddle is checking the total for your location."),
    "paddle-offer-label": createElement("Introductory price"),
    "paddle-checkout-button": createElement("Preparing checkout…"),
    "paddle-checkout-status": createElement("Sandbox test mode. No real payment will be taken."),
  };
  elements["paddle-checkout-button"].disabled = true;

  const Paddle = paddleAvailable
    ? {
        Checkout: {
          open(options) {
            calls.checkoutOpen.push(options);
            if (checkoutOpenError) {
              throw checkoutOpenError;
            }
          },
        },
        Environment: {
          set(environment) {
            calls.environment.push(environment);
          },
        },
        Initialize(options) {
          calls.initialize.push(options);
        },
        PricePreview(options) {
          calls.pricePreview.push(options);
          if (pricePreviewError) {
            return Promise.reject(pricePreviewError);
          }
          return Promise.resolve(pricePreviewResult);
        },
      }
    : undefined;

  const window = {
    Paddle,
    location: {
      origin: "http://localhost:8765",
      protocol: "http:",
    },
    setTimeout() {
      return 0;
    },
  };
  const document = {
    getElementById(id) {
      return elements[id] || null;
    },
  };
  const console = {
    error(...messages) {
      calls.errors.push(messages);
    },
    warn(...messages) {
      calls.warnings.push(messages);
    },
  };
  const context = vm.createContext({ console, document, URL, window });

  vm.runInContext(SCRIPT_SOURCE, context, { filename: SCRIPT_PATH });

  return { calls, elements };
}

async function finishInitialization() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

test("initializes Paddle sandbox and displays its formatted total unchanged", async () => {
  const localizedTotal = "1 234,56 Kč";
  const { calls, elements } = runCheckoutScript({
    pricePreviewResult: previewResult({ formattedTotal: localizedTotal }),
  });

  await finishInitialization();

  assert.deepEqual(calls.environment, ["sandbox"]);
  assert.equal(calls.initialize.length, 1);
  assert.match(calls.initialize[0].token, /^test_[a-zA-Z0-9]{27}$/);
  assert.deepEqual(plain(calls.initialize[0].checkout.settings), {
    displayMode: "overlay",
    variant: "one-page",
    theme: "light",
    successUrl: "http://localhost:8765/purchase-success/",
  });
  assert.deepEqual(plain(calls.pricePreview), [
    {
      items: [{ priceId: LAUNCH_PRICE_ID, quantity: 1 }],
    },
  ]);
  assert.equal(elements["paddle-price"].textContent, localizedTotal);
  assert.equal(elements["paddle-price"].getAttribute("aria-busy"), "false");
  assert.equal(
    elements["paddle-price-note"].textContent,
    "One-time total estimated by Paddle for your location.",
  );
  assert.equal(elements["paddle-checkout-button"].disabled, false);
  assert.equal(elements["paddle-checkout-button"].textContent, "Buy Fibich");
});

test("opens one-page overlay checkout for the displayed launch price and quantity", async () => {
  const { calls, elements } = runCheckoutScript();
  await finishInitialization();

  elements["paddle-checkout-button"].click();

  assert.equal(calls.checkoutOpen.length, 1);
  assert.deepEqual(plain(calls.checkoutOpen[0]), {
    items: [{ priceId: LAUNCH_PRICE_ID, quantity: 1 }],
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      theme: "light",
      successUrl: "http://localhost:8765/purchase-success/",
    },
  });
});

test("keeps checkout available with the USD fallback when price preview fails", async () => {
  const { calls, elements } = runCheckoutScript({
    pricePreviewError: new Error("preview unavailable"),
  });

  await finishInitialization();

  assert.equal(elements["paddle-price"].textContent, "USD 9.99");
  assert.equal(elements["paddle-price"].getAttribute("aria-busy"), "false");
  assert.equal(
    elements["paddle-price-note"].textContent,
    "Localized pricing is temporarily unavailable. Checkout will confirm your total.",
  );
  assert.equal(elements["paddle-checkout-button"].disabled, false);
  assert.equal(calls.warnings.length, 1);

  elements["paddle-checkout-button"].click();
  assert.deepEqual(plain(calls.checkoutOpen[0].items), [
    { priceId: LAUNCH_PRICE_ID, quantity: 1 },
  ]);
});

test("rejects an unexpected product returned by price preview", async () => {
  const { elements } = runCheckoutScript({
    pricePreviewResult: previewResult({ productId: "pro_unexpected" }),
  });

  await finishInitialization();

  assert.equal(elements["paddle-price"].textContent, "USD 9.99");
  assert.equal(
    elements["paddle-price-note"].textContent,
    "Localized pricing is temporarily unavailable. Checkout will confirm your total.",
  );
});

test("leaves checkout disabled when Paddle.js is unavailable", async () => {
  const { calls, elements } = runCheckoutScript({ paddleAvailable: false });

  await finishInitialization();

  assert.equal(calls.initialize.length, 0);
  assert.equal(calls.pricePreview.length, 0);
  assert.equal(elements["paddle-checkout-button"].disabled, true);
  assert.equal(elements["paddle-price"].textContent, "USD 9.99");
  assert.equal(
    elements["paddle-checkout-status"].textContent,
    "Checkout is temporarily unavailable. Please try again later.",
  );
});

test("shows a retry message when Paddle cannot open checkout", async () => {
  const { calls, elements } = runCheckoutScript({
    checkoutOpenError: new Error("checkout unavailable"),
  });
  await finishInitialization();

  elements["paddle-checkout-button"].click();

  assert.equal(calls.errors.length, 1);
  assert.equal(
    elements["paddle-checkout-status"].textContent,
    "Checkout could not open. Please try again.",
  );
});
