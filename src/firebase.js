// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Indsæt dine egne nøgler her fra Firebase konsollen
const firebaseConfig = {

  apiKey: "AIzaSyCQfG8wqY0JJ1-Nao1N3BFwjIh7H9_wGSk",

  authDomain: "aktons-ultimate-5e-vtt.firebaseapp.com",

  projectId: "aktons-ultimate-5e-vtt",

  storageBucket: "aktons-ultimate-5e-vtt.firebasestorage.app",

  messagingSenderId: "561984307777",

  appId: "1:561984307777:web:007e8a750764258a97fcc0",

  measurementId: "G-50RWDBNBF2"

};


// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Eksporter auth og database så vi kan bruge dem i resten af appen
export const auth = getAuth(app);
export const db = getFirestore(app);