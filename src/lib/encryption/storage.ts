/**
 * APIキー保存ユーティリティ
 * 暗号化されたAPIキーをローカルストレージに安全に保存・取得するための機能を提供します
 */

import { encryptText, decryptText, generateEncryptionKey, exportKey, importKey } from './crypto';

// ローカルストレージのキー
const STORAGE_KEY = 'openai-agents-app-encrypted-api-key';
const ENCRYPTION_KEY = 'openai-agents-app-encryption-key';
const IV_KEY = 'openai-agents-app-iv';

/**
 * APIキーを安全に保存
 * @param apiKey OpenAI APIキー
 * @returns 保存が成功したかどうか
 */
export async function saveApiKey(apiKey: string): Promise<boolean> {
  try {
    // 暗号化キーを生成または取得
    let encryptionKey: CryptoKey;
    const storedKeyStr = localStorage.getItem(ENCRYPTION_KEY);
    
    if (storedKeyStr) {
      // 既存の暗号化キーを使用
      encryptionKey = await importKey(storedKeyStr);
    } else {
      // 新しい暗号化キーを生成
      encryptionKey = await generateEncryptionKey();
      const exportedKey = await exportKey(encryptionKey);
      localStorage.setItem(ENCRYPTION_KEY, exportedKey);
    }
    
    // APIキーを暗号化
    const { encryptedData, iv } = await encryptText(apiKey, encryptionKey);
    
    // 暗号化されたデータとIVを保存
    localStorage.setItem(STORAGE_KEY, encryptedData);
    localStorage.setItem(IV_KEY, iv);
    
    return true;
  } catch (error) {
    console.error('APIキーの保存に失敗しました:', error);
    return false;
  }
}

/**
 * 保存されたAPIキーを取得
 * @returns 復号化されたAPIキー、または未保存の場合はnull
 */
export async function getApiKey(): Promise<string | null> {
  try {
    // 保存されたデータを取得
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    const iv = localStorage.getItem(IV_KEY);
    const storedKeyStr = localStorage.getItem(ENCRYPTION_KEY);
    
    // いずれかのデータが存在しない場合はnullを返す
    if (!encryptedData || !iv || !storedKeyStr) {
      return null;
    }
    
    // 暗号化キーをインポート
    const encryptionKey = await importKey(storedKeyStr);
    
    // APIキーを復号化
    return await decryptText(encryptedData, iv, encryptionKey);
  } catch (error) {
    console.error('APIキーの取得に失敗しました:', error);
    return null;
  }
}

/**
 * 保存されたAPIキーを削除
 */
export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(IV_KEY);
  // 暗号化キーは他の用途で再利用できるため、オプションで残しておく
}

/**
 * APIキーが保存されているかどうかを確認
 * @returns APIキーが保存されているかどうか
 */
export function hasApiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * APIキーの有効性を検証
 * @param apiKey 検証するAPIキー
 * @returns 検証結果（有効な場合はtrue）
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  // APIキーの形式を検証（基本的な形式チェックのみ）
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    return false;
  }
  
  // 実際のAPIキー検証はサーバーサイドで行うべきだが、
  // ここではクライアントサイドでの基本的な検証のみを行う
  return true;
}
