// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCR-_uQH2s-ND2UsfvqhCBVqrS1t96Bhxo",
  authDomain: "dio-panel.firebaseapp.com",
  projectId: "dio-panel",
  storageBucket: "dio-panel.firebasestorage.app",
  messagingSenderId: "640076222432",
  appId: "1:640076222432:web:0d75e5ef8e8261c3ec2585",
  measurementId: "G-P4VYFFMXQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);