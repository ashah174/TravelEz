import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWVakx68ACosbA32l0ql_NDrWY2Sj3B94",
  authDomain: "travelez-9c5ba.firebaseapp.com",
  projectId: "travelez-9c5ba",
  storageBucket: "travelez-9c5ba.firebasestorage.app",
  messagingSenderId: "529377496796",
  appId: "1:529377496796:web:fa6563ad700e0c308cee19",
  measurementId: "G-359BQP1FXK",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
