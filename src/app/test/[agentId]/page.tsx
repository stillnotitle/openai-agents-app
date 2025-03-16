'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiKey } from '@/lib/encryption/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

export default function TestAgentPage({ params }: { params: { agentId: string } }) {
  const router = useRouter();
  const [agentDefinition, setAgentDefinition] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // APIキーとエージェント定義を取得
    const initialize = async () => {
      try {
        // APIキーの確認
        const apiKey = await getApiKey();
        if (!apiKey) {
          router.push('/api-key');
          return;
        }

        // エージェント定義の取得（ローカルストレージから）
        const savedAgents = JSON.parse(localStorage.getItem('openai-agents-app-agents') || '[]');
        const agent = savedAgents.find((a: any) => a.id === params.agentId);
        
        if (!agent) {
          setError('エージェントが見つかりません');
        } else {
          setAgentDefinition(agent);
          
          // 初期メッセージを設定
          setMessages([
            {
              id: 'system-1',
              role: 'system',
              content: 'エージェントが準備できました。メッセージを送信してください。',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('初期化中にエラーが発生しました:', error);
        setError('エージェントの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [params.agentId, router]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agentDefinition) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setError(null);

    try {
      // APIキーを取得
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('APIキーが設定されていません');
        return;
      }

      // エージェントとチャット
      const response = await fetch(`/api/agents/${params.agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          apiKey,
          agentDefinition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'エージェントとのチャットに失敗しました');
      }

      const agentResponse = await response.json();

      // エージェントの応答をメッセージリストに追加
      const agentMessage: Message = {
        id: agentResponse.id || `agent-${Date.now()}`,
        role: 'agent',
        content: agentResponse.content,
        timestamp: new Date(agentResponse.createdAt || Date.now()),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('エージェントとのチャット中にエラーが発生しました:', error);
      setError(error.message || 'エージェントとのチャットに失敗しました');
      
      // エラーメッセージをシステムメッセージとして表示
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          role: 'system',
          content: `エラー: ${error.message || 'エージェントとのチャットに失敗しました'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !agentDefinition) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/dashboard')}>ダッシュボードに戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> ダッシュボードに戻る
        </Link>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">{agentDefinition?.name || 'エージェントテスト'}</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>{agentDefinition?.name || 'エージェント'}</CardTitle>
          <CardDescription>
            {agentDefinition?.description || 'エージェントとチャットして、動作をテストします。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted text-muted-foreground text-sm'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="flex-1 min-h-[60px] max-h-[120px]"
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[60px] w-[60px]"
                disabled={!inputMessage.trim() || isSending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {agentDefinition && (
        <div className="mt-8 bg-muted p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">エージェント情報</h2>
          <div className="space-y-4 text-sm">
            <p>
              <strong>名前:</strong> {agentDefinition.name}
            </p>
            <p>
              <strong>説明:</strong> {agentDefinition.description}
            </p>
            <p>
              <strong>指示:</strong> {agentDefinition.instructions}
            </p>
            {agentDefinition.tools && agentDefinition.tools.length > 0 && (
              <div>
                <strong>ツール:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {agentDefinition.tools.map((tool: any, index: number) => (
                    <li key={index}>
                      {tool.name} - {tool.description} ({tool.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
