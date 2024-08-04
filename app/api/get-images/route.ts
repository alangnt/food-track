import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { Pool } from 'pg';

// Create a new pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

function sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
        console.error('Non-string URL encountered:', url);
        return '';
    }

    try {
        // If the URL starts with '{"', it's likely a malformed JSON string
        if (url.startsWith('{"')) {
            // Try to parse it as JSON
            const parsed = JSON.parse(url);
            // If successful, return the parsed URL
            return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        }
        // If it's a base64 encoded image, return it as is
        if (url.startsWith('data:image')) {
            return url;
        }
        // Otherwise, just return the URL as is
        return url;
    } catch (e) {
        console.error('Error sanitizing URL:', e);
        // If there's an error, try to extract a valid URL or data URI
        const urlMatch = url.match(/(https?:\/\/[^\s]+|data:image\/[^\s]+)/);
        if (urlMatch) {
            return urlMatch[0];
        }
        // If no valid URL found, return empty string
        return '';
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, url, user_label FROM images WHERE user_id = (SELECT id FROM users_ptracker WHERE email = $1) ORDER BY created_at DESC',
                [session.user.email]
            );

            const sanitizedImages = result.rows.map(row => ({
                id: row.id,
                url: sanitizeUrl(row.url),
                userLabel: row.user_label // Include the user_label in the response
            }));

            console.log('Sanitized images with labels:', sanitizedImages);

            return NextResponse.json(sanitizedImages);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in GET /api/get-images:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}