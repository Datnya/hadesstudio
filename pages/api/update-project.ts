import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

    const id = req.query.file as string;
    const userId = req.query.userId as string;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

    try {
        const { name, ...rest } = req.body;
        const project = await prisma.project.update({
            where: { id, userId },
            data: {
                name,
                data: JSON.stringify(rest),
                savedAt: new Date()
            }
        });

        res.status(200).json({ success: true, fileName: project.id });
    } catch (error: any) {
        res.status(500).json({ error: 'Update failed: ' + error.message });
    }
}
