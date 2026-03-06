import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' });

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            }
        });

        res.status(200).json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Registration failed: ' + error.message });
    }
}
