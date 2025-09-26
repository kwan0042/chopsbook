const axios = require("axios");
const fs = require("fs");

// 萬錦市 bounding box [minLon, minLat, maxLon, maxLat]
const BBOX = [-79.52, 43.75, -79.25, 43.88];
const GRID_SIZE = 0.02; // 每格約 2km
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * 生成網格，用於分區抓取避免 Overpass 超時
 */
function generateGrid(bbox, step) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const grid = [];
  for (let lon = minLon; lon < maxLon; lon += step) {
    for (let lat = minLat; lat < maxLat; lat += step) {
      const lon2 = Math.min(lon + step, maxLon);
      const lat2 = Math.min(lat + step, maxLat);
      grid.push([lon, lat, lon2, lat2]);
    }
  }
  return grid;
}

/**
 * 抓取指定 bounding box 內的餐廳
 */
async function fetchRestaurantsInBBox([minLon, minLat, maxLon, maxLat]) {
  const query = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](${minLat},${minLon},${maxLat},${maxLon});
  way["amenity"="restaurant"](${minLat},${minLon},${maxLat},${maxLon});
  relation["amenity"="restaurant"](${minLat},${minLon},${maxLat},${maxLon});
);
out center tags;
`;
  try {
    const res = await axios.post(OVERPASS_URL, query, {
      headers: { "Content-Type": "text/plain" },
    });
    return res.data.elements || [];
  } catch (err) {
    console.error(
      `抓取區塊 [${minLon},${minLat},${maxLon},${maxLat}] 失敗:`,
      err.message
    );
    return [];
  }
}

/**
 * 提取餐廳資料
 */
function extractRestaurantData(f) {
  const tags = f.tags || {};
  const housenumber = tags["addr:housenumber"] || "";
  const street = tags["addr:street"] || "";
  const city = tags["addr:city"] || "";
  const province = tags["addr:province"] || "";
  const postcode = tags["addr:postcode"] || "";
  const street_address = [housenumber, street].filter(Boolean).join(" ");

  const lat = f.lat || f.center?.lat || "";
  const lon = f.lon || f.center?.lon || "";

  return {
    name: tags.name || "",
    street_address,
    city,
    province,
    postcode,
    latitude: lat,
    longitude: lon,
    cuisine: tags.cuisine || "",
    phone: tags.phone || "",
    website: tags.website || "",
    email: tags.email || "",
    opening_hours: tags.opening_hours || "",
    wheelchair: tags.wheelchair || "",
    smoking: tags.smoking || "",
    internet_access: tags.internet_access || "",
    operator: tags.operator || "",
    delivery: tags.delivery || "",
    takeaway: tags.takeaway || "",
  };
}

/**
 * 主函數：抓取所有餐廳並輸出 CSV
 */
async function fetchAllRestaurants() {
  const grid = generateGrid(BBOX, GRID_SIZE);
  const allRestaurants = [];
  const seen = new Set();

  for (let i = 0; i < grid.length; i++) {
    const bbox = grid[i];
    console.log(`抓取第 ${i + 1} 格，共 ${grid.length} 格...`);
    const elements = await fetchRestaurantsInBBox(bbox);

    elements.forEach((f) => {
      const data = extractRestaurantData(f);
      const key = `${data.name}-${data.street_address}`;
      if (!seen.has(key)) {
        seen.add(key);
        allRestaurants.push(data);
      }
    });
  }

  if (allRestaurants.length === 0) {
    console.log("沒有抓到任何餐廳。");
    return;
  }

  // CSV 輸出，保證數字也能用 replace
  const headers = Object.keys(allRestaurants[0]);
  const csvContent = [
    headers.join(","),
    ...allRestaurants.map((r) =>
      headers
        .map((h) => `"${String(r[h] || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  fs.writeFileSync("markham_restaurants_full.csv", csvContent, "utf-8");
  console.log(
    `完成！總共抓取 ${allRestaurants.length} 間餐廳，已匯出 markham_restaurants_full.csv`
  );
}

// 執行
fetchAllRestaurants();
