"use client"

import { Box, Typography } from "@mui/material";

export default function Header() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Typography variant="h1" sx={{ textAlign: "center", fontSize: "3rem" }}>Food Track</Typography>
        </Box>
    );
}