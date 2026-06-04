// Helpers compartidos para consumir endpoints del CMS por seccion.
// Cada helper devuelve [] cuando la API falla; los componentes Astro
// mantienen fallback estatico para esos casos.

export function getApiUrl(): string {
  return import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
}

async function fetchList<T>(path: string): Promise<T[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${getApiUrl()}${path}`, { signal: controller.signal });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
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
  placement?: "gallery" | "uses";
  vertical: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface ApiUseCard {
  id: number;
  type: "text" | "image" | "video";
  title: string;
  description: string | null;
  icon: string | null;
  mediaUrl: string | null;
  altText: string | null;
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

export function fetchVideos(placement?: ApiVideo["placement"]): Promise<ApiVideo[]> {
  const query = placement ? `?placement=${encodeURIComponent(placement)}` : "";
  return fetchList<ApiVideo>(`/videos${query}`);
}

export function fetchUseCards(): Promise<ApiUseCard[]> {
  return fetchList<ApiUseCard>("/use-cards");
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
