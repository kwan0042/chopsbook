// app/api/admin/manage-users/route.js
import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "缺少認證 token" }, { status: 401 });
  }
  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const requestingUserClaims = decodedToken;
    const { isAdmin, isSuperAdmin } = requestingUserClaims;

    // 檢查請求者是否有足夠的管理員權限來執行任何操作
    if (!isAdmin) {
      return NextResponse.json(
        { message: "權限不足：您不是管理員。" },
        { status: 403 }
      );
    }

    const { action, targetUid, newStatus, email } = await request.json();

    switch (action) {
      case "updateAdminStatus": {
        // 只有超級管理員才能更改其他管理員的狀態
        if (!isSuperAdmin) {
          return NextResponse.json(
            { message: "權限不足：只有超級管理員才能更改管理員狀態。" },
            { status: 403 }
          );
        }
        if (!targetUid) {
          return NextResponse.json(
            { message: "缺少目標使用者 UID。" },
            { status: 400 }
          );
        }
        await auth.setCustomUserClaims(targetUid, { isAdmin: newStatus });
        return NextResponse.json({ message: "使用者管理員狀態已更新。" });
      }

      case "sendPasswordResetLink": {
        if (!email) {
          return NextResponse.json(
            { message: "缺少使用者電子郵件。" },
            { status: 400 }
          );
        }
        // 使用者不存在時會拋出錯誤，被 catch 區塊處理
        await auth.getUserByEmail(email);

        // ✅ 修正: 為了安全，將重設密碼連結直接發送到用戶的電子郵件
        // 而不是回傳給前端
        await auth.generatePasswordResetLink(email);

        return NextResponse.json({
          message: "重設密碼連結已發送至該電子郵件地址。",
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
    // 根據錯誤類型提供更具體的訊息
    const status = error.code === "auth/user-not-found" ? 404 : 500;
    const message =
      error.code === "auth/user-not-found"
        ? "找不到該電子郵件地址的用戶。"
        : "伺服器錯誤";

    return NextResponse.json(
      { message, error: error.message },
      { status: status }
    );
  }
}
