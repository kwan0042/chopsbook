// This API route handles requests to check for users with a specific rank in Firebase Firestore.
// This example assumes a Node.js environment (e.g., Next.js, Express) on the server.
// You must have Firebase Admin SDK set up and configured on your server for this to work.

// Import necessary Firebase Admin SDK modules
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// IMPORTANT: Replace with your actual Firebase Admin SDK credentials
// You should store this securely (e.g., as environment variables).
const serviceAccount = {
  // your service account credentials here
};

// Check if Firebase Admin app is already initialized
if (!initializeApp.length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

/**
 * Handles a GET request to find users by rank.
 * @param {Request} request The incoming request object.
 */
export async function GET(request) {
  try {
    // Get the rank from the URL query parameters
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

    // Reference the 'users' collection in Firestore
    // NOTE: You must have a 'users' collection with a 'rank' field in your Firestore.
    const usersRef = db.collection("users");

    // Query for documents where the 'rank' field matches the requested rank
    const snapshot = await usersRef.where("rank", "==", rank).get();

    if (snapshot.empty) {
      console.log(`No users found with rank: ${rank}`);
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

    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`Found ${users.length} users with rank: ${rank}`);
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
