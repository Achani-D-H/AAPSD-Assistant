import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-adminsdk.json';
    const fileContents = readFileSync(join(process.cwd(), serviceAccountPath), 'utf8');
    serviceAccount = JSON.parse(fileContents);
  }
  if (serviceAccount && typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch {
  console.warn(
    '⚠️  Could not load Firebase Service Account from file or env. Using default project ID (aapsd-assistant).',
  );
}

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'aapsd-assistant',
    });
  }
}

export const firebaseAuth = getAuth();
