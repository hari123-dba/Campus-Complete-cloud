import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Note: In a production environment, use process.env to populate these values.
// For the purpose of this PWA, we attempt to connect, but will gracefully fail to local mode if keys are missing.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", 
  authDomain: "campus-complete.firebaseapp.com",
  projectId: "campus-complete",
  storageBucket: "campus-complete.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

let app;
let db: any = null;

try {
  // Simple check to see if the user has actually configured the keys
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration missing. Running in Offline/Demo mode.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { db };