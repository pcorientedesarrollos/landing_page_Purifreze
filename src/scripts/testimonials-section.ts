// Controlador client-side de testimonios: conserva las historias locales como
// respaldo y las sustituye cuando el CMS entrega testimonios válidos.

import { fetchContentSection, getApiUrl, resolveUploadUrl } from "./cms";

interface CmsTestimonial {
  id: string;
  name: string;
  label: string;
  url: string;
  featured: boolean;
  isVisible?: boolean;
}

function isCmsTestimonial(value: unknown): value is CmsTestimonial {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.label === "string" &&
    typeof item.url === "string" &&
    typeof item.featured === "boolean" &&
    (item.isVisible === undefined || typeof item.isVisible === "boolean")
  );
}

function stars() {
  const row = document.createElement("div");
  row.className = "flex gap-1 mt-3";
  for (let index = 0; index < 5; index += 1) {
    const star = document.createElement("i");
    star.className = "fa-solid fa-star text-sm testimonial-star";
    row.append(star);
  }
  return row;
}

function buildTestimonial(item: CmsTestimonial, apiUrl: string) {
  const shell = document.createElement("div");
  shell.className = `testimonial-shell group relative ${item.featured ? "md:-translate-y-6" : ""}`;

  const card = document.createElement("div");
  card.className = `testimonial-card rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${item.featured ? "featured" : ""}`;

  const frame = document.createElement("div");
  frame.className = "relative aspect-[9/16] overflow-hidden bg-slate-900";
  const video = document.createElement("video");
  video.src = resolveUploadUrl(item.url, apiUrl);
  video.className = "absolute inset-0 w-full h-full object-cover";
  video.controls = true;
  video.preload = "metadata";
  video.append(document.createTextNode("Tu navegador no soporta videos HTML5."));
  const overlay = document.createElement("div");
  overlay.className = "testimonial-overlay absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none z-10";
  frame.append(video, overlay);

  const copy = document.createElement("div");
  copy.className = "p-6 relative z-20";
  const profile = document.createElement("div");
  profile.className = "flex items-center gap-3 mb-2";
  const avatar = document.createElement("div");
  avatar.className = "testimonial-avatar w-10 h-10 rounded-full flex items-center justify-center";
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-user";
  avatar.append(icon);
  const text = document.createElement("div");
  const name = document.createElement("p");
  name.className = "testimonial-name font-bold leading-tight";
  name.textContent = item.name;
  const label = document.createElement("p");
  label.className = "testimonial-label text-xs font-semibold uppercase tracking-wider mt-1";
  label.textContent = item.label;
  text.append(name, label);
  profile.append(avatar, text);
  copy.append(profile, stars());
  card.append(frame, copy);
  shell.append(card);

  if (item.featured) {
    const badge = document.createElement("div");
    badge.className = "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg z-30";
    badge.innerHTML = '<div class="flex items-center gap-2"><i class="fa-solid fa-crown text-white text-xs"></i><span class="text-xs font-black text-white uppercase tracking-wider">Destacado</span></div>';
    shell.append(badge);
  }
  return shell;
}

async function loadCmsTestimonials() {
  const section = document.getElementById("testimonialsSection");
  const grid = document.getElementById("testimonialsGrid");
  if (!section || !grid) return;
  const cms = await fetchContentSection("testimonials");
  if (!cms) return;
  if (cms.isVisible === false) {
    section.hidden = true;
    return;
  }
  const items = cms.content?.testimonials;
  if (!Array.isArray(items) || !items.every(isCmsTestimonial)) return;
  const visible = items.filter((item) => item.isVisible !== false);
  if (items.length === 0) return;
  section.hidden = visible.length === 0;
  grid.replaceChildren(...visible.map((item) => buildTestimonial(item, getApiUrl())));
  initTestimonialsCarousel();
}

export function initTestimonialsSection() {
  initTestimonialsCarousel();
  loadCmsTestimonials();
}

function initTestimonialsCarousel() {
  const track = document.getElementById("testimonialsGrid");
  const previous = document.getElementById("testimonialsPrevious");
  const next = document.getElementById("testimonialsNext");
  const dots = document.getElementById("testimonialsDots");
  if (!track || !previous || !next || !dots) return;
  const cards = Array.from(track.children).filter((item): item is HTMLElement => item instanceof HTMLElement);
  const visibleCount = () => window.matchMedia("(min-width: 768px)").matches ? 3 : 1;
  const activeIndex = () => cards.reduce((best, card, index) => Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - track.scrollLeft) ? index : best, 0);
  const select = (index: number) => cards[Math.max(0, Math.min(index, cards.length - 1))]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  const refresh = () => {
    const active = activeIndex();
    const hasOverflow = cards.length > visibleCount();
    previous.hidden = !hasOverflow;
    next.hidden = !hasOverflow;
    dots.querySelectorAll(".testimonials-dot").forEach((dot, index) => dot.classList.toggle("active", index === active));
  };
  dots.replaceChildren();
  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `testimonials-dot ${index === 0 ? "active" : ""}`;
    dot.setAttribute("aria-label", `Mostrar testimonio ${index + 1}`);
    dot.addEventListener("click", () => select(index));
    dots.append(dot);
  });
  previous.onclick = () => select(activeIndex() - 1);
  next.onclick = () => select(activeIndex() + 1);
  track.onscroll = () => requestAnimationFrame(refresh);
  window.onresize = refresh;
  refresh();
}
