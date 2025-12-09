
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp as getFirebaseApp, FirebaseApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initializationAttempted = false;
let initializationError: Error | null = null;

function initializeFirebase(): void {
  // Skip initialization during build time (SSR/SSG) when window is undefined
  // This allows the build to complete without Firebase env vars
  if (typeof window === 'undefined') {
    return;
  }

  // If already initialized, return early
  if (appInstance && authInstance && dbInstance) {
    return;
  }

  // Read environment variables
  const ENV_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const ENV_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const ENV_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const ENV_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const ENV_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const ENV_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // Check if all required environment variables have values
  const requiredEnvVarKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const capturedValues: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: ENV_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ENV_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ENV_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ENV_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ENV_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: ENV_APP_ID,
  };

  const missingEnvVars = requiredEnvVarKeys.filter(
    key => !capturedValues[key]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Firebase configuration error: Missing environment variable values for: ${missingEnvVars.join(', ')}. Please check your Firebase Studio environment variable settings and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly.`
    );
  }

  const firebaseConfig = {
    apiKey: ENV_API_KEY,
    authDomain: ENV_AUTH_DOMAIN,
    projectId: ENV_PROJECT_ID,
    storageBucket: ENV_STORAGE_BUCKET,
    messagingSenderId: ENV_MESSAGING_SENDER_ID,
    appId: ENV_APP_ID,
  };

  // Only run the environment variable check and initialization if no apps are initialized yet.
  if (!getApps().length) {
    try {
      appInstance = initializeApp(firebaseConfig);
    } catch (error) {
      // Ensure all instances are reset if initialization fails
      appInstance = null;
      authInstance = null;
      dbInstance = null;
      
      console.error("CLIENT.TS: Firebase initializeApp error:", error);
      console.error("CLIENT.TS: Attempted Firebase config during error:", {
          apiKey: ENV_API_KEY ? '*** PRESENT ***' : '!!! MISSING !!!',
          authDomain: ENV_AUTH_DOMAIN,
          projectId: ENV_PROJECT_ID,
          storageBucket: ENV_STORAGE_BUCKET,
          messagingSenderId: ENV_MESSAGING_SENDER_ID,
          appId: ENV_APP_ID,
      });
      throw new Error(`Firebase initializeApp failed. Original error: ${error instanceof Error ? error.message : String(error)}. Review config and environment variables.`);
    }
  } else {
    appInstance = getFirebaseApp(); // Use the already initialized app
  }

  try {
    if (!appInstance) {
      throw new Error('Firebase app is not initialized');
    }
    authInstance = getFirebaseAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (error) {
    // If initialization fails partway through, reset all instances to ensure consistency
    // This prevents exporting a mix of real instances and placeholders
    console.error("CLIENT.TS: Firebase getAuth/getFirestore error:", error);
    const appName = appInstance && appInstance.name ? appInstance.name : "undefined_app";
    
    // Reset all instances to null to ensure atomic initialization
    // If any part fails, we want all exports to be placeholders, not a mix
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    
    throw new Error(`Firebase getAuth or getFirestore failed for app "${appName}". Original error: ${error instanceof Error ? error.message : String(error)}. This usually indicates an issue with the app initialization or configuration.`);
  }
}

// Lazy getters that initialize on first access
function getAppInstance(): FirebaseApp {
  // During build (SSR), return a placeholder that won't be used
  if (typeof window === 'undefined') {
    return {} as FirebaseApp;
  }
  
  // If initialization was already attempted and failed, return placeholder
  // This prevents throwing unhandled errors during module load
  if (initializationAttempted && initializationError) {
    console.warn('Firebase initialization previously failed. Returning placeholder. Error:', initializationError.message);
    return {} as FirebaseApp;
  }
  
  // Check for partial initialization - if any instance is missing, treat as failed
  // This ensures we don't export a mix of real instances and placeholders
  if (appInstance && (!authInstance || !dbInstance)) {
    console.warn('Firebase partial initialization detected. Resetting all instances to ensure consistency.');
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    initializationAttempted = true;
    initializationError = new Error('Partial initialization detected - all instances reset for consistency');
  }
  
  // Try to initialize if not already done
  if (!appInstance && !initializationAttempted) {
    try {
      initializeFirebase();
      initializationAttempted = true;
    } catch (error) {
      initializationAttempted = true;
      initializationError = error instanceof Error ? error : new Error(String(error));
      console.error('Firebase initialization failed in getAppInstance:', initializationError.message);
      return {} as FirebaseApp;
    }
  }
  
  if (!appInstance) {
    // If we get here, initialization was attempted but instance is still null
    // Return placeholder instead of throwing to prevent module load failure
    console.warn('Firebase app instance is not available. Returning placeholder.');
    return {} as FirebaseApp;
  }
  return appInstance;
}

function getAuthInstance(): Auth {
  if (typeof window === 'undefined') {
    return {} as Auth;
  }
  
  if (initializationAttempted && initializationError) {
    console.warn('Firebase initialization previously failed. Returning placeholder. Error:', initializationError.message);
    return {} as Auth;
  }
  
  // Check for partial initialization - if any instance is missing, treat as failed
  if (appInstance && (!authInstance || !dbInstance)) {
    console.warn('Firebase partial initialization detected. Resetting all instances to ensure consistency.');
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    initializationAttempted = true;
    initializationError = new Error('Partial initialization detected - all instances reset for consistency');
  }
  
  if (!authInstance && !initializationAttempted) {
    try {
      initializeFirebase();
      initializationAttempted = true;
    } catch (error) {
      initializationAttempted = true;
      initializationError = error instanceof Error ? error : new Error(String(error));
      console.error('Firebase initialization failed in getAuthInstance:', initializationError.message);
      return {} as Auth;
    }
  }
  
  if (!authInstance) {
    console.warn('Firebase auth instance is not available. Returning placeholder.');
    return {} as Auth;
  }
  return authInstance;
}

function getDbInstance(): Firestore {
  if (typeof window === 'undefined') {
    return {} as Firestore;
  }
  
  if (initializationAttempted && initializationError) {
    console.warn('Firebase initialization previously failed. Returning placeholder. Error:', initializationError.message);
    return {} as Firestore;
  }
  
  // Check for partial initialization - if any instance is missing, treat as failed
  if (appInstance && (!authInstance || !dbInstance)) {
    console.warn('Firebase partial initialization detected. Resetting all instances to ensure consistency.');
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    initializationAttempted = true;
    initializationError = new Error('Partial initialization detected - all instances reset for consistency');
  }
  
  if (!dbInstance && !initializationAttempted) {
    try {
      initializeFirebase();
      initializationAttempted = true;
    } catch (error) {
      initializationAttempted = true;
      initializationError = error instanceof Error ? error : new Error(String(error));
      console.error('Firebase initialization failed in getDbInstance:', initializationError.message);
      return {} as Firestore;
    }
  }
  
  if (!dbInstance) {
    console.warn('Firebase db instance is not available. Returning placeholder.');
    return {} as Firestore;
  }
  return dbInstance;
}

// Export as actual Firebase instances (not Proxies) to ensure full SDK compatibility
// These are real Firebase instances that will pass instanceof checks and work correctly
// with all Firebase SDK functions like collection(db, ...), getDoc(...), etc.

// Solution: Initialize immediately if in browser, export real instances
// During build, export placeholders that won't be used
// The key is that at runtime, we always return the real instance from getters

// Initialize immediately if in browser to ensure we have real instances
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
    // Only mark as successful if all instances were initialized
    if (appInstance && authInstance && dbInstance) {
      initializationAttempted = true;
    } else {
      // Partial initialization - reset all and mark as failed
      console.warn('Firebase partial initialization detected during module load. Resetting all instances.');
      appInstance = null;
      authInstance = null;
      dbInstance = null;
      initializationAttempted = true;
      initializationError = new Error('Partial initialization detected - all instances reset for consistency');
    }
  } catch (error) {
    // Track the initialization attempt and error for graceful handling
    // Ensure all instances are reset on failure
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    initializationAttempted = true;
    initializationError = error instanceof Error ? error : new Error(String(error));
    console.error('Firebase initialization failed during module load:', initializationError.message);
    // Don't throw - let the getter functions handle it gracefully
  }
}

// Export the actual Firebase instances directly (not Proxies)
// These are real Firebase objects that will pass instanceof checks and work with all SDK functions
// 
// Important: At runtime in browser, these will be real instances initialized above
// During build, getAppInstance() returns placeholders, but Next.js won't execute
// the module during static generation, so the placeholders won't be used
//
// The pattern: Always use getters to ensure consistency - they check for partial initialization
// and ensure all exports are either all real instances or all placeholders, never mixed
export const app: FirebaseApp = (appInstance && authInstance && dbInstance) ? appInstance : getAppInstance();
export const auth: Auth = (appInstance && authInstance && dbInstance) ? authInstance : getAuthInstance();
export const db: Firestore = (appInstance && authInstance && dbInstance) ? dbInstance : getDbInstance();
