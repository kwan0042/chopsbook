import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const appId = searchParams.get("appId");

    // Check if the necessary parameters are missing.
    if (!userId || !appId) {
      return NextResponse.json(
        { error: "Missing required parameters (userId or appId)" },
        { status: 400 }
      );
    }

    // Reference the user's document using the dynamic appId.
    const userDocRef = db.collection(`artifacts/${appId}/users`).doc(userId);
    const userDocSnap = await userDocRef.get();

    // If the user document doesn't exist, return an empty array.
    if (!userDocSnap.exists) {
      return NextResponse.json({ favoriteRestaurants: [] }, { status: 200 });
    }

    const userData = userDocSnap.data();
    const favoriteRestaurants = userData.favoriteRestaurants || [];

    // Return the list of favorite restaurant IDs.
    return NextResponse.json({ favoriteRestaurants });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
