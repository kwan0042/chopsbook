const axios = require("axios");

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiY2hvcHNib29rIiwiYSI6ImNtZnRlMXhhdDAxcm0ya3BuNzI5ajhrNmIifQ.99_-kosEN3bhXUBdcHcgCg";

async function test() {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/restaurant.json?proximity=-79.3370,43.8561&types=poi&limit=5&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const res = await axios.get(url);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("API error:", err.response ? err.response.data : err.message);
  }
}

test();
