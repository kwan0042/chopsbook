// src/app/user/[userId]/settings/SettingsForm.js
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/auth-context';

// 假設的語言選項列表
const availableLanguages = [
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' }, 
  { code: 'ja-JP', name: '日本語' },
];

// 接受 userId 作為 props，而不是從 params 傳入
export default function SettingsForm({ userId }) { 
  const router = useRouter();
  
  // 從 AuthContext 取得所需的值和方法
  const { 
    currentUser, 
    loadingUser, 
    logout, 
    getToken,
    setModalMessage // 用於顯示全局訊息
  } = useContext(AuthContext);

  // --- State Hooks ---
  const [newUsername, setNewUsername] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('zh-TW');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(''); 

  // --- 載入和檢查用戶數據 ---
  useEffect(() => {
    // 檢查 URL 中的 userId 是否與登入用戶匹配
    if (currentUser && currentUser.uid !== userId) {
      router.replace(`/user/${currentUser.uid}/settings`); 
      return;
    }

    if (currentUser) {
      // 根據 currentUser 初始化表單
      setNewUsername(currentUser.username || '');
      setSelectedLanguage(currentUser.displayLanguage || 'zh-TW');
      setPhoneNumber(currentUser.phoneNumber || ''); 
    }
  }, [currentUser, userId, router]);

  // 如果正在載入或用戶數據不匹配，顯示載入狀態
  if (loadingUser || (currentUser && currentUser.uid !== userId)) {
    return <div className="text-center p-8">載入用戶設定...</div>;
  }

  if (!currentUser) {
    return <div className="text-center p-8 text-red-500">請先登入以查看設定。</div>;
  }

  // --- 業務邏輯判斷 ---
  const lastChangeTimestamp = currentUser.lastUsernameChangeTimestamp || 0; 
  const daysSinceLastChange = (Date.now() - lastChangeTimestamp) / (1000 * 60 * 60 * 24);
  const canChangeUsername = daysSinceLastChange >= 30;

  // --- 表單提交處理 (直接呼叫 API) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const publicUpdates = {}; 
    const privateUpdates = {}; 

    if (newUsername !== currentUser.username && canChangeUsername) {
      publicUpdates.username = newUsername;
      publicUpdates.lastUsernameChangeTimestamp = Date.now(); 
    }
    
    if (selectedLanguage !== currentUser.displayLanguage) {
      publicUpdates.displayLanguage = selectedLanguage;
    }
    
    if (phoneNumber !== currentUser.phoneNumber) {
      privateUpdates.phoneNumber = phoneNumber;
    }

    if (Object.keys(publicUpdates).length === 0 && Object.keys(privateUpdates).length === 0) {
      setModalMessage('沒有任何變更需要儲存。', 'info');
      setIsSaving(false);
      return;
    }

    try {
      const token = await getToken(); 
      
      const response = await fetch(`/api/user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicUpdates: publicUpdates,
          privateUpdates: privateUpdates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新資料失敗');
      }

      

    } catch (error) {
      console.error('儲存錯誤:', error);
      
    } finally {
      setIsSaving(false);
    }
  };

  // --- 刪除帳戶處理 ---
  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ 您確定要永久刪除帳戶嗎？此操作將根據加拿大個人資料收集條例刪除所有 Firebase 資料，不可逆轉。")) {
      return;
    }
    
    setIsDeleting(true);

    try {
      const token = await getToken(); 
      
      // 呼叫單一路由的 DELETE 方法
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await logout(); 
        setModalMessage("✅ 帳戶已成功刪除。再見！", 'success');
        router.push('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除失敗，請重試。');
      }

    } catch (error) {
      console.error('刪除錯誤:', error);
      setModalMessage(`❌ 刪除失敗: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  // --- 渲染部分 ---

  return (
    <div className="w-full p-6 bg-white  rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">帳戶設定</h1>

      <form onSubmit={handleSave} className="space-y-6">

        {/* 1. 用戶名設定 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
            用戶名 (Username) 
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={!canChangeUsername || isSaving}
            className={`w-full p-3 border ${canChangeUsername ? 'border-indigo-300' : 'border-red-500 bg-gray-100 cursor-not-allowed'} rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150`}
            placeholder="請輸入新的用戶名"
          />
          <p className={`mt-2 text-xs ${canChangeUsername ? 'text-gray-500' : 'text-red-600 font-medium'}`}>
            💡 用戶名每月只能更改一次。
            {!canChangeUsername && ` 您需要在 ${Math.ceil(30 - daysSinceLastChange)} 天後才能再次更改。`}
          </p>
        </div>

        {/* 2. 顯示語言設定 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">
            顯示語言 (Display Language)
          </label>
          <select
            id="language"
            name="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isSaving}
            className="w-full p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white transition duration-150"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">用於影響應用程式介面的顯示語言。</p>
        </div>
        
        {/* 3. 手機號碼 (Private Data) */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
            手機號碼 (Phone Number) (私人資料)
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isSaving}
            className="w-full p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            placeholder="請輸入手機號碼"
          />
          
        </div>


        {/* 4. 儲存按鈕 */}
        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>

      {/* --- 刪除帳戶部分 --- */}
      <div className="mt-10 pt-6 border-t border-red-300">
        <h2 className="text-xl font-bold text-red-700 mb-4">危險區域 (Danger Zone)</h2> 
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold text-red-800">永久刪除您的帳戶</p>
            <p className="text-sm text-red-600">
              此操作將依據**加拿大個人資料收集條例**永久刪除您所有的資料。
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isDeleting ? '處理中...' : '刪除帳戶'}
          </button>
        </div>
      </div>

    </div>
  );
}