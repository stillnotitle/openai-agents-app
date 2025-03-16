import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // OpenAI APIを直接使用してアシスタントを実行
    const assistantResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: agentDefinition.instructions
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
    });

    // 応答を取得
    const result = {
      final_output: assistantResponse.choices[0].message.content || "応答がありません。"
    };

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
