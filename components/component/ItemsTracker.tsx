"use client"

import { Box, Button, Input, List, Typography, ListItem, ListItemButton } from "@mui/material";

import { useState, useEffect } from "react";
import { db } from "@/firebase.config";
import { collection, getDocs } from "firebase/firestore";

export default function ItemsTracker() {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState("");
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsCollection = collection(db, "items");
                const itemsSnapshot = await getDocs(itemsCollection);
                const itemsList = itemsSnapshot.docs.map(doc => doc.data().name);
                setItems(itemsList);
            } catch (error) {
                console.error("Error fetching items:", error);
            }
        };

        fetchItems();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewItem(e.target.value);
    };

    const handleAddItem = async () => {
        if (newItem === "") {
            console.log("Item is empty");
            return;
        }

        // If item is already there, remove it
        if (items.includes(newItem)) {
            console.log("Item already exists");
        } else {
            setItems([...items, newItem]);
            setNewItem("");
        }
    };

    const handleItemClick = (item: string) => {
        // Let's make the selected item the new item
        // Let's make sure it stays selected by changing its color
        setNewItem(item);
        setSelectedItem(item);
    };

    const handleRemoveItem = async () => {
        setItems(items.filter(item => item !== newItem));
        setNewItem("");
    };

    return (
            <Box sx={{ width: "100%", height: "60vh", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
                
                <Typography variant="h2" 
                sx={{ textAlign: "center", fontSize: "2rem" }}
                >
                    Items list
                </Typography>

                <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

                <List>
                {items.map((item) => (
                <ListItem key={item} disablePadding>
                    <ListItemButton 
                        onClick={() => handleItemClick(item)} 
                        sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between", 
                            gap: "1rem",
                            backgroundColor: selectedItem === item ? '#e0e0e0' : 'transparent',
                        }}
                    >
                        <Typography>{item}</Typography>
                        <input 
                            className="w-16 text-right"
                            type="number" 
                            defaultValue={1}
                        />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Input 
                        type="text" 
                        placeholder="Add item"
                        value={newItem}
                        onChange={handleChange}
                    />

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Button onClick={handleAddItem}>Add item</Button>
                        <Button onClick={handleRemoveItem}>Remove item</Button>
                    </Box>
                </Box>
            </Box>           
    );
}