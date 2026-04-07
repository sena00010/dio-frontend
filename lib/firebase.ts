import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCR-_uQH2s-ND2UsfvqhCBVqrS1t96Bhxo",
  authDomain: "dio-panel.firebaseapp.com",
  projectId: "dio-panel",
  storageBucket: "dio-panel.firebasestorage.app",
  messagingSenderId: "640076222432",
  appId: "1:640076222432:web:0d75e5ef8e8261c3ec2585",
  measurementId: "G-P4VYFFMXQJ",
};

// Prevent re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
