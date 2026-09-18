'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface QuizItem {
  question: string;
  options: string[];
  answerIndex: number;
}

const FALLBACK_QUIZZES: Record<string, QuizItem[]> = {
  english: [
    { question: '「She is ______ about her new job.」', options: ['excited', 'excite', 'exciting', 'excitedly'], answerIndex: 0 },
    { question: '「I am looking forward to ______ you.」', options: ['seeing', 'see', 'seen', 'saw'], answerIndex: 0 }
  ],
  history: [
    { question: '「織田信長」が倒れた本能寺の変が起きた年は？', options: ['1582年', '1600年', '1192年', '1868年'], answerIndex: 0 },
    { question: '江戸幕府を開いた人物は誰？', options: ['徳川家康', '豊臣秀吉', '源頼朝', '足利尊氏'], answerIndex: 0 }
  ],
  kanji: [
    { question: '「海獺」の正しい読み方は？', options: ['らっこ', 'かわうそ', 'あざらし', 'じゅごん'], answerIndex: 0 },
    { question: '「一期一会」の意味として正しいものは？', options: ['生涯に一度の出会い', '1年に一度会うこと', '友達を大切にすること', '毎日楽しく過ごすこと'], answerIndex: 0 }
  ],
  trivia: [
    { question: 'シャープペンシルの「シャープ」の由来は？', options: ['家電メーカーのシャープ', '尖っているから', '鋭い音から', '発明者の名前'], answerIndex: 0 },
    { question: 'キリンの首の骨の数は何本？', options: ['7本', '12本', '20本', '5本'], answerIndex: 0 }
  ],
  it: [
    { question: 'Webサイトの見た目を整える言語はどれ？', options: ['CSS', 'HTML', 'Python', 'SQL'], answerIndex: 0 },
    { question: '「CPU」の説明として最も適しているものは？', options: ['コンピュータの頭脳', '主記憶装置', '電源ユニット', '通信ケーブル'], answerIndex: 0 }
  ],
  math: [
    { question: '「7 × 8 - 6」の計算結果は？', options: ['50', '52', '48', '56'], answerIndex: 0 },
    { question: '三角形の内角の和は何度？', options: ['180度', '360度', '90度', '270度'], answerIndex: 0 }
  ]
};

const playSE = (type: 'correct' | 'wrong' | 'heal' | 'ultimate') => {
  if (typeof window === 'undefined') return;
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'heal') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'ultimate') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // SE再生不可環境への対策
  }
};

const GENRES = [
  { id: 'english', label: '🔤 英語' },
  { id: 'history', label: '🏯 歴史' },
  { id: 'kanji', label: '🖋️ 漢字' },
  { id: 'trivia', label: '💡 雑学' },
  { id: 'it', label: '💻 IT' },
  { id: 'math', label: '🧮 算数' },
];

const MONSTERS = ['スライムドラゴン', 'ダークナイト', 'ヘルフェニックス', 'デビルキング', 'カオスゴーレム'];

export default function Home() {
  const [genre, setGenre] = useState('english');
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [defeatCount, setDefeatCount] = useState(0);

  const [playerHp, setPlayerHp] = useState(100);
  const [monsterHp, setMonsterHp] = useState(40);
  const [monsterMaxHp, setMonsterMaxHp] = useState(40);
  const [monsterName, setMonsterName] = useState('スライムドラゴン');
  const [potions, setPotions] = useState(2);
  const [charge, setCharge] = useState(0);

  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');

  const [quiz, setQuiz] = useState<QuizItem>(FALLBACK_QUIZZES.english[0]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [message, setMessage] = useState('スライムドラゴンが現れた！');
  const [timeLeft, setTimeLeft] = useState(10);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const timerRef = useRef<any>(null);

  const fetchNextQuiz = useCallback(async (g = genre, d = difficulty, key = apiKey) => {
    setLoading(true);
    setSelectedOption(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: g, difficulty: d, userApiKey: key }),
      });
      if (!res.ok) throw new Error('API Error');
      const data: QuizItem = await res.json();
      if (data && data.question && Array.isArray(data.options)) {
        setQuiz(data);
      } else {
        throw new Error('Invalid Data');
      }
    } catch {
      const pool = FALLBACK_QUIZZES[g] || FALLBACK_QUIZZES.english;
      const randomQuiz = pool[Math.floor(Math.random() * pool.length)];
      setQuiz(randomQuiz);
    } finally {
      setLoading(false);
      setMessage('問題が出題された！');
    }
  }, [genre, difficulty, apiKey]);

  const handleGameOver = useCallback(() => {
    setMessage('☠️ 勇者は倒れてしまった...');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        alert(`ゲームオーバー！ 撃破数: ${defeatCount}`);
      }
      setPlayerHp(100);
      setDefeatCount(0);
      setMonsterHp(40);
      setMonsterMaxHp(40);
      setCharge(0);
      setPotions(2);
      fetchNextQuiz();
    }, 1000);
  }, [defeatCount, fetchNextQuiz]);

  const handleDefeatMonster = useCallback(() => {
    const nextDefeat = defeatCount + 1;
    setDefeatCount(nextDefeat);

    setMessage(`🎉 ${monsterName} を倒した！ 次の敵が現れる...`);
    setTimeout(() => {
      const nextName = MONSTERS[nextDefeat % MONSTERS.length];
      const nextMax = 40 + nextDefeat * 15;
      setMonsterName(nextName);
      setMonsterMaxHp(nextMax);
      setMonsterHp(nextMax);
      fetchNextQuiz();
    }, 1500);
  }, [defeatCount, monsterName, fetchNextQuiz]);

  const handleTimeout = useCallback(() => {
    playSE('wrong');
    setMessage('⏰ 時間切れ！ 敵の攻撃を受けた！');
    const damage = 15;
    setPlayerHp((prev) => {
      const next = prev - damage;
      if (next <= 0) handleGameOver();
      return Math.max(0, next);
    });
    setTimeout(() => fetchNextQuiz(), 1500);
  }, [handleGameOver, fetchNextQuiz]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      setApiKey(savedKey);
      setInputKey(savedKey);
      fetchNextQuiz(genre, difficulty, savedKey);
    }
  }, [fetchNextQuiz, genre, difficulty]);

  useEffect(() => {
    if (loading || selectedOption !== null) return;

    setTimeLeft(10);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, loading, selectedOption, handleTimeout]);

  const saveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', inputKey.trim());
    }
    setApiKey(inputKey.trim());
    setShowKeyModal(false);
    fetchNextQuiz(genre, difficulty, inputKey.trim());
  };

  const handleSelect = (index: number) => {
    if (selectedOption !== null || loading || !quiz) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(index);

    if (index === quiz.answerIndex) {
      playSE('correct');
      const damage = 20;
      setMessage(`✨ 正解！ 敵に ${damage} のダメージ！`);
      setCharge((prev) => Math.min(3, prev + 1));

      const nextMonsterHp = monsterHp - damage;
      if (nextMonsterHp <= 0) {
        handleDefeatMonster();
      } else {
        setMonsterHp(nextMonsterHp);
        setTimeout(() => fetchNextQuiz(), 1200);
      }
    } else {
      playSE('wrong');
      const damage = 15;
      setMessage(`💥 不正解... 敵からの反撃！ (${damage}ダメージ)`);
      setPlayerHp((prev) => {
        const next = prev - damage;
        if (next <= 0) handleGameOver();
        return Math.max(0, next);
      });
      setTimeout(() => fetchNextQuiz(), 1200);
    }
  };

  const handleUsePotion = () => {
    if (potions <= 0 || playerHp >= 100) return;
    playSE('heal');
    setPotions((prev) => prev - 1);
    setPlayerHp((prev) => Math.min(100, prev + 40));
    setMessage('🧪 ポーションを使った！ HPが40回復！');
  };

  const handleUltimate = () => {
    if (charge < 3 || loading) return;
    playSE('ultimate');
    setCharge(0);
    const damage = 50;
    setMessage(`⚡ 必殺アルティメットスラッシュ！ 50ダメージ！`);

    const nextMonsterHp = monsterHp - damage;
    if (nextMonsterHp <= 0) {
      handleDefeatMonster();
    } else {
      setMonsterHp(nextMonsterHp);
    }
  };

  const handleGenreChange = (gId: string) => {
    setGenre(gId);
    fetchNextQuiz(gId, difficulty);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#fff', padding: '16px', fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold', color: '#fbbf24' }}>
            ⚔️ クイズダンジョン Ultimate
          </h1>
          <button
            onClick={() => setShowKeyModal(true)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: apiKey ? '#059669' : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ⚙️ {apiKey ? 'AI連動中' : 'APIキー設定'}
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', textAlign: 'right' }}>
          撃破数: <strong style={{ color: '#fbbf24' }}>{defeatCount}</strong>
        </div>

        {showKeyModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
            <h3 style={{ fontSize: '16px', color: '#fbbf24', marginTop: 0 }}>🔑 Gemini APIキー設定</h3>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
              Google AI Studioで取得したGemini APIキーを入力すると、AIが無限に新問題を出題します。
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveApiKey} style={{ flex: 1, padding: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                保存してAI有効化
              </button>
              <button onClick={() => setShowKeyModal(false)} style={{ padding: '8px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                閉じる
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGenreChange(g.id)}
              style={{
                padding: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: genre === g.id ? '#f59e0b' : '#1e293b',
                color: genre === g.id ? '#000' : '#cbd5e1',
                cursor: 'pointer'
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          {['EASY', 'NORMAL', 'HARD'].map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); fetchNextQuiz(genre, d); }}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: difficulty === d ? '#0891b2' : 'transparent',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '40px' }}>🐲</div>
          <div style={{ fontWeight: 'bold', color: '#f87171', fontSize: '14px', marginBottom: '4px' }}>{monsterName}</div>
          <div style={{ width: '100%', backgroundColor: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ width: `${Math.max(0, (monsterHp / monsterMaxHp) * 100)}%`, backgroundColor: '#ef4444', height: '100%', transition: 'all 0.3s' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>HP: {Math.max(0, monsterHp)} / {monsterMaxHp}</div>
        </div>

        <div style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#34d399' }}>🛡️ 勇者</span>
            <span style={{ color: '#94a3b8' }}>HP: {playerHp} / 100</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: `${playerHp}%`, backgroundColor: '#10b981', height: '100%', transition: 'all 0.3s' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={handleUsePotion}
              disabled={potions <= 0 || playerHp >= 100}
              style={{
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: potions > 0 && playerHp < 100 ? '#059669' : '#334155',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              🧪 ポーション ({potions})
            </button>
            <button
              onClick={handleUltimate}
              disabled={charge < 3}
              style={{
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: charge >= 3 ? '#9333ea' : '#334155',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              ⚡ 必殺技 ({charge}/3)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#fde047', marginBottom: '8px', minHeight: '18px' }}>
          {message}
        </div>
        <div style={{ width: '100%', backgroundColor: '#334155', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ width: `${(timeLeft / 10) * 100}%`, backgroundColor: '#38bdf8', height: '100%', transition: 'all 1s linear' }} />
        </div>

        <div style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>🧙‍♂️ AIが問題を錬成中...</div>
          ) : (
            <>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', lineHeight: '1.4' }}>
                {quiz?.question}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {quiz?.options?.map((opt: string, idx: number) => {
                  let bgColor = '#1e293b';
                  if (selectedOption !== null) {
                    if (idx === quiz.answerIndex) bgColor = '#059669';
                    else if (idx === selectedOption) bgColor = '#dc2626';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={selectedOption !== null}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        backgroundColor: bgColor,
                        color: '#fff',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {idx + 1}. {opt}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
