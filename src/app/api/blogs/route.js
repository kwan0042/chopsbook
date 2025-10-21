// src/app/api/blogs/route.js

import { NextResponse } from "next/server";
import { auth, db, FieldValue } from "@/lib/firebase-admin";

const appId = process.env.FIREBASE_ADMIN_APP_ID;
if (!appId) {
  throw new Error("環境變數 FIREBASE_ADMIN_APP_ID 未設定。");
}

/**
 * 輔助函式：驗證使用者是否為管理員
 * 直接從 ID Token 中讀取 customClaims，無需額外的 getUser 呼叫
 */
async function verifyAdmin(request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { isAdmin: false, error: "未經授權：未提供令牌" };
    }
    const idToken = authorization.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const isAdmin = decodedToken.isAdmin || false;
    const uid = decodedToken.uid;
    if (isAdmin) {
      return { isAdmin: true, uid };
    }
    return { isAdmin: false, error: "禁止訪問：使用者不是管理員" };
  } catch (error) {
    console.error("令牌驗證失敗：", error);
    // 根據 Firebase Auth 錯誤碼提供更具體的訊息
    if (error.code === "auth/id-token-expired") {
      return { isAdmin: false, error: "未經授權：令牌已過期" };
    }
    if (error.code === "auth/argument-error") {
      return { isAdmin: false, error: "未經授權：無效的令牌格式" };
    }
    return { isAdmin: false, error: "未經授權：無效的令牌" };
  }
}

export async function POST(request) {
  const { isAdmin, uid, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { title, content, status } = data;
    if (!title || !content || !status) {
      return NextResponse.json(
        { success: false, error: "缺少必要欄位：title, content, 或 status" },
        { status: 400 }
      );
    }
    const newBlog = {
      title,
      content,
      status,
      submittedAt: FieldValue.serverTimestamp(),
      authorId: uid,
    };
    const docRef = await db
      .collection(`artifacts/${appId}/public/data/blogs`)
      .add(newBlog);
    return NextResponse.json(
      { success: true, id: docRef.id, data: newBlog },
      { status: 201 }
    );
  } catch (error) {
    console.error("建立文章失敗：", error);
    return NextResponse.json(
      { success: false, error: "內部伺服器錯誤" },
      { status: 500 }
    );
  }
}

/**
 * 【新增】PUT 函式，用於處理可能來自前端的 PUT 請求。
 * 委派給 PATCH 處理邏輯。
 */
export async function PUT(request) {
  return PATCH(request);
}

/**
 * 處理文章更新邏輯。
 */
export async function PATCH(request) {
  const { isAdmin, uid, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少文件 ID" },
        { status: 400 }
      );
    }

    const docRef = db
      .collection(`artifacts/${appId}/public/data/blogs`)
      .doc(id);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "找不到文件" },
        { status: 404 }
      );
    }

    // 只有當狀態被明確設置為 "published" 或 "rejected" 時，才更新 reviewedAt 和 reviewedBy
    if (updateData.status === "published" || updateData.status === "rejected") {
      updateData.reviewedAt = FieldValue.serverTimestamp();
      updateData.reviewedBy = uid;
    }

    await docRef.update(updateData);

    return NextResponse.json(
      { success: true, message: "文章已成功更新" },
      { status: 200 }
    );
  } catch (error) {
    console.error("更新文章時發生內部錯誤：", error);
    return NextResponse.json(
      { success: false, error: "內部伺服器錯誤" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { isAdmin, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "查詢中缺少 blogId" },
        { status: 400 }
      );
    }
    const docRef = db
      .collection(`artifacts/${appId}/public/data/blogs`)
      .doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "找不到文章" },
        { status: 404 }
      );
    }
    const blogData = {
      id: docSnap.id,
      ...docSnap.data(),
    };
    return NextResponse.json(
      { success: true, data: blogData },
      { status: 200 }
    );
  } catch (error) {
    console.error("獲取文章失敗：", error);
    return NextResponse.json(
      { success: false, error: "內部伺服器錯誤" },
      { status: 500 }
    );
  }
}
