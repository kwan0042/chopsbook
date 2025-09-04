// app/api/admin/manage-users/route.js
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// 確保 Firebase Admin SDK 只被初始化一次
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    throw new Error("伺服器配置錯誤：無法初始化 Firebase Admin SDK。");
  }
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "缺少認證 token" }, { status: 401 });
  }
  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestingUser = decodedToken;

    if (!requestingUser.isAdmin) {
      return NextResponse.json(
        { message: "權限不足：您不是管理員。" },
        { status: 403 }
      );
    }

    const { action, targetUid, newStatus, email } = await request.json();

    switch (action) {
      case "updateAdminStatus": {
        if (!targetUid) {
          return NextResponse.json(
            { message: "缺少目標使用者 UID。" },
            { status: 400 }
          );
        }
        await admin
          .auth()
          .setCustomUserClaims(targetUid, { isAdmin: newStatus });
        return NextResponse.json({ message: "使用者管理員狀態已更新。" });
      }

      case "sendPasswordResetLink": {
        if (!email) {
          return NextResponse.json(
            { message: "缺少使用者電子郵件。" },
            { status: 400 }
          );
        }
        await admin.auth().getUserByEmail(email); // 檢查使用者是否存在
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        console.log(`管理員為 ${email} 生成了重設密碼連結：${resetLink}`);
        return NextResponse.json({
          message: "重設密碼連結已生成並回傳。",
          resetLink,
        });
      }

      default:
        return NextResponse.json(
          { message: "無效的操作動作。" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("API Route 處理失敗:", error);
    return NextResponse.json(
      { message: "伺服器錯誤", error: error.message },
      { status: 500 }
    );
  }
}
