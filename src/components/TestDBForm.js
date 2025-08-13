// src/components/TestDBForm.js
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../lib/auth-context'; // 從新的 auth-context.js 導入
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner'; // 導入 LoadingSpinner
import Modal from './Modal'; // 導入 Modal

const TestDBForm = () => {
  const { db, currentUser, appId, setModalMessage } = useContext(AuthContext);
  const [testInput, setTestInput] = useState('');
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localModalMessage, setLocalModalMessage] = useState(''); // 用於本地訊息
  const userId = currentUser?.uid || 'anonymous';

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const testCollectionRef = collection(db, `artifacts/${appId}/public/data/test_data`);
    const q = query(testCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestData(dataList);
      setLoading(false);
    }, (error) => {
      console.error("獲取測試資料失敗:", error);
      setLocalModalMessage(`獲取測試資料失敗: ${error.message}`); // 使用本地模態框
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, appId]);

  const handleAddTestData = async (e) => {
    e.preventDefault();
    if (!db || !currentUser) {
      setLocalModalMessage("請先登入才能新增測試資料。");
      return;
    }
    if (!testInput.trim()) {
      setLocalModalMessage("請輸入一些文字以新增測試資料。");
      return;
    }

    setLoading(true);
    try {
      const testCollectionRef = collection(db, `artifacts/${appId}/public/data/test_data`);
      await addDoc(testCollectionRef, {
        text: testInput,
        timestamp: new Date(),
        userId: currentUser.uid
      });
      setTestInput('');
      setLocalModalMessage("測試資料已成功新增！");
    } catch (error) {
      console.error("新增測試資料失敗:", error);
      setLocalModalMessage(`新增測試資料失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setLocalModalMessage('');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">測試資料庫連線</h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        此區塊用於測試與 Firebase Firestore 的資料讀寫。
      </p>
      <div className="max-w-md mx-auto mb-8">
        <form onSubmit={handleAddTestData} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="輸入測試文字..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={loading}
          >
            {loading ? '新增中...' : '新增測試資料'}
          </button>
        </form>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">現有測試資料</h3>
      {testData.length === 0 ? (
        <p className="text-center text-gray-600">目前沒有測試資料。請新增一些。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testData.map((item) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-gray-800 font-medium">{item.text}</p>
              <p className="text-gray-500 text-sm">
                新增於: {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'N/A'}
              </p>
              <p className="text-gray-500 text-sm">
                使用者 ID: {item.userId ? item.userId.substring(0, 8) + '...' : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
      <Modal message={localModalMessage} onClose={closeModal} />
    </section>
  );
};

export default TestDBForm;