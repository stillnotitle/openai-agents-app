'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiKey, removeApiKey } from '@/lib/encryption/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardPage() {
  const router = useRouter();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const apiKey = await getApiKey();
        setHasKey(!!apiKey);
      } catch (error) {
        console.error('APIキーの確認中にエラーが発生しました:', error);
        setHasKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, []);

  const handleRemoveApiKey = () => {
    if (confirm('APIキーを削除してもよろしいですか？この操作は元に戻せません。')) {
      removeApiKey();
      router.push('/api-key');
    }
  };

  const handleCreateAgent = () => {
    router.push('/create');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>APIキーが設定されていません</AlertTitle>
          <AlertDescription>
            AIエージェントを作成するには、OpenAI APIキーを設定する必要があります。
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/api-key')}>APIキーを設定する</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleRemoveApiKey}>
            APIキーを削除
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="mr-2 h-4 w-4" /> 新規エージェント作成
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* エージェントがない場合の表示 */}
        <Card className="col-span-full bg-muted/50">
          <CardHeader>
            <CardTitle>エージェントがありません</CardTitle>
            <CardDescription>
              まだエージェントが作成されていません。新規エージェント作成ボタンをクリックして、最初のエージェントを作成しましょう。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button onClick={handleCreateAgent} size="lg">
              <Plus className="mr-2 h-5 w-5" /> 新規エージェント作成
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">OpenAI Agents SDKについて</h2>
        <div className="space-y-4 text-sm">
          <p>
            <strong>OpenAI Agents SDK</strong>とは、AIエージェントを簡単に構築するためのツールキットです。
            このSDKを使用することで、自然言語処理、ツールの使用、意思決定などの機能を持つAIエージェントを作成できます。
          </p>
          <p>
            <strong>主な機能</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>エージェントループ: ツールの呼び出し、結果のLLMへの送信、LLMが完了するまでのループを処理</li>
            <li>Pythonファースト: 新しい抽象化を学ぶ必要なく、組み込み言語機能を使用してエージェントを調整</li>
            <li>ハンドオフ: 複数のエージェント間で調整と委任を行うための強力な機能</li>
            <li>ガードレール: 入力検証とチェックをエージェントと並行して実行</li>
            <li>関数ツール: Pythonの関数をツールに変換し、自動スキーマ生成とPydanticによる検証を実現</li>
            <li>トレーシング: ワークフローの視覚化、デバッグ、モニタリングのための組み込み機能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
