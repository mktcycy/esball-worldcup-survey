/* ESBALL 世界杯问卷 — 依 Google Sheet「问卷活动」内容打造（简体）
   两份问卷：member 会员问卷 / newbie 新人问卷；含跳题(skip)逻辑与结尾落地页。
   题型 type: single(单选) / text(填空/开放)
   每个选项可带 next(跳到某题) 与 text(选此项时additional填空)；题层级 next 为预设下一题。
   next 指到 'L_ref' / 'L_thanks' / 'L_reg' 代表进入落地页。 */

(function () {
  var SPORTS = ["NEW BB 体育", "BB 体育", "沙巴 体育", "IM 体育", "波音 体育", "熊猫 体育"];
  var PRODUCT_REASON = [
    "赔率比较好", "盘口／玩法种类多（让分、大小、串关、波胆…）", "赛事／联赛涵盖广、场次多",
    "滚球体验好、开盘快", "下注限额高、能下大注", "界面好用、下注方便快速",
    "稳定、少卡顿当机", "习惯了一直都用", "返水／优惠比较好",
    "朋友推荐、大家都玩这品牌", { label: "其他（请说明）", text: true }
  ];

  // ---------- 会员问卷 ----------
  var member = {
    start: "m1",
    bonus: "🧧 随机抽 ¥8 ~ ¥1,888 奖金",
    intro: "亲爱的会员您好，恭喜您获得隐藏问卷活动的参与资格！您只需花 3 分钟填写问卷，即可随机获得 ¥8 ~ ¥1,888 奖金（内容越完整，获得高额奖金的机率越高）。",
    questions: {
      m1: { type: "single", q: "您最喜欢在哪个体育产品下注呢？", options: SPORTS, next: "m2" },
      m2: { type: "multi", max: 3, q: "为什么最喜欢该体育产品呢？（选择最多 3 个原因）", options: PRODUCT_REASON, next: "m3" },
      m3: {
        type: "single", q: "针对本次 ESBALL 世界杯活动，您最喜欢哪个活动？",
        note: "（活动名称请以实际活动替换）",
        options: [
          "活动1名称：简述", "活动2名称：简述", "活动3名称：简述", "活动4名称：简述", "活动5名称：简述",
          { label: "都不喜欢", next: "m4a" }, { label: "其他", text: true }
        ], next: "m4"
      },
      m4: { type: "text", q: "为什么最喜欢那个活动呢？", placeholder: "请说明喜欢的原因", next: "m5" },
      m4a: { type: "text", q: "那您喜欢怎样的活动呢？", placeholder: "请简述您喜欢的活动", next: "m5" },
      m5: {
        type: "single", q: "您是否有在其他网站投注体育相关赛事？",
        options: [{ label: "有", next: "m5a" }, { label: "没有，只在 ESBALL", next: "m6" }]
      },
      m5a: { type: "text", q: "请问该网站的网址是？", placeholder: "请填写网址", next: "m5b" },
      m5b: { type: "text", q: "您为何会选择该网站进行投注呢？", placeholder: "请简述选择的原因", next: "m6" },
      m6: {
        type: "single", q: "您平时是否有在《体育资讯网站》吸收体育资讯呢？",
        options: [{ label: "有", next: "m6a" }, { label: "没有", next: "m7" }]
      },
      m6a: { type: "text", q: "请问该网站的网址是？", placeholder: "请填写网址", next: "m6b" },
      m6b: { type: "text", q: "您为何会选择该网站来吸收体育资讯呢？", placeholder: "请简述选择的原因", next: "m7" },
      m7: { type: "text", q: "请问您对于 ESBALL 是否有其他建议或回馈呢？", placeholder: "如果有请提供回馈", optional: true, next: "L_congrats" }
    }
  };

  // ---------- 新人问卷 ----------
  var newbie = {
    start: "n1",
    bonus: "🧧 免费抽 ¥88,888 红包",
    intro: "您好，感谢好友的邀请！完成这份问卷，即有机会免费抽 ¥88,888 红包。全程匿名，敬请安心作答。",
    questions: {
      n1: { type: "text", q: "您平时都在哪个网站下注呢？", placeholder: "请填写网址", next: "n2" },
      n2: {
        type: "single", q: "您为何会选择该网站进行投注呢？",
        options: [
          "优惠／返水／红利比较多", "存取款方便、出金快", "平台稳定、少当机", "体育产品种类比较多",
          "整体界面好用、下注操作顺手", "投注额度／限额比较高", "信誉好、比较信任安全",
          "客服比较好、回应快", "朋友都在那边玩", "除了体育外其他类型产品齐全",
          "比较早注册、已经习惯了", { label: "其他（请说明）", text: true }
        ], next: "n3"
      },
      n3: { type: "single", q: "您在该网站习惯下注的体育产品是？", options: SPORTS, next: "n4" },
      n4: { type: "multi", max: 3, q: "为什么最喜欢该体育产品呢？（选择最多 3 个原因）", options: PRODUCT_REASON, next: "L_reg" }
    }
  };

  // ---------- 落地页 ----------
  var landings = {
    L_congrats: {
      kind: "gate", icon: "🎉",
      title: "恭喜您已完成问卷！",
      body: ["依据内容将随机获得 ¥8 ~ ¥1,888 奖金", "8/18 自动派发、免申请，打码 2 倍即可申请出款"],
      question: "是否有兴趣参与「推荐问卷活动」？除了可领取下线会员打码 X% 佣金，还有机会额外获得最高 ¥88,888 奖金！",
      buttons: [{ label: "有兴趣，立即参与 →", to: "L_ref", primary: true }, { label: "暂不参与", to: "L_thanks" }]
    },
    L_thanks: {
      kind: "thanks", icon: "❤️",
      title: "感谢您的填写！",
      body: ["您的奖金将于 8/18 自动派发（免申请），打码 2 倍即可申请出款。", "祝您游戏愉快、顺心如意！"]
    },
    L_ref: {
      kind: "referral",
      title: "📢 填码分享问卷\n最高抽 ¥88,888 红包",
      lead: "想赚取更多回馈？\n简单两步骤，轻松把最高 ¥88,888 奖金带回家！",
      steps: [
        { h: "📥 第一步：填写推荐码并复制链接",
          items: ["1. 输入您的【会员推荐码】", "2. 点击【生成链接】按钮推荐给好友", "（注意：推荐码填错视同放弃）"] },
        { h: "🎁 第二步：好友相挺，好礼双重送",
          items: ["当好友完成：填写问卷 ＋ 注册 ESBALL ＋ 投注额满 888", "第一重｜既有回馈：原有流水推荐金 XX% 照样领！", "第二重｜加码限时抽：8/18–8/31 期间，获得免费抽 ¥88,888 红包资格！"] }
      ],
      highlights: ["🏆 百万奖金：红包最高可抽中 ¥88,888 转运金", "📈 无上限抽：成功推荐 1 位就送 1 次抽奖机会，次数无上限！", "🚀 胜率加倍：推荐越多好友，抽中 ¥88,888 终极大奖的机率就越高！"],
      note: "（领红包链接将于派彩会员讯息中提供专属链接，转传无效）"
    },
    L_reg: {
      kind: "register",
      title: "❤️ 感谢您的问卷填写！",
      lead: "大奖第一步已完成，接下来让 ESBALL 带您免费抱回 ¥88,888！",
      block: "【限时独家福利】即刻点击下方【前往注册】，并在 8/18 前完成入款且投注满 888，即可在 8/18–8/31 期间，享有免费抽 ¥88,888 红包的黄金资格！",
      highlights: ["门槛超低：只需下注达 888，即刻享有抽奖权", "完美体验：业界顶级体育产品，滚球开盘最快速"],
      cta: "前往注册 · 开启中奖好运 →"
    }
  };

  window.SURVEY = {
    registerUrl: "https://esball.net/",
    shareParamRole: "member",
    member: member,
    newbie: newbie,
    landings: landings
  };
})();
