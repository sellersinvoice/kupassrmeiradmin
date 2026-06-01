
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { app } from "../firebase.js";
import { getByField, setItem } from "./dbService.js";
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

export async function signIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("Logged in:", user.email);
    return user;

  } catch (error) {
    console.error(error);
    alert("Login failed");
  }
}

async function requestAccess(firebaseUser) {
  const email = firebaseUser.email.toLowerCase();

  const existingUser = await getByField("users", "email", email);
  if (existingUser) {
    alert("This email already has access.");
    return;
  }

  await setItem("accessRequests", email, {
    email,
    name: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    status: "pending",
    createdAt: Date.now()
  });

  alert("Access request submitted.");
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log("Signed out");
  } catch (error) {
    console.error(error);
  }
}

export function initAuth(onUserReady) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userBox = document.getElementById("userBox");
  const userName = document.getElementById("userName");

  loginBtn?.addEventListener("click", signIn);
  logoutBtn?.addEventListener("click", signOut);

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      loginBtn?.classList.remove("hidden");
      userBox?.classList.add("hidden");
      userBox?.classList.remove("flex");

      if (userName) userName.innerText = "";

      onUserReady(null);
      return;
    }

    const email = firebaseUser.email.toLowerCase();

    const appUser = await getByField("users", "email", email);

    if (!appUser) {
      loginBtn?.classList.add("hidden");
      userBox?.classList.remove("hidden");
      userBox?.classList.add("flex");

      if (userName) {
        userName.innerText = firebaseUser.email;
      }

      onUserReady({
        firebaseUser,
        appUser: null,
        needsAccess: true,
        requestAccess: () => requestAccess(firebaseUser)
      });

      return;
    }

    if (appUser.active === false) {
      alert("Your account is inactive.");
      await signOut();
      onUserReady(null);
      return;
    }

    loginBtn?.classList.add("hidden");
    userBox?.classList.remove("hidden");
    userBox?.classList.add("flex");

    if (userName) {
      userName.innerText = appUser.name || firebaseUser.displayName || email;
    }

    onUserReady({
      firebaseUser,
      appUser
    });
  });
}

// export function initAuth() {
//   const loginBtn = document.getElementById("loginBtn");
//   const logoutBtn = document.getElementById("logoutBtn");
//   const userBox = document.getElementById("userBox");
//   const userName = document.getElementById("userName");

//   loginBtn?.addEventListener("click", signIn);
//   logoutBtn?.addEventListener("click", signOut);

//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       loginBtn?.classList.add("hidden");
//       userBox?.classList.remove("hidden");
//       userBox?.classList.add("flex");

//       if (userName) {
//         userName.innerText = user.displayName || user.email;
//       }
//     } else {
//       loginBtn?.classList.remove("hidden");

//       userBox?.classList.add("hidden");
//       userBox?.classList.remove("flex");

//       if (userName) {
//         userName.innerText = "";
//       }
//     }
//   });
// }

