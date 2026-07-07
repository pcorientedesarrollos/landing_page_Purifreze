export interface BlogCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverColor: string | null;
  coverIcon: string | null;
  coverSize: "small" | "medium" | "large" | null;
  category: string | null;
  authorName: string | null;
  authorInitials: string | null;
  readMin: number | null;
  views: number;
  publishedAt: string | null;
}

export type BlogBlock =
  | { id: string; type: "paragraph"; data: { text: string } }
  | { id: string; type: "heading"; data: { text: string; level: 2 | 3 } }
  | { id: string; type: "list"; data: { items: string[] } }
  | { id: string; type: "link"; data: { text: string; url: string } }
  | { id: string; type: "image"; data: { url: string; alt: string } }
  | { id: string; type: "quote"; data: { text: string } }
  | { id: string; type: "callout"; data: { text: string } };

export interface BlogPost extends BlogCard {
  blocks: BlogBlock[];
  updatedAt: string;
  createdAt: string;
}

export interface BlogPage {
  items: BlogCard[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface SeoMetadata {
  metaTitle: string | null;
  metaDesc: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
}

const apiUrl = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
export const mediaUrl = (path: string | null) =>
  path?.startsWith("/uploads/") ? `${apiUrl}${path}` : path;

// Deriva la URL absoluta de la variante OG optimizada (<uuid>-og.jpg) que el
// backend genera al subir. Para posts viejos sin variante, esta URL da 404
// hasta re-subir la imagen (aceptado). Si el path no matchea, cae a la cover.
export const ogImageUrl = (path: string | null) => {
  if (!path) return null;
  const match = path.match(/^\/uploads\/images\/([0-9a-f-]{36})\.[a-z]+$/i);
  if (!match) return mediaUrl(path);
  return `${apiUrl}/uploads/images/${match[1]}-og.jpg`;
};

export async function fetchBlogPage(page: number): Promise<BlogPage> {
  const response = await fetch(`${apiUrl}/blog/posts?page=${page}&pageSize=9`);
  if (!response.ok) throw new Error("Blog API unavailable");
  return response.json();
}

export async function fetchBlogPost(
  slug: string,
): Promise<{ post: BlogPost; canonicalSlug: string } | null> {
  const response = await fetch(`${apiUrl}/blog/posts/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Blog API unavailable");
  const text = await response.text();
  if (!text) throw new Error("Blog API empty response");
  return JSON.parse(text);
}

export async function fetchSeo(
  entityType: string,
  entityId: string | number,
): Promise<SeoMetadata | null> {
  try {
    const r = await fetch(
      `${apiUrl}/seo/${entityType}/${encodeURIComponent(String(entityId))}`,
    );
    if (!r.ok) return null;
    const text = await r.text();
    return text ? (JSON.parse(text) as SeoMetadata) : null;
  } catch {
    return null;
  }
}
