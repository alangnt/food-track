import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(req: NextRequest) {
    console.log('Received label submission request');
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            console.log('User not authenticated');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { imageId, label } = await req.json();
        console.log(`Received imageId: ${imageId}, label: ${label}`);

        if (!imageId || !label) {
            console.log('Missing imageId or label');
            return NextResponse.json({ error: 'Missing imageId or label' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            console.log('Checking if image belongs to user');
            const checkResult = await client.query(
                'SELECT id FROM images WHERE id = $1 AND user_id = (SELECT id FROM users_ptracker WHERE email = $2)',
                [imageId, session.user.email]
            );
            console.log(`Check result: ${JSON.stringify(checkResult.rows)}`);

            if (checkResult.rows.length === 0) {
                console.log('Image not found or does not belong to user');
                return NextResponse.json({ error: 'Image not found or does not belong to user' }, { status: 404 });
            }

            console.log('Updating image label');
            const updateResult = await client.query(
                'UPDATE images SET user_label = $1 WHERE id = $2 RETURNING id, url, user_label',
                [label, imageId]
            );
            console.log(`Update result: ${JSON.stringify(updateResult.rows)}`);

            if (updateResult.rows.length === 0) {
                console.log('Failed to update image label');
                throw new Error('Failed to update image label');
            }

            const updatedImage = updateResult.rows[0];
            console.log(`Updated image: ${JSON.stringify(updatedImage)}`);

            return NextResponse.json({ 
                message: 'Label submitted successfully', 
                image: updatedImage,
                userLabel: updatedImage.user_label
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error submitting label:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}