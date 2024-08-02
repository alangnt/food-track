import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4VaHIb7PoaSXjrhCSbksVnkV5AG4QIgY",
  authDomain: "food-track-862a8.firebaseapp.com",
  projectId: "food-track-862a8",
  storageBucket: "food-track-862a8.appspot.com",
  messagingSenderId: "336873866842",
  appId: "1:336873866842:web:4d61fc1d690d58148c7a63",

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);