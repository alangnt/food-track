import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

interface ImageData {
    url: string;
    label?: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { images } = await req.json();
        console.log('Received images:', images); // Log received images

        if (!Array.isArray(images)) {
            return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userResult = await client.query(
                'SELECT id FROM users_ptracker WHERE email = $1',
                [session.user.email]
            );

            if (userResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const userId = userResult.rows[0].id;

            const savedImages = [];
            for (const imageData of images) {
                const { url, label } = imageData as ImageData;
                const result = await client.query(
                    'INSERT INTO images (user_id, url, user_label) VALUES ($1, $2, $3) RETURNING id, url, user_label',
                    [userId, url, label || null]
                );
                savedImages.push(result.rows[0]);
            }

            await client.query('COMMIT');

            console.log('Saved images:', savedImages); // Log saved images

            return NextResponse.json({ message: 'Images saved successfully', savedImages });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error saving images:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}