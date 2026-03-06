import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    const id = req.query.file as string;
    const userId = req.query.userId as string;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

    try {
        await prisma.project.delete({
            where: { id, userId }
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Delete failed: ' + error.message });
    }
}
