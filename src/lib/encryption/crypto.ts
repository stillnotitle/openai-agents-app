/**
 * 暗号化ユーティリティ
 * OpenAI APIキーなどの機密情報を安全に保存するための暗号化・復号化機能を提供します
 */

// ブラウザの暗号化APIを使用
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * ランダムな暗号化キーを生成
 * @returns 暗号化に使用するキー
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 暗号化キーをエクスポート（文字列化）
 * @param key 暗号化キー
 * @returns エクスポートされたキー（Base64文字列）
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * 暗号化キーをインポート（文字列から復元）
 * @param keyStr エクスポートされたキー（Base64文字列）
 * @returns インポートされた暗号化キー
 */
export async function importKey(keyStr: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyStr), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 文字列を暗号化
 * @param text 暗号化する文字列
 * @param key 暗号化キー
 * @returns 暗号化されたデータ（Base64文字列）とIV（Base64文字列）のオブジェクト
 */
export async function encryptText(text: string, key: CryptoKey): Promise<{ encryptedData: string; iv: string }> {
  // ランダムなIV（初期化ベクトル）を生成
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // 暗号化を実行
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(text)
  );
  
  // バイナリデータをBase64文字列に変換
  const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivString = btoa(String.fromCharCode(...iv));
  
  return { encryptedData, iv: ivString };
}

/**
 * 暗号化された文字列を復号化
 * @param encryptedData 暗号化されたデータ（Base64文字列）
 * @param iv IV（初期化ベクトル、Base64文字列）
 * @param key 暗号化キー
 * @returns 復号化された文字列
 */
export async function decryptText(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
  // Base64文字列をバイナリデータに変換
  const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  // 復号化を実行
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );
  
  // バイナリデータを文字列に変換
  return decoder.decode(decryptedBuffer);
}
