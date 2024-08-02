"use client"

import { Box, Button, Grid } from "@mui/material";
import { useState, useRef, useEffect } from "react";

export default function Gallery() {
    const [images, setImages] = useState<string[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const videoRef = useRef<HTMLVideoElement>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
            const newImage = canvas.toDataURL("image/jpeg");
            setImages(prevImages => [...prevImages, newImage]);
        }
    };

    const flipCamera = () => {
        setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    };

    useEffect(() => {
        if (isCameraActive) {
            stopCamera();
            startCamera();
        }
    }, [facingMode]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <h1>Gallery</h1>
            <Button onClick={startCamera}>Start Camera</Button>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <video ref={videoRef} autoPlay playsInline style={{ display: "block", marginTop: "1rem" }} />
                {isCameraActive && (
                    <>
                        <Button onClick={captureImage} style={{ marginTop: "1rem" }}>Take Picture</Button>
                        <Button onClick={flipCamera}>Flip Camera</Button>
                        <Button onClick={stopCamera}>Stop Camera</Button>
                    </>
                )}
            </Box>
            
            <Grid container spacing={2} sx={{ marginTop: "1rem" }}>
                {images.map((src, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                        <img src={src} alt={`Captured ${index + 1}`} style={{ width: "100%", height: "auto" }} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}