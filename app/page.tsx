"use client";

import { useState, useEffect } from "react";

type Quiz = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export default function Home() {
  const [apiKey, setApiKey] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [enemyHp, setEnemyHp] = useState(50);
  const [playerHp, setPlayerHp] = useState(100);
  const [message, setMessage] = useState("AIモンスターが現れた！");
  const [gameState, setGameState] = useState<"playing" | "victory" | "gameover">("playing");

  useEffect(() => {
    const savedKey = localStorage.getItem("user_gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      fetchQuiz(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (!inputKey.trim()) return;
    const key = inputKey.trim();
    localStorage.setItem("user_gemini_api_key", key);
    setApiKey(key);
    fetchQuiz(key);
  };

  const handleResetKey = () => {
    localStorage.removeItem("user_gemini_api_key");
    setApiKey("");
    setQuiz(null);
  };

  const fetchQuiz = async (keyToUse: string) => {
    setLoading(true);
    setMessage("⚡ AIがクイズを生成中…");

    const prompt = `英語の4択クイズ（日常会話）を1問作成。JSONのみ出力。
{"question":"問題文","options":["選択肢1","選択肢2","選択肢3","選択肢4"],"answerIndex":0,"explanation":"解説"}`;

    try {
      // 安定している gemini-1.5-flash に変更
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTPエラー: ${res.status}`);
      }

      const generatedQuiz = JSON.parse(data.candidates[0].content.parts[0].text);
      setQuiz(generatedQuiz);
      setMessage("AIモンスターが現れた！");
    } catch (err: any) {
      setMessage(`❌ エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (gameState !== "playing" || !quiz) return;

    if (index === quiz.answerIndex) {
      const nextEnemyHp = Math.max(0, enemyHp - 15);
      setEnemyHp(nextEnemyHp);

      if (nextEnemyHp <= 0) {
        setGameState("victory");
        setMessage("🎉 AIドラゴンを倒した！ダンジョンクリア！");
        return;
      }

      setMessage("⭕️ 正解！15ダメージ！次問題を生成中…");
      fetchQuiz(apiKey);
    } else {
      const nextPlayerHp = Math.max(0, playerHp - 25);
      setPlayerHp(nextPlayerHp);

      if (nextPlayerHp <= 0) {
        setGameState("gameover");
        setMessage("💀 プレイヤーのHPがなくなった… ゲームオーバー！");
        return;
      }

      setMessage(`❌ 不正解！ ${quiz.explanation}`);
    }
  };

  const handleReset = () => {
    setEnemyHp(50);
    setPlayerHp(100);
    setGameState("playing");
    setMessage("新たなAIモンスターが現れた！");
    fetchQuiz(apiKey);
  };

  if (!apiKey) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h1 style={{ textAlign: 'center', color: '#fbbf24', fontSize: '18px', marginBottom: '16px' }}>🔑 Gemini APIキーの設定</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.5' }}>
            Google AI Studioで取得したAPIキーを入力してください。
          </p>
          <input
            type="password"
            placeholder="AI Studioで取得したAPIキーを入力"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              backgroundColor: '#0f172a',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '12px',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleSaveKey}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            設定してゲームを開始
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ color: '#fbbf24', fontSize: '16px', margin: 0 }}>⚔️ AI英語ダンジョン ⚔️</h1>
          <button
            onClick={handleResetKey}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
          >
            🔑 キー再設定
          </button>
        </div>
        
        {/* 敵ステータス */}
        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #881337' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#fb7185' }}>👾 AIドラゴン</span>
            <span>HP: {enemyHp} / 50</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#334155', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${(enemyHp / 50) * 100}%`, backgroundColor: '#f43f5e', height: '100%', transition: 'all 0.3s' }} />
          </div>
        </div>

        {/* プレイヤーステータス */}
        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #064e3b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#34d399' }}>🛡️ 勇者（あなた）</span>
            <span>HP: {playerHp} / 100</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#334155', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${(playerHp / 100) * 100}%`, backgroundColor: '#10b981', height: '100%', transition: 'all 0.3s' }} />
          </div>
        </div>

        {/* メッセージ表示（エラー詳細もここに出ます） */}
        <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', minHeight: '50px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: message.startsWith('❌') ? '#f87171' : '#fff' }}>
          {message}
        </div>

        {/* ゲーム進行中 */}
        {gameState === "playing" && (
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>⚡ AIが生成中…</p>
            ) : quiz ? (
              <>
                <p style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textAlign: 'center' }}>{quiz.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#1e293b',
                        color: '#fff',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {idx + 1}. {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={() => fetchQuiz(apiKey)}
                style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                🔄 再試行する
              </button>
            )}
          </div>
        )}

        {/* 勝利・敗北時 */}
        {gameState !== "playing" && (
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: gameState === "victory" ? '#059669' : '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            {gameState === "victory" ? "🏆 もう一度遊ぶ" : "🔄 もう一度挑戦する"}
          </button>
        )}
      </div>
    </main>
  );
}
