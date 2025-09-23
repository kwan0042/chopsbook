// src/components/reviews/review_form_components/ReviewFormFields.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun } from "@fortawesome/free-solid-svg-icons";
import {
  IconCoffee,
  IconSunset2,
  IconMoon,
  IconBuildingStore,
  IconMoped,
  IconPaperBag,
} from "@tabler/icons-react";
import Link from "next/link";

const ReviewFormFields = ({
  searchQuery,
  setSearchQuery,
  filteredRestaurants,
  selectedRestaurant,
  handleSelectRestaurant,
  handleRemoveSelectedRestaurant,
  costPerPerson,
  setCostPerPerson,
  timeOfDay,
  setTimeOfDay,
  serviceType,
  setServiceType,
  reviewTitle,
  setReviewTitle,
  reviewContent,
  setReviewContent,
  errors,
  setErrors,
  isRestaurantPreselected, // 新增：判斷是否預先選擇了餐廳
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <label
            htmlFor="selectedRestaurant"
            className="block text-gray-700 text-base font-bold mb-2"
          >
            選擇餐廳 <span className="text-red-500">*</span>
          </label>
          {selectedRestaurant ? (
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-indigo-50 text-indigo-800 h-10">
              <span className="font-semibold text-base">
                {selectedRestaurant.restaurantName?.["zh-TW"] ||
                  selectedRestaurant.restaurantName?.en}
              </span>
              {!isRestaurantPreselected && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedRestaurant}
                  className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  移除
                </button>
              )}
            </div>
          ) : (
            <>
              <input
                id="selectedRestaurant"
                type="text"
                placeholder="搜尋餐廳名稱 (中文或英文)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              />
              {searchQuery && filteredRestaurants.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredRestaurants.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => handleSelectRestaurant(r)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    >
                      {r.restaurantName?.["zh-TW"]} ({r.restaurantName?.en})
                    </li>
                  ))}
                </ul>
              )}
              {searchQuery && filteredRestaurants.length === 0 && (
                <p className="mt-2 text-base text-red-500">
                  沒有找到匹配的餐廳。
                  <Link href="/merchant/add" className="text-blue-500">
                    新增餐廳？
                  </Link>
                </p>
              )}
            </>
          )}
          {errors.selectedRestaurant && (
            <p className="mt-1 text-sm text-red-500">
              {errors.selectedRestaurant}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="costPerPerson"
            className="block text-gray-700 text-base font-bold mb-2"
          >
            每人消費金額 <span className="text-red-500">*</span>
          </label>
          <input
            id="costPerPerson"
            type="number"
            min="0"
            value={costPerPerson}
            onChange={(e) => {
              setCostPerPerson(e.target.value);
              setErrors((prev) => ({ ...prev, costPerPerson: null }));
            }}
            className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            placeholder="例如: 150"
          />
          {errors.costPerPerson && (
            <p className="mt-1 text-sm text-red-500">{errors.costPerPerson}</p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="timeOfDay"
          className="block text-gray-700 text-base font-bold mb-2"
        >
          用餐時間 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              value: "morning",
              label: "早上",
              icon: <IconCoffee stroke={2} className="text-2xl" />,
            },
            {
              value: "noon",
              label: "中午",
              icon: <FontAwesomeIcon icon={faSun} className="text-2xl" />,
            },
            {
              value: "afternoon",
              label: "下午",
              icon: <IconSunset2 stroke={2} className="text-2xl" />,
            },
            {
              value: "night",
              label: "晚上",
              icon: <IconMoon stroke={2} className="text-2xl" />,
            },
          ].map((item) => (
            <label
              key={item.value}
              className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                timeOfDay === item.value
                  ? "bg-blue-100 border-2 border-blue-500 shadow-md"
                  : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                type="radio"
                name="timeOfDay"
                value={item.value}
                checked={timeOfDay === item.value}
                onChange={(e) => {
                  setTimeOfDay(e.target.value);
                  setErrors((prev) => ({ ...prev, timeOfDay: null }));
                }}
                className="hidden"
              />
              <div className="text-2xl">{item.icon}</div>
              <span className="mt-2 text-sm font-medium text-gray-800">
                {item.label}
              </span>
            </label>
          ))}
        </div>
        {errors.timeOfDay && (
          <p className="mt-1 text-sm text-red-500">{errors.timeOfDay}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="serviceType"
          className="block text-gray-700 text-base font-bold mb-2"
        >
          服務類型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              value: "dineIn",
              label: "堂食",
              icon: <IconBuildingStore stroke={2} className="text-xl" />,
            },
            {
              value: "delivery",
              label: "外賣",
              icon: <IconMoped stroke={2} className="text-xl" />,
            },
            {
              value: "pickUp",
              label: "自取",
              icon: <IconPaperBag stroke={2} className="text-xl" />,
            },
          ].map((item) => (
            <label
              key={item.value}
              className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                serviceType === item.value
                  ? "bg-blue-100 border-2 border-blue-500 shadow-md"
                  : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={item.value}
                checked={serviceType === item.value}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  setErrors((prev) => ({ ...prev, serviceType: null }));
                }}
                className="hidden"
              />
              <div className="text-xl">{item.icon}</div>
              <span className="mt-2 text-sm font-medium text-gray-800">
                {item.label}
              </span>
            </label>
          ))}
        </div>
        {errors.serviceType && (
          <p className="mt-1 text-sm text-red-500">{errors.serviceType}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="reviewTitle"
          className="block text-gray-700 text-base font-bold mb-2"
        >
          評論標題 <span className="text-red-500">*</span>
        </label>
        <input
          id="reviewTitle"
          type="text"
          value={reviewTitle}
          onChange={(e) => {
            setReviewTitle(e.target.value);
            setErrors((prev) => ({ ...prev, reviewTitle: null }));
          }}
          className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 "
          placeholder="給評論一個簡短的標題..."
        />
        {errors.reviewTitle && (
          <p className="mt-1 text-sm text-red-500">{errors.reviewTitle}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="reviewContent"
          className="block text-gray-700 text-base font-bold mb-2"
        >
          評論詳情
        </label>
        <textarea
          id="reviewContent"
          rows="6"
          value={reviewContent}
          onChange={(e) => setReviewContent(e.target.value)}
          className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="分享您的用餐體驗..."
        ></textarea>
      </div>
    </>
  );
};

export default ReviewFormFields;
