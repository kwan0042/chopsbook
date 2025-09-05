// src/app/api/admin/set-claims/route.js
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { auth, app } from "../../../../lib/firebase-admin"; // 請確保此路徑正確，或使用 @/lib/firebase-admin

export async function POST(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const idToken = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!idToken) {
    return new Response(
      JSON.stringify({ message: "Unauthorized: No token provided" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { targetUserUid, newClaims } = await req.json();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    // 檢查呼叫者是否為超級管理員
    if (!decodedToken.isSuperAdmin) {
      return new Response(
        JSON.stringify({ message: "Forbidden: Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!targetUserUid || typeof newClaims !== "object") {
      return new Response(
        JSON.stringify({ message: "Missing target user UID or claims" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 更新 Firebase Auth 中的 Custom Claims
    await auth.setCustomUserClaims(targetUserUid, newClaims);

    // 更新 Firestore 中的用戶資料
    const db = getFirestore(app);
    // 修正點：使用正確的 App ID
    await db
      .doc(`artifacts/default-app-id/users/${targetUserUid}`)
      .update(newClaims);

    return new Response(
      JSON.stringify({ message: "Successfully updated user claims" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return new Response(
      JSON.stringify({ message: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
