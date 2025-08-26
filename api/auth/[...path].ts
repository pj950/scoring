import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import cookie from 'cookie';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-that-is-at-least-32-chars-long');
const COOKIE_NAME = 'auth_token';

async function verifyToken(token: string | undefined) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (e) {
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new Pool({ connectionString: process.env.DATABASE_URL });
    const { path } = req.query;

    try {
        const route = Array.isArray(path) ? path.join('/') : path;

        if (req.method === 'POST' && route === 'login') {
            const { loginCode, adminCode } = req.body;
            
            if (loginCode === adminCode) {
                 const payload = { role: 'ADMIN', sub: 'admin_user' };
                 const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1d').sign(JWT_SECRET);
                 res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/', maxAge: 86400 }));
                 return res.status(200).json({ success: true, role: 'ADMIN' });
            }

            const { rows } = await client.query('SELECT * FROM judges WHERE secret_id = $1', [loginCode]);
            if (rows.length > 0) {
                const judge = rows[0];
                const payload = { role: 'JUDGE', sub: judge.id, user: judge };
                const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1d').sign(JWT_SECRET);
                res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/', maxAge: 86400 }));
                return res.status(200).json({ success: true, role: 'JUDGE', user: judge });
            }

            return res.status(401).json({ error: 'Invalid login code' });
        }

        if (req.method === 'GET' && route === 'session') {
            const token = req.cookies[COOKIE_NAME];
            const payload = await verifyToken(token);
            if (payload) {
                return res.status(200).json(payload);
            }
            return res.status(401).json({ error: 'No active session' });
        }

        if (req.method === 'POST' && route === 'logout') {
            res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/', expires: new Date(0) }));
            return res.status(200).json({ success: true });
        }

        res.status(404).json({ error: 'Not Found' });

    } catch (error) {
        console.error('Auth API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
    }
}
