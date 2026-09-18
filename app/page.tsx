'use client';

import React, { useState, useEffect, useRef } from 'react';

// Stripe決済リンクのURL（取得したURLに書き換えてください）
const STRIPE_URL = "https://buy.stripe.com/your_stripe_link_id";

// 8bit効果音プレイヤー (Web Audio API)
const playSE = (type: 'correct' | 'wrong' | 'heal' | 'ultimate') => {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(130, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'heal') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'ultimate') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
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
  const [highScore, setHighScore] = useState(0);

  // ステータス
  const [playerHp, setPlayerHp] = useState(100);
  const [monsterHp, setMonsterHp] = useState(40);
  const [monsterMaxHp, setMonsterMaxHp] = useState(40);
  const [monsterName, setMonsterName] = useState('スライムドラゴン');
  const [potions, setPotions] = useState(2);
  const [charge, setCharge] = useState(0); // 必殺技ゲージ (0〜3)

  // クイズ状態
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);

  // 買い切り判定
  const [isPaid, setIsPaid] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // タイマー用
  const timerRef = useRef<any>(null);

  // 初期化・Stripeリダイレクト検知
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('paid') === 'true') {
      localStorage.setItem('quiz_dungeon_paid', 'true');
      setIsPaid(true);
    } else {
      const paid = localStorage.getItem('quiz_dungeon_paid') === 'true';
      setIsPaid(paid);
    }
    fetchNextQuiz(genre, difficulty);
  }, []);

  // タイマー管理
  useEffect(() => {
    if (loading || selectedOption !== null || showBuyModal) return;

    setTimeLeft(10);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [quiz, loading, selectedOption, showBuyModal]);

  // 新しい問題を取得
  const fetchNextQuiz = async (g = genre, d = difficulty) => {
    setLoading(true);
    setSelectedOption(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: g, difficulty: d }),
      });
      const data = await res.json();
      setQuiz(data);
      setMessage(`${data.question ? '問題が出題された！' : '敵が現れた！'}`);
    } catch (e) {
      console.error(e);
      setMessage('クイズの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 時間切れ時の処理
  const handleTimeout = () => {
    playSE('wrong');
    setMessage('⏰ 時間切れ！ 敵の攻撃を受けた！ (15ダメージ)');
    const damage = 15;
    setPlayerHp((prev) => {
      const next = prev - damage;
      if (next <= 0) handleGameOver();
      return Math.max(0, next);
    });
    setTimeout(() => fetchNextQuiz(), 1800);
  };

  // 解答選択
  const handleSelect = (index: number) => {
    if (selectedOption !== null || loading) return;
    clearInterval(timerRef.current);
    setSelectedOption(index);

    if (index === quiz.answerIndex) {
      // 正解
      playSE('correct');
      const damage = 20;
      setMessage(`✨ 正解！ 敵に ${damage} のダメージ！`);
      setCharge((prev) => Math.min(3, prev + 1));

      const nextMonsterHp = monsterHp - damage;
      if (nextMonsterHp <= 0) {
        // 敵撃破
        handleDefeatMonster();
      } else {
        setMonsterHp(nextMonsterHp);
        setTimeout(() => fetchNextQuiz(), 1500);
      }
    } else {
      // 不正解
      playSE('wrong');
      const damage = 15;
      setMessage(`💥 不正解... 敵からの反撃！ (${damage}ダメージ)`);
      setPlayerHp((prev) => {
        const next = prev - damage;
        if (next <= 0) handleGameOver();
        return Math.max(0, next);
      });
      setTimeout(() => fetchNextQuiz(), 1500);
    }
  };

  // モンスター撃破処理
  const handleDefeatMonster = () => {
    const nextDefeat = defeatCount + 1;
    setDefeatCount(nextDefeat);
    if (nextDefeat > highScore) setHighScore(nextDefeat);

    // 無料版のお試し制限（1撃破でロック表示）
    if (!isPaid && nextDefeat >= 1) {
      setShowBuyModal(true);
      return;
    }

    setMessage(`🎉 ${monsterName} を倒した！ 次の敵が現れる...`);
    setTimeout(() => {
      const nextName = MONSTERS[nextDefeat % MONSTERS.length];
      const nextMax = 40 + nextDefeat * 15;
      setMonsterName(nextName);
      setMonsterMaxHp(nextMax);
      setMonsterHp(nextMax);
      fetchNextQuiz();
    }, 1800);
  };

  // ゲームオーバー
  const handleGameOver = () => {
    setMessage('☠️ 勇者は倒れてしまった... ゲームオーバー');
    setTimeout(() => {
      alert(`ゲームオーバー！ 撃破数: ${defeatCount}`);
      setPlayerHp(100);
      setDefeatCount(0);
      setMonsterHp(40);
      setMonsterMaxHp(40);
      setCharge(0);
      setPotions(2);
      fetchNextQuiz();
    }, 1000);
  };

  // ポーション使用
  const handleUsePotion = () => {
    if (potions <= 0 || playerHp >= 100) return;
    playSE('heal');
    setPotions((prev) => prev - 1);
    setPlayerHp((prev) => Math.min(100, prev + 40));
    setMessage('🧪 ポーションを使った！ HPが40回復！');
  };

  // 必殺技発動
  const handleUltimate = () => {
    if (charge < 3 || loading) return;
    playSE('ultimate');
    setCharge(0);
    const damage = 50;
    setMessage(`⚡ 必殺アルティメットスラッシュ！ 敵に ${damage} の大ダメージ！`);

    const nextMonsterHp = monsterHp - damage;
    if (nextMonsterHp <= 0) {
      handleDefeatMonster();
    } else {
      setMonsterHp(nextMonsterHp);
    }
  };

  // ジャンル変更
  const handleGenreChange = (gId: string) => {
    setGenre(gId);
    fetchNextQuiz(gId, difficulty);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        
        {/* ヘッダー / タイトル */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            ⚔️ クイズダンジョン Ultimate
          </h1>
          <div className="text-xs text-slate-400">
            撃破数: <span className="text-yellow-400 font-bold">{defeatCount}</span> (最高:{highScore})
          </div>
        </div>

        {/* ジャンル選択タブ */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGenreChange(g.id)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                genre === g.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 難易度選択 */}
        <div className="flex justify-center gap-2 mb-4">
          {['EASY', 'NORMAL', 'HARD'].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                fetchNextQuiz(genre, d);
              }}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                difficulty === d
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* モンスターエリア */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center mb-4 relative">
          <div className="text-5xl mb-2 animate-bounce">🐲</div>
          <div className="font-bold text-red-400 mb-1">{monsterName}</div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-1">
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${Math.max(0, (monsterHp / monsterMaxHp) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400">
            HP: {Math.max(0, monsterHp)} / {monsterMaxHp}
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-emerald-400">🛡️ 勇者 (あなた)</span>
            <span className="text-slate-400">HP: {playerHp} / 100</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-3">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${playerHp}%` }}
            />
          </div>

          {/* コマンドボタン (ポーション & 必殺技) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleUsePotion}
              disabled={potions <= 0 || playerHp >= 100}
              className="bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-600/50 text-emerald-300 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition"
            >
              🧪 ポーション ({potions})
            </button>
            <button
              onClick={handleUltimate}
              disabled={charge < 3}
              className="bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/50 text-purple-300 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition"
            >
              ⚡ 必殺技 ({charge}/3)
            </button>
          </div>
        </div>

        {/* メッセージ ＆ タイマー */}
        <div className="text-center text-xs text-amber-300 mb-3 h-5 font-medium">
          {message}
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-cyan-400 h-full transition-all duration-1000"
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>

        {/* クイズ問題カード */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500 animate-pulse text-sm">
              🧙‍♂️ AIが試練（問題）を召喚中...
            </div>
          ) : (
            <>
              <div className="font-semibold text-sm mb-4 text-slate-200 min-h-[48px]">
                {quiz?.question}
              </div>

              <div className="space-y-2">
                {quiz?.options.map((opt: string, idx: number) => {
                  let btnColor = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';
                  if (selectedOption !== null) {
                    if (idx === quiz.answerIndex) btnColor = 'bg-emerald-600 border-emerald-500 text-white';
                    else if (idx === selectedOption) btnColor = 'bg-rose-600 border-rose-500 text-white';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={selectedOption !== null}
                      className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${btnColor}`}
                    >
                      {idx + 1}. {opt}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 1200円 買い切り購入ロックモーダル */}
        {showBuyModal && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-3">👑</div>
            <h2 className="text-lg font-bold text-yellow-400 mb-2">無料お試しプレイ終了！</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              1,200円（買い切り）で全てのジャンル（英語・歴史・漢字・雑学・IT・算数）が無制限プレイ可能になります！
            </p>
            <a
              href={STRIPE_URL}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 transition block text-sm"
            >
              全機能解放（1,200円）
            </a>
            <button
              onClick={() => {
                setShowBuyModal(false);
                setDefeatCount(0);
                setMonsterHp(40);
              }}
              className="mt-4 text-xs text-slate-500 underline"
            >
              最初からもう一度お試し
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
