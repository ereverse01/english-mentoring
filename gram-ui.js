// ───────────────── 기초 문법 모드: 화면과 동작 (grammar.js 의 GRAM 사용) ─────────────────
let GQ = null;   // 퀴즈 진행 상태
function gState(id) { S.gram = S.gram || {}; return S.gram[id] || (S.gram[id] = { disc: {}, rule: false }); }
function gramSt() { return S && S.gram ? Object.values(S.gram).filter(g => g.st).length : 0; }
function gmark(s) {
  return esc(s).replace(/\(\((.+?)\)\)/g, '<span class="gc">$1</span>').replace(/\[(.+?)\]/g, '<span class="ga">$1</span>').replace(/\{(.+?)\}/g, '<span class="gb">$1</span>');
}
function gLesson() { return GRAM.find(l => l.id === V.gid); }
function discDone(l) { const g = (S.gram || {})[l.id]; return !!g && l.disc.every((_, i) => g.disc[i] != null); }
function gTouch() { S.gramUpd = Date.now(); saveLocal(); clearTimeout(gTouch.t); gTouch.t = setTimeout(pushGram, 1200); }
async function pushGram() {
  if (!SHEET_URL || !S) return;
  const day = today();
  const done = GRAM.filter(l => S.gram[l.id] && S.gram[l.id].st);
  const sc = done.map(l => S.gram[l.id].first).filter(x => x != null);
  try {
    setSync("wait");
    const r = await api({
      action: "save", sid: S.me.sid, name: S.me.name,
      p: {
        id: "gram", title: "🧩 기초 문법·문장구조", level: "기초", created: S.gramStart || day,
        steps: done.map(l => l.t).join(", "), st: done.length, tr: "",
        quiz: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length * 10) / 10 : "", test: "",
        data: JSON.stringify({ id: "gram", gram: S.gram, updated: S.gramUpd, start: S.gramStart }),
      },
      att: S.att[day] ? { date: day, n: S.att[day].n, st: S.att[day].st } : null,
    });
    setSync(r.ok ? "ok" : "err");
  } catch (e) { setSync("err"); }
}
// 시트에서 불러온 기초 문법 기록 합치기 (pull 에서 호출)
function mergeGram(o) {
  if (!o || !o.gram) return false;
  if ((S.gramUpd || 0) >= (o.updated || 0)) return false;
  S.gram = o.gram; S.gramUpd = o.updated; S.gramStart = o.start || S.gramStart;
  return true;
}

function viewMode() {
  const b = gramSt(), n = S.passages.length;
  return `<div class="card" style="text-align:center;margin-top:26px"><h2>${esc(S.me.name)}, 오늘은 어떤 공부를 할까요?</h2>
    <div class="muted">공부하다가도 위의 <b>🔀 공부 바꾸기</b>로 언제든 바꿀 수 있어요.</div></div>
  <div class="modes">
    <button class="mode" onclick="pickMode('basic')"><div class="mi">🧩</div><div class="mt">1. 기초 문법 · 문장 구조 연습</div>
      <div class="md">영어가 아직 어렵다면 여기부터!<br>독해에 자주 나오는 문장 구조를 <b>예문을 보며 스스로 발견</b>하고, <b>새로운 문장 퀴즈</b>로 복습해요.</div>
      <div class="mp">스티커 ${b} / ${GRAM.length}</div></button>
    <button class="mode" onclick="pickMode('read')"><div class="mi">📖</div><div class="mt">2. 독해 문제 풀이</div>
      <div class="md">내 수준에 맞는 지문으로<br>번역 → 수능형 문제 → 주제·구조 → 단어장·단어 시험까지.</div>
      <div class="mp">내 지문 ${n}개</div></button>
  </div>`;
}
function pickMode(m) { V.mode = m; V.tab = m === "basic" ? "gram" : "home"; V.pid = null; V.gid = null; GQ = null; T = null; render(); window.scrollTo(0, 0); }

function viewGramList() {
  const done = gramSt();
  const cards = GRAM.map((l, i) => {
    const g = (S.gram || {})[l.id] || {};
    const started = g.disc && Object.keys(g.disc).length;
    return `<div class="pcard" onclick="openG('${l.id}')">
      <div class="row" style="justify-content:space-between"><span class="badge">${i + 1}과</span>${g.first != null ? `<span class="muted">첫 도전 ${g.first}/${l.quiz.length}</span>` : started ? '<span class="muted">공부 중</span>' : ""}</div>
      <div class="t" style="margin-top:6px">${l.i} ${esc(l.t)}</div><div class="muted">${esc(l.sub)}</div>
      <div class="slots"><div class="slot ${discDone(l) ? "got" : ""}" title="예문 관찰">${discDone(l) ? "👀" : ""}</div><div class="slot ${g.rule ? "got" : ""}" title="규칙 정리">${g.rule ? "💡" : ""}</div><div class="slot ${g.st ? "got" : ""}" title="확인 퀴즈">${g.st || ""}</div></div></div>`;
  }).join("");
  return `<div class="card"><h2>🧩 기초 문법 · 문장 구조 연습</h2>
    <div class="muted">각 과마다 <b>① 예문 관찰</b>(색깔을 보고 규칙 찾기) → <b>② 규칙 정리</b> → <b>③ 확인 퀴즈</b>(처음 보는 문장)로 공부해요. 퀴즈를 다 맞히면 스티커!</div>
    <div style="margin-top:12px"><div class="row" style="justify-content:space-between"><span class="muted">모은 스티커</span><span class="muted">${done}/${GRAM.length}</span></div><div class="bar"><i style="width:${done / GRAM.length * 100}%"></i></div></div></div>
  <div class="plist">${cards}</div>`;
}
function openG(id) { V.gid = id; GQ = null; const g = (S.gram || {})[id] || {}; V.gstage = g.st ? "rule" : g.rule ? "quiz" : "obs"; V.dWrong = {}; V.showKo = {}; render(); window.scrollTo(0, 0); }

function viewGram() {
  const l = gLesson(); if (!l) { V.gid = null; return viewGramList(); }
  const g = gState(l.id), idx = GRAM.indexOf(l);
  const st = [["obs", "👀 1. 예문 관찰", discDone(l)], ["rule", "💡 2. 규칙 정리", g.rule], ["quiz", (g.st || "✏️") + " 3. 확인 퀴즈", !!g.st]];
  const lockR = !discDone(l), lockQ = !g.rule;
  const tabs = st.map(([k, n, d]) => `<button class="stepb ${V.gstage === k ? "on" : ""} ${d ? "done" : ""} ${(k === "rule" && lockR) || (k === "quiz" && lockQ) ? "lock" : ""}" onclick="gStage('${k}')">${n}</button>`).join("");
  const body = V.gstage === "rule" ? gRule(l) : V.gstage === "quiz" ? gQuiz(l) : gObs(l);
  const nx = GRAM[idx + 1];
  return `<div class="row" style="margin-top:14px;justify-content:space-between"><button class="ghost small" onclick="V.gid=null;GQ=null;render()">← 목차</button>
      ${nx ? `<button class="ghost small" onclick="openG('${nx.id}')">다음 과: ${esc(nx.t)} →</button>` : ""}</div>
    <div class="card" style="padding:14px 18px"><div class="row"><span class="badge">${idx + 1}과</span><span class="muted">${esc(l.sub)}</span></div>
      <h2 style="margin:6px 0 8px">${l.i} ${esc(l.t)}</h2><div class="hint-box" style="margin-bottom:10px">💭 ${esc(l.why)}</div><div class="steps">${tabs}</div></div>${body}`;
}
function gStage(k) {
  const l = gLesson(), g = gState(l.id);
  if (k === "rule" && !discDone(l)) return toast("먼저 예문 관찰 질문에 답해 보세요");
  if (k === "quiz" && !g.rule) return toast("규칙 정리를 먼저 봐요");
  V.gstage = k; GQ = null; render(); window.scrollTo(0, 0);
}
function exList(l, withKo) {
  return l.ex.map((e, i) => `<div class="sbox"><div class="en">${gmark(e.en)}</div>
    ${withKo || V.showKo[i] ? `<div class="muted" style="margin-top:4px;font-size:15px">${esc(e.ko)}</div>` : `<button class="ghost small" style="margin-top:6px" onclick="V.showKo[${i}]=1;render()">해석 보기</button>`}</div>`).join("");
}
function gObs(l) {
  const g = gState(l.id);
  const used = ["ga", "gb", "gc"].filter((c, i) => l.ex.some(e => [/\[.+?\]/, /\{.+?\}/, /\(\(.+?\)\)/][i].test(e.en)));
  const names = { ga: "노란색", gb: "파란색", gc: "분홍색" };
  const qs = l.disc.map((d, qi) => {
    const got = g.disc[qi] != null, wr = V.dWrong[qi] || [];
    return `<div class="q"><div class="qt">Q${qi + 1}. ${esc(d.q)}</div>
      ${d.ch.map((c, ci) => `<button class="choice ${got && ci === d.a ? "right" : ""} ${!got && wr.includes(ci) ? "wrong" : ""}" style="font-family:inherit" ${got ? "disabled" : ""} onclick="discPick(${qi},${ci})">${esc(c)}</button>`).join("")}
      ${got ? `<div class="explain">⭕ ${esc(d.fb)}</div>` : wr.length ? `<div class="explain">🤔 예문의 색깔 부분을 다시 살펴보고 골라 봐요.</div>` : ""}</div>`;
  }).join("");
  return `<div class="card"><h3>👀 예문을 읽고 색깔 부분을 잘 보세요</h3>
    <div class="muted">해석은 먼저 스스로 생각해 본 뒤에 눌러서 확인해요.</div>
    <div class="row" style="margin:8px 0">${used.map(c => `<span class="${c}">${names[c]}</span>`).join("")}<span class="muted">← 색깔마다 역할이 달라요</span></div>
    ${exList(l, false)}</div>
  <div class="card"><h3>🔍 규칙을 찾아봐요</h3>${qs}
    ${discDone(l) ? `<div style="text-align:center;margin-top:10px"><button style="font-size:18px;padding:12px 24px" onclick="gStage('rule')">💡 규칙 정리 보기 ➡️</button></div>` : ""}</div>`;
}
function discPick(qi, ci) {
  const l = gLesson(), g = gState(l.id), d = l.disc[qi];
  if (ci === d.a) { g.disc[qi] = ci; if (!S.gramStart) S.gramStart = today(); if (discDone(l)) markAtt(false); gTouch(); }
  else { (V.dWrong[qi] = V.dWrong[qi] || []).push(ci); }
  render();
}
function gRule(l) {
  const g = gState(l.id);
  if (!g.rule) { g.rule = true; gTouch(); }
  return `<div class="card" style="border:2px solid #f2d36b;background:#fffdf3"><h3>💡 발견한 규칙</h3>
    <ul class="rules">${l.rule.map(r => `<li>${r}</li>`).join("")}</ul>
    <div class="model">📌 <b>독해 요령</b> ${esc(l.tip)}</div></div>
  <div class="card"><h3>📝 예문 다시 보기</h3>${exList(l, true)}</div>
  <div class="card" style="text-align:center"><div class="muted">이제 처음 보는 문장으로 확인해 볼까요?</div>
    <button style="margin-top:10px;font-size:18px;padding:12px 24px" onclick="gStage('quiz')">✏️ 확인 퀴즈 풀기 ➡️</button></div>`;
}

// ── 퀴즈
function tapWords(s) {
  const out = []; let inside = false, cur = "", hit = false;
  const flush = () => { if (cur) out.push({ w: cur, a: hit }); cur = ""; hit = false; };
  for (const ch of s) {
    if (ch === "|") { inside = !inside; continue; }
    if (ch === " ") { flush(); continue; }
    cur += ch; if (inside) hit = true;
  }
  flush(); return out;
}
function startGQ(only) {
  const l = gLesson();
  const prev = GQ;
  GQ = { id: l.id, items: only || shuffle(l.quiz.map((_, i) => i)), i: 0, wrong: [], wlog: [], right: 0,
    round: only && prev ? prev.round + 1 : 1, first: only && prev ? prev.first : null };
  gPrep(); render(); window.scrollTo(0, 0);
}
function gPrep() {
  const q = gLesson().quiz[GQ.items[GQ.i]];
  GQ.pick = q.k === "mc" ? null : [];
  if (q.k === "order") { let sh; do { sh = shuffle(q.ch.map((_, i) => i)); } while (q.ch.length > 1 && sh.every((x, i) => x === i)); GQ.pool = sh; }
  GQ.checked = false; GQ.ok = false;
}
function gQuiz(l) {
  const g = gState(l.id);
  if (!GQ || GQ.id !== l.id) {
    return `<div class="card" style="text-align:center"><h3>✏️ 확인 퀴즈 (${l.quiz.length}문제)</h3>
      <div class="muted">예문과 <b>다른 새 문장</b>으로 나와요. 틀린 문제는 다 맞힐 때까지 다시 풀어요.</div>
      ${g.st ? `<div class="fb ok" style="margin-top:12px">${g.st} 이미 통과했어요! 첫 도전 점수 ${g.first}/${l.quiz.length}</div>` : ""}
      <button style="margin-top:12px;font-size:18px;padding:12px 24px" onclick="startGQ()">${g.st ? "🔁 다시 풀어 보기" : "▶ 퀴즈 시작"}</button></div>`;
  }
  if (GQ.i >= GQ.items.length) return gRoundEnd(l);
  const q = l.quiz[GQ.items[GQ.i]];
  let box = "";
  if (q.k === "mc") {
    box = (q.s ? `<div class="qtext">${gmark(q.s)}</div>` : "") + q.ch.map((c, ci) => {
      const cls = GQ.checked ? (ci === q.a ? "right" : ci === GQ.pick ? "wrong" : "") : ci === GQ.pick ? "on" : "";
      return `<button class="choice ${cls}" ${GQ.checked ? "disabled" : ""} onclick="GQ.pick=${ci};render()">${NUMS[ci]} ${esc(c)}</button>`;
    }).join("");
  } else if (q.k === "tap") {
    const ws = tapWords(q.s);
    box = `<div class="qtext tapbox">${ws.map((w, wi) => {
      const on = GQ.pick.includes(wi);
      const cls = GQ.checked ? (w.a ? "tw right" : on ? "tw wrong" : "tw") : on ? "tw on" : "tw";
      return `<span class="${cls}" onclick="gTap(${wi})">${esc(w.w)}</span>`;
    }).join(" ")}</div>${GQ.checked ? "" : '<div class="muted">단어를 눌러 고르고, 다시 누르면 취소돼요.</div>'}`;
  } else {
    const ans = GQ.pick.map(ci => `<button class="chunk on" ${GQ.checked ? "disabled" : ""} onclick="gUnorder(${ci})">${esc(q.ch[ci])}</button>`).join("");
    const pool = GQ.pool.filter(ci => !GQ.pick.includes(ci)).map(ci => `<button class="chunk" onclick="gOrder(${ci})">${esc(q.ch[ci])}</button>`).join("");
    box = `<div class="hint-box" style="font-size:16px">💬 ${esc(q.ko)}</div>
      <div class="orderline ${GQ.checked ? (GQ.ok ? "ok" : "no") : ""}">${ans || '<span class="muted">아래 덩어리를 순서대로 눌러요</span>'}</div>
      <div class="chunks">${pool}</div>
      ${GQ.checked && !GQ.ok ? `<div class="explain">정답: <b class="en" style="font-size:17px">${esc(q.ch.join(" "))}</b></div>` : ""}`;
  }
  const can = q.k === "mc" ? GQ.pick != null : q.k === "tap" ? GQ.pick.length > 0 : GQ.pick.length === q.ch.length;
  const ansTap = q.k === "tap" ? tapWords(q.s).filter(w => w.a).map(w => `<b>${esc(w.w)}</b>`).join(" ") : "";
  const fb = GQ.checked ? `<div class="fb ${GQ.ok ? "ok" : "no"}">${GQ.ok ? "⭕ 정답!" : "❌ 아쉬워요"}</div>${q.ex ? `<div class="explain">${esc(q.ex)}</div>` : ansTap && !GQ.ok ? `<div class="explain">정답: ${ansTap}</div>` : ""}` : "";
  return `<div class="card"><div class="row" style="justify-content:space-between"><b>${GQ.round > 1 ? "🔁 틀린 문제 다시 · " : ""}${GQ.i + 1} / ${GQ.items.length}</b><span class="muted">${{ mc: "고르기", tap: "단어 누르기", order: "순서 맞추기" }[q.k]}</span></div>
    <div class="bar" style="margin:8px 0 12px"><i style="width:${GQ.i / GQ.items.length * 100}%"></i></div>
    <div class="q" style="margin:0"><div class="qt">${esc(q.q)}</div>${box}${fb}</div>
    <div style="text-align:center;margin-top:12px">${GQ.checked ? `<button id="nextB" style="font-size:18px;padding:12px 28px" onclick="gNext()">다음 ➡️</button>` : `<button style="font-size:18px;padding:12px 28px" ${can ? "" : "disabled"} onclick="gCheck()">확인</button>`}</div></div>`;
}
function gTap(wi) { if (GQ.checked) return; const a = GQ.pick, k = a.indexOf(wi); if (k >= 0) a.splice(k, 1); else a.push(wi); render(); }
function gOrder(ci) { if (GQ.checked) return; GQ.pick.push(ci); render(); }
function gUnorder(ci) { if (GQ.checked) return; GQ.pick = GQ.pick.filter(x => x !== ci); render(); }
function gCheck() {
  const q = gLesson().quiz[GQ.items[GQ.i]];
  if (q.k === "mc") GQ.ok = GQ.pick === q.a;
  else if (q.k === "tap") { const ans = tapWords(q.s).map((w, i) => w.a ? i : -1).filter(i => i >= 0); GQ.ok = ans.length === GQ.pick.length && ans.every(i => GQ.pick.includes(i)); }
  else GQ.ok = GQ.pick.map(ci => q.ch[ci]).join(" ") === q.ch.join(" ");
  GQ.checked = true;
  if (GQ.ok) GQ.right++;
  else { GQ.wrong.push(GQ.items[GQ.i]); GQ.wlog.push({ q: GQ.items[GQ.i], a: gPicked(q).slice(0, 200) }); }
  render();
}
function gNext() { GQ.i++; if (GQ.i < GQ.items.length) gPrep(); else gFinishRound(); render(); window.scrollTo(0, 0); }
function gFinishRound() {
  const l = gLesson(), g = gState(l.id);
  if (GQ.round === 1) {
    GQ.first = GQ.right; g.tries = (g.tries || 0) + 1;
    if (!g.st) g.first = GQ.right;
    g.best = Math.max(g.best || 0, GQ.right);
  }
  (g.log = g.log || []).push({ d: today(), r: GQ.round, ok: GQ.right, n: GQ.items.length, w: GQ.wlog });
  if (g.log.length > 30) g.log = g.log.slice(-30);
  markAtt(false);
  if (!GQ.wrong.length && !g.st) {
    g.st = STICKERS[Math.floor(Math.random() * STICKERS.length)]; g.date = today();
    S.att[today()].st++;
    const all = gramSt() === GRAM.length;
    setTimeout(() => popSticker(all ? "🏆" : g.st, all ? "기초 문법 전체 완주! 대단해요" : l.t + " 통과! 스티커 획득"), 150);
  }
  gTouch();
  pushLesson(l);
}
function gRoundEnd(l) {
  const nx = GRAM[GRAM.indexOf(l) + 1];
  if (GQ.wrong.length) return `<div class="card" style="text-align:center"><h3>${GQ.round === 1 ? `첫 도전: ${GQ.right} / ${GQ.items.length}` : `${GQ.right} / ${GQ.items.length} 맞혔어요`}</h3>
    <div class="muted">틀린 ${GQ.wrong.length}문제를 다시 풀어서 다 맞히면 ${gState(l.id).st ? "통과예요" : "스티커를 받아요"}!</div>
    <div class="row" style="justify-content:center;margin-top:12px"><button onclick="startGQ(GQ.wrong.slice())">🔁 틀린 문제 다시 풀기</button><button class="ghost" onclick="V.gstage='rule';GQ=null;render();window.scrollTo(0,0)">💡 규칙 다시 보기</button></div></div>`;
  const g = gState(l.id);
  return `<div class="card" style="text-align:center"><div style="font-size:60px">${g.st}</div><h3>다 맞혔어요! (첫 도전 ${GQ.first} / ${l.quiz.length})</h3>
    <div class="row" style="justify-content:center;margin-top:12px">${nx ? `<button style="font-size:18px;padding:12px 24px" onclick="openG('${nx.id}')">다음 과 ➡️ ${esc(nx.t)}</button>` : ""}
      <button class="ghost" onclick="V.gid=null;GQ=null;render()">📋 목차로</button></div></div>`;
}

// ── 퀴즈 답 기록 (선생님이 볼 수 있게: 시트에 과마다 한 줄 "g-과id")
function gPicked(q) {
  if (q.k === "mc") return q.ch[GQ.pick] || "";
  if (q.k === "tap") { const ws = tapWords(q.s); return GQ.pick.slice().sort((a, b) => a - b).map(i => ws[i].w).join(" "); }
  return GQ.pick.map(ci => q.ch[ci]).join(" ");
}
function gRight(q) {
  if (q.k === "mc") return q.ch[q.a];
  if (q.k === "tap") return tapWords(q.s).filter(w => w.a).map(w => w.w).join(" ");
  return q.ch.join(" ");
}
function gPlain(q) { return q.s ? q.s.replace(/\|/g, "").replace(/\(\((.+?)\)\)/g, "$1").replace(/[\[\]{}]/g, "") : q.ko ? "뜻: " + q.ko : ""; }
// 기록 한 줄: "11/06 첫 풀이 5/6 ‖ Q3: 낸 답 ‖ Q5: 낸 답"
function logLine(e) { return `${e.d.slice(5).replace("-", "/")} ${e.r === 1 ? "첫 풀이" : "다시 풀기"} ${e.ok}/${e.n}` + e.w.map(x => ` ‖ Q${x.q + 1}: ${String(x.a).replace(/‖/g, "|")}`).join(""); }
function parseLog(txt) {
  return String(txt || "").split("\n").map(line => {
    const m = line.match(/^(\S+) (첫 풀이|다시 풀기) (\d+)\/(\d+)/); if (!m) return null;
    const w = line.split(" ‖ ").slice(1).map(x => { const k = x.match(/^Q(\d+): ([\s\S]*)$/); return k ? { q: +k[1] - 1, a: k[2] } : null; }).filter(Boolean);
    return { d: m[1], first: m[2] === "첫 풀이", ok: +m[3], n: +m[4], w };
  }).filter(Boolean);
}
async function pushLesson(l) {
  if (!SHEET_URL || !S) return;
  const g = S.gram[l.id]; if (!g || !g.log) return;
  const day = today();
  try {
    await api({
      action: "save", sid: S.me.sid, name: S.me.name,
      p: {
        id: "g-" + l.id, title: `🧩 ${GRAM.indexOf(l) + 1}과 ${l.t}`, level: "기초", created: g.log[0].d,
        steps: g.log.slice(-20).map(logLine).join("\n"), st: g.st ? 1 : 0, tr: "", quiz: g.first == null ? "" : g.first, test: "", data: "",
      },
      att: S.att[day] ? { date: day, n: S.att[day].n, st: S.att[day].st } : null,
    });
  } catch (e) {}
}

// ── 선생님 화면: 학생별 퀴즈 기록 + 자주 틀린 문항
function tGramStudent(s) {
  const ls = GRAM.filter(l => s.gl && s.gl[l.id]);
  if (!ls.length) return "";
  return `<div style="text-align:left;padding:4px 4px 12px">${ls.map(l => {
    const r = s.gl[l.id], log = parseLog(r.steps);
    return `<details class="glog"><summary><b>${GRAM.indexOf(l) + 1}과 ${esc(l.t)}</b> ${+r.st ? "✅ 통과" : "⏳ 아직"} · 첫 풀이 ${esc(r.quiz)}/${l.quiz.length} · 틀린 답 ${log.reduce((n, e) => n + e.w.length, 0)}개</summary>
      ${log.map(e => `<div class="glrow"><span class="muted">${esc(e.d)} ${e.first ? "첫 풀이" : "다시 풀기"} ${e.ok}/${e.n}</span>${e.w.length ? e.w.map(x => {
        const q = l.quiz[x.q]; if (!q) return "";
        return `<div class="glw"><div>Q${x.q + 1}. ${esc(q.q)} <span class="en" style="font-size:15px">${esc(gPlain(q))}</span></div>
          <div>❌ 낸 답: <b style="color:var(--bad)">${esc(x.a)}</b> → ⭕ 정답: <b style="color:var(--ok)">${esc(gRight(q))}</b></div></div>`;
      }).join("") : ' <span style="color:var(--ok)">모두 맞힘</span>'}</div>`).join("")}</details>`;
  }).join("")}</div>`;
}
function tGramWrong(studs) {
  const cnt = {};
  studs.forEach(s => Object.entries(s.gl || {}).forEach(([lid, r]) => {
    const l = GRAM.find(x => x.id === lid); if (!l) return;
    parseLog(r.steps).filter(e => e.first).forEach(e => e.w.forEach(x => {
      const k = lid + ":" + x.q, c = cnt[k] || (cnt[k] = { l, q: x.q, who: [], ans: {} });
      if (!c.who.includes(s.name)) c.who.push(s.name);
      c.ans[x.a] = (c.ans[x.a] || 0) + 1;
    }));
  }));
  const top = Object.values(cnt).sort((a, b) => b.who.length - a.who.length).slice(0, TD.gAll ? 100 : 8);
  if (!top.length) return "";
  return `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">🧩 기초 문법 자주 틀린 문항</h2>
    <button class="ghost small" onclick="TD.gAll=!TD.gAll;teacherView()">${TD.gAll ? "8개만 보기" : "모두 보기"}</button></div>
    <div class="muted" style="margin:4px 0 6px">첫 풀이 기준 · 학생 줄을 누르면 학생별로 낸 답을 모두 볼 수 있어요.</div>
    ${top.map(c => { const q = c.l.quiz[c.q]; return q ? `<div class="sbox" style="background:#fff"><div class="muted">${GRAM.indexOf(c.l) + 1}과 ${esc(c.l.t)} · Q${c.q + 1} · <b style="color:var(--bad)">${c.who.length}명</b> 틀림</div>
      <div><b>${esc(q.q)}</b> <span class="en" style="font-size:15px">${esc(gPlain(q))}</span></div>
      <div style="font-size:14px">⭕ 정답: <b style="color:var(--ok)">${esc(gRight(q))}</b> · 낸 오답: ${Object.entries(c.ans).sort((a, b) => b[1] - a[1]).map(([a, n]) => `<b style="color:var(--bad)">${esc(a)}</b>${n > 1 ? `(${n})` : ""}`).join(", ")}</div>
      <div class="muted">${c.who.map(esc).join(", ")}</div></div>` : ""; }).join("")}</div>`;
}
