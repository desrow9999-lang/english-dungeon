"use client";

import { useState } from "react";

const QUIZ_LIST = [
  {
    question: "「She is ______ about her new job.」空欄に入る言葉は？",
    options: ["excited", "excite", "excitingly", "excitement"],
    answerIndex: 0,
    explanation: "'be excited about 〜' で「〜にわくわくしている」という意味です。"
  },
  {
    question: "「I need to ______ my homework before dinner.」空欄に入る言葉は？",
    options: ["finish", "finishing", "finished", "finishes"],
    answerIndex: 0,
    explanation: "助動詞 'need to' の直後は動詞の原形 (finish) が来ます。"
  },
  {
    question: "「He goes to the gym ______ a week.」空欄に入る言葉は？",
    options: ["twice", "two", "second", "double"],
    answerIndex: 0,
    explanation: "「週に2回」は 'twice a week' と表現します。"
  }
];

export default function Home() {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(30);
  const [playerHp, setPlayerHp] = useState(100);
  const [message, setMessage] = useState("モンスターが現れた！");
  const [gameState, setGameState] = useState<"playing" | "victory" | "gameover">("playing");

  const quiz = QUIZ_LIST[currentQuizIndex];

  const handleAnswer = (index: number) => {
    if (gameState !== "playing") return;

    if (index === quiz.answerIndex) {
      const nextEnemyHp = Math.max(0, enemyHp - 10);
      setEnemyHp(nextEnemyHp);

      if (nextEnemyHp <= 0) {
        setGameState("victory");
        setMessage("🎉 モンスターを倒した！ダンジョンクリア！");
        return;
      }

      setMessage("⭕️ 正解！モンスターに10ダメージを与えた！");
      if (currentQuizIndex < QUIZ_LIST.length - 1) {
        setCurrentQuizIndex((prev) => prev + 1);
      } else {
        setCurrentQuizIndex(0);
      }
    } else {
      const nextPlayerHp = Math.max(0, playerHp - 20);
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
    setEnemyHp(30);
    setPlayerHp(100);
    setCurrentQuizIndex(0);
    setGameState("playing");
    setMessage("モンスターが現れた！");
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h1 style={{ textAlign: 'center', color: '#fbbf24', fontSize: '18px', marginBottom: '16px' }}>⚔️ 英語クイズダンジョン ⚔️</h1>
        
        {/* 敵ステータス */}
        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #881337' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#fb7185' }}>👾 ゴブリンイングリッシュ</span>
            <span>HP: {enemyHp} / 30</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#334155', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${(enemyHp / 30) * 100}%`, backgroundColor: '#f43f5e', height: '100%', transition: 'all 0.3s' }} />
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

        {/* メッセージ */}
        <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', minHeight: '50px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {message}
        </div>

        {/* ゲーム進行中：クイズ問題と選択肢 */}
        {gameState === "playing" && (
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textAlign: 'center' }}>
              第 {currentQuizIndex + 1} 問
            </div>
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
          </div>
        )}

        {/* 勝利・敗北時：再挑戦ボタン */}
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
