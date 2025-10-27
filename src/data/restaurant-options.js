export const categoryOptions = [
  // 這些作為頂層 category (string) 使用
  "港式",
  "日本菜",
  "中菜", // 簡化為只有主類別
  "泰國菜",
  "韓國菜",
  "台灣菜",
  "越南菜",
  "歐美菜系", // 簡化為只有主類別
  "其他菜系", // 簡化為只有主類別
  // 簡化為只有主類別
];

export const categoryImageMap = {
  港式: "/img/category/hk.webp", // 假設的路徑
  日本菜: "/img/category/jp.webp",
  中菜: "/img/category/cn.webp",
  泰國菜: "/img/category/th.webp",
  韓國菜: "/img/category/kr.webp",
  台灣菜: "/img/category/tw.webp",
  越南菜: "/img/category/vn.webp",
  歐美菜系: "/img/category/eu.webp",
  其他菜系: "/img/category/other.webp",
};

// ⚠️ 新增：subcategoryOptions專門用於細分菜系 (從 categoryOptions 中提取)
export const subcategoryOptions = [
  // 從 '中菜' 中提取
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

  // 從 '歐美菜系' 中提取
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

  // 從 '其他菜系' 中提取
  "印度菜",
  "星馬菜 (新加坡/馬來西亞)",
  "菲律賓菜",
  "印尼菜",
  "中東菜",
  "土耳其菜",
];

// restaurantTypeOptions 保持不變 (包含場所類型和服務模式)
export const restaurantTypeOptions = [
  // I. 港式/中式特色場所
  "茶餐廳",
  "冰室",
  "大牌檔式",
  "酒樓/海鮮酒家",
  "茶樓/早茶",
  "小炒/碟頭飯",
  "潮式打冷",
  "凍肉點心專門店",
  "火鍋店/打邊爐專門店",
  "粥品專門店",
  "粉麵店/車仔麵",
  "燒味/燒臘專門店",
  "糖水舖/中式甜品",
  "包點/糕點/港式面包",
  "齋/素食中菜館",

  //台
  "台灣小吃店",
  "牛肉麵專門店",
  "珍珠奶茶/手搖",
  "台式快炒",
  "早餐店",

  // 中

  "餃子館",
  "中式麵館",
  "中式快炒",
  "中式串燒",
  "湯水/燉品",
  "煲仔飯",
  "街頭小食",
  

  // II. 日式特色場所 (Japanese Specific)
  "壽司/刺身專門店",
  "居酒屋",
  "拉麵/沾麵店",
  "燒肉店/日式烤肉",
  "日式串燒店/燒鳥",
  "鐵板燒/爐端燒",
  "日式咖喱飯專門店",
  "日式定食/食堂",

  // III. 韓式特色場所 (Korean Specific)
  "韓式燒烤店",
  "韓式小食/路邊攤",
  "韓國傳統餐廳/定食",
  "炸雞啤酒專門店",
  "韓式炸雞",

  // IV. 歐美/國際通用場所 (Western/General International)
  "扒房",
  "漢堡/炸雞快餐店",
  "小酒館/ 啤酒店",
  "薄餅專門店",
  "墨西哥卷餅店",
  "酒吧/ 清吧",
  "咖啡廳",
  "麵包店/烘焙店",
  "甜品店/糕點店",
  "雞翼",

  // V. 服務模式與消費級別 (Service Model & Level)
  "高級餐飲",
  "休閒餐飲",
  "家庭式餐廳",
  "自助餐",
  "速食",
  "美食廣場/ 熟食市場",
  "街頭小食攤位",
  "外賣速遞專營店",
  "美食餐車",
  "海鮮料理",
  "素食",
  "純素食",
  "健康餐飲/輕食",
  "其他", // 這個 '其他' 是指服務模式或其他，不是菜系中的那個
];

// 移除第一個佔位符選項
export const seatingCapacityOptions = [
  "1-10",
  "10-20",
  "21-50",
  "51-100",
  "101-200",
  "200+",
];

export const reservationModeOptions = [
  "官方網站",
  "訂位App",
  "電話預約",
  "Walk-in",
  "其他",
];

export const paymentMethodOptions = [
  "現金",
  "信用卡 - AMEX",
  "信用卡 - Mastercard",
  "信用卡 - Visa",
  "借記卡 - Debit Card",
  "微信支付 (WeChat Pay)",
  "支付寶 (Alipay)",
  "Apple Pay",
  "Google Pay",
  "其他",
];

export const facilitiesServiceOptions = [
  "現金支付折扣",
  "室外座位",
  "電視播放",
  "酒精飲品",
  "Wi-Fi服務",
  "切餅費",
  "可自帶酒水",
  "外賣自取",
  "外賣速遞(自家)",
  "外賣速遞(第三方)",
  "停車場",
  "無障礙設施",
  "兒童友善",
  "寵物友善",
  "設有私人包廂",
];

// 移除第一個佔位符選項
export const provinceOptions = [
  "安大略省(ON)",
  "魁北克省(QC)",
  "卑詩省(BC)",
  "亞伯達省(AB)",
  "曼尼托巴省(MB)",
  "薩斯喀徹溫省(SK)",
  "新斯科細亞省(NS)",
  "新不倫瑞克省(NB)",
  "紐芬蘭與拉布拉多省(NL)",
  "愛德華王子島省(PE)",
  "西北地區(NT)",
  "育空地區(YK)",
  "努納武特地區(NU)",
];

// ✅ 新增城市數據，與 provinceOptions 的值對應
export const citiesByProvince = {
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

export const SUB_CATEGORY_MAP = {
  // 映射 "中菜"
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
    "其他",
  ],
  // 映射 "歐美菜系"
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
    "其他",
  ],
  // 映射 "其他菜系"
  其他菜系: [
    "印度菜",
    "星馬菜 (新加坡/馬來西亞)",
    "菲律賓菜",
    "印尼菜",
    "中東菜",
    "土耳其菜",
    "其他",
  ],
  // 映射 "特色餐飲"
};
