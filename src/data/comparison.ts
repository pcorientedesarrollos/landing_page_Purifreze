// Fuente de verdad de la calculadora y la tabla comparativa.
// Importable tanto desde el frontmatter de Astro (build) como desde el
// controlador client-side, para evitar duplicar datos y constantes.

// Precio mensual fijo de la suscripcion Purifreze (MXN).
export const PURIFREZE_PRICE_MONTHLY = 370;

// Valores iniciales de la calculadora.
export const DEFAULTS = {
  garrafones: 9,
  precio: 45,
} as const;

// Limites de los inputs de la calculadora.
export const LIMITS = {
  garrafones: { min: 1, max: 30 },
  precio: { min: 1, max: 200 },
} as const;

export type ComparisonCategory =
  | "cost"
  | "convenience"
  | "quality"
  | "health"
  | "environment";

// Iconos de cada categoria, usados como respaldo cuando una fila del CMS no
// tiene metadatos locales.
export const CATEGORY_ICONS: Record<ComparisonCategory, string> = {
  cost: "fa-tag",
  convenience: "fa-truck",
  quality: "fa-award",
  health: "fa-heart-pulse",
  environment: "fa-leaf",
};

export interface ComparisonBadge {
  text: string;
  variant: "success" | "warning";
}

export interface ComparisonRow {
  id: string;
  category: ComparisonCategory;
  feature: string;
  featureIcon: string;
  // Columna Purifreze
  purifrezeText: string;
  purifrezeCheck: boolean;
  purifrezeBadge?: ComparisonBadge;
  // Columna Garrafones
  garrafonesText: string;
  garrafonesIcon: string;
  garrafonesIconClass: string;
  garrafonesBadge?: ComparisonBadge;
  // id del <span> de valor (lo usa la calculadora para actualizar el costo)
  garrafonesValueId?: string;
}

// Gasto inicial en garrafones mostrado en la fila de costo.
const INITIAL_GARRAFONES_COST = DEFAULTS.garrafones * DEFAULTS.precio;

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: "monthly-cost",
    category: "cost",
    feature: "Precio Mensual",
    featureIcon: "fa-tag",
    purifrezeText: `Desde $${PURIFREZE_PRICE_MONTHLY}`,
    purifrezeCheck: false,
    purifrezeBadge: { text: "Fijo", variant: "success" },
    garrafonesText: `$${INITIAL_GARRAFONES_COST}+`,
    garrafonesIcon: "",
    garrafonesIconClass: "",
    garrafonesBadge: { text: "Variable", variant: "warning" },
    garrafonesValueId: "tableGarrafonesCost",
  },
  {
    id: "microplastics",
    category: "quality",
    feature: "Microplásticos",
    featureIcon: "fa-microscope",
    purifrezeText: "Libre de microplásticos",
    purifrezeCheck: true,
    garrafonesText: "Presentes por envase",
    garrafonesIcon: "fa-times-circle",
    garrafonesIconClass: "cross-icon",
  },
  {
    id: "filtration",
    category: "quality",
    feature: "Filtración",
    featureIcon: "fa-filter",
    purifrezeText: "Recién filtrada (5 etapas)",
    purifrezeCheck: true,
    garrafonesText: "Almacenada semanas",
    garrafonesIcon: "fa-question-circle",
    garrafonesIconClass: "neutral-icon",
  },
  {
    id: "physical-effort",
    category: "convenience",
    feature: "Esfuerzo físico",
    featureIcon: "fa-weight-hanging",
    purifrezeText: "Sin cargar peso",
    purifrezeCheck: true,
    garrafonesText: "Cargar garrafones pesados",
    garrafonesIcon: "fa-times-circle",
    garrafonesIconClass: "cross-icon",
  },
  {
    id: "bpa-toxins",
    category: "health",
    feature: "BPA y Toxinas",
    featureIcon: "fa-flask",
    purifrezeText: "Libre de BPA",
    purifrezeCheck: true,
    garrafonesText: "Riesgo por calor/sol",
    garrafonesIcon: "fa-triangle-exclamation",
    garrafonesIconClass: "warning-icon",
  },
  {
    id: "carbon-footprint",
    category: "environment",
    feature: "Huella de Carbono",
    featureIcon: "fa-recycle",
    purifrezeText: "Mínima (Sin transporte)",
    purifrezeCheck: true,
    garrafonesText: "Alta (Camiones reparto)",
    garrafonesIcon: "fa-smog",
    garrafonesIconClass: "cross-icon",
  },
];

// Acceso rapido por feature text para enriquecer las filas que llegan del CMS
// con los iconos y badges definidos localmente. Las filas nuevas o renombradas
// caen al fallback por categoria.
export const COMPARISON_ROWS_BY_FEATURE = new Map(
  COMPARISON_ROWS.map((row) => [row.feature, row]),
);

// Forma de cada fila tal como la entrega el CMS (solo textos).
export interface CmsComparisonBadge {
  id: number;
  category: ComparisonCategory;
  feature: string;
  purifrezeText: string;
  garrafonesText: string;
  isVisible?: boolean;
}
