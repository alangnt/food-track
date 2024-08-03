"use client"

import { Box, Button, Grid, IconButton, Modal } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface SavedImage {
  id: number;
  url: string;
}

interface ZoomedImageModalProps {
  image: SavedImage | null;
  isOpen: boolean;
  onClose: () => void;
}

const ZoomedImageModal: React.FC<ZoomedImageModalProps> = ({ image, isOpen, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <IconButton
          onClick={handleZoomIn}
          sx={{ position: 'absolute', right: 8, bottom: 8 }}
        >
          <ZoomInIcon />
        </IconButton>
        <IconButton
          onClick={handleZoomOut}
          sx={{ position: 'absolute', right: 48, bottom: 8 }}
        >
          <ZoomOutIcon />
        </IconButton>
        {image && (
          <img
            src={image.url}
            alt={`Zoomed Image ${image.id}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s',
            }}
          />
        )}
      </Box>
    </Modal>
  );
};

export default function Gallery() {
    const [images, setImages] = useState<SavedImage[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const videoRef = useRef<HTMLVideoElement>(null);
    const { data: session } = useSession();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<SavedImage | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);

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
            const newImageUrl = canvas.toDataURL("image/jpeg");
            const newImage: SavedImage = {
                id: Date.now(), // Temporary ID, will be replaced when saved to database
                url: newImageUrl
            };
            setImages(prevImages => [...prevImages, newImage]);
        }
    };

    const flipCamera = () => {
        setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    };

    const saveImages = async () => {
        if (!session || !session.user) {
            alert("Please sign in to save images.");
            return;
        }
    
        setIsSaving(true);
        try {
            const response = await fetch('/api/save-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    images: images
                        .filter(img => !img.id || img.id > Date.now() - 1000 * 60 * 60) // Only send new images
                        .map(img => img.url)
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to save images');
            }
            
            alert("Images saved successfully!");
            await fetchSavedImages();
        } catch (error) {
            console.error('Error saving images:', error);
            alert('Failed to save images. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteImage = async (imageId: number) => {
        if (!session || !session.user) {
            alert("Please sign in to delete images.");
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/delete-image?id=${imageId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            const result = await response.json();
            setImages(result.remainingImages);
            alert('Image deleted successfully!');
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteAllImages = async () => {
        if (!session || !session.user) {
            alert("Please sign in to delete images.");
            return;
        }

        if (!confirm("Are you sure you want to delete all images? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch('/api/delete-all-images', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete all images');
            }

            setImages([]);
            alert('All images deleted successfully!');
        } catch (error) {
            console.error('Error deleting all images:', error);
            alert('Failed to delete all images. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (isCameraActive) {
            stopCamera();
            startCamera();
        }
    }, [facingMode]);

    useEffect(() => {
        if (session && session.user) {
            fetchSavedImages();
        }
    }, [session]);

    const fetchSavedImages = async () => {
        if (!session || !session.user) {
            console.log("User not signed in. Cannot fetch images.");
            return;
        }
    
        try {
            const response = await fetch('/api/get-images');
            if (!response.ok) {
                throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
            }
            const savedImages: SavedImage[] = await response.json();
            console.log('Fetched images:', savedImages);
            setImages(savedImages);
        } catch (error) {
            console.error('Error fetching images:', error);
            alert('Failed to fetch saved images. Please try again.');
        }
    };

    const handleImageClick = (image: SavedImage) => {
        setZoomedImage(image);
        setIsZoomed(true);
    };

    const handleCloseZoom = () => {
        setIsZoomed(false);
        setZoomedImage(null);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <Button onClick={startCamera} sx={{ color: "black", "&:hover": { backgroundColor: "black", color: "white" } }}>Start Camera</Button>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <video ref={videoRef} autoPlay playsInline style={{ display: "block", marginTop: "1rem" }} />
                {isCameraActive && (
                    <>
                        <Button onClick={captureImage} style={{ marginTop: "1rem" }} sx={{ color: "black", "&:hover": { backgroundColor: "black", color: "white" } }}>Take Picture</Button>
                        <Button onClick={flipCamera} sx={{ color: "black", "&:hover": { backgroundColor: "black", color: "white" } }}>Flip Camera</Button>
                        <Button onClick={stopCamera} sx={{ color: "black", "&:hover": { backgroundColor: "black", color: "white" } }}>Stop Camera</Button>
                    </>
                )}
            </Box>
            
            <Grid container spacing={2} sx={{ marginTop: "1rem" }}>
                {images.map((image) => (
                    <Grid item xs={6} sm={4} md={3} key={image.id}>
                        <Box 
                            sx={{ 
                                position: 'relative', 
                                width: '100%', 
                                paddingTop: '100%', 
                                border: '1px solid #ccc',
                                cursor: 'pointer',
                            }}
                            onClick={() => handleImageClick(image)}
                        >
                            <img 
                                src={image.url} 
                                alt={`Image ${image.id}`} 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => {
                                    console.error(`Error loading image ${image.id}:`, e);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteImage(image.id);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.7)' }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                {images.length > 0 && (
                    <Button 
                        onClick={saveImages} 
                        disabled={isSaving}
                        sx={{ 
                            color: "black", 
                            "&:hover": { backgroundColor: "black", color: "white" }
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Images'}
                    </Button>
                )}
                {images.length > 0 && (
                    <Button 
                        onClick={deleteAllImages} 
                        disabled={isDeleting}
                        sx={{ 
                            color: "white", 
                            backgroundColor: "red",
                            "&:hover": { backgroundColor: "darkred" }
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete All Images'}
                    </Button>
                )}
            </Box>

            <ZoomedImageModal
                image={zoomedImage}
                isOpen={isZoomed}
                onClose={handleCloseZoom}
            />
        </Box>
    );
}