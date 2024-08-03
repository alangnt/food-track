
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    // Check if user already exists
    const checkUserQuery = "SELECT * FROM users_ptracker WHERE email = $1";
    const checkUserResult = await pool.query(checkUserQuery, [email]);

    if (checkUserResult.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const insertUserQuery = "INSERT INTO users_ptracker (email, password, created_at) VALUES ($1, $2, $3) RETURNING id, email";
    const insertUserResult = await pool.query(insertUserQuery, [email, hashedPassword, new Date()]);

    const newUser = insertUserResult.rows[0];

    return NextResponse.json({ 
      message: 'User registered successfully', 
      user: { id: newUser.id, email: newUser.email } 
    }, { status: 201 });

  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
