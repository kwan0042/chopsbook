// src/components/home/PromotionsSection.js (假設路徑)
import React from "react";

const PromotionsSection = () => {
  const promotions = [
    {
      id: 1,
      title: "夏日特惠：飲品買一送一！",
      imageUrl: "https://placehold.co/300x180/FFD700/000000?text=夏日特惠",
    },
    {
      id: 2,
      title: "新用戶專享：首單八折！",
      imageUrl: "https://placehold.co/300x180/ADFF2F/000000?text=新用戶優惠",
    },
    {
      id: 3,
      title: "週末限定：家庭套餐優惠！",
      imageUrl: "https://placehold.co/300x180/8A2BE2/FFFFFF?text=週末限定",
    },
    {
      id: 4,
      title: "會員專享：積分雙倍！",
      imageUrl: "https://placehold.co/300x180/FF6B6B/FFFFFF?text=會員優惠",
    },
    // 💡 增加更多項目以展示橫向滾動效果
    {
      id: 5,
      title: "咖啡買二送一",
      imageUrl: "https://placehold.co/300x180/00BFFF/000000?text=咖啡優惠",
    },
    {
      id: 6,
      title: "甜點新品上市",
      imageUrl: "https://placehold.co/300x180/FFC0CB/000000?text=甜點新品",
    },
  ];

  return (
    // 1. 【移除 bg-white】: 移除背景色，並將內邊距和陰影調整為響應式。
    // 手機上內邊距更小 (py-4)，圓角更小 (rounded-md)，陰影更小 (shadow-sm)。
    <section className="py-4 md:py-12 px-0 md:bg-white md:px-6 lg:px-8 md:shadow-md rounded-md md:rounded-lg">
      
      {/* 調整：手機版標題變小 (text-xl)，下邊距變小 (mb-4)，並確保有左右內邊距。 */}
      <h2 className="text-xl md:text-2xl md:text-center font-extrabold text-gray-900 px-4 md:px-0 mb-4 md:mb-8">
        最新推廣與精選
      </h2>

      {/* 2. 【橫向滾動容器】: 保持 flex/overflow-x-scroll 實現橫向，用 md:grid 保護網頁版。 */}
      <div className="flex overflow-x-scroll md:grid md:grid-cols-4 gap-3 md:gap-6 max-w-screen-xl mx-auto pl-4 pr-4 md:px-0 scrollbar-hide">
        {promotions.map((promo) => (
          // 3. 【卡片高度調整】：確保在手機上高度適中 (h-28)，文字適中 (p-3)，保持易讀。
          <div
            key={promo.id}
            className="
            flex-shrink-0 w-[40vw] sm:w-[20vw] md:w-auto  
            bg-gray-50 rounded-lg my-1 
            transform hover:scale-102 transition duration-300 ease-in-out border border-gray-200
          "
          >
            <img
              src={promo.imageUrl}
              alt={promo.title}
              // 圖片高度調整：h-28 (手機) -> h-36 (小平板) -> h-40 (網頁)
              className="w-full h-28 sm:h-36 md:h-40 object-cover rounded-t-lg" 
            />
            <div className="p-3"> {/* 內邊距適度縮小 */}
              {/* 文字變細 (text-base) 確保易讀 */}
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 whitespace-normal">
                {promo.title}
              </h3>
              {/* 連結文字縮小 (text-xs) */}
              <p className="text-blue-700 text-xs md:text-sm font-medium hover:underline cursor-pointer">
                查看詳情 &rarr;
              </p>
            </div>
          </div>
        ))}
        {/* 在橫向滾動末端增加間距，防止最後一張卡片貼邊 */}
        <div className="flex-shrink-0 w-4 md:hidden"></div> 
      </div>
      {/* 💡 提示：如果您希望隱藏滾動條，您可能需要額外安裝或定義一個名為 'scrollbar-hide' 的 Tailwind 插件或樣式。 */}
    </section>
  );
};

export default PromotionsSection;