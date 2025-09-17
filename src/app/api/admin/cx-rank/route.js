// This API route handles requests to check for users with a specific rank in Firebase Firestore.
// This version is adapted to read the service account credentials from a single environment variable string.

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // ✅ 從統一檔案匯入

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
