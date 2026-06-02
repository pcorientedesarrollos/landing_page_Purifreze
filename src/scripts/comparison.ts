// Controlador client-side de la seccion de comparacion: calculadora de ahorro,
// filtros de la tabla y sincronizacion con el CMS.

import {
  PURIFREZE_PRICE_MONTHLY,
  LIMITS,
  CATEGORY_ICONS,
  COMPARISON_ROWS_BY_ID,
  isComparisonBadge,
  type CmsComparisonBadge,
  type ComparisonBadge,
  type ComparisonCategory,
} from "../data/comparison";
import { fetchContentSection } from "./cms";

function appendIcon(parent: HTMLElement, icon: string, className: string) {
  if (!icon) return;
  const element = document.createElement("i");
  element.className = `fa-solid ${icon} ${className}`;
  parent.append(element);
}

function appendBadge(parent: HTMLElement, badge: ComparisonBadge) {
  const element = document.createElement("span");
  element.className = `badge ${badge.variant}`;
  element.textContent = badge.text;
  parent.append(element);
}

// Construye una fila enriqueciendo los textos del CMS con los iconos y badges
// definidos localmente; usa respaldos por categoria si el id es desconocido.
function buildRow(badge: CmsComparisonBadge): HTMLTableRowElement {
  const meta = COMPARISON_ROWS_BY_ID.get(badge.id);

  const row = document.createElement("tr");
  row.className = "table-row";
  row.dataset.category = badge.category;

  const feature = document.createElement("td");
  feature.className = "feature-cell";
  appendIcon(
    feature,
    meta?.featureIcon ??
      CATEGORY_ICONS[badge.category as ComparisonCategory] ??
      "fa-tag",
    "category-icon",
  );
  feature.append(document.createTextNode(badge.feature));

  const purifreze = document.createElement("td");
  purifreze.className = "value-cell purifreze";
  if (meta?.purifrezeCheck ?? true) {
    appendIcon(purifreze, "fa-check-circle", "check-icon");
  }
  const purifrezeValue = document.createElement("span");
  purifrezeValue.className = "value";
  purifrezeValue.textContent = badge.purifrezeText;
  purifreze.append(purifrezeValue);
  if (meta?.purifrezeBadge) appendBadge(purifreze, meta.purifrezeBadge);

  const garrafones = document.createElement("td");
  garrafones.className = "value-cell garrafon";
  appendIcon(
    garrafones,
    meta?.garrafonesIcon ?? "fa-times-circle",
    meta?.garrafonesIconClass ?? "cross-icon",
  );
  const garrafonesValue = document.createElement("span");
  garrafonesValue.className = "value";
  garrafonesValue.textContent = badge.garrafonesText;
  if (meta?.garrafonesValueId) garrafonesValue.id = meta.garrafonesValueId;
  garrafones.append(garrafonesValue);
  if (meta?.garrafonesBadge) appendBadge(garrafones, meta.garrafonesBadge);

  row.append(feature, purifreze, garrafones);
  return row;
}

function renderComparisonBadges(badges: CmsComparisonBadge[]) {
  const rows = document.getElementById("comparisonRows");
  if (!rows) return;

  rows.replaceChildren();
  badges
    .filter((badge) => badge.isVisible !== false)
    .forEach((badge) => rows.append(buildRow(badge)));
}

async function loadComparisonBadges() {
  const comparison = await fetchContentSection("comparison");
  const badges = comparison?.content?.badges;
  if (!Array.isArray(badges) || !badges.every(isComparisonBadge)) return;

  renderComparisonBadges(badges);
  initTableFilters();
  updateTableMonthlyCost();
}

function updateTableMonthlyCost() {
  const quantity = parseInt(
    (document.getElementById("garrafonesSlider") as HTMLInputElement | null)
      ?.value || `${LIMITS.garrafones.min}`,
  );
  const price = parseInt(
    (document.getElementById("precioInput") as HTMLInputElement | null)
      ?.value || `${LIMITS.precio.min}`,
  );
  const tableCost = document.getElementById("tableGarrafonesCost");
  if (tableCost) {
    tableCost.textContent = `$${(quantity * price).toLocaleString("es-MX")}+`;
  }
}

function initCalculator() {
  const slider = document.getElementById(
    "garrafonesSlider",
  ) as HTMLInputElement;
  const garrafonesInput = document.getElementById(
    "garrafonesInput",
  ) as HTMLInputElement;
  const precioInput = document.getElementById(
    "precioInput",
  ) as HTMLInputElement;
  const gastoMensual = document.getElementById("gastoMensual");

  const costDisplay = document.getElementById("garrafonesCost");
  const garrafonesQty = document.getElementById("garrafonesQty");

  const savingsCard = document.getElementById("savingsCard");
  const savingsLabel = document.getElementById("savingsLabel");
  const savingsAmount = document.getElementById("savingsAmount");
  const savingsAnnual = document.getElementById("savingsAnnual");
  const savingsIcon = savingsCard?.querySelector(".savings-icon i");

  function syncInputs(source: "slider" | "input") {
    if (!slider || !garrafonesInput) return;
    if (source === "slider") {
      garrafonesInput.value = slider.value;
    } else {
      let value = parseInt(garrafonesInput.value);
      if (isNaN(value) || value < 0) value = 0;
      if (value > LIMITS.garrafones.max) value = LIMITS.garrafones.max;
      garrafonesInput.value = value.toString();
      slider.value = value.toString();
    }
    updateCalculation();
  }

  function validatePrecio() {
    if (!precioInput) return;
    let value = parseInt(precioInput.value);
    if (isNaN(value) || value < 0) value = 0;
    if (value > LIMITS.precio.max) value = LIMITS.precio.max;
    precioInput.value = value.toString();
    updateCalculation();
  }

  function updateCalculation() {
    // 1. Obtener datos
    const garrafonesAlMes = parseInt(
      slider?.value || `${LIMITS.garrafones.min}`,
    );
    const precioPorGarrafon = parseInt(
      precioInput?.value || `${LIMITS.precio.min}`,
    );

    // 2. Calculos (todo mensual)
    const gastoMensualActual = garrafonesAlMes * precioPorGarrafon;
    const diferencia = gastoMensualActual - PURIFREZE_PRICE_MONTHLY;
    const ahorroAnual = diferencia * 12;

    // 3. Actualizar UI general
    if (gastoMensual) {
      gastoMensual.textContent = `$${gastoMensualActual.toLocaleString("es-MX")}`;
      gastoMensual.classList.add("updating");
      setTimeout(() => gastoMensual?.classList.remove("updating"), 200);
    }
    if (costDisplay)
      costDisplay.textContent = gastoMensualActual.toLocaleString("es-MX");
    if (garrafonesQty)
      garrafonesQty.textContent = garrafonesAlMes.toString();
    const tableGarrafonesCost = document.getElementById("tableGarrafonesCost");
    if (tableGarrafonesCost)
      tableGarrafonesCost.textContent = `$${gastoMensualActual.toLocaleString("es-MX")}+`;

    // 4. Tarjeta de resultados (verde vs morado)
    if (savingsCard && savingsLabel && savingsAmount) {
      // ESCENARIO 1: ahorro (garrafones mas caros)
      if (diferencia > 0) {
        savingsCard.className = "savings-card positive";
        savingsLabel.textContent = "¡Tu ahorro mensual!";

        if (savingsAmount)
          savingsAmount.textContent = `$${diferencia.toLocaleString("es-MX")}`;
        if (savingsAnnual)
          savingsAnnual.textContent = `$${ahorroAnual.toLocaleString("es-MX")} ahorrados al año`;

        if (savingsIcon) savingsIcon.className = "fa-solid fa-piggy-bank";
      }
      // ESCENARIO 2: valor premium (Purifreze mas caro)
      else {
        savingsCard.className = "savings-card premium";

        const costoExtra = Math.abs(diferencia).toLocaleString("es-MX");
        savingsLabel.innerHTML = `Es una diferencia de <strong>$${costoExtra}</strong>, pero con Purifreze obtienes:`;

        if (savingsIcon) savingsIcon.className = "fa-solid fa-gem";
      }

      // Reiniciar animacion pequena
      savingsCard.style.animation = "none";
      setTimeout(() => {
        if (savingsCard) savingsCard.style.animation = "";
      }, 10);
    }
  }

  // Listeners
  slider?.addEventListener("input", () => syncInputs("slider"));
  garrafonesInput?.addEventListener("input", () => syncInputs("input"));
  precioInput?.addEventListener("input", validatePrecio);

  updateCalculation();
}

function initTableFilters() {
  const filterButtons =
    document.querySelectorAll<HTMLElement>(".filter-btn");
  const tableRows = document.querySelectorAll<HTMLElement>(".table-row");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      tableRows.forEach((row) => {
        if (category === "all" || row.dataset.category === category) {
          row.classList.remove("hidden");
        } else {
          row.classList.add("hidden");
        }
      });
    });
  });
}

export function initComparison() {
  initCalculator();
  initTableFilters();
  loadComparisonBadges();
}
