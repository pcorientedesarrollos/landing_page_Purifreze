// Helpers compartidos para consumir endpoints del CMS por seccion.
// Cada helper devuelve [] cuando la API falla; los componentes Astro
// mantienen fallback estatico para esos casos.

export function getApiUrl(): string {
  return import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${getApiUrl()}${path}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

export interface ApiTestimonial {
  id: number;
  name: string;
  label: string;
  videoUrl: string;
  featured: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface ApiVideo {
  id: number;
  title: string;
  url: string;
  vertical: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface ApiComparisonRow {
  id: number;
  feature: string;
  category: string;
  purifrezeText: string;
  garrafonesText: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface ApiFaqItem {
  id: number;
  question: string;
  answer: string;
  isVisible: boolean;
  sortOrder: number;
}

export function fetchTestimonials(): Promise<ApiTestimonial[]> {
  return fetchList<ApiTestimonial>("/testimonials");
}

export function fetchVideos(): Promise<ApiVideo[]> {
  return fetchList<ApiVideo>("/videos");
}

export function fetchComparisonRows(): Promise<ApiComparisonRow[]> {
  return fetchList<ApiComparisonRow>("/comparison-rows");
}

export function fetchFaqItems(): Promise<ApiFaqItem[]> {
  return fetchList<ApiFaqItem>("/faq-items");
}

// Resuelve rutas de uploads del backend a URLs absolutas; deja intactas las URLs externas.
export function resolveUploadUrl(url: string, apiUrl: string): string {
  return url.startsWith("/uploads/") ? `${apiUrl}${url}` : url;
}
