'use client';

import { getApiKey } from '@/lib/encryption/storage';

/**
 * OpenAI Agents SDKと連携するためのクライアントクラス
 * APIキーの管理と、エージェント関連の操作を提供します
 */
export class AgentsClient {
  private apiKey: string | null = null;

  /**
   * APIキーを取得し、クライアントを初期化
   * @returns 初期化が成功したかどうか
   */
  async initialize(): Promise<boolean> {
    try {
      this.apiKey = await getApiKey();
      return !!this.apiKey;
    } catch (error) {
      console.error('APIキーの取得に失敗しました:', error);
      return false;
    }
  }

  /**
   * APIキーが設定されているかどうかを確認
   * @returns APIキーが設定されているかどうか
   */
  isInitialized(): boolean {
    return !!this.apiKey;
  }

  /**
   * 自然言語の説明からエージェント設定を生成
   * @param naturalLanguageDefinition 自然言語によるエージェントの定義
   * @param agentName エージェントの名前
   * @returns エージェント設定オブジェクト
   */
  async createAgentFromNaturalLanguage(
    naturalLanguageDefinition: string,
    agentName: string
  ): Promise<AgentDefinition> {
    if (!this.isInitialized()) {
      throw new Error('APIキーが設定されていません');
    }

    try {
      // サーバーサイドAPIを呼び出してエージェント設定を生成
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          naturalLanguageDefinition,
          agentName,
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'エージェントの作成に失敗しました');
      }

      const agentDefinition = await response.json();
      
      // 作成したエージェント情報をローカルストレージに保存
      this.saveAgentToLocalStorage(agentDefinition);
      
      return agentDefinition;
    } catch (error) {
      console.error('エージェント作成中にエラーが発生しました:', error);
      throw error;
    }
  }
  
  /**
   * エージェント情報をローカルストレージに保存
   * @param agent 保存するエージェント情報
   */
  private saveAgentToLocalStorage(agent: AgentDefinition): void {
    try {
      // 既存のエージェント一覧を取得
      const storedAgentsJson = localStorage.getItem('openai-agents-data') || '[]';
      const storedAgents = JSON.parse(storedAgentsJson) as AgentDefinition[];
      
      // 新しいエージェントを追加または更新
      const existingIndex = storedAgents.findIndex(a => a.id === agent.id);
      if (existingIndex >= 0) {
        storedAgents[existingIndex] = agent;
      } else {
        storedAgents.push(agent);
      }
      
      // 保存
      localStorage.setItem('openai-agents-data', JSON.stringify(storedAgents));
    } catch (error) {
      console.error('エージェント情報の保存に失敗しました:', error);
    }
  }

  /**
   * エージェントとチャットする
   * @param agentId エージェントID
   * @param message ユーザーメッセージ
   * @returns エージェントの応答
   */
  async chatWithAgent(agentId: string, message: string): Promise<AgentResponse> {
    if (!this.isInitialized()) {
      throw new Error('APIキーが設定されていません');
    }

    try {
      // ローカルストレージからエージェント定義を取得
      const agentDefinition = this.getAgentFromLocalStorage(agentId);
      
      if (!agentDefinition) {
        throw new Error('エージェントが見つかりません');
      }
      
      // サーバーサイドAPIを呼び出してエージェントとチャット
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          apiKey: this.apiKey,
          agentDefinition
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'エージェントとのチャットに失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('エージェントとのチャット中にエラーが発生しました:', error);
      throw error;
    }
  }
  
  /**
   * ローカルストレージからエージェント定義を取得
   * @param agentId エージェントID
   * @returns エージェント定義（見つからない場合はnull）
   */
  private getAgentFromLocalStorage(agentId: string): AgentDefinition | null {
    try {
      const storedAgentsJson = localStorage.getItem('openai-agents-data') || '[]';
      const storedAgents = JSON.parse(storedAgentsJson) as AgentDefinition[];
      return storedAgents.find(a => a.id === agentId) || null;
    } catch (error) {
      console.error('エージェント情報の取得に失敗しました:', error);
      return null;
    }
  }

  /**
   * 保存されたエージェントの一覧を取得
   * @returns エージェントの一覧
   */
  async getAgents(): Promise<AgentDefinition[]> {
    try {
      // ローカルストレージからエージェント一覧を取得
      const storedAgentsJson = localStorage.getItem('openai-agents-data') || '[]';
      return JSON.parse(storedAgentsJson) as AgentDefinition[];
    } catch (error) {
      console.error('エージェント一覧の取得中にエラーが発生しました:', error);
      return [];
    }
  }
}

/**
 * エージェント定義の型
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructions: string;
  tools: AgentTool[];
  createdAt: string;
  updatedAt: string;
}

/**
 * エージェントツールの型
 */
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: 'hosted' | 'function' | 'agent';
}

/**
 * エージェント応答の型
 */
export interface AgentResponse {
  id: string;
  content: string;
  toolCalls?: AgentToolCall[];
  createdAt: string;
}

/**
 * エージェントツール呼び出しの型
 */
export interface AgentToolCall {
  id: string;
  toolName: string;
  args: Record<string, any>;
  result?: string;
}

// クライアントのシングルトンインスタンス
export const agentsClient = new AgentsClient();
