// src/app/api/blogs/route.js

import { NextResponse } from "next/server";
import { auth, db, FieldValue } from "@/lib/firebase-admin";

const appId = process.env.FIREBASE_ADMIN_APP_ID;
if (!appId) {
  throw new Error("環境變數 FIREBASE_ADMIN_APP_ID 未設定。");
}

// 輔助函式：驗證使用者是否為管理員
async function verifyAdmin(request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { isAdmin: false, error: "未經授權：未提供令牌" };
    }
    const idToken = authorization.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const user = await auth.getUser(decodedToken.uid);
    if (user.customClaims && user.customClaims.isAdmin) {
      return { isAdmin: true, uid: user.uid };
    }
    return { isAdmin: false, error: "禁止訪問：使用者不是管理員" };
  } catch (error) {
    console.error("令牌驗證失敗：", error);
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
    if (!data.title || !data.content) {
      return NextResponse.json(
        { success: false, error: "缺少必要欄位" },
        { status: 400 }
      );
    }
    const newBlog = {
      ...data,
      submittedAt: FieldValue.serverTimestamp(),
      status: data.status,
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

export async function PUT(request) {
  const { isAdmin, uid, error } = await verifyAdmin(request);
  console.log("後端：接收到 PUT 請求。授權結果：", { isAdmin, uid, error });

  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    console.log("後端：從請求中接收到的資料：", data);

    if (!id) {
      console.error("後端：更新失敗，缺少文件 ID。");
      return NextResponse.json(
        { success: false, error: "缺少文件 ID" },
        { status: 400 }
      );
    }

    const docRef = db
      .collection(`artifacts/${appId}/public/data/blogs`)
      .doc(id);

    console.log("後端：正在尋找文件，路徑為：", docRef.path);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.error("後端：更新失敗，找不到文件。");
      return NextResponse.json(
        { success: false, error: "找不到文件" },
        { status: 404 }
      );
    }

    // 關鍵修正：檢查前端發來的狀態是否為 "published" 或 "rejected"
    // 只有在狀態為這兩種時，才寫入 reviewedAt 和 reviewedBy
    if (updateData.status === "published" || updateData.status === "rejected") {
      updateData.reviewedAt = FieldValue.serverTimestamp();
      updateData.reviewedBy = uid;
    }

    console.log("後端：準備執行更新，最終資料為：", updateData);

    await docRef.update(updateData);

    console.log("後端：文件更新成功。");

    return NextResponse.json(
      { success: true, message: "文章已成功更新" },
      { status: 200 }
    );
  } catch (error) {
    console.error("後端：更新文章時發生內部錯誤：", error);
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
