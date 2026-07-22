/* ESBALL 世界杯问卷 — 向导式引擎（支持跳题/落地页，简体） */
(function () {
  "use strict";
  var CFG = window.APP_CONFIG || {};
  var SURVEY = window.SURVEY || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var params = new URLSearchParams(location.search);
  var role = (params.get("role") || window.FORCE_ROLE || "").toLowerCase().trim();
  var refFrom = (params.get("ref") || "").trim();
  var roles = ["member", "newbie"];

  var S = null, curId = null, history = [], answers = {}, memberShareUrl = "";

  $("#eyebrow").textContent = CFG.brandEyebrow || "ESBALL · 世界杯问卷";

  if (roles.indexOf(role) === -1) { renderPicker(); }
  else {
    S = SURVEY[role];
    $("#title").textContent = role === "member" ? "🎁 隐藏问卷活动" : "新人问卷";
    $("#intro").textContent = S.intro || "";
    // 封面：全屏置中 +「立即参与」按钮，点了才开始填
    $("#hero").classList.add("is-cover");
    if (S.bonus) {
      var bd = document.createElement("div");
      bd.className = "hero__bonus"; bd.textContent = S.bonus;
      var inner = $(".hero__inner"); inner.insertBefore(bd, $("#startWrap"));
    }
    $("#startWrap").hidden = false;
    $("#wizard").hidden = true;
    $("#startBtn").addEventListener("click", startSurvey);
  }

  function startSurvey() {
    $("#hero").classList.remove("is-cover");
    $("#hero").classList.add("is-collapsed");
    $("#startWrap").hidden = true;
    $("#wizard").hidden = false;
    if (role === "newbie" && refFrom) showRefBanner();
    curId = S.start; history = [];
    renderQuestion();
  }

  /* ---------- 版本选择 ---------- */
  function renderPicker() {
    $("#title").textContent = "ESBALL 世界杯问卷";
    $("#intro").textContent = "请选择要预览的问卷版本（正式使用时各有专属链接）。";
    var grid = $("#pickerGrid");
    [["member", "会员问卷", "既有会员填写，完成可抽奖并邀请好友"],
     ["newbie", "新人问卷", "被推荐的新朋友填写，完成后可注册领奖"]].forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pcard";
      b.innerHTML = '<span class="pcard__tag">' + (r[0] === "member" ? "会员" : "新人") + '</span>' +
        '<span><span class="pcard__t">' + r[1] + '</span><span class="pcard__d">' + r[2] + '</span></span>';
      b.addEventListener("click", function () { location.search = "?role=" + r[0]; });
      grid.appendChild(b);
    });
    $("#picker").hidden = false;
  }

  function showRefBanner() {
    var banner = document.createElement("div");
    banner.className = "refbanner";
    banner.textContent = "🎁 您的邀请人推荐码：" + refFrom + "　完成问卷并注册投注，双方皆可领奖励";
    $("#wizard").appendChild(banner);
  }

  /* ---------- 渲染单题 ---------- */
  function renderQuestion() {
    var q = S.questions[curId];
    var wrap = $("#wizard");
    // 清掉旧题（保留 refbanner）
    Array.prototype.slice.call(wrap.querySelectorAll(".q,.nav")).forEach(function (n) { n.remove(); });

    var card = document.createElement("section");
    card.className = "q"; card.dataset.qid = curId;
    var stepNo = history.length + 1;
    var head = document.createElement("div"); head.className = "q__head";
    head.innerHTML = '<span class="q__num">' + stepNo + '</span><p class="q__text">' + esc(q.q) +
      (q.optional ? '' : '<span class="q__req">＊</span>') + '</p>';
    card.appendChild(head);
    if (q.note) { var n = document.createElement("p"); n.className = "q__note"; n.textContent = q.note; card.appendChild(n); }

    if (q.type === "single") card.appendChild(buildSingle(q));
    else if (q.type === "multi") card.appendChild(buildMulti(q));
    else card.appendChild(buildText(q));
    wrap.appendChild(card);

    // 导航
    var nav = document.createElement("div"); nav.className = "nav";
    var back = document.createElement("button");
    back.type = "button"; back.className = "nav__back"; back.textContent = "上一步";
    back.disabled = history.length === 0;
    back.addEventListener("click", goBack);
    var next = document.createElement("button");
    next.type = "button"; next.className = "btn nav__next"; next.textContent = "下一步";
    next.addEventListener("click", goNext);
    nav.appendChild(back); nav.appendChild(next);
    wrap.appendChild(nav);

    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildSingle(q) {
    var wrap = document.createElement("div"); wrap.className = "opts";
    var saved = answers[curId] || {};
    q.options.forEach(function (opt, i) {
      var label = typeof opt === "string" ? opt : opt.label;
      var hasText = typeof opt === "object" && opt.text;
      var lab = document.createElement("label"); lab.className = "opt";
      lab.innerHTML = '<input type="radio" name="' + curId + '"><span class="opt__box"></span><span class="opt__label">' + esc(label) + '</span>';
      var input = lab.querySelector("input");
      if (saved.label === label) { input.checked = true; lab.classList.add("is-on"); }
      input.addEventListener("change", function () {
        Array.prototype.forEach.call(wrap.querySelectorAll(".opt"), function (o) { o.classList.remove("is-on"); });
        lab.classList.add("is-on");
        answers[curId] = { label: label, next: (typeof opt === "object" && opt.next) || null };
        // 其他填空
        var tb = wrap.querySelector(".opt-text");
        if (hasText) { if (!tb) tb = addOptText(wrap); tb.hidden = false; tb.focus(); }
        else if (tb) { tb.hidden = true; }
      });
      wrap.appendChild(lab);
      if (hasText && saved.label === label) { var t = addOptText(wrap); t.value = saved.text || ""; }
    });
    return wrap;
  }
  function addOptText(wrap) {
    var tb = document.createElement("input");
    tb.type = "text"; tb.className = "opt-text"; tb.placeholder = "请说明…"; tb.maxLength = 200;
    tb.addEventListener("input", function () { if (answers[curId]) answers[curId].text = tb.value.trim(); });
    wrap.appendChild(tb); return tb;
  }

  function buildMulti(q) {
    var wrap = document.createElement("div"); wrap.className = "opts";
    var max = q.max || 99;
    var saved = answers[curId] || { labels: [] };
    q.options.forEach(function (opt) {
      var label = typeof opt === "string" ? opt : opt.label;
      var hasText = typeof opt === "object" && opt.text;
      var lab = document.createElement("label"); lab.className = "opt opt--multi";
      lab.innerHTML = '<input type="checkbox"><span class="opt__box"></span><span class="opt__label">' + esc(label) + '</span>';
      var input = lab.querySelector("input");
      if (saved.labels && saved.labels.indexOf(label) >= 0) { input.checked = true; lab.classList.add("is-on"); }
      input.addEventListener("change", function () {
        var a = answers[curId] || { labels: [] }; if (!a.labels) a.labels = [];
        if (input.checked) {
          if (a.labels.length >= max) { input.checked = false; warn("最多选择 " + max + " 项"); return; }
          a.labels.push(label); lab.classList.add("is-on");
          if (hasText) { var tb = wrap.querySelector(".opt-text") || addOptText(wrap); tb.hidden = false; tb.focus(); }
        } else {
          a.labels = a.labels.filter(function (v) { return v !== label; }); lab.classList.remove("is-on");
          if (hasText) { var t = wrap.querySelector(".opt-text"); if (t) t.hidden = true; }
        }
        answers[curId] = a;
      });
      wrap.appendChild(lab);
      if (hasText && saved.labels && saved.labels.indexOf(label) >= 0) { var t2 = addOptText(wrap); t2.value = saved.text || ""; }
    });
    return wrap;
  }

  function buildText(q) {
    var wrap = document.createElement("div");
    var ta = document.createElement("textarea");
    ta.placeholder = q.placeholder || "请输入…"; ta.maxLength = 500;
    if (answers[curId]) ta.value = answers[curId].text || "";
    ta.addEventListener("input", function () { answers[curId] = { text: ta.value.trim() }; });
    wrap.appendChild(ta);
    return wrap;
  }

  /* ---------- 导航逻辑 ---------- */
  function goNext() {
    var q = S.questions[curId], a = answers[curId];
    if (!q.optional) {
      if (q.type === "single" && (!a || !a.label)) return warn("请选择一个选项");
      if (q.type === "multi" && (!a || !a.labels || !a.labels.length)) return warn("请至少选择一项");
      if (q.type === "text" && (!a || !a.text)) return warn("请填写后再继续");
    }
    var nextId = (a && a.next) || q.next || null;
    if (!nextId) return finish("L_thanks");
    if (nextId.indexOf("L_") === 0) return finish(nextId);
    history.push(curId); curId = nextId; renderQuestion();
  }
  function goBack() {
    if (!history.length) return;
    curId = history.pop(); renderQuestion();
  }
  function warn(msg) {
    var nav = $(".nav");
    var w = $(".nav__warn") || document.createElement("div");
    w.className = "nav__warn"; w.textContent = msg;
    if (!w.parentNode) nav.parentNode.insertBefore(w, nav);
    setTimeout(function () { w.remove(); }, 2200);
  }

  /* ---------- 结尾 / 落地页 ---------- */
  function finish(landingKey) {
    var L = SURVEY.landings[landingKey];
    if (L.kind !== "gate") submitToSheet(landingKey);
    renderLanding(L);
  }
  function gateChoose(to, label) {
    answers["_activity2"] = { text: label };
    finish(to);
  }

  function renderLanding(L) {
    $("#wizard").hidden = true; $("#picker").hidden = true; $("#hero").classList.add("is-collapsed");
    $("#progressBar").style.width = "100%";
    var host = $("#landing"); host.innerHTML = ""; host.hidden = false;
    host.className = "land" + (L.kind === "referral" ? "" : " land--center");

    if (L.icon) { var ic = document.createElement("div"); ic.className = "land__icon"; ic.textContent = L.icon; host.appendChild(ic); }
    var h = document.createElement("h2"); h.className = "land__h"; h.textContent = L.title; host.appendChild(h);
    if (L.lead) { var p = document.createElement("p"); p.className = "land__lead"; p.textContent = L.lead; host.appendChild(p); }

    if (L.kind === "thanks") {
      (L.body || []).forEach(function (t) { var e = document.createElement("p"); e.className = "land__p"; e.textContent = t; host.appendChild(e); });
    }
    if (L.kind === "gate") {
      (L.body || []).forEach(function (t) { var e = document.createElement("p"); e.className = "land__p"; e.textContent = t; host.appendChild(e); });
      if (L.question) { var qq = document.createElement("p"); qq.className = "land__gateq"; qq.textContent = L.question; host.appendChild(qq); }
      var bts = document.createElement("div"); bts.className = "land__gatebtns";
      (L.buttons || []).forEach(function (btn) {
        var el = document.createElement("button"); el.type = "button";
        el.className = btn.primary ? "cta" : "gate__no"; el.textContent = btn.label;
        el.addEventListener("click", function () { gateChoose(btn.to, btn.label); });
        bts.appendChild(el);
      });
      host.appendChild(bts);
    }
    if (L.kind === "referral") {
      // 推荐码 + 复制链接
      var box = document.createElement("div"); box.className = "sharebox";
      box.innerHTML = '<p class="sharebox__h">填写您的会员推荐码，生成专属邀请链接</p>';
      var row = document.createElement("div"); row.className = "ref__row";
      var input = document.createElement("input"); input.type = "text"; input.className = "ref__input"; input.placeholder = "输入会员推荐码"; input.maxLength = 40;
      var gen = document.createElement("button"); gen.type = "button"; gen.className = "ref__btn"; gen.textContent = "生成链接";
      row.appendChild(input); row.appendChild(gen); box.appendChild(row);
      var out = document.createElement("div"); out.className = "ref__out"; out.hidden = true;
      var link = document.createElement("div"); link.className = "sharebox__link";
      var copy = document.createElement("button"); copy.type = "button"; copy.className = "cta"; copy.textContent = "复制邀请链接";
      out.appendChild(link); out.appendChild(copy); box.appendChild(out);
      gen.addEventListener("click", function () {
        var code = input.value.trim(); if (!code) { input.focus(); return; }
        memberShareUrl = location.origin + location.pathname + "?role=newbie&ref=" + encodeURIComponent(code);
        link.textContent = memberShareUrl; out.hidden = false;
        answers["_memberCode"] = { text: code };
      });
      copy.addEventListener("click", function () { doCopy(memberShareUrl, copy); });
      // 可展开：了解如何获得推荐码
      var toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "howto__toggle";
      toggle.textContent = "⬇️ 了解如何获得推荐码 ⬇️";
      var panel = document.createElement("div"); panel.className = "howto__panel"; panel.hidden = true;
      var img = document.createElement("div"); img.className = "howto__img"; img.textContent = "图片待补";
      panel.appendChild(img);
      toggle.addEventListener("click", function () {
        var willOpen = panel.hidden; panel.hidden = !willOpen;
        toggle.textContent = willOpen ? "⬆️ 收起 ⬆️" : "⬇️ 了解如何获得推荐码 ⬇️";
      });
      box.appendChild(toggle); box.appendChild(panel);
      host.appendChild(box);
      appendList(host, "🔥 活动亮点", L.highlights);
      (L.steps || []).forEach(function (st) { appendList(host, st.h, st.items); });
      if (L.note) { var nn = document.createElement("p"); nn.className = "land__note"; nn.textContent = L.note; host.appendChild(nn); }
    }
    if (L.kind === "register") {
      if (L.block) { var b = document.createElement("p"); b.className = "land__block"; b.textContent = L.block; host.appendChild(b); }
      appendList(host, "", L.highlights);
      var a = document.createElement("a"); a.className = "cta"; a.href = SURVEY.registerUrl + (refFrom ? "?ref=" + encodeURIComponent(refFrom) : "");
      a.target = "_blank"; a.rel = "noopener"; a.textContent = L.cta || "前往注册 →";
      var wrap = document.createElement("div"); wrap.className = "land__cta"; wrap.appendChild(a); host.appendChild(wrap);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function appendList(host, title, items) {
    if (!items || !items.length) return;
    var card = document.createElement("div"); card.className = "land__card";
    if (title) { var h = document.createElement("p"); h.className = "land__cardh"; h.textContent = title; card.appendChild(h); }
    var ul = document.createElement("ul"); ul.className = "land__ul";
    items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    card.appendChild(ul); host.appendChild(card);
  }

  /* ---------- 进度 ---------- */
  function updateProgress() {
    var est = role === "member" ? 8 : 4;
    var pct = Math.min(95, Math.round((history.length / est) * 100));
    $("#progressBar").style.width = pct + "%";
  }

  /* ---------- 写入 Google Sheet ---------- */
  function submitToSheet(landingKey) {
    var url = (CFG.ENDPOINT || "").trim();
    var rows = [];
    Object.keys(answers).forEach(function (qid) {
      if (qid.indexOf("_") === 0) return;
      var q = S.questions[qid]; if (!q) return;
      var a = answers[qid];
      var val;
      if (a.labels) val = a.labels.join("、") + (a.text ? "（其他：" + a.text + "）" : "");
      else val = a.label ? (a.label + (a.text ? "：" + a.text : "")) : (a.text || "");
      rows.push({ qid: qid, question: q.q, answer: val });
    });
    if (answers["_activity2"]) rows.push({ qid: "活动二意愿", question: "是否参与推荐问卷活动", answer: answers["_activity2"].text });
    if (answers["_memberCode"]) rows.push({ qid: "会员推荐码", question: "会员自填推荐码", answer: answers["_memberCode"].text });
    if (role === "newbie" && refFrom) rows.unshift({ qid: "推荐人ref", question: "推荐人推荐码", answer: refFrom });
    var payload = { submissionId: genId(), seg: (role === "member" ? "会员问卷" : "新人问卷"), ts: new Date().toISOString(), ua: navigator.userAgent, answers: rows };
    if (!url) { console.warn("[示范模式] 未设 ENDPOINT，未写入 Sheet：", payload); return; }
    fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }).catch(function () {});
  }

  /* ---------- 工具 ---------- */
  function doCopy(text, btn) {
    var old = btn.textContent;
    function ok() { btn.textContent = "已复制 ✓"; setTimeout(function () { btn.textContent = old; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { fb(); ok(); });
    else { fb(); ok(); }
    function fb() { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(t); }
  }
  function genId() { return "R" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
})();
