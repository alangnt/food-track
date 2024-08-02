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
    const [collectionName, setCollectionName] = useState("items");

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsCollection = collection(db, collectionName);
                const itemsSnapshot = await getDocs(itemsCollection);
                const itemsList: string[] = [];
                const itemValuesList: { [key: string]: number } = {};
        
                if (itemsSnapshot.empty) {
                    console.log(`The ${collectionName} collection is empty`);
                } else {
                    itemsSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        itemsList.push(data.name);
                        itemValuesList[data.name] = data.value || 1;
                    });
                }
        
                setItems(itemsList);
                setItemValues(itemValuesList);
            } catch (error) {
                console.error(`Error fetching items from ${collectionName} collection:`, error);
            }
        };

        fetchItems();
    }, [collectionName]);

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
                await setDoc(doc(db, collectionName, newItem), { name: newItem, value: 1 });
                setItems([...items, newItem]);
                setItemValues({ ...itemValues, [newItem]: 1 });
                setNewItem("");
            } catch (error) {
                console.error(`Error adding item to ${collectionName} collection:`, error);
            }
        } else {
            console.log(`Item already exists in ${collectionName} collection`);
        }
    };

    const handleItemClick = (item: string) => {
        setNewItem(item);
        setSelectedItem(item);
    };

    const handleRemoveItem = async () => {
        if (selectedItem) {
            try {
                await deleteDoc(doc(db, collectionName, selectedItem));
                setItems(items.filter(item => item !== selectedItem));
                const newItemValues = { ...itemValues };
                delete newItemValues[selectedItem];
                setItemValues(newItemValues);
                setNewItem("");
                setSelectedItem(null);
            } catch (error) {
                console.error(`Error removing item from ${collectionName} collection:`, error);
            }
        }
    };

    const handleAddValue = async (item: string) => {
        try {
            const newValue = (itemValues[item] || 0) + 1;
            await updateDoc(doc(db, collectionName, item), { value: newValue });
            setItemValues({ ...itemValues, [item]: newValue });
        } catch (error) {
            console.error(`Error updating item value in ${collectionName} collection:`, error);
        }
    };
    
    const handleRemoveValue = async (item: string) => {
        try {
            const newValue = Math.max((itemValues[item] || 0) - 1, 0);
            await updateDoc(doc(db, collectionName, item), { value: newValue });
            setItemValues({ ...itemValues, [item]: newValue });
        } catch (error) {
            console.error(`Error updating item value in ${collectionName} collection:`, error);
        }
    };

    return (
        <Box sx={{ width: "100%", height: "60vh", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
            <Typography variant="h2" sx={{ textAlign: "center", fontSize: "2rem" }}>
                <Input type="text" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
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