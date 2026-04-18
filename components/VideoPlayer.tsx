"use client";

import { useRef } from "react";

interface Props {
  src: string;
  title?: string;
}

export default function VideoPlayer({ src, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full aspect-video"
        style={{ display: "block" }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
