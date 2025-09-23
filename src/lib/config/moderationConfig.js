// src/lib/config/moderationConfig.js

/**
 * 敏感詞彙列表 (可擴展)
 * 集中管理所有食評審核用的敏感詞彙。
 */
export const forbiddenWords = [
  "fuck",
  "shit",
  "asshole",
  "bitch",
  "damn",
  "bastard",
  "idiot",
  "cunt",
  "whore",
  "nigga",
  "nigger",
  "pedophile",
  "rape",
  "murder",
  "kill",
  "suicide",
  "terrorist",
  "nazi",
  "kkk",
  "性",
  "裸照",
  "強姦",
  "殺",
  "死",
  "操",
  "他媽的",
  "媽的",
  "智障",
  "白痴",
  "妓女",
  "淫",
  "毒品",
  "槍",
  "屌",
];

/**
 * checkModeration: Simple moderation check for forbidden words.
 * @param {string} text - The text content to check.
 * @returns {string | null} - Returns a warning message if forbidden words are found, otherwise returns null.
 */
export const checkModeration = (text) => {
  const lowerCaseText = text.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerCaseText.includes(word)) {
      return `食評包含敏感詞彙: "${word}"`;
    }
  }
  return null;
};
