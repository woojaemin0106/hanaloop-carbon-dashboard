import {
  companies as seedCompanies,
  countries as seedCountries,
  posts as seedPosts,
} from "@/features/company-emissions/seed-data";
import type { Company, Country, Post } from "@/features/company-emissions/types";

let countries: Country[] = [...seedCountries];
let companies: Company[] = [...seedCompanies];
let posts: Post[] = [...seedPosts];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;

export async function fetchCountries() {
  await delay(jitter());
  return countries;
}

export async function fetchCompanies() {
  await delay(jitter());
  return companies;
}

export async function fetchPosts() {
  await delay(jitter());
  return posts;
}

export async function createOrUpdatePost(post: Omit<Post, "id"> & { id?: string }) {
  await delay(jitter());

  if (maybeFail()) {
    throw new Error("Save failed");
  }

  if (post.id) {
    posts = posts.map((item) => (item.id === post.id ? (post as Post) : item));
    return post as Post;
  }

  const created = {
    ...post,
    id: crypto.randomUUID(),
  };
  posts = [...posts, created];
  return created;
}

export function resetFakeBackend() {
  countries = [...seedCountries];
  companies = [...seedCompanies];
  posts = [...seedPosts];
}
