
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDgN2d4_cbMaMxZtm2LuCF_x53XJMsSlqA",
    authDomain: "doc-ai-beta.firebaseapp.com",
    projectId: "doc-ai-beta",
    storageBucket: "doc-ai-beta.firebasestorage.app",
    messagingSenderId: "429958132255",
    appId: "1:429958132255:web:6a25bc17c0270f1f459b2a",
    measurementId: "G-B82V0XE3RT"
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

// A robust check to ensure all necessary keys are present.
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (isFirebaseConfigured) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
} else {
    console.warn("Firebase configuration is missing or incomplete. Firebase services will be disabled. Please provide all necessary keys in your .env file.");
    // Assign null to satisfy TypeScript when not configured.
    // @ts-ignore
    app = null;
    // @ts-ignore
    auth = null;
    // @ts-ignore
    storage = null;
}

export { app, auth, storage, isFirebaseConfigured };
