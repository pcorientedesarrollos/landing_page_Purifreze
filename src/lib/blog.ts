export interface BlogCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export type BlogBlock =
  | { id: string; type: "paragraph"; data: { text: string } }
  | { id: string; type: "heading"; data: { text: string; level: 2 | 3 } }
  | { id: string; type: "list"; data: { items: string[] } }
  | { id: string; type: "link"; data: { text: string; url: string } }
  | { id: string; type: "image"; data: { url: string; alt: string } };

export interface BlogPost extends BlogCard { blocks: BlogBlock[]; }
export interface BlogPage { items: BlogCard[]; page: number; pageSize: number; total: number; pageCount: number; }

const apiUrl = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
export const mediaUrl = (path: string | null) => path?.startsWith("/uploads/") ? `${apiUrl}${path}` : path;

export async function fetchBlogPage(page: number): Promise<BlogPage> {
  const response = await fetch(`${apiUrl}/blog/posts?page=${page}&pageSize=9`);
  if (!response.ok) throw new Error("Blog API unavailable");
  return response.json();
}

export async function fetchBlogPost(slug: string): Promise<{ post: BlogPost; canonicalSlug: string } | null> {
  const response = await fetch(`${apiUrl}/blog/posts/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Blog API unavailable");
  return response.json();
}
