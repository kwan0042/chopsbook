// app/api/upload-review-image/route.js

import sharp from "sharp";
import { bucket } from "@/lib/firebase-admin"; // ⚠️ 請確保路徑正確
import { NextResponse } from "next/server";

/**
 * 處理圖片上傳、Sharp 轉換為 WebP 並儲存到 Firebase Storage。
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

    // 2. 將 Web API File/Blob 轉換為 Sharp 需要的 Node.js Buffer
    // 透過 arrayBuffer() 取得底層緩衝區
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 3. Sharp 轉換
    const webpBuffer = await sharp(imageBuffer)
      // 最佳化: 限制最大尺寸為 1024x1024 像素，保持比例
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 }) // 轉換為 WebP，設定質量為 80
      .toBuffer();

    // 4. 準備檔案名和路徑
    const originalFileName = imageFile.name || `upload-temp.jpeg`;
    const baseName =
      originalFileName.substring(0, originalFileName.lastIndexOf(".")) ||
      originalFileName;
    // 加上時間戳確保檔案名唯一
    const webpFileName = `${baseName}-${Date.now()}.webp`;

    const visitCountFolder = String(visitCount).padStart(3, "0");
    const filePath = `public/users/${userId}/reviews/${restaurantId}/${visitCountFolder}/${webpFileName}`;

    // 5. 上傳 WebP 緩衝區到 Firebase Storage
    const file = bucket.file(filePath);

    await file.save(webpBuffer, {
      metadata: {
        contentType: "image/webp",
      },
      public: true, // 假設需要公開訪問權限
    });

    // 6. 取得下載 URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // 7. 返回結果給前端
    return NextResponse.json(
      {
        url: publicUrl,
        fileName: webpFileName,
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
