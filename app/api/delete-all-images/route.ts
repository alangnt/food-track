import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userResult = await client.query(
                'SELECT id FROM users_ptracker WHERE email = $1',
                [session.user.email]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const userId = userResult.rows[0].id;

            // Delete all images for the user
            const deleteResult = await client.query(
                'DELETE FROM images WHERE user_id = $1',
                [userId]
            );

            await client.query('COMMIT');

            return NextResponse.json({ 
                message: 'All images deleted successfully', 
                deletedCount: deleteResult.rowCount 
            }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting all images:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}