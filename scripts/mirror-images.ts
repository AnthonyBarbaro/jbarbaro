import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { brands } from "../src/data/brands";
import { ctaTiles, heroSlides } from "../src/data/home";
import { locations } from "../src/data/locations";
import { tailoredSwatches, tailoringHeroImage, tailoringInsetImage } from "../src/data/tailored";

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");

const manualUrls = [
  "https://www.jasonbarbaro.com/assets/media/2020/05/logo_trans.png",
  "https://www.macombnowmagazine.com/wp-content/uploads/2017/09/fashion_bombaro.jpg",
  "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/h3lg.jpg",
];

function toLocalPublicPath(url: string) {
  const parsed = new URL(url);
  return `/images/remote/${parsed.hostname}${parsed.pathname}`;
}

function toDiskPath(localPublicPath: string) {
  return path.join(publicDir, localPublicPath.replace(/^\//, ""));
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function gatherMdxImageUrls() {
  const contentDirs = ["content/blog", "content/style-guide"];
  const urls: string[] = [];

  for (const dir of contentDirs) {
    const absDir = path.join(projectRoot, dir);
    const entries = await fs.readdir(absDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mdx")) {
        continue;
      }

      const fullPath = path.join(absDir, entry.name);
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = matter(raw);
      const image = parsed.data.image;

      if (typeof image === "string" && image.startsWith("http")) {
        urls.push(image);
      }
    }
  }

  return urls;
}

async function gatherAllImageUrls() {
  const urls = new Set<string>();

  for (const url of manualUrls) {
    urls.add(url);
  }

  for (const slide of heroSlides) {
    urls.add(slide.image);
  }

  for (const tile of ctaTiles) {
    urls.add(tile.image);
  }

  for (const brand of brands) {
    if (brand.image.startsWith("http")) {
      urls.add(brand.image);
    }

    if (brand.logo.startsWith("http")) {
      urls.add(brand.logo);
    }
  }

  for (const location of locations) {
    if (location.photo.startsWith("http")) {
      urls.add(location.photo);
    }
  }

  if (tailoringHeroImage.startsWith("http")) {
    urls.add(tailoringHeroImage);
  }

  if (tailoringInsetImage.startsWith("http")) {
    urls.add(tailoringInsetImage);
  }

  for (const swatch of tailoredSwatches) {
    if (swatch.thumb.startsWith("http")) {
      urls.add(swatch.thumb);
    }

    if (swatch.full.startsWith("http")) {
      urls.add(swatch.full);
    }
  }

  const mdxUrls = await gatherMdxImageUrls();
  for (const url of mdxUrls) {
    urls.add(url);
  }

  return [...urls].sort();
}

async function downloadImage(url: string) {
  const localPublicPath = toLocalPublicPath(url);
  const diskPath = toDiskPath(localPublicPath);

  if (await fileExists(diskPath)) {
    return { url, localPublicPath, status: "exists" as const };
  }

  await fs.mkdir(path.dirname(diskPath), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL did not return an image: ${url} (${contentType || "unknown content-type"})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(diskPath, buffer);

  return { url, localPublicPath, status: "downloaded" as const };
}

async function main() {
  const urls = await gatherAllImageUrls();
  console.log(`Found ${urls.length} image URLs to mirror.`);

  let downloaded = 0;
  let existing = 0;

  for (const [index, url] of urls.entries()) {
    const result = await downloadImage(url);
    if (result.status === "downloaded") {
      downloaded += 1;
    } else {
      existing += 1;
    }

    console.log(`[${index + 1}/${urls.length}] ${result.status.toUpperCase()} ${url} -> ${result.localPublicPath}`);
  }

  console.log(`Done. Downloaded: ${downloaded}, Existing: ${existing}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
