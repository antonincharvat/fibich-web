(function () {
  const productionHosts = new Set(["fibich.app", "www.fibich.app"]);
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  const isLocalTest =
    localHosts.has(window.location.hostname) &&
    window.location.search.indexOf("counter-test") !== -1;

  if (!productionHosts.has(window.location.hostname) && !isLocalTest) {
    return;
  }

  const namespace = "antonincharvat";
  const counterName = "fibich";
  const formatDay = () => {
    if (window.Intl && typeof window.Intl.DateTimeFormat === "function") {
      return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Prague",
      }).format(new Date());
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
  };
  const day = formatDay();
  const sessionKey = `${counterName}:visit-counted:${day}`;

  const storage = {
    get(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (_) {
        // Visit counting should still work when session storage is unavailable.
      }
    },
  };

  if (storage.get(sessionKey)) {
    return;
  }

  const encodedNamespace = encodeURIComponent(namespace);
  const increment = (name) => {
    const encodedName = encodeURIComponent(name);
    const url = `https://api.counterapi.dev/v1/${encodedNamespace}/${encodedName}/up`;

    if (typeof window.fetch === "function") {
      return window.fetch(url, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        keepalive: true,
      });
    }

    return new Promise((resolve, reject) => {
      if (typeof window.XMLHttpRequest !== "function") {
        const image = new Image();

        image.onload = () => resolve({ ok: true });
        image.onerror = () => resolve({ ok: true });
        image.src = url;

        return;
      }

      const request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.onload = () => {
        resolve({ ok: request.status >= 200 && request.status < 300 });
      };
      request.onerror = reject;
      request.send();
    });
  };

  increment(`${counterName}-${day}`)
    .then((response) => {
      if (response.ok) {
        storage.set(sessionKey, "true");
        increment(counterName).catch(() => {
          // The daily counter is the source of truth for stats.
        });
      }
    })
    .catch(() => {
      // Visit counting should never affect the site experience.
    });
})();
