import { put } from "@vercel/blob";
import fs from "fs";

export async function uploadVideoToBlob(
  filePath: string,
  filename: string
): Promise<string> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
    // In mock mode return a placeholder
    return "https://example.com/mock-video.mp4";
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = await put(filename, fileBuffer, {
    access: "public",
    contentType: "video/mp4",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to cleanup ${filePath}:`, err);
  }
}
