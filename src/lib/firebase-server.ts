import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import serviceAccountJson from './firebase-service-account.json';

let adminApp: App;
let adminAuth: Auth;
let db: Firestore;

// Cast the imported JSON to the ServiceAccount type
const serviceAccount = serviceAccountJson as ServiceAccount;

// Check if the service account has the necessary properties
if (serviceAccount && serviceAccount.project_id) {
    if (!getApps().length) {
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        adminApp = getApp();
    }
    adminAuth = getAdminAuth(adminApp);
    db = getFirestore(adminApp);
} else {
    console.warn("Firebase Admin SDK service account key is missing or invalid in 'src/lib/firebase-service-account.json'. Server-side features will be limited.");
    // @ts-ignore - Assign null to satisfy TypeScript when not configured.
    adminApp = null;
    // @ts-ignore
    adminAuth = null;
    // @ts-ignore
    db = null;
}

export { adminAuth as auth, db };
