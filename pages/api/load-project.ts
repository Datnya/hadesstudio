import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const id = req.query.file as string; // 'file' en el editor.html
    const userId = req.query.userId as string;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

    try {
        const project = await prisma.project.findFirst({
            where: { id, userId }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        const data = JSON.parse(project.data);
        res.status(200).json({
            name: project.name,
            savedAt: project.savedAt.toLocaleString(),
            ...data
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Load failed: ' + error.message });
    }
}
