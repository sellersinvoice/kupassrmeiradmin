// /js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// export const firebaseConfig = {
//   apiKey: "AIzaSyA8VhIFlBuduLwvwDEUY3lV5oIuQ71QAO0",
//   authDomain: "tasking-bfc1d.firebaseapp.com",
//   projectId: "tasking-bfc1d",
//   storageBucket: "tasking-bfc1d.firebasestorage.app",
//   messagingSenderId: "18244313186",
//   appId: "1:18244313186:web:3f260f9a29b6b63504b13b"
// };

const firebaseConfig = {
  apiKey: "AIzaSyCy8_AZiOSo46TzPjJGTKjeYCu7LKZ0Fzg",
  authDomain: "thetzaddik.firebaseapp.com",
  projectId: "thetzaddik",
  storageBucket: "thetzaddik.firebasestorage.app",
  messagingSenderId: "974221269768",
  appId: "1:974221269768:web:c8584302bddce96a70aabd"
};


export const app = initializeApp(firebaseConfig);

// Export ONLY db
export const db = getFirestore(app);
