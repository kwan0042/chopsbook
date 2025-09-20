// src/app/api/admin/set-claims/route.js
import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase-admin";

const appId = process.env.FIREBASE_ADMIN_APP_ID;
if (!appId) {
  throw new Error("環境變數 FIREBASE_ADMIN_APP_ID 未設定。");
}

export async function POST(req) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 }
    );
  }

  const idToken = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!idToken) {
    return NextResponse.json(
      { message: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  const { targetUserUid, newClaims } = await req.json();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerIsSuperAdmin = decodedToken.isSuperAdmin === true;
    const callerIsAdmin = decodedToken.isAdmin === true;

    if (!callerIsAdmin && !callerIsSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    if (!targetUserUid || typeof newClaims !== "object") {
      return NextResponse.json(
        { message: "Missing target user UID or claims" },
        { status: 400 }
      );
    }

    // 確保呼叫者不是試圖修改自己的權限
    if (targetUserUid === decodedToken.uid) {
      return NextResponse.json(
        { message: "Forbidden: You cannot modify your own claims." },
        { status: 403 }
      );
    }

    const targetUser = await auth.getUser(targetUserUid);
    const targetIsSuperAdmin = targetUser.customClaims?.isSuperAdmin === true;

    if (targetIsSuperAdmin && !callerIsSuperAdmin) {
      return NextResponse.json(
        {
          message:
            "Forbidden: Only a super admin can manage another super admin's claims.",
        },
        { status: 403 }
      );
    }

    if (!callerIsSuperAdmin && newClaims.isSuperAdmin) {
      return NextResponse.json(
        {
          message: "Forbidden: Only a super admin can create a super admin.",
        },
        { status: 403 }
      );
    }

    await auth.setCustomUserClaims(targetUserUid, newClaims);
    await db
      .doc(
        `artifacts/${appId}/users/${targetUserUid}/privateData/${targetUserUid}`
      )
      .update(newClaims);

    return NextResponse.json(
      { message: "Successfully updated user claims" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return NextResponse.json(
      { message: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
