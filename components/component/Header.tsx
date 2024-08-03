"use client"

import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import { useSession } from "next-auth/react"; // Add this import

export default function Header() {
    const { data: session } = useSession(); // Add this line to get session data

    return (
        <header className="flex justify-between items-center bg-black text-white px-4 py-1">
            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Image src="/logo.png" alt="Food Track" width={50} height={50} className="rounded-full"/>
                <Button href="/" sx={{ textAlign: "center", fontSize: { xs: "1.5rem", md: "2rem" }, color: "white" }}>Food Track</Button>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {session ? (
                    // User is logged in
                    <>
                        <Button href="/dashboard" sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" }, display: "none" }}>Dashboard</Button>
                        <Button href="/api/auth/signout" sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" }, display: "flex" }}>Logout</Button>
                    </>
                ) : (
                    // User is not logged in
                    <>
                        <Button href="/register" sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" }, display: { xs: "none", md: "flex" } }}>Sign up</Button>
                        <Button href="/login" sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" }, display: "flex" }}>Login</Button>
                    </>
                )}
            </Box>  
        </header>
    );
}