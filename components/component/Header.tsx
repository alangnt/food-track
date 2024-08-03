"use client"

import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";

export default function Header() {
    return (
        <header className="flex justify-between items-center bg-black text-white px-4 py-1">
            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Image src="/logo.png" alt="Food Track" width={50} height={50} className="rounded-full"/>
                <Typography variant="h1" sx={{ textAlign: "center", fontSize: "2rem" }}>Food Track</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Button sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" } }}>Sign up</Button>
                <Button sx={{ color: "white", "&:hover": { backgroundColor: "white", color: "black" } }}>Login</Button>
            </Box> 
        </header>
    );
}