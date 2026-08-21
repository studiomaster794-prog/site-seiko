(function initStudioAnalytics() {
  const measurementId = "G-R0SY9PRV7X";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    transport_type: "beacon",
  });

  const loader = document.createElement("script");
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(loader);

  window.trackStudioEvent = function trackStudioEvent(eventName, parameters = {}) {
    window.gtag("event", eventName, {
      page_path: window.location.pathname,
      ...parameters,
    });
  };

  function closestSectionName(element) {
    const section = element.closest("section[id]");
    if (section) return section.id;
    if (element.closest("header")) return "cabecalho";
    if (element.closest("footer")) return "rodape";
    return "pagina";
  }

  function closestItemName(element) {
    const card = element.closest("article, .contact-item, .footer-column");
    const heading = card?.querySelector("h2, h3, strong");
    return heading?.textContent.trim().slice(0, 100) || undefined;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    const linkText = link.textContent.trim().replace(/\s+/g, " ").slice(0, 100);
    const parameters = {
      link_text: linkText,
      section_id: closestSectionName(link),
      item_name: closestItemName(link),
    };

    if (href.includes("wa.me/")) {
      window.trackStudioEvent("whatsapp_click", parameters);
    } else if (href.includes("google.com/maps")) {
      window.trackStudioEvent("maps_click", parameters);
    } else if (href.includes("instagram.com")) {
      window.trackStudioEvent("instagram_click", parameters);
    } else if (href.startsWith("tel:")) {
      window.trackStudioEvent("phone_click", parameters);
    } else if (href.includes("servicos/")) {
      window.trackStudioEvent("service_details_click", {
        ...parameters,
        destination: href,
      });
    }
  });
})();
