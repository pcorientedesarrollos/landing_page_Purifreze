// Helper compartido para consumir el CMS de secciones de contenido.
// Centraliza el patron repetido de fetch + find por key que usaban
// Comparison.astro y VideoSection.astro.

export interface ContentSection {
  key?: string;
  isVisible?: boolean;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

export function getApiUrl(): string {
  return import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
}

// Devuelve la seccion con la `key` indicada, o null ante error/ausencia.
// Las secciones estaticas del componente quedan visibles cuando el CMS no
// responde.
export async function fetchContentSection(
  key: string,
): Promise<ContentSection | null> {
  try {
    const response = await fetch(`${getApiUrl()}/content-sections`);
    if (!response.ok) return null;
    const sections = await response.json();
    if (!Array.isArray(sections)) return null;
    return (
      sections.find(
        (section: { key?: string }) => section.key === key,
      ) ?? null
    );
  } catch {
    return null;
  }
}

// Resuelve rutas de uploads del backend a URLs absolutas; deja intactas las
// URLs externas.
export function resolveUploadUrl(url: string, apiUrl: string): string {
  return url.startsWith("/uploads/") ? `${apiUrl}${url}` : url;
}
