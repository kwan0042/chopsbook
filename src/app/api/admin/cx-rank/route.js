// This API route handles requests to check for users with a specific rank in Firebase Firestore.
// This version is adapted to read the service account credentials from a single environment variable string.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// The environment variable containing the service account JSON string.
const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;

let serviceAccount;

try {
  if (serviceAccountString) {
    // Parse the JSON string into a JavaScript object.
    serviceAccount = JSON.parse(serviceAccountString);
  } else {
    // If the environment variable is not set, throw an error.
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is not set."
    );
  }
} catch (error) {
  // If parsing fails, it means the JSON string is malformed.
  console.error("Failed to parse the service account JSON string:", error);
  // Re-throw the error to halt the build process.
  throw new Error("Invalid service account JSON format.");
}

// Check if a Firebase Admin app is already initialized.
// This is the correct way to prevent re-initialization in a hot-reloading environment.
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

/**
 * Handles a GET request to find users by rank.
 * @param {Request} request The incoming request object from Next.js.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rank = searchParams.get("rank");

    if (!rank) {
      return new Response(
        JSON.stringify({ error: "Missing 'rank' query parameter." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("rank", "==", rank).get();

    if (snapshot.empty) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No users found with rank '${rank}'.`,
          users: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Found ${users.length} users with rank '${rank}'.`,
        users,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching rank data:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An internal server error occurred.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
