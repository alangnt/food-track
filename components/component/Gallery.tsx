"use client"

import { Box, Button, Grid, IconButton, Modal, TextField, Chip } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

interface SavedImage {
  id: number;
  url: string;
  userLabel?: string;
}

interface ZoomedImageModalProps {
  image: SavedImage | null;
  isOpen: boolean;
  onClose: () => void;
  prediction: string | null;
  userLabel: string | null;
  onUserLabelChange: (label: string) => void;
  onUserLabelSubmit: () => void;
}

const ZoomedImageModal: React.FC<ZoomedImageModalProps> = ({ 
  image, 
  isOpen, 
  onClose, 
  prediction, 
  userLabel, 
  onUserLabelChange, 
  onUserLabelSubmit 
}) => {
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
          sx={{ position: 'absolute', right: 0, top: 0 }}
        >
          <CloseIcon />
        </IconButton>
        {image && (
          <>
            <img
              src={image.url}
              alt={`Zoomed Image ${image.id}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'transform 0.2s',
              }}
            />
            <Box sx={{
              position: 'absolute',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '1rem',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80%',
              gap: '8px',
            }}>
              {(userLabel || prediction) && (
                <Chip 
                  label={userLabel || prediction || ''}
                  size="small" 
                  color={userLabel ? "secondary" : "primary"}
                  sx={{ 
                    maxWidth: '100%',
                    height: 'auto',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      padding: '0.7rem',
                    },
                    borderRadius: '4px'
                  }}
                />
              )}
              <TextField
                size="small"
                placeholder="Enter your label"
                value={userLabel || ''}
                onChange={(e) => onUserLabelChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onUserLabelSubmit();
                  }
                }}
                sx={{ width: { xs: '100%', sm: '70%' } }}
              />
              <Button 
                onClick={onUserLabelSubmit}
                variant="contained" 
                size="small"
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                Submit
              </Button>
            </Box>
          </>
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
    const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
    const [predictions, setPredictions] = useState<{[key: number]: string}>({});
    const [userLabels, setUserLabels] = useState<{[key: number]: string}>({});

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
                id: Date.now(),
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
            const imagesToSave = images
                .filter(img => !img.id || img.id > Date.now() - 1000 * 60 * 60)
                .map(img => img.url);
    
            console.log('Attempting to save images:', imagesToSave);
    
            const response = await fetch('/api/save-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ images: imagesToSave }),
            });
    
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server responded with an error:', response.status, errorData);
                throw new Error(`Server error: ${errorData || 'Unknown error'}`);
            }
    
            const result = await response.json();
            console.log('Save images response:', result);
    
            alert("Images saved successfully!");
            await fetchSavedImages();
        } catch (error) {
            console.error('Error saving images:', error);
            alert(`Failed to save images. ${error instanceof Error ? error.message : 'Please try again.'}`);
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
        loadModel();
    }, [session]);

    useEffect(() => {
        if (model) {
            images.forEach(image => {
                if (!predictions[image.id]) {
                    detectImage(image);
                }
            });
        }
    }, [images, model]);

    const fetchSavedImages = async () => {
        if (!session || !session.user) {
            return;
        }
    
        try {
            const response = await fetch('/api/get-images');
            if (!response.ok) {
                throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
            }
            const savedImages: SavedImage[] = await response.json();
            console.log('Fetched saved images:', savedImages);
            setImages(savedImages);
            
            // Update userLabels state with fetched labels
            const fetchedLabels = savedImages.reduce((acc, img) => {
                if (img.userLabel) {
                    acc[img.id] = img.userLabel;
                }
                return acc;
            }, {} as {[key: number]: string});
            console.log('Fetched user labels:', fetchedLabels);
            setUserLabels(fetchedLabels);
        } catch (error) {
            console.error('Error fetching images:', error);
            alert('Failed to fetch saved images. Please try again.');
        }
    };

    const loadModel = async () => {
        try {
            const loadedModel = await mobilenet.load();
            setModel(loadedModel);
        } catch (error) {
            console.error('Failed to load MobileNet model:', error);
        }
    };

    const detectImage = async (image: SavedImage) => {
        if (!model) {
            return;
        }

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = image.url;
            await img.decode();

            const tfImg = tf.browser.fromPixels(img);
            const result = await model.classify(tfImg);
            const topPrediction = result[0].className;
            
            setPredictions(prev => ({ ...prev, [image.id]: topPrediction }));
            tfImg.dispose();
        } catch (error) {
            console.error('Error during image detection:', error);
        }
    };

    const handleImageClick = (image: SavedImage) => {
        setZoomedImage(image);
        setIsZoomed(true);
        if (!predictions[image.id]) {
            detectImage(image);
        }
    };

    const handleCloseZoom = () => {
        setIsZoomed(false);
        setZoomedImage(null);
    };

    const handleUserLabelChange = (imageId: number, label: string) => {
        setUserLabels(prev => ({ ...prev, [imageId]: label }));
    };

    const submitUserLabel = async (imageId: number) => {
        if (!session || !session.user) {
            alert("Please sign in to submit labels.");
            return;
        }
    
        try {
            const response = await fetch('/api/submit-label', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    imageId,
                    label: userLabels[imageId],
                }),
            });
    
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to submit label');
            }
    
            const updatedImage = await response.json();
            console.log('Label submission response:', updatedImage);
            
            // Update local state
            setImages(prev => prev.map(img => 
                img.id === imageId ? { ...img, userLabel: updatedImage.userLabel } : img
            ));
            setUserLabels(prev => ({ ...prev, [imageId]: updatedImage.userLabel }));
    
            // Refetch images to ensure we have the latest data
            await fetchSavedImages();
    
            alert("Label submitted successfully!");
        } catch (error) {
            console.error('Error submitting label:', error);
            alert(`Failed to submit label. ${error instanceof Error ? error.message : 'Please try again.'}`);
        }
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
                                        {(image.userLabel || predictions[image.id]) && (
                                            <Box sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                padding: '4px',
                                                fontSize: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}>
                                                <Chip 
                                                    label={image.userLabel || predictions[image.id]}
                                                    size="small" 
                                                    color={image.userLabel ? "secondary" : "primary"}
                                                />
                                                <TextField
                                                    size="small"
                                                    placeholder="Your label"
                                                    value={userLabels[image.id] || image.userLabel || ''}
                                                    onChange={(e) => handleUserLabelChange(image.id, e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            submitUserLabel(image.id);
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        )}
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
                                prediction={zoomedImage ? predictions[zoomedImage.id] : null}
                                userLabel={zoomedImage ? (zoomedImage.userLabel || userLabels[zoomedImage.id]) : null}
                                onUserLabelChange={(label) => zoomedImage && handleUserLabelChange(zoomedImage.id, label)}
                                onUserLabelSubmit={() => zoomedImage && submitUserLabel(zoomedImage.id)}
                            />
                            </Box>
                            );
}