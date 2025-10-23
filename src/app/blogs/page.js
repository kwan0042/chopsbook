// app/blogs/page.js

import { db } from "@/lib/firebase-admin"; // 引入您提供的 Admin SDK db
import BlogsClientPage from "@/components/blogs/BlogsClientPage"; // 引入 Client Component
import LoadingSpinner from "@/components/LoadingSpinner";

const ITEMS_PER_PAGE = 9; // 每頁 9 篇文章

// --- SEO 優化：設置靜態 Metadata ---
export const metadata = {
  // 頁面標題：最關鍵的 SEO 元素
  title: "所有文章 | ChopsBook",
  metadataBase: new URL("https://chopsbook.com"),
  // 頁面描述
  description:
    "瀏覽最全面的多倫多餐廳食評與美食交流文章。發掘多倫多最佳餐廳推介、必食菜單及餐飲趨勢。使用智慧搜尋和菜系標籤，快速找到您下一餐的美食靈感！",

  // Open Graph 標籤 (用於社群媒體)
  openGraph: {
    title: "所有文章 | ChopsBook",
    description:
      "瀏覽最全面的多倫多餐廳食評與美食交流文章。發掘多倫多最佳餐廳推介、必食菜單及餐飲趨勢。使用智慧搜尋和菜系標籤，快速找到您下一餐的美食靈感！",
    url: "https://chopsbook.com/blogs",
    siteName: "ChopsBook",
    images: [
      {
        url: "https://chopsbook/Chopsbook_logo_white_v2.png",
        width: 800,
        height: 600,
      },
    ],
  },

  // 設置機器人指令
  robots: {
    index: true,
    follow: true,
  },
};
// ------------------------------------

// Server Component 接收 Next.js 的 searchParams
const BlogsPage = async ({ searchParams }) => {
  if (!db) {
    console.error("Firebase Admin DB 未初始化。");
    return (
      <div className="flex justify-center items-center h-screen p-8 text-center text-red-500">
        <p>服務初始化失敗，請稍後再試。</p>
      </div>
    );
  }

  // >>>>> 修復：必須先 await searchParams 以避免 Next.js 錯誤 <<<<<
  const resolvedSearchParams = await searchParams;

  // 從 URL 獲取參數 (使用 resolvedSearchParams)
  // 注意：這裡只會接收 URL 中的值，不會有 %0A
  const currentPage = parseInt(resolvedSearchParams.page) || 1;
  const searchKeyword = resolvedSearchParams.keyword || "";
  const selectedTag = resolvedSearchParams.tag || "";
  // lastCursor 格式：submittedAt_id
  const lastCursor = resolvedSearchParams.lastCursor || "";
  // >>>>> 修復完成 <<<<<

  let initialBlogs = [];
  let totalBlogsCount = 0;
  let availableTags = [];
  let nextCursor = ""; // 儲存下一頁的起始遊標
  const blogsColRef = db.collection(
    `artifacts/${process.env.FIREBASE_ADMIN_APP_ID}/public/data/blogs`
  );

  try {
    // 1. 獲取總文章數
    const countSnapshot = await blogsColRef
      .where("status", "==", "published")
      .count()
      .get();
    totalBlogsCount = countSnapshot.data().count;

    // 2. 獲取所有標籤
    const tagsSnapshot = await blogsColRef
      .where("status", "==", "published")
      .select("tags")
      .get();

    availableTags = tagsSnapshot.docs
      .reduce((acc, doc) => {
        const blog = doc.data();
        if (blog.tags && Array.isArray(blog.tags)) {
          blog.tags.forEach((tag) => {
            if (tag && !acc.includes(tag)) {
              acc.push(tag);
            }
          });
        }
        return acc;
      }, [])
      .sort();

    // 3. 建立基礎查詢
    let finalQuery = blogsColRef
      .where("status", "==", "published")
      .orderBy("submittedAt", "desc")
      .limit(ITEMS_PER_PAGE);

    // 4. 應用標籤篩選
    if (selectedTag) {
      // 注意：這裡使用的 selectedTag 已經是從 URL 參數中解析出來的值
      finalQuery = finalQuery.where("tags", "array-contains", selectedTag);
    }

    // 5. 應用分頁遊標 (Cursor-based Pagination)
    if (lastCursor && currentPage > 1) {
      const parts = lastCursor.split("_");
      const submittedAt = parseInt(parts[0]);
      const docId = parts[1];

      // 使用 submittedAt 和 docId 作為 startAfter 的兩個排序鍵
      finalQuery = finalQuery.startAfter(submittedAt, docId);
    }

    // 6. 執行分頁查詢
    const querySnapshot = await finalQuery.get();

    initialBlogs = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        summary: data.summary || "",
        tags: data.tags || [],
        submittedAt: data.submittedAt,
        coverImage: data.coverImage || null,
      };
    });

    // 7. 設置下一頁的遊標
    if (initialBlogs.length > 0) {
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const lastSubmittedAt = lastDoc.data().submittedAt;
      const lastId = lastDoc.id;
      nextCursor = `${lastSubmittedAt}_${lastId}`;
    }
  } catch (error) {
    console.error("載入已發布文章失敗:", error);
    return (
      <div className="flex justify-center items-center h-screen p-8 text-center text-red-500">
        <p>無法載入文章列表，請稍後再試。</p>
      </div>
    );
  }

  // 計算總頁數
  const totalPages = Math.ceil(totalBlogsCount / ITEMS_PER_PAGE);

  // 傳遞所有必要的數據給 Client Component
  return (
    <BlogsClientPage
      initialBlogs={initialBlogs}
      availableTags={availableTags}
      itemsPerPage={ITEMS_PER_PAGE}
      currentPage={currentPage}
      totalPages={totalPages}
      initialKeyword={searchKeyword}
      initialTag={selectedTag}
      nextCursor={nextCursor}
    />
  );
};

export default BlogsPage;
