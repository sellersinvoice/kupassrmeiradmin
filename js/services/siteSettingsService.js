import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const moduleBackgroundsRef = doc(db, "siteSettings", "moduleBackgrounds");
const brandingRef = doc(db, "siteSettings", "branding");

export async function getModuleBackgrounds() {
  const snapshot = await getDoc(moduleBackgroundsRef);

  if (!snapshot.exists()) return {};

  return snapshot.data();
}

export async function updateModuleBackground(moduleId, imageUrl) {
  await setDoc(moduleBackgroundsRef, {
    [moduleId]: imageUrl
  }, { merge: true });
}

export async function updateModuleBackgrounds(backgrounds) {
  await setDoc(moduleBackgroundsRef, backgrounds, { merge: true });
}

export async function getBrandingSettings() {
  const snapshot = await getDoc(brandingRef);

  if (!snapshot.exists()) return {};

  return snapshot.data();
}

export async function updateBrandingSettings(settings) {
  await setDoc(brandingRef, settings, { merge: true });
}
