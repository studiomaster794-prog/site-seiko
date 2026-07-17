document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeMenu() {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  mobileNav.hidden = true;
  document.body.classList.remove("menu-open");
  menuToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
  renderIcons();
}

menuToggle?.addEventListener("click", () => {
  const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
  mobileNav.hidden = !willOpen;
  document.body.classList.toggle("menu-open", willOpen);
  menuToggle.innerHTML = willOpen
    ? '<i data-lucide="x" aria-hidden="true"></i>'
    : '<i data-lucide="menu" aria-hidden="true"></i>';
  renderIcons();
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const storyToggle = document.querySelector("[data-story-toggle]");
const storyMore = document.querySelector("#story-more");

storyToggle?.addEventListener("click", () => {
  const isOpen = storyToggle.getAttribute("aria-expanded") === "true";
  storyToggle.setAttribute("aria-expanded", String(!isOpen));
  storyMore.hidden = isOpen;
  storyToggle.querySelector("span").textContent = isOpen ? "Continuar lendo" : "Mostrar menos";
});

const filterButtons = document.querySelectorAll("[data-filter]");
const galleryItems = document.querySelectorAll("[data-category]");
const galleryMoreBtn = document.querySelector("[data-gallery-more]");
const GALLERY_LIMIT = 9;
let galleryExpanded = false;

function applyGalleryVisibility() {
  const activeFilter = document.querySelector("[data-filter].is-active")?.dataset.filter || "all";
  let shown = 0;
  let matchCount = 0;

  galleryItems.forEach((item) => {
    const matches = activeFilter === "all" || item.dataset.category === activeFilter;
    if (!matches) {
      item.hidden = true;
      return;
    }
    matchCount += 1;
    if (!galleryExpanded && shown >= GALLERY_LIMIT) {
      item.hidden = true;
      return;
    }
    item.hidden = false;
    shown += 1;
  });

  if (galleryMoreBtn) {
    const needsToggle = matchCount > GALLERY_LIMIT;
    galleryMoreBtn.hidden = !needsToggle;
    galleryMoreBtn.setAttribute("aria-expanded", String(galleryExpanded));
    const label = galleryMoreBtn.querySelector("span");
    if (label) {
      label.textContent = galleryExpanded ? "Ver menos" : "Ver mais fotos";
    }
    galleryMoreBtn.classList.toggle("is-expanded", galleryExpanded);
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    galleryExpanded = false;
    applyGalleryVisibility();
  });
});

galleryMoreBtn?.addEventListener("click", () => {
  galleryExpanded = !galleryExpanded;
  applyGalleryVisibility();
  renderIcons();
});

applyGalleryVisibility();

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("p");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
let lightboxTrigger = null;

document.querySelectorAll("[data-gallery]").forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightboxTrigger = item;
    lightboxImage.src = item.dataset.gallery;
    lightboxImage.alt = item.dataset.alt;
    lightboxCaption.textContent = item.dataset.alt;
    lightbox.showModal();
  });
});

function closeLightbox() {
  lightbox?.close();
  if (lightboxTrigger) {
    lightboxTrigger.focus();
    lightboxTrigger = null;
  }
}

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox?.addEventListener("close", () => {
  if (lightboxTrigger) {
    lightboxTrigger.focus();
    lightboxTrigger = null;
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.open) {
    closeLightbox();
  }
});

const observer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (observer) {
    observer.observe(element);
  } else {
    element.classList.add("is-visible");
  }
});

renderIcons();


// Corrige o link "Início": rola a página para o topo
document.querySelectorAll('a[href="#inicio"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMenu();
  });
});

// Hero video: autoplay seguro, pause fora da aba/viewport e reduced-motion
(function initHeroVideo() {
  const video = document.querySelector(".hero-video");
  if (!video) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    video.pause();
    video.removeAttribute("autoplay");
    return;
  }

  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        /* Autoplay bloqueado: o poster permanece visível */
      });
    }
  };

  tryPlay();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      video.pause();
    } else {
      tryPlay();
    }
  });

  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tryPlay();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );
    heroObserver.observe(video);
  }
})();

// FAQ accordion
(function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!button || !answer) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";

      // Fecha os demais (um aberto por vez)
      items.forEach((other) => {
        if (other === item) return;
        const otherBtn = other.querySelector(".faq-question");
        const otherAnswer = other.querySelector(".faq-answer");
        other.classList.remove("is-open");
        otherBtn?.setAttribute("aria-expanded", "false");
        if (otherAnswer) otherAnswer.hidden = true;
      });

      button.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
      item.classList.toggle("is-open", !isOpen);
    });
  });
})();

// Evita dois botões de WhatsApp empilhados no celular (float some no hero)
(function initWhatsappFloatVisibility() {
  const floatBtn = document.querySelector(".whatsapp-float");
  const hero = document.querySelector(".hero");
  if (!floatBtn || !hero) return;

  if (!("IntersectionObserver" in window)) {
    floatBtn.classList.remove("is-hidden-by-hero");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Esconde o float enquanto o hero ainda ocupa a tela
        floatBtn.classList.toggle("is-hidden-by-hero", entry.isIntersecting);
      });
    },
    {
      // some quando o hero ainda está razoavelmente visível
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  observer.observe(hero);
})();
