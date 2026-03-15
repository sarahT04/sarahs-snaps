import type { APIRoute } from "astro";
import { imagekit, urlEndpoint } from "@/lib/imagekit";
import { getAllMetadata } from "@/lib/metadata";
import {
  commitFilesToGithub,
  type GithubFileChange,
} from "@/lib/github-content";

const WIDTH_NUM = 350;
const HEIGHT_NUM = 350;

type PhotoMeta = {
  id: string;
  city: string;
  title: string;
  tags?: string[];
  date: string;
  description?: string;
  image: {
    src: string;
    width: number;
    height: number;
    thumbnail?: { src: string };
  };
};

type UploadQueueItem = {
  clientFileName: string;
  meta: PhotoMeta;
};

type UploadSuccessDraft = {
  fileName: string;
  url: string;
  mdxPath: string;
  mdxContent: string;
};

/**
 * Converts a string into a safe URL segment by normalizing it to lowercase,
 * removing special characters, and collapsing multiple hyphens.
 *
 * @param value - The string value to convert into a safe segment
 * @returns A normalized string safe for use in URLs or file paths
 *
 * @example
 * ```typescript
 * toSafeSegment("Hello World!") // "hello-world"
 * toSafeSegment("My Photo @ 2024") // "my-photo-2024"
 * toSafeSegment("---test---") // "test"
 * ```
 */
const toSafeSegment = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getExtension = (fileName: string) => {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot) : "";
};

const getBaseName = (fileName: string) => {
  const extension = getExtension(fileName);
  if (!extension) return fileName;
  return fileName.slice(0, -extension.length);
};

const yamlString = (value: string) => JSON.stringify(value);

const buildMdxContent = (meta: PhotoMeta) => {
  const tagsBlock = meta.tags?.length
    ? `tags:\n${meta.tags.map((tag) => `  - ${yamlString(tag)}`).join("\n")}`
    : "tags: []";

  const description = (meta.description || "No description was provided for this picture.").trim();

  return `---
id: ${meta.id}
title: ${yamlString(meta.title)}
${tagsBlock}
date: ${yamlString(meta.date)}
image:
  src: ${yamlString(meta.image.src)}
  width: ${meta.image.width}
  height: ${meta.image.height}${meta.image.thumbnail?.src ? `\n  thumbnail:\n    src: ${yamlString(meta.image.thumbnail.src)}` : ""}
---

${description}
`;
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { token, expire, signature } = imagekit.helper.getAuthenticationParameters();

  try {
    const formData = await request.formData();
    const queueRaw = formData.get("queue");
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!queueRaw || typeof queueRaw !== "string") {
      return new Response(JSON.stringify({ error: "Missing queue payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const queue = JSON.parse(queueRaw) as UploadQueueItem[];
    if (!Array.isArray(queue) || queue.length === 0) {
      return new Response(JSON.stringify({ error: "Queue is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileMap = new Map(files.map((file) => [file.name, file]));
    
    // Use local metadata.json to get current counts
    const metadata = getAllMetadata();
    const metadataMap = new Map(metadata.map((city) => [city.city, city]));
    const numberByCity = new Map<string, number>();
    
    const uploadDrafts: UploadSuccessDraft[] = [];
    const results: Array<{ fileName: string; url: string; mdxPath: string; commitSha: string }> = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (const item of queue) {
      const sourceFile = fileMap.get(item.clientFileName);
      if (!sourceFile) {
        errors.push({
          fileName: item.clientFileName,
          error: "Uploaded file payload not found",
        });
        continue;
      }

      try {
        const city = toSafeSegment(item.meta.city || "");
        if (!city) {
          throw new Error("City is required");
        }

        // Get next number from metadata.json count
        let currentNumber: number;
        if (numberByCity.has(city)) {
          currentNumber = (numberByCity.get(city) as number) + 1;
        } else {
          const cityMeta = metadataMap.get(city);
          currentNumber = cityMeta ? cityMeta.count + 1 : 1;
        }
        numberByCity.set(city, currentNumber);

        const paddedNumber = String(currentNumber).padStart(3, "0");
        const ext = getExtension(sourceFile.name);
        const safeBaseName = toSafeSegment(getBaseName(item.meta.id || sourceFile.name)) || `photo-${paddedNumber}`;
        const uploadFileName = `${safeBaseName}${ext}`;

        const base64File = Buffer.from(await sourceFile.arrayBuffer()).toString("base64");
        const mimeType = sourceFile.type || "application/octet-stream";
        const dataUri = `data:${mimeType};base64,${base64File}`;
        const uploaded = await imagekit.files.upload({
          token,
          signature,
          expire,
          file: dataUri,
          fileName: uploadFileName,
          folder: `/${city}`,
          useUniqueFileName: true,
          tags: item.meta.tags,
        });

        const srcUrl = uploaded.url;
        if (!srcUrl) {
          throw new Error("ImageKit upload succeeded but returned no URL");
        }
        const thumbUrl = imagekit.helper.buildSrc({ src: srcUrl, urlEndpoint, transformation: [{ width: WIDTH_NUM, height: HEIGHT_NUM }]});

        const mdxMeta: PhotoMeta = {
          ...item.meta,
          id: `${city}-${paddedNumber}`,
          title: item.meta.title || safeBaseName,
          date: item.meta.date || new Date().toISOString().slice(0, 10),
          image: {
            src: srcUrl,
            width: item.meta.image?.width || 0,
            height: item.meta.image?.height || 0,
            thumbnail: { src: thumbUrl },
          },
        };

        const mdxContent = buildMdxContent(mdxMeta);
        const mdxPath = `src/content/photos/${city}/${paddedNumber}.mdx`;

        uploadDrafts.push({
          fileName: sourceFile.name,
          url: srcUrl,
          mdxPath,
          mdxContent,
        });
      } catch (error) {
        errors.push({
          fileName: item.clientFileName,
          error: error instanceof Error ? error.message : "Unknown upload error",
        });
      }
    }

    // Update metadata.json with new counts
    const updatedMetadata = metadata.map((cityMeta) => {
      const newCount = numberByCity.get(cityMeta.city);
      return newCount ? { ...cityMeta, count: newCount } : cityMeta;
    });
    
    const updatedMetadataJson = JSON.stringify(updatedMetadata, null, 2) + "\n";

    // Commit all MDX files + metadata.json in a single commit
    if (uploadDrafts.length > 0) {
      const commitFiles: GithubFileChange[] = uploadDrafts.map((entry) => ({
        path: entry.mdxPath,
        content: entry.mdxContent,
      }));
      
      // Add metadata.json to the commit
      commitFiles.push({
        path: "src/content/metadata.json",
        content: updatedMetadataJson,
      });

      try {
        const commit = await commitFilesToGithub(
          commitFiles,
          `chore(content): add ${uploadDrafts.length} photo(s) + update metadata`,
        );

        for (const entry of uploadDrafts) {
          results.push({
            fileName: entry.fileName,
            url: entry.url,
            mdxPath: entry.mdxPath,
            commitSha: commit.commitSha,
          });
        }
      } catch (error) {
        for (const entry of uploadDrafts) {
          errors.push({
            fileName: entry.fileName,
            error: error instanceof Error
              ? `MDX commit failed: ${error.message}`
              : "MDX commit failed",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        uploaded: results.length,
        failed: errors.length,
        results,
        errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("ImageKit upload API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process upload request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
