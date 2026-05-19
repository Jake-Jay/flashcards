const STATS_KEY = 'flashcards:stats';
const FILTER_KEY = 'flashcards:topic';
const ALL = '__all__';

const els = {
  topic: document.getElementById('topic'),
  stats: document.getElementById('stats'),
  reset: document.getElementById('reset'),
  card: document.getElementById('card'),
  empty: document.getElementById('empty'),
  cardTopic: document.getElementById('card-topic'),
  cardCounts: document.getElementById('card-counts'),
  question: document.getElementById('question'),
  answer: document.getElementById('answer'),
  reveal: document.getElementById('reveal'),
  grade: document.getElementById('grade'),
  right: document.getElementById('right'),
  wrong: document.getElementById('wrong'),
  dontcare: document.getElementById('dontcare'),
};

let cards = [];
let current = null;

function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch { return {}; }
}

function setStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function statFor(id) {
  return getStats()[id] || { right: 0, wrong: 0, dontCare: false, lastSeen: 0 };
}

function recordReview(id, patch) {
  const stats = getStats();
  const prev = stats[id] || { right: 0, wrong: 0, dontCare: false, lastSeen: 0 };
  stats[id] = { ...prev, ...patch, lastSeen: Date.now() };
  setStats(stats);
}

function activeTopic() {
  return localStorage.getItem(FILTER_KEY) || ALL;
}

function setActiveTopic(t) {
  localStorage.setItem(FILTER_KEY, t);
}

function pool() {
  const t = activeTopic();
  const stats = getStats();
  return cards.filter(c => {
    if (t !== ALL && c.topic !== t) return false;
    const s = stats[c.id];
    if (s && s.dontCare) return false;
    return true;
  });
}

function pickNext() {
  let p = pool();
  if (p.length === 0) return null;
  if (p.length > 1 && current) {
    p = p.filter(c => c.id !== current.id);
  }
  const weights = p.map(c => {
    const s = statFor(c.id);
    return (s.wrong + 1) / (s.right + 1);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < p.length; i++) {
    r -= weights[i];
    if (r <= 0) return p[i];
  }
  return p[p.length - 1];
}

function renderTopics() {
  const topics = [...new Set(cards.map(c => c.topic))].sort();
  els.topic.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = ALL;
  optAll.textContent = `All (${cards.length})`;
  els.topic.appendChild(optAll);
  for (const t of topics) {
    const count = cards.filter(c => c.topic === t).length;
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = `${t} (${count})`;
    els.topic.appendChild(opt);
  }
  els.topic.value = activeTopic();
}

function renderStats() {
  const stats = getStats();
  const ids = Object.keys(stats);
  const seen = ids.filter(id => {
    const s = stats[id];
    return (s.right + s.wrong) > 0;
  }).length;
  const totalRight = ids.reduce((a, id) => a + (stats[id].right || 0), 0);
  const totalWrong = ids.reduce((a, id) => a + (stats[id].wrong || 0), 0);
  const totalReviews = totalRight + totalWrong;
  const acc = totalReviews ? Math.round((totalRight / totalReviews) * 100) : 0;
  const hidden = ids.filter(id => stats[id].dontCare).length;
  els.stats.textContent = `${seen}/${cards.length} seen · ${acc}% correct · ${hidden} hidden`;
}

function renderCard() {
  current = pickNext();
  if (!current) {
    els.card.hidden = true;
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;
  els.card.hidden = false;
  els.cardTopic.textContent = current.topic;
  const s = statFor(current.id);
  els.cardCounts.textContent = `right ${s.right} · wrong ${s.wrong}`;
  els.question.textContent = current.q;
  els.answer.textContent = current.a;
  els.answer.hidden = true;
  els.grade.hidden = true;
  els.reveal.hidden = false;
}

function reveal() {
  if (!current || !els.answer.hidden) return;
  els.answer.hidden = false;
  els.reveal.hidden = true;
  els.grade.hidden = false;
}

function grade(kind) {
  if (!current || els.answer.hidden) {
    if (kind === 'dontcare' && current) {
      // dont-care is allowed without revealing
    } else {
      return;
    }
  }
  if (kind === 'right') {
    const s = statFor(current.id);
    recordReview(current.id, { right: s.right + 1 });
  } else if (kind === 'wrong') {
    const s = statFor(current.id);
    recordReview(current.id, { wrong: s.wrong + 1 });
  } else if (kind === 'dontcare') {
    recordReview(current.id, { dontCare: true });
  }
  renderStats();
  renderCard();
}

function attachHandlers() {
  els.topic.addEventListener('change', () => {
    setActiveTopic(els.topic.value);
    current = null;
    renderCard();
  });
  els.reset.addEventListener('click', () => {
    if (confirm('Reset all stats? This clears right/wrong counts and un-hides every card.')) {
      localStorage.removeItem(STATS_KEY);
      renderStats();
      renderCard();
    }
  });
  els.reveal.addEventListener('click', reveal);
  els.right.addEventListener('click', () => grade('right'));
  els.wrong.addEventListener('click', () => grade('wrong'));
  els.dontcare.addEventListener('click', () => grade('dontcare'));

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (els.answer.hidden) reveal();
    } else if (e.key === '1') {
      if (!els.answer.hidden) grade('right');
    } else if (e.key === '2') {
      if (!els.answer.hidden) grade('wrong');
    } else if (e.key === '3') {
      grade('dontcare');
    }
  });
}

cards = window.CARDS || [];
renderTopics();
renderStats();
renderCard();
attachHandlers();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
