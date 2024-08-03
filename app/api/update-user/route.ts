import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { Pool } from 'pg';

import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const updateQuery = "UPDATE users SET country = $1 WHERE id = $2";
        await pool.query(updateQuery, [session.user.id]);

        return NextResponse.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}