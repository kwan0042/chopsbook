// app/api/upload-review-image/route.js

// 🚨 移除 sharp 引入
// import sharp from "sharp";
import { bucket } from "@/lib/firebase-admin"; // ⚠️ 請確保路徑正確
import { NextResponse } from "next/server";
export const runtime = "nodejs";
/**
 * 處理圖片上傳（不進行任何轉換或優化）並儲存到 Firebase Storage。
 * @param {Request} request Next.js App Router 的標準 Request 物件
 */
export async function POST(request) {
  try {
    // 1. 使用標準 Web API 讀取 FormData
    const formData = await request.formData();

    // 取得欄位 (使用 .get() 方法)
    const userId = formData.get("userId");
    const restaurantId = formData.get("restaurantId");
    const visitCount = formData.get("visitCount");
    const imageFile = formData.get("image"); // 取得 File/Blob 物件

    // 參數檢查
    if (
      !userId ||
      !restaurantId ||
      !visitCount ||
      !imageFile ||
      !(imageFile instanceof Blob)
    ) {
      return NextResponse.json(
        { message: "缺少必要的參數或圖片檔案" },
        { status: 400 }
      );
    }

    // 2. 將 Web API File/Blob 轉換為 Node.js Buffer
    // 透過 arrayBuffer() 取得底層緩衝區
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 取得 MIME Type 和檔案名稱
    const originalMimeType = imageFile.type || "image/jpeg"; // 嘗試獲取 Mime Type
    const originalFileName = imageFile.name || `upload-temp.jpeg`;

    // 3. 🚨 移除 Sharp 轉換步驟。現在 imageBuffer 就是要上傳的內容。

    // 4. 準備檔案名和路徑
    const baseName =
      originalFileName.substring(0, originalFileName.lastIndexOf(".")) ||
      originalFileName;

    // 從檔案名稱獲取副檔名（如果存在）
    const originalExtension = originalFileName.split(".").pop() || "jpeg";

    // 加上時間戳確保檔案名唯一
    const finalFileName = `${baseName}-${Date.now()}.${originalExtension}`;

    const visitCountFolder = String(visitCount).padStart(3, "0");
    // 檔案路徑使用最終的檔案名稱
    const filePath = `public/users/${userId}/reviews/${restaurantId}/${visitCountFolder}/${finalFileName}`;

    // 5. 上傳原始圖片的緩衝區到 Firebase Storage
    const file = bucket.file(filePath);

    await file.save(imageBuffer, {
      // 🚨 直接上傳原始的 imageBuffer
      metadata: {
        contentType: originalMimeType, // ⚠️ 使用原始的 MIME Type
      },
      public: true, // 假設需要公開訪問權限
    });

    // 6. 取得下載 URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // 7. 返回結果給前端
    return NextResponse.json(
      {
        url: publicUrl,
        fileName: finalFileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Next.js App Router 圖片處理失敗:", error);
    // 返回錯誤訊息
    return NextResponse.json(
      {
        message: "圖片轉換與上傳過程中發生錯誤。",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
