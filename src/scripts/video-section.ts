// Controlador client-side de la galeria de videos: reemplaza el video local por
// los videos administrados desde el CMS cuando estan disponibles.

import { fetchVideos, getApiUrl, resolveUploadUrl, type ApiVideo } from "./cms";

type CmsVideo = ApiVideo;

function buildVideoCard(video: CmsVideo, apiUrl: string) {
  const card = document.createElement("article");
  card.className = `video-card ${video.vertical ? "vertical" : "horizontal"}`;

  const frame = document.createElement("div");
  frame.className = "video-frame";
  const player = document.createElement("video");
  player.controls = true;
  player.playsInline = true;
  player.preload = "metadata";
  const source = document.createElement("source");
  source.src = resolveUploadUrl(video.url, apiUrl);
  source.type = "video/mp4";
  player.append(
    source,
    document.createTextNode("Tu navegador no soporta video HTML5."),
  );
  frame.append(player);

  const copy = document.createElement("div");
  copy.className = "video-card-copy";
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-circle-play";
  const title = document.createElement("span");
  title.textContent = video.title;
  copy.append(icon, title);

  card.append(copy, frame);
  return card;
}

function renderVideos(videos: CmsVideo[], apiUrl: string) {
  const section = document.querySelector<HTMLElement>(".video-gallery-section");
  const grid = document.getElementById("videoGalleryGrid");
  if (!section || !grid) return;

  const visibleVideos = videos.filter((video) => video.isVisible !== false);
  section.hidden = visibleVideos.length === 0;
  grid.replaceChildren();

  grid.append(...visibleVideos.map((video) => buildVideoCard(video, apiUrl)));
  initVideoCarousel();
}

function initVideoCarousel() {
  const grid = document.getElementById("videoGalleryGrid");
  const previous = document.getElementById("videoCarouselPrevious");
  const next = document.getElementById("videoCarouselNext");
  const dots = document.getElementById("videoCarouselDots");
  if (!grid || !previous || !next || !dots) return;
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(".video-card"));
  dots.replaceChildren();
  if (cards.length === 0) {
    previous.hidden = true;
    next.hidden = true;
    return;
  }

  const cardLeft = (card: HTMLElement) => card.offsetLeft - grid.offsetLeft;
  const select = (index: number) => {
    const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (!target) return;
    grid.scrollTo({ left: cardLeft(target), behavior: "smooth" });
  };
  const activeIndex = () => cards.reduce((best, card, index) => Math.abs(cardLeft(card) - grid.scrollLeft) < Math.abs(cardLeft(cards[best]) - grid.scrollLeft) ? index : best, 0);
  const refresh = () => {
    const visibleCount = window.matchMedia("(min-width: 768px)").matches ? 3 : 1;
    const hasOverflow = cards.length > visibleCount;
    previous.hidden = !hasOverflow;
    next.hidden = !hasOverflow;
    dots.querySelectorAll(".video-carousel-dot").forEach((dot, index) => dot.classList.toggle("active", index === activeIndex()));
  };

  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `video-carousel-dot ${index === 0 ? "active" : ""}`;
    dot.setAttribute("aria-label", `Mostrar video ${index + 1}`);
    dot.addEventListener("click", () => select(index));
    dots.append(dot);
  });
  previous.onclick = () => select(activeIndex() - 1);
  next.onclick = () => select(activeIndex() + 1);
  grid.onscroll = () => requestAnimationFrame(refresh);
  window.addEventListener("resize", refresh);
  refresh();
}

async function loadCmsVideos() {
  const videos = await fetchVideos("gallery");
  if (videos.length === 0) return;
  renderVideos(videos, getApiUrl());
}

export function initVideoSection() {
  initVideoCarousel();
  loadCmsVideos();
}
