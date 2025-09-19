"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUpload,
  faImage,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, collection, getFirestore } from "firebase/firestore"; // 新增 Firestore 相關匯入
import { AuthContext } from "@/lib/auth-context";
import { toast } from "react-toastify";

// 格式化日期時間的工具函式
const formatDateTime = (timestamp) => {
  if (!timestamp) return "無";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const BlogForm = ({
  initialData,
  onSave,
  onCancel,
  saving,
  onImageChange,
  previewUrl,
}) => {
  // 假設 AuthContext 也提供了 Firestore 實例 db
  const { storage, setModalMessage, db } = useContext(AuthContext);

  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      content: "",
      status: "draft",
      authorId: "",
      tags: [],
    }
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [isDraggingOverPreview, setIsDraggingOverPreview] = useState(false);
  const [parsedContent, setParsedContent] = useState([]);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const skipNextRender = useRef(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const parseContent = (content) => {
      if (!content) return [];
      const blocks = [];
      const imageRegex = /<img src="([^"]+)"[^>]*\/>/g;
      let lastIndex = 0;
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          blocks.push({
            type: "text",
            content: content.substring(lastIndex, match.index),
          });
        }
        blocks.push({ type: "image", content: match[0], url: match[1] });
        lastIndex = imageRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        blocks.push({ type: "text", content: content.substring(lastIndex) });
      }
      return blocks;
    };
    setParsedContent(parseContent(formData.content));
  }, [formData.content]);

  // 新增：圖片上傳函式現在不需要接收文章 ID，而是直接使用
  // 它可以是外部函式，但為了保持單一文件，我們將其保留在這裡
  const uploadImageToStorage = async (file, blogId) => {
    try {
      if (!storage) {
        throw new Error("Firebase Storage 未初始化");
      }
      const filePath = `public/blogs/${blogId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("圖片上傳失敗:", error);
      setModalMessage("圖片上傳失敗，請稍後再試。", "error");
      throw error;
    }
  };

  const handleGalleryImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setGalleryImages((prevImages) => [...prevImages, ...newImages]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // 修正後的 handleSubmit：只呼叫 onSave 一次
  const handleSubmit = useCallback(
    async (status) => {
      if (!storage) {
        setModalMessage("Firebase 服務未就緒，請稍後再試。", "error");
        return;
      }

      let finalContent = formData.content;
      let blogId = formData.id;
      let finalData = { ...formData };

      // 如果是新文章，先生成一個唯一的 ID
      if (!blogId && db) {
        const newDocRef = doc(collection(db, "blogs"));
        blogId = newDocRef.id;
        finalData.id = blogId;
      } else if (!blogId && !db) {
        setModalMessage("無法生成文章 ID，請檢查 Firebase 服務。", "error");
        return;
      }

      try {
        // 步驟 1: 上傳所有臨時內文圖片並取得永久網址
        const urlMap = {};
        const uploadPromises = galleryImages.map(async (image) => {
          const permanentUrl = await uploadImageToStorage(image.file, blogId);
          urlMap[image.url] = permanentUrl;
        });

        await Promise.all(uploadPromises);

        // 步驟 2: 替換文章內容中的臨時網址為永久網址
        for (const tempUrl in urlMap) {
          if (Object.prototype.hasOwnProperty.call(urlMap, tempUrl)) {
            const permanentUrl = urlMap[tempUrl];
            const regex = new RegExp(
              `src="${tempUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
              "g"
            );
            finalContent = finalContent.replace(regex, `src="${permanentUrl}"`);
          }
        }

        // 步驟 3: 建立最終的資料物件，並呼叫 onSave 一次
        finalData.content = finalContent;
        finalData.status = status;

        await onSave(finalData);

        setModalMessage("文章已成功儲存！", "success");
      } catch (error) {
        console.error("儲存文章失敗:", error);
        setModalMessage("儲存文章失敗，請檢查網路連線或稍後再試。", "error");
      }
    },
    [formData, galleryImages, onSave, storage, setModalMessage, db]
  );

  const handleTagInput = (e) => {
    setNewTagInput(e.target.value);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && newTagInput.trim() !== "") {
      e.preventDefault();
      const newTags = Array.isArray(formData.tags) ? [...formData.tags] : [];
      setFormData((prevData) => ({
        ...prevData,
        tags: [...newTags, newTagInput.trim()],
      }));
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = formData.tags.filter((tag) => tag !== tagToRemove);
    setFormData((prevData) => ({ ...prevData, tags: newTags }));
  };

  const handleDragStart = (e, url) => {
    e.dataTransfer.setData("text/plain", url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOverPreview(true);
  };

  const handleDragLeave = (e) => {
    setIsDraggingOverPreview(false);
  };

  const handleContentDrop = (e) => {
    e.preventDefault();
    setIsDraggingOverPreview(false);
    const droppedUrl = e.dataTransfer.getData("text/plain");

    const droppedImage = galleryImages.find((img) => img.url === droppedUrl);

    if (droppedImage) {
      const newImageTag = `<img src="${droppedUrl}" alt="文章內文圖片" class="my-4 w-full h-auto rounded-lg shadow-md" />`;
      setFormData((prevData) => ({
        ...prevData,
        content: (prevData.content || "") + `\n\n${newImageTag}\n\n`,
      }));
    }
  };

  const handleDragStartReorder = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnterReorder = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDropReorder = (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newParsedContent = [...parsedContent];
    const [draggedItem] = newParsedContent.splice(dragItem.current, 1);
    newParsedContent.splice(dragOverItem.current, 0, draggedItem);

    const newContentString = newParsedContent
      .map((block) => block.content)
      .join("");
    setFormData((prevData) => ({ ...prevData, content: newContentString }));

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleRemoveImage = (indexToRemove) => {
    const newParsedContent = parsedContent.filter(
      (_, index) => index !== indexToRemove
    );
    const newContentString = newParsedContent
      .map((block) => block.content)
      .join("");
    setFormData((prevData) => ({ ...prevData, content: newContentString }));
  };

  const previewTitle = formData?.title || "預覽標題";
  const previewContent =
    formData?.content || "這裡會即時顯示您輸入的文章內容。";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800">
          {formData?.id ? "編輯部落格文章" : "新增部落格文章"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          在此填寫文章內容，並預覽發布後的樣貌。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左側：預覽區 */}
        <div className="w-full lg:w-1/2 p-6 border-b lg:border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div
            className={`bg-white rounded-lg p-6 shadow-lg transition-all duration-200 ${
              isDraggingOverPreview
                ? "border-dashed border-4 border-blue-500 scale-[1.01]"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleContentDrop}
          >
            {formData?.id && formData?.reviewedAt && (
              <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md border border-green-200">
                <p className="font-semibold">已審批</p>
                <p>審批日期: {formatDateTime(formData.reviewedAt)}</p>
                <p>
                  審批管理員 ID:{" "}
                  <span className="font-mono text-xs">
                    {formData.reviewedBy}
                  </span>
                </p>
              </div>
            )}

            {previewUrl && (
              <img
                src={previewUrl}
                alt="封面預覽"
                className="w-full h-auto object-cover rounded-lg mb-4"
              />
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {previewTitle}
            </h1>

            <div className="text-sm text-gray-500 mb-6">
              作者: Admin •{" "}
              {formData.submittedAt
                ? formatDateTime(formData.submittedAt)
                : new Date().toLocaleDateString("zh-TW")}
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed">
              {parsedContent.length > 0 ? (
                parsedContent.map((block, index) => {
                  if (block.type === "text") {
                    return (
                      <div
                        key={index}
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      ></div>
                    );
                  } else if (block.type === "image") {
                    const nextBlock = parsedContent[index + 1];
                    const isGrouped = nextBlock?.type === "image";

                    if (skipNextRender.current) {
                      skipNextRender.current = false;
                      return null;
                    }

                    if (isGrouped) {
                      skipNextRender.current = true;
                      return (
                        <div
                          key={`group-${index}`}
                          className="flex flex-col md:flex-row items-start gap-4 my-4"
                        >
                          <div
                            draggable
                            onDragStart={(e) =>
                              handleDragStartReorder(e, index)
                            }
                            onDragEnter={(e) =>
                              handleDragEnterReorder(e, index)
                            }
                            onDragEnd={handleDropReorder}
                            className="relative w-full md:w-1/2 group cursor-grab active:cursor-grabbing"
                          >
                            <img
                              src={block.url}
                              alt="文章內文圖片"
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
                            >
                              &times;
                            </button>
                          </div>
                          <div
                            draggable
                            onDragStart={(e) =>
                              handleDragStartReorder(e, index + 1)
                            }
                            onDragEnter={(e) =>
                              handleDragEnterReorder(e, index + 1)
                            }
                            onDragEnd={handleDropReorder}
                            className="relative w-full md:w-1/2 group cursor-grab active:cursor-grabbing"
                          >
                            <img
                              src={nextBlock.url}
                              alt="文章內文圖片"
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index + 1)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={(e) => handleDragStartReorder(e, index)}
                          onDragEnter={(e) => handleDragEnterReorder(e, index)}
                          onDragEnd={handleDropReorder}
                          className="relative my-4 group cursor-grab active:cursor-grabbing"
                        >
                          <img
                            src={block.url}
                            alt="文章內文圖片"
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    }
                  }
                  return null;
                })
              ) : (
                <p>{previewContent}</p>
              )}
            </div>
          </div>
        </div>

        {/* 右側：編輯表單 */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                文章標題
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                詳細內容
                <span className="ml-2 text-xs text-gray-500">
                  (可將右側圖片拖曳至左側預覽區)
                </span>
              </label>
              <textarea
                id="content"
                name="content"
                rows="10"
                value={formData.content || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>

            {/* 標籤輸入與顯示區塊 */}
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                文章標籤
                <span className="ml-2 text-xs text-gray-500">
                  (按 Enter 鍵新增)
                </span>
              </label>
              <div className="mt-1 flex flex-wrap gap-2 rounded-md border border-gray-300 p-2">
                {Array.isArray(formData.tags) &&
                  formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                <input
                  id="tags"
                  type="text"
                  value={newTagInput}
                  onChange={handleTagInput}
                  onKeyDown={handleAddTag}
                  placeholder="新增標籤..."
                  className="flex-grow rounded-md border-0 p-0 focus:border-0 focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

            {/* 文章內文圖片上傳與拖放區塊 */}
            <div>
              <label
                htmlFor="galleryImages"
                className="block text-sm font-medium text-gray-700"
              >
                文章內文圖片 (可多選並拖曳)
              </label>
              <input
                id="galleryImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {galleryImages.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {galleryImages.map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt="內文圖片預覽"
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, image.url)}
                      className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-300 cursor-grab active:cursor-grabbing"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 原有的封面圖上傳區塊 */}
            <div>
              <label
                htmlFor="coverImage"
                className="block text-sm font-medium text-gray-700"
              >
                封面圖 (單獨上傳)
              </label>
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {/* 按鈕區塊：新增「儲存草稿」按鈕 */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                {saving ? "儲存中..." : "儲存草稿"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("pending")}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                {saving ? "發布中..." : "發布文章"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;
