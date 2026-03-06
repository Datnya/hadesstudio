import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, name, ...rest } = req.body;
    if (!userId || !name) return res.status(400).json({ error: 'Missing userId or name' });

    try {
        const project = await prisma.project.create({
            data: {
                userId,
                name,
                data: JSON.stringify(rest),
            }
        });

        res.status(200).json({ success: true, fileName: project.id });
    } catch (error: any) {
        res.status(500).json({ error: 'Save failed: ' + error.message });
    }
}
