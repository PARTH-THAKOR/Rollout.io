import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgpq7K6IkwLPTAd1Nv-CGdWBkkL4kfQsI",
  authDomain: "rollout-io.firebaseapp.com",
  projectId: "rollout-io",
  storageBucket: "rollout-io.firebasestorage.app",
  messagingSenderId: "198575915792",
  appId: "1:198575915792:web:03512a0a196a13eaa71b95",
  measurementId: "G-2Q8998Z1H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
