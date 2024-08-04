import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { imageId, label } = await req.json();

        if (!imageId || !label) {
            return NextResponse.json({ error: 'Missing imageId or label' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // First, check if the image belongs to the user
            const checkResult = await client.query(
                'SELECT id FROM images WHERE id = $1 AND user_id = (SELECT id FROM users_ptracker WHERE email = $2)',
                [imageId, session.user.email]
            );

            if (checkResult.rows.length === 0) {
                return NextResponse.json({ error: 'Image not found or does not belong to user' }, { status: 404 });
            }

            // Update the image label
            const updateResult = await client.query(
                'UPDATE images SET user_label = $1 WHERE id = $2 RETURNING id, url, user_label',
                [label, imageId]
            );

            return NextResponse.json({ message: 'Label submitted successfully', image: updateResult.rows[0] });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error submitting label:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}