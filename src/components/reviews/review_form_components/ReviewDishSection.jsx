import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

const ReviewDishSection = ({ recommendedDishes, setRecommendedDishes }) => {
  const handleDishChange = (index, value) => {
    const newDishes = [...recommendedDishes];
    newDishes[index] = value;
    setRecommendedDishes(newDishes);
  };

  const handleAddDish = () => {
    if (recommendedDishes.length < 3) {
      setRecommendedDishes([...recommendedDishes, ""]);
    }
  };

  const handleRemoveDish = (index) => {
    const newDishes = [...recommendedDishes];
    newDishes.splice(index, 1);
    setRecommendedDishes(newDishes);
  };

  return (
    <div>
      <label className="block text-gray-700 text-base font-bold mb-2">
        推薦菜式 (選填，最多3款)
      </label>
      {recommendedDishes.map((dish, index) => (
        <div key={index} className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={dish}
            onChange={(e) => handleDishChange(index, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 text-sm"
            placeholder={`推薦菜式 ${index + 1}`}
          />
          {recommendedDishes.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveDish(index)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      ))}
      {recommendedDishes.length < 3 && (
        <button
          type="button"
          onClick={handleAddDish}
          className="mt-2 text-blue-600 font-semibold flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          新增菜式
        </button>
      )}
    </div>
  );
};

export default ReviewDishSection;
