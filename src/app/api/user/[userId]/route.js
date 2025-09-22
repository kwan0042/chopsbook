import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  const userId = params.userId;
  const appId = process.env.FIREBASE_ADMIN_APP_ID;

  if (!userId) {
    return new Response(JSON.stringify({ message: "Missing user ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = getFirestore(app);
    const userDocRef = db.doc(`artifacts/${appId}/users/${userId}`);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return new Response(JSON.stringify({ message: "User not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userData = userDocSnap.data();

    let favoriteRestaurantNames = [];
    if (
      userData.favoriteRestaurants &&
      userData.favoriteRestaurants.length > 0
    ) {
      const restaurantNamesPromises = userData.favoriteRestaurants.map(
        async (restaurantId) => {
          const restaurantDocRef = db.doc(
            `artifacts/${appId}/public/data/restaurants/${restaurantId}`
          );
          const restaurantDocSnap = await restaurantDocRef.get();
          if (restaurantDocSnap.exists) {
            const restaurantData = restaurantDocSnap.data();
            // 檢查 restaurantName 是否為 map，並依序取值
            const restaurantNameMap = restaurantData.restaurantName || {};
            return (
              restaurantNameMap["zh-TW"] ||
              restaurantNameMap.en ||
              `未知餐廳 (ID: ${restaurantId})`
            );
          } else {
            return `已刪除餐廳 (ID: ${restaurantId})`;
          }
        }
      );
      favoriteRestaurantNames = await Promise.all(restaurantNamesPromises);
    }

    const combinedData = {
      ...userData,
      favoriteRestaurantNames: favoriteRestaurantNames,
    };

    return new Response(JSON.stringify(combinedData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return new Response(
      JSON.stringify({ message: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
