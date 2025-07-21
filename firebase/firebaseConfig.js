import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAuW0jHQkMz-_nQ97omrZE3-XCqvnsj8KA",
  authDomain: "allhouse-be490.firebaseapp.com",
  databaseURL: "https://allhouse-be490-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "allhouse-be490",
  storageBucket: "allhouse-be490.firebasestorage.app",
  messagingSenderId: "647822776636",
  appId: "1:647822776636:web:4fde4a93eb5f8b5d512639"
};

auth.setPersistence(getReactNativePersistence(AsyncStorage));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };