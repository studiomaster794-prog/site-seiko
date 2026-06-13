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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    galleryItems.forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.category !== filter;
    });
  });
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("p");
const lightboxClose = lightbox?.querySelector(".lightbox-close");

document.querySelectorAll("[data-gallery]").forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = item.dataset.gallery;
    lightboxImage.alt = item.dataset.alt;
    lightboxCaption.textContent = item.dataset.alt;
    lightbox.showModal();
  });
});

lightboxClose?.addEventListener("click", () => lightbox.close());
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
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
