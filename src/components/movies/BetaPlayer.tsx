import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export function BetaPlayer({ src, onClose }: { src: string, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (Hls.isSupported() && src) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current!);
      return () => {
        hls.destroy();
      };
    } else if (videoRef.current) {
      // Some browsers (Safari) support HLS natively
      videoRef.current.src = src;
    }
  }, [src]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
      <button
        className="absolute top-6 right-6 bg-white text-black rounded-lg px-4 py-2 shadow-lg"
        onClick={onClose}
      >Close Beta Player</button>
      <video
        ref={videoRef}
        controls
        autoPlay
        className="rounded-md shadow-lg max-w-2xl w-full"
        style={{ background: "#000" }}
      />
    </div>
  );
}
