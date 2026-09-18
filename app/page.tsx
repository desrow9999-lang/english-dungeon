"use client";

import { useState } from "react";

export default function Home() {
  const [enemyHp, setEnemyHp] = useState(30);
  const [playerHp, setPlayerHp] = useState(100);
  const [message, setMessage] = useState("モンスターが現れた！");

  const quiz = {
    question: "「She is ______ about her new job.」空欄に入る言葉は？",
    options: ["excited", "excite", "excitingly", "excitement"],
    answerIndex: 0,
    explanation: "'be excited about 〜' で「〜にわくわくしている」という意味です。"
  };

  const handleAnswer = (index: number) => {
    if (index === quiz.answerIndex) {
      setEnemyHp((prev) => Math.max(0, prev - 10));
      setMessage("⭕️ 正解！モンスターに10ダメージを与えた！");
    } else {
      setPlayerHp((prev) => Math.max(0, prev - 10));
      setMessage(`❌ 不正解… ${quiz.explanation}`);
    }
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
        <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', minHeight: '50px', fontSize: '14px', display: 'flex', itemsCenter: 'center', justifyContent: 'center' }}>
          {message}
        </div>

        {/* クイズ問題と選択肢 */}
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
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
      </div>
    </main>
  );
}

