import React from "react";
import { AbsoluteFill, Video, staticFile, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { SubtitleChunk } from "./SubtitleOverlay";
import { SUBTITLES } from "./subtitles";
import { SUBTITLE_STYLE, WORDS_PER_CHUNK } from "./config";

// Carga Poppins automáticamente
const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

// ── Helper: divide texto en grupos de N palabras ──────────────────
function chunkText(text: string, n: number): string[][] {
  const words = text.trim().split(/\s+/);
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += n) {
    chunks.push(words.slice(i, i + n));
  }
  return chunks;
}

// ── Composición principal ─────────────────────────────────────────
export const MyComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>

      {/* ── Video de fondo ─────────────────────────────────── */}
      <Video
        src={staticFile("video.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* ── Capa de subtítulos ─────────────────────────────── */}
      <AbsoluteFill
        style={{
          fontFamily,
          fontSize: 67,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.2px",
          lineHeight: 1.25,
        }}
      >
        {SUBTITLES.map((seg) => {
          // Divide el segmento en bloques de max 3 palabras
          const chunks = chunkText(seg.text, WORDS_PER_CHUNK);
          const chunkDuration = Math.round(seg.durationInFrames / chunks.length);

          return (
            // Sequence del segmento completo (visible en el timeline Studio)
            <Sequence
              key={seg.id}
              name={`Sub ${seg.id}`}
              from={seg.from}
              durationInFrames={seg.durationInFrames}
              layout="none"
            >
              {chunks.map((chunk, cIdx) => (
                // Sequence de cada bloque de 3 palabras
                <Sequence
                  key={cIdx}
                  name={`"${chunk.join(" ")}"`}
                  from={cIdx * chunkDuration}
                  durationInFrames={chunkDuration}
                  layout="none"
                >
                  <SubtitleChunk
                    words={chunk}
                    style={SUBTITLE_STYLE}
                    totalDuration={chunkDuration}
                  />
                </Sequence>
              ))}
            </Sequence>
          );
        })}
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
