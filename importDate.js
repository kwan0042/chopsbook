// importData.js

// ❗ 載入 .env.local 檔案中的環境變數 ❗
// 這樣腳本才能讀取到 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY 和 FIREBASE_STORAGE_BUCKET
require("dotenv").config({ path: "./.env.local" });

const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

// ====================================================
// A. Firebase 設定區塊 (使用環境變數初始化)
// ====================================================

// 檢查必要的環境變數
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error(
    "❌ 錯誤: 環境變數 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY 遺失。請確認 .env.local 文件是否存在且包含此變數。"
  );
  process.exit(1);
}
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error("❌ 錯誤: 環境變數 FIREBASE_STORAGE_BUCKET 遺失。");
  process.exit(1);
}

// 您的 CSV 檔案名
const CSV_FILE_PATH = "markham_restaurants_full.csv";

// Firestore 目標集合路徑
const TARGET_COLLECTION = "artifacts/default-app-id/public/data/restaurants";

// 初始化 Firebase Admin SDK
try {
  // 這裡直接使用環境變數中的 JSON 字串進行初始化，模仿您的 src/lib/firebase-admin.js
  const serviceAccountJson = JSON.parse(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} catch (error) {
  console.error(
    "==============================================================="
  );
  console.error(
    "❌ Firebase 初始化失敗！請檢查服務帳號 JSON 字串格式是否正確。"
  );
  console.error(
    "==============================================================="
  );
  console.error("詳細錯誤:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// ====================================================
// B. 菜系及地理位置定義 (從 src/data/restaurant-options.js 複製)
// ====================================================

// [請在這裡貼上您的 cuisineOptions 和 citiesByProvince 物件定義]
const cuisineOptions = {
  港式: ["港式"],
  日本菜: ["日本菜"],
  中菜: [
    "粵菜 (廣東菜)",
    "潮州菜",
    "客家菜",
    "上海菜/江浙菜",
    "北京菜",
    "川菜",
    "湘菜",
    "魯菜",
    "徽菜",
    "東北菜",
  ],
  泰國菜: ["泰國菜"],
  韓國菜: ["韓國菜"],
  台灣菜: ["台灣菜"],
  越南菜: ["越南菜"],
  歐美菜系: [
    "西餐",
    "意大利菜",
    "法國菜",
    "西班牙菜",
    "墨西哥菜",
    "美式菜",
    "英式菜",
    "希臘菜",
    "德國菜",
    "葡萄牙菜",
    "俄羅斯菜",
  ],
  其他菜系: [
    "印度菜",
    "星馬菜 (新加坡/馬來西亞)",
    "菲律賓菜",
    "印尼菜",
    "中東菜",
    "土耳其菜",
  ],
  特色餐飲: [
    "海鮮料理 (Seafood)",
    "素食 (Vegetarian)",
    "純素食 (Vegan)",
    "健康餐飲/輕食",
    "其他",
  ],
};

const citiesByProvince = {
  "安大略省(ON)": [
    "多倫多(Toronto)",
    "萬錦(Markham)",
    "列治文山(Richmond Hill)",
    "旺市(Vaughan)",
    "密西沙加(Mississauga)",
    "渥太華(Ottawa)",
    "布蘭普頓(Brampton)",
    "漢密爾頓(Hamilton)",
    "倫敦(London)",
    "基秦拿(Kitchener)",
    "溫莎(Windsor)",
    "奧克維爾(Oakville)",
    "伯靈頓(Burlington)",
    "巴里(Barrie)",
    "聖嘉芙蓮(St. Catharines)",
    "奧沙華(Oshawa)",
    "貴湖(Guelph)",
    "惠特比(Whitby)",
    "劍橋(Cambridge)",
  ],
  "魁北克省(QC)": [
    "滿地可(Montreal)",
    "魁北克市(Quebec City)",
    "拉瓦爾(Laval)",
    "加蒂諾(Gatineau)",
    "隆格伊(Longueuil)",
    "舍布魯克(Sherbrooke)",
    "薩格奈(Saguenay)",
    "三河市(Trois-Rivières)",
    "德拉蒙維爾(Drummondville)",
    "聖若望(Saint-Jean-sur-Richelieu)",
  ],
  "卑詩省(BC)": [
    "列治文(Richmond)",
    "溫哥華(Vancouver)",
    "素里(Surrey)",
    "本那比(Burnaby)",
    "高貴林(Coquitlam)",
    "薩尼奇(Saanich)",
    "基隆拿(Kelowna)",
    "阿布斯福(Abbotsford)",
    "維多利亞(Victoria)",
    "楓樹嶺(Maple Ridge)",
    "蘭里(Langley)",
    "北溫(North Vancouver)",
    "納奈摩(Nanaimo)",
    "甘露市(Kamloops)",
    "喬治王子城(Prince George)",
  ],
  "亞伯達省(AB)": [
    "卡加利(Calgary)",
    "愛民頓(Edmonton)",
    "紅鹿市(Red Deer)",
    "烈治文堡(Lethbridge)",
    "聖艾伯(St. Albert)",
    "麥迪辛哈特(Medicine Hat)",
    "大草原市(Grande Prairie)",
    "艾德里(Airdrie)",
    "斯普魯斯格羅夫(Spruce Grove)",
  ],
  "曼尼托巴省(MB)": [
    "溫尼伯(Winnipeg)",
    "布蘭登(Brandon)",
    "施泰因巴赫(Steinbach)",
    "草原城(Portage la Prairie)",
    "湯普森(Thompson)",
    "温克勒(Winkler)",
    "瑟爾柯克(Selkirk)",
  ],
  "薩斯喀徹溫省(SK)": [
    "薩斯卡通(Saskatoon)",
    "里賈納(Regina)",
    "阿伯王子城(Prince Albert)",
    "慕斯喬(Moose Jaw)",
    "斯威夫特卡倫特(Swift Current)",
    "約克頓(Yorkton)",
  ],
  "新斯科細亞省(NS)": [
    "哈利法斯(Halifax)",
    "悉尼(Sydney)",
    "達特茅斯(Dartmouth)",
    "特魯羅(Truro)",
    "新格拉斯哥(New Glasgow)",
  ],
  "新不倫瑞克省(NB)": [
    "聖約翰(Saint John)",
    "蒙克頓(Moncton)",
    "費特烈頓(Fredericton)",
    "迪耶普(Dieppe)",
    "巴瑟斯特(Bathurst)",
    "米拉米契(Miramichi)",
  ],
  "紐芬蘭與拉布拉多省(NL)": [
    "聖約翰斯(St. John's)",
    "南康山灣(Conception Bay South)",
    "蒙特珍(Mount Pearl)",
    "天堂鎮(Paradise)",
    "康納布魯克(Corner Brook)",
  ],
  "愛德華王子島省(PE)": [
    "夏洛特城(Charlottetown)",
    "薩默塞德(Summerside)",
    "史特拉特福(Stratford)",
    "康沃爾(Cornwall)",
  ],
  "西北地區(NT)": [
    "黃刀鎮(Yellowknife)",
    "海河鎮(Hay River)",
    "伊努維克(Inuvik)",
  ],
  "育空地區(YK)": ["白馬市(Whitehorse)", "道森市(Dawson City)"],
  "努納武特地區(NU)": [
    "伊魁特(Iqaluit)",
    "蘭金灣(Rankin Inlet)",
    "劉易克霍爾(Lieuk Hall)",
  ],
};
// [貼上結束]

// ====================================================
// C. 資料標準化函式
// ====================================================

// 輔助函式：將 CSV 的 Y/N 轉換為 Boolean
const toBoolean = (val) => val && val.toLowerCase() === "y";

/**
 * 將 CSV 的 cuisine 欄位標準化為 category 和 subType
 */
function normalizeCuisine(csvCuisine) {
  if (!csvCuisine) return { category: "其他", subType: "其他" };

  const keywordMap = {
    hong_kong: "港式",
    cantonese: "粵菜 (廣東菜)",
    japanese: "日本菜",
    sushi: "日本菜",
    ramen: "日本菜",
    korean: "韓國菜",
    fried_chicken: "韓國菜",
    taiwanese: "台灣菜",
    szechuan: "川菜",
    shanghai: "上海菜/江浙菜",
    hunan: "湘菜",
    shandong: "魯菜",
    chinese: "中菜",
    hotpot: "中菜",
    noodle: "中菜",
    italian: "意大利菜",
    pizza: "意大利菜",
    american: "美式菜",
    steak_house: "美式菜",
    burger: "美式菜",
    french: "法國菜",
    mexican: "墨西哥菜",
    greek: "希臘菜",
    thai: "泰國菜",
    vietnamese: "越南菜",
    indian: "印度菜",
    malaysian: "星馬菜 (新加坡/馬來西亞)",
    filipino: "菲律賓菜",
    indonesian: "印尼菜",
    middle_eastern: "中東菜",
    shawarma: "中東菜",
    turkish: "土耳其菜",
    persian: "其他菜系",
    seafood: "海鮮料理 (Seafood)",
    salad: "健康餐飲/輕食",
    dessert: "特色餐飲",
    coffee_shop: "特色餐飲",
    tea: "特色餐飲",
    vegan: "純素食 (Vegan)",
    vegetarian: "素食 (Vegetarian)",
  };

  const mainCuisine = csvCuisine
    .split(";")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

  let subType = keywordMap[mainCuisine] || "其他";
  let category = "其他";

  for (const cat in cuisineOptions) {
    if (cuisineOptions[cat].includes(subType)) {
      category = cat;
      break;
    }
  }

  if (Object.keys(cuisineOptions).includes(subType)) {
    category = subType;
  }

  return {
    category: category,
    subType: subType,
  };
}

/**
 * 將 CSV 的 city 欄位標準化為正式格式，並反查 province
 */
function normalizeCityAndProvince(csvCity) {
  const rawCity = csvCity ? csvCity.trim() : "";
  if (!rawCity) return { city: "", province: "" };

  const lookupCity =
    rawCity.toLowerCase() === "maple" ? "vaughan" : rawCity.toLowerCase();

  for (const province of Object.keys(citiesByProvince)) {
    const provinceCities = citiesByProvince[province];
    for (const cityFormat of provinceCities) {
      const englishName = cityFormat.match(/\(([^)]+)\)/)?.[1].toLowerCase();
      const chineseName = cityFormat.split("(")[0].toLowerCase();

      if (
        lookupCity === englishName ||
        lookupCity === chineseName ||
        lookupCity === cityFormat.toLowerCase()
      ) {
        return {
          city: cityFormat,
          province: province,
        };
      }
    }
  }

  return { city: rawCity, province: "未分類" };
}

/**
 * 解析複雜的 opening_hours 字串並生成 7 天 JSON 陣列。
 */
const createBusinessHours = (hoursString) => {
  // 預設 7 天的中文名稱和縮寫對應
  const days = [
    { abbr: "Su", name: "星期日" },
    { abbr: "Mo", name: "星期一" },
    { abbr: "Tu", name: "星期二" },
    { abbr: "We", name: "星期三" },
    { abbr: "Th", name: "星期四" },
    { abbr: "Fr", name: "星期五" },
    { abbr: "Sa", name: "星期六" },
  ];

  // 預設所有天數都是關閉的
  const schedule = days.map((day) => ({
    day: day.name,
    startTime: "00:00",
    endTime: "00:00",
    isOpen: false,
  }));

  if (!hoursString) return schedule;

  // 日期範圍轉換為縮寫陣列
  const dayMap = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

  const parseDayRange = (rangeStr) => {
    const dayIndices = [];
    if (rangeStr.includes(",")) {
      const parts = rangeStr.split(",").map((p) => p.trim());
      parts.forEach((p) => {
        if (dayMap[p] !== undefined) dayIndices.push(dayMap[p]);
      });
    } else if (rangeStr.includes("-")) {
      const [startDay, endDay] = rangeStr.split("-");
      const startIndex = dayMap[startDay];
      const endIndex = dayMap[endDay];

      if (startIndex !== undefined && endIndex !== undefined) {
        let i = startIndex;
        while (true) {
          dayIndices.push(i);
          if (i === endIndex) break;
          i = (i + 1) % 7;
        }
      }
    } else if (dayMap[rangeStr] !== undefined) {
      dayIndices.push(dayMap[rangeStr]);
    }
    return dayIndices;
  };

  const rules = hoursString
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  rules.forEach((rule) => {
    const match = rule.match(/^(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);

    if (match) {
      const dayPart = match[1];
      const startTime = match[2];
      const endTime = match[3];

      const affectedIndices = parseDayRange(dayPart);

      affectedIndices.forEach((index) => {
        const chineseDay = days.find((d) => dayMap[d.abbr] === index).name;
        const entryIndex = schedule.findIndex((s) => s.day === chineseDay);

        if (entryIndex !== -1) {
          schedule[entryIndex] = {
            day: chineseDay,
            startTime: startTime,
            endTime: endTime,
            isOpen: true,
          };
        }
      });
    }
  });

  return schedule;
};

/**
 * 將單行 CSV 資料轉換為 Firestore 文件格式
 */
function transformToFirestoreDoc(row) {
  const now = admin.firestore.Timestamp.now();

  // 執行標準化
  const { city: normalizedCity, province: normalizedProvince } =
    normalizeCityAndProvince(row.city);
  const normalizedCuisine = normalizeCuisine(row.cuisine);

  // 設施和服務
  const facilitiesServices = [
    ...(toBoolean(row.wheelchair) ? ["無障礙設施"] : []),
    ...(toBoolean(row.internet_access) ? ["Wi-Fi服務"] : []),
    ...(toBoolean(row.delivery) ? ["外賣速遞"] : []),
    ...(toBoolean(row.takeaway) ? ["其他"] : []), // 這裡將 Takeaway 歸類為 '其他'，如果需要精確分類請在 options 中添加
  ].filter((item, index, self) => self.indexOf(item) === index); // 去重

  // 組合完整地址
  const fullAddress = [
    row.street_address || "",
    normalizedCity || "",
    normalizedProvince || "",
    row.postcode || "",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/,\s*,/g, ",")
    .trim()
    .replace(/,$/, "");

  const docData = {
    // 標準化欄位
    city: normalizedCity,
    province: normalizedProvince,
    cuisineType: normalizedCuisine,
    fullAddress: fullAddress,

    // CSV 直接映射 (或預設值)
    postalCode: row.postcode || "",
    phone: row.phone || "",
    website: row.website || "",
    contactEmail: row.email || "",
    contactName: row.operator || "",
    contactPhone: row.phone || "",

    // 結構化和預設值
    restaurantName: {
      en: row.name || "",
      "zh-TW": "",
    },
    businessHours: createBusinessHours(row.opening_hours),
    facilitiesServices: facilitiesServices,

    // 靜態/預設值
    avgSpending: 0,
    createdAt: now,
    facadePhotoUrl: "",
    facadePhotoUrls: [],
    isManager: false,
    otherInfo: "",
    paymentMethods: ["現金"],
    priority: 0,
    reservationModes: ["Walk-in"],
    restaurantType: "一般餐廳",
    seatingCapacity: "未定",
    status: "approved",
    submittedBy: "system_import",

    // 地理位置
    geopoint:
      row.latitude && row.longitude
        ? new admin.firestore.GeoPoint(
            parseFloat(row.latitude),
            parseFloat(row.longitude)
          )
        : null,
  };

  return docData;
}

// ====================================================
// D. 匯入主函式
// ====================================================

async function importCSVToFirestore() {
  console.log(
    `🚀 開始從 ${CSV_FILE_PATH} 讀取資料並匯入到 Firestore 集合: ${TARGET_COLLECTION}`
  );

  let recordCount = 0;
  const records = [];

  // 1. 讀取 CSV 並轉換為 JSON 陣列
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(
      `❌ 錯誤: 找不到 CSV 檔案。請確保 ${CSV_FILE_PATH} 存在於腳本目錄中。`
    );
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on("data", (row) => {
          records.push(row);
        })
        .on("end", () => {
          console.log(
            `✅ 成功讀取 ${records.length} 筆資料。開始轉換及寫入...`
          );
          resolve();
        })
        .on("error", reject);
    });
  } catch (e) {
    console.error("❌ 讀取 CSV 檔案時發生錯誤:", e.message);
    return;
  }

  // 2. 批量寫入 Firestore
  const batchLimit = 499;

  for (let i = 0; i < records.length; i += batchLimit) {
    const batch = db.batch();
    const batchRecords = records.slice(i, i + batchLimit);

    batchRecords.forEach((row) => {
      const docData = transformToFirestoreDoc(row);
      const docRef = db.collection(TARGET_COLLECTION).doc();
      batch.set(docRef, docData);
      recordCount++;
    });

    console.log(
      `... 提交第 ${Math.ceil(i / batchLimit + 1)} 批 ( ${
        batchRecords.length
      } 筆資料) ...`
    );

    try {
      await batch.commit();
    } catch (e) {
      console.error(
        `❌ 提交批量寫入時發生錯誤 (第 ${Math.ceil(i / batchLimit + 1)} 批):`,
        e.message
      );
    }
  }

  console.log(
    `🎉 匯入完成！總共寫入了 ${recordCount} 筆餐廳資料到 Firestore。`
  );
}

importCSVToFirestore();
