(function () {
  "use strict";

  const PADDLE_CONFIG = Object.freeze({
    environment: "sandbox",
    // Create this public token in Paddle sandbox, then replace only this value.
    clientToken: "test_4f7e660052d9c21e9791b5952f0",
    productId: "pro_01ky5k4hsfrn8zfvc55nf5tkha",
    // After the three-week launch offer, change this to "regular" and archive
    // the introductory price in Paddle. No pricing dates are guessed here.
    activeOffer: "introductory",
    offers: Object.freeze({
      introductory: Object.freeze({
        priceId: "pri_01ky5kgaftp3bea23rtfkhmk0t",
        fallbackPrice: "USD 9.99",
        label: "Introductory price",
      }),
      regular: Object.freeze({
        priceId: "pri_01ky5khqsbej19z5y1cwf9tkg6",
        fallbackPrice: "USD 19.99",
        label: "Perpetual license",
      }),
    }),
  });

  const CLIENT_TOKEN_PATTERN = /^test_[a-zA-Z0-9]{27}$/;
  const PRICE_PREVIEW_TIMEOUT_MS = 10000;
  const activeOffer = PADDLE_CONFIG.offers[PADDLE_CONFIG.activeOffer];
  const priceElement = document.getElementById("paddle-price");
  const priceNoteElement = document.getElementById("paddle-price-note");
  const offerLabelElement = document.getElementById("paddle-offer-label");
  const checkoutButton = document.getElementById("paddle-checkout-button");
  const checkoutStatus = document.getElementById("paddle-checkout-status");

  if (
    !activeOffer ||
    !priceElement ||
    !priceNoteElement ||
    !offerLabelElement ||
    !checkoutButton ||
    !checkoutStatus
  ) {
    return;
  }

  function showFallback(message) {
    priceElement.textContent = activeOffer.fallbackPrice;
    priceElement.setAttribute("aria-busy", "false");
    priceNoteElement.textContent = message;
  }

  function setCheckoutReady() {
    checkoutButton.disabled = false;
    checkoutButton.textContent = "Buy Fibich";
  }

  function previewWithTimeout(request) {
    return Promise.race([
      window.Paddle.PricePreview(request),
      new Promise((resolve, reject) => {
        window.setTimeout(() => reject(new Error("Paddle price preview timed out")), PRICE_PREVIEW_TIMEOUT_MS);
      }),
    ]);
  }

  function checkoutSuccessUrl() {
    if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
      throw new Error("Paddle Checkout requires an HTTP or HTTPS page");
    }

    return new URL("/purchase-success/", window.location.origin).href;
  }

  async function initializeCheckout() {
    offerLabelElement.textContent = activeOffer.label;

    if (!CLIENT_TOKEN_PATTERN.test(PADDLE_CONFIG.clientToken)) {
      showFallback("Localized pricing will appear when checkout setup is complete.");
      checkoutStatus.textContent = "Checkout is not configured yet.";
      return;
    }

    if (!window.Paddle) {
      showFallback("Localized pricing is temporarily unavailable. Checkout will confirm your total.");
      checkoutStatus.textContent = "Checkout is temporarily unavailable. Please try again later.";
      return;
    }

    try {
      const successUrl = checkoutSuccessUrl();

      window.Paddle.Environment.set(PADDLE_CONFIG.environment);
      window.Paddle.Initialize({
        token: PADDLE_CONFIG.clientToken,
        checkout: {
          settings: {
            displayMode: "overlay",
            variant: "one-page",
            theme: "light",
            successUrl,
          },
        },
      });

      setCheckoutReady();

      try {
        const result = await previewWithTimeout({
          items: [{ priceId: activeOffer.priceId, quantity: 1 }],
        });
        const lineItem = result?.data?.details?.lineItems?.find(
          (item) => item.price?.id === activeOffer.priceId,
        );
        const localizedTotal = lineItem?.formattedTotals?.total;

        if (lineItem?.product?.id !== PADDLE_CONFIG.productId || !localizedTotal) {
          throw new Error("Paddle returned an unexpected price preview");
        }

        priceElement.textContent = localizedTotal;
        priceElement.setAttribute("aria-busy", "false");
        priceNoteElement.textContent = "One-time total estimated by Paddle for your location.";
      } catch (error) {
        console.warn("Fibich localized price preview failed", error);
        showFallback("Localized pricing is temporarily unavailable. Checkout will confirm your total.");
      }
    } catch (error) {
      console.error("Fibich Paddle Checkout initialization failed", error);
      showFallback("Localized pricing is temporarily unavailable. Checkout will confirm your total.");
      checkoutStatus.textContent = "Checkout is temporarily unavailable. Please try again later.";
    }
  }

  checkoutButton.addEventListener("click", () => {
    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: activeOffer.priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          theme: "light",
          successUrl: checkoutSuccessUrl(),
        },
      });
    } catch (error) {
      console.error("Fibich Paddle Checkout failed to open", error);
      checkoutStatus.textContent = "Checkout could not open. Please try again.";
    }
  });

  initializeCheckout();
})();
