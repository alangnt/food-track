"use client"

import { FormLabel, TextField, Button } from "@mui/material";
import Link from "next/link"
import React, { useState } from 'react';

interface CountriesProps {
  className?: string;
}

export default function Register() {
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Optionally, you can automatically sign in the user here
      } else {
        alert(data.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    }
  };

  return (
    <main className="flex-1 flex justify-center items-center">
      {submitted ? (
        <div className='w-full max-w-sm p-6 flex flex-col items-center justify-center gap-6'>
          <p className='text-3xl text-center'>Thank you for registering !</p>

          <Link href="/login" className="text-center hover:underline hover:scale-110">Please login now</Link>
        </div>
      ) : (
        <div className="w-full max-w-sm p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Register</h1>
            <p className="mt-2">Create your account to get started.</p>
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
                Register
              </Button>
            </div>
          </form>

          <div className="flex justify-center items-center">
            <Link href="/login" className="text-sm text-primary hover:underline">Already have an account? Login instead</Link>
          </div>
        </div>
      )}
    </main>
  )
}