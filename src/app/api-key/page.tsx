'use client';

import { useRouter } from 'next/navigation';
import { ApiKeyForm } from '@/components/forms/ApiKeyForm';
import { hasApiKey } from '@/lib/encryption/storage';
import { useEffect, useState } from 'react';

export default function ApiKeyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // APIキーが既に保存されている場合はダッシュボードにリダイレクト
    if (hasApiKey()) {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleSuccess = () => {
    // APIキーの保存に成功したらダッシュボードにリダイレクト
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500); // 成功メッセージを表示するために少し遅延
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">APIキーの設定</h1>
        <p className="text-muted-foreground mt-2">
          OpenAI APIキーを設定して、AIエージェントの作成を始めましょう
        </p>
      </div>

      <div className="mt-8">
        <ApiKeyForm onSuccess={handleSuccess} />
      </div>

      <div className="mt-12 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">APIキーについて</h2>
        <div className="space-y-4 text-sm">
          <p>
            <strong>APIキーとは？</strong> - OpenAI APIキーは、OpenAIのAIモデル（GPT-4など）にアクセスするために必要な認証キーです。
          </p>
          <p>
            <strong>APIキーの取得方法</strong> - <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAIのダッシュボード</a>にアクセスし、アカウントを作成してAPIキーを生成してください。
          </p>
          <p>
            <strong>セキュリティについて</strong> - このアプリケーションでは、APIキーはブラウザ内で暗号化され、ローカルストレージに保存されます。サーバーには送信されず、必要な時のみブラウザ内で復号化されます。
          </p>
          <p>
            <strong>料金について</strong> - OpenAI APIの使用には料金が発生します。詳細は<a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAIの料金ページ</a>をご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
