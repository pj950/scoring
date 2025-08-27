import express from 'express';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const app = express();
const port = 3000;

app.use(express.json());

// Test database connection
app.get('/test-db', async (req, res) => {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({
            error: 'DATABASE_URL not set',
            message: 'Please check your .env.local file'
        });
    }

    try {
        const client = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await client.query('SELECT NOW()');
        await client.end();
        
        res.json({
            success: true,
            message: 'Database connection successful',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            error: 'Database connection failed',
            message: error.message,
            details: error
        });
    }
});

// Test activeTeamIds endpoint
app.get('/api/data', async (req, res) => {
    const { entity } = req.query;
    
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({
            error: 'DATABASE_URL not set',
            message: 'Please check your .env.local file'
        });
    }

    try {
        const client = new Pool({ connectionString: process.env.DATABASE_URL });
        
        if (entity === 'activeTeamIds') {
            const { rows } = await client.query('SELECT active_team_ids FROM app_state WHERE id = 1');
            await client.end();
            return res.json(rows.length > 0 ? rows[0].active_team_ids : []);
        }
        
        if (entity === 'finalScores') {
            const [teamsRes, criteriaRes, ratingsRes] = await Promise.all([
                client.query('SELECT id, name FROM teams'),
                client.query('SELECT id, weight FROM criteria'),
                client.query('SELECT team_id, judge_id, scores FROM ratings'),
            ]);
            
            await client.end();
            
            const teams = teamsRes.rows;
            const criteria = criteriaRes.rows;
            const ratings = ratingsRes.rows;

            if (teams.length === 0 || criteria.length === 0) {
                return res.json([]);
            }
            
            // Simplified scoring calculation for testing
            const calculatedScores = teams.map(team => ({
                teamId: team.id,
                teamName: team.name,
                weightedScore: 0,
                rank: 1
            }));

            return res.json(calculatedScores);
        }
        
        await client.end();
        res.status(404).json({ error: 'Entity not found' });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message,
            details: error
        });
    }
});

app.listen(port, () => {
    console.log(`Local test server running on http://localhost:${port}`);
    console.log(`Test database connection: http://localhost:${port}/test-db`);
    console.log(`Test activeTeamIds: http://localhost:${port}/api/data?entity=activeTeamIds`);
    console.log(`Test finalScores: http://localhost:${port}/api/data?entity=finalScores`);
});