import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0kMm9gcLBHdmFeNT4qR5b0R78Llc_U8U",
  authDomain: "k2f-app.firebaseapp.com",
  projectId: "k2f-app",
  storageBucket: "k2f-app.firebasestorage.app",
  messagingSenderId: "77356733275",
  appId: "1:77356733275:web:1e7fafd0aa188a3f9fc07e"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);