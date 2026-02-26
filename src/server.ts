import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();
const PORT = 3000;

// Ollamaのエンドポイント（デフォルトはlocalhost:11434）
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// チャットメッセージの型定義
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// チャットセッションの型定義
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

interface ChatRequest {
  sessionId: string;
  message: string;
}

interface ChatResponse {
  response: string;
  error?: string;
}

// セッション管理用のMap
const sessions = new Map<string, ChatSession>();

// 初期セッションを作成
function createNewSession(): ChatSession {
  const id = Date.now().toString();
  const session: ChatSession = {
    id,
    title: `チャット ${new Date(parseInt(id)).toLocaleString('ja-JP')}`,
    messages: [],
    createdAt: parseInt(id),
  };
  sessions.set(id, session);
  return session;
}

// 初期状態で1つのセッションを作成
let currentSessionId = createNewSession().id;

// ヘルスチェック
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// セッション一覧を取得
app.get('/api/sessions', (req: Request, res: Response) => {
  const sessionList = Array.from(sessions.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      messageCount: session.messages.length,
    }));
  res.json({ sessions: sessionList, currentSessionId });
});

// 新規セッションを作成
app.post('/api/sessions', (req: Request, res: Response) => {
  const session = createNewSession();
  currentSessionId = session.id;
  res.json({
    id: session.id,
    title: session.title,
  });
});

// セッションを切り替え
app.post('/api/sessions/:id/switch', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!sessions.has(id)) {
    res.status(404).json({ error: 'セッションが見つかりません' });
    return;
  }
  currentSessionId = id;
  const session = sessions.get(id)!;
  res.json({
    id: session.id,
    title: session.title,
    messages: session.messages,
  });
});

// セッションを削除
app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!sessions.has(id)) {
    res.status(404).json({ error: 'セッションが見つかりません' });
    return;
  }

  // 削除するセッションが現在のセッションの場合、新しいセッションを作成
  if (currentSessionId === id) {
    sessions.delete(id);
    const newSession = createNewSession();
    currentSessionId = newSession.id;
    res.json({ message: 'セッションを削除しました', newSessionId: newSession.id });
  } else {
    sessions.delete(id);
    res.json({ message: 'セッションを削除しました' });
  }
});

// チャットエンドポイント
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'メッセージが必要です' });
      return;
    }

    // セッションを取得、なければ作成
    let session = sessions.get(sessionId);
    if (!session) {
      session = createNewSession();
      currentSessionId = session.id;
    } else {
      currentSessionId = sessionId;
    }

    // ユーザーメッセージを履歴に追加
    session.messages.push({
      role: 'user',
      content: message,
    });

    // 会話履歴からプロンプトを構築
    const conversationContext = session.messages
      .map((msg) => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`)
      .join('\n');

    const prompt = `以下は日本語での会話です。ユーザーの質問に対して、丁寧に回答してください。

${conversationContext}
アシスタント:`;

    // Ollamaに リクエスト送信
    const gemmaResponse = await axios.post(OLLAMA_API_URL, {
      model: 'gemma',
      prompt,
      stream: false,
      temperature: 0.7,
    });

    const assistantMessage = gemmaResponse.data.response.trim();

    // アシスタントメッセージを履歴に追加
    session.messages.push({
      role: 'assistant',
      content: assistantMessage,
    });

    // セッションのタイトルが「チャット」のままなら、最初のメッセージで更新
    if (session.title.startsWith('チャット') && session.messages.length === 2) {
      const firstMessage = message.substring(0, 30);
      session.title = firstMessage.length < message.length ? firstMessage + '...' : firstMessage;
    }

    res.json({ response: assistantMessage, sessionId: session.id });
  } catch (error) {
    console.error('チャットエラー:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Ollamaサーバーに接続できません。Ollamaが起動していることを確認してください。',
        });
        return;
      }

      if (error.response?.status === 404) {
        res.status(404).json({
          error: 'Gemmaモデルが見つかりません。ollama pull gemmaを実行してください。',
        });
        return;
      }
    }

    res.status(500).json({ error: '内部サーバーエラーが発生しました' });
  }
});

// チャット履歴クリア（現在のセッションのみ）
app.post('/api/clear', (req: Request, res: Response) => {
  const session = sessions.get(currentSessionId);
  if (session) {
    session.messages.length = 0;
  }
  res.json({ message: 'チャット履歴をクリアしました' });
});

// ルートへのアクセス
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 チャットアプリが起動しました: http://localhost:${PORT}`);
  console.log('Ollamaが起動していることを確認してください。');
  console.log('初回実行時は以下のコマンドを実行してGemmaをダウンロードしてください:');
  console.log('  ollama pull gemma');
});
