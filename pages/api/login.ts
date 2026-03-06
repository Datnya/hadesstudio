import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username: email }]
            }
        });

        if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        // En un sistema real usaríamos JWT o Session. 
        // Por ahora devolvemos el user para que el editor.html lo guarde en localStorage
        res.status(200).json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
}
