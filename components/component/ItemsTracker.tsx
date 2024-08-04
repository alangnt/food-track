"use client"

import { Box, Button, Input, List, Typography, ListItem, ListItemButton, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { db } from "@/firebase.config";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";

export default function ItemsTracker() {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState("");
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [itemValues, setItemValues] = useState<{ [key: string]: number }>({});
    const [collectionName, setCollectionName] = useState("items");
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { data: session } = useSession();

    useEffect(() => {
        if (session && session.user?.email) {
            setUserEmail(session.user.email);
            setCollectionName("items");
        }
    }, [session]);

    useEffect(() => {
        const fetchItems = async () => {
            if (!userEmail) return;

            try {
                const userListRef = doc(db, "userLists", userEmail);
                const userListDoc = await getDoc(userListRef);

                if (userListDoc.exists()) {
                    const data = userListDoc.data();
                    setItems(data.items || []);
                    setItemValues(data.itemValues || {});
                } else {
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
                }
            } catch (error) {
                console.error(`Error fetching items:`, error);
            }
        };

        fetchItems();
    }, [collectionName, userEmail]);

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
            if (newValue === 0) {
                await deleteDoc(doc(db, collectionName, item));
                setItems(items.filter(i => i !== item));
                const newItemValues = { ...itemValues };
                delete newItemValues[item];
                setItemValues(newItemValues);
            } else {
                await updateDoc(doc(db, collectionName, item), { value: newValue });
                setItemValues({ ...itemValues, [item]: newValue });
            }
        } catch (error) {
            console.error(`Error updating/removing item in ${collectionName} collection:`, error);
        }
    };

    const handleSaveList = async () => {
        if (!userEmail) {
            console.log("User not logged in");
            return;
        }
        try {
            const userListRef = doc(db, "userLists", userEmail);
            await setDoc(userListRef, { items: items, itemValues: itemValues });
            console.log("List saved successfully");
        } catch (error) {
            console.error("Error saving list:", error);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, gap: "3rem" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <Input type="text" 
                    value={collectionName} 
                    placeholder="List name"
                    onChange={(e) => setCollectionName(e.target.value)} 
                    sx={{ textAlign: "center" }}
                />

                <Input
                    type="text"
                    placeholder="Search items"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </Box>

            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <List sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxHeight: "40vh", overflowY: "auto" }}>
                    {filteredItems.map((item) => (
                        <ListItem key={item} disablePadding>
                            <ListItemButton 
                                onClick={() => handleItemClick(item)} 
                                sx={{ 
                                    display: "flex",
                                    flexDirection: { xs: "column", md: "row" },
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    gap: "1rem",
                                    backgroundColor: selectedItem === item ? '#e0e0e0' : 'transparent',
                                    margin: "0.2rem",
                                    borderBlock: { xs: "1px solid #e0e0e0", md: "none" },
                                }}
                            >
                                <Box sx={{ display: "flex", width: "100%", justifyContent: { xs: "center", md: "space-between" }, textAlign: { xs: "center", md: "left" } }}>
                                    <Typography sx={{ width: { xs: "100%", md: "20%" } }}>{item}</Typography>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Typography 
                                        component="span" 
                                        sx={{ 
                                            minWidth: '30px', 
                                            textAlign: 'right', 
                                            display: 'inline-block',
                                            mr: 1
                                        }}
                                    >
                                        {itemValues[item] || 1}
                                    </Typography>   
                                    
                                    <select className="bg-transparent">
                                        <option>pc</option>
                                        <option>kg</option>
                                        <option>lbs</option>
                                        <option>grams</option>
                                        <option>ml</option>
                                        <option>l</option>
                                    </select>
                                
                                    <Button sx={{ color: "black", fontSize: "1.3rem" }} onClick={() => handleAddValue(item)}>+</Button>
                                    <Button sx={{ color: "black", fontSize: "1.3rem" }} onClick={() => handleRemoveValue(item)}>-</Button>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <Input 
                    type="text" 
                    placeholder="Add item"
                    value={newItem}
                    onChange={handleChange}
                />

                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                        <Button variant="contained" sx={{ backgroundColor: "black", color: "white", "&:hover": { backgroundColor: "white", color: "black" } }} onClick={handleAddItem}>Add</Button>
                        <Button variant="contained" sx={{ backgroundColor: "black", color: "white", "&:hover": { backgroundColor: "white", color: "black" } }} onClick={handleRemoveItem}>Remove</Button>
                    </Box>
                    <Button 
                        variant="contained" 
                        sx={{ backgroundColor: "black", color: "white", "&:hover": { backgroundColor: "white", color: "black" } }} 
                        onClick={handleSaveList}
                        disabled={!userEmail}
                    >
                        Save List
                    </Button>
                </Box>
            </Box>
        </Box>           
    );
}