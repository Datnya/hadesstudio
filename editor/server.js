const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 3001;
const EDITOR_HTML = path.join(__dirname, 'editor.html');
const SUBTITLES_TS = path.join(__dirname, '../src/subtitles.ts');
const CONFIG_TS = path.join(__dirname, '../src/config.ts');

// Directorio temporal para videos uploadados
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Directorio para guardar proyectos (.json)
const PROJECTS_DIR = path.join(__dirname, 'projects');
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// Ruta del video activo (puede cambiar por upload)
let activeVideoPath = path.join(__dirname, '../public/video.mp4');


// ── Genera subtitles.ts ───────────────────────────────────────────
function buildSubtitlesFile(subtitles) {
    const lines = [
        `// ── Configuración ────────────────────────────────────────────────`,
        `export const FPS = 30;`,
        ``,
        `export interface SubtitleSegment {`,
        `  id: number;`,
        `  from: number;`,
        `  durationInFrames: number;`,
        `  text: string;`,
        `}`,
        ``,
        `// Generado por el Editor Visual — ${new Date().toLocaleString('es-PE')}`,
        `export const SUBTITLES: SubtitleSegment[] = [`,
    ];
    subtitles.forEach((seg, i) => {
        const ss = (seg.from / 30).toFixed(2);
        const ds = (seg.durationInFrames / 30).toFixed(2);
        lines.push(`  {`);
        lines.push(`    id: ${seg.id},`);
        lines.push(`    from: ${seg.from},               // ${ss}s`);
        lines.push(`    durationInFrames: ${seg.durationInFrames},  // ${ds}s`);
        lines.push(`    text: "${seg.text.replace(/"/g, '\\"')}",`);
        lines.push(`  }${i < subtitles.length - 1 ? ',' : ''}`);
    });
    lines.push(`];`);
    return lines.join('\n');
}

// ── Genera config.ts ──────────────────────────────────────────────
function buildConfigFile(style) {
    const valid = ['karaoke', 'word-pop', 'neon'];
    const safeStyle = valid.includes(style) ? style : 'karaoke';
    return `// ── Configuración Global de Subtítulos ───────────────────────────
export type SubtitleStyle = 'karaoke' | 'word-pop' | 'neon';

// 🎨 ESTILO ACTIVO — cambiado desde el Editor Visual
export const SUBTITLE_STYLE: SubtitleStyle = '${safeStyle}';

// Máximo de palabras por bloque
export const WORDS_PER_CHUNK = 3;
`;
}

// ── Detectar ffmpeg ───────────────────────────────────────────────
function detectFfmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return 'ffmpeg';
    } catch {
        // Rutas comunes en Windows
        const paths = [
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            path.join(process.env.USERPROFILE || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) return p;
        }
        return null;
    }
}

// ── Genera video con subtítulos usando ffmpeg ─────────────────────
function burnSubtitles(videoPath, subtitles, style, posY, fontSize, outputPath, onProgress, onDone) {
    const ffmpeg = detectFfmpeg();
    if (!ffmpeg) {
        onDone(new Error('ffmpeg no encontrado. Instala ffmpeg para usar esta función.'));
        return;
    }

    // posY en % (0=arriba, 95=abajo) → convertir a expresión ffmpeg: (h * posY/100)
    const yFraction = (typeof posY === 'number' && !isNaN(posY)) ? posY / 100 : 0.85;
    const yExpr = `(h*${yFraction.toFixed(3)}-text_h/2)`;
    const fs = (typeof fontSize === 'number' && !isNaN(fontSize)) ? fontSize : 52;

    // Construir filtro de subtítulos con drawtext
    const FPS = 30;
    const filters = [];

    subtitles.forEach((seg, i) => {
        const startSec = seg.from / FPS;
        const endSec = (seg.from + seg.durationInFrames) / FPS;
        const words = seg.text.trim().split(/\s+/);
        const CHUNK = 3;
        const chunks = [];
        for (let c = 0; c < words.length; c += CHUNK) chunks.push(words.slice(c, c + CHUNK));
        const chunkDur = (endSec - startSec) / chunks.length;

        chunks.forEach((chunk, ci) => {
            const chStart = startSec + ci * chunkDur;
            const chEnd = chStart + chunkDur;
            const txt = chunk.join(' ').replace(/'/g, "\u2019").replace(/:/g, "\\:");
            filters.push(
                `drawtext=text='${txt}':` +
                `fontsize=${fs}:fontcolor=white:` +
                `box=1:boxcolor=black@0.5:boxborderw=8:` +
                `x=(w-text_w)/2:y=${yExpr}:` +
                `enable='between(t,${chStart.toFixed(3)},${chEnd.toFixed(3)})'`
            );
        });
    });

    const filterStr = filters.join(',');

    const args = [
        '-y',
        '-i', videoPath,
        '-vf', filterStr || 'null',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'copy',
        outputPath
    ];

    const proc = spawn(ffmpeg, args);
    let stderr = '';
    proc.stderr.on('data', d => {
        stderr += d.toString();
        const m = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/g);
        if (m && m.length > 0) {
            const last = m[m.length - 1].replace('time=', '');
            const parts = last.split(':');
            const secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
            onProgress(secs);
        }
    });
    proc.on('close', code => {
        if (code === 0) onDone(null);
        else onDone(new Error('ffmpeg error: ' + stderr.slice(-300)));
    });
}

// ── Servidor ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const url = req.url.split('?')[0];

    // ── Editor HTML ──
    if (url === '/' || url === '/editor') {
        try {
            const html = fs.readFileSync(EDITOR_HTML, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (e) { res.writeHead(500); res.end('Error: ' + e.message); }

        // ── Video (streaming) ──
    } else if (url === '/video.mp4') {
        try {
            const stat = fs.statSync(activeVideoPath);
            const range = req.headers.range;
            if (range) {
                const [s, e] = range.replace(/bytes=/, '').split('-');
                const start = parseInt(s, 10);
                const end = e ? parseInt(e, 10) : stat.size - 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': end - start + 1,
                    'Content-Type': 'video/mp4',
                });
                fs.createReadStream(activeVideoPath, { start, end }).pipe(res);
            } else {
                res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' });
                fs.createReadStream(activeVideoPath).pipe(res);
            }
        } catch (e) { res.writeHead(404); res.end('Video not found'); }

        // ── Upload de video ──
    } else if (url === '/upload-video' && req.method === 'POST') {
        const savePath = path.join(UPLOAD_DIR, 'current-video.mp4');
        const out = fs.createWriteStream(savePath);
        let size = 0;
        req.on('data', chunk => { size += chunk.length; out.write(chunk); });
        req.on('end', () => {
            out.end();
            activeVideoPath = savePath;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, size }));
        });
        req.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });

        // ── Guardar subtítulos ──
    } else if (url === '/save' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { subtitles, style } = JSON.parse(body);
                fs.writeFileSync(SUBTITLES_TS, buildSubtitlesFile(subtitles), 'utf8');
                if (style) fs.writeFileSync(CONFIG_TS, buildConfigFile(style), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });

        // ── Exportar video con subtítulos ──
    } else if (url === '/export-video' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { subtitles, style, subtitlePosY, subtitleFontSize } = JSON.parse(body);
                const posY = typeof subtitlePosY === 'number' ? subtitlePosY : 85;
                const fontSize = typeof subtitleFontSize === 'number' ? subtitleFontSize : 52;
                const outputPath = path.join(UPLOAD_DIR, 'reel-con-subtitulos.mp4');

                // Send SSE response
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                });

                burnSubtitles(
                    activeVideoPath,
                    subtitles,
                    style,
                    posY,
                    fontSize,
                    outputPath,
                    (secs) => {
                        res.write(`data: ${JSON.stringify({ progress: secs })}\n\n`);
                    },
                    (err) => {
                        if (err) {
                            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                        } else {
                            res.write(`data: ${JSON.stringify({ done: true, file: '/download-video' })}\n\n`);
                        }
                        res.end();
                    }
                );
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });

        // ── Descargar video exportado ──
    } else if (url === '/download-video') {
        const outputPath = path.join(UPLOAD_DIR, 'reel-con-subtitulos.mp4');
        try {
            const stat = fs.statSync(outputPath);
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="reel-con-subtitulos.mp4"',
            });
            fs.createReadStream(outputPath).pipe(res);
        } catch (e) { res.writeHead(404); res.end('Archivo no generado aún'); }

        // ── Check ffmpeg ──
    } else if (url === '/check-ffmpeg') {
        const ff = detectFfmpeg();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ available: !!ff, path: ff }));

        // ── Guardar proyecto JSON ──
    } else if (url === '/save-project' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // Nombre de archivo: timestamp + nombre personalizado
                const safeName = (data.name || 'proyecto').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚüÜñÑ ]/g, '').trim().replace(/\s+/g, '_');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const fileName = `${safeName}_${timestamp}.json`;
                const filePath = path.join(PROJECTS_DIR, fileName);
                // Guardar también la ruta del video activo
                data.videoPath = activeVideoPath;
                data.savedAt = new Date().toLocaleString('es-PE');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, fileName }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });

        // ── Listar proyectos guardados ──
    } else if (url === '/list-projects') {
        try {
            const files = fs.readdirSync(PROJECTS_DIR)
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    const filePath = path.join(PROJECTS_DIR, f);
                    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        fileName: f,
                        name: raw.name || f,
                        savedAt: raw.savedAt || '—',
                        segCount: (raw.subtitles || []).length,
                        style: raw.style || 'karaoke',
                        videoName: raw.videoName || '—'
                    };
                })
                .sort((a, b) => b.fileName.localeCompare(a.fileName)); // más reciente primero
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(files));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }

        // ── Cargar proyecto ──
    } else if (url.startsWith('/load-project')) {
        const params = new URLSearchParams(req.url.split('?')[1] || '');
        const fileName = params.get('file');
        if (!fileName || fileName.includes('..')) { res.writeHead(400); res.end('Invalid'); return; }
        try {
            const filePath = path.join(PROJECTS_DIR, fileName);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Restaurar el video activo si el archivo sigue existiendo
            if (data.videoPath && fs.existsSync(data.videoPath)) {
                activeVideoPath = data.videoPath;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (e) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proyecto no encontrado: ' + e.message }));
        }

        // ── Eliminar proyecto ──
    } else if (url.startsWith('/delete-project') && req.method === 'DELETE') {
        const params = new URLSearchParams(req.url.split('?')[1] || '');
        const fileName = params.get('file');
        if (!fileName || fileName.includes('..')) { res.writeHead(400); res.end('Invalid'); return; }
        try {
            fs.unlinkSync(path.join(PROJECTS_DIR, fileName));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }

        // ── Actualizar proyecto existente ──
    } else if (url.startsWith('/update-project') && req.method === 'PUT') {
        const params = new URLSearchParams(req.url.split('?')[1] || '');
        const fileName = params.get('file');
        if (!fileName || fileName.includes('..')) { res.writeHead(400); res.end('Invalid'); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filePath = path.join(PROJECTS_DIR, fileName);
                data.videoPath = activeVideoPath;
                data.savedAt = new Date().toLocaleString('es-PE');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, fileName }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });

    } else { res.writeHead(404); res.end('Not found'); }


});

server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🎬  SubtitlePro — Editor de Subtítulos     ║
  ║   http://localhost:${PORT}                       ║
  ╚══════════════════════════════════════════════╝`);
});
