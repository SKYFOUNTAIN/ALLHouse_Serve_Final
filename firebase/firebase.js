// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAuW0jHQkMz-_nQ97omrZE3-XCqvnsj8KA",
  authDomain: "allhouse-be490.firebaseapp.com",
  databaseURL: "https://allhouse-be490-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "allhouse-be490",
  storageBucket: "allhouse-be490.appspot.com",
  messagingSenderId: "647822776636",
  appId: "1:647822776636:web:d9a9c74b2b172e01512639"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firebase Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other files
export { auth, db };
