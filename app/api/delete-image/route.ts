import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const imageId = req.nextUrl.searchParams.get('id');

    if (!imageId) {
        return NextResponse.json({ error: 'Missing image ID' }, { status: 400 });
    }

    try {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get user ID
            const userResult = await client.query(
                'SELECT id FROM users_ptracker WHERE email = $1',
                [userEmail]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const userId = userResult.rows[0].id;

            // Delete the specified image
            const deleteResult = await client.query(
                'DELETE FROM images WHERE id = $1 AND user_id = $2 RETURNING id',
                [imageId, userId]
            );

            if (deleteResult.rowCount === 0) {
                throw new Error('Image not found or not owned by user');
            }

            // Fetch remaining images for the user
            const remainingImagesResult = await client.query(
                'SELECT id, url FROM images WHERE user_id = $1',
                [userId]
            );

            await client.query('COMMIT');

            return NextResponse.json({ 
                message: 'Image deleted successfully', 
                deletedImageId: imageId,
                remainingImages: remainingImagesResult.rows 
            }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}