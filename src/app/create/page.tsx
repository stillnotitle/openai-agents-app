'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { agentsClient } from '@/lib/agents-client';
import { getApiKey } from '@/lib/encryption/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateAgentPage() {
  const router = useRouter();
  const [naturalLanguageDefinition, setNaturalLanguageDefinition] = useState('');
  const [agentName, setAgentName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // APIキーが設定されているか確認
    const checkApiKey = async () => {
      const apiKey = await getApiKey();
      if (!apiKey) {
        router.push('/api-key');
      }
    };
    
    checkApiKey();
  }, [router]);

  const handleCreateAgent = async () => {
    if (!naturalLanguageDefinition || !agentName) {
      setError('エージェント名と定義を入力してください');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // APIキーを取得
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('APIキーが設定されていません');
        return;
      }

      // サーバーサイドAPIを呼び出してエージェントを作成
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          naturalLanguageDefinition,
          agentName,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'エージェントの作成に失敗しました');
      }

      const agentDefinition = await response.json();
      
      // ローカルストレージにエージェント定義を保存
      const savedAgents = JSON.parse(localStorage.getItem('openai-agents-app-agents') || '[]');
      savedAgents.push(agentDefinition);
      localStorage.setItem('openai-agents-app-agents', JSON.stringify(savedAgents));
      
      setSuccess(true);
      
      // 成功後、少し待ってからテストページに遷移
      setTimeout(() => {
        router.push(`/test/${agentDefinition.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('エージェントの作成中にエラーが発生しました:', error);
      setError(error.message || 'エージェントの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">新規エージェント作成</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>エージェント情報</CardTitle>
          <CardDescription>
            自然言語でエージェントの定義を入力してください。OpenAI Agents SDKを使用して、入力内容からエージェントを自動生成します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-name">エージェント名</Label>
            <Input
              id="agent-name"
              placeholder="例: カスタマーサポートアシスタント"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-definition">エージェント定義</Label>
            <Textarea
              id="agent-definition"
              placeholder="例: このエージェントは顧客からの問い合わせに対応し、製品情報を提供し、注文状況を確認できるアシスタントです。丁寧で親しみやすい口調で応答し、必要に応じて適切なツールを使用して情報を取得します。"
              className="min-h-[200px]"
              value={naturalLanguageDefinition}
              onChange={(e) => setNaturalLanguageDefinition(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              エージェントの目的、使用するツール、応答スタイルなどを自由に記述してください。
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>
                エージェントが正常に作成されました。テストページに移動します...
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleCreateAgent} 
            disabled={isCreating || !naturalLanguageDefinition || !agentName}
            className="w-full"
          >
            {isCreating ? 'エージェント作成中...' : 'エージェントを作成'}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">エージェント作成のヒント</h2>
        <div className="space-y-4 text-sm">
          <p>
            <strong>詳細な指示を提供する</strong> - エージェントの目的、使用するツール、応答スタイルなどを具体的に記述すると、より適切なエージェントが生成されます。
          </p>
          <p>
            <strong>ユースケースを明確にする</strong> - エージェントがどのような状況で使用されるかを明確にすると、より適切な機能が実装されます。
          </p>
          <p>
            <strong>制約条件を指定する</strong> - エージェントが避けるべき行動や、特定の方法で対応すべき状況などを指定すると、より安全で有用なエージェントになります。
          </p>
        </div>
      </div>
    </div>
  );
}
