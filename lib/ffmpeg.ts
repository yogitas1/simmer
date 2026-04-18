import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { RecipeStep } from "@/types/recipe";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TMP_DIR = "/tmp";

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
  });
}

function createFallbackClip(
  outputPath: string,
  step: RecipeStep
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a solid color placeholder clip with step title
    ffmpeg()
      .input("color=c=2c2c2c:size=1280x720:rate=30")
      .inputFormat("lavfi")
      .input("anullsrc=r=44100:cl=stereo")
      .inputFormat("lavfi")
      .outputOptions([
        "-t 5",
        "-c:v libx264",
        "-c:a aac",
        "-pix_fmt yuv420p",
        "-vf",
        `drawtext=text='${step.title.replace(/'/g, "\\'")}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2`,
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function addTextOverlay(
  inputPath: string,
  outputPath: string,
  step: RecipeStep
): Promise<void> {
  return new Promise((resolve, reject) => {
    const text = step.title
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-pix_fmt yuv420p",
        "-vf",
        `drawtext=text='Step ${step.step_number}\\: ${text}':fontcolor=white:fontsize=24:x=20:y=h-th-20:box=1:boxcolor=black@0.6:boxborderw=8`,
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function concatenateClips(
  clipPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const listFile = path.join(TMP_DIR, `concat_${Date.now()}.txt`);
    const listContent = clipPaths
      .map((p) => `file '${p}'`)
      .join("\n");
    fs.writeFileSync(listFile, listContent);

    ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c:v libx264", "-c:a aac", "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", () => {
        fs.unlinkSync(listFile);
        resolve();
      })
      .on("error", (err) => {
        try {
          fs.unlinkSync(listFile);
        } catch {}
        reject(err);
      })
      .run();
  });
}

export async function assembleVideo(
  videoUrls: (string | null)[],
  steps: RecipeStep[]
): Promise<string> {
  const timestamp = Date.now();
  const downloadedPaths: string[] = [];
  const overlaidPaths: string[] = [];

  // Step 1: Download or create fallback clips
  for (let i = 0; i < steps.length; i++) {
    const url = videoUrls[i];
    const step = steps[i];
    const rawPath = path.join(TMP_DIR, `clip_raw_${timestamp}_${i}.mp4`);
    const overlaidPath = path.join(
      TMP_DIR,
      `clip_overlay_${timestamp}_${i}.mp4`
    );

    if (!url || url === "FALLBACK") {
      await createFallbackClip(rawPath, step);
    } else {
      await downloadFile(url, rawPath);
    }

    await addTextOverlay(rawPath, overlaidPath, step);
    downloadedPaths.push(rawPath);
    overlaidPaths.push(overlaidPath);
  }

  // Step 2: Concatenate
  const outputPath = path.join(TMP_DIR, `output_${timestamp}.mp4`);
  await concatenateClips(overlaidPaths, outputPath);

  // Cleanup intermediate files
  for (const p of [...downloadedPaths, ...overlaidPaths]) {
    try {
      fs.unlinkSync(p);
    } catch {}
  }

  return outputPath;
}
