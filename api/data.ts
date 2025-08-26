import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';

// Helper to generate short, random codes for judges
const generateSecretId = () => `JUDGE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

// Interface for the raw rating data from the database
interface DbRating {
    team_id: string;
    judge_id: string;
    scores: Record<string, number>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new Pool({ connectionString: process.env.DATABASE_URL });
    const { entity, id, judgeId, teamId } = req.query;

    try {
        // --- GET Requests ---
        if (req.method === 'GET') {
            if (entity === 'teams') {
                const { rows } = await client.query('SELECT * FROM teams ORDER BY created_at ASC');
                return res.status(200).json(rows);
            }
            if (entity === 'judges') {
                const { rows } = await client.query('SELECT * FROM judges ORDER BY created_at ASC');
                return res.status(200).json(rows);
            }
            if (entity === 'criteria') {
                const { rows } = await client.query('SELECT * FROM criteria ORDER BY created_at ASC');
                return res.status(200).json(rows);
            }
            if (entity === 'scores') {
                if (judgeId && teamId) {
                    const { rows } = await client.query('SELECT scores FROM ratings WHERE judge_id = $1 AND team_id = $2', [judgeId, teamId]);
                    if (rows.length > 0) {
                        return res.status(200).json({ teamId, judgeId, scores: rows[0].scores });
                    }
                    return res.status(200).json(null); // Return null if no score found
                }
                if (judgeId) {
                    const { rows } = await client.query('SELECT team_id, scores FROM ratings WHERE judge_id = $1', [judgeId]);
                    const formattedScores = rows.map(row => ({
                        teamId: row.team_id,
                        judgeId,
                        scores: row.scores
                    }));
                    return res.status(200).json(formattedScores);
                }
                const { rows } = await client.query('SELECT team_id, judge_id, scores FROM ratings');
                const allScores = rows.map(row => ({
                    teamId: row.team_id,
                    judgeId: row.judge_id,
                    scores: row.scores
                }));
                return res.status(200).json(allScores);
            }
            if (entity === 'activeTeamId') {
                 const { rows } = await client.query('SELECT active_team_id FROM app_state WHERE id = 1');
                 return res.status(200).json(rows.length > 0 ? rows[0].active_team_id : null);
            }
            if (entity === 'finalScores') {
                const [teamsRes, judgesRes, criteriaRes, ratingsRes] = await Promise.all([
                    client.query('SELECT id, name FROM teams'),
                    client.query('SELECT id FROM judges'),
                    client.query('SELECT id, max_score FROM criteria'),
                    client.query('SELECT team_id, judge_id, scores FROM ratings'),
                ]);
                
                const teams = teamsRes.rows;
                const judges = judgesRes.rows;
                const criteria = criteriaRes.rows;
                const ratings: DbRating[] = ratingsRes.rows;

                const totalJudges = judges.length;
                
                const totalMaxScore = criteria.reduce((sum, c) => sum + Number(c.max_score || 0), 0);

                if (totalJudges === 0 || totalMaxScore === 0 || teams.length === 0) {
                    return res.status(200).json([]);
                }
                
                const ratingsByTeam = ratings.reduce((acc: Record<string, DbRating[]>, rating) => {
                    if (!acc[rating.team_id]) {
                        acc[rating.team_id] = [];
                    }
                    acc[rating.team_id].push(rating);
                    return acc;
                }, {});

                const calculatedScores = teams.map(team => {
                    const teamRatings = ratingsByTeam[team.id] || [];
                    if (teamRatings.length !== totalJudges) {
                        return null;
                    }
                    
                    const judgePercentages = judges.map(judge => {
                        const rating = teamRatings.find(r => r.judge_id === judge.id);
                        if (!rating) return 0; // Should not happen due to the check above

                        const totalScoreFromJudge = Object.values(rating.scores).reduce((sum: number, score: any) => sum + Number(score), 0);
                        return (totalScoreFromJudge / totalMaxScore) * 100;
                    });
                    
                    const averagePercentage = judgePercentages.reduce((sum, p) => sum + p, 0) / totalJudges;
                    
                    return {
                        teamId: team.id,
                        teamName: team.name,
                        weightedScore: parseFloat(averagePercentage.toFixed(2)),
                    };
                }).filter((s): s is { teamId: string; teamName: string; weightedScore: number; } => s !== null);

                const sortedScores = [...calculatedScores].sort((a, b) => b!.weightedScore - a!.weightedScore);

                const finalRankedScores = sortedScores.map((score, index) => ({
                    ...score,
                    rank: index + 1
                }));

                return res.status(200).json(finalRankedScores);
            }
        }

        // --- POST Requests ---
        if (req.method === 'POST') {
             if (entity === 'teams') {
                await client.query('INSERT INTO teams (name) VALUES ($1)', [req.body.name]);
                return res.status(201).json({ success: true });
            }
            if (entity === 'judges') {
                await client.query('INSERT INTO judges (name, secret_id) VALUES ($1, $2)', [req.body.name, generateSecretId()]);
                return res.status(201).json({ success: true });
            }
            if (entity === 'criteria') {
                const { name, max_score, weight } = req.body;
                await client.query('INSERT INTO criteria (name, max_score) VALUES ($1, $2)', [name, max_score ?? weight]);
                return res.status(201).json({ success: true });
            }
            if (entity === 'activeTeamId') {
                await client.query('UPDATE app_state SET active_team_id = $1 WHERE id = 1', [req.body.id]);
                return res.status(200).json({ success: true });
            }
            if (entity === 'scores') {
                const { teamId, judgeId, scores } = req.body;
                await client.query(`
                    INSERT INTO ratings (team_id, judge_id, scores)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (team_id, judge_id)
                    DO UPDATE SET scores = $3
                `, [teamId, judgeId, JSON.stringify(scores)]);
                return res.status(201).json({ success: true });
            }
        }
        
        // --- DELETE Requests ---
        if (req.method === 'DELETE') {
            if (entity && id) {
                 await client.query(`DELETE FROM ${entity} WHERE id = $1`, [id]);
                 return res.status(200).json({ success: true });
            }
        }

        res.status(404).json({ error: 'Not Found' });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
    }
}
