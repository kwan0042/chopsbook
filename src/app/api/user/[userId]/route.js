// src/app/api/user/[userId]/route.js
import { auth, db } from "@/lib/firebase-admin";

/**
 * 共用驗證函式：驗證 Token 並檢查授權
 * @param {Request} request Next.js Request 物件
 * @param {string} userId 從 URL 參數取得的用戶 ID
 * @returns {{decodedToken: object, userUID: string} | Response}
 */
async function authenticateAndAuthorize(request, userId) {
  const authorization = request.headers.get("Authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ message: "未授權：缺少或格式錯誤的 Token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const idToken = authorization.split("Bearer ")[1];
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Token 驗證失敗:", error.message);
    return new Response(JSON.stringify({ message: "未授權：無效的 Token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 授權檢查: 確保用戶只能操作自己的帳戶/資料
  if (decodedToken.uid !== userId) {
    return new Response(
      JSON.stringify({ message: "禁止操作：您無權修改或刪除其他用戶的帳戶" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return { decodedToken, userUID: decodedToken.uid };
}

// --- POST 請求：更新資料 ---
/**
 * 處理 POST 請求 - 修改用戶帳戶的公開和私人資料。
 * 路徑: /api/user/[userId]
 * @param {Request} request Next.js Request 物件
 * @param {object} context 包含動態路由參數的物件 (userId)
 * @returns {Response}
 */
export async function POST(request, context) {
  // 🔑 關鍵修正: 確保 context.params 在使用前被 await (解決 Next.js 警告)
  const unwrappedParams = await context.params;
  const { userId } = unwrappedParams;

  // 1. 驗證與授權
  const authResult = await authenticateAndAuthorize(request, userId);
  if (authResult instanceof Response) {
    return authResult; // 返回錯誤回應
  }
  const { userUID } = authResult;

  // 2. 取得並解析請求主體 (Body)
  let data;
  try {
    data = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "請求格式錯誤：Body 無法解析" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 接收前端傳來的 publicUpdates 和 privateUpdates
  const { publicUpdates, privateUpdates } = data;

  if (
    Object.keys(publicUpdates || {}).length === 0 &&
    Object.keys(privateUpdates || {}).length === 0
  ) {
    return new Response(
      JSON.stringify({ message: "請求中沒有提供任何更新資料" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. 執行資料庫更新操作
  try {
    const batch = db.batch();

    // --- A. 更新用戶公共資料 ---
    if (publicUpdates && Object.keys(publicUpdates).length > 0) {
      const userDataRef = db.doc(`artifacts/default-app-id/users/${userUID}`);
      batch.update(userDataRef, publicUpdates);
    }

    // --- B. 更新用戶私人資料 ---
    if (privateUpdates && Object.keys(privateUpdates).length > 0) {
      const privateDataRef = db.doc(
        `artifacts/default-app-id/users/${userUID}/privateData/${userUID}`
      );
      // 使用 set(..., { merge: true }) 進行更新/新增私人資料
      batch.set(privateDataRef, privateUpdates, { merge: true });
    }

    // 提交批量操作
    await batch.commit();

    return new Response(JSON.stringify({ message: "資料已成功更新" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`更新用戶 ${userId} 資料失敗:`, error);
    return new Response(
      JSON.stringify({
        message: "伺服器錯誤：更新資料失敗",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// --- DELETE 請求：刪除帳戶 ---
/**
 * 處理 DELETE 請求 - 刪除用戶帳戶及其所有資料。
 * 路徑: /api/user/[userId]
 * @param {Request} request Next.js Request 物件
 * @param {object} context 包含動態路由參數的物件
 * @returns {Response}
 */
export async function DELETE(request, context) {
  // 🔑 關鍵修正: 確保 context.params 在使用前被 await (解決 Next.js 警告)
  const unwrappedParams = await context.params;
  const { userId } = unwrappedParams;

  // 1. 驗證與授權
  const authResult = await authenticateAndAuthorize(request, userId);
  if (authResult instanceof Response) {
    return authResult; // 返回錯誤回應
  }
  const { userUID } = authResult;

  // 2. 執行資料刪除操作 (遵循加拿大隱私法規)
  try {
    const batch = db.batch();

    // --- A. 刪除所有私人資料 ---
    const privateDataRef = db.doc(
      `artifacts/default-app-id/users/${userUID}/privateData/${userUID}`
    );
    batch.delete(privateDataRef);

    // --- B. 刪除用戶公共資料 ---
    const userDataRef = db.doc(`artifacts/default-app-id/users/${userUID}`);
    batch.delete(userDataRef);

    // 提交批量操作
    await batch.commit();

    // --- C. 刪除 Firebase Authentication 用戶 ---
    await auth.deleteUser(userUID);

    console.log(`用戶及其資料已成功刪除: UID ${userUID}`);

    return new Response(JSON.stringify({ message: "帳戶已成功刪除" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`刪除用戶 ${userId} 失敗:`, error);

    // 針對 Firebase 錯誤進行回覆
    return new Response(
      JSON.stringify({
        message: "伺服器錯誤：刪除帳戶失敗",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 阻止其他 HTTP 方法 (如 GET, PUT) 訪問此路由
export async function GET() {
  return new Response(null, { status: 405 });
}
