import { Pool } from '@neondatabase/serverless';
import { VercelRequest } from '@vercel/node';

// This function is for Vercel Hobby tier to prevent connection exhaustion
export function createDbClient(req: VercelRequest) {
    const client = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    // This is a workaround for Vercel's hobby tier
    req.on('end', async () => {
        await client.end();
    });
    return client;
}
