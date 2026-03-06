import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { savedAt: 'desc' }
        });

        res.status(200).json(projects.map(p => ({
            fileName: p.id, // En lugar de fileName usamos el ID
            name: p.name,
            savedAt: p.savedAt.toLocaleString()
        })));
    } catch (error: any) {
        res.status(500).json({ error: 'Fetch failed: ' + error.message });
    }
}
