import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as OpenAIAgents from 'openai-agents';

/**
 * エージェントとチャットするAPIエンドポイント
 * OpenAI Agents SDKを使用してエージェントを実行します
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { message, apiKey } = body;
    const agentId = params.agentId;

    // 必須パラメータの検証
    if (!message || !apiKey || !agentId) {
      return NextResponse.json(
        { message: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // エージェント定義をリクエストボディから取得
    const { agentDefinition } = body;

    if (!agentDefinition) {
      return NextResponse.json(
        { message: 'エージェント定義が見つかりません' },
        { status: 404 }
      );
    }

    // OpenAIクライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // OpenAI Agents SDKのエージェントを作成
    const agent = new OpenAIAgents.Agent({
      name: agentDefinition.name,
      instructions: agentDefinition.instructions,
      tools: agentDefinition.tools.map(tool => {
        // ツールの種類に応じて適切なツールを作成
        // 実際の実装では、各ツールの具体的な設定が必要
        if (tool.type === 'hosted') {
          // OpenAIのホステッドツール（例: WebSearch）
          return {
            name: tool.name,
            description: tool.description,
            // ホステッドツールの設定をここに追加
          };
        } else if (tool.type === 'function') {
          // 関数ツール
          return {
            name: tool.name,
            description: tool.description,
            // 関数ツールの設定をここに追加
          };
        } else if (tool.type === 'agent') {
          // エージェントツール
          return {
            name: tool.name,
            description: tool.description,
            // エージェントツールの設定をここに追加
          };
        }
        return null;
      }).filter(Boolean) // nullを除外
    });

    // エージェントを実行
    const result = await OpenAIAgents.Runner.run_sync(agent, message);

    // 応答を返す
    return NextResponse.json({
      id: `response_${Date.now()}`,
      content: result.final_output,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('エージェントとのチャット中にエラーが発生しました:', error);
    return NextResponse.json(
      { message: error.message || 'エージェントとのチャット中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
