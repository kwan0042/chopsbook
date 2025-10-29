// /app/login/page.js (Server Component)

import React, { Suspense } from "react";
// 假設您的 Client Component 位於 /app/login/LoginPageClient.js 或類似路徑
import LoginPage from "@/components/auth/Login";

// 由於您的 LoginPage (Client Component) 內部使用了 useSearchParams()，
// 必須將其包裹在 <Suspense> 中，以防止 Next.js 在伺服器預渲染時出錯。
// 這樣做可以確保在 SSR 階段安全地跳過 useSearchParams 相關的處理，
// 並在客戶端水合時正確執行。

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      {/* 這裡導入您的 Client Component */}
      <LoginPage />
    </Suspense>
  );
}

// 注意：如果您的 LoginPage 文件就是您提供的代碼，您需要將其名稱和導入路徑對應修改。
// 例如：將您提供的代碼移動到一個名為 LoginPageClient.js 的文件中，然後在這裡導入。
