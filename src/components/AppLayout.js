// src/components/AppLayout.js
"use client";

import React, { useState, useCallback, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import FilterModal from "@/components/filters/FilterModal";
import { AuthContext } from "@/lib/auth-context";

const AppLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { setModalMessage } = useContext(AuthContext);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 檢查是否為餐廳頁面，如果是則不顯示篩選按鈕
  const isRestaurantsPage = pathname === "/restaurants";

  const handleShowFilterModal = useCallback(() => {
    // 只有在非 /restaurants 頁面才顯示模態框
    if (!isRestaurantsPage) {
      setIsFilterModalOpen(true);
    }
  }, [isRestaurantsPage]);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const handleApplyFilters = useCallback(
    (filters) => {
      const params = new URLSearchParams(filters);
      router.push(`/restaurants?${params.toString()}`);
      handleCloseFilterModal();
    },
    [router, handleCloseFilterModal]
  );

  return (
    <>
      <Navbar
        onShowFilterModal={handleShowFilterModal}
        isRestaurantsPage={isRestaurantsPage}
      />
      <main>{children}</main>
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
      />
      <footer className="bg-gray-800 text-white text-center py-6 text-sm font-light">
        &copy; {new Date().getFullYear()}ChopsBook. 版權所有.
      </footer>
    </>
  );
};

export default AppLayout;
