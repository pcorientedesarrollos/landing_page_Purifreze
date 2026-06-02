// Controlador client-side de preguntas frecuentes: conserva el contenido local
// como respaldo y lo reemplaza cuando el CMS entrega una seccion valida.

import { fetchContentSection } from "./cms";

interface CmsFaq {
  id: string;
  question: string;
  answer: string;
  isVisible?: boolean;
}

function isCmsFaq(faq: unknown): faq is CmsFaq {
  if (!faq || typeof faq !== "object") return false;
  const item = faq as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.question === "string" &&
    typeof item.answer === "string" &&
    (item.isVisible === undefined || typeof item.isVisible === "boolean")
  );
}

function buildFaq(faq: CmsFaq, index: number) {
  const card = document.createElement("div");
  card.className =
    "bg-slate-50 rounded-2xl overflow-hidden transition-all hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className =
    "faq-toggle w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none group";
  toggle.dataset.faqIndex = `${index}`;

  const question = document.createElement("span");
  question.className = "font-bold text-lg text-slate-800";
  question.textContent = faq.question;

  const icon = document.createElement("i");
  icon.className =
    "fa-solid fa-plus text-slate-400 text-sm transition-transform duration-300 faq-icon";

  const answer = document.createElement("div");
  answer.className = "faq-content hidden px-8 pb-6 text-slate-600 leading-relaxed";
  answer.textContent = faq.answer;

  toggle.append(question, icon);
  card.append(toggle, answer);
  return card;
}

function initializeFaqAccordions() {
  document.querySelectorAll<HTMLElement>(".faq-toggle").forEach((toggle) => {
    if (toggle.dataset.initialized === "true") return;
    toggle.dataset.initialized = "true";
    toggle.addEventListener("click", () => {
      const content = toggle.nextElementSibling as HTMLElement | null;
      const icon = toggle.querySelector<HTMLElement>(".faq-icon");
      const isClosed = content?.classList.contains("hidden");
      content?.classList.toggle("hidden", !isClosed);
      icon?.classList.toggle("rotate-45", isClosed);
      icon?.classList.toggle("text-brand-blue", isClosed);
      icon?.classList.toggle("text-slate-400", !isClosed);
    });
  });
}

async function loadCmsFaqs() {
  const section = document.getElementById("faqSection");
  const list = document.getElementById("faqList");
  if (!section || !list) return;

  const faqSection = await fetchContentSection("faq");
  if (!faqSection) return;
  if (faqSection.isVisible === false) {
    section.hidden = true;
    return;
  }

  const faqs = faqSection.content?.faqs;
  if (!Array.isArray(faqs) || !faqs.every(isCmsFaq)) return;

  const visibleFaqs = faqs.filter((faq) => faq.isVisible !== false);
  const displayedFaqs =
    section.dataset.preview === "true" ? visibleFaqs.slice(0, 5) : visibleFaqs;
  section.hidden = displayedFaqs.length === 0;
  list.replaceChildren(...displayedFaqs.map(buildFaq));
  initializeFaqAccordions();
}

export function initFaqSection() {
  initializeFaqAccordions();
  loadCmsFaqs();
}
