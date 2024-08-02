"use client"

import { Box, Button, Input, List, Typography, ListItem, ListItemButton } from "@mui/material";
import { useState, useEffect } from "react";
import { db } from "@/firebase.config";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ItemsTracker() {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState("");
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [itemValues, setItemValues] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsCollection = collection(db, "items");
                const itemsSnapshot = await getDocs(itemsCollection);
                const itemsList: string[] = [];
                const itemValuesList: { [key: string]: number } = {};
                itemsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    itemsList.push(data.name);
                    itemValuesList[data.name] = data.value || 0;
                });
                setItems(itemsList);
                setItemValues(itemValuesList);
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

        if (!items.includes(newItem)) {
            try {
                await setDoc(doc(db, "items", newItem), { name: newItem, value: 0 });
                setItems([...items, newItem]);
                setItemValues({ ...itemValues, [newItem]: 0 });
                setNewItem("");
            } catch (error) {
                console.error("Error adding item:", error);
            }
        } else {
            console.log("Item already exists");
        }
    };

    const handleItemClick = (item: string) => {
        setNewItem(item);
        setSelectedItem(item);
    };

    const handleRemoveItem = async () => {
        if (selectedItem) {
            try {
                await deleteDoc(doc(db, "items", selectedItem));
                setItems(items.filter(item => item !== selectedItem));
                const newItemValues = { ...itemValues };
                delete newItemValues[selectedItem];
                setItemValues(newItemValues);
                setNewItem("");
                setSelectedItem(null);
            } catch (error) {
                console.error("Error removing item:", error);
            }
        }
    };

    const handleAddValue = async (item: string) => {
        try {
            const newValue = (itemValues[item] || 0) + 1;
            await updateDoc(doc(db, "items", item), { value: newValue });
            setItemValues({ ...itemValues, [item]: newValue });
        } catch (error) {
            console.error("Error updating item value:", error);
        }
    };

    const handleRemoveValue = async (item: string) => {
        try {
            const newValue = Math.max((itemValues[item] || 0) - 1, 0);
            await updateDoc(doc(db, "items", item), { value: newValue });
            setItemValues({ ...itemValues, [item]: newValue });
        } catch (error) {
            console.error("Error updating item value:", error);
        }
    };

    return (
        <Box sx={{ width: "100%", height: "60vh", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
            <Typography variant="h2" sx={{ textAlign: "center", fontSize: "2rem" }}>
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
                                <Typography sx={{ width: "20%" }}>{item}</Typography>
                                <input 
                                    className="w-1/6 text-right"
                                    type="number" 
                                    value={itemValues[item] || 1}
                                    readOnly
                                />
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                                    <Button variant="contained" sx={{ backgroundColor: "green", color: "white" }} onClick={() => handleAddValue(item)}>+</Button>
                                    <Button variant="contained" sx={{ backgroundColor: "red", color: "white" }} onClick={() => handleRemoveValue(item)}>-</Button>
                                </Box>
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