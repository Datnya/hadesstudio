import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import { SubtitleStyle } from "./config";

// ══════════════════════════════════════════════════════════════════
//  ESTILO 1: KARAOKE ─ Palabra activa en amarillo (TikTok style)
// ══════════════════════════════════════════════════════════════════
const KaraokeWord: React.FC<{
    word: string;
    idx: number;
    active: number;
}> = ({ word, idx, active }) => {
    const isActive = idx === active;
    const isFuture = idx > active;

    return (
        <span
            style={{
                display: "inline-block",
                paddingRight: "0.32em",
                color: isActive ? "#FFD60A" : "#ffffff",
                textShadow: isActive
                    ? "0 0 28px rgba(255,214,10,.9), 0 0 8px rgba(255,214,10,.5), 0 2px 10px rgba(0,0,0,.6)"
                    : "0 2px 10px rgba(0,0,0,.5)",
                transform: `scale(${isActive ? 1.12 : 1})`,
                transformOrigin: "center bottom",
                opacity: isFuture ? 0.42 : 1,
                transition: "color .08s, transform .08s, opacity .08s",
                willChange: "color, transform",
            }}
        >
            {word}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════
//  ESTILO 2: WORD POP ─ Palabras entran rebotando una por una
// ══════════════════════════════════════════════════════════════════
const WordPopWord: React.FC<{
    word: string;
    idx: number;
    active: number;
    wordDuration: number;
}> = ({ word, idx, active, wordDuration }) => {
    const frame = useCurrentFrame(); // relativo al chunk
    const { fps } = useVideoConfig();
    const isActive = idx === active;

    const wordStart = idx * wordDuration;
    const localFrame = frame - wordStart;

    const entered = localFrame >= 0;

    const progress = spring({
        fps,
        frame: Math.max(0, localFrame),
        config: { mass: 0.55, stiffness: 320, damping: 22 },
    });

    const opacity = interpolate(localFrame, [0, 5], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    const translateY = interpolate(progress, [0, 1], [30, 0]);
    const scale = interpolate(progress, [0, 1], [0.35, 1]);

    return (
        <span
            style={{
                display: "inline-block",
                paddingRight: "0.32em",
                opacity: entered ? opacity : 0,
                transform: entered ? `translateY(${translateY}px) scale(${scale})` : "translateY(30px) scale(0.35)",
                color: isActive ? "#FFD60A" : "#ffffff",
                textShadow: isActive
                    ? "0 0 20px rgba(255,214,10,.7)"
                    : "0 2px 10px rgba(0,0,0,.5)",
                willChange: "transform, opacity",
            }}
        >
            {word}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════
//  ESTILO 3: NEON ─ Palabra activa con brillo neón índigo
// ══════════════════════════════════════════════════════════════════
const NeonWord: React.FC<{
    word: string;
    idx: number;
    active: number;
}> = ({ word, idx, active }) => {
    const isActive = idx === active;
    const isPast = idx < active;
    const isFuture = idx > active;

    return (
        <span
            style={{
                display: "inline-block",
                paddingRight: "0.32em",
                color: isActive ? "#ffffff" : isPast ? "#a5b4fc" : "#e2e8f0",
                opacity: isFuture ? 0.28 : 1,
                textShadow: isActive
                    ? "0 0 6px #fff, 0 0 18px #818cf8, 0 0 38px #6366f1, 0 0 70px #4f46e5"
                    : isPast
                        ? "0 0 12px rgba(165,180,252,.5)"
                        : "none",
                transform: `scale(${isActive ? 1.1 : 1})`,
                transformOrigin: "center bottom",
                transition: "color .12s, text-shadow .12s, opacity .12s, transform .1s",
                willChange: "color, text-shadow",
            }}
        >
            {word}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════
//  CHUNK PRINCIPAL ─ Renderiza las palabras según el estilo
// ══════════════════════════════════════════════════════════════════
export const SubtitleChunk: React.FC<{
    words: string[];
    style: SubtitleStyle;
    totalDuration: number;
}> = ({ words, style, totalDuration }) => {
    const frame = useCurrentFrame();
    const N = words.length;
    const wordDuration = Math.max(1, Math.floor(totalDuration / N));

    // Qué palabra está activa ahora (0, 1 o 2)
    const activeIdx = Math.min(Math.floor(frame / wordDuration), N - 1);

    // Fade in/out del contenedor completo
    const fadeIn = interpolate(frame, [0, 5], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    const fadeOut = interpolate(frame, [totalDuration - 7, totalDuration], [1, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

    // Fondo según estilo
    const bgStyle: React.CSSProperties =
        style === "neon"
            ? {
                background: "rgba(0,0,12,0.62)",
                border: "1px solid rgba(99,102,241,.3)",
                borderRadius: 14,
                padding: "18px 30px 20px",
                boxShadow: "0 0 30px rgba(99,102,241,.15)",
            }
            : {
                background: "rgba(0,0,0,0.50)",
                borderRadius: 18,
                padding: "18px 30px 20px",
            };

    return (
        <div
            style={{
                position: "absolute",
                bottom: 110,
                left: 36,
                right: 36,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                opacity: fadeIn * fadeOut,
            }}
        >
            <div
                style={{
                    ...bgStyle,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {words.map((word, i) => {
                    if (style === "karaoke") {
                        return <KaraokeWord key={i} word={word} idx={i} active={activeIdx} />;
                    } else if (style === "word-pop") {
                        return (
                            <WordPopWord key={i} word={word} idx={i} active={activeIdx} wordDuration={wordDuration} />
                        );
                    } else {
                        return <NeonWord key={i} word={word} idx={i} active={activeIdx} />;
                    }
                })}
            </div>
        </div>
    );
};
