"use client"

import React, { useState } from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { FormLabel, TextField, Button } from "@mui/material";

import Link from "next/link"

export default function Login() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (result?.error) {
                alert(result.error);
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    };

    if (sessionStatus === "loading") {
        return <div>Loading...</div>;
    }

    return (
        <main className="flex-1 flex justify-center items-center">
            {session ? (
                <div className='w-full max-w-sm p-6 flex flex-col items-center justify-center gap-8'>
                    <h1 className="text-3xl text-center">
                        Welcome back !
                    </h1>
                    <button onClick={() => signOut()} className="text-center hover:underline hover:scale-110">
                        Sign Out
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-sm p-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Login</h1>
                        <p className="mt-2">Login to your account.</p>
                    </div>

                    <form className="mt-8 space-y-8 trans-text" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-1">
                            <FormLabel htmlFor="email" className="text-md">Email</FormLabel>
                            <TextField
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required 
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <FormLabel htmlFor="password" className="text-md">Password</FormLabel>
                            <TextField
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required 
                            />
                        </div>

                        <div className="flex justify-center items-center">
                            <Button type="submit" className="transition all duration-100 hover:scale-110 text-md">
                                Login
                            </Button>
                        </div>
                    </form>

                    <div className="flex justify-center items-center">
                        <Link href="/register" className="text-sm text-primary hover:underline">Don&apos;t have an account ? Register one</Link>
                    </div>
                </div>
            )}
        </main>
    )
}
