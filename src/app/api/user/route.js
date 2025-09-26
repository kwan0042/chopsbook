import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "需要 userId 參數" },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;

    if (!appId) {
      return NextResponse.json(
        { message: "環境變數 FIREBASE_APP_ID 未設置" },
        { status: 500 }
      );
    }

    const draftsRef = db.collection(
      `artifacts/${appId}/users/${userId}/draft_reviews`
    );

    const querySnapshot = await draftsRef.get();
    const drafts = [];
    querySnapshot.forEach((doc) => {
      drafts.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ drafts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { message: "獲取草稿失敗", error: error.message },
      { status: 500 }
    );
  }
}
