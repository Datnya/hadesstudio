import { NextApiRequest, NextApiResponse } from 'next';
// import { renderMedia, bundle } from "@remotion/renderer";
import path from "path";
import fs from "fs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Nota: En Vercel Serverless, FFmpeg puede fallar por límites de tiempo o recursos.
    // Es altamente recomendable usar @remotion/lambda para producción.

    const { subtitles, style, subtitlePosY, subtitleFontSize } = req.body;
    const entry = path.resolve("src/index.ts");
    const outputLocation = `/tmp/video-${Date.now()}.mp4`;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    try {
        res.write(`data: ${JSON.stringify({ message: "Iniciando renderizado..." })}\n\n`);

        // En un sistema real, aquí llamaríamos a una función de renderizado.
        // Dado que estamos en Vercel, esto es experimental.

        // Si queremos emular el progreso para que la UI no se rompa:
        for (let i = 1; i <= 10; i++) {
            await new Promise(r => setTimeout(r, 500));
            res.write(`data: ${JSON.stringify({ progress: i / 10 })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ done: true, message: "Renderizado Mock completado (Usa Lambda para producción)" })}\n\n`);
        res.end();
    } catch (error: any) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
}
