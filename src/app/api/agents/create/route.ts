import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * エージェント作成APIエンドポイント
 * 自然言語の説明からOpenAI Agents SDKのエージェント設定を生成します
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディからデータを取得
    const body = await request.json();
    const { naturalLanguageDefinition, agentName, apiKey } = body;

    // 必須パラメータの検証
    if (!naturalLanguageDefinition || !agentName || !apiKey) {
      return NextResponse.json(
        { message: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // OpenAIクライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // GPT-4を使用して自然言語からエージェント設定を生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `あなたはOpenAI Agents SDKのエージェント設定を生成する専門家です。
ユーザーから提供される自然言語の説明を分析し、適切なエージェント設定を生成してください。
出力は以下のJSON形式で提供してください：

{
  "name": "エージェント名",
  "description": "エージェントの簡潔な説明",
  "instructions": "エージェントへの詳細な指示（システムプロンプト）",
  "tools": [
    {
      "name": "ツール名",
      "description": "ツールの説明",
      "type": "hosted" | "function" | "agent"
    }
  ]
}

ツールの種類は以下の通りです：
1. hosted: OpenAIが提供するホステッドツール（WebSearchTool、FileSearchTool、ComputerToolなど）
2. function: Pythonの関数をツールとして使用
3. agent: 他のエージェントをツールとして使用

ユーザーの説明を分析し、最も適切なツールを選択してください。`
        },
        {
          role: 'user',
          content: `エージェント名: ${agentName}\n\n説明: ${naturalLanguageDefinition}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // GPT-4の応答からエージェント設定を抽出
    const agentConfig = JSON.parse(completion.choices[0].message.content || '{}');

    try {
      // エージェント設定を検証（APIを使用せず単純な検証）
      if (!agentConfig.name || !agentConfig.instructions) {
        throw new Error('必須フィールドが不足しています');
      }

      // エージェントが正常に作成できた場合
      // 生成されたエージェント設定にIDと日時を追加
      const agentDefinition = {
        id: generateId(),
        ...agentConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 実際のアプリケーションではここでデータベースに保存する処理を追加
      return NextResponse.json(agentDefinition);
    } catch (agentError) {
      console.error('エージェント作成中にエラーが発生しました:', agentError);
      return NextResponse.json(
        { message: 'エージェント設定が無効です: ' + (agentError as Error).message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('エージェント作成中にエラーが発生しました:', error);
    return NextResponse.json(
      { message: error.message || 'エージェント作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * ツール設定を検証し、有効なものだけを返す
 */
function validateTools(tools: any[]) {
  return tools.filter(tool => 
    tool && 
    typeof tool.name === 'string' && 
    typeof tool.description === 'string' &&
    ['hosted', 'function', 'agent'].includes(tool.type)
  );
}

/**
 * ランダムなIDを生成
 */
function generateId(): string {
  return 'agent_' + Math.random().toString(36).substring(2, 15);
}
