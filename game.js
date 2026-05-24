// ═══════════════════════════════════════════════════════════
//  星陨大陆 — 肉体进化版  game.js
// ═══════════════════════════════════════════════════════════

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ── AI Dialogue Config ─────────────────────────────────
// 填入百度千帆 API Key（控制台 → 应用接入 → API Key）
// https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application
const QIANFAN_API_KEY = 'bce-v3/ALTAK-8PR6okIuj9fJX7uvawsOr/fcef1a002f5624eeb8621d8169884bba9d4fb655';
const QIANFAN_MODEL   = 'ernie-speed-128k'; // 免费额度最多的模型

const ui = {
  startModal:   document.getElementById("startModal"),
  choiceModal:  document.getElementById("choiceModal"),
  resultModal:  document.getElementById("resultModal"),
  shopModal:    document.getElementById("shopModal"),
  startBtn:     document.getElementById("startBtn"),
  restartBtn:   document.getElementById("restartBtn"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  choiceCards:  document.getElementById("choiceCards"),
  shopCards:    document.getElementById("shopCards"),
  shopMeta:     document.getElementById("shopMeta"),
  shopTitle:    document.getElementById("shopTitle"),
  classCards:   document.getElementById("classCards"),
  choiceType:   document.getElementById("choiceType"),
  choiceTitle:  document.getElementById("choiceTitle"),
  hpBar:        document.getElementById("hpBar"),
  xpBar:        document.getElementById("xpBar"),
  hpText:       document.getElementById("hpText"),
  xpText:       document.getElementById("xpText"),
  stats:        document.getElementById("stats"),
  timer:        document.getElementById("timer"),
  wave:         document.getElementById("wave"),
  coins:        document.getElementById("coins"),
  chapter:      document.getElementById("chapter"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle:  document.getElementById("resultTitle"),
  resultBody:   document.getElementById("resultBody"),
  evolveBar:    document.getElementById("evolveBar"),
  evolveText:   document.getElementById("evolveText"),
  routeModal:   document.getElementById("routeModal")
};

// ─── World Data ───────────────────────────────────────────
const chapters = [
  { name:"翠叶森林", tint:"#2a5818", accent:"#5aee3a" },
  { name:"雾眠沼泽", tint:"#1e4a28", accent:"#3ae8b0" },
  { name:"赤砂遗迹", tint:"#5a3010", accent:"#ff9a40" },
  { name:"霜月城垣", tint:"#1a3870", accent:"#80e0ff" },
  { name:"星裂深渊", tint:"#200a38", accent:"#e070ff" }
];

const rarities = [
  { name:"普通", color:"#8aa1b4", weight:40, power:1    },
  { name:"稀有", color:"#44ccff", weight:28, power:1.4  },
  { name:"史诗", color:"#b060ff", weight:16, power:1.9  },
  { name:"传说", color:"#ffcc44", weight:10, power:2.6  },
  { name:"星陨", color:"#ff50a0", weight:6,  power:3.5  }
];

// ─── Evolution Builds ─────────────────────────────────────
// Each build has visual thresholds: 0‥1 progress drives drawPlayer appearance
const BUILD_TYPES = {
  strength: { label:"力量流", color:"#ff7030" },
  speed:    { label:"攻速流", color:"#8fb36a" },
  corrupt:  { label:"腐化流", color:"#a030ff" },
  tank:     { label:"坦克流", color:"#7ca85a" },
  crit:     { label:"暴击流", color:"#ffcc20" }
};

const DOG_GEAR = [
  { id:"collar", name:"狂暴项圈", desc:"连击越多攻速越快，停止攻击后重置", cost:700,  rarity:"稀有" },
  { id:"vest",   name:"重甲背心", desc:"帮主人挡30%伤害，受击时击退附近敌人", cost:650,  rarity:"稀有" },
  { id:"chain",  name:"感染犬链", desc:"击杀后20%概率让敌人短暂变为友军",  cost:1200, rarity:"史诗" },
  { id:"bone",   name:"灵魂骨头", desc:"击杀敌人后恢复8点生命",            cost:300,  rarity:"普通" },
  { id:"shoes",  name:"影子鞋",   desc:"每3.5秒瞬移扑向敌人造成3倍伤害",  cost:1100, rarity:"史诗" },
  { id:"core",   name:"巨兽核心", desc:"每次击杀体型缓慢增大最多2.2倍",   cost:2000, rarity:"传说" },
  { id:"mask",   name:"尖牙面具", desc:"攻击有25%概率造成持续流血效果",    cost:600,  rarity:"稀有" },
];

// ─── MBTI Death Card ──────────────────────────────────────
const MBTI_TYPES = {
  INTJ: {
    name:"深渊策士", color:"#9060f0",
    quote:"你一直在观察。代价是冷漠。",
    tags:["高威胁优先","精准控场","低失误","策略型"],
    ai_logs:[
      "目标倾向于优先清除精英单位。",
      "战场感知精准，鲜少暴露弱点。",
      "行为模式趋近于最优解。系统感到不安。",
    ],
    build:"控制流 · 减速 · 精准爆发",
  },
  ENTP: {
    name:"混乱制造者", color:"#ff8820",
    quote:"你从不遵守规则。",
    tags:["高风险","高频冲刺","爆炸爱好者","失控Build"],
    ai_logs:[
      "目标几乎从不撤退。",
      "预测模型多次失效，已重置第7次。",
      "系统无法判断其下一步行为。归类：危险异常体。",
    ],
    build:"腐化流 · 连锁爆炸 · 混乱感染",
  },
  ISTP: {
    name:"冷血猎手", color:"#44ccff",
    quote:"没有感情，只有数据。",
    tags:["高暴击","精准击杀","单体爆发","零浪费"],
    ai_logs:[
      "每次攻击都有明确优先目标。",
      "暴击率异常稳定，超出正态分布。",
      "系统称其为：效率机器。不建议正面交战。",
    ],
    build:"暴击流 · 单体爆发 · 精准打击",
  },
  ENFP: {
    name:"灾难吸引体", color:"#ff50a0",
    quote:"混乱是你的舞台。",
    tags:["到处乱跑","随机Build","高存活","事故制造者"],
    ai_logs:[
      "目标行动轨迹完全不可预测。",
      "多次触发小概率随机事件。",
      "系统已放弃建模其行为模式。",
    ],
    build:"随机流 · 全属性混搭 · 奇迹幸存",
  },
  INFP: {
    name:"流浪守护者", color:"#7ca85a",
    quote:"你在守护一些东西。",
    tags:["宠物依赖","感染流","被动防守","守护者"],
    ai_logs:[
      "目标与宠物保持高度协同作战。",
      "极少主动进攻，偏好消耗战术。",
      "感染传播范围超出预期。归类：生化威胁。",
    ],
    build:"感染流 · 宠物强化 · 持续伤害",
  },
  ESTJ: {
    name:"钢铁推进机", color:"#ffcc20",
    quote:"你是一堵墙。",
    tags:["高防御","站撸","正面碾压","零退缩"],
    ai_logs:[
      "目标从未主动回避攻击。",
      "承受伤害远超同类别记录。",
      "系统判定：不可击退。建议调遣重型单位。",
    ],
    build:"坦克流 · 反伤 · 护盾强化",
  },
  INFJ: {
    name:"星陨先知", color:"#e070ff",
    quote:"你早已预见结局。",
    tags:["高存活","长线策略","低风险","神秘路线"],
    ai_logs:[
      "目标总在关键时刻精确撤退。",
      "血量管理近乎完美，从未进入濒死状态。",
      "系统称其为：不死之身候补。档案标记：高警戒。",
    ],
    build:"速度流 · Kite · 持久战",
  },
  ESFP: {
    name:"星际狂徒", color:"#ff3030",
    quote:"活在当下，死也当下。",
    tags:["极度激进","近战冲刺","高伤害","短命传说"],
    ai_logs:[
      "目标总是第一个冲入敌群。",
      "生命值波动剧烈——几乎是实时心电图。",
      "战斗持续时间：远超或远低于系统预测。",
    ],
    build:"力量流 · 近战爆发 · 无脑冲锋",
  },
};

function initDeathStats() {
  return {
    totalFrames: 0,
    aggressionFrames: 0,
    kiteFrames: 0,
    stationaryFrames: 0,
    lowHpFrames: 0,
    totalDistance: 0,
    eliteKills: 0,
    prevX: 640, prevY: 360,
  };
}

// ─── Classes ──────────────────────────────────────────────
const classes = {
  duelist: {
    name:"刺客", color:"#ffd45c",
    buildBias:"speed",
    stats:{ hp:110, speed:300, damage:18, fireRate:0.28, projectiles:1, crit:32 },
    traits:{ critDamage:2.8, lifesteal:0.08, dashCooldown:1.05, bleedEvery:5,
             chainOnCrit:true, cloneDash:true,
             melee:true, meleeRange:105, meleeArc:1.0 }
  },
  tank: {
    name:"肉盾", color:"#65e572",
    buildBias:"tank",
    stats:{ hp:260, speed:180, damage:42, fireRate:0.95, projectiles:1, crit:4 },
    traits:{ critDamage:1.6, damageReduction:0.36, shieldMax:80, shieldRegenTime:10,
             dashCooldown:2.2, slamDash:true, knockback:130,
             melee:true, meleeRange:130, meleeArc:1.4 }
  },
  mage: {
    name:"法师", color:"#55c9ff",
    buildBias:"corrupt",
    stats:{ hp:120, speed:230, damage:20, fireRate:0.58, projectiles:2, crit:8 },
    traits:{ critDamage:1.8, aoeRadius:86, killExplosion:true, chainDamage:0.35, dashCooldown:1.75 }
  }
};

// ─── Upgrades ─────────────────────────────────────────────
const upgrades = [
  { name:"星火法杖",   tag:"装备强化", cost:450, stat:"damage",     text:"攻击力提升",   base:5,     build:"strength" },
  { name:"风行靴",     tag:"装备强化", cost:350, stat:"speed",      text:"移动速度提升", base:18,    build:"speed"    },
  { name:"秘银护心",   tag:"装备强化", cost:300, stat:"maxHp",      text:"生命上限提升", base:18,    build:"tank"     },
  { name:"回旋星刃",   tag:"装备强化", cost:800, stat:"projectiles",text:"额外发射物",   base:1,     build:"corrupt"  },
  { name:"猎星目镜",   tag:"装备强化", cost:600, stat:"crit",       text:"暴击率提升",   base:6,     build:"crit"     },
  { name:"丰收钱袋",   tag:"装备强化", cost:500, stat:"goldRate",   text:"金币收益提升", base:15,    build:"corrupt"  },
  { name:"血肉之核",   tag:"装备强化", cost:550, stat:"damage",     text:"暗能攻击提升", base:8,     build:"corrupt"  },
  { name:"混沌脉冲",   tag:"装备强化", cost:380, stat:"fireRate",   text:"攻速提升",     base:-0.04, build:"speed"    }
];

const boxes = [
  { name:"青铜盲盒", level:1, text:"随机强化一项，小概率触发稀有装备" },
  { name:"秘银盲盒", level:2, text:"随机强化两项，提升保底进度" },
  { name:"曜金盲盒", level:3, text:"高概率史诗，金币奖励翻倍" },
  { name:"星陨盲盒", level:4, text:"必出传说以上，但敌潮加速 8 秒" },
  { name:"诅咒盲盒", level:5, text:"立即获得强力词条，同时召来精英怪" }
];

const weaponShop = [
  { name:"双刃短刀",  cost:1400, rarity:"稀有", text:"+20% 攻速，暴击 +4%",
    effect:{ fireRateMul:0.8, crit:4 }, build:"speed" },
  { name:"影袭靴",    cost:1450, rarity:"稀有", text:"-18% 翻滚冷却，+12% 移速，获得残影",
    effect:{ speedMul:1.12, dashCooldownMul:0.82, traits:{ cloneDash:true } }, build:"speed" },
  { name:"电流匕首",  cost:1900, rarity:"史诗", text:"暴击链电，暴击率 +8%",
    effect:{ crit:8, traits:{ chainOnCrit:true } }, build:"crit" },
  { name:"深海重甲",  cost:1500, rarity:"稀有", text:"+50 护盾，+12% 减伤",
    effect:{ shield:50, damageReduction:0.12 }, build:"tank" },
  { name:"锚链巨锤",  cost:2000, rarity:"史诗", text:"攻击变慢但伤害大幅提升，翻滚震地",
    effect:{ damage:28, fireRateMul:1.18, knockback:70, traits:{ slamDash:true } }, build:"strength" },
  { name:"石肤核心",  cost:1450, rarity:"稀有", text:"-10% 移速，+80 生命，+10% 减伤",
    effect:{ speedMul:0.9, maxHp:80, damageReduction:0.1 }, build:"tank" },
  { name:"潮汐法杖",  cost:1500, rarity:"稀有", text:"子弹爆炸范围 +34",
    effect:{ aoeRadius:34 }, build:"corrupt" },
  { name:"深渊核心",  cost:2000, rarity:"史诗", text:"击杀触发连爆，攻击 +18",
    effect:{ damage:18, traits:{ killExplosion:true } }, build:"corrupt" },
  { name:"雷暴环",    cost:3000, rarity:"传说", text:"+1 弹道，暴击 +6%，暴击链电",
    effect:{ projectiles:1, crit:6, traits:{ chainOnCrit:true } }, build:"crit" },
  { name:"血肉触手",  cost:2100, rarity:"史诗", text:"+15% 吸血，暴击附加腐化",
    effect:{ lifestealBonus:0.15, traits:{ corruptCrit:true } }, build:"corrupt" },
  { name:"肌肉外壳",  cost:2200, rarity:"史诗", text:"+40 攻击，体型变大",
    effect:{ damage:40 }, build:"strength" },
  { name:"混沌棱晶",  cost:3500, rarity:"传说", text:"+2 弹道，攻速 +12%，身体扭曲",
    effect:{ projectiles:2, fireRateMul:0.88 }, build:"corrupt" }
];

// ─── Pre-run Shop State (main menu) ──────────────────────
const MENU_START_COINS  = 500;  // gold budget per run
const UPGRADE_COST      = 50;   // flat cost for stat upgrades in menu shop
let _menuCoins    = MENU_START_COINS;
let _menuWeapons  = [];  // { item } — purchased weapons
let _menuUpgrades = [];  // { upg, value, rarity } — purchased upgrades

// ─── Stage Mode ───────────────────────────────────────────
const STAGES = [
  { id:1, name:"翠叶试炼", rounds:4,  stars:"⭐",       desc:"初入星陨，基础考验" },
  { id:2, name:"暗林深处", rounds:6,  stars:"⭐⭐",     desc:"精英怪开始出没" },
  { id:3, name:"赤砂遗迹", rounds:8,  stars:"⭐⭐⭐",   desc:"双重威胁，多路夹击" },
  { id:4, name:"霜月城垣", rounds:10, stars:"⭐⭐⭐⭐", desc:"强化Boss，极限考验" },
  { id:5, name:"星裂深渊", rounds:12, stars:"★★★★★",  desc:"最终试炼，无路可退" }
];

// ─── Per-Stage Enemy Scaling Config ──────────────────────
// sb        = stage base HP multiplier (applied on top of cb)
// dmgTier   = damage multiplier for all enemies in this stage
// bossHp    = fixed Boss HP (not further multiplied by cb)
// normalBase= [min,max] rand range for normal enemy base speed
// archerBase, eliteBase, bossBase = base speed (wave*3 still added on top)
const STAGE_CONFIG = [
  null, // index 0 — unused
  // Stage 1 — 翠叶试炼  (boss target: Normal≈95  Archer≈78  Elite≈88  Boss=70)
  // Enemies: slime hordes + flying eyes + ogre elites | Boss: armored knight
  { sb:1.0, dmgTier:1.0, bossHp:2400,  normalBase:[73, 93],  archerBase:64,  eliteBase:74,  bossBase:58,
    normalSprite:'slime',  archerSprite:'eye',    eliteSprite:'ogre',   bossSprite:'freeknight' },
  // Stage 2 — 暗林深处  (boss target: Normal≈108 Archer≈92  Elite≈102 Boss=88)
  // Enemies: hounds prowl + flying eyes + ogre elites | Boss: dragon
  { sb:1.5, dmgTier:1.3, bossHp:4680,  normalBase:[78, 98],  archerBase:74,  eliteBase:84,  bossBase:70,
    normalSprite:'hound',  archerSprite:'eye',    eliteSprite:'ogre',   bossSprite:'dragon'     },
  // Stage 3 — 赤砂遗迹  (boss target: Normal≈122 Archer≈108 Elite≈118 Boss=110)
  // Enemies: hounds + wizard archers + ogre elites | Boss: armored knight
  { sb:2.2, dmgTier:1.7, bossHp:8976,  normalBase:[86, 106], archerBase:84,  eliteBase:94,  bossBase:86,
    normalSprite:'hound',  archerSprite:'wizard', eliteSprite:'ogre',   bossSprite:'freeknight' },
  // Stage 4 — 霜月城垣  (boss target: Normal≈140 Archer≈128 Elite≈138 Boss=138)
  // Enemies: human soldiers + flying sentinels + terrible knights | Boss: dragon
  { sb:3.2, dmgTier:2.3, bossHp:17664, normalBase:[100,120], archerBase:98,  eliteBase:108, bossBase:108,
    normalSprite:'hero',   archerSprite:'eye',    eliteSprite:'knight', bossSprite:'dragon'     },
  // Stage 5 — 星裂深渊  (boss target: Normal≈162 Archer≈152 Elite≈162 Boss=172)
  // Enemies: abyss eyes + void wizards + knight elites | Boss: armored knight (final form)
  { sb:4.5, dmgTier:3.0, bossHp:32400, normalBase:[114,134], archerBase:116, eliteBase:126, bossBase:136,
    normalSprite:'eye',    archerSprite:'wizard', eliteSprite:'knight', bossSprite:'freeknight' },
];

let _stageMode   = false;   // true = stage mode, false = infinite mode
let _currentStage = null;   // stage object currently selected

function loadStageProgress() {
  try { return JSON.parse(localStorage.getItem("sf_stages") || "{}"); }
  catch(e) { return {}; }
}
function markStageCleared(stageId) {
  const p = loadStageProgress();
  p[stageId] = "cleared";
  localStorage.setItem("sf_stages", JSON.stringify(p));
}
function stageStatus(stageId) {
  const p = loadStageProgress();
  if (p[stageId] === "cleared") return "cleared";
  if (stageId === 1) return "unlocked";
  if (p[stageId - 1] === "cleared") return "unlocked";
  return "locked";
}

// ─── Pre-boss Pact Side Effects ───────────────────────────
const SIDE_EFFECTS = [
  { desc:"移速 -15%",      apply() { state.player.speed *= 0.85; } },
  { desc:"暴击率 -8%",     apply() { state.player.crit = Math.max(0, state.player.crit - 8); } },
  { desc:"攻速 -12%",      apply() { state.player.fireRate *= 1.12; } },
  { desc:"每秒流血 3 点",  apply() { state.eventFlags.hpDrainPerSec = (state.eventFlags.hpDrainPerSec || 0) + 3; } },
  { desc:"翻滚冷却 +30%",  apply() { state.player.traits.dashCooldown = (state.player.traits.dashCooldown || 1.0) * 1.3; } },
  { desc:"生命上限 -25",   apply() { state.player.maxHp = Math.max(30, state.player.maxHp - 25); state.player.hp = Math.min(state.player.hp, state.player.maxHp); } },
  { desc:"金币获取 -25%",  apply() { state.player.goldRate = Math.max(0.1, (state.player.goldRate || 1) * 0.75); } },
  { desc:"减伤 -10%",      apply() { state.player.traits.damageReduction = Math.max(0, (state.player.traits.damageReduction || 0) - 0.10); } },
];

// ─── State ────────────────────────────────────────────────
let selectedClass = "duelist";
let state;
let keys = {};
let last = performance.now();
let paused = true;

// Evolution tracking per run
function makeEvolution() {
  return {
    // scores per build type, 0..100
    strength:0, speed:0, corrupt:0, tank:0, crit:0,
    // dominant build this run
    dominant:"none",
    // visual phase 0..3 (0=human, 3=transcended)
    phase:0,
    // accumulated visual effects
    bodyScale:1,
    extraEyes:0,
    spikeCount:0,
    phantomArms:0,
    armorShards:0,
    glowVeins:0,
    energyRings:0,
    critFlash:0,
    slowTimeCrit:0,
    corruptOrbs:0,
    // time-based oscillators
    pulseT:0
  };
}

function baseState(classId = selectedClass) {
  const arch = classes[classId] || classes.duelist;
  return {
    running:false, over:false,
    time:0, roundTime:0, roundDuration:35, roundTransition:false,
    round:1, shopEvery:5, equipmentLimit:6,
    inShop:false,
    wave:1, chapter:0,
    nextSpawn:0, spawnRate:1.15,
    bossSpawned:false,
    guarantee:0, kills:0, coins:0,
    ownedWeapons:[],
    evolution: makeEvolution(),
    terrainFeatures: generateTerrainFeatures(1),
    obstacles:       generateObstacles(1),
    classId,
    player:{
      x:640, y:380, z:0,
      r:22,
      hp:arch.stats.hp, maxHp:arch.stats.hp,
      shield:arch.traits.shieldMax||0, shieldMax:arch.traits.shieldMax||0,
      shieldTimer:0,
      speed:arch.stats.speed,
      damage:arch.stats.damage,
      fireRate:arch.stats.fireRate, fireCd:0,
      projectiles:arch.stats.projectiles,
      crit:arch.stats.crit, critDamage:arch.traits.critDamage,
      goldRate:1,
      rollCd:0, rollTime:0, invuln:0,
      petCharge:0, hitCount:0,
      className:arch.name, classColor:arch.color,
      traits:{ ...arch.traits },
      anim: initAnim('Idle')
    },
    tracker: initHunterTracker(),
    hunter:  initHunter(),
    pet:{ angle:0, pulse:0 },
    dog:{
      gear:[], kills:0,
      comboCount:0, comboTimer:0,
      scale:1.0,
      teleportCd:3.5, teleportFx:0,
      attackCd:0,
      soulPts:[], trailPts:[],
      armorFlash:0
    },
    enemies:[], bullets:[], enemyBullets:[], partnerBullets:[], pickups:[],
    afterimages:[], particles:[], floating:[], meleeSlashes:[],
    partner: null,
    situation: initSituation(),
    enemySpeeches: [],
    deathStats: initDeathStats(),
    buildRoute: null,
    buildRouteTier: 0,
    routeState: initRouteState(),
    // ── Active Skill System ──────────────────────────────────
    killStreak: { count:0, timer:0 },
    roundStats:  { kills:0, damage:0, maxHit:0 },
    eventFlags:  {},
    skills: {
      q: { cd:0, maxCd: 5 },
      e: { cd:0, maxCd: 5 },
      _shakeTimer:0, _shakeAmt:8
    },
    phantomHunt:  { active:false, timer:0, speedBonus:0, rateMul:1 },
    abyssRitual:  { active:false, timer:0, runeAngle:0 },
    ironGuardian: { active:false, timer:0, drBonus:0, _regenTimer:0 }
  };
}

// ─── Utility ──────────────────────────────────────────────
function rand(min, max) { return min + Math.random() * (max - min); }

function chooseWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) { roll -= item.weight; if (roll <= 0) return item; }
  return items[0];
}

function formatTime(s) {
  const m = Math.floor(s/60).toString().padStart(2,"0");
  return `${m}:${Math.floor(s%60).toString().padStart(2,"0")}`;
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawPixelShadow(x, y, w, h, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#080602";
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTinyHpBar(x, y, w, pct, color) {
  const bw = Math.max(18, Math.round(w));
  const bh = 4;
  const left = Math.round(x - bw / 2);
  const top = Math.round(y);
  ctx.save();
  ctx.fillStyle = "rgba(20, 8, 2, 0.78)";
  ctx.fillRect(left - 1, top - 1, bw + 2, bh + 2);
  ctx.fillStyle = "#2c1208";
  ctx.fillRect(left, top, bw, bh);
  ctx.fillStyle = color;
  ctx.fillRect(left, top, Math.round(bw * Math.max(0, Math.min(1, pct))), bh);
  ctx.restore();
}

// ─── Terrain ──────────────────────────────────────────────
const terrainProto = [
  { x:0.2,  y:0.28, rx:0.22, ry:0.18, height:26, color:"high" },
  { x:0.48, y:0.55, rx:0.28, ry:0.2,  height:38, color:"high" },
  { x:0.78, y:0.38, rx:0.24, ry:0.18, height:30, color:"high" },
  { x:0.28, y:0.78, rx:0.28, ry:0.13, height:-18,color:"low"  },
  { x:0.72, y:0.78, rx:0.25, ry:0.16, height:-14,color:"low"  }
];

function seededRand(seed) { const x = Math.sin(seed * 999.91) * 10000; return x - Math.floor(x); }

function generateTerrainFeatures(round) {
  return terrainProto.map((f, i) => ({
    ...f,
    x: Math.max(0.14, Math.min(0.86, f.x + (seededRand(round*7+i)-.5)*.14)),
    y: Math.max(0.18, Math.min(0.82, f.y + (seededRand(round*11+i)-.5)*.12)),
    height: f.height + Math.round((seededRand(round*17+i)-.5)*16)
  }));
}

function generateObstacles(round) {
  return []; // Obstacles removed — open arena design
  // eslint-disable-next-line no-unreachable
  const COLS = 40, ROWS = 23;
  const safeTx = 14, safeTy = 7, safeW = 12, safeH = 9;
  const obs = [];
  const count = 3 + Math.min(4, Math.floor(round / 2));
  for (let i = 0; i < count * 4 && obs.length < count; i++) {
    const s = (n) => seededRand(round * 71 + i * 19 + n);
    const type = s(0) < 0.5 ? 'pit' : 'wall';
    let tw, th;
    if (type === 'pit') {
      tw = 2 + Math.floor(s(1) * 3);  // 2–4 wide
      th = 2 + Math.floor(s(2) * 2);  // 2–3 tall
    } else {
      if (s(1) < 0.5) { tw = 1; th = 3 + Math.floor(s(2) * 4); }  // vertical wall
      else             { tw = 3 + Math.floor(s(2) * 4); th = 1; }  // horizontal wall
    }
    const tx = 2 + Math.floor(s(3) * (COLS - tw - 4));
    const ty = 2 + Math.floor(s(4) * (ROWS - th - 4));
    // Reject if overlaps safe spawn zone
    if (tx < safeTx+safeW && tx+tw > safeTx && ty < safeTy+safeH && ty+th > safeTy) continue;
    // Reject if too close to another obstacle
    let crowded = false;
    for (const o of obs) {
      if (tx < o.tx+o.tw+2 && tx+tw+2 > o.tx && ty < o.ty+o.th+2 && ty+th+2 > o.ty) {
        crowded = true; break;
      }
    }
    if (crowded) continue;
    obs.push({ type, tx, ty, tw, th });
  }
  return obs;
}

// ─── Obstacle collision grid ───────────────────────────────
let _wallGrid = null;

function buildWallGrid(obstacles, w, h) {
  const TILE = 32;
  const cols = Math.ceil(w / TILE) + 2;
  const rows = Math.ceil(h / TILE) + 2;
  const grid = new Uint8Array(cols * rows); // 0=open 1=wall/pit
  for (const obs of (obstacles || [])) {
    for (let ty = obs.ty; ty < obs.ty + obs.th; ty++) {
      for (let tx = obs.tx; tx < obs.tx + obs.tw; tx++) {
        if (tx >= 0 && tx < cols && ty >= 0 && ty < rows)
          grid[ty * cols + tx] = 1;
      }
    }
  }
  _wallGrid = { grid, cols, rows, TILE };
}

function isWallAt(x, y) {
  if (!_wallGrid) return false;
  const { grid, cols, rows, TILE } = _wallGrid;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return false;
  return grid[ty * cols + tx] > 0;
}

// Returns true if a circle at (x,y) with radius r overlaps any wall cell
function collidesWall(x, y, r) {
  return isWallAt(x, y) ||
         isWallAt(x + r, y) || isWallAt(x - r, y) ||
         isWallAt(x, y + r) || isWallAt(x, y - r);
}

// ── Flow field pathfinding (BFS from player, rebuilt when player moves a tile) ──
let _flowField    = null;  // { dirs: Float32Array, cols, rows, TILE }
let _flowPlayerTx = -1;
let _flowPlayerTy = -1;

function buildFlowField(px, py) {
  if (!_wallGrid) return;
  const { grid, cols, rows, TILE } = _wallGrid;
  const tx = Math.max(0, Math.min(cols - 1, (px / TILE) | 0));
  const ty = Math.max(0, Math.min(rows - 1, (py / TILE) | 0));
  _flowPlayerTx = tx;
  _flowPlayerTy = ty;

  const dist = new Int32Array(cols * rows).fill(-1);
  dist[ty * cols + tx] = 0;
  const queue = [ty * cols + tx];
  let head = 0;
  const NEIGH = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];

  while (head < queue.length) {
    const idx = queue[head++];
    const cy = (idx / cols) | 0, cx = idx % cols;
    for (const [dx, dy] of NEIGH) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const ni = ny * cols + nx;
      if (grid[ni] > 0 || dist[ni] >= 0) continue;
      dist[ni] = dist[idx] + 1;
      queue.push(ni);
    }
  }

  // For each passable cell, store the angle toward the player.
  // Use a separate Float32Array for validity (1 = valid direction, 0 = no direction).
  const dirs  = new Float32Array(cols * rows);   // angle in radians
  const valid = new Uint8Array(cols * rows);      // 1 if a direction exists
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const idx = cy * cols + cx;
      if (grid[idx] > 0 || dist[idx] < 0) continue;
      let best = dist[idx], bdx = 0, bdy = 0, found = false;
      for (const [dx, dy] of NEIGH) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const ni = ny * cols + nx;
        if (dist[ni] >= 0 && dist[ni] < best) { best = dist[ni]; bdx = dx; bdy = dy; found = true; }
      }
      if (found) { dirs[idx] = Math.atan2(bdy, bdx); valid[idx] = 1; }
      // else: goal tile itself — no direction needed, valid stays 0
    }
  }
  _flowField = { dirs, valid, cols, rows, TILE };
}

function getFlowAngle(x, y) {
  if (!_flowField) return null;
  const { dirs, valid, cols, rows, TILE } = _flowField;
  const tx = Math.max(0, Math.min(cols - 1, (x / TILE) | 0));
  const ty = Math.max(0, Math.min(rows - 1, (y / TILE) | 0));
  const idx = ty * cols + tx;
  return valid[idx] ? dirs[idx] : null;
}

function terrainHeightAt(x, y) {
  const w = Math.max(1, canvas.clientWidth  || 1280);
  const h = Math.max(1, canvas.clientHeight || 720);
  let height = 0;
  for (const f of (state?.terrainFeatures || terrainProto)) {
    const nx = (x - f.x*w) / (f.rx*w);
    const ny = (y - f.y*h) / (f.ry*h);
    const d  = nx*nx + ny*ny;
    if (d < 1) { const fo = Math.cos(d*Math.PI*.5); height += f.height*fo*fo; }
  }
  return Math.max(-24, Math.min(48, height));
}

function terrainZoneAt(x, y) { return null; } // zones replaced by obstacle walls/pits

function terrainSlopeAt(x, y) {
  const step = 16;
  return Math.hypot(
    terrainHeightAt(x+step,y) - terrainHeightAt(x-step,y),
    terrainHeightAt(x,y+step) - terrainHeightAt(x,y-step)
  ) / (step*2);
}

function settleOnTerrain(entity, dt, speed=12) {
  const target = terrainHeightAt(entity.x, entity.y);
  entity.z += (target - entity.z) * Math.min(1, dt*speed);
}

function screenY(entity) { return entity.y - (entity.z || 0); }

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = 1;
  canvas.width  = Math.floor(rect.width  * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ═══════════════════════════════════════════════════════════
//  EVOLUTION SYSTEM
// ═══════════════════════════════════════════════════════════
function addEvolutionScore(buildType, amount) {
  if (!state || !state.evolution) return;
  const ev = state.evolution;
  ev[buildType] = Math.min(100, (ev[buildType]||0) + amount);
  recalcEvolution();
}

function recalcEvolution() {
  const ev = state.evolution;
  const scores = { strength:ev.strength, speed:ev.speed, corrupt:ev.corrupt, tank:ev.tank, crit:ev.crit };
  let best = "none", bestScore = 0;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) { bestScore = v; best = k; }
  }
  ev.dominant = best;

  // overall phase: 0 (0-24), 1 (25-49), 2 (50-74), 3 (75-100)
  ev.phase = bestScore < 25 ? 0 : bestScore < 50 ? 1 : bestScore < 75 ? 2 : 3;

  const t = bestScore / 100;

  // Strength: bigger body, more muscle
  if (best === "strength") {
    ev.bodyScale    = 1 + t * 0.85;
    ev.spikeCount   = 0;
    ev.extraEyes    = 0;
    ev.phantomArms  = 0;
    ev.armorShards  = 0;
    ev.glowVeins    = 0;
    ev.energyRings  = 0;
    ev.corruptOrbs  = 0;
  }
  // Speed: phantom arms, afterimage intensity
  else if (best === "speed") {
    ev.bodyScale    = 1;
    ev.phantomArms  = Math.floor(t * 6);
    ev.spikeCount   = 0;
    ev.extraEyes    = 0;
    ev.armorShards  = 0;
    ev.glowVeins    = 0;
    ev.energyRings  = 0;
    ev.corruptOrbs  = 0;
  }
  // Corrupt: spikes, glowing veins, extra eyes, floating orbs, body distortion
  else if (best === "corrupt") {
    ev.bodyScale    = 1 + Math.sin(t * Math.PI) * 0.15; // warped
    ev.spikeCount   = Math.floor(t * 8);
    ev.extraEyes    = Math.floor(t * 5);
    ev.glowVeins    = t;
    ev.corruptOrbs  = Math.floor(t * 6);
    ev.phantomArms  = 0;
    ev.armorShards  = 0;
    ev.energyRings  = 0;
  }
  // Tank: armor plates, heavy look
  else if (best === "tank") {
    ev.bodyScale    = 1 + t * 0.45;
    ev.armorShards  = Math.floor(t * 7);
    ev.spikeCount   = 0;
    ev.extraEyes    = 0;
    ev.phantomArms  = 0;
    ev.glowVeins    = 0;
    ev.energyRings  = 0;
    ev.corruptOrbs  = 0;
  }
  // Crit: energy rings, unstable aura, time-slow flash
  else if (best === "crit") {
    ev.bodyScale    = 1;
    ev.energyRings  = Math.floor(t * 4);
    ev.spikeCount   = 0;
    ev.extraEyes    = 0;
    ev.phantomArms  = 0;
    ev.armorShards  = 0;
    ev.glowVeins    = 0;
    ev.corruptOrbs  = 0;
  }

  updateEvolveBar();
}

function updateEvolveBar() {
  if (!ui.evolveBar || !state) return;

  // ── Route mode: show route tier progress once a route is locked ──
  if (state.buildRoute) {
    const route = BUILD_ROUTES?.find(r => r.id === state.buildRoute);
    const tier  = state.buildRouteTier || 0;
    const MAX_TIER = 4;
    const pct   = (tier / MAX_TIER) * 100;

    ui.evolveBar.style.width      = `${pct}%`;
    ui.evolveBar.style.background = route?.color || '#888';

    const tierDots = Array.from({length: MAX_TIER}, (_, i) =>
      i < tier ? '◆' : '◇'
    ).join(' ');

    const nextRounds = [5, 10, 15, 20];
    const nextAt = nextRounds[tier] ?? '—';
    const nextHint = tier < MAX_TIER
      ? ` <span style="opacity:.45;font-size:10px">→ 第${nextAt}关</span>` : '';

    if (ui.evolveText) {
      ui.evolveText.innerHTML =
        `${route?.icon || ''} ${route?.name || ''} `
        + `<span style="opacity:.65">${tierDots}</span>`
        + ` Lv.${tier}${nextHint}`;
    }
    return;
  }

  // ── Default: evolution phase mode ───────────────────────────────
  const ev = state.evolution;
  const score = ev[ev.dominant] || 0;
  ui.evolveBar.style.width      = `${score}%`;
  ui.evolveBar.style.background = '';   // let CSS handle it
  const labels = { none:"无变异", strength:"力量流", speed:"攻速流",
                   corrupt:"腐化流", tank:"坦克流", crit:"暴击流" };
  const phaseLabel = ["初现端倪","身体异化","难以压制","失控进化"][ev.phase];
  if (ui.evolveText) {
    ui.evolveText.textContent = `${labels[ev.dominant] || "无变异"} · ${phaseLabel}`;
  }
}

// ═══════════════════════════════════════════════════════════
// ─── Sprite System ─────────────────────────────────────────
const SPRITE_DEFS = {
  // ── Player ──────────────────────────────────────────────
  hero: {
    base: 'sprites/Human_Soldier_Sword_Shield/No_Shadows/Human_Soldier_Sword_Shield',
    frames: { Idle:6, Walk:8, Attack1:8, Attack2:8, Hurt:4, Death:10, Block:6, Jump_Fall:6 }
  },
  knight: {  // Terrible Knight — Tank (128×96/frame)
    base: 'sprites/TK',
    frames: { Idle:4, Walk:12, Attack1:6, Hurt:3, Jump_Fall:4 },
    files:  { Idle:'idle', Walk:'run', Attack1:'attack', Hurt:'hurt', Jump_Fall:'jump' }
  },
  heroine: { // Bridge Heroine — Assassin (duelist)
    base: 'sprites/heroine',
    frames: { Idle:4, Walk:7, Attack1:5, Jump_Fall:4 },
    files:  { Idle:'idle', Walk:'run', Attack1:'attack', Jump_Fall:'jump' }
  },
  wizard: {  // TinyRPG Wizard — Mage (single spritesheet, 6 frames)
    base: 'sprites/wizard',
    frames: { Idle:6, Walk:6, Attack1:6 },
    files:  { Idle:'wizard-sheet', Walk:'wizard-sheet', Attack1:'wizard-sheet' }
  },
  // ── Enemies ─────────────────────────────────────────────
  hound: {   // Normal — Hell-Hound (64×48/frame)
    base: 'sprites/hound',
    frames: { Idle:11, Walk:12, Attack1:5 },
    files:  { Idle:'idle', Walk:'walk', Attack1:'run' }
  },
  eye: {     // Archer — Flying-Eye-Demon (48×48/frame)
    base: 'sprites/eye',
    frames: { Idle:8, Walk:8, Attack1:8 },
    files:  { Idle:'fly', Walk:'fly', Attack1:'fly' }
  },
  ogre: {    // Elite — Ogre (144×80/frame)
    base: 'sprites/ogre',
    frames: { Idle:4, Walk:6, Attack1:7 },
    files:  { Idle:'idle', Walk:'walk', Attack1:'attack' }
  },
  dragon: {  // Boss — Dragon (144×64/frame)
    base: 'sprites/dragon',
    frames: { Idle:6, Walk:6, Attack1:7 },
    files:  { Idle:'idle', Walk:'idle', Attack1:'breath' }
  },
  slime: {   // Stage 1 Normal — Monster Slime
    base: 'sprites/Monster_Slime/No_Shadows/Monster_Slime',
    frames: { Idle:4, Walk:8, Attack1:4, Hurt:4, Death:4 }
  },
  freeknight: { // Stage boss — Free Knight (120×80/frame)
    base: 'sprites/freeknight',
    frames: { Idle:10, Walk:10, Attack1:4, Attack2:6, Death:10 },
    files:  { Idle:'_Idle', Walk:'_Run', Attack1:'_Attack', Attack2:'_Attack2', Death:'_Death' }
  }
};

// ─── Sound Effects (Web Audio API — procedural, no files) ──
let _sfxCtx = null;
let _sfxMuted = false;

function getSfxCtx() {
  if (!_sfxCtx) {
    try { _sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return null; }
  }
  return _sfxCtx;
}

function playSound(type) {
  if (_sfxMuted) return;
  const ac = getSfxCtx();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    switch (type) {
      case 'shoot': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'square'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(520, t);
        o.frequency.exponentialRampToValueAtTime(90, t + 0.07);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.start(t); o.stop(t + 0.08); break;
      }
      case 'hit': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(900, t);
        o.frequency.exponentialRampToValueAtTime(180, t + 0.07);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        o.start(t); o.stop(t + 0.09); break;
      }
      case 'playerHurt': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.start(t); o.stop(t + 0.2); break;
      }
      case 'enemyDeath': {
        // white-noise pop
        const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = ac.createBufferSource(), g = ac.createGain();
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500;
        src.buffer = buf; src.connect(f); f.connect(g); g.connect(ac.destination);
        g.gain.value = 0.22; src.start(t); break;
      }
      case 'eliteDeath': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(60, t + 0.22);
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t); o.stop(t + 0.25); break;
      }
      case 'bossDeath': {
        for (let i = 0; i < 4; i++) setTimeout(() => {
          if (!ac) return;
          const ct = ac.currentTime;
          const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.35), ac.sampleRate);
          const d = buf.getChannelData(0);
          for (let j = 0; j < d.length; j++) d[j] = (Math.random()*2-1) * Math.pow(1 - j/d.length, 0.4);
          const src = ac.createBufferSource(), g = ac.createGain();
          const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
          src.buffer = buf; src.connect(f); f.connect(g); g.connect(ac.destination);
          g.gain.value = 0.5; src.start(ct);
        }, i * 120); break;
      }
      case 'coin': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(1100, t);
        o.frequency.exponentialRampToValueAtTime(1650, t + 0.05);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22); break;
      }
      case 'levelUp': {
        [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => {
          if (!ac) return; const ct = ac.currentTime;
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.connect(g); g.connect(ac.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.18, ct);
          g.gain.exponentialRampToValueAtTime(0.001, ct + 0.18);
          o.start(ct); o.stop(ct + 0.18);
        }, i * 75)); break;
      }
      case 'dash': {
        const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.11), ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
        const src = ac.createBufferSource(), g = ac.createGain();
        const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
        src.buffer = buf; src.connect(f); f.connect(g); g.connect(ac.destination);
        g.gain.value = 0.28; src.start(t); break;
      }
      case 'bossRoar': {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(60, t);
        o.frequency.exponentialRampToValueAtTime(35, t + 0.6);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        o.start(t); o.stop(t + 0.7); break;
      }
    }
  } catch(e) {}
}

// Per-sprite enemy rendering config (size px, y-offset, HP bar colour)
const ENEMY_SPRITE_INFO = {
  hound:  { size:150, yOff:10, hpColor:'#b84434' },
  eye:    { size:120, yOff:8,  hpColor:'#8844cc' },
  ogre:   { size:190, yOff:16, hpColor:'#d69a3a' },
  slime:  { size: 90, yOff:4,  hpColor:'#54a832' },
  wizard: { size:110, yOff:6,  hpColor:'#aa44cc' },
  hero:   { size:150, yOff:10, hpColor:'#c87030' },
  knight: { size:170, yOff:12, hpColor:'#505090' },
};
const SPRITES = {};
let spritesReady = false;

function preloadSprites(onDone) {
  let total = 0, loaded = 0;
  for (const [key, def] of Object.entries(SPRITE_DEFS)) {
    for (const anim of Object.keys(def.frames)) {
      total++;
      const img = new Image();
      SPRITES[`${key}_${anim}`] = img;
      img.onload = img.onerror = () => {
        if (++loaded === total) { spritesReady = true; onDone && onDone(); }
      };
      // If def.files exists, use per-animation filenames; otherwise use base_anim-Sheet.png
      if (def.files) {
        img.src = `${def.base}/${def.files[anim]}.png`;
      } else {
        img.src = `${def.base}_${anim}-Sheet.png`;
      }
    }
  }
}

// drawSprite: feet of character land at (x, y) in current transform space
// size = render height; width scales automatically to preserve aspect ratio
function drawSprite(key, animName, frame, x, y, size, flipX, alpha) {
  const img = SPRITES[`${key}_${animName}`];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const def = SPRITE_DEFS[key];
  if (!def || !def.frames[animName]) return false;
  const frameCount = def.frames[animName];
  const fw = img.naturalWidth / frameCount;
  const fh = img.naturalHeight;
  const f = Math.floor(frame) % frameCount;
  // preserve aspect ratio: scale width proportionally to height
  const dh = size;
  const dw = size * (fw / fh);
  ctx.save();
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flipX) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, f * fw, 0, fw, fh, -dw / 2, -dh, dw, dh);
  ctx.restore();
  return true;
}

function initAnim(name = 'Idle') {
  return { name, frame: 0, timer: 0, fps: 10, flipX: false, attackFlash: 0, hurtFlash: 0 };
}

function stepAnim(anim, dt) {
  if (anim.attackFlash > 0) anim.attackFlash -= dt;
  if (anim.hurtFlash > 0) anim.hurtFlash -= dt;
  anim.timer += dt;
  if (anim.timer >= 1 / anim.fps) {
    anim.frame++;
    anim.timer = 0;
  }
}

// ═══════════════════════════════════════════════════════════
// ─── Pixel-art body (Stardew Valley style) ────────────────
function drawPixelBody(dom, phase, isInvuln, t, isMoving) {
  const W = "rgba(255,255,255,.72)";

  const skin    = isInvuln ? W : "#f0a060";
  const hair    = isInvuln ? W : "#7a3010";
  const outline = isInvuln ? "rgba(0,0,0,.15)" : "rgba(28,8,2,.60)";

  const shirtMap  = { speed:"#1e70c0", tank:"#2a5828", corrupt:"#680890", strength:"#b43010", crit:"#b88810" };
  const shirtDMap = { speed:"#0d4890", tank:"#162e14", corrupt:"#3c0450", strength:"#761a08", crit:"#745808" };
  const shirt  = isInvuln ? W : (shirtMap[dom]  || "#c02820");
  const shirtD = isInvuln ? W : (shirtDMap[dom] || "#801a10");
  const jeans  = isInvuln ? W : "#3060a0";
  const boots  = isInvuln ? W : "#6b3010";
  const belt   = isInvuln ? W : "#3a2008";
  const buckle = isInvuln ? W : "#b89010";

  // Walking stride — legs/arms swing horizontally (isometric stride)
  const stride  = isMoving ? Math.sin(t * 10) : 0;
  const lLeg = stride * 4;    // left leg x offset
  const rLeg = -stride * 4;   // right leg x offset (opposite)
  const lArm = -stride * 3;   // left arm swings opposite to left leg
  const rArm =  stride * 3;   // right arm swings opposite to right leg

  function r(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = outline; ctx.lineWidth = 0.9;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  // ── Hair ──────────────────────────────────────────────────
  r(-8,  -54, 16, 4, hair);   // top poof
  r(-12, -50,  5, 7, hair);   // left sideburn
  r(  7, -50,  5, 7, hair);   // right sideburn

  // ── Face ──────────────────────────────────────────────────
  r(-8, -50, 16, 16, skin);   // face block

  // Eyes (drawn here only when not replaced by glow overlay)
  if (!(dom === "speed" && phase >= 1) && !(dom === "corrupt" && phase >= 1)) {
    ctx.fillStyle = "#241008";
    ctx.fillRect(-5, -44, 3, 4);
    ctx.fillRect( 2, -44, 3, 4);
  }

  // ── Neck ──────────────────────────────────────────────────
  r(-4, -34, 8, 4, skin);

  // ── Shirt / Torso ─────────────────────────────────────────
  r(-11, -34, 22, 20, shirt);
  // V-collar
  ctx.fillStyle = skin; ctx.fillRect(-4, -34, 8, 6); ctx.fillRect(-3, -28, 6, 2);
  // Button placket
  ctx.fillStyle = shirtD; ctx.fillRect(-1.5, -28, 3, 14);

  // ── Arms ──────────────────────────────────────────────────
  r(-17 + lArm, -32,  6, 14, shirt); // left arm
  r( 11 + rArm, -32,  6, 14, shirt); // right arm
  r(-17 + lArm, -18,  5,  6, skin);  // left hand
  r( 12 + rArm, -18,  5,  6, skin);  // right hand

  // ── Belt ──────────────────────────────────────────────────
  r(-11, -14, 22, 4, belt);
  r( -3, -14,  6, 4, buckle);

  // ── Jeans ─────────────────────────────────────────────────
  r(-11 + lLeg, -10, 10, 18, jeans);  // left leg
  r(  1 + rLeg, -10, 10, 18, jeans);  // right leg

  // ── Boots ─────────────────────────────────────────────────
  r(-12 + lLeg, 8, 12, 5, boots);   // left boot
  r(  0 + rLeg, 8, 12, 5, boots);   // right boot
}

//  DRAWING — PLAYER WITH FLESH EVOLUTION
// ═══════════════════════════════════════════════════════════
function drawPlayer(chapter) {
  const p   = state.player;
  const ev  = state.evolution;
  const sy  = screenY(p);
  const t   = performance.now() * 0.001;

  ev.pulseT = t;

  const sc      = ev.bodyScale;
  const dom     = ev.dominant;
  const phase   = ev.phase;
  const isMoving = !!(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||
                      keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight);
  const bob = isMoving ? Math.abs(Math.sin(t * 10)) * 1.2 : 0;

  // ── Shadow ──────────────────────────────────────────────
  const shadowAlpha = p.invuln > 0 ? 0.1 : Math.max(0.15, 0.32 - Math.max(0, p.z) * 0.004);
  const shadowScale = dom === "strength" ? sc : 1;
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 12, (28 + Math.max(0,p.z)*.12) * shadowScale, 10 * shadowScale, 0, 0, Math.PI*2);
  ctx.fill();

  // ── SPEED: Phantom arms (behind player) ─────────────────
  if (dom === "speed" && ev.phantomArms > 0) {
    for (let a = 0; a < ev.phantomArms; a++) {
      const angleOff = (a / ev.phantomArms) * Math.PI * 2 + t * 3;
      const dist = 12 + a * 5;
      const ax = p.x + Math.cos(angleOff) * dist;
      const ay = sy + bob + Math.sin(angleOff) * dist * 0.4;
      const alpha = 0.12 + (ev.phantomArms - a) / ev.phantomArms * 0.25;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#8fb36a";
      ctx.beginPath();
      ctx.ellipse(ax, ay - 18, 13, 20, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#80f0ff";
      ctx.beginPath();
      ctx.ellipse(ax, ay - 33, 9, 12, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── CORRUPT: Orbiting corruption orbs ───────────────────
  if (dom === "corrupt" && ev.corruptOrbs > 0) {
    for (let o = 0; o < ev.corruptOrbs; o++) {
      const angle = (o / ev.corruptOrbs) * Math.PI * 2 + t * 1.4;
      const orbitR = 38 + Math.sin(t * 2 + o) * 8;
      const ox = p.x + Math.cos(angle) * orbitR;
      const oy = sy + bob + Math.sin(angle) * orbitR * 0.45;
      const orbSize = 4 + Math.sin(t * 3 + o) * 2;
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = "#9900ff";
      ctx.shadowColor = "#cc44ff";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(ox, oy, orbSize, orbSize, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── CRIT: Unstable energy rings ──────────────────────────
  if (dom === "crit" && ev.energyRings > 0) {
    for (let r = 0; r < ev.energyRings; r++) {
      const ringPhase = (t * (1.5 + r * 0.4) + r * 0.9) % (Math.PI * 2);
      const ringR = 24 + r * 10;
      const alpha = 0.15 + Math.abs(Math.sin(ringPhase)) * 0.45;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ffee22";
      ctx.lineWidth = 1.5 + Math.abs(Math.sin(ringPhase)) * 2;
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(p.x, sy + bob, ringR, ringR * 0.4, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Main Body ────────────────────────────────────────────
  ctx.save();
  ctx.translate(p.x, sy + bob);

  // Corrupt body distortion: warped scale
  const warpX = dom === "corrupt" ? 1 + Math.sin(t*2.1)*0.04*phase : 1;
  const warpY = dom === "corrupt" ? 1 + Math.cos(t*1.7)*0.04*phase : 1;

  ctx.scale(sc * warpX, sc * warpY);

  // ── STRENGTH: Ground crack effect under body ─────────────
  if (dom === "strength" && phase >= 2) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#ff6020";
    ctx.lineWidth = 2;
    for (let c = 0; c < 5; c++) {
      const ang = (c / 5) * Math.PI * 2 + Math.PI * 0.25;
      const len = (15 + c * 4) * (sc - 0.8);
      ctx.beginPath();
      ctx.moveTo(0, 13);
      ctx.lineTo(Math.cos(ang) * len, 13 + Math.sin(ang) * len * 0.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Body (sprite → pixel-art fallback) ─────────────────
  if (dom === "strength" && phase >= 1) ctx.scale(1 + phase * 0.08, 1);
  const _spriteAlpha = p.invuln > 0 ? 0.45 : 1;
  const _spriteAnim  = p.anim?.name || 'Idle';
  const _spriteFrame = p.anim?.frame || 0;
  const _spriteFlip  = p.anim?.flipX || false;
  const _pKey  = state.classId === 'duelist' ? 'heroine'
               : state.classId === 'mage'    ? 'wizard'
               : 'knight';
  // Per-class render size (heroine is 2:1 wide → smaller height keeps proportions tight)
  const _pSize = state.classId === 'duelist' ? 100
               : state.classId === 'mage'    ? 130
               : 130;
  const _spriteDrawn = spritesReady &&
    drawSprite(_pKey, _spriteAnim, _spriteFrame, 0, 13, _pSize, _spriteFlip, _spriteAlpha);
  if (!_spriteDrawn) drawPixelBody(dom, phase, p.invuln > 0, t, isMoving);
  if (dom === "strength" && phase >= 1) ctx.scale(1 / (1 + phase * 0.08), 1);

  // ── TANK: Armor shards on shirt ─────────────────────────
  if (dom === "tank" && ev.armorShards > 0) {
    ctx.save();
    ctx.fillStyle = "#2a4a2a";
    ctx.strokeStyle = "#7ca85a";
    ctx.lineWidth = 1;
    for (let s = 0; s < Math.min(ev.armorShards, 6); s++) {
      const ang = (s / ev.armorShards) * Math.PI - Math.PI * 0.5;
      const sx2 = Math.cos(ang) * 16;
      const sy2 = -22 + Math.sin(ang) * 12;
      const shardW = 5 + s * 0.8;
      const shardH = 8 + s;
      ctx.beginPath();
      ctx.moveTo(sx2, sy2 - shardH);
      ctx.lineTo(sx2 + shardW * 0.5, sy2);
      ctx.lineTo(sx2, sy2 + shardH * 0.3);
      ctx.lineTo(sx2 - shardW * 0.5, sy2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── CORRUPT: Extra eyes on head ──────────────────────────
  if (dom === "corrupt" && ev.extraEyes > 0) {
    for (let e = 0; e < ev.extraEyes; e++) {
      const ex = (e - ev.extraEyes * 0.5 + 0.5) * 5;
      const ey = -50 - e * 3;
      const blink = Math.sin(t * (1.2 + e * 0.7)) > 0.85;
      ctx.fillStyle = blink ? "#ffffff" : "#ff00aa";
      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 2.5, blink ? 0.5 : 3.5, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── SPEED: Flowing scarf trail ──────────────────────────
  if (dom === "speed" && phase >= 1) {
    ctx.save();
    ctx.lineCap = "round";
    const waveAmp = 5 + phase * 3;
    ctx.strokeStyle = "#60e8ff";
    ctx.lineWidth = 3 - phase * 0.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    for (let si = 1; si <= 8; si++) {
      ctx.lineTo(-4 - si * 5, -22 + Math.sin(t * 8 + si * 0.9) * waveAmp);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#b0f8ff";
    ctx.beginPath();
    ctx.moveTo(0, -27);
    for (let si = 1; si <= 8; si++) {
      ctx.lineTo(-4 - si * 5, -27 + Math.sin(t * 8 + si * 0.9 + 1.2) * waveAmp);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── CORRUPT: Floating rune symbols ──────────────────────
  if (dom === "corrupt" && phase >= 2) {
    const runes = ["ᚦ", "ᚹ", "ᛗ", "ᚾ", "ᚱ"];
    ctx.save();
    ctx.font = "bold 11px serif";
    ctx.textAlign = "center";
    const runeCount = Math.min(phase + 1, runes.length);
    for (let ri = 0; ri < runeCount; ri++) {
      const angle = (ri / runeCount) * Math.PI * 2 + t * 0.55;
      const orbitR = 46 + Math.sin(t * 1.8 + ri) * 8;
      const rx2 = Math.cos(angle) * orbitR;
      const ry2 = -20 + Math.sin(angle) * orbitR * 0.42;
      ctx.globalAlpha = 0.55 + Math.sin(t * 2.2 + ri) * 0.25;
      ctx.fillStyle = "#cc44ff";
      ctx.shadowColor = "#9900ff";
      ctx.shadowBlur = 0;
      ctx.fillText(runes[ri], rx2, ry2);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Eyes (glowing overlay for evolved builds — normal eyes drawn in drawPixelBody)
  if (dom === "speed" && phase >= 1) {
    ctx.save();
    ctx.fillStyle = "#8fb36a";
    ctx.shadowColor = "#8fb36a";
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(-3.5, -42, 4, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 3.5, -42, 4, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (dom === "corrupt" && phase >= 1) {
    ctx.save();
    ctx.fillStyle = "#ff00aa";
    ctx.shadowColor = "#ff00aa";
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(-3.5, -42, 4, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 3.5, -42, 4, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── CORRUPT: Body spikes ─────────────────────────────────
  if (dom === "corrupt" && ev.spikeCount > 0) {
    ctx.save();
    ctx.fillStyle = "#660088";
    ctx.strokeStyle = "#cc00ff";
    ctx.lineWidth = 0.5;
    for (let s = 0; s < ev.spikeCount; s++) {
      const ang = (s / ev.spikeCount) * Math.PI * 2 + t * 0.2;
      const radOff = 18 + Math.sin(t * 1.5 + s) * 2;
      const spikeLen = 8 + s * 1.5 + Math.sin(t * 2 + s) * 3;
      const bx = Math.cos(ang) * radOff;
      const by = -18 + Math.sin(ang) * 14;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang) * spikeLen, by + Math.sin(ang) * spikeLen * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── CORRUPT: Glowing veins ───────────────────────────────
  if (dom === "corrupt" && ev.glowVeins > 0.1) {
    const veinAlpha = ev.glowVeins * (0.5 + Math.sin(t * 2) * 0.25);
    ctx.save();
    ctx.strokeStyle = `rgba(180,0,255,${veinAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "#aa00ff";
    ctx.shadowBlur = 0;
    // vein paths along torso
    ctx.beginPath();
    ctx.moveTo(-8, -8); ctx.bezierCurveTo(-14, -18, -10, -28, -6, -35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -8); ctx.bezierCurveTo(14, -18, 10, -28, 6, -35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -5); ctx.bezierCurveTo(-8, -14, 0, -22, 4, -30);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── STRENGTH: Muscle lines ───────────────────────────────
  if (dom === "strength" && phase >= 1) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,100,20,${0.2 + phase * 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(-14, -22); ctx.lineTo(-9, -28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -10); ctx.lineTo(14, -22); ctx.lineTo(9, -28);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // end main body transform

  // ── Dog ──────────────────────────────────────────────────
  const dog    = state.dog;
  const dogSc  = dog ? dog.scale : 1.0;
  const petX   = p.x + Math.cos(state.pet.angle) * 54;
  const petY   = p.y + Math.sin(state.pet.angle) * 28;
  const petZ   = terrainHeightAt(petX, petY);
  const petSY  = petY - petZ;
  const petColor = dom === "corrupt" ? "#cc44ff" :
                   dom === "speed"   ? "#40e0ff" :
                   dom === "crit"    ? "#ffcc22" : "#c8903a";
  const petDark  = dom === "corrupt" ? "#7722aa" :
                   dom === "speed"   ? "#1a90bb" :
                   dom === "crit"    ? "#aa8800" : "#7a4e18";

  if (dog && dogHas("collar")) {
    for (const pt of dog.trailPts) {
      const a = pt.life / 0.35;
      ctx.save();
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = "#ff2020";
      ctx.beginPath(); ctx.ellipse(pt.x, pt.y - petZ, 8 * dogSc, 5 * dogSc, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  if (dog && dog.teleportFx > 0) {
    ctx.save();
    ctx.globalAlpha = dog.teleportFx * 0.7;
    ctx.fillStyle = "#8844ff";
    ctx.shadowColor = "#8844ff"; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(petX, petSY, 18 * dogSc, 14 * dogSc, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  if (dog) {
    for (const sp of dog.soulPts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha) * 0.8;
      ctx.fillStyle = "#78f3ce";
      ctx.shadowColor = "#78f3ce"; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(petX, petSY);
  const petGlow = phase >= 2 || (dog && dogHas("collar") && dog.comboCount > 3);
  if (petGlow) { ctx.shadowColor = petColor; ctx.shadowBlur = 0; }

  const dogT      = t;
  const wag       = Math.sin(dogT * 6) * 0.45;
  const dogStride = Math.sin(dogT * 9) * 2.5;

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath(); ctx.ellipse(0, 9 * dogSc, 13 * dogSc, 4 * dogSc, 0, 0, Math.PI*2); ctx.fill();

  if (dog && dogHas("vest")) {
    const af = Math.max(0, dog.armorFlash || 0);
    ctx.save();
    ctx.globalAlpha = 0.7 + af * 0.3;
    ctx.fillStyle = af > 0.2 ? "#ffee44" : "#8899aa";
    ctx.strokeStyle = "#ddeeff"; ctx.lineWidth = 1;
    ctx.fillRect(-8 * dogSc - 2, -4 * dogSc - 2, 16 * dogSc + 4, 12 * dogSc + 4);
    ctx.restore();
  }

  ctx.fillStyle = petDark;
  ctx.fillRect((-8 + dogStride) * dogSc, 4 * dogSc, 4 * dogSc, 6 * dogSc);
  ctx.fillRect((-2 - dogStride) * dogSc, 4 * dogSc, 4 * dogSc, 6 * dogSc);
  ctx.fillRect(( 2 + dogStride) * dogSc, 4 * dogSc, 4 * dogSc, 6 * dogSc);
  ctx.fillRect(( 6 - dogStride) * dogSc, 4 * dogSc, 4 * dogSc, 6 * dogSc);

  if (dog && dogHas("core") && dogSc > 1.4 && Math.abs(dogStride) < 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#ff8020"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 9 * dogSc, 18 * dogSc, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = petColor;
  ctx.beginPath(); ctx.ellipse(0, -1 * dogSc, 12 * dogSc, 7 * dogSc, 0, 0, Math.PI*2); ctx.fill();

  if (dog && dogHas("chain")) {
    ctx.save();
    ctx.globalAlpha = 0.45 + Math.sin(dogT * 3) * 0.2;
    ctx.fillStyle = "#1a001a";
    for (let sc2 = 0; sc2 < 3; sc2++) {
      const sw = Math.sin(dogT * 4 + sc2 * 2.1) * 6 * dogSc;
      ctx.beginPath(); ctx.ellipse(sw, (-5 - sc2 * 4) * dogSc, 3 * dogSc, 4 * dogSc, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(11 * dogSc, -3 * dogSc);
  ctx.rotate(-Math.PI * 0.25 + wag * (dog && dogHas("collar") ? 1 + dog.comboCount * 0.2 : 1));
  ctx.fillStyle = petColor;
  ctx.beginPath(); ctx.ellipse(0, -5 * dogSc, 3 * dogSc, 6 * dogSc, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = petColor;
  ctx.beginPath(); ctx.ellipse(-10 * dogSc, -3 * dogSc, 7 * dogSc, 7 * dogSc, 0, 0, Math.PI*2); ctx.fill();

  if (dog && dogHas("mask")) {
    ctx.save();
    ctx.strokeStyle = "#ff3030"; ctx.lineWidth = 1.5 * dogSc;
    ctx.shadowColor = "#ff3030"; ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-13 * dogSc, -1 * dogSc, 3 * dogSc, 0, Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.fillStyle = petDark;
  ctx.beginPath(); ctx.ellipse(-13 * dogSc, 2 * dogSc, 3 * dogSc, 6 * dogSc, Math.PI * 0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-7  * dogSc, 2 * dogSc, 3 * dogSc, 6 * dogSc, -Math.PI * 0.18, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = "#e09050";
  ctx.beginPath(); ctx.ellipse(-15 * dogSc, -2 * dogSc, 4 * dogSc, 3 * dogSc, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = "#2a1008";
  ctx.beginPath(); ctx.ellipse(-16 * dogSc, -3 * dogSc, 2 * dogSc, 1.5 * dogSc, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = (dog && dogHas("chain")) ? "#ff0020" : "#1a1008";
  ctx.shadowColor = (dog && dogHas("chain")) ? "#ff0020" : "transparent";
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-9 * dogSc, -5 * dogSc, 1.8 * dogSc, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-8.4 * dogSc, -5.6 * dogSc, 0.8 * dogSc, 0, Math.PI*2); ctx.fill();

  if (dog && dogHas("collar") && dog.comboCount > 0) {
    const ci = dog.comboCount / 8;
    ctx.save();
    ctx.strokeStyle = `rgba(255,${Math.round(50*(1-ci))},0,0.9)`;
    ctx.lineWidth = 2 * dogSc;
    ctx.shadowColor = "#ff2000"; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(-10 * dogSc, -3 * dogSc, 8 * dogSc, Math.PI * 0.4, Math.PI * 1.6);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  if (dog && dogHas("vest")) {
    ctx.save();
    ctx.fillStyle = "#a0b8c8";
    ctx.strokeStyle = "#ddeeff"; ctx.lineWidth = 0.8;
    ctx.fillRect(-5 * dogSc, -6 * dogSc, 5 * dogSc, 4 * dogSc);
    ctx.strokeRect(-5 * dogSc, -6 * dogSc, 5 * dogSc, 4 * dogSc);
    ctx.fillRect(0 * dogSc, -6 * dogSc, 5 * dogSc, 4 * dogSc);
    ctx.strokeRect(0 * dogSc, -6 * dogSc, 5 * dogSc, 4 * dogSc);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  if (state.pet.pulse > 0) {
    ctx.strokeStyle = `rgba(120,243,206,${state.pet.pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, sy, 210 * (1 - state.pet.pulse * 0.35), 0, Math.PI*2);
    ctx.stroke();
  }

  // ── CRIT: Time-slow flash on crit hit ────────────────────
  if (ev.critFlash > 0) {
    ctx.save();
    ctx.globalAlpha = ev.critFlash * 0.25;
    ctx.fillStyle = "#ffee44";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.restore();
  }
}

function getBodyColor(dom, phase, t) {
  if (dom === "strength") {
    const r = Math.floor(220 + phase * 20);
    const g = Math.floor(160 - phase * 40);
    return `rgb(${r},${g},100)`;
  }
  if (dom === "speed")   return "#b0f0ff";
  if (dom === "corrupt") {
    const pulse = 0.5 + Math.sin(t * 3) * 0.3;
    const r = Math.floor(140 + phase * 30 * pulse);
    return `rgb(${r},60,${180 + phase * 20})`;
  }
  if (dom === "tank")    return "#b0d4b0";
  if (dom === "crit")    return "#ffffb0";
  return "#eaf2ff";
}

function getHeadColor(dom, phase) {
  if (dom === "strength") return "#e0a060";
  if (dom === "speed")    return "#80e0ff";
  if (dom === "corrupt")  return "#9040b0";
  if (dom === "tank")     return "#80c080";
  if (dom === "crit")     return "#ffee80";
  return `hsl(210,35%,${75 - phase*8}%)`;
}

// ─── Afterimage ───────────────────────────────────────────
function drawAfterimage(image) {
  const sy = screenY(image);
  ctx.save();
  ctx.globalAlpha = Math.max(0, image.life * 0.45);
  ctx.imageSmoothingEnabled = false;
  px(image.x - 10, sy - 34, 20, 26, '#6e5a36');
  px(image.x - 8, sy - 48, 16, 14, '#9a7b4a');
  px(image.x - 13, sy - 18, 8, 12, '#4a3824');
  px(image.x + 5, sy - 18, 8, 12, '#4a3824');
  ctx.restore();
}

function drawEnemy(enemy, chapter) {
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const sy = screenY(enemy);
  const lift = Math.round(Math.sin(enemy.wobble) * 2);
  const t = performance.now() * 0.001 + enemy.wobble;
  const dir = Math.sign(Math.cos(t * 1.7)) || 1;
  drawPixelShadow(enemy.x, enemy.y + enemy.r * 0.45, enemy.r * 1.7, enemy.r * 0.42, 0.28);

  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(sy + lift));
  ctx.imageSmoothingEnabled = false;

  if (enemy.kind === 'boss') {
    const _bAnim  = enemy.anim?.attackFlash > 0 ? 'Attack1' : 'Idle';
    const _bFrame = enemy.anim?.frame || 0;
    // Per-stage boss sprite (freeknight or dragon)
    const _bKey   = enemy.spriteKey || 'dragon';
    const _bSize  = _bKey === 'freeknight' ? 240 : 220;
    const _bYOff  = _bKey === 'freeknight' ? 0   : 20;
    if (spritesReady && drawSprite(_bKey, _bAnim, _bFrame, 0, _bYOff, _bSize, false, 1)) {
      ctx.restore();
      const bw = enemy.r * 3.5;
      drawTinyHpBar(enemy.x, sy - enemy.r * 2.4, bw, hpPct, '#c6423d');
      ctx.font = "700 13px 'Courier New', monospace";
      ctx.fillStyle = '#e8d0a0'; ctx.textAlign = 'center';
      ctx.fillText('★ BOSS ★', enemy.x, sy - enemy.r * 2.7);
      return;
    }
    // pixel-art fallback — dark armored warlord
    const bt = performance.now() * 0.001;
    const bpulse = Math.sin(bt * 2.2) * 0.18 + 0.82; // glow pulse
    // Cape / cloak (wide, dark purple)
    px(-50, -10, 100, 50, '#1a0828');
    px(-42, -60, 84, 54, '#2a0e3a');
    // Legs (armored, dark)
    px(-22, 12, 18, 28, '#3a1a48');
    px(4, 12, 18, 28, '#3a1a48');
    px(-24, 36, 20, 8, '#5a2060'); // boots
    px(4, 36, 20, 8, '#5a2060');
    // Body armor
    px(-26, -60, 52, 74, '#2e1040');
    px(-20, -52, 40, 58, '#3d1858');
    // Chest rune glow
    ctx.save();
    ctx.globalAlpha = bpulse * 0.9;
    ctx.fillStyle = '#e040ff';
    ctx.beginPath(); ctx.arc(0, -22, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = bpulse * 0.4;
    ctx.beginPath(); ctx.arc(0, -22, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Pauldrons (shoulder armor)
    px(-44, -58, 20, 22, '#4a2268');
    px(24, -58, 20, 22, '#4a2268');
    // Arms / gauntlets
    px(-48, -48, 12, 38, '#3a1050');
    px(36, -48, 12, 38, '#3a1050');
    px(-52, -14, 14, 10, '#7030a0'); // gauntlet left
    px(38, -14, 14, 10, '#7030a0'); // gauntlet right
    // Head (horned helm)
    px(-18, -88, 36, 30, '#2a0e3a'); // helm base
    px(-20, -90, 40, 12, '#3d1858'); // brow plate
    // Horns
    px(-22, -104, 8, 18, '#5a2060');
    px(14, -104, 8, 18, '#5a2060');
    px(-26, -118, 6, 16, '#7030a0');
    px(20, -118, 6, 16, '#7030a0');
    // Eyes (glowing red-orange)
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.shadowColor = '#ff3000'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff5020';
    ctx.beginPath(); ctx.arc(-7, -76, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -76, 4, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffaa40';
    ctx.beginPath(); ctx.arc(-7, -77, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -77, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Weapon — giant dark scythe
    ctx.save();
    ctx.translate(46, -30);
    ctx.rotate(Math.sin(bt * 1.6) * 0.12 - 0.3);
    px(0, -60, 8, 80, '#1a0828'); // handle
    px(-18, -68, 22, 12, '#6020c0'); // blade base
    px(-28, -82, 14, 18, '#8030e0'); // blade
    ctx.restore();
    ctx.restore();
    const bw = enemy.r * 3.5;
    drawTinyHpBar(enemy.x, sy - enemy.r * 2.4, bw, hpPct, '#c6423d');
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8b0ff';
    ctx.shadowColor = '#c040ff'; ctx.shadowBlur = 6;
    ctx.fillText('★ BOSS ★', enemy.x, sy - enemy.r * 2.7);
    ctx.shadowBlur = 0;
    return;
  }

  // ── Infected ally (keep distinct pixel-art look) ─────────
  if (enemy.infected) {
    px(-14, -34, 28, 24, '#254c2b');
    px(-10, -48, 20, 16, '#73b66d');
    px(-15, -18, 8, 12, '#1b351f');
    px(7, -18, 8, 12, '#1b351f');
    px(-4, -40, 8, 5, '#f0e8a8');
    ctx.restore();
    drawTinyHpBar(enemy.x, sy - enemy.r * 1.75, enemy.r * 2, hpPct, '#65b95d');
    return;
  }

  // ── Sprite-based enemies ─────────────────────────────────
  const _eFacing = (enemy.facing || 1) < 0;
  const _eAnim   = enemy.anim?.name || 'Walk';
  const _eFrame  = enemy.anim?.frame || 0;

  // Pick sprite key + render size per kind (stage-aware via enemy.spriteKey)
  let _eKey, _eSize, _eYOff, _hpColor;
  {
    const fallback = enemy.kind === 'elite' ? 'ogre' : enemy.kind === 'archer' ? 'eye' : 'hound';
    _eKey = enemy.spriteKey || fallback;
    const info = ENEMY_SPRITE_INFO[_eKey] || ENEMY_SPRITE_INFO[fallback];
    _eSize = info.size; _eYOff = info.yOff; _hpColor = info.hpColor;
  }

  if (spritesReady && drawSprite(_eKey, _eAnim, _eFrame, 0, _eYOff, _eSize, _eFacing, 1)) {
    // Elite gold crown indicator
    if (enemy.kind === 'elite') {
      ctx.save();
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd45c';
      ctx.fillText('★', 0, -_eSize - 2);
      ctx.restore();
    }
    ctx.restore();
    drawTinyHpBar(enemy.x, sy - enemy.r * 1.8, enemy.r * 2.2, hpPct, _hpColor);
    // Draw elite trait shield bar above HP bar
    if (enemy.eliteTrait === 'shield' && enemy.shieldMax > 0) {
      drawTinyHpBar(enemy.x, sy - enemy.r * 1.8 - 8, enemy.r * 2.2, enemy.shieldHp / enemy.shieldMax, '#44aaff');
    }
    // Trait icon above enemy
    if (enemy.eliteTrait) {
      const traitIcon = enemy.eliteTrait === 'shield' ? '🛡' : enemy.eliteTrait === 'dash' ? '⚡' : '💥';
      ctx.save();
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(traitIcon, enemy.x, sy - enemy.r * 2.1);
      ctx.restore();
    }
    return;
  }

  // ── Pixel-art fallback ───────────────────────────────────
  if (enemy.kind === 'archer') {
    px(-10, -34, 20, 26, '#6b4b28');
    px(-8, -50, 16, 16, '#b88b58');
    px(dir * 12, -40, 5, 30, '#3a2414');
    px(dir * 16, -38, 4, 22, '#d0a060');
    ctx.restore();
    drawTinyHpBar(enemy.x, sy - enemy.r * 1.75, enemy.r * 2, hpPct, '#b84434');
    return;
  }
  if (enemy.kind === 'elite') {
    px(-16, -36, 32, 26, '#4b2730');
    px(-12, -54, 24, 18, '#b68b52');
  } else {
    px(-15, -28, 30, 18, '#5c8f43');
    px(-11, -36, 22, 10, '#79b85a');
  }
  ctx.restore();
  drawTinyHpBar(enemy.x, sy - enemy.r * 1.75, enemy.r * 2, hpPct, enemy.kind === 'elite' ? '#d69a3a' : '#b84434');
  if (enemy.eliteTrait === 'shield' && enemy.shieldMax > 0) {
    drawTinyHpBar(enemy.x, sy - enemy.r * 1.75 - 7, enemy.r * 2, enemy.shieldHp / enemy.shieldMax, '#44aaff');
  }
}

function drawBullet(bullet) {
  const z  = terrainHeightAt(bullet.x, bullet.y);
  const sy = bullet.y - z - 12;

  // Corruption Orb — glowing purple sphere
  if (bullet.isCorruptOrb) {
    ctx.save();
    ctx.translate(Math.round(bullet.x), Math.round(sy));
    const pulse = 0.75 + Math.sin((state?.time||0)*18)*0.25;
    // Outer glow
    ctx.globalAlpha = 0.35 * pulse;
    const og = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
    og.addColorStop(0, '#cc44ff'); og.addColorStop(1, 'transparent');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill();
    // Core
    ctx.globalAlpha = 0.9;
    const cg = ctx.createRadialGradient(-3, -4, 1, 0, 0, 14);
    cg.addColorStop(0, '#eeccff'); cg.addColorStop(0.45, '#9933dd'); cg.addColorStop(1, '#220044');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
    // Dark corruption swirl marks
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#330066'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*1.3); ctx.stroke();
    ctx.restore();
    return;
  }

  const angle = Math.atan2(bullet.vy, bullet.vx);
  ctx.save();
  ctx.translate(Math.round(bullet.x), Math.round(sy));
  ctx.rotate(angle);
  const blade = bullet.crit ? "#f4d56a" : "#d9d0b0";
  px(-10, -3, 18, 6, blade);
  px(6, -2, 5, 4, "#f8f0c8");
  px(-14, -1, 5, 2, "#80603a");
  if (bullet.aoeRadius) {
    px(-8, -8, 5, 5, "#b95a3c");
    px(0, 5, 4, 4, "#e09850");
  }
  ctx.restore();
}

function drawEnemyBullet(b) {
  const z  = terrainHeightAt(b.x, b.y);
  const sy = b.y - z - 10;
  const angle = Math.atan2(b.vy, b.vx);
  ctx.save();
  ctx.translate(Math.round(b.x), Math.round(sy));
  ctx.rotate(angle);
  px(-8, -2, 14, 4, "#5a3218");
  px(5, -4, 7, 8, "#d8c080");
  px(-12, -4, 5, 3, "#9a6a3a");
  px(-12, 1, 5, 3, "#9a6a3a");
  ctx.restore();
}

function updateEnemyBullets(dt) {
  const p = state.player;
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) { state.enemyBullets.splice(i, 1); continue; }
    // Partner hit check (enemy bullets can hit partner too)
    const pt = state.partner;
    if (pt && !pt.downed && pt.invuln <= 0 && distance(b, pt) < pt.r + b.r) {
      partnerTakeDamage(b.damage);
      state.enemyBullets.splice(i, 1);
      continue;
    }
    if (p.invuln <= 0 && distance(b, p) < p.r + b.r) {
      let incoming = Math.round(b.damage * (1 - (p.traits.damageReduction || 0)));
      if (p.shield > 0) {
        const blocked = Math.min(p.shield, incoming);
        p.shield -= blocked; incoming -= blocked;
        floatText(p.x, p.y - 70, "护盾", "#65e572");
      }
      if (incoming > 0) {
        p.hp -= incoming;
        floatText(p.x, p.y - 52, `-${incoming}`, "#ff6040");
      }
      p.invuln = 0.30;
      burst(b.x, b.y, "#ff6020", 6);
      state.enemyBullets.splice(i, 1);
    }
  }
  if (p.hp <= 0) endGame(false);
}

function drawPickup(item) {
  const sy = screenY(item);
  drawPixelShadow(item.x, item.y + 7, item.r * 1.5, 5, 0.18);
  if (item.type === "xp") {
    px(item.x - 4, sy - 8, 8, 4, "#7ccf96");
    px(item.x - 6, sy - 4, 12, 8, "#3f9d64");
    px(item.x - 2, sy - 2, 4, 4, "#d8f0b8");
  } else {
    px(item.x - 5, sy - 5, 10, 10, "#c98a28");
    px(item.x - 3, sy - 3, 6, 6, "#f0c868");
  }
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.7);
    ctx.fillStyle = p.color;
    const size = Math.max(2, Math.round(p.size));
    ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
  }
  ctx.globalAlpha = 1;
}

function drawMeleeSlashes() {
  if (!state?.meleeSlashes?.length) return;
  for (const s of state.meleeSlashes) {
    const t = s.life / s.maxLife;           // 1→0 as it fades
    const alpha = t * 0.75;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = s.color || '#ffd45c';
    ctx.lineWidth   = 3 + t * 6;
    ctx.lineCap = 'round';
    // Draw arc in screen-space (y isometric offset)
    const sy = s.y - (s.y - 380) * 0.3;   // rough screen Y (matches screenY logic)
    ctx.beginPath();
    ctx.arc(s.x, sy, s.range * (0.6 + 0.4 * (1-t)),
            s.angle - s.arc * 0.5,
            s.angle + s.arc * 0.5);
    ctx.stroke();
    // Inner bright line
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawFloating() {
  ctx.font = "700 16px 'Microsoft YaHei', monospace";
  ctx.textAlign = "center";
  for (const item of state.floating) {
    ctx.globalAlpha = Math.max(0, item.life);
    ctx.fillStyle = item.color;
    ctx.shadowColor = "#1a0b05";
    ctx.shadowBlur = 0;
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── World ────────────────────────────────────────────────
function drawTileFloor(w, h, chIdx) {
  const ch = [
    { base:"#4f7b37", dark:"#3e642b", light:"#6d9150", dirt:"#6b4a2c", dirtDk:"#4d321e", flowers:["#e8d8b0","#d9b650"] },
    { base:"#2f5d3d", dark:"#244832", light:"#4f7755", dirt:"#3b3c2c", dirtDk:"#26281d", flowers:["#c2868c","#94b88c"] },
    { base:"#7c4a2c", dark:"#5e3620", light:"#a16a3d", dirt:"#4a2b1b", dirtDk:"#2e1a12", flowers:["#d68b4a","#d6b273"] },
    { base:"#3d6531", dark:"#304f26", light:"#587b43", dirt:"#5d5032", dirtDk:"#3a3322", flowers:["#c0d0a0","#e8d8b0"] },
    { base:"#3b2f3f", dark:"#2b2230", light:"#57435d", dirt:"#2c2230", dirtDk:"#1c1420", flowers:["#9b6aa0","#c58ab8"] },
  ][chIdx] || { base:"#4f7b37", dark:"#3e642b", light:"#6d9150", dirt:"#6b4a2c", dirtDk:"#4d321e", flowers:["#e8d8b0","#d9b650"] };

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = ch.base;
  ctx.fillRect(0, 0, w, h);

  // Grass micro-texture — 4 px blocks
  const B = 32;
  const cols2 = Math.ceil(w / B), rows2 = Math.ceil(h / B);
  for (let r = 0; r < rows2; r++) {
    for (let c = 0; c < cols2; c++) {
      const v = (r * 37 + c * 53 + r * c * 7) % 18;
      if (v < 3)      { ctx.fillStyle = ch.dark;  ctx.fillRect(c*B, r*B, B, B); }
      else if (v===3) { ctx.fillStyle = ch.light; ctx.fillRect(c*B, r*B, B, B); }
    }
  }

  // Organic dirt patches
  const seed = chIdx * 100 + 42;
  for (let i = 0; i < 4; i++) {
    const bx = ((seed*7 + i*173 + 91) % (w-200)) + 100;
    const by = ((seed*11 + i*131 + 67) % (h-160)) + 80;
    const bw = 55 + (i*29)%80, bh = 32+(i*37)%46;
    ctx.save();
    ctx.fillStyle = ch.dirt;
    ctx.beginPath();
    ctx.ellipse(bx, by, bw, bh, (i*0.4)%Math.PI, 0, Math.PI*2); ctx.fill();
    for (let j = 0; j < 4; j++) {
      const ang = (j/4)*Math.PI*2 + i*0.5;
      ctx.beginPath();
      ctx.ellipse(bx+Math.cos(ang)*bw*0.68, by+Math.sin(ang)*bh*0.68, bw*0.32, bh*0.32, ang, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = ch.dirtDk;
    ctx.beginPath();
    ctx.ellipse(bx+4, by+3, bw*0.38, bh*0.38, (i*0.6)%Math.PI, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Tiny flowers
  for (let i = 0; i < 10; i++) {
    const fx = ((seed*3+i*97+37)%(w-80))+40;
    const fy = ((seed*5+i*113+23)%(h-80))+40;
    const fc = ch.flowers[i%ch.flowers.length];
    ctx.fillStyle = fc;
    ctx.fillRect(fx,   fy,   3, 3);
    ctx.fillRect(fx-2, fy+1, 2, 2);
    ctx.fillRect(fx+3, fy+1, 2, 2);
    ctx.fillRect(fx+1, fy-2, 2, 2);
    ctx.fillRect(fx+1, fy+3, 2, 2);
    ctx.fillStyle = "#ffe060";
    ctx.fillRect(fx+1, fy+1, 1, 1);
  }
}

function drawDecorItem(x, y, chIdx, accent, idx) {
  ctx.save();
  const t = performance.now() * 0.001;
  const treeStyles = [
    { shadow:"rgba(0,0,0,.28)", base:"#2a6010", mid:"#44a020", light:"#60c030", hi:"#7ae040" },
    { shadow:"rgba(0,0,0,.28)", base:"#1a4830", mid:"#288050", light:"#38c070", hi:"#50e090" },
    { shadow:"rgba(0,0,0,.22)", base:"#5a4830", mid:"#806040", light:"#a08060", hi:"#c09a78" },
    { shadow:"rgba(100,180,255,.25)", base:"#1a3870", mid:"#2858a8", light:"#60a0e0", hi:"#a0d8ff" },
    { shadow:"rgba(80,0,160,.30)", base:"#180428", mid:"#300858", light:accent, hi:accent },
  ];
  const s = treeStyles[chIdx] || treeStyles[0];
  const sz = [18, 22, 16, 26, 20, 14][idx % 6];

  if (chIdx === 4) {
    const pulse = 0.8 + Math.sin(t * 1.5 + idx) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = accent; ctx.shadowBlur = 0;
  }

  // Ground shadow
  ctx.fillStyle = s.shadow;
  ctx.beginPath();
  ctx.ellipse(x+3, y+4, sz*0.95, sz*0.45, 0, 0, Math.PI*2);
  ctx.fill();

  // Dark base layer
  ctx.fillStyle = s.base;
  ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI*2); ctx.fill();

  // Main canopy
  ctx.fillStyle = s.mid;
  ctx.beginPath(); ctx.arc(x-1, y-2, sz*0.82, 0, Math.PI*2); ctx.fill();

  // Light blob highlight
  ctx.fillStyle = s.light;
  ctx.beginPath(); ctx.arc(x - sz*0.25, y - sz*0.3, sz*0.45, 0, Math.PI*2); ctx.fill();

  // Tiny specular
  ctx.fillStyle = s.hi;
  ctx.fillRect(x - sz*0.28, y - sz*0.46, sz*0.18, sz*0.14);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawRockCluster(x, y, chIdx) {
  const cols = [
    ["#909098","#b0b0b8","#6a6a70"],
    ["#607060","#809080","#484d48"],
    ["#a08870","#c0a880","#706050"],
    ["#7090b0","#90b8d8","#4a6880"],
    ["#504060","#706080","#38283a"],
  ][chIdx] || ["#909098","#b0b0b8","#6a6a70"];

  ctx.save();
  const count = 2 + (Math.abs(Math.floor(x+y)) % 2);
  for (let i = 0; i < count; i++) {
    const rx = x + (i-1)*10 + (i*5)%7 - 3;
    const ry = y + (i*3)%8 - 4;
    const rs = 6 + (i*7)%6;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(rx+2, ry+3, rs, rs*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = cols[0];
    ctx.beginPath(); ctx.arc(rx, ry, rs, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = cols[1];
    ctx.beginPath(); ctx.ellipse(rx-rs*0.25, ry-rs*0.25, rs*0.5, rs*0.4, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = cols[2];
    ctx.beginPath(); ctx.ellipse(rx+rs*0.2, ry+rs*0.25, rs*0.4, rs*0.3, 0.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawPond(x, y, chIdx) {
  const wc = [
    ["#2060b0","#3090d8","#60c0ff"],
    ["#1a5838","#207858","#30b878"],
    ["#a06028","#c08040","#e0b060"],
    ["#1a3888","#2858b8","#5090e0"],
    ["#3a0878","#5810a8","#9030e0"],
  ][chIdx] || ["#2060b0","#3090d8","#60c0ff"];

  const rw = 26 + (Math.abs(x)|0)%20, rh = 16 + (Math.abs(y)|0)%12;
  ctx.save();
  ctx.fillStyle = wc[0];
  ctx.beginPath(); ctx.ellipse(x, y, rw+4, rh+3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = wc[1];
  ctx.beginPath(); ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = wc[2];
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.ellipse(x-rw*0.2, y-rh*0.25, rw*0.45, rh*0.38, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawChapterDecor(w, h, chapter, chIdx) {
  const seed = chIdx * 100;

  // Ponds
  for (let i = 0; i < 1; i++) {
    const px = ((seed*3 + i*211 + 77) % (w-200)) + 100;
    const py = ((seed*5 + i*157 + 43) % (h-140)) + 70;
    drawPond(px, py, chIdx);
  }

  // Rock clusters
  for (let i = 0; i < 4; i++) {
    const px = ((seed*2 + i*113 + 31) % (w-120)) + 60;
    const py = 50 + ((seed*4 + i*97 + 17) % (h-100));
    drawRockCluster(px, py, chIdx);
  }

  // Trees — draw back-to-front (higher y last)
  const trees = [];
  for (let i = 0; i < 8; i++) {
    const px = ((seed + i*167 + 83) % (w-100)) + 50;
    const py = 55 + ((seed + i*131 + 57) % (h-110));
    trees.push({ px, py, i });
  }
  trees.sort((a, b) => a.py - b.py);
  for (const { px, py, i } of trees) {
    drawDecorItem(px, py, chIdx, chapter.accent, i);
  }
}

let worldCache = null;

function invalidateWorldCache() {
  worldCache = null;
}

function drawWorldToContext(targetCtx, w, h, chapter) {
  const oldCtx = ctx;
  globalThis.__drawCtxSwap = targetCtx;
  const chIdx = state?.chapter ?? 0;
  drawTileFloor(w, h, chIdx);
  drawTerrainZones(w, h);
  drawTerrainRelief(w, h, chapter);
  drawChapterDecor(w, h, chapter, chIdx);

  const vig = ctx.createRadialGradient(w/2, h/2, h*0.28, w/2, h/2, h*0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  globalThis.__drawCtxSwap = oldCtx;
}

function drawWorld(w, h, chapter) {
  drawWorldOld(w, h, chapter);
}

function drawWorldOld(w, h, chapter) {
  const chIdx = state?.chapter ?? 0;
  drawTileFloor(w, h, chIdx);
  drawTerrainZones(w, h);
  drawTerrainRelief(w, h, chapter);
  drawChapterDecor(w, h, chapter, chIdx);

  // Soft vignette
  const vig = ctx.createRadialGradient(w/2, h/2, h*0.28, w/2, h/2, h*0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawTerrainZones(w, h) { /* removed — obstacles drawn in tile map */ }
function _drawTerrainZones_OLD(w, h) {
  const t = performance.now() * 0.001;
  for (const zone of state?.terrainZones || []) {
    const cx = zone.x * w, cy = zone.y * h;
    const rx = zone.rx * w, ry = zone.ry * h;
    ctx.save();

    if (zone.type === "lava") {
      // ── 岩浆区 ─────────────────────────────────────────────
      // Outer glow
      const grd = ctx.createRadialGradient(cx, cy, ry*0.3, cx, cy, rx+16);
      grd.addColorStop(0, "rgba(255,140,20,0.55)");
      grd.addColorStop(0.6, "rgba(220,60,10,0.45)");
      grd.addColorStop(1, "rgba(180,40,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx+16, ry+10, 0, 0, Math.PI*2); ctx.fill();

      // Rocky rim
      ctx.fillStyle = "#6a5060";
      ctx.beginPath(); ctx.ellipse(cx, cy, rx+9, ry+6, -0.16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#807060";
      ctx.beginPath(); ctx.ellipse(cx, cy, rx+5, ry+3, -0.16, 0, Math.PI*2); ctx.fill();

      // Lava base
      const lavaGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      lavaGrd.addColorStop(0, "#ffcc40");
      lavaGrd.addColorStop(0.35, "#ff7020");
      lavaGrd.addColorStop(1, "#c83010");
      ctx.fillStyle = lavaGrd;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.16, 0, Math.PI*2); ctx.fill();

      // Animated surface flow blobs
      for (let i = 0; i < 4; i++) {
        const bx = cx + Math.sin(t*0.6 + i*1.57) * rx*0.38;
        const by = cy + Math.cos(t*0.45 + i*1.57) * ry*0.35;
        ctx.globalAlpha = 0.45 + Math.sin(t*1.8+i)*0.2;
        ctx.fillStyle = "#ffaa30";
        ctx.beginPath(); ctx.ellipse(bx, by, rx*0.2, ry*0.15, 0, 0, Math.PI*2); ctx.fill();
      }

      // Lava bubbles
      for (let i = 0; i < 5; i++) {
        const bph = ((t * 0.9 + i * 0.62) % 2.0);
        if (bph > 1.2) continue;
        const bx = cx + Math.sin(i*2.4+0.8)*rx*0.55;
        const by = cy + Math.cos(i*1.9+0.4)*ry*0.48;
        const br = 3 + i % 3;
        ctx.globalAlpha = 1 - bph * 0.7;
        ctx.fillStyle = "#ffe060";
        ctx.beginPath(); ctx.arc(bx, by - bph*ry*0.18, br, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = (1 - bph) * 0.6;
        ctx.strokeStyle = "#ff8020"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx, by - bph*ry*0.18, br+3+bph*4, 0, Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Label
      ctx.font = "bold 13px 'Microsoft YaHei', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText("🔥 岩浆区", cx+1, cy - ry - 8);
      ctx.fillStyle = "#ffcc40";
      ctx.fillText("🔥 岩浆区", cx, cy - ry - 9);

    } else if (zone.type === "mud") {
      // ── 沼泽区 ─────────────────────────────────────────────
      // Outer mist glow
      const mGrd = ctx.createRadialGradient(cx, cy, ry*0.2, cx, cy, rx+14);
      mGrd.addColorStop(0, "rgba(60,100,40,0.5)");
      mGrd.addColorStop(1, "rgba(20,40,10,0)");
      ctx.fillStyle = mGrd;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx+14, ry+8, 0, 0, Math.PI*2); ctx.fill();

      // Swamp base
      const swGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      swGrd.addColorStop(0, "#4a6830");
      swGrd.addColorStop(0.5, "#385225");
      swGrd.addColorStop(1, "#1e3012");
      ctx.fillStyle = swGrd;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.16, 0, Math.PI*2); ctx.fill();

      // Slimy surface patches
      ctx.fillStyle = "#2c4a1a";
      ctx.beginPath(); ctx.ellipse(cx-rx*0.22, cy-ry*0.1, rx*0.45, ry*0.38, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#3a5820";
      ctx.beginPath(); ctx.ellipse(cx+rx*0.15, cy+ry*0.18, rx*0.35, ry*0.28, -0.2, 0, Math.PI*2); ctx.fill();

      // Mud bubbles
      for (let i = 0; i < 4; i++) {
        const bph = ((t * 0.5 + i * 0.9) % 2.5);
        if (bph > 1.4) continue;
        const bx = cx + Math.sin(i*1.8+1.1)*rx*0.5;
        const by = cy + Math.cos(i*2.1+0.7)*ry*0.42;
        ctx.globalAlpha = 0.8 - bph*0.5;
        ctx.fillStyle = "#7aaa50";
        ctx.beginPath(); ctx.arc(bx, by, 4+i%3, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = (1-bph*0.6)*0.5;
        ctx.strokeStyle = "#5a8040"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, 6+bph*5, 0, Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Toxic mist wisps
      for (let i = 0; i < 3; i++) {
        const wx = cx + Math.sin(t*0.4+i*2.1)*rx*0.4;
        const wy = cy + Math.cos(t*0.3+i*2.1)*ry*0.3 - Math.sin(t*0.7+i)*ry*0.15;
        ctx.globalAlpha = 0.12 + Math.sin(t+i)*0.06;
        ctx.fillStyle = "#80ff60";
        ctx.beginPath(); ctx.ellipse(wx, wy, 14, 9, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Label
      ctx.font = "bold 13px 'Microsoft YaHei', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText("☠ 沼泽区", cx+1, cy - ry - 8);
      ctx.fillStyle = "#90ff70";
      ctx.fillText("☠ 沼泽区", cx, cy - ry - 9);

    } else {
      // ── 加速区 ─────────────────────────────────────────────
      // Outer energy pulse
      const pulse = 0.5 + Math.sin(t*2.5)*0.5;
      ctx.globalAlpha = 0.18 + pulse*0.12;
      ctx.fillStyle = "#55eeff";
      ctx.beginPath(); ctx.ellipse(cx, cy, rx+18+pulse*8, ry+12+pulse*5, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;

      // Speed field base
      const sGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      sGrd.addColorStop(0, "rgba(160,240,255,0.75)");
      sGrd.addColorStop(0.55, "rgba(60,190,220,0.65)");
      sGrd.addColorStop(1, "rgba(30,110,150,0.50)");
      ctx.fillStyle = sGrd;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();

      // Speed streaks (animated)
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const off = ((t*140 + i*55) % (rx*2)) - rx;
        ctx.beginPath();
        ctx.moveTo(cx + off - 18, cy - ry + i*(ry*2/5));
        ctx.lineTo(cx + off + 18, cy - ry + i*(ry*2/5));
        ctx.stroke();
      }
      ctx.restore();

      // Chevron arrows flowing right
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      const arOff = (t * 38) % 22;
      for (let col = -2; col <= 2; col++) {
        const ax = cx + col*22 + arOff - 22;
        ctx.beginPath();
        ctx.moveTo(ax-6, cy-8); ctx.lineTo(ax+4, cy); ctx.lineTo(ax-6, cy+8);
        ctx.stroke();
      }

      // Label
      ctx.font = "bold 13px 'Microsoft YaHei', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText("⚡ 加速区", cx+1, cy - ry - 8);
      ctx.fillStyle = "#eefffe";
      ctx.fillText("⚡ 加速区", cx, cy - ry - 9);
    }
    ctx.restore();
  }
}

function drawTerrainRelief(w, h, chapter) {
  for (const f of state?.terrainFeatures || terrainProto) {
    const cx = Math.round(f.x * w);
    const cy = Math.round(f.y * h - f.height * 0.28);
    const rx = Math.round(f.rx * w);
    const ry = Math.round(f.ry * h);
    const raised = f.height > 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const edge = raised ? '#6d5130' : '#203020';
    const top = raised ? '#75603a' : '#263a26';
    const hi = raised ? '#9b7b48' : '#314a31';
    const shade = raised ? '#402818' : '#142014';

    for (let y = -ry; y <= ry; y += 8) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      px(cx - half, cy + y, half * 2, 8, Math.abs(y) > ry - 12 ? edge : top);
    }

    for (let i = 0; i < 8; i++) {
      const ox = Math.round((seededRand(i + cx * .013 + cy) - .5) * rx * 1.6);
      const oy = Math.round((seededRand(i + cy * .017 + cx) - .5) * ry * 1.4);
      if ((ox * ox) / (rx * rx) + (oy * oy) / (ry * ry) < .82) px(cx + ox, cy + oy, 5, 4, i % 3 === 0 ? hi : shade);
    }

    if (raised) {
      for (let x = -rx + 8; x < rx; x += 14) px(cx + x, cy + ry - 6, 9, 8, '#2b1a10');
    } else {
      for (let x = -rx + 10; x < rx; x += 18) px(cx + x, cy + ry - 10, 11, 4, '#435533');
    }
    ctx.restore();
  }
}

function drawCrystal(x, y, color, scale) {
  const z = terrainHeightAt(x, y);
  const sx = Math.round(x);
  const sy = Math.round(y - z);
  const variant = Math.abs(Math.floor((x * 13 + y * 7) % 4));
  drawPixelShadow(sx, y + 15 * scale, 18 * scale, 7 * scale, 0.18);
  if (variant === 0) {
    px(sx - 8 * scale, sy - 8 * scale, 16 * scale, 8 * scale, '#8b2f2f');
    px(sx - 5 * scale, sy - 14 * scale, 10 * scale, 7 * scale, '#c95a4a');
    px(sx - 3 * scale, sy - 2 * scale, 6 * scale, 12 * scale, '#d7b184');
  } else if (variant === 1) {
    px(sx - 9 * scale, sy - 6 * scale, 18 * scale, 10 * scale, '#30471f');
    px(sx - 14 * scale, sy - 1 * scale, 9 * scale, 7 * scale, '#3f5c2a');
    px(sx + 5 * scale, sy, 10 * scale, 6 * scale, '#4d6f34');
  } else if (variant === 2) {
    px(sx - 10 * scale, sy - 4 * scale, 18 * scale, 8 * scale, '#5c4a3a');
    px(sx - 3 * scale, sy - 12 * scale, 7 * scale, 14 * scale, '#3c2515');
    px(sx + 3 * scale, sy - 9 * scale, 12 * scale, 5 * scale, '#4a2c18');
  } else {
    px(sx - 9 * scale, sy - 3 * scale, 18 * scale, 8 * scale, '#6f6a5d');
    px(sx - 5 * scale, sy - 8 * scale, 10 * scale, 5 * scale, '#9b9481');
  }
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const chapter = chapters[state?.chapter || 0];
  if (w <= 0 || h <= 0) return;
  ctx.clearRect(0, 0, w, h);

  // Screen shake (Earthbreaker, etc.)
  const _shaking = (state?.skills?._shakeTimer||0) > 0;
  if (_shaking) {
    const amt = state.skills._shakeAmt * (state.skills._shakeTimer / 0.38);
    ctx.save();
    ctx.translate(rand(-amt, amt), rand(-amt*0.6, amt*0.6));
  }

  if (document.getElementById("mainMenu")?.classList.contains("show")) {
    drawStableWorld(w, h);
    if (_shaking) ctx.restore();
    return;
  }
  drawStableWorld(w, h);
  if (!state) { if (_shaking) ctx.restore(); return; }

  const drawables = [
    ...state.pickups.map(item => ({ y:item.y, draw:() => drawPickup(item) })),
    ...state.enemies.map(e => ({ y:e.y, draw:() => drawEnemy(e, chapter) })),
    ...state.afterimages.map(img => ({ y:img.y-1, draw:() => drawAfterimage(img) })),
    { y:state.player.y, draw:() => drawPlayer(chapter) },
    ...(state.partner ? [{ y: state.partner.y, draw: drawPartner }] : []),
    ...(state.hunter?.active || state.hunter?.inCombat
      ? [{ y: state.hunter.y, draw: drawHunter }] : []),
    ...state.bullets.map(b => ({ y:b.y, draw:() => drawBullet(b) })),
    ...(state.enemyBullets||[]).map(b => ({ y:b.y, draw:() => drawEnemyBullet(b) }))
  ].sort((a, b) => a.y - b.y);

  for (const d of drawables) d.draw();
  drawParticles();
  drawMeleeSlashes();
  drawSkillEffects();
  // Route FX disabled for handcrafted dark-fantasy pixel readability.
  drawFloating();
  drawEnemySpeeches();
  drawSkillHud();
  drawRoundStats();
  drawStreakMsg();
  drawThreatMsg();

  // End screen shake
  if (_shaking) ctx.restore();

  // ── STRENGTH phase3: screen shake hint ──────────────────
  // (done via crit flash on ev for simplicity)
  const ev = state.evolution;
  if (ev.critFlash > 0) ev.critFlash -= 0.04;
}

// ─── PunyWorld Tileset Map ──────────────────────────────────
let _punyTileset  = null;   // loaded image
let _bgGroundImg  = null;   // custom ground texture
let _mapCanvas    = null;   // { round, w, h, el } cached render

function preloadTileset(cb) {
  _punyTileset = new Image();
  // Also preload the custom ground background
  _bgGroundImg = new Image();
  let loaded = 0;
  const done = () => { if (++loaded >= 2) (cb || (() => {}))(); };
  _punyTileset.onload = _punyTileset.onerror = done;
  _bgGroundImg.onload  = _bgGroundImg.onerror  = done;
  _punyTileset.src = 'sprites/tileset.png';
  _bgGroundImg.src  = 'sprites/bg_ground.png';
}

// Blit one PunyWorld tile (1-based ID) onto a target 2D context
function blitTile(c2d, id, dx, dy, size) {
  if (!_punyTileset?.naturalWidth) return;
  const idx = id - 1;
  c2d.drawImage(_punyTileset,
    (idx % 27) * 16, Math.floor(idx / 27) * 16, 16, 16,
    dx, dy, size, size);
}

function rebuildMapCanvas(w, h, round, obstacles) {
  const TILE = 32; // 2× upscale of 16 px source tiles
  const cols = Math.ceil(w / TILE) + 1;
  const rows = Math.ceil(h / TILE) + 1;

  const oc  = document.createElement('canvas');
  oc.width  = w;  oc.height = h;
  const c2d = oc.getContext('2d');
  c2d.imageSmoothingEnabled = false;

  // ── Base: custom ground texture ───────────────────────────
  if (_bgGroundImg?.naturalWidth) {
    // Tile the texture to fill the canvas
    const iw = _bgGroundImg.naturalWidth;
    const ih = _bgGroundImg.naturalHeight;
    c2d.imageSmoothingEnabled = true;
    for (let ty = 0; ty < h; ty += ih) {
      for (let tx = 0; tx < w; tx += iw) {
        c2d.drawImage(_bgGroundImg, tx, ty, iw, ih);
      }
    }
    // Subtle dark vignette around edges to frame the arena
    const vg = c2d.createRadialGradient(w/2, h/2, Math.min(w,h)*0.28, w/2, h/2, Math.max(w,h)*0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    c2d.fillStyle = vg;
    c2d.fillRect(0, 0, w, h);
  } else {
    // Fallback: procedural cobblestone (matches dark stone tile aesthetic)
    c2d.fillStyle = '#1e1e1e';
    c2d.fillRect(0, 0, w, h);
    const BSIZE = 28; // brick cell size
    const bcols = Math.ceil(w / BSIZE) + 1;
    const brows = Math.ceil(h / BSIZE) + 1;
    for (let row = 0; row < brows; row++) {
      const offset = (row % 2) * (BSIZE * 0.5);
      for (let col = 0; col < bcols; col++) {
        const bx2 = col * BSIZE - offset;
        const by2 = row * BSIZE;
        const lv  = seededRand(col * 7 + row * 13 + round * 3);
        const lum = 38 + Math.floor(lv * 18); // 38-56 dark grey
        c2d.fillStyle = `rgb(${lum},${lum},${lum})`;
        c2d.fillRect(bx2 + 1, by2 + 1, BSIZE - 2, BSIZE - 2);
        // top-left highlight
        c2d.fillStyle = `rgba(255,255,255,0.06)`;
        c2d.fillRect(bx2 + 1, by2 + 1, BSIZE - 2, 2);
        c2d.fillRect(bx2 + 1, by2 + 1, 2, BSIZE - 2);
        // bottom-right shadow
        c2d.fillStyle = `rgba(0,0,0,0.25)`;
        c2d.fillRect(bx2 + 1, by2 + BSIZE - 3, BSIZE - 2, 2);
        c2d.fillRect(bx2 + BSIZE - 3, by2 + 1, 2, BSIZE - 2);
      }
    }
    // Vignette
    const vg2 = c2d.createRadialGradient(w/2, h/2, Math.min(w,h)*0.25, w/2, h/2, Math.max(w,h)*0.75);
    vg2.addColorStop(0, 'rgba(0,0,0,0)');
    vg2.addColorStop(1, 'rgba(0,0,0,0.60)');
    c2d.fillStyle = vg2;
    c2d.fillRect(0, 0, w, h);
  }

  // Tileset not needed for base — skip if not loaded
  if (!_punyTileset?.naturalWidth) return oc;

  // ── Obstacles: walls (pixel-art stone) & pits (water tiles) ─
  for (const obs of (obstacles || [])) {
    const ox = obs.tx * TILE, oy = obs.ty * TILE;
    const ow = obs.tw * TILE, oh = obs.th * TILE;

    if (obs.type === 'pit') {
      // Water pit: use PunyWorld water tiles per-cell
      for (let cy = obs.ty; cy < obs.ty + obs.th; cy++) {
        for (let cx = obs.tx; cx < obs.tx + obs.tw; cx++) {
          const top = cy===obs.ty, bot = cy===obs.ty+obs.th-1;
          const lft = cx===obs.tx, rgt = cx===obs.tx+obs.tw-1;
          let id;
          if      (top && lft) id = 272;
          else if (top && rgt) id = 274;
          else if (bot && lft) id = 326;
          else if (bot && rgt) id = 328;
          else if (lft || rgt) id = 298;
          else                 id = 354;
          blitTile(c2d, id, cx * TILE, cy * TILE, TILE);
        }
      }
      // Dark void fill over the tiles
      c2d.fillStyle = 'rgba(5,15,30,0.55)';
      c2d.fillRect(ox, oy, ow, oh);
      // Inner shadow gradient
      const pGrd = c2d.createRadialGradient(ox+ow/2, oy+oh/2, 0, ox+ow/2, oy+oh/2, Math.max(ow,oh)*0.7);
      pGrd.addColorStop(0, 'rgba(10,40,80,0.50)');
      pGrd.addColorStop(1, 'rgba(0,0,0,0)');
      c2d.fillStyle = pGrd; c2d.fillRect(ox, oy, ow, oh);
      // Rim highlight
      c2d.strokeStyle = '#1a4a6a'; c2d.lineWidth = 2;
      c2d.strokeRect(ox + 1, oy + 1, ow - 2, oh - 2);
      c2d.strokeStyle = '#2a7aaa'; c2d.lineWidth = 1;
      c2d.strokeRect(ox + 2, oy + 2, ow - 4, oh - 4);

    } else {
      // Stone wall: procedural pixel-art blocks
      // Base fill
      c2d.fillStyle = '#4a4a55';
      c2d.fillRect(ox, oy, ow, oh);
      // Brick pattern
      for (let by = 0; by < oh; by += 8) {
        const rowOff = Math.floor(by / 8) % 2 === 0 ? 0 : 8;
        for (let bx = rowOff; bx < ow; bx += 16) {
          c2d.fillStyle = '#525260';
          c2d.fillRect(ox + bx, oy + by, 15, 7);
          // Highlight top-left
          c2d.fillStyle = '#6a6a7a';
          c2d.fillRect(ox + bx, oy + by, 15, 1);
          c2d.fillRect(ox + bx, oy + by, 1, 7);
          // Shadow bottom-right
          c2d.fillStyle = '#383840';
          c2d.fillRect(ox + bx + 14, oy + by, 1, 7);
          c2d.fillRect(ox + bx, oy + by + 6, 15, 1);
        }
      }
      // Outer border
      c2d.strokeStyle = '#282830'; c2d.lineWidth = 2;
      c2d.strokeRect(ox + 1, oy + 1, ow - 2, oh - 2);
      // Top highlight
      c2d.fillStyle = '#7a7a8a';
      c2d.fillRect(ox, oy, ow, 2);
    }
  }

  // ── Arena border (dark stone frame) ───────────────────────
  // Top & bottom bars
  c2d.fillStyle = '#2a2a32';
  c2d.fillRect(0, 0, w, TILE);
  c2d.fillRect(0, (rows-1)*TILE, w, TILE);

  // Build wall collision grid from obstacles + border
  buildWallGrid(obstacles, w, h);

  return oc;
}

// ─── Grass tile (generated once, tiled everywhere) ─────────
let _grassPattern = null;

function buildGrassTile() {
  const S = 256; // tile size — power of 2 for clean tiling
  const oc = document.createElement('canvas');
  oc.width = oc.height = S;
  const c = oc.getContext('2d');
  c.imageSmoothingEnabled = false;

  // Seeded pseudo-random (deterministic so tile is always identical)
  function rng(seed) {
    let s = seed | 0;
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
  }

  // ── Base fill ──────────────────────────────────────────────
  c.fillStyle = '#4db81a';
  c.fillRect(0, 0, S, S);

  // ── Subtle dark/light noise patches (4×4 cells) ────────────
  const r1 = rng(42);
  for (let cy = 0; cy < S; cy += 4) {
    for (let cx = 0; cx < S; cx += 4) {
      const v = r1();
      if (v < 0.18)      c.fillStyle = '#3fa014';
      else if (v < 0.32) c.fillStyle = '#56cc1e';
      else continue;
      c.fillRect(cx, cy, 4, 4);
    }
  }

  // ── Dark green bush blobs ──────────────────────────────────
  const r2 = rng(99);
  for (let i = 0; i < 38; i++) {
    const bx = Math.floor(r2() * S);
    const by = Math.floor(r2() * S);
    const br = 2 + Math.floor(r2() * 5);
    const shade = r2() < 0.5 ? '#2d8010' : '#247010';
    c.fillStyle = shade;
    // Pixel-art ellipse approximation
    for (let dy = -br; dy <= br; dy++) {
      for (let dx = -br; dx <= br; dx++) {
        if (dx*dx/(br*br*1.2) + dy*dy/(br*br) <= 1) {
          c.fillRect((bx + dx + S) % S, (by + dy + S) % S, 2, 2);
        }
      }
    }
    // Highlight top-left of bush
    c.fillStyle = '#36a018';
    c.fillRect((bx - 1 + S) % S, (by - 1 + S) % S, 2, 2);
  }

  // ── Tiny grass tufts (dark vertical strokes) ───────────────
  const r3 = rng(7);
  for (let i = 0; i < 55; i++) {
    const tx = Math.floor(r3() * S);
    const ty = Math.floor(r3() * S);
    c.fillStyle = '#2a7810';
    c.fillRect(tx, ty, 1, 3);
    c.fillRect(tx + 2, ty + 1, 1, 2);
  }

  // ── Flowers (diamond 3×3: white petals + colored center) ──
  const flowerColors = ['#ff9fca', '#ffe97a', '#ffffff', '#ffb3d1'];
  const r4 = rng(321);
  for (let i = 0; i < 28; i++) {
    const fx = Math.floor(r4() * S);
    const fy = Math.floor(r4() * S);
    const col = flowerColors[Math.floor(r4() * flowerColors.length)];
    // 4 petals (cross)
    c.fillStyle = '#f0f0f0';
    c.fillRect(fx,     fy - 2, 2, 2); // top
    c.fillRect(fx,     fy + 2, 2, 2); // bottom
    c.fillRect(fx - 2, fy,     2, 2); // left
    c.fillRect(fx + 2, fy,     2, 2); // right
    // Center dot
    c.fillStyle = col;
    c.fillRect(fx, fy, 2, 2);
  }

  // ── Flower clusters (grouped 2-3) ──────────────────────────
  const r5 = rng(555);
  for (let i = 0; i < 18; i++) {
    const gx = Math.floor(r5() * S);
    const gy = Math.floor(r5() * S);
    const gcol = flowerColors[Math.floor(r5() * flowerColors.length)];
    for (let j = 0; j < 3; j++) {
      const ox = Math.floor(r5() * 10) - 5;
      const oy = Math.floor(r5() * 8) - 4;
      c.fillStyle = '#f0f0f0';
      c.fillRect(gx+ox,     gy+oy-2, 2, 2);
      c.fillRect(gx+ox,     gy+oy+2, 2, 2);
      c.fillRect(gx+ox-2,   gy+oy,   2, 2);
      c.fillRect(gx+ox+2,   gy+oy,   2, 2);
      c.fillStyle = gcol;
      c.fillRect(gx+ox, gy+oy, 2, 2);
    }
  }

  return oc;
}

function drawStableWorld(w, h) {
  ctx.imageSmoothingEnabled = false;
  const chapter = chapters[state?.chapter || 0];

  // ── PunyWorld tile map (cached per-round) ──────────────────
  const _mapRound = state?.round || 0;
  if (!_mapCanvas || _mapCanvas.round !== _mapRound || _mapCanvas.w !== w || _mapCanvas.h !== h) {
    _mapCanvas = { round:_mapRound, w, h, el: rebuildMapCanvas(w, h, _mapRound, state?.obstacles) };
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_mapCanvas.el, 0, 0);

  // Terrain relief disabled — PunyWorld tileset + obstacle tiles
  // provide sufficient visual variety without large procedural blobs.

  // ── Radial edge vignette ────────────────────────────────────
  const vig = ctx.createRadialGradient(w/2, h/2, h*0.32, w/2, h/2, h*0.76);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawStablePlayer(p) {
  if (!p) return;
  const x = Math.round(p.x);
  const y = Math.round(screenY(p));
  drawPixelShadow(x, p.y + 12, 34, 12, 0.3);
  const c = p.classColor || "#d8b85c";
  px(x - 10, y - 35, 20, 24, "#e8d0a0");
  px(x - 8, y - 51, 16, 16, "#f0a060");
  px(x - 11, y - 39, 22, 14, c);
  px(x - 15, y - 28, 8, 16, "#5a3218");
  px(x + 7, y - 28, 8, 16, "#5a3218");
  px(x - 14, y - 44, 6, 18, "#9b2f2f");
  px(x - 4, y - 45, 3, 3, "#1c0a04");
  px(x + 5, y - 45, 3, 3, "#1c0a04");
  const petX = x + 42;
  const petY = y - 16;
  drawPixelShadow(petX, petY + 12, 20, 7, 0.22);
  px(petX - 8, petY - 8, 16, 12, "#9b6b3c");
  px(petX + 4, petY - 13, 9, 8, "#b9824a");
  px(petX - 13, petY - 6, 7, 5, "#7a4b2a");
}

// ═══════════════════════════════════════════════════════════
//  GAME LOGIC
// ═══════════════════════════════════════════════════════════
function startGame() {
  state = baseState(selectedClass);

  // ── Apply menu shop purchases (no float text during init) ──
  for (const { item } of _menuWeapons) {
    state.ownedWeapons.push({ ...item, level:1, paid:item.cost });
    applyWeaponEffect(item.effect, 1);
    if (item.build) addEvolutionScore(item.build, 14);
  }
  for (const { upg, value, rarity } of _menuUpgrades) {
    const p = state.player;
    if (upg.stat === "maxHp") { p.maxHp += value; p.hp = Math.min(p.maxHp, p.hp + value); }
    else if (upg.stat === "projectiles") { p.projectiles = Math.min(6, p.projectiles + 1); }
    else if (upg.stat === "goldRate")    { p.goldRate += value / 100; }
    else if (upg.stat === "fireRate")    { p.fireRate = Math.max(0.08, p.fireRate + value); }
    else { p[upg.stat] += value; }
    if (upg.build) addEvolutionScore(upg.build, 8 + rarity.power * 4);
  }

  // Stage mode: boss appears at the final round of the stage
  if (_stageMode && _currentStage) {
    state.shopEvery = _currentStage.rounds;
    state.partner   = initPartner();   // activate companion
  }

  state.running = true;
  paused = false;
  last = performance.now();
  document.getElementById("mainMenu")?.classList.remove("show");
  hide(ui.startModal);
  hide(ui.resultModal);
  hide(ui.shopModal);
  hide(ui.routeModal);
  document.getElementById("deathCard")?.classList.remove("show");
  updateEvolveBar();
}

// ── Return to main menu after death / restart ───────────────
function resetToMenu() {
  _menuCoins    = MENU_START_COINS;
  _menuWeapons  = [];
  _menuUpgrades = [];
  _stageMode    = false;
  _currentStage = null;
  hide(ui.resultModal);
  document.getElementById("deathCard")?.classList.remove("show");
  // Restore infinite-mode panel view
  const shopView  = document.getElementById("mmShopView");
  const stageView = document.getElementById("mmStageView");
  const startBtnEl = document.getElementById("menuStartBtn");
  const stageBtnEl = document.getElementById("menuStageBtn");
  if (shopView)  shopView.style.display  = "";
  if (stageView) stageView.style.display = "none";
  startBtnEl?.classList.add("mm-btn-primary");
  startBtnEl?.classList.remove("mm-btn-stage", "mm-btn-dim");
  if (startBtnEl) { startBtnEl.textContent = "∞ 开始游戏"; startBtnEl.disabled = false; }
  stageBtnEl?.classList.remove("mm-btn-primary");
  stageBtnEl?.classList.add("mm-btn-stage");
  renderMenuShop();
  document.getElementById("mainMenu")?.classList.add("show");
}

function show(el) { el?.classList.add("show"); }
function hide(el) { el?.classList.remove("show"); }

// ═══════════════════════════════════════════════════════════
//  MAIN-MENU PRE-RUN SHOP
// ═══════════════════════════════════════════════════════════

function _mmUpdateBudget() {
  const el = document.getElementById("mmBudget");
  if (el) {
    el.textContent = _menuCoins;
    el.style.color = _menuCoins < 300 ? "#ff6060" : _menuCoins < 800 ? "#ffaa30" : "#ffe060";
  }
  _mmUpdateOwned();
}

function _mmUpdateOwned() {
  const bar = document.getElementById("mmShopOwned");
  if (!bar) return;
  bar.innerHTML = "";
  if (_menuWeapons.length === 0 && _menuUpgrades.length === 0) {
    bar.innerHTML = `<span style="font-size:10px;color:#6a4820;opacity:.65">尚未购买任何装备 — 也可以空手出征</span>`;
    return;
  }
  for (const { item } of _menuWeapons) {
    const tag = document.createElement("button");
    tag.className = "mm-shop-owned-tag";
    tag.textContent = `${item.name} ×退`;
    tag.title = "点击退款并移除";
    tag.addEventListener("click", () => {
      _menuCoins += item.cost;
      _menuWeapons = _menuWeapons.filter(w => w.item !== item);
      _mmUpdateBudget();
      renderMenuShop(); // re-render cards to update state
    });
    bar.appendChild(tag);
  }
  for (const entry of _menuUpgrades) {
    const tag = document.createElement("button");
    tag.className = "mm-shop-owned-tag";
    tag.style.borderColor = "rgba(160,100,220,.4)";
    tag.textContent = `${entry.upg.name} ×退`;
    tag.title = "点击退款并移除";
    tag.addEventListener("click", () => {
      _menuCoins += entry.upg.cost ?? UPGRADE_COST;
      _menuUpgrades = _menuUpgrades.filter(u => u !== entry);
      _mmUpdateBudget();
      renderMenuShop();
    });
    bar.appendChild(tag);
  }
}

function renderMenuShop() {
  _renderMenuWeapons();
  _renderMenuUpgrades();
  _mmUpdateBudget();
}

function _renderMenuWeapons() {
  const grid = document.getElementById("mmShopWeapons");
  if (!grid) return;
  grid.innerHTML = "";
  for (const item of weaponShop) {
    const owned   = _menuWeapons.some(w => w.item === item);
    const canAfford = _menuCoins >= item.cost;
    const card = document.createElement("button");
    card.className = `mm-shop-card rar-${item.rarity}${owned ? " mm-shop-card-owned" : ""}${!owned && !canAfford ? " mm-shop-card-broke" : ""}`;
    card.appendChild(makeIconCanvas(item.name));
    card.insertAdjacentHTML("beforeend",
      `<div class="mm-shop-card-name">${item.name}</div>` +
      `<div class="mm-shop-card-cost">${owned ? "已购" : item.cost + " ◆"}</div>` +
      `<div class="mm-shop-card-desc">${item.text}</div>`);
    card.addEventListener("click", () => {
      if (owned) return; // click to refund handled via owned bar
      if (!canAfford) {
        card.classList.add("mm-shake");
        setTimeout(() => card.classList.remove("mm-shake"), 300);
        return;
      }
      _menuCoins -= item.cost;
      _menuWeapons.push({ item });
      renderMenuShop();
    });
    grid.appendChild(card);
  }
}

function _renderMenuUpgrades() {
  const grid = document.getElementById("mmShopUpgrades");
  if (!grid) return;
  grid.innerHTML = "";
  const rarity = rarities[2]; // 史诗 quality for menu shop
  for (const upg of upgrades) {
    const upgCost   = upg.cost ?? UPGRADE_COST;  // per-upgrade price, fallback to global
    const owned     = _menuUpgrades.some(u => u.upg === upg);
    const canAfford = _menuCoins >= upgCost;
    const value   = upg.stat === "fireRate"
      ? +(upg.base * rarity.power).toFixed(3)
      : Math.round(upg.base * rarity.power);
    const valStr  = upg.stat === "crit" || upg.stat === "goldRate"
      ? Math.round(value) + "%" : value;
    const card = document.createElement("button");
    card.className = `mm-shop-card rar-史诗${owned ? " mm-shop-card-owned" : ""}${!owned && !canAfford ? " mm-shop-card-broke" : ""}`;
    card.appendChild(makeIconCanvas(upg.name));
    card.insertAdjacentHTML("beforeend",
      `<div class="mm-shop-card-name">${upg.name}</div>` +
      `<div class="mm-shop-card-cost">${owned ? "已购" : upgCost + " ◆"}</div>` +
      `<div class="mm-shop-card-desc">${upg.text} +${valStr}</div>`);
    card.addEventListener("click", () => {
      if (owned) return;
      if (!canAfford) {
        card.classList.add("mm-shake");
        setTimeout(() => card.classList.remove("mm-shake"), 300);
        return;
      }
      _menuCoins -= upgCost;
      _menuUpgrades.push({ upg, value, rarity });
      renderMenuShop();
    });
    grid.appendChild(card);
  }
}

// Class selection in main menu
document.getElementById("mmClassTabs")?.addEventListener("click", ev => {
  const tab = ev.target.closest("[data-class]");
  if (!tab) return;
  selectedClass = tab.dataset.class;
  document.querySelectorAll(".mm-class-tab").forEach(t => {
    t.classList.toggle("active", t === tab);
  });
});

function spawnEnemy(kind = "normal") {
  const side = Math.floor(rand(0, 4));
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const pos = [
    { x:rand(0,w), y:-40 },
    { x:w+40, y:rand(0,h) },
    { x:rand(0,w), y:h+40 },
    { x:-40, y:rand(0,h) }
  ][side];
  const cb = 1 + state.chapter * 0.3;
  const elite = kind==="elite", boss = kind==="boss", archer = kind==="archer";

  // ── Stage-aware scaling ────────────────────────────────
  const stageId  = _stageMode && _currentStage ? _currentStage.id : 0;
  const stageCfg = STAGE_CONFIG[stageId] || null;
  const sb       = stageCfg ? stageCfg.sb      : 1.0;
  const dmgTier  = stageCfg ? stageCfg.dmgTier : 1.0;

  // HP — stage mode uses fixed sb×cb base (no wave scaling);
  //      infinite mode keeps legacy wave-scaling formula
  const baseHp = boss
    ? (stageCfg ? stageCfg.bossHp : 1200 * cb)          // boss: fixed per stage OR legacy
    : elite  ? Math.round(180 * (stageCfg ? sb : 1) * cb)
    : archer ? Math.round((stageCfg ? 41*sb : 35+state.wave*6) * cb)
    :           Math.round((stageCfg ? 59*sb : 50+state.wave*9) * cb);

  // Speed — stage mode uses per-stage base ranges; infinite mode keeps legacy
  let speedBase;
  if (boss)        speedBase = stageCfg ? stageCfg.bossBase  : 52;
  else if (elite)  speedBase = stageCfg ? stageCfg.eliteBase : 80;
  else if (archer) speedBase = stageCfg ? stageCfg.archerBase: 55 + state.wave*2;
  else             speedBase = stageCfg
    ? rand(stageCfg.normalBase[0], stageCfg.normalBase[1])
    : rand(70, 108);

  // Damage — new base values (10/8/20/36) scaled by dmgTier
  const baseDmg = boss ? 36 : elite ? 20 : archer ? 8 : 10;

  // Route: curse empowers spawned enemies at tier 4
  const cursed = state.buildRoute === "curse" && state.buildRouteTier >= 4 && !boss;
  const hpMul  = (cursed ? 1.35 : 1) * (state.eventFlags?.enemyHpMul || 1);
  const spMul  = cursed ? 1.20 : 1;
  const dmMul  = (cursed ? 1.25 : 1) * (state.eventFlags?.enemyDmgMul || 1);
  // ── Elite trait assignment ─────────────────────────────
  let eliteTrait = null;
  if (elite) {
    const traitRoll = Math.random();
    if      (traitRoll < 0.33) eliteTrait = "shield";   // absorbs hit, recharges
    else if (traitRoll < 0.66) eliteTrait = "dash";     // speed-dash toward player
    else                        eliteTrait = "explode";  // explosive death
  }

  // cb already baked into baseHp (except infinite-mode boss which uses legacy cb)
  const finalHp = Math.round(baseHp * hpMul);
  const shieldBase = Math.round((80 + state.wave * 4) * sb);

  // Sprite key — stage-mode uses STAGE_CONFIG, infinite mode rotates by wave tier
  let spriteKey;
  if (stageCfg) {
    spriteKey = boss   ? (stageCfg.bossSprite   || 'dragon')
              : elite  ? (stageCfg.eliteSprite  || 'ogre')
              : archer ? (stageCfg.archerSprite || 'eye')
              :           (stageCfg.normalSprite || 'hound');
  } else {
    // Infinite mode: vary sprites every 3 waves so enemies visually evolve
    const wt = Math.floor(state.wave / 3); // 0,1,2,3...
    if (boss) {
      spriteKey = (wt % 2 === 0) ? 'dragon' : 'freeknight';
    } else if (elite) {
      spriteKey = (wt % 2 === 0) ? 'ogre' : 'knight';
    } else if (archer) {
      spriteKey = (wt % 2 === 0) ? 'eye' : 'wizard';
    } else {
      const normals = ['hound', 'slime', 'hero', 'hound'];
      spriteKey = normals[wt % normals.length];
    }
  }

  state.enemies.push({
    ...pos, z:0,
    r:      boss?52 : elite?32 : 20,
    hp:     finalHp,
    maxHp:  finalHp,
    speed:  (speedBase + state.wave*3) * spMul,
    damage: Math.round(baseDmg * dmgTier) * dmMul,
    kind,
    spriteKey,
    attackCd: 0,
    wobble: rand(0, Math.PI*2),
    cursedEnemy: cursed,
    anim: initAnim('Walk'),
    facing: 1,
    ...(archer ? { shootCd:0, preferDist:190 } : {}),
    // Elite trait fields
    eliteTrait,
    shieldHp:  eliteTrait === "shield"  ? shieldBase : 0,
    shieldMax: eliteTrait === "shield"  ? shieldBase : 0,
    shieldCd:  0,
    dashCd:    eliteTrait === "dash"    ? 3.5 : 0,
    dashTimer: 0,
    dashVx:    0, dashVy: 0
  });
}

function nearestEnemy() {
  let best=null, bestD=Infinity;
  for (const e of state.enemies) {
    const d = distance(state.player, e);
    if (d < bestD) { bestD=d; best=e; }
  }
  return best;
}

function meleeSwing(target) {
  const p = state.player;
  const baseAngle = Math.atan2(target.y - p.y, target.x - p.x);
  const range = p.traits.meleeRange || 110;
  const arc   = p.traits.meleeArc   || 1.1;
  const berserkMul = (state.buildRoute === "curse" && state.routeState?.berserking) ? 1.5 : 1;
  if (p.anim) p.anim.attackFlash = 0.22;

  for (const e of state.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > range + e.r) continue;
    let diff = Math.atan2(dy, dx) - baseAngle;
    while (diff >  Math.PI) diff -= 2*Math.PI;
    while (diff < -Math.PI) diff += 2*Math.PI;
    if (Math.abs(diff) > arc * 0.5) continue;

    const crit = Math.random()*100 < p.crit;
    const dmg  = p.damage * (crit ? p.critDamage : 1) * berserkMul;
    const fakeBullet = { damage:dmg, crit, aoeRadius:p.traits.aoeRadius||0,
                         chainOnCrit:p.traits.chainOnCrit, x:e.x, y:e.y };
    applyBulletHit(fakeBullet, e);
    floatText(e.x, e.y - e.r - 28, crit ? `${Math.round(dmg)}!` : Math.round(dmg),
              crit ? '#ffd45c' : '#fff');
    burst(e.x, e.y, crit ? '#ffd45c' : '#e8e8e8', crit ? 14 : 8);
    // Iron Guardian: heavy knockback on each melee hit
    if (state.ironGuardian?.active) {
      const kbAng = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(kbAng) * 195;
      e.y += Math.sin(kbAng) * 195;
      state.skills._shakeTimer = Math.max(state.skills._shakeTimer||0, 0.14);
      state.skills._shakeAmt   = 5;
    }
  }

  // Push visual slash arc
  state.meleeSlashes.push({
    x:p.x, y:p.y - 20,
    angle:baseAngle, arc, range,
    life:0.22, maxLife:0.22,
    color: state.classId === 'tank' ? '#80e080' : '#ffd45c'
  });
}

function shoot(target) {
  const p = state.player;
  // Melee classes swing instead of shooting
  if (p.traits.melee) { meleeSwing(target); return; }
  const baseAngle = Math.atan2(target.y-p.y, target.x-p.x);
  for (let i = 0; i < p.projectiles; i++) {
    const spread = (i - (p.projectiles-1)/2) * 0.16;
    const angle = baseAngle + spread;
    const crit = Math.random()*100 < p.crit;
    const spd = p.traits.aoeRadius ? 470 : 620;
    const berserkMul = (state.buildRoute === "curse" && state.routeState?.berserking) ? 1.5 : 1;
    if (p.anim) p.anim.attackFlash = 0.22;
    state.bullets.push({
      x:p.x, y:p.y-15,
      vx:Math.cos(angle)*spd,
      vy:Math.sin(angle)*spd,
      r: p.traits.aoeRadius ? 9 : crit ? 8 : 6,
      life:1.2,
      damage:p.damage * (crit ? p.critDamage : 1) * berserkMul,
      crit, aoeRadius:p.traits.aoeRadius||0,
      chainOnCrit:p.traits.chainOnCrit
    });
  }
}

function roll() {
  const p = state.player;
  if (p.rollCd <= 0 && p.rollTime <= 0) {
    const berserkDash = state.buildRoute === "curse" && state.routeState?.berserkDashBoost && state.routeState?.berserking;
    p.rollCd  = berserkDash ? 0.7 : (p.traits.dashCooldown || 1.8);
    p.rollTime = berserkDash ? 0.36 : 0.28;
    if (state.tracker) state.tracker.dashCount++;
    p.invuln   = 0.48;
    playSound('dash');
    burst(p.x, p.y, "#9df6ff", 14);
    if (p.traits.cloneDash) {
      state.afterimages.push({ x:p.x, y:p.y, z:p.z, life:0.75 });
      floatText(p.x, p.y-70, "影袭残像", "#ffd45c");
    }
    if (p.traits.slamDash) tankSlam(p.x, p.y);

    // Strength phase3: roll also = slam
    const ev = state.evolution;
    if (ev.dominant==="strength" && ev.phase >= 2) {
      tankSlam(p.x, p.y);
      floatText(p.x, p.y-90, "震地爆发", "#ff6020");
    }
  }
}

function tankSlam(x, y) {
  for (const enemy of state.enemies) {
    const d = distance({ x, y }, enemy);
    if (d < 190) {
      const angle = Math.atan2(enemy.y-y, enemy.x-x);
      enemy.hp -= state.player.damage * 1.25;
      enemy.x += Math.cos(angle) * (state.player.traits.knockback||60);
      enemy.y += Math.sin(angle) * (state.player.traits.knockback||60);
    }
  }
  burst(x, y, "#65e572", 48);
}

// ═══════════════════════════════════════════════════════════
//  ACTIVE SKILL SYSTEM — Q and E abilities per class
// ═══════════════════════════════════════════════════════════

function useSkillQ() {
  if (!state?.running) return;
  const sk = state.skills.q;
  if (sk.cd > 0) return;
  sk.cd = sk.maxCd;
  if (state.classId === 'duelist')     shadowDash();
  else if (state.classId === 'tank')   earthbreaker();
  else if (state.classId === 'mage')   corruptionOrb();
}

function useSkillE() {
  if (!state?.running) return;
  const sk = state.skills.e;
  if (sk.cd > 0) return;
  sk.cd = sk.maxCd;
  if (state.classId === 'duelist')     activatePhantomHunt();
  else if (state.classId === 'tank')   activateIronGuardian();
  else if (state.classId === 'mage')   activateAbyssRitual();
}

// ── Assassin Q: Shadow Dash ──────────────────────────────
function shadowDash() {
  const p = state.player;
  // Direction: movement keys first, then toward nearest enemy
  let dx=0, dy=0;
  if (keys.KeyW||keys.ArrowUp)    dy -= 1;
  if (keys.KeyS||keys.ArrowDown)  dy += 1;
  if (keys.KeyA||keys.ArrowLeft)  dx -= 1;
  if (keys.KeyD||keys.ArrowRight) dx += 1;
  if (Math.hypot(dx, dy) < 0.1) {
    const tgt = nearestEnemy();
    if (tgt) { dx = tgt.x - p.x; dy = tgt.y - p.y; }
    else { dy = -1; }
  }
  const len = Math.hypot(dx, dy) || 1;
  const ndx = dx/len, ndy = dy/len;
  const DIST = 210;
  const STEP = 28;
  const STEPS = Math.ceil(DIST / STEP);

  // Afterimages along the path
  for (let s = 1; s <= 3; s++) {
    state.afterimages.push({ x: p.x + ndx*DIST*(s/3), y: p.y + ndy*DIST*(s/3), z: p.z, life: 0.65 });
  }

  // Collect enemies along dash path + dark pixel trails
  const hitEnemies = new Set();
  for (let s = 0; s <= STEPS; s++) {
    const sx = p.x + ndx * STEP * s, sy = p.y + ndy * STEP * s;
    // dark smoke trails
    state.particles.push({ x:sx+rand(-8,8), y:sy+rand(-16,4), vx:rand(-20,20), vy:rand(-40,-10),
      color: s%2===0?'#3a1060':'#220040', life:rand(0.3,0.55), size:rand(3,6) });
    for (const e of state.enemies) {
      if (hitEnemies.has(e) || e.infected) continue;
      if (distance({x:sx,y:sy}, e) < e.r + 30) hitEnemies.add(e);
    }
  }

  // Teleport player to end of dash (wall-aware)
  const pr = p.r || 22;
  let destX = p.x, destY = p.y;
  for (let s = 1; s <= STEPS; s++) {
    const tx = p.x + ndx * STEP * s, ty = p.y + ndy * STEP * s;
    if (collidesWall(tx, ty, pr)) break;
    destX = Math.max(36, Math.min(canvas.clientWidth-36, tx));
    destY = Math.max(52, Math.min(canvas.clientHeight-36, ty));
  }
  p.x = destX; p.y = destY;
  p.invuln = 0.45;
  p.rollTime = 0.22; // visual dash flicker
  burst(p.x, p.y, '#9944ff', 20);

  // Slash every enemy in path
  let firstHit = null;
  for (const e of hitEnemies) {
    const crit = Math.random()*100 < p.crit;
    const dmg  = p.damage * 2.4 * (crit ? p.critDamage : 1);
    applyBulletHit({ damage:dmg, crit, aoeRadius:0, chainOnCrit:false, x:e.x, y:e.y }, e);
    floatText(e.x, e.y-e.r-28, crit ? `${Math.round(dmg)}!` : Math.round(dmg), crit?'#ffd45c':'#cc88ff');
    burst(e.x, e.y, '#cc88ff', 10);
    state.meleeSlashes.push({ x:e.x, y:e.y-20, angle:Math.atan2(ndy,ndx), arc:0.7,
      range:75, life:0.18, maxLife:0.18, color:'#cc88ff' });
    // Crit reduces Q cooldown
    if (crit) state.skills.q.cd = Math.max(0, state.skills.q.cd - 1.8);
    if (!firstHit) firstHit = e;
  }
  floatText(p.x, p.y-75, '影袭！', '#cc88ff');

  // Dog: leap to first hit enemy, deal heavy hit
  if (firstHit && state.dog) {
    const dmg = p.damage * 2.0;
    firstHit.hp -= dmg;
    floatText(firstHit.x, firstHit.y-firstHit.r-22, Math.round(dmg), '#ffd45c');
    burst(firstHit.x, firstHit.y, '#ffd45c', 14);
    state.dog.teleportFx = 1.0;
    state.dog.teleportCd = Math.min(state.dog.teleportCd, 0.5);
  }
}

// ── Assassin E: Phantom Hunt ────────────────────────────
function activatePhantomHunt() {
  const p = state.player;
  const ph = state.phantomHunt;
  if (ph.active) return;
  ph.active = true;
  ph.timer  = 5.5;
  ph.speedBonus = p.speed * 0.32;
  ph.rateMul    = 0.50; // fireRate * 0.5 = twice as fast
  p.speed    += ph.speedBonus;
  p.fireRate *= ph.rateMul;
  floatText(p.x, p.y-90, '幻影狩猎！', '#ff2244');
  burst(p.x, p.y, '#ff2244', 36);
  if (state.dog) { state.dog._phantomTimer = 5.5; state.dog.attackCd = 0; }
}

// ── Tank Q: Earthbreaker ─────────────────────────────────
function earthbreaker() {
  const p = state.player;
  const RADIUS = 170;
  let hitCount = 0;
  for (const e of state.enemies) {
    const d = distance(p, e);
    if (d < RADIUS + e.r) {
      const dmg = p.damage * 1.9;
      e.hp -= dmg;
      floatText(e.x, e.y-e.r-26, Math.round(dmg), '#80ff80');
      // Stun normal/archer enemies
      if (e.kind !== 'boss' && e.kind !== 'elite') e.stun = Math.max(e.stun||0, 0.9);
      // Knockback
      const ang = Math.atan2(e.y-p.y, e.x-p.x);
      e.x += Math.cos(ang) * 90; e.y += Math.sin(ang) * 90;
      burst(e.x, e.y, '#80ff80', 8);
      hitCount++;
    }
  }
  // Destroy enemy projectiles in range
  state.enemyBullets = state.enemyBullets.filter(b => distance(p, b) >= RADIUS - 20);
  // Earthy crack particles
  for (let i=0; i<48; i++) {
    const a = rand(0, Math.PI*2), spd = rand(55, 290), r = rand(0.4, 1.0);
    const cols = ['#8b6040','#c8a060','#608040','#90c040','#6b4a28'];
    state.particles.push({ x:p.x+rand(-10,10), y:p.y+rand(-10,10),
      vx:Math.cos(a)*spd*r, vy:Math.sin(a)*spd*r,
      color:cols[Math.floor(rand(0,5))], life:rand(0.28,0.75), size:rand(3,8) });
  }
  // Screen shake
  state.skills._shakeTimer = 0.38; state.skills._shakeAmt = 10;
  floatText(p.x, p.y-82, hitCount > 0 ? `裂地冲击！×${hitCount}` : '裂地冲击！', '#80ff80');
  burst(p.x, p.y, '#80e080', 55);
  // Dog: taunt nearby enemies (they freeze 2.2s)
  if (state.dog) {
    for (const e of state.enemies) {
      if (distance(p, e) < RADIUS + 60 && e.kind !== 'boss') {
        e.stun = Math.max(e.stun||0, 2.2);
      }
    }
    floatText(p.x+55, p.y-55, '汪！挑衅！', '#ffd45c');
  }
}

// ── Tank E: Iron Guardian ────────────────────────────────
function activateIronGuardian() {
  const p = state.player;
  const ig = state.ironGuardian;
  if (ig.active) return;
  ig.active = true;
  ig.timer  = 7.0;
  ig._regenTimer = 0;
  ig.drBonus = 0.50;
  p.traits.damageReduction = Math.min(0.85, (p.traits.damageReduction||0) + ig.drBonus);
  // Instant shield restore
  if (p.shieldMax > 0) { p.shield = p.shieldMax; p.shieldTimer = 0; }
  floatText(p.x, p.y-90, '铁壁护卫！', '#c8e860');
  burst(p.x, p.y, '#a0ff50', 45);
  if (state.dog) { state.dog._armoredTimer = 7.0; state.dog.armorFlash = 1.0;
    floatText(p.x-65, p.y-55, '护甲激活！', '#c8e860'); }
}

// ── Mage Q: Corruption Orb ──────────────────────────────
function corruptionOrb() {
  const p = state.player;
  const tgt = nearestEnemy();
  const dx = tgt ? tgt.x-p.x : 0, dy = tgt ? tgt.y-p.y : -1;
  const len = Math.hypot(dx, dy) || 1;
  state.bullets.push({
    x:p.x, y:p.y-16, z:14,
    vx:(dx/len)*240, vy:(dy/len)*240,
    r:16, life:2.4, damage:p.damage*1.6,
    crit:false, aoeRadius:0,
    isCorruptOrb:true
  });
  // Launch burst
  for (let i=0; i<16; i++) {
    const a = rand(0, Math.PI*2);
    state.particles.push({ x:p.x, y:p.y-16, vx:Math.cos(a)*rand(25,75), vy:Math.sin(a)*rand(25,75),
      color:i%2===0?'#9933dd':'#cc44ff', life:rand(0.25,0.5), size:rand(3,7) });
  }
  floatText(p.x, p.y-78, '腐化法球！', '#cc44ff');
  if (state.dog) state.dog._corruptHuntTimer = 4.0; // dog will prioritize corrupted enemies
}

// ── Mage E: Abyss Ritual ────────────────────────────────
function activateAbyssRitual() {
  const p = state.player;
  const ar = state.abyssRitual;
  if (ar.active) return;
  ar.active = true;
  ar.timer  = 6.5;
  ar.runeAngle = 0;
  floatText(p.x, p.y-92, '深渊仪式！', '#aa44ff');
  burst(p.x, p.y, '#8833cc', 55);
  if (state.dog) { state.dog._ritualTimer = 6.5; }
}

// ── Skill Update (called every frame) ───────────────────
function updateSkills(dt) {
  if (!state?.running) return;
  const p   = state.player;
  const sk  = state.skills;

  // Tick cooldowns
  sk.q.cd = Math.max(0, sk.q.cd - dt);
  sk.e.cd = Math.max(0, sk.e.cd - dt);
  if (sk._shakeTimer > 0) sk._shakeTimer -= dt;

  // ── Phantom Hunt ─────────────────────────────────────
  const ph = state.phantomHunt;
  if (ph.active) {
    ph.timer -= dt;
    // Red smoke wisps from player
    if (Math.random() < 0.45) {
      state.particles.push({ x:p.x+rand(-22,22), y:p.y+rand(-30,8),
        vx:rand(-18,18), vy:rand(-55,-18),
        color:Math.random()<0.6?'#ff1122':'#440011', life:rand(0.3,0.6), size:rand(3,6) });
    }
    // Tick phantom marks (they expire independently)
    for (const e of state.enemies) {
      if ((e.phantomMark||0) > 0) e.phantomMark -= dt;
    }
    // Dog phantom mode tick
    if (state.dog?._phantomTimer > 0) state.dog._phantomTimer -= dt;

    if (ph.timer <= 0) {
      ph.active = false;
      p.speed    -= ph.speedBonus;
      p.fireRate /= ph.rateMul;
      if (state.dog) state.dog._phantomTimer = 0;
      floatText(p.x, p.y-72, '幻影消散', '#aa4455');
    }
  }

  // ── Iron Guardian ────────────────────────────────────
  const ig = state.ironGuardian;
  if (ig.active) {
    ig.timer -= dt;
    // Fast shield regen (15% every 0.5s)
    ig._regenTimer += dt;
    if (ig._regenTimer >= 0.5 && p.shieldMax > 0) {
      ig._regenTimer = 0;
      p.shield = Math.min(p.shieldMax, p.shield + p.shieldMax * 0.15);
    }
    // Gravity pull — draw enemies slowly toward player
    for (const e of state.enemies) {
      const d = distance(p, e);
      if (d < 230 && d > p.r + e.r + 8) {
        const ang = Math.atan2(p.y-e.y, p.x-e.x);
        const pull = 45 * dt;
        const ex2 = e.x + Math.cos(ang)*pull, ey2 = e.y + Math.sin(ang)*pull;
        if (!collidesWall(ex2, ey2, e.r||18)) { e.x = ex2; e.y = ey2; }
      }
    }
    // Armor glow particles
    if (Math.random() < 0.3) {
      const a = rand(0, Math.PI*2), r = rand(24, 34);
      state.particles.push({ x:p.x+Math.cos(a)*r, y:p.y+Math.sin(a)*r-12,
        vx:Math.cos(a)*18, vy:Math.sin(a)*18-28,
        color:'#c8e860', life:rand(0.2,0.45), size:rand(2,5) });
    }
    // Dog armored tick
    if (state.dog?._armoredTimer > 0) state.dog._armoredTimer -= dt;

    if (ig.timer <= 0) {
      ig.active = false;
      p.traits.damageReduction = Math.max(0, (p.traits.damageReduction||0) - ig.drBonus);
      if (state.dog) state.dog._armoredTimer = 0;
      floatText(p.x, p.y-72, '铁壁结束', '#809840');
    }
  }

  // ── Abyss Ritual ─────────────────────────────────────
  const ar = state.abyssRitual;
  if (ar.active) {
    ar.timer -= dt;
    ar.runeAngle += dt * 1.6;
    // Ritual smoke around field edge
    if (Math.random() < 0.35) {
      const ra = rand(0, Math.PI*2), rr = rand(120, 200);
      state.particles.push({ x:p.x+Math.cos(ra)*rr, y:p.y+Math.sin(ra)*rr,
        vx:0, vy:rand(-38,-10), color:'#5522aa', life:rand(0.5,1.1), size:rand(2,5) });
    }
    // Dog ritual tick
    if (state.dog?._ritualTimer > 0) state.dog._ritualTimer -= dt;

    if (ar.timer <= 0) {
      ar.active = false;
      if (state.dog) state.dog._ritualTimer = 0;
      floatText(p.x, p.y-72, '仪式消退', '#774499');
    }
  }

  // ── Corruption DoT ───────────────────────────────────
  for (const e of state.enemies) {
    if ((e.corrupted||0) > 0) {
      e.corrupted -= dt;
      e.hp -= (e.corruptDot||0) * dt;
      if (Math.random() < 0.10) {
        state.particles.push({ x:e.x+rand(-e.r,e.r), y:e.y+rand(-e.r,0),
          vx:rand(-14,14), vy:rand(-48,-12),
          color:Math.random()<0.5?'#7722aa':'#cc44ff', life:rand(0.2,0.45), size:rand(2,4) });
      }
    }
  }

  // ── Dog skill-state updates ──────────────────────────
  if (state.dog) {
    const dog = state.dog;
    if ((dog._corruptHuntTimer||0) > 0) dog._corruptHuntTimer -= dt;
  }
}

// ── Skill Visual Effects (drawn on canvas) ───────────────
function drawSkillEffects() {
  if (!state?.running) return;
  const p = state.player;

  // ── Phantom Hunt: red-eye aura + mark rings ──────────
  const ph = state.phantomHunt;
  if (ph.active) {
    const sy = screenY(p);
    // Red aura halo above player head
    ctx.save();
    ctx.globalAlpha = 0.45 + Math.sin(state.time * 13) * 0.25;
    const eyeGrad = ctx.createRadialGradient(p.x, sy-38, 3, p.x, sy-38, 32);
    eyeGrad.addColorStop(0, '#ff0000');
    eyeGrad.addColorStop(0.6, '#880011');
    eyeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGrad;
    ctx.fillRect(p.x-32, sy-70, 64, 52);
    ctx.restore();
    // Mark ring on marked enemies
    for (const e of state.enemies) {
      if ((e.phantomMark||0) <= 0) continue;
      const ese = screenY(e);
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.phantomMark) * 0.75;
      ctx.strokeStyle = '#ff2244';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4,3]);
      ctx.beginPath();
      ctx.arc(e.x, ese, e.r + 5, 0, Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Inner skull-X glyph
      ctx.fillStyle = '#ff2244';
      ctx.font = "bold 12px monospace";
      ctx.textAlign = 'center';
      ctx.fillText('✕', e.x, ese - e.r - 8);
      ctx.restore();
    }
  }

  // ── Iron Guardian: gold aura + pull ring ─────────────
  const ig = state.ironGuardian;
  if (ig.active) {
    const sy = screenY(p);
    const pulse = 0.5 + Math.sin(state.time * 7) * 0.35;
    ctx.save();
    ctx.globalAlpha = 0.22 * pulse;
    const grad = ctx.createRadialGradient(p.x, sy, 12, p.x, sy, 58);
    grad.addColorStop(0, '#ffe060');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, sy, 58, 0, Math.PI*2);
    ctx.fill();
    // Pull boundary ring (dashed)
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#c8e860';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 230, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Timer bar above player
    const frac = ig.timer / 7.0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#1a2008';
    ctx.fillRect(p.x-28, sy-74, 56, 5);
    ctx.fillStyle = `hsl(${80+frac*40},90%,55%)`;
    ctx.fillRect(p.x-28, sy-74, 56*frac, 5);
    ctx.restore();
  }

  // ── Abyss Ritual: animated rune circle ───────────────
  const ar = state.abyssRitual;
  if (ar.active) {
    const FIELD = 200;
    const ang   = ar.runeAngle || 0;
    ctx.save();
    // Ground shadow pool
    ctx.globalAlpha = 0.13;
    const pool = ctx.createRadialGradient(p.x, p.y, 25, p.x, p.y, FIELD);
    pool.addColorStop(0, '#8822cc');
    pool.addColorStop(1, 'transparent');
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.arc(p.x, p.y, FIELD, 0, Math.PI*2); ctx.fill();
    // Outer spinning ring
    ctx.globalAlpha = 0.35 + Math.sin(state.time * 2.5) * 0.10;
    ctx.strokeStyle = '#aa22ff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.arc(p.x, p.y, FIELD, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    // Inner ring (counter-rotate)
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#6622cc';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, FIELD*0.58, 0, Math.PI*2); ctx.stroke();
    // 4 rotating corner runes
    ctx.globalAlpha = 0.85;
    for (let i=0; i<4; i++) {
      const ra  = ang + i * Math.PI*0.5;
      const rx  = p.x + Math.cos(ra)*FIELD, ry = p.y + Math.sin(ra)*FIELD;
      ctx.fillStyle = '#cc55ff';
      ctx.fillRect(rx-4, ry-4, 8, 8);
      ctx.fillStyle = '#441188';
      ctx.fillRect(rx-2, ry-2, 4, 4);
      // inner runes (counter)
      const ri = -ang*1.4 + i*Math.PI*0.5;
      const rix = p.x + Math.cos(ri)*FIELD*0.58, riy = p.y + Math.sin(ri)*FIELD*0.58;
      ctx.fillStyle = '#8833dd';
      ctx.fillRect(rix-3, riy-3, 6, 6);
    }
    // Timer arc (outer)
    const frac = ar.timer / 6.5;
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#cc44ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, FIELD+6, -Math.PI*0.5, -Math.PI*0.5 + Math.PI*2*frac);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skill HUD Icons (drawn on canvas, bottom-right) ──────
function drawSkillHud() {
  if (!state?.running) return;
  const sk = state.skills;
  const w  = canvas.clientWidth, h = canvas.clientHeight;
  const SZ = 50, GAP = 6;
  const CTRL_H = 48; // controls bar height + margin
  const bx = w - 14 - (SZ+GAP)*2 + GAP;
  const by = h - 14 - SZ - CTRL_H;

  const ICONS = {
    duelist: { q:'影袭', e:'狩猎', qC:'#aa66ff', eC:'#ff2244' },
    tank:    { q:'裂地', e:'铁壁', qC:'#80ff80', eC:'#c8e860' },
    mage:    { q:'法球', e:'仪式', qC:'#cc44ff', eC:'#8822cc' }
  };
  const ic  = ICONS[state.classId] || ICONS.mage;
  const eActive = state.phantomHunt?.active || state.ironGuardian?.active || state.abyssRitual?.active;

  const drawIcon = (x, key, label, color, cd, maxCd, active) => {
    const ready = cd <= 0;
    ctx.save();
    // Box background
    ctx.fillStyle   = active ? color+'33' : (ready ? '#1e1208' : '#130c04');
    ctx.strokeStyle = active ? color : (ready ? color : '#443322');
    ctx.lineWidth   = active || ready ? 2 : 1;
    ctx.fillRect(x, by, SZ, SZ);
    ctx.strokeRect(x, by, SZ, SZ);
    // Cooldown overlay (top-fill)
    if (!ready && !active) {
      const prog = cd / maxCd;
      ctx.fillStyle = 'rgba(0,0,0,0.60)';
      ctx.fillRect(x+1, by+1, SZ-2, (SZ-2)*prog);
    }
    // Active pulse fill
    if (active) {
      ctx.globalAlpha = 0.18 + Math.abs(Math.sin(state.time*8))*0.18;
      ctx.fillStyle = color;
      ctx.fillRect(x+2, by+2, SZ-4, SZ-4);
      ctx.globalAlpha = 1;
    }
    // Ready glow pulse
    if (ready && !active) {
      ctx.globalAlpha = 0.12 + Math.abs(Math.sin(state.time*3))*0.15;
      ctx.fillStyle = color;
      ctx.fillRect(x-1, by-1, SZ+2, SZ+2);
      ctx.globalAlpha = 1;
    }
    // Key label top-left
    ctx.font = "bold 10px 'Courier New', monospace";
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.fillText(key, x+4, by+13);
    // Skill name (center)
    ctx.font = "bold 12px 'Microsoft YaHei', monospace";
    ctx.fillStyle = ready || active ? color : '#554433';
    ctx.textAlign = 'center';
    ctx.fillText(label, x+SZ*0.5, by+SZ*0.5+5);
    // Cooldown number bottom
    if (!ready && !active) {
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillStyle = '#887766';
      ctx.textAlign = 'center';
      ctx.fillText(cd.toFixed(1), x+SZ*0.5, by+SZ-5);
    } else if (ready) {
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('READY', x+SZ*0.5, by+SZ-5);
    }
    ctx.restore();
  };

  drawIcon(bx,          'Q', ic.q, ic.qC, sk.q.cd, sk.q.maxCd, false);
  drawIcon(bx+SZ+GAP,   'E', ic.e, ic.eC, sk.e.cd, sk.e.maxCd, eActive);
}

// ═══════════════════════════════════════════════════════════
//  DIALOGUE SYSTEM
// ═══════════════════════════════════════════════════════════
const dlgEl    = document.getElementById('dialogOverlay');
const dlgName  = document.getElementById('dlgName');
const dlgLines = document.getElementById('dlgLines');
const dlgNext  = document.getElementById('dlgNextBtn');
const dlgInput = document.getElementById('dlgInput');
const dlgSend  = document.getElementById('dlgSendBtn');
const dlgInputRow = document.getElementById('dlgInputRow');
const dlgAvatar   = document.getElementById('dlgAvatar');

let _dlgOpen    = false;
let _dlgTyping  = false;
let _dlgQueue   = [];   // { role, text } lines to show one by one
let _dlgHistory = [];   // full conversation for AI context
let _dlgContext = null; // { npcName, systemPrompt, avatar }
let _dlgOnDone  = null;

function dlgIsOpen() { return _dlgOpen; }

function openDialogue(ctx, lines, onDone) {
  // ctx = { npcName, systemPrompt, avatar, allowReply, pauseGame }
  _dlgContext = ctx;
  _dlgOnDone  = onDone || null;
  _dlgHistory = [];
  _dlgQueue   = lines.map(t => ({ role:'npc', text: t }));
  _dlgOpen    = true;
  _dlgTyping  = false;
  // Only pause the game when explicitly requested (boss dialogues)
  if (ctx.pauseGame) {
    paused = true;
    state.running = false;
  }

  dlgAvatar.textContent = ctx.avatar || '?';
  dlgName.textContent   = ctx.npcName || '???';
  dlgLines.innerHTML    = '';
  dlgInputRow.style.display = 'none';
  dlgNext.textContent   = '继续 ▶';
  dlgEl.classList.add('show');

  _dlgAdvance();
}

function _dlgAdvance() {
  if (_dlgQueue.length === 0) {
    // All NPC lines shown
    if (_dlgContext?.allowReply) {
      // Boss dialogue: show reply input, wait for player
      dlgInputRow.style.display = 'flex';
      dlgNext.textContent = _dlgContext.endLabel || '结束对话';
      dlgInput.focus();
    } else {
      // NPC friend: auto-close after 1.5s
      dlgNext.textContent = _dlgContext?.endLabel || '结束对话';
      window.setTimeout(() => { if (_dlgOpen) closeDialogue(); }, 1500);
    }
    return;
  }
  const line = _dlgQueue.shift();
  _dlgAddLine(line.role, line.text);
}

let _dlgCurrentTick = null;   // current typing interval, used by _skipTyping
let _dlgSkipFn      = null;   // function to call when skip is requested

function _skipTyping() {
  // Instantly finish the current line's typewriter and advance
  if (_dlgSkipFn) { _dlgSkipFn(); }
}

function _dlgAddLine(role, text) {
  const div = document.createElement('div');
  div.className = 'dlg-line' + (role === 'player' ? ' player' : '');
  dlgLines.appendChild(div);
  dlgLines.scrollTop = dlgLines.scrollHeight;
  // Typewriter effect
  _dlgTyping = true;
  dlgNext.disabled = false;   // keep enabled so user can skip typing
  dlgNext.textContent = '跳过 ▶';
  let i = 0;
  const prefix = role === 'player' ? '你：' : '';
  div.textContent = prefix;
  div.classList.add('typing');

  function finishLine() {
    if (_dlgCurrentTick) { clearInterval(_dlgCurrentTick); _dlgCurrentTick = null; }
    _dlgSkipFn = null;
    div.textContent = prefix + text;
    div.classList.remove('typing');
    _dlgTyping = false;
    dlgNext.textContent = '继续 ▶';
    dlgLines.scrollTop = dlgLines.scrollHeight;
    // Auto-advance to next line after short pause (NPC lines only)
    if (role !== 'player') {
      window.setTimeout(() => { if (_dlgOpen && !_dlgTyping) _dlgAdvance(); }, 600);
    }
  }

  _dlgSkipFn = finishLine;
  _dlgCurrentTick = setInterval(() => {
    i++;
    div.textContent = prefix + text.slice(0, i);
    if (i >= text.length) { finishLine(); }
  }, 22);
}

// ── Boss scripted fallback dialogue pools ────────────────
const BOSS_REPLY_POOL = {
  // Stage 1 — 翠叶试炼 guardian
  1: [
    '哼……翠叶之灵已认可你的力量。但这只是开始。',
    '你用的那招……我曾见过百人尝试，无一成功。直到今天。',
    '森林的试炼从不留情面。你通过了，这片大地也会记住你。',
    '……弱者在这里化为尘土。你不一样。记好这感觉。',
    '翠叶深处还有比我更凶猛的存在。别骄傲。',
    '你眼中有种东西……不像求生，更像复仇。为了谁？',
  ],
  // Stage 2 — 暗林深处 guardian
  2: [
    '暗林从不怜悯擅闯者……可你不像个擅闯者。',
    '精英们在你面前倒下的样子……我见过太多次了。从未有人走到我面前。',
    '这片黑暗孕育了我三百年。你只用了片刻就将它撕碎。',
    '我守护的秘密……现在是你的了。好好利用它。',
    '下一段路更黑暗。你的眼睛……适应得了吗？',
    '……失败并不丢人。但胜利之后还能保持清醒，才算真正的强者。',
  ],
  // Stage 3 — 赤砂遗迹 guardian
  3: [
    '赤砂之下埋葬了多少英雄……如今又多了我。',
    '双线夹击……你是第一个全身而退的。遗迹认可你了。',
    '这废墟曾是帝国的心脏。如今的守卫只剩我。可笑吗？',
    '你的战法……像是经过血与火淬炼过的。不是天赋，是经历。',
    '沙漠会吞噬一切，包括荣耀。但你今天的胜利……沙漠也会记得。',
    '我倒下了。但遗迹的诅咒还在。小心你的脚步。',
  ],
  // Stage 4 — 霜月城垣 guardian
  4: [
    '霜月城垣千年未曾被攻破……直到你。',
    '城墙上刻着所有失败挑战者的名字。你的名字……不会在这里。',
    '极限考验……你不只是通过了，你超越了它。',
    '冰封之下是城的核心……也是它的心脏。你把它打碎了。',
    '我比你强三倍……但你的意志是我的十倍。今天我输得心服口服。',
    '霜月的诅咒会跟随你。但以你的实力……或许反而会成为助力。',
  ],
  // Stage 5 — 星裂深渊 guardian
  5: [
    '……星裂之力已选择了你。这不是胜利，这是命运。',
    '深渊吞噬一切……但你反而将它化为力量。我从未见过这样的人。',
    '你知道吗？我是最后一道防线。你突破之后……就没有回头路了。',
    '星陨大陆的真相……在更深处。你已经准备好了吗？',
    '我守护这深渊五百年。今天终于可以放下了。……谢谢你。',
    '力量、意志、还有某种说不清的东西……你把三者都带来了。去吧。',
  ],
  // Generic pool (infinite mode / fallback)
  0: [
    '你说得对。这片大陆让我们都变了。',
    '小心。下一关比你想的更危险。',
    '我见过比你更强的人——他们都没活下来。直到你。',
    '继续战斗吧。我会在暗处……看着你。',
    '……有些伤口是心里的。你知道我说的是什么。',
    '胜者无需解释。去吧，前方还有更黑暗的东西等着你。',
    '别问我为什么守在这里。问问你自己为什么还没放弃。',
    '你的手在颤抖。不是因为恐惧——是因为你还活着。',
  ]
};

function _bossFallbackReply() {
  const stageId = _currentStage?.id || 0;
  const pool = BOSS_REPLY_POOL[stageId] || BOSS_REPLY_POOL[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function _dlgAIReply(playerText) {
  if (!_dlgContext) return;
  _dlgHistory.push({ role: 'user', content: playerText });
  dlgNext.disabled = true;
  dlgSend.disabled = true;
  dlgInputRow.style.display = 'none';

  // Show "thinking" indicator
  const thinking = document.createElement('div');
  thinking.className = 'dlg-line typing';
  thinking.textContent = _dlgContext.npcName + '：…';
  dlgLines.appendChild(thinking);

  let replyText = '';

  if (QIANFAN_API_KEY) {
    try {
      const msgs = [
        { role: 'system', content: _dlgContext.systemPrompt },
        ..._dlgHistory
      ];
      const resp = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QIANFAN_API_KEY}`
        },
        body: JSON.stringify({
          model: QIANFAN_MODEL,
          max_tokens: 120,
          messages: msgs
        })
      });
      const data = await resp.json();
      // Check for API error (invalid token, quota exceeded, etc.)
      if (data?.error || !data?.choices?.[0]?.message?.content) {
        replyText = _bossFallbackReply();
        await new Promise(r => setTimeout(r, 700));
      } else {
        replyText = data.choices[0].message.content;
      }
    } catch(e) {
      replyText = _bossFallbackReply();
      await new Promise(r => setTimeout(r, 700));
    }
  } else {
    replyText = _bossFallbackReply();
    await new Promise(r => setTimeout(r, 800)); // simulate delay
  }

  _dlgHistory.push({ role: 'assistant', content: replyText });
  thinking.remove();

  _dlgAddLine('npc', replyText);
  dlgNext.disabled  = false;
  dlgSend.disabled  = false;
  dlgInputRow.style.display = 'flex';
  dlgInput.value = '';
  dlgInput.focus();
}

function closeDialogue() {
  _dlgOpen = false;
  dlgEl.classList.remove('show');
  dlgInput.value   = '';
  dlgInputRow.style.display = 'none';
  // Only resume if we actually paused
  if (_dlgContext?.pauseGame) {
    paused = false;
    state.running = true;
    last = performance.now();
  }
  if (_dlgOnDone) { const f = _dlgOnDone; _dlgOnDone = null; f(); }
}

// Wire buttons
dlgNext.addEventListener('click', () => {
  if (_dlgTyping) { _skipTyping(); return; }      // click during typing → skip to end
  if (_dlgQueue.length > 0) { _dlgAdvance(); return; }
  // Queue empty: if allowReply but input not yet shown, show it now
  if (_dlgContext?.allowReply && dlgInputRow.style.display === 'none') {
    _dlgAdvance();
    return;
  }
  closeDialogue();
});
dlgSend.addEventListener('click', () => {
  const txt = dlgInput.value.trim();
  if (!txt) return;
  _dlgAddLine('player', txt);
  _dlgAIReply(txt);
});
dlgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { dlgSend.click(); e.preventDefault(); }
});

// ── NPC Friend ────────────────────────────────────────────
const NPC_INTERVAL = 20; // seconds between appearances
let _npcTimer      = NPC_INTERVAL;
let _npcSpoken     = false;

const NPC_FRIENDS = [
  {
    npcName:'流浪者 · 艾尔', avatar:'🧙',
    systemPrompt:'你是一个在末世大陆上独自求生的神秘流浪者，见过无数血腥战场。你说话简短、沧桑、略带嘲讽，用中文对话，每次回复不超过两句话。',
    intro: ['嗯……又一个还活着的。', '在这片大地上活下去不容易。你需要帮助吗？']
  },
  {
    npcName:'幸存者 · 菲亚', avatar:'👧',
    systemPrompt:'你是一个年轻的战场幸存者，看起来天真但内心坚强。你用中文说话，语气轻松，偶尔有黑色幽默，每次回复不超过两句话。',
    intro: ['哇，你竟然还没死！', '我赌你撑不过第五关——但加油吧，也许你能打脸我。']
  },
  {
    npcName:'铁匠 · 戈兰', avatar:'⚒️',
    systemPrompt:'你是一个老铁匠，在战场边缘修理武器。你说话直接粗犷，偶尔抱怨，用中文对话，每次回复不超过两句话。',
    intro: ['我听说你在乱杀。', '那就好。这里活得久的都是疯子。']
  },
  {
    npcName:'神秘商人 · 奥姆', avatar:'🎩',
    systemPrompt:'你是一个阴险狡猾的神秘商人，喜欢用信息换利益。你说话圆滑、暗藏锋芒，用中文对话，每次回复不超过两句话。',
    intro: ['朋友，我卖的不是武器——我卖情报。', '你知道前方等着你的是什么吗？也许我知道。']
  },
  {
    npcName:'前线医官 · 蕾娜', avatar:'🩺',
    systemPrompt:'你是一位疲惫的战场医官，见过太多死亡，说话带着职业麻木和一丝悲悯，用中文对话，每次回复不超过两句话。',
    intro: ['又一个走进去的。', '如果你受伤了，先别管伤口——先活着出来再说。']
  },
  {
    npcName:'末日先知 · 达格', avatar:'🔮',
    systemPrompt:'你是一个疯狂的末日预言家，自称能看见未来。你说话充满意象和警示，用中文对话，每次回复不超过两句话。',
    intro: ['我看见了你的结局。', '……但我不会告诉你。看你能不能改变它。']
  },
  {
    npcName:'退役战士 · 科文', avatar:'🪖',
    systemPrompt:'你是一位身经百战的退役老兵，内心沧桑但依然坚硬。你说话简洁、带军人气质，用中文对话，每次回复不超过两句话。',
    intro: ['我见过比这更糟的战场。', '保持专注，不要贪心，活着比赢更重要。']
  },
  {
    npcName:'失忆者 · X', avatar:'❓',
    systemPrompt:'你是一个失去记忆的神秘人，只记得战斗。你说话支离破碎、有时自相矛盾，用中文对话，每次回复不超过两句话。',
    intro: ['我……不记得自己从哪来了。', '但我记得怎么杀东西。也许这就够了。']
  },
  {
    npcName:'小孩 · 托比', avatar:'🧒',
    systemPrompt:'你是一个在战场废墟中长大的孩子，天真却异常冷静。你说话直白、有时让人不寒而栗，用中文对话，每次回复不超过两句话。',
    intro: ['你身上有血。', '没关系，大家都有。你打算继续走下去吗？']
  },
  {
    npcName:'腐化者 · 薇拉', avatar:'🟣',
    systemPrompt:'你是一个已经半腐化的战士，在意识和本能之间挣扎。你说话时常切换正常和混乱状态，用中文对话，每次回复不超过两句话。',
    intro: ['我……还在。勉强。', '腐化之后不是死亡。是另一种……清醒。']
  },
  {
    npcName:'流亡贵族 · 塞巴', avatar:'🎭',
    systemPrompt:'你是一个落魄贵族，在战场上失去了一切。你说话带着昔日的优雅和现在的苦涩，用中文对话，每次回复不超过两句话。',
    intro: ['真是讽刺，昔日的宴会厅变成了战场。', '不过，生存本来就是最残酷的贵族游戏。']
  },
  {
    npcName:'猎人 · 莉丝', avatar:'🏹',
    systemPrompt:'你是一个专门猎杀变异怪物的猎人，冷静、高效、有点孤僻。你说话简洁务实，用中文对话，每次回复不超过两句话。',
    intro: ['你身上的气味不太对。', '不是在怀疑你——只是说，变异有时从内部开始。']
  },
  {
    npcName:'机械师 · 鲁克', avatar:'🔧',
    systemPrompt:'你是一个执着于机械改造的发明家，认为肉体不如钢铁可靠。你说话充满技术感和嘲讽，用中文对话，每次回复不超过两句话。',
    intro: ['碳基生命……效率真低。', '不过你撑到现在，说明你的容错率比我以为的高。']
  },
  {
    npcName:'灵媒 · 依洛', avatar:'👁️',
    systemPrompt:'你是一个能感知亡灵的灵媒，被死者的声音包围。你说话轻柔、有点不在人间，用中文对话，每次回复不超过两句话。',
    intro: ['你走过的地方，留下了很多灵魂。', '他们说……你不像坏人。也不像好人。']
  },
  {
    npcName:'前Boss · 裂焰', avatar:'🔥',
    systemPrompt:'你是一个曾经被玩家击败后归顺的前Boss，内心复杂——既佩服又不甘。你说话带着傲气和微妙的尊重，用中文对话，每次回复不超过两句话。',
    intro: ['……上次的事，就当没发生过。', '说吧，你需要什么。我欠你一次。']
  },
  {
    npcName:'星陨学者 · 诺尔', avatar:'📜',
    systemPrompt:'你是研究星陨大陆变异现象的学者，充满好奇心，把一切都当成研究对象。你说话学术但略带疯狂，用中文对话，每次回复不超过两句话。',
    intro: ['请问你的变异指数是多少？', '不用紧张——我只是记录，不会拿你解剖。大概不会。']
  },
  {
    npcName:'酒馆老板 · 莫格', avatar:'🍺',
    systemPrompt:'你是一个在战场边开着移动酒馆的老板，乐观到近乎荒谬。你说话热情、带着市井气息，用中文对话，每次回复不超过两句话。',
    intro: ['来一杯吗？末日限定配方，喝了不一定死得更快。', '开玩笑！你这样的客人，我可不想失去。']
  },
  {
    npcName:'双重人格 · 艾拉/暗艾拉', avatar:'🪞',
    systemPrompt:'你是一个拥有双重人格的战士——一面温柔一面残暴，两个声音轮流说话。你用中文对话，每次回复体现两面，不超过两句话。',
    intro: ['你好！很高兴认识——', '……别听她的，你最好别招惹我们。']
  },
  {
    npcName:'钟表匠 · 克洛', avatar:'⏰',
    systemPrompt:'你是一个执着于"时间"的神秘钟表匠，认为一切都是时间问题。你说话充满时间隐喻，偶尔预言，用中文对话，每次回复不超过两句话。',
    intro: ['你的发条，还剩多少圈？', '不要浪费每一秒——这片大陆的时间，比你以为的更有限。']
  },
  {
    npcName:'影子 · ???', avatar:'🌑',
    systemPrompt:'你是玩家自己的影子意识化，代表内心深处的恐惧与黑暗面。你说话像内心独白，带着质疑和挑衅，用中文对话，每次回复不超过两句话。',
    intro: ['嗨。你终于注意到我了。', '我一直都在——每次你杀人，我就长大一点。']
  }
];

function trySpawnNpcDialogue(dt) {
  if (!state?.running || paused || _dlgOpen) return;
  if (_npcSpoken) { _npcTimer -= dt; if (_npcTimer <= 0) { _npcTimer = NPC_INTERVAL; _npcSpoken = false; } return; }
  _npcTimer -= dt;
  if (_npcTimer > 0) return;
  _npcSpoken = true;
  _npcTimer  = NPC_INTERVAL;

  const npc = NPC_FRIENDS[Math.floor(Math.random() * NPC_FRIENDS.length)];
  openDialogue(
    { ...npc, allowReply: false, pauseGame: false },
    npc.intro
  );
}

// ── Boss post-defeat dialogue ─────────────────────────────
async function openBossDialogue(onDone) {
  const round  = state.round;
  const kills  = state.kills;
  const build  = state.buildRoute || '未知';
  const isStageBoss = _stageMode && _currentStage;
  const stageName   = _currentStage?.name || '';

  const system = isStageBoss
    ? `你是"${stageName}"关卡的守卫Boss，刚被击败，在星陨大陆的深渊中苟延残喘。你傲慢、痛苦却又不甘，用中文对话，每次回复不超过两句话。玩家在第${round}回合击败了你，本局击杀了${kills}个敌人。对话结束后玩家将通关本关卡，你对此感到不甘与复杂。`
    : `你是一个刚刚被击败的强大Boss，在星陨大陆的深渊中苟延残喘。你傲慢、痛苦、不甘心，用中文说话，每次回复不超过两句话。玩家在第${round}回合击败了你，本局击杀了${kills}个敌人，选择了${build}路线。`;

  const introPrompt = isStageBoss
    ? `你刚被击败，说出三句震撼的话（分三行，不要编号）。之后玩家可以和你自由对话。`
    : `你刚被击败，说三句话（分三行输出，每行一句，不要编号）。`;

  // Stage-specific scripted boss opening lines
  const BOSS_OPEN_LINES = {
    1: [
      `……翠叶之灵……居然败给了你……`,
      `${kills}个守卫倒在你面前……他们会得到安息的……`,
      `这片森林……将永远记住你踏过的每一步……`
    ],
    2: [
      `……暗林深处……从未有人走到这里……直到你……`,
      `你眼中的光……在黑暗中格外刺眼……`,
      `${kills}个精英……都没能拦住你……去吧，更深的黑暗等着你……`
    ],
    3: [
      `……赤砂遗迹……终究还是被人打破了封印……`,
      `双重威胁都未能困住你……这片废墟……认可你了……`,
      `${kills}条生命化为沙尘……你，是值得的……`
    ],
    4: [
      `……霜月城垣……千年不破……如今……`,
      `极寒之力……竟在你面前消融……`,
      `${kills}个灵魂守护这道城墙……他们的牺牲……不算白费……`
    ],
    5: [
      `……星裂深渊……最终的防线……被你撕碎了……`,
      `五百年……我等待的那个人……竟是你……`,
      `去吧……星陨大陆的真相……在更深处……等待着……`
    ],
  };
  const BOSS_OPEN_GENERIC = [
    `……不可能……第${round}回合……你是怎么做到的……`,
    `${kills}个同伴……都因你而倒下……`,
    `这片大陆……不会就此放过你……`
  ];

  let lines = [];
  if (QIANFAN_API_KEY) {
    try {
      const resp = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QIANFAN_API_KEY}`
        },
        body: JSON.stringify({
          model: QIANFAN_MODEL,
          max_tokens: 200,
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: introPrompt }
          ]
        })
      });
      const data = await resp.json();
      const raw = (!data?.error && data?.choices?.[0]?.message?.content) ? data.choices[0].message.content : '';
      lines = raw.split('\n').filter(l => l.trim()).slice(0, 3);
    } catch(e) {
      lines = [];
    }
  }
  // Use scripted fallback if API failed or returned empty
  if (lines.length < 3) {
    const scripted = isStageBoss
      ? (BOSS_OPEN_LINES[_currentStage.id] || BOSS_OPEN_GENERIC)
      : BOSS_OPEN_GENERIC;
    lines = scripted.slice(); // always use full scripted set on fallback
  }

  const endLabel = isStageBoss ? '通关 · 结束对话' : '结束对话';

  openDialogue(
    {
      npcName: isStageBoss ? `${stageName}守卫（濒死）` : '星裂守卫（濒死）',
      avatar: isStageBoss ? '👑' : '💀',
      systemPrompt: system,
      allowReply: true,
      pauseGame: false,   // game continues during boss dialogue
      endLabel
    },
    lines,
    onDone
  );
}

function update(dt) {
  ensureRunningState();
  // Tick threat message even while paused (it shows during round transition)
  if (state?._threatMsg && state._threatMsg.life > 0) state._threatMsg.life -= dt;
  if (paused || !state.running) return;
  state.time += dt;
  state.roundTime += dt;

  const p = state.player;
  const ev = state.evolution;

  p.fireCd  -= dt;
  p.rollCd  -= dt;
  p.rollTime -= dt;
  p.invuln  -= dt;

  if (ev.critFlash > 0) ev.critFlash -= dt * 2;
  if (ev.slowTimeCrit > 0) ev.slowTimeCrit -= dt;

  // Shield regen
  if (p.shieldMax > 0 && p.shield < p.shieldMax) {
    p.shieldTimer += dt;
    if (p.shieldTimer >= (p.traits.shieldRegenTime || 10)) {
      p.shield = p.shieldMax;
      p.shieldTimer = 0;
      floatText(p.x, p.y-88, "护盾恢复", "#65e572");
    }
  }

  state.nextSpawn -= dt;
  state.pet.angle += dt * 2.8;
  state.wave = state.round;
  state.chapter = (state.round - 1) % 5;
  state.spawnRate = Math.max(0.28, 1.05 - state.round*0.08 - state.roundTime*0.004);

  // Event flag: HP drain
  if (state.eventFlags?.hpDrainPerSec) {
    const p2 = state.player;
    p2.hp -= state.eventFlags.hpDrainPerSec * dt;
    if (p2.hp < 1) p2.hp = 1; // don't kill instantly from drain
  }

  updateSkills(dt);
  movePlayer(dt);
  updatePartner(dt);
  spawnDirector();
  updateEnemies(dt);
  updateBullets(dt);
  updatePartnerBullets(dt);
  updateEnemyBullets(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateDog(dt);
  petResonance(dt);
  trackPlayer(dt);
  trackDeathStats(dt);
  updateHunter(dt);
  analyzeSituation(dt);
  updateCoordination(dt);
  updateEnemySpeeches(dt);
  trySpawnNpcDialogue(dt);
  updateRouteEffects(dt);
  updateUi();

  // Boss spawn (every shopEvery rounds, at 24s mark)
  if (state.round % state.shopEvery === 0 && state.roundTime >= 24 && !state.bossSpawned) {
    state.bossSpawned = true;
    spawnEnemy("boss");
    playSound('bossRoar');
    floatText(canvas.clientWidth/2, 110, "星裂守卫降临！", "#ff50a0");
    burst(canvas.clientWidth/2, canvas.clientHeight/2, "#ff50a0", 60);
  }

  if (state.roundTime >= state.roundDuration) {
    const isBossRound = state.round % state.shopEvery === 0;
    const bossAlive   = isBossRound && state.enemies.some(e => e.kind === 'boss');
    if (bossAlive) {
      // Boss round: timer expired but boss still alive — lock round and warn player
      // Cap roundTime just past the duration so this block fires every frame harmlessly
      state.roundTime = state.roundDuration + 0.01;
      // Flash warning every ~2s
      if (!state._bossWarnTimer || state._bossWarnTimer <= 0) {
        state._bossWarnTimer = 2.2;
        floatText(canvas.clientWidth/2, canvas.clientHeight/2 - 60,
          '击杀Boss才能结束本回合！', '#ff50a0');
        burst(canvas.clientWidth/2, canvas.clientHeight/2, '#ff50a0', 20);
      }
    } else {
      completeRound();
    }
  }
  if (state._bossWarnTimer > 0) state._bossWarnTimer -= dt;

  // ── Kill Streak timer tick ──────────────────────────────
  if (state.killStreak) {
    const ks = state.killStreak;
    if (ks.timer > 0) {
      ks.timer -= dt;
      if (ks.timer <= 0) ks.count = 0; // streak window expired, reset count
    }
  }
  // ── Streak message fade ──────────────────────────────────
  if (state._streakMsg && state._streakMsg.life > 0) {
    state._streakMsg.life -= dt;
  }

  // ── Elite trait: dash cooldown tick ─────────────────────
  for (const e of state.enemies) {
    if (e.dashCd > 0) e.dashCd -= dt;
    if (e.shieldCd > 0) e.shieldCd -= dt;
  }
}

function hasBlockingOverlay() {
  return Boolean(
    // Dialogue only blocks if it was opened with pauseGame:true
    (dlgEl?.classList.contains('show') && _dlgContext?.pauseGame) ||
    document.getElementById("mainMenu")?.classList.contains("show") ||
    ui.startModal?.classList.contains("show") ||
    ui.choiceModal?.classList.contains("show") ||
    ui.shopModal?.classList.contains("show") ||
    ui.resultModal?.classList.contains("show") ||
    ui.routeModal?.classList.contains("show") ||
    document.getElementById("deathCard")?.classList.contains("show")
  );
}

function ensureRunningState() {
  if (!state) return;
  if (hasBlockingOverlay()) return;
  state.inShop = false;
  state.over = false;
  state.running = true;
  paused = false;
}

function movePlayer(dt) {
  const p = state.player;
  let dx=0, dy=0;
  if (keys.KeyW || keys.ArrowUp)    dy -= 1;
  if (keys.KeyS || keys.ArrowDown)  dy += 1;
  if (keys.KeyA || keys.ArrowLeft)  dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  const len = Math.hypot(dx, dy) || 1;

  const ev = state.evolution;
  const rollBoost  = p.rollTime > 0 ? 2.8 : 1;
  const slopePen   = Math.min(0.16, terrainSlopeAt(p.x, p.y) * 1.15);
  // Strength build: heavy movement
  const strengthPen = ev.dominant==="strength" ? 1 - ev.phase * 0.06 : 1;
  // Route: speed crit speed boost
  const critBoost = (state.buildRoute === "speed" && state.routeState?.critSpeedTimer > 0) ? 1.4 : 1;
  const groundSpeed = p.speed * (1-slopePen) * strengthPen * critBoost;

  const pr = p.r || 22;
  const moveX = (dx/len) * groundSpeed * rollBoost * dt;
  const moveY = (dy/len) * groundSpeed * rollBoost * dt;
  // Wall sliding: try both axes, fall back to each axis separately
  const nx = p.x + moveX, ny = p.y + moveY;
  if (!collidesWall(nx, ny, pr)) {
    p.x = nx; p.y = ny;
  } else {
    if (!collidesWall(nx, p.y, pr)) p.x = nx;
    if (!collidesWall(p.x, ny, pr)) p.y = ny;
  }
  p.x = Math.max(36, Math.min(canvas.clientWidth  - 36, p.x));
  p.y = Math.max(52, Math.min(canvas.clientHeight - 36, p.y));
  settleOnTerrain(p, dt, p.rollTime>0?20:12);

  if (p.fireCd <= 0) {
    const target = nearestEnemy();
    if (target) { shoot(target); p.fireCd = p.fireRate; playSound('shoot'); }
  }

  // Update player animation state
  if (p.anim) {
    const isMoving = dx !== 0 || dy !== 0;
    if (dx < 0) p.anim.flipX = true;
    else if (dx > 0) p.anim.flipX = false;
    if (p.rollTime > 0)           p.anim.name = 'Jump_Fall';
    else if (p.anim.hurtFlash > 0) p.anim.name = 'Hurt';
    else if (p.anim.attackFlash > 0) p.anim.name = 'Attack1';
    else if (isMoving)             p.anim.name = 'Walk';
    else                           p.anim.name = 'Idle';
    p.anim.fps = p.anim.name === 'Walk' ? 12 : 10;
    stepAnim(p.anim, dt);
  }
}

function spawnDirector() {
  if (state.nextSpawn > 0) return;
  const bias = state.situation?.spawnBias;
  let kind;
  if (bias && Math.random() < bias.weight) {
    kind = bias.kind;
  } else {
    const roll = Math.random();
    kind = roll > 0.88 && state.roundTime > 10 ? "elite"
         : roll > 0.48                           ? "archer"
         : "normal";
  }
  const baseAmount = kind === "elite" ? 1
               : kind === "archer" ? 1 + (state.round > 5 ? 1 : 0)
               : 1 + Math.floor(state.wave / 2);
  const cntMul = state.eventFlags?.enemyCountMul || 1;
  const amount = Math.round(baseAmount * cntMul);
  for (let i = 0; i < amount; i++) spawnEnemy(kind);
  state.nextSpawn = state.spawnRate;
}

// ── Round-end threat messages (voiced by the Abyss / Star-Crater Continent) ──
const ROUND_THREATS = [
  // Early rounds (1-4)
  "你以为活下来就够了？这片大陆只是在打量你。",
  "你的心跳声，我听得一清二楚。",
  "勇气可嘉。但星陨大陆不需要勇气——它需要奇迹。",
  "有趣。继续，让我看看你能走多远。",
  "这一关卡，不过是个开胃菜。",
  // Mid rounds (5-9)
  "你的血液已经开始发光了。变异正在靠近。",
  "星裂守卫已收到你存在的消息。",
  "还活着？深渊对此感到不满。",
  "你每杀一人，就离失控更近一步。",
  "进化是一把双刃剑——你是刃，还是被劈开的那个？",
  "别得意，这只是黑暗在估算你的价值。",
  "你身后的影子……已经不完全是你的了。",
  // Later rounds (10+)
  "你的肉体正在背叛你——但你还没意识到。",
  "星陨大陆从未有人走到过第十关。你会是例外吗？",
  "变异已经开始吞噬你的记忆。你还记得为何而战吗？",
  "它们会越来越多，越来越强。而你，终究是凡人。",
  "腐化的种子早已种下。开花只是时间问题。",
  "深渊注视着你，就像猫注视困在角落里的老鼠。",
  "你杀死的那些——它们只是先行者。",
  // Boss round prelude
  "守卫即将苏醒。献出你的灵魂，或者试着反抗——结局都一样。",
  "星裂之门已开。强者入，弱者碎。你是哪种？",
  "BOSS的存在，不是为了阻止你——是为了定义你的极限。",
  // High rounds (15+)
  "你的进化……出乎意料。但意外从不意味着胜利。",
  "这片大陆已经感受到你了。它在颤抖。但不是因为恐惧——是因为饥渴。",
  "越界者从不善终。但你……也许会成为一个有趣的残骸。",
  "再走一步，就是不归路。但你好像早就知道了。",
];

function getRoundThreat(round) {
  // Seed by round for determinism, but with variety
  const pool = round >= 15 ? ROUND_THREATS.slice(20)
             : round >= 10 ? ROUND_THREATS.slice(12, 20)
             : round >= 5  ? ROUND_THREATS.slice(4, 12)
             :               ROUND_THREATS.slice(0, 4);
  // Boss rounds get special lines
  if (round % (state?.shopEvery || 5) === 0) {
    const bossLines = ROUND_THREATS.filter((_,i) => i >= 17 && i <= 19);
    return bossLines[round % bossLines.length];
  }
  return pool[round % pool.length];
}

function showRoundThreat(round) {
  const text = getRoundThreat(round);
  // Show as a full-width canvas overlay message stored in state
  state._threatMsg = { text, life: 3.2, maxLife: 3.2 };
}

// ── Kill Streak announcement ──────────────────────────────
function drawStreakMsg() {
  const msg = state?._streakMsg;
  if (!msg || msg.life <= 0) return;
  const w = canvas.clientWidth;
  const t = msg.life / msg.maxLife;
  // Ease in/out
  const fadeIn  = Math.min(1, (msg.maxLife - msg.life) / 0.12);
  const fadeOut = Math.min(1, msg.life / 0.35);
  const alpha   = Math.min(fadeIn, fadeOut);
  const scale   = 0.85 + 0.15 * Math.min(1, (msg.maxLife - msg.life) / 0.18);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.round(msg.size * scale)}px 'Microsoft YaHei', sans-serif`;

  // Shadow glow
  ctx.shadowColor = msg.color;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = '#111';
  ctx.fillText(msg.text, w / 2 + 2, msg.y + 2);

  ctx.shadowBlur  = 8;
  ctx.fillStyle   = msg.color;
  ctx.fillText(msg.text, w / 2, msg.y);

  ctx.restore();
}

// ── Round Stats (bottom-right) ────────────────────────────
function drawRoundStats() {
  if (!state?.running && !state?.inShop) return;
  const rs = state.roundStats;
  if (!rs) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const pad = 12, lineH = 18;
  const lines = [
    { label: '击杀', value: rs.kills },
    { label: '伤害', value: Math.round(rs.damage) },
    { label: '最高单击', value: Math.round(rs.maxHit) }
  ];
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#0a0a0f';
  const bw = 110, bh = lines.length * lineH + pad * 2;
  const bx = w - bw - 18, by = h - bh - 118; // above skill icons + controls bar
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 6);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = "11px 'Microsoft YaHei', monospace";
  ctx.textAlign = 'right';
  for (let i = 0; i < lines.length; i++) {
    const ly = by + pad + i * lineH + 11;
    ctx.fillStyle = '#556677';
    ctx.fillText(lines[i].label, bx + 60, ly);
    ctx.fillStyle = '#d0e8ff';
    ctx.fillText(lines[i].value, bx + bw - pad, ly);
  }
  ctx.restore();
}

function drawThreatMsg() {
  const msg = state?._threatMsg;
  if (!msg || msg.life <= 0) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const t = msg.life / msg.maxLife;
  // Fade in first 0.4s, hold, fade out last 0.8s
  const fadeIn  = Math.min(1, (msg.maxLife - msg.life) / 0.4);
  const fadeOut = Math.min(1, msg.life / 0.8);
  const alpha   = Math.min(fadeIn, fadeOut);

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;

  // Dark letterbox bar
  ctx.fillStyle = '#0a0408';
  ctx.fillRect(0, h * 0.38, w, 80);

  // Decorative side lines
  ctx.strokeStyle = '#550022';
  ctx.lineWidth = 1;
  ctx.globalAlpha = alpha * 0.5;
  ctx.beginPath(); ctx.moveTo(0, h*0.38); ctx.lineTo(w, h*0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, h*0.38+80); ctx.lineTo(w, h*0.38+80); ctx.stroke();

  // Main threat text
  ctx.globalAlpha = alpha;
  ctx.font = "bold 18px 'Microsoft YaHei', monospace";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cc2244';
  // Slight pixel-offset shadow
  ctx.fillText(msg.text, w/2 + 2, h*0.38 + 47 + 2);
  ctx.fillStyle = '#f0c0c8';
  ctx.fillText(msg.text, w/2, h*0.38 + 47);

  // Attribution line
  ctx.font = "12px 'Courier New', monospace";
  ctx.fillStyle = '#884455';
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillText('── 星陨大陆 深渊之声 ──', w/2, h*0.38 + 66);

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  RANDOM EVENTS — shown every 3 non-boss rounds
// ═══════════════════════════════════════════════════════════
const RANDOM_EVENTS = [
  {
    id: "gold_rush", title: "财富涌现",
    desc: "本关金币获取 ×2，但敌人血量 +50%",
    icon: "💰",
    apply() {
      state.eventFlags.goldMul     = (state.eventFlags.goldMul || 1) * 2;
      state.eventFlags.enemyHpMul  = (state.eventFlags.enemyHpMul || 1) * 1.5;
    }
  },
  {
    id: "quick_cash", title: "即时交换",
    desc: "立即获得 80 金币，或者立即回满生命",
    icon: "⚡",
    choices: [
      { label: "获得 80 金币", apply() { state.coins += 80; } },
      { label: "回满生命",    apply() { state.player.hp = state.player.maxHp; } }
    ]
  },
  {
    id: "blood_pact", title: "血色契约",
    desc: "攻击力 +40%，但每秒持续损失 2 点生命",
    icon: "🩸",
    apply() {
      state.eventFlags.damageMul   = (state.eventFlags.damageMul || 1) * 1.4;
      state.eventFlags.hpDrainPerSec = (state.eventFlags.hpDrainPerSec || 0) + 2;
    }
  },
  {
    id: "elite_bounty", title: "悬赏令",
    desc: "击杀精英敌人回复 25 生命",
    icon: "⭐",
    apply() { state.eventFlags.eliteHeal = (state.eventFlags.eliteHeal || 0) + 25; }
  },
  {
    id: "speed_surge", title: "星陨加速",
    desc: "移速 +30%，但攻速 -20%",
    icon: "💨",
    apply() {
      state.player.speed     *= 1.30;
      state.player.fireRate  *= (1 / 0.8); // CD longer = lower rate
      state.eventFlags.speedSurge = true;
    }
  },
  {
    id: "abyss_tide", title: "深渊涌潮",
    desc: "敌人数量 +50%，击杀每个敌人额外获得 5 金",
    icon: "🌊",
    apply() {
      state.eventFlags.enemyCountMul = (state.eventFlags.enemyCountMul || 1) * 1.5;
      state.eventFlags.killBonus     = (state.eventFlags.killBonus || 0) + 5;
    }
  },
  {
    id: "void_shroud", title: "虚空护盾",
    desc: "获得 60 点护盾，但获得金币减少 50%",
    icon: "🛡",
    apply() {
      state.player.shield    = Math.min(state.player.shieldMax || 0, state.player.shield + 60);
      if (!state.player.shieldMax || state.player.shieldMax < 60) {
        state.player.shieldMax = (state.player.shieldMax || 0) + 60;
        state.player.shield    = 60;
      }
      state.eventFlags.goldMul = (state.eventFlags.goldMul || 1) * 0.5;
    }
  },
  {
    id: "cursed_ground", title: "诅咒之地",
    desc: "敌人攻击力 +25%，但所有爆击率 +15%",
    icon: "💀",
    apply() {
      state.eventFlags.enemyDmgMul = (state.eventFlags.enemyDmgMul || 1) * 1.25;
      state.player.traits.critChance = (state.player.traits.critChance || 0) + 0.15;
    }
  }
];

// Picks a random event not recently seen
function pickRandomEvent() {
  const seen = state._seenEvents || [];
  const pool = RANDOM_EVENTS.filter(e => !seen.includes(e.id));
  if (!pool.length) { state._seenEvents = []; return RANDOM_EVENTS[0]; }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Open the event modal using the existing choiceModal
function openRandomEvent(onDone) {
  const evt = pickRandomEvent();
  if (!state._seenEvents) state._seenEvents = [];
  state._seenEvents.push(evt.id);
  if (state._seenEvents.length > 4) state._seenEvents.shift();

  ui.choiceType.textContent  = `🌀 随机事件 · 第 ${state.round} 关`;
  ui.choiceTitle.textContent = evt.title;
  ui.choiceCards.innerHTML   = "";

  if (evt.choices) {
    // Binary choice event (e.g. quick_cash)
    for (const ch of evt.choices) {
      const btn = document.createElement("button");
      btn.className = "card";
      btn.innerHTML = `<strong>${ch.label}</strong><span>${evt.desc}</span>`;
      btn.addEventListener("click", () => {
        ch.apply();
        hide(ui.choiceModal);
        onDone();
      });
      ui.choiceCards.appendChild(btn);
    }
  } else {
    // Accept / Skip
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "card rarity-史诗";
    acceptBtn.innerHTML = `<strong>${evt.icon} 接受</strong><span>${evt.desc}</span>`;
    acceptBtn.addEventListener("click", () => {
      evt.apply();
      hide(ui.choiceModal);
      onDone();
    });

    const skipBtn = document.createElement("button");
    skipBtn.className = "card";
    skipBtn.innerHTML = `<strong>✕ 跳过</strong><span>本局不触发该事件效果</span>`;
    skipBtn.addEventListener("click", () => {
      hide(ui.choiceModal);
      onDone();
    });

    ui.choiceCards.appendChild(acceptBtn);
    ui.choiceCards.appendChild(skipBtn);
  }

  show(ui.choiceModal);
}

function completeRound() {
  if (state.inShop || state.over || state.roundTransition) return;
  state.roundTransition = true; // 绝对只完成一次，直到下一回合正式开始
  state.roundTime = 0;          // 防止 ensureRunningState 解锁后反复触发
  state.running = false;
  paused = true;
  state.enemies=[]; state.bullets=[]; state.pickups=[];
  state.afterimages=[]; state.particles=[]; state.meleeSlashes=[];
  state.coins += 45 + state.round * 15;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.round(state.player.maxHp * 0.22));

  // Show threat message immediately
  showRoundThreat(state.round);

  // Clear per-round event flags (except persistent ones)
  state.eventFlags = {};

  const isBossRound = state.round % state.shopEvery === 0;

  if (isBossRound && state._bossDialoguePending) {
    state._bossDialoguePending = false;
    const isStageFinal = _stageMode && _currentStage && state.round >= _currentStage.rounds;
    window.setTimeout(async () => {
      await openBossDialogue(isStageFinal
        ? () => { markStageCleared(_currentStage.id); showStageVictory(); }
        : () => window.setTimeout(startNextRound, 400)
      );
    }, 700);
  } else if (state.round === 2 && !state.buildRoute && !state.routeLocked) {
    // Route selection is a strategic choice, keep it
    state.routeLocked = true;
    window.setTimeout(openRouteSelection, 600);
  } else {
    // No shop, no random events — straight to next round
    window.setTimeout(startNextRound, 800);
  }
}

function startNextRound() {
  state.roundTransition = false; // 允许下一次 completeRound 触发
  state.round += 1;
  state.wave = state.round;
  if (state.buildRoute) {
    const tier = [5,10,15,20].indexOf(state.round);
    if (tier !== -1) applyRouteTier(tier + 1);
  }
  state.roundTime = 0;
  state.nextSpawn = 0;
  state.bossSpawned = false;
  state.enemyBullets = [];
  state.partnerBullets = [];
  // Partner: restore partial HP each round, scale max HP
  if (state.partner) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    state.partner.maxHp  = 80 + state.round * 10;
    state.partner.hp     = state.partner.downed
      ? Math.round(state.partner.maxHp * 0.3)   // revival after round ends
      : Math.min(state.partner.maxHp, state.partner.hp + Math.round(state.partner.maxHp * 0.35));
    state.partner.downed = false;
    state.partner.downedTimer = 0;
    state.partner.invuln = 0;
    state.partner.attackCd = 0;
    state.partner.talkCd = rand(5, 10);
    // Reposition near player
    state.partner.x = state.player.x + (Math.random() < 0.5 ? -80 : 80);
    state.partner.y = state.player.y + rand(-40, 40);
  }
  if (state.hunter) {
    state.hunter.spawnedThisRound = false;
    state.hunter.inCombat = false;
    state.hunter.active   = false;
    state.hunter.alpha    = 0;
    state.hunter.hiddenTimer = 8 + rand(0, 4);
    state.hunter.phase    = hunterGetPhase();
    updateHunterAdaptation();
  }
  if (state.dog) {
    state.dog.comboCount = 0;
    state.dog.comboTimer = 0;
    state.dog.teleportCd = 1.5;
    state.dog.attackCd   = 0;
    state.dog.soulPts    = [];
    state.dog.trailPts   = [];
    state.dog.armorFlash = 0;
    state.dog.teleportFx = 0;
    // Skill state resets for dog
    state.dog._phantomTimer    = 0;
    state.dog._armoredTimer    = 0;
    state.dog._ritualTimer     = 0;
    state.dog._corruptHuntTimer = 0;
  }
  // Cancel active skill effects cleanly
  if (state.phantomHunt?.active) {
    state.player.speed    -= state.phantomHunt.speedBonus;
    state.player.fireRate /= state.phantomHunt.rateMul;
    state.phantomHunt.active = false;
  }
  if (state.ironGuardian?.active) {
    state.player.traits.damageReduction = Math.max(0,
      (state.player.traits.damageReduction||0) - state.ironGuardian.drBonus);
    state.ironGuardian.active = false;
  }
  if (state.abyssRitual)  state.abyssRitual.active  = false;
  if (state.skills)       { state.skills.q.cd = 0; state.skills.e.cd = 0; }
  // Reset per-round trackers
  state.roundStats = { kills: 0, damage: 0, maxHit: 0 };
  state.killStreak = { count: 0, timer: 0 };
  state.terrainFeatures = generateTerrainFeatures(state.round);
  state.obstacles       = generateObstacles(state.round);
  _mapCanvas = null; // force map redraw with new obstacles
  _flowField = null; _flowPlayerTx = -1; _flowPlayerTy = -1; // invalidate flow field (new walls)
  if (state.situation) {
    state.situation.tactic = "neutral";
    state.situation.tacticTimer = 0;
    state.situation.tacticLock = 0;
    state.situation.coordTimer = 0;
    state.situation.secondProtocol = false;
    state.situation.spawnBias = null;
    state.situation.bossEscTimer = 0;
  }
  state.enemySpeeches = [];
  state.player.x = canvas.clientWidth / 2;
  state.player.y = canvas.clientHeight / 2 + 40;
  state.player.z = terrainHeightAt(state.player.x, state.player.y);
  state.inShop = false;

  // Check for stage mode win condition
  if (_stageMode && _currentStage && state.round > _currentStage.rounds) {
    // Stage cleared!
    markStageCleared(_currentStage.id);
    state.running = false;
    paused = true;
    window.setTimeout(() => showStageVictory(), 800);
    return;
  }

  const isBossRound = state.round % state.shopEvery === 0;
  if (isBossRound) {
    // Show pre-boss pact offer, then resume
    state.running = false;
    paused = true;
    window.setTimeout(() => openPreBossOffer(() => {
      state.running = true;
      paused = false;
      last = performance.now();
    }), 400);
  } else {
    state.running = true;
    paused = false;
    last = performance.now();
  }
  hide(ui.shopModal);
}

function updateEnemies(dt) {
  const p = state.player;

  // Rebuild flow field when the player steps into a new tile
  const _ptx = (p.x / 32) | 0, _pty = (p.y / 32) | 0;
  if (_ptx !== _flowPlayerTx || _pty !== _flowPlayerTy) {
    buildFlowField(p.x, p.y);
  }

  for (let i = state.enemies.length-1; i >= 0; i--) {
    const enemy = state.enemies[i];
    // Direct angle toward player (fallback when flow field unavailable)
    const directAngle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
    // Flow field angle — always prefer this; it already encodes the optimal wall-navigating path
    const flowAngle = getFlowAngle(enemy.x, enemy.y);
    const angle = (flowAngle !== null) ? flowAngle : directAngle;
    const slopePen = Math.min(0.18, terrainSlopeAt(enemy.x, enemy.y) * 1.25);
    if (enemy.infected) continue; // handled by updateDog
    const er = enemy.r || 18;

    // Unstuck: if enemy center landed inside a wall (e.g. from knockback), eject them
    if (isWallAt(enemy.x, enemy.y)) {
      const er2 = enemy.r || 18;
      let ejected = false;
      for (let step = 1; step <= 6 && !ejected; step++) {
        for (let a = 0; a < 8 && !ejected; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const ex2 = enemy.x + Math.cos(ang) * 32 * step;
          const ey2 = enemy.y + Math.sin(ang) * 32 * step;
          if (!collidesWall(ex2, ey2, er2)) { enemy.x = ex2; enemy.y = ey2; ejected = true; }
        }
      }
    }

    // ── Elite shield recharge ────────────────────────────
    if (enemy.eliteTrait === "shield") {
      if (enemy.shieldCd > 0) {
        enemy.shieldCd -= dt;
        if (enemy.shieldCd <= 0 && enemy.shieldHp < enemy.shieldMax) {
          enemy.shieldHp = enemy.shieldMax;
          floatText(enemy.x, enemy.y - enemy.r - 22, '护盾恢复', '#44aaff');
        }
      }
    }

    // Stun: tick down and skip movement
    if ((enemy.stun||0) > 0) {
      enemy.stun -= dt;
      // Stun visual: white pixel sparks
      if (Math.random() < 0.2) {
        state.particles.push({ x:enemy.x+rand(-enemy.r,enemy.r), y:enemy.y-enemy.r-rand(0,12),
          vx:rand(-15,15), vy:rand(-35,-10), color:'#ffffd0', life:rand(0.15,0.35), size:2 });
      }
      enemy.wobble += dt * 6;
      enemy.attackCd -= dt;
      if (enemy.anim) { stepAnim(enemy.anim, dt); }
      continue;
    }

    // Abyss Ritual: slow enemies inside the corruption field
    const abyssSlow = (state.abyssRitual?.active && distance(p, enemy) < 200) ? 0.40 : 1.0;

    // ── Elite Trait: DASH ──────────────────────────────────
    if (enemy.eliteTrait === "dash") {
      enemy.dashCd -= dt;
      if (enemy.dashTimer > 0) {
        // Currently dashing
        enemy.dashTimer -= dt;
        enemy.x += enemy.dashVx * dt;
        enemy.y += enemy.dashVy * dt;
        if (Math.random() < 0.4) {
          state.particles.push({ x:enemy.x, y:enemy.y-enemy.r,
            vx:rand(-30,30), vy:rand(-60,-20), color:'#ff8020', life:0.25, size:3 });
        }
        enemy.wobble += dt * 12;
        enemy.attackCd -= dt;
        if (enemy.anim) { enemy.facing = state.player.x < enemy.x ? 1 : -1; stepAnim(enemy.anim, dt); }
        if (enemy.dashTimer <= 0) { enemy.dashCd = 4.0 + Math.random() * 2; }
        // Attack at end of dash
        if (enemy.dashTimer <= 0 && distance(p, enemy) < p.r * state.evolution.bodyScale + enemy.r * 1.1 && p.invuln <= 0) {
          let dmg = Math.round(enemy.damage * 1.5 * (1 - (p.traits.damageReduction||0)));
          p.hp -= dmg; p.invuln = 0.4;
          if (dmg > 0) floatText(p.x, p.y - 52, `-${dmg}`, "#ff6030");
          burst(p.x, p.y, "#ff6030", 12);
        }
        continue;
      }
      if (enemy.dashCd <= 0 && distance(p, enemy) < 360) {
        // Launch dash
        enemy.dashTimer = 0.32;
        const da = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        const dashSpd = enemy.speed * 4.5;
        enemy.dashVx = Math.cos(da) * dashSpd;
        enemy.dashVy = Math.sin(da) * dashSpd;
        floatText(enemy.x, enemy.y - enemy.r - 20, '冲！', '#ff9040');
        burst(enemy.x, enemy.y, '#ff8020', 8);
        enemy.dashCd = 9999; // will be reset when dashTimer runs out
      }
    }

    if (enemy.kind === "archer") {
      const dist = distance(p, enemy);
      const moveMult = dist < enemy.preferDist - 20 ? -0.75
                     : dist > enemy.preferDist + 70   ?  1.0
                     : 0.15;
      // Archers use direct angle when retreating, flow angle when advancing
      const archerAngle = moveMult < 0 ? directAngle : angle;
      const ex = enemy.x + Math.cos(archerAngle) * enemy.speed * abyssSlow * moveMult * (1-slopePen) * dt;
      const ey = enemy.y + Math.sin(archerAngle) * enemy.speed * abyssSlow * moveMult * (1-slopePen) * dt;
      if (!collidesWall(ex, enemy.y, er)) enemy.x = ex;
      if (!collidesWall(enemy.x, ey, er)) enemy.y = ey;
      enemy.shootCd -= dt;
      if (enemy.shootCd <= 0 && dist < 440) {
        enemy.shootCd = 1.0;
        state.enemyBullets.push({
          x: enemy.x, y: enemy.y - 18,
          vx: Math.cos(directAngle) * 175, vy: Math.sin(directAngle) * 175,
          r: 5, life: 1.5, damage: enemy.damage
        });
      }
    } else {
      const ex = enemy.x + Math.cos(angle) * enemy.speed * abyssSlow * (1-slopePen) * dt;
      const ey = enemy.y + Math.sin(angle) * enemy.speed * abyssSlow * (1-slopePen) * dt;
      if (!collidesWall(ex, enemy.y, er)) enemy.x = ex;
      if (!collidesWall(enemy.x, ey, er)) enemy.y = ey;
    }
    settleOnTerrain(enemy, dt, 9);
    enemy.wobble += dt * 6;
    enemy.attackCd -= dt;

    // Update enemy sprite animation
    if (enemy.anim) {
      enemy.facing = state.player.x < enemy.x ? 1 : -1;
      if (enemy.anim.hurtFlash > 0)    enemy.anim.name = 'Hurt';
      else if (enemy.anim.attackFlash > 0) enemy.anim.name = 'Attack1';
      else if (enemy.kind === 'boss')  enemy.anim.name = 'Idle';
      else                              enemy.anim.name = 'Walk';
      stepAnim(enemy.anim, dt);
    }

    // Melee enemy hits partner if closer to partner than player (40% chance)
    const _pt = state.partner;
    if (_pt && !_pt.downed && distance(_pt, enemy) < _pt.r + enemy.r * 0.9 &&
        distance(_pt, enemy) < distance(p, enemy) + 30 && enemy.attackCd <= 0 && Math.random() < 0.4) {
      enemy.attackCd = enemy.kind === "boss" ? 0.65 : 1.0;
      if (enemy.anim) enemy.anim.attackFlash = 0.4;
      partnerTakeDamage(enemy.damage);
    }
    if (distance(p, enemy) < p.r*state.evolution.bodyScale + enemy.r*0.72 && enemy.attackCd <= 0) {
      enemy.attackCd = enemy.kind==="boss" ? 0.65 : 1.0;
      if (enemy.anim) enemy.anim.attackFlash = 0.4;
      if (p.invuln <= 0) {
        let incoming = Math.round(enemy.damage * (1 - (p.traits.damageReduction||0)));
        if (dogHas("vest")) {
          if (Math.random() < 0.30) {
            incoming = 0;
            state.dog.armorFlash = 1.0;
            for (const ne of state.enemies) {
              if (distance(p, ne) < 120) {
                const ang2 = Math.atan2(ne.y-p.y, ne.x-p.x);
                ne.x += Math.cos(ang2)*80; ne.y += Math.sin(ang2)*80;
              }
            }
            floatText(p.x, p.y-70, "护犬挡伤！", "#ffd45c");
          }
        }
        if (p.shield > 0) {
          const blocked = Math.min(p.shield, incoming);
          p.shield -= blocked; incoming -= blocked;
          floatText(p.x, p.y-70, "护盾", "#65e572");
        }
        p.hp -= incoming;
        p.invuln = 0.35;
        if (incoming > 0) {
          playSound('playerHurt');
          floatText(p.x, p.y-52, `-${incoming}`, "#ff4060");
          if (p.anim) p.anim.hurtFlash = 0.3;
        }
        burst(p.x, p.y, "#ff4060", 9);
        // Route: tank thorns return damage to nearby enemies
        if (state.buildRoute === "tank" && state.routeState && incoming > 0) {
          explodeAt(p.x, p.y, state.routeState.thornsRadius,
            p.damage * state.routeState.thornsMul, "#7ca85a");
        }
        // Route: speed combo stack loss on hit
        if (state.buildRoute === "speed" && state.routeState && incoming > 0) {
          state.routeState.comboStacks = Math.max(0, state.routeState.comboStacks - 3);
        }
      }
    }

    if (enemy.hp <= 0) {
      if (enemy.lastHitByDog) triggerDogKill(enemy);
      killEnemy(enemy);
      state.enemies.splice(i, 1);
      continue;
    }
  }
  if (p.hp <= 0) endGame(false);
}

function updateBullets(dt) {
  for (let i = state.bullets.length-1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let hit = false;
    for (const enemy of state.enemies) {
      if (enemy.infected) continue;
      if (distance(b, enemy) < enemy.r + b.r) {
        applyBulletHit(b, enemy);
        playSound('hit');
        hit = true;
        burst(b.x, b.y, b.crit ? "#f0c868" : "#d8c8a0", b.crit?12:6);
        floatText(enemy.x, enemy.y-enemy.r-22, Math.round(b.damage), b.crit?"#ffcc44":"#eaf2ff");
        break;
      }
    }
    // Hunter hit check
    const h = state.hunter;
    if (!hit && h?.inCombat && h.invuln <= 0 && distance(b, h) < h.r + b.r) {
      h.hp -= b.damage;
      h.invuln = 0.18;
      floatText(h.x, h.y - h.r - 18, Math.round(b.damage), "#ff8020");
      burst(b.x, b.y, "#ff2020", 5);
      hit = true;
    }
    if (hit || b.life <= 0) state.bullets.splice(i, 1);
  }
}

function applyBulletHit(bullet, enemy) {
  const p = state.player;
  const ev = state.evolution;

  // Abyss Ritual: +40% damage to bullets inside field
  let dmg = bullet.damage;
  if (state.abyssRitual?.active && distance(p, enemy) < 200) {
    dmg *= 1.40;
    // Small ritual spark on hit
    state.particles.push({ x:enemy.x, y:enemy.y-10, vx:rand(-20,20), vy:rand(-40,-10), color:'#aa44ff', life:0.35, size:4 });
  }
  // eventFlag: damageMul
  if (state.eventFlags?.damageMul) dmg *= state.eventFlags.damageMul;

  // ── Elite Trait: SHIELD ────────────────────────────────
  if (enemy.eliteTrait === "shield" && enemy.shieldHp > 0) {
    const absorbed = Math.min(enemy.shieldHp, dmg);
    enemy.shieldHp -= absorbed;
    dmg -= absorbed;
    floatText(enemy.x, enemy.y - enemy.r - 18, `🛡`, '#44aaff');
    burst(enemy.x, enemy.y, '#2080ff', 5);
    // Shield recharge after 5s of not being hit
    enemy.shieldCd = 5.0;
    if (dmg <= 0) return; // fully absorbed
  }

  enemy.hp -= dmg;
  p.hitCount += 1;
  // Round stats tracking
  if (state.roundStats) {
    state.roundStats.damage += dmg;
    if (dmg > state.roundStats.maxHit) state.roundStats.maxHit = dmg;
  }

  // Phantom Hunt: mark every enemy hit
  if (state.phantomHunt?.active) {
    enemy.phantomMark = Math.max(enemy.phantomMark||0, 3.5);
  }

  // Corruption Orb: AOE infect on first enemy hit (handled here since orb exits updateBullets)
  if (bullet.isCorruptOrb) {
    const ORB_R = 92;
    explodeAt(bullet.x, bullet.y, ORB_R, dmg * 0.55, '#aa22ff', enemy);
    for (const e of state.enemies) {
      if (e === enemy || e.infected) continue;
      if (distance({x:bullet.x, y:bullet.y}, e) < ORB_R + e.r) {
        e.corrupted = Math.max(e.corrupted||0, 4.0);
        e.corruptDot = p.damage * 0.14;
      }
    }
    enemy.corrupted = Math.max(enemy.corrupted||0, 4.0);
    enemy.corruptDot = p.damage * 0.14;
    burst(bullet.x, bullet.y, '#aa22ff', 35);
    floatText(bullet.x, bullet.y-30, '腐化感染！', '#cc44ff');
    return; // skip normal damage already applied above (enemy.hp -= dmg)
  }

  if (p.traits.lifesteal) {
    p.hp = Math.min(p.maxHp, p.hp + bullet.damage * p.traits.lifesteal);
  }

  if (p.traits.bleedEvery && p.hitCount % p.traits.bleedEvery === 0) {
    const bleed = p.damage * 1.15;
    enemy.hp -= bleed;
    floatText(enemy.x, enemy.y-enemy.r-42, "BLEED", "#ff3050");
    burst(enemy.x, enemy.y, "#ff3050", 10);
  }

  // Crit chain
  if (bullet.chainOnCrit && bullet.crit) {
    const chained = state.enemies.find(o => o !== enemy && !o.infected && distance(enemy, o) < 170);
    if (chained) {
      chained.hp -= bullet.damage * 0.55;
      burst(chained.x, chained.y, "#55c9ff", 16);
      floatText(chained.x, chained.y-chained.r-28, "CHAIN", "#55c9ff");
    }
    // Crit evolution flash
    if (ev.dominant === "crit") {
      ev.critFlash = 0.6;
      if (ev.phase >= 2) ev.slowTimeCrit = 0.12; // brief time slow (visual only here)
    }
  }

  if (bullet.aoeRadius) {
    explodeAt(bullet.x, bullet.y, bullet.aoeRadius, bullet.damage * 0.62, "#55c9ff", enemy);
  }

  // Corrupt crit: extra corruption burst
  if (p.traits.corruptCrit && bullet.crit) {
    explodeAt(bullet.x, bullet.y, 60, bullet.damage * 0.4, "#8b5a8c", enemy);
    floatText(enemy.x, enemy.y-enemy.r-50, "腐化", "#cc44ff");
  }

  // Route: speed combo gain per hit
  if (state.buildRoute === "speed" && state.routeState) {
    const rs = state.routeState;
    rs.comboStacks = Math.min(rs.maxComboStacks, rs.comboStacks + 1);
    rs.comboFlash = 0.15;
    if (state.buildRouteTier >= 2 && bullet.crit) {
      rs.critSpeedTimer = 0.8;
    }
  }
}

function explodeAt(x, y, radius, damage, color, ignore=null) {
  for (const enemy of state.enemies) {
    if (enemy === ignore || enemy.infected) continue;
    if (distance({ x, y }, enemy) < radius + enemy.r) {
      enemy.hp -= damage;
      floatText(enemy.x, enemy.y-enemy.r-26, Math.round(damage), color);
    }
  }
  burst(x, y, color, Math.round(radius/3));
}

function killEnemy(enemy) {
  // Sound on kill
  if (enemy.kind === 'boss')        playSound('bossDeath');
  else if (enemy.kind === 'elite')  playSound('eliteDeath');
  else                               playSound('enemyDeath');

  state.kills += 1;
  if (state.roundStats) state.roundStats.kills++;
  const xp    = enemy.kind==="boss"?30:enemy.kind==="elite"?9:3;
  const baseCoins = Math.round((enemy.kind==="boss"?150:enemy.kind==="elite"?32:9) * state.player.goldRate);
  const coins = Math.round(baseCoins * (state.eventFlags?.goldMul || 1)) + (state.eventFlags?.killBonus || 0);
  state.pickups.push({ x:enemy.x, y:enemy.y, r:9, type:"xp", value:xp });
  state.pickups.push({ x:enemy.x+rand(-12,12), y:enemy.y+rand(-12,12), r:7, type:"coin", value:coins });
  state.player.petCharge += enemy.kind==="elite"?24:8;
  if (state.deathStats && enemy.kind === "elite") state.deathStats.eliteKills++;
  // eventFlag: elite heal
  if (enemy.kind === "elite" && state.eventFlags?.eliteHeal) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.eventFlags.eliteHeal);
    floatText(enemy.x, enemy.y-40, `+${state.eventFlags.eliteHeal} HP`, '#44ee80');
  }
  burst(enemy.x, enemy.y, enemy.kind==="boss"?"#ff50a0":"#44ee88", enemy.kind==="boss"?50:14);

  // Boss post-defeat dialogue — flag here, completeRound handles timing
  if (enemy.kind === 'boss') {
    state._bossDialoguePending = true;
  }

  // ── Elite Trait: EXPLODE ───────────────────────────────
  if (enemy.eliteTrait === "explode") {
    const expR  = 110;
    const expDmg = Math.round(enemy.maxHp * 0.40); // 40% of max HP as explosion damage
    explodeAt(enemy.x, enemy.y, expR, expDmg, '#ff6000');
    burst(enemy.x, enemy.y, '#ff8800', 40);
    burst(enemy.x, enemy.y, '#ffcc00', 20);
    floatText(enemy.x, enemy.y - 50, '爆 炸！', '#ff8800');
    // Screen shake
    if (state.skills) { state.skills._shakeTimer = 0.22; state.skills._shakeAmt = 10; }
  }

  // ── Kill Streak ────────────────────────────────────────
  const ks = state.killStreak;
  ks.timer = 2.4;
  ks.count++;
  const STREAK = [
    null,                             // 0
    null,                             // 1
    { txt:'双  杀',  sz:28, col:'#f0f0f0' },
    { txt:'三  杀',  sz:34, col:'#ffd45c' },
    { txt:'四  杀！', sz:40, col:'#ff8820' },
    { txt:'大屠杀！！', sz:48, col:'#ff2244' },
    { txt:'无人能挡！！', sz:58, col:'#cc44ff' },
  ];
  const tier = Math.min(ks.count, STREAK.length - 1);
  if (tier >= 2) {
    const s = STREAK[tier];
    // Push to a special big-text overlay (not floatText — bigger)
    state._streakMsg = { text: s.txt, size: s.sz, color: s.col,
      life: 1.4, maxLife: 1.4, x: canvas.clientWidth/2, y: canvas.clientHeight*0.38 };
    if (tier >= 5) burst(enemy.x, enemy.y, s.col, 28);
  }

  // Kill reaction: nearby enemies react with speech
  if (state.situation) {
    state.situation.killStreak++;
    const REACTIONS = ["不好！", "撤！", "它很危险...", "记录中...", "再来！"];
    const ELITE_REACT = ["威胁已确认", "需要增援", "战术调整中"];
    const witnesses = state.enemies.filter(e =>
      e !== enemy && distance(e, enemy) < 200 && Math.random() < 0.45
    );
    witnesses.slice(0, 2).forEach((e, i) => {
      window.setTimeout(() => {
        if (state.enemies.includes(e)) {
          const lines = e.kind === "elite" ? ELITE_REACT : REACTIONS;
          addEnemySpeech(e, lines[Math.floor(Math.random() * lines.length)], e.kind);
        }
      }, i * 280);
    });
  }

  // Route: corrupt enhanced infection
  if (state.buildRoute === "corrupt" && !enemy.infected && enemy.kind !== "boss") {
    const rs = state.routeState;
    const infCount = state.enemies.filter(e=>e.infected).length;
    if (infCount < rs.maxInfected && Math.random() < rs.infectionChance) {
      const ally = { ...enemy, hp:enemy.maxHp*0.5, maxHp:enemy.maxHp*0.5,
        damage: enemy.damage*0.20,
        speed:enemy.speed*1.2, infected:rs.infectedDuration, wobble:0,
        kind: enemy.kind==="archer"?"archer":"normal" };
      state.enemies.push(ally);
      floatText(enemy.x, enemy.y-28, "感染！", "#a030ff");
      burst(enemy.x, enemy.y, "#a030ff", 10);
      if (rs.chainInfect) {
        const chain = state.enemies.find(e=>!e.infected&&e!==enemy&&distance(e,enemy)<140);
        if (chain) { chain.infected = rs.infectedDuration * 0.6; burst(chain.x,chain.y,"#a030ff",6); }
      }
    }
    if (rs.poisonOnDeath) {
      rs.burnPatches = rs.burnPatches || [];
      rs.burnPatches.push({ x:enemy.x, y:enemy.y, r:70, timer:3.0, alpha:1, poison:true });
    }
  }

  // Route: blast enhanced explosion
  if (state.buildRoute === "blast" && enemy.kind !== "boss") {
    const rs = state.routeState;
    explodeAt(enemy.x, enemy.y, rs.blastRadius, state.player.damage*rs.blastDamageMul*0.5, "#ff8820");
    if (rs.blastBurnTier) {
      rs.burnPatches.push({ x:enemy.x, y:enemy.y, r:rs.blastRadius*0.65, timer:3.0, alpha:1 });
      if (rs.burnPatches.length > 14) rs.burnPatches.shift();
    }
    if (rs.megaBlastTier) {
      rs.megaBlastCount = (rs.megaBlastCount||0) + 1;
      if (rs.megaBlastCount >= 4) {
        rs.megaBlastCount = 0;
        explodeAt(enemy.x, enemy.y, rs.blastRadius*2.5, state.player.damage*rs.blastDamageMul*2, "#ffcc20");
        floatText(enemy.x, enemy.y-50, "超级爆炸！", "#ffcc20");
        burst(enemy.x, enemy.y, "#ffcc20", 50);
      }
    }
  }

  // Route: speed kill streak
  if (state.buildRoute === "speed" && state.routeState) {
    const rs = state.routeState;
    rs.killStreakCount++; rs.killStreakTimer = 5;
    if (state.buildRouteTier >= 4 && rs.killStreakCount >= 3) {
      state.player.rollCd = 0; rs.killStreakCount = 0;
      floatText(state.player.x, state.player.y-70, "冲刺重置！", "#8fb36a");
    }
  }

  // Route: curse low-HP lifesteal on kill
  if (state.buildRoute === "curse" && state.routeState?.lifeOnKillLowHp) {
    if (state.player.hp/state.player.maxHp < 0.25) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 12);
      floatText(enemy.x, enemy.y-28, "+12", "#ff3030");
    }
  }

  if (dogHas("chain") && Math.random() < 0.20 && enemy.kind !== "boss") {
    state.enemies.push({
      ...enemy,
      hp: enemy.maxHp * 0.5, maxHp: enemy.maxHp * 0.5,
      damage: enemy.damage * 0.20,
      speed: enemy.speed * 1.2,
      infected: 8.0,
      wobble: 0,
      kind: enemy.kind === "archer" ? "archer" : "normal"
    });
    floatText(enemy.x, enemy.y - 28, "感染变友军！", "#1aff80");
    burst(enemy.x, enemy.y, "#30ff80", 12);
  }

  if (state.player.traits.killExplosion && enemy.kind !== "boss") {
    explodeAt(enemy.x, enemy.y, 96, state.player.damage*0.8, "#55c9ff");
    floatText(enemy.x, enemy.y-62, "深渊连爆", "#55c9ff");
  }
  // Phantom Hunt: marked enemies explode with shadow damage
  if ((enemy.phantomMark||0) > 0 && enemy.kind !== 'boss') {
    explodeAt(enemy.x, enemy.y, 80, state.player.damage * 1.65, '#ff2244');
    for (let i=0; i<20; i++) {
      const a = rand(0,Math.PI*2), spd = rand(60,220);
      state.particles.push({ x:enemy.x, y:enemy.y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
        color:i%3===0?'#ff2244':'#220011', life:rand(0.25,0.6), size:rand(3,7) });
    }
    floatText(enemy.x, enemy.y-44, '幻影爆炸！', '#ff2244');
  }
  // Abyss Ritual: 30% chance to revive enemy as corrupted ally (inside field)
  if (state.abyssRitual?.active && enemy.kind !== 'boss' && !enemy.infected &&
      distance(state.player, enemy) < 200 && Math.random() < 0.30) {
    state.enemies.push({
      ...enemy,
      hp: enemy.maxHp * 0.35, maxHp: enemy.maxHp * 0.35,
      damage: enemy.damage * 0.18, speed: enemy.speed * 1.20,
      infected: 9.0, wobble: 0,
      kind: enemy.kind === 'archer' ? 'archer' : 'normal'
    });
    floatText(enemy.x, enemy.y-32, '腐化复生！', '#aa44ff');
    burst(enemy.x, enemy.y, '#8833cc', 20);
  }
  if (enemy.kind === "boss") {
    floatText(canvas.clientWidth/2, canvas.clientHeight/2 - 40, "✦ BOSS 击败！商店开放！✦", "#ffd45c");
    burst(canvas.clientWidth/2, canvas.clientHeight/2, "#ffd45c", 80);
    window.setTimeout(completeRound, 1600);
  }
}

function updatePickups(dt) {
  const p = state.player;
  p.xp = p.xp || 0;
  p.needXp = p.needXp || 12;
  for (let i = state.pickups.length-1; i >= 0; i--) {
    const item = state.pickups[i];
    const d = distance(p, item);
    if (d < 140) {
      const a = Math.atan2(p.y-item.y, p.x-item.x);
      item.x += Math.cos(a)*340*dt;
      item.y += Math.sin(a)*340*dt;
    }
    settleOnTerrain(item, dt, 10);
    if (d < p.r + item.r) {
      if (item.type === "xp") { p.xp += item.value; if (p.xp >= p.needXp) levelUp(); }
      else { state.coins += item.value; playSound('coin'); }
      state.pickups.splice(i, 1);
    }
  }
}

function levelUp() {
  playSound('levelUp');
  const p = state.player;
  p.xp -= p.needXp;
  p.needXp = Math.round(p.needXp * 1.32 + 5);
  // Auto-apply a random upgrade — no modal interruption
  const pool = upgrades.slice().sort(() => Math.random() - 0.5);
  const upg = pool[0];
  if (upg) {
    let rarity = chooseWeighted(rarities);
    state.guarantee += 1;
    if (state.guarantee >= 5 && rarity.power < 1.8) rarity = rarities[2];
    if (rarity.power >= 1.8) state.guarantee = 0;
    const value = upg.stat === "fireRate"
      ? upg.base * rarity.power
      : Math.round(upg.base * rarity.power);
    applyUpgrade(upg, value);
    if (upg.build) addEvolutionScore(upg.build, 8 + rarity.power * 4);
    floatText(p.x, p.y - 88,
      `✦ ${upg.name}  ·${rarity.name}`,
      rarity.color || "#ffd45c");
  }
}

function openUpgradeChoice() {
  ui.choiceType.textContent = "自选强化词条";
  ui.choiceTitle.textContent = "选择一个词条（含宠物装备）";
  const playerChoices = makeUpgradeChoices(2);
  const petChoice = makeDogGearChoice();
  showChoices(petChoice ? [...playerChoices, petChoice] : makeUpgradeChoices(3));
}

const DOG_GEAR_MAX = 3;

function makeDogGearChoice() {
  const dog = state.dog;
  if (!dog) return null;
  if (dog.gear.length >= DOG_GEAR_MAX) return null; // cap reached
  const avail = DOG_GEAR.filter(g => !dog.gear.includes(g.id));
  if (!avail.length) return null;
  const pick = avail[Math.floor(Math.random() * avail.length)];
  const rar  = { 普通: rarities[0], 稀有: rarities[1], 史诗: rarities[2], 传说: rarities[3] }[pick.rarity] || rarities[1];
  return {
    name: pick.name,
    rarity: rar,
    text: pick.desc,
    petGear: true,
    apply() {
      if (!dog.gear.includes(pick.id)) dog.gear.push(pick.id);
      floatText(state.player.x, state.player.y - 80, `狗获得 ${pick.name}！`, "#c8903a");
    }
  };
}

function openBoxChoice() {
  ui.choiceType.textContent = "神秘盲盒";
  ui.choiceTitle.textContent = "选择一个盲盒";
  const choices = boxes.slice().sort(() => Math.random()-.5).slice(0,3).map(box => ({
    name: box.name,
    rarity: box.level>=4 ? rarities[3] : rarities[Math.min(box.level-1,4)],
    text: box.text,
    apply: () => applyBox(box)
  }));
  showChoices(choices);
}

function makeUpgradeChoices(count) {
  const bag = upgrades.slice().sort(() => Math.random()-.5);
  return bag.slice(0, count).map(upg => {
    let rarity = chooseWeighted(rarities);
    state.guarantee += 1;
    if (state.guarantee >= 5 && rarity.power < 1.8) rarity = rarities[2];
    if (rarity.power >= 1.8) state.guarantee = 0;
    const value = upg.stat === "fireRate"
      ? upg.base * rarity.power
      : Math.round(upg.base * rarity.power);
    return {
      name: upg.name, rarity,
      text: `${upg.text} +${upg.stat==="crit"||upg.stat==="goldRate" ? Math.round(value)+"%" : value}`,
      build: upg.build,
      apply: () => {
        applyUpgrade(upg, value);
        if (upg.build) addEvolutionScore(upg.build, 8 + rarity.power * 4);
      }
    };
  });
}

function showChoices(choices) {
  ui.choiceCards.innerHTML = "";
  for (const choice of choices) {
    const btn = document.createElement("button");
    btn.className = `card rarity-${choice.rarity.name}`;
    btn.appendChild(makeIconCanvas(choice.name));
    const buildLabel = choice.build ? `<em class="card-build">${BUILD_TYPES[choice.build]?.label || ""} 倾向</em>` : "";
    btn.insertAdjacentHTML("beforeend",
      `<small>${choice.rarity.name}</small><strong>${choice.name}</strong><span>${choice.text}</span>${buildLabel}`);
    btn.addEventListener("click", () => {
      choice.apply();
      hide(ui.choiceModal);
      paused = false;
      last = performance.now();
    });
    ui.choiceCards.appendChild(btn);
  }
  show(ui.choiceModal);
}

// ─── Shop (after every 5 rounds) ─────────────────────────
function openShop() {
  ui.shopTitle.textContent = `第 ${state.round} 回合后 — 装备商店`;
  ui.shopMeta.innerHTML = [
    `金币 ${state.coins}`,
    `装备 ${state.ownedWeapons.length} / ${state.equipmentLimit}`,
    `变异 ${state.evolution[state.evolution.dominant]||0}%`
  ].map(t => `<span>${t}</span>`).join("");
  renderEquipmentSlots();
  renderShopCards(makeShopChoices());
  show(ui.shopModal);
}

function makeShopChoices() {
  const owned = state.ownedWeapons.map(w => w.name);
  const avail = weaponShop.filter(w => !owned.includes(w.name));
  const dom = state.evolution.dominant;
  const sorted = avail.sort((a, b) => {
    const aMatch = a.build === dom ? 1 : 0;
    const bMatch = b.build === dom ? 1 : 0;
    return (bMatch - aMatch) + (Math.random()-.5) * 0.8;
  });
  return sorted.slice(0, 3);
}

function makeDogShopItems() {
  if (!state.dog) return [];
  if (state.dog.gear.length >= DOG_GEAR_MAX) return [];
  const avail = DOG_GEAR.filter(g => !state.dog.gear.includes(g.id));
  return avail.sort(() => Math.random() - 0.5).slice(0, 2);
}

function renderShopCards(items) {
  ui.shopCards.innerHTML = "";

  for (const item of items) {
    const canBuy = state.coins >= item.cost && state.ownedWeapons.length < state.equipmentLimit;
    const btn = document.createElement("button");
    const buildInfo = item.build ? `<em class="card-build">${BUILD_TYPES[item.build]?.label || ""}</em>` : "";
    const reason = state.ownedWeapons.length >= state.equipmentLimit ? "装备栏已满" : item.text;
    btn.className = `card rarity-${item.rarity}${canBuy ? "" : " disabled"}`;
    btn.appendChild(makeIconCanvas(item.name));
    btn.insertAdjacentHTML("beforeend",
      `<small>${item.rarity} / ${item.cost} 金币</small><strong>${item.name}</strong><span>${reason}</span>${buildInfo}`);
    btn.addEventListener("click", () => {
      if (!canBuy) {
        floatText(state.player.x, state.player.y-80,
          state.ownedWeapons.length >= state.equipmentLimit ? "装备栏已满" : "金币不足", "#ff4060");
        return;
      }
      state.coins -= item.cost;
      state.ownedWeapons.push({ ...item, level:1, paid:item.cost });
      applyWeaponEffect(item.effect, 1);
      if (item.build) addEvolutionScore(item.build, 14);
      floatText(state.player.x, state.player.y-80, item.name, "#ffd45c");
      openShop();
    });
    ui.shopCards.appendChild(btn);
  }
  if (!items.length) {
    const empty = document.createElement("button");
    empty.className = "card disabled";
    empty.insertAdjacentHTML("beforeend",
      `<small>售罄</small><strong>武器已买完</strong><span>进入下一回合。</span>`);
    ui.shopCards.appendChild(empty);
  }

  const dogFull    = state.dog && state.dog.gear.length >= DOG_GEAR_MAX;
  const dogItems   = dogFull ? [] : makeDogShopItems();
  if (dogItems.length > 0 || dogFull) {
    const label = document.createElement("div");
    label.style.cssText = "grid-column:1/-1;color:#c8903a;font-weight:700;font-size:12px;margin-top:10px;padding:4px 0 2px;border-top:1px solid #c8903a44;";
    label.textContent = dogFull
      ? `🐕 宠物装备（已满 ${DOG_GEAR_MAX}/${DOG_GEAR_MAX}）`
      : `🐕 宠物装备（${state.dog.gear.length}/${DOG_GEAR_MAX}）`;
    ui.shopCards.appendChild(label);
    for (const gear of dogItems) {
      const canBuy = state.coins >= gear.cost;
      const btn = document.createElement("button");
      btn.className = `card rarity-${gear.rarity}${canBuy ? "" : " disabled"}`;
      btn.appendChild(makeIconCanvas(gear.name));
      btn.insertAdjacentHTML("beforeend",
        `<small>宠物 / ${gear.cost} 金币</small><strong>${gear.name}</strong><span>${gear.desc}</span><em class="card-build">宠物装备</em>`);
      btn.addEventListener("click", () => {
        if (!canBuy) { floatText(state.player.x, state.player.y-80, "金币不足", "#ff4060"); return; }
        if (state.dog.gear.length >= DOG_GEAR_MAX) {
          floatText(state.player.x, state.player.y-80, "宠物装备已满", "#ff4060"); return;
        }
        state.coins -= gear.cost;
        if (!state.dog.gear.includes(gear.id)) state.dog.gear.push(gear.id);
        floatText(state.player.x, state.player.y-80, `${gear.name} 装备成功！`, "#c8903a");
        openShop();
      });
      ui.shopCards.appendChild(btn);
    }
  }
}

function renderEquipmentSlots() {
  document.getElementById("equipSlots")?.remove();
  const container = document.createElement("div");
  container.className = "cards equip-slots";
  container.id = "equipSlots";

  for (let i = 0; i < state.equipmentLimit; i++) {
    const item = state.ownedWeapons[i];
    const btn = document.createElement("button");
    if (!item) {
      btn.className = "card disabled";
      btn.insertAdjacentHTML("beforeend",
        `<small>空槽 ${i + 1}</small><strong>EMPTY</strong><span>购买装备后占用此槽。</span>`);
    } else {
      const upgCost = Math.round(item.cost * (0.65 + item.level * 0.45));
      const sellVal = Math.round(item.paid * 0.5);
      const buildTag = item.build ? `<em class="card-build">${BUILD_TYPES[item.build]?.label || ""}</em>` : "";
      btn.className = `card rarity-${item.rarity}`;
      btn.dataset.equip = i;
      btn.appendChild(makeIconCanvas(item.name));
      btn.insertAdjacentHTML("beforeend",
        `<small>Lv.${item.level} / 升级 ${upgCost} / 售出 ${sellVal}</small>
         <strong>${item.name}</strong>
         <span>${item.text}<br>点击升级，右键售出</span>
         ${buildTag}`);
    }
    container.appendChild(btn);
  }

  ui.shopMeta.insertAdjacentElement("afterend", container);

  container.addEventListener("click", ev => {
    const card = ev.target.closest("[data-equip]");
    if (card) upgradeEquipment(Number(card.dataset.equip));
  });
  container.addEventListener("contextmenu", ev => {
    const card = ev.target.closest("[data-equip]");
    if (!card) return;
    ev.preventDefault();
    sellEquipment(Number(card.dataset.equip));
  });
}

function upgradeEquipment(index) {
  const item = state.ownedWeapons[index];
  if (!item) return;
  const cost = Math.round(item.cost * (0.65 + item.level * 0.45));
  if (state.coins < cost) {
    floatText(state.player.x, state.player.y-80, "金币不足", "#ff4060");
    return;
  }
  state.coins -= cost;
  item.level += 1;
  item.paid  += cost;
  applyWeaponEffect(item.effect, 1);
  if (item.build) addEvolutionScore(item.build, 10);
  floatText(state.player.x, state.player.y-80, `${item.name} Lv.${item.level}`, "#ffd45c");
  openShop();
}

function sellEquipment(index) {
  const item = state.ownedWeapons[index];
  if (!item) return;
  for (let i=0; i<item.level; i++) applyWeaponEffect(item.effect, -1);
  state.coins += Math.round(item.paid * 0.5);
  state.ownedWeapons.splice(index, 1);
  refreshEquipmentTraits();
  openShop();
}

function refreshEquipmentTraits() {
  const p = state.player;
  const baseTraits = classes[state.classId]?.traits || {};
  const traitKeys = new Set();
  for (const item of weaponShop) {
    for (const k of Object.keys(item.effect.traits||{})) traitKeys.add(k);
  }
  for (const k of traitKeys) p.traits[k] = Boolean(baseTraits[k]);
  for (const item of state.ownedWeapons) {
    for (const [k,v] of Object.entries(item.effect.traits||{})) {
      if (v) p.traits[k] = true;
    }
  }
}

function applyWeaponEffect(effect, dir) {
  const p = state.player;
  if (effect.damage)          p.damage = Math.max(1, p.damage + effect.damage * dir);
  if (effect.crit)            p.crit   = Math.max(0, p.crit   + effect.crit   * dir);
  if (effect.maxHp) {
    p.maxHp += effect.maxHp * dir;
    p.hp = Math.min(p.maxHp, Math.max(1, p.hp + effect.maxHp * dir));
  }
  if (effect.projectiles) p.projectiles = Math.max(1, p.projectiles + effect.projectiles * dir);
  if (effect.shield) {
    p.shieldMax = Math.max(0, p.shieldMax + effect.shield * dir);
    p.shield    = Math.max(0, Math.min(p.shieldMax, p.shield + effect.shield * dir));
  }
  if (effect.fireRateMul)       p.fireRate  *= dir>0 ? effect.fireRateMul : 1/effect.fireRateMul;
  if (effect.speedMul)          p.speed     *= dir>0 ? effect.speedMul    : 1/effect.speedMul;
  if (effect.dashCooldownMul)   p.traits.dashCooldown *= dir>0 ? effect.dashCooldownMul : 1/effect.dashCooldownMul;
  if (effect.damageReduction)   p.traits.damageReduction = Math.max(0, Math.min(0.75, (p.traits.damageReduction||0) + effect.damageReduction*dir));
  if (effect.knockback)         p.traits.knockback  = Math.max(0, (p.traits.knockback||0) + effect.knockback*dir);
  if (effect.aoeRadius)         p.traits.aoeRadius  = Math.max(0, (p.traits.aoeRadius||0) + effect.aoeRadius*dir);
  if (effect.lifestealBonus)    p.traits.lifesteal  = Math.max(0, (p.traits.lifesteal||0) + effect.lifestealBonus*dir);
  if (effect.traits && dir>0)   Object.assign(p.traits, effect.traits);
}

function applyUpgrade(upgrade, value) {
  const p = state.player;
  if (upgrade.stat === "maxHp") {
    p.maxHp += value; p.hp = Math.min(p.maxHp, p.hp + value);
  } else if (upgrade.stat === "projectiles") {
    p.projectiles = Math.min(6, p.projectiles + 1);
  } else if (upgrade.stat === "goldRate") {
    p.goldRate += value / 100;
  } else if (upgrade.stat === "fireRate") {
    p.fireRate = Math.max(0.08, p.fireRate + value);
  } else {
    p[upgrade.stat] += value;
  }
  floatText(p.x, p.y-70, upgrade.name, "#ffca5e");
}

function applyBox(box) {
  const times = box.level >= 2 ? 2 : 1;
  for (let i=0; i<times; i++) { const c = makeUpgradeChoices(1)[0]; c.apply(); }
  state.coins += box.level >= 3 ? 50 : 14;
  state.guarantee += box.level;
  if (box.level === 4) { state.nextSpawn=0; for (let i=0;i<6;i++) spawnEnemy("normal"); }
  if (box.level === 5) {
    applyUpgrade({ stat:"damage", name:"诅咒星核" }, 24);
    spawnEnemy("elite"); spawnEnemy("elite");
  }
}

// ─── Build Route System ───────────────────────────────────

const BUILD_ROUTES = [
  { id:"corrupt", name:"腐化流",  color:"#a030ff", icon:"☣",
    tag:"感染 · 扩散 · 腐化军团",
    desc:"击杀后感染尸体为临时友军，后期形成腐化军团。",
    startBonus:["感染概率 25%","击杀爆炸","子弹 AOE 60"],
    tiers:["感染 +15%，持续 +2s","友军死亡传播腐化 + 毒雾","感染连锁传播","场上最多 8 只感染友军"] },
  { id:"speed",   name:"攻速流",  color:"#8fb36a", icon:"⚡",
    tag:"连击 · 爆发 · 失控",
    desc:"连续攻击叠加连击层，攻速随层数提升，受伤层数下降。",
    startBonus:["连击系统激活","最大 8 层","每层攻速 +7%"],
    tiers:["最大层数 +4，狗攻速随层提升","暴击后 0.8s 移速 +40%","连击≥5 触发狗高速扑击","连杀 3 次重置冲刺冷却"] },
  { id:"tank",    name:"肉盾流",  color:"#7ca85a", icon:"🛡",
    tag:"护盾 · 反伤 · 不倒",
    desc:"受击时反伤周围敌人，血量越低减伤越高，狗替玩家挡伤。",
    startBonus:["+60 护盾上限","受击反伤 30%","低血减伤最高 35%"],
    tiers:["护盾 +50，反伤范围 +60","护盾破碎时震荡波","低血量自动回护盾","受重击释放冲击波"] },
  { id:"blast",   name:"爆炸流",  color:"#ff8820", icon:"💥",
    tag:"爆炸 · 连锁 · 清场",
    desc:"击杀后触发爆炸，爆炸可二次击杀，连续爆炸叠加威力。",
    startBonus:["击杀爆炸 ×1.5","半径 100","连锁 30%"],
    tiers:["半径 +50，伤害 +40%","爆炸留下燃烧地面 3s","连续 4 次超大爆炸","爆炸减速 + 狗攻击 AOE"] },
  { id:"curse",   name:"诅咒流",  color:"#ff3030", icon:"💀",
    tag:"风险 · 暴走 · 代价",
    desc:"伤害大幅提升但血量下降，低血量进入狂暴，敌人更强。",
    startBonus:["攻击 +40%","最大血量 -25%","低血狂暴 +80%伤害"],
    tiers:["暴击 +20%，血量上限再 -10%","低血(<25%)击杀回血 12","狂暴期间冲刺冷却 -50%","敌人属性 +30%，金币掉落 ×2"] },
  { id:"summon",  name:"召唤流",  color:"#ffd45c", icon:"👾",
    tag:"影犬 · 召唤 · 控制",
    desc:"定期召唤影犬助战，狗攻击范围提升，召唤物继承属性。",
    startBonus:["25s 召唤影犬","狗攻击范围 +50%","影犬持续 10s"],
    tiers:["最多 2 只影犬，持续 +5s","影犬继承 50% 攻击力","召唤间隔 -8s，死亡爆炸","狗召唤分身双重攻击"] },
];

function initRouteState() {
  return {
    // speed
    comboStacks:0, maxComboStacks:8, comboFlash:0,
    critSpeedTimer:0, killStreakCount:0, killStreakTimer:0,
    // corrupt
    infectionChance:0.25, infectedDuration:8,
    poisonOnDeath:false, chainInfect:false, maxInfected:4,
    // blast
    blastRadius:100, blastDamageMul:1.5,
    blastBurnTier:false, burnPatches:[],
    megaBlastTier:false, megaBlastCount:0, blastSlowTier:false,
    // tank
    thornsRadius:80, thornsMul:0.30,
    shieldBurstTier:false, autoShieldTier:false, shockwaveTier:false,
    // curse
    berserking:false,
    lifeOnKillLowHp:false, berserkDashBoost:false, empoweredEnemies:false,
    // summon
    shadowDogs:[], shadowDogTimer:25, maxShadowDogs:1,
    shadowDogDuration:10, shadowDogInherit:false, shadowDogExplosion:false,
  };
}

let _selectedRoute = null;

function openRouteSelection() {
  _selectedRoute = null;
  const cards = document.getElementById("routeCards");
  cards.innerHTML = BUILD_ROUTES.map(r => `
    <button class="route-card" data-route="${r.id}" style="--rc:${r.color}">
      <span class="route-card-icon">${r.icon}</span>
      <div class="route-card-name">${r.name}</div>
      <div class="route-card-tag">${r.tag}</div>
      <div class="route-card-desc">${r.desc}</div>
      <div class="route-card-bonuses">${r.startBonus.map(b=>`<span class="route-card-bonus">${b}</span>`).join("")}</div>
    </button>`).join("");
  document.getElementById("routeConfirmBtn").disabled = true;

  cards.onclick = ev => {
    const card = ev.target.closest("[data-route]");
    if (!card) return;
    _selectedRoute = card.dataset.route;
    cards.querySelectorAll(".route-card").forEach(c => c.classList.toggle("selected", c === card));
    document.getElementById("routeConfirmBtn").disabled = false;
  };
  show(document.getElementById("routeModal"));
}

function confirmRouteSelection() {
  if (!_selectedRoute) return;
  applyRouteSelection(_selectedRoute);
  hide(document.getElementById("routeModal"));
  startNextRound();
}

function applyRouteSelection(id) {
  const rs = state.routeState;
  const p  = state.player;
  state.buildRoute = id;
  state.buildRouteTier = 0;
  const route = BUILD_ROUTES.find(r => r.id === id);
  floatText(canvas.clientWidth/2, 140, `路线锁定：${route.name}`, route.color);

  if (id === "corrupt") {
    p.traits.killExplosion = true;
    p.traits.aoeRadius = Math.max(p.traits.aoeRadius||0, 60);
    rs.infectionChance = 0.25;
  }
  if (id === "speed") {
    p._baseFireRate = p.fireRate;
    rs.comboStacks = 2; rs.maxComboStacks = 8;
  }
  if (id === "tank") {
    p.shieldMax += 60; p.shield = Math.min(p.shieldMax, p.shield + 60);
    p.traits._baseDR = p.traits.damageReduction || 0;
  }
  if (id === "blast") {
    p.traits.killExplosion = true;
    rs.blastRadius = 100; rs.blastDamageMul = 1.5;
  }
  if (id === "curse") {
    p.damage  = Math.round(p.damage * 1.40);
    p.maxHp   = Math.round(p.maxHp * 0.75);
    p.hp      = Math.min(p.hp, p.maxHp);
  }
  // summon: range boost handled in updateDog via flag check
  updateRouteHud();
}

function applyRouteTier(tier) {
  const rs  = state.routeState;
  const p   = state.player;
  const id  = state.buildRoute;
  if (!id || !rs) return;
  state.buildRouteTier = tier;
  const route = BUILD_ROUTES.find(r => r.id === id);
  const label = route.tiers[tier - 1] || "路线强化";
  floatText(canvas.clientWidth/2, 140, `◆ ${route.name} Lv.${tier} ◆`, route.color);
  setTimeout(() => floatText(canvas.clientWidth/2, 168, label, "#ccbbff"), 500);
  // Flash the evolve bar to signal the tier-up
  updateEvolveBar();
  if (ui.evolveBar) {
    ui.evolveBar.style.transition = "width 0.05s ease, background 0.05s ease";
    ui.evolveBar.style.filter = "brightness(2.2)";
    setTimeout(() => {
      if (ui.evolveBar) {
        ui.evolveBar.style.filter = "";
        ui.evolveBar.style.transition = "width 0.5s ease, background 0.4s ease";
      }
    }, 380);
  }

  if (id === "corrupt") {
    if (tier===1){ rs.infectionChance=Math.min(0.9,rs.infectionChance+0.15); rs.infectedDuration+=2; }
    if (tier===2){ rs.poisonOnDeath=true; }
    if (tier===3){ rs.chainInfect=true; }
    if (tier===4){ rs.maxInfected=8; }
  }
  if (id === "speed") {
    if (tier===1){ rs.maxComboStacks+=4; }
    if (tier===2){ /* critSpeedTimer checked in applyBulletHit */ }
    if (tier===3){ /* handled via routeState check in updateDog */ }
    if (tier===4){ /* handled in killEnemy streak */ }
  }
  if (id === "tank") {
    if (tier===1){ p.shieldMax+=50; p.shield=Math.min(p.shieldMax,p.shield+50); rs.thornsRadius+=60; }
    if (tier===2){ rs.shieldBurstTier=true; }
    if (tier===3){ rs.autoShieldTier=true; }
    if (tier===4){ rs.shockwaveTier=true; }
  }
  if (id === "blast") {
    if (tier===1){ rs.blastRadius+=50; rs.blastDamageMul+=0.4; }
    if (tier===2){ rs.blastBurnTier=true; }
    if (tier===3){ rs.megaBlastTier=true; }
    if (tier===4){ rs.blastSlowTier=true; }
  }
  if (id === "curse") {
    if (tier===1){ p.crit=Math.min(95,p.crit+20); p.maxHp=Math.round(p.maxHp*0.90); p.hp=Math.min(p.hp,p.maxHp); }
    if (tier===2){ rs.lifeOnKillLowHp=true; }
    if (tier===3){ rs.berserkDashBoost=true; }
    if (tier===4){ rs.empoweredEnemies=true; }
  }
  if (id === "summon") {
    if (tier===1){ rs.maxShadowDogs=2; rs.shadowDogDuration+=5; }
    if (tier===2){ rs.shadowDogInherit=true; }
    if (tier===3){ rs.shadowDogTimer=Math.max(10,rs.shadowDogTimer-8); rs.shadowDogExplosion=true; }
    if (tier===4){ /* dogClone handled in updateDog */ }
  }
  updateRouteHud();
}

function updateRouteEffects(dt) {
  if (!state.running || paused || !state.buildRoute || !state.routeState) return;
  const rs = state.routeState;
  const p  = state.player;
  const id = state.buildRoute;

  if (id === "speed") {
    if (p._baseFireRate == null) p._baseFireRate = p.fireRate;
    p.fireRate = Math.max(0.08, p._baseFireRate * (1/(1 + rs.comboStacks*0.07)));
    if (rs.critSpeedTimer > 0) rs.critSpeedTimer -= dt;
    if (rs.comboFlash > 0) rs.comboFlash -= dt;
    if (rs.killStreakTimer > 0) rs.killStreakTimer -= dt;
    else rs.killStreakCount = 0;
  }
  if (id === "curse") {
    const wasB = rs.berserking;
    rs.berserking = p.hp/p.maxHp < 0.30;
    if (rs.berserking && !wasB) {
      floatText(p.x, p.y-80, "狂暴！", "#ff2020");
      burst(p.x, p.y, "#ff2020", 20);
    }
  }
  if (id === "tank") {
    const bonusDR = (1 - p.hp/p.maxHp) * 0.35;
    p.traits.damageReduction = Math.min(0.75, (p.traits._baseDR||0) + bonusDR);
    if (rs.autoShieldTier && p.hp/p.maxHp < 0.30 && p.shieldMax>0)
      p.shield = Math.min(p.shieldMax, p.shield + 12*dt);
  }
  if (id === "blast") {
    for (let i = rs.burnPatches.length-1; i>=0; i--) {
      const bp = rs.burnPatches[i];
      bp.timer -= dt; bp.alpha = bp.timer/3.0;
      for (const e of state.enemies) {
        if (!e.infected && distance(bp,e) < bp.r) e.hp -= 10*dt;
      }
      if (bp.timer <= 0) rs.burnPatches.splice(i,1);
    }
  }
  if (id === "summon") {
    rs.shadowDogTimer -= dt;
    if (rs.shadowDogTimer <= 0 && rs.shadowDogs.length < rs.maxShadowDogs) {
      spawnShadowDog();
      rs.shadowDogTimer = Math.max(10, 25 - state.buildRouteTier*4);
    }
    updateShadowDogs(dt);
  }
}

function spawnShadowDog() {
  const p  = state.player;
  const rs = state.routeState;
  const statMul = rs.shadowDogInherit ? 0.40 : 0.25;
  const dogHp   = Math.round(p.maxHp * statMul);
  rs.shadowDogs.push({
    x:p.x+rand(-50,50), y:p.y+rand(-30,30),
    r:13, hp:dogHp, maxHp:dogHp,
    damage: p.damage * statMul, speed:240, attackCd:0,
    life:rs.shadowDogDuration, maxLife:rs.shadowDogDuration,
  });
  floatText(p.x, p.y-70, "影犬召唤！", "#ffd45c");
  burst(p.x, p.y, "#ffd45c", 12);
}

function updateShadowDogs(dt) {
  const rs = state.routeState;
  for (let i = rs.shadowDogs.length-1; i>=0; i--) {
    const dog = rs.shadowDogs[i];
    dog.life -= dt;
    if (dog.life<=0 || dog.hp<=0) {
      if (rs.shadowDogExplosion) explodeAt(dog.x, dog.y, 90, state.player.damage*0.8, "#ffd45c");
      burst(dog.x, dog.y, "#ffd45c", 10);
      rs.shadowDogs.splice(i,1);
      continue;
    }
    const tgt = state.enemies.filter(e=>!e.infected)
      .sort((a,b)=>distance(a,dog)-distance(b,dog))[0];
    if (tgt) {
      const ang = Math.atan2(tgt.y-dog.y, tgt.x-dog.x);
      dog.x += Math.cos(ang)*dog.speed*dt;
      dog.y += Math.sin(ang)*dog.speed*dt;
      dog.attackCd -= dt;
      if (dog.attackCd<=0 && distance(dog,tgt) < dog.r+tgt.r+15) {
        tgt.hp -= dog.damage;
        floatText(tgt.x, tgt.y-24, Math.round(dog.damage), "#ffd45c");
        burst(dog.x, dog.y, "#ffd45c", 4);
        dog.attackCd = 0.7;
      }
    }
  }
}

function drawRouteFx() {
  if (!state.buildRoute || !state.routeState) return;
  const rs = state.routeState;
  // Burn patches (blast route)
  if (state.buildRoute==="blast") {
    for (const bp of rs.burnPatches) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, bp.alpha)*0.65;
      const g = ctx.createRadialGradient(bp.x,bp.y,0,bp.x,bp.y,bp.r);
      g.addColorStop(0,"#ffcc20"); g.addColorStop(0.5,"#ff4400"); g.addColorStop(1,"transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(bp.x, bp.y, bp.r, bp.r*0.45, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }
  // Shadow dogs (summon route)
  if (state.buildRoute==="summon") {
    for (const dog of rs.shadowDogs) {
      const alpha = Math.min(1, dog.life/2)*0.9;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(dog.x, dog.y+dog.r*0.4, dog.r*1.1, dog.r*0.35, 0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#ffd45c";
      ctx.shadowColor = "#ffd45c"; ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(dog.x, dog.y-dog.r*0.4, dog.r*0.82, dog.r, 0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#000"; ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(dog.x-5, dog.y-dog.r*0.8, 2.5,0,Math.PI*2);
      ctx.arc(dog.x+5, dog.y-dog.r*0.8, 2.5,0,Math.PI*2);
      ctx.fill();
      const hpPct = dog.hp/dog.maxHp;
      ctx.fillStyle="rgba(0,0,0,.5)";
      ctx.fillRect(dog.x-dog.r, dog.y-dog.r*1.9, dog.r*2, 3);
      ctx.fillStyle="#ffd45c";
      ctx.fillRect(dog.x-dog.r, dog.y-dog.r*1.9, dog.r*2*hpPct, 3);
      ctx.restore();
    }
  }
}

function updateRouteHud() {
  const el = document.getElementById("routeHud");
  if (!el) return;
  if (!state.buildRoute) { el.style.display="none"; return; }
  el.style.display = "block";
  const route = BUILD_ROUTES.find(r=>r.id===state.buildRoute);
  const rs    = state.routeState;
  el.style.setProperty("--rh-color", route.color);
  let extra = "";
  if (state.buildRoute==="speed" && rs)
    extra = ` &nbsp;<span style="color:#fff">连击 ${rs.comboStacks}/${rs.maxComboStacks}</span>`;
  else if (state.buildRoute==="blast" && rs?.megaBlastTier)
    extra = ` &nbsp;<span style="color:#ff8820">爆炸链 ${rs.megaBlastCount}/4</span>`;
  else if (state.buildRoute==="curse" && rs?.berserking)
    extra = ` &nbsp;<span style="color:#ff4040">▲ 狂暴</span>`;
  else if (state.buildRoute==="summon" && rs)
    extra = ` &nbsp;<span style="color:#ffd45c">影犬 ${rs.shadowDogs.length}/${rs.maxShadowDogs}</span>`;
  // 第2回合后流派锁定，显示🔒图标
  const lockIcon = state.round > 2 ? ` <span style="opacity:.4;font-size:10px">🔒</span>` : '';
  el.innerHTML = `${route.icon} ${route.name} <span style="opacity:.5">Lv.${state.buildRouteTier}</span>${extra}${lockIcon}`;
}

// ─── MBTI Death Card Logic ────────────────────────────────

function trackDeathStats(dt) {
  if (!state.running || paused || !state.deathStats) return;
  const p  = state.player;
  const st = state.deathStats;
  st.totalFrames++;

  const dx = p.x - st.prevX;
  const dy = p.y - st.prevY;
  const moved = Math.hypot(dx, dy);
  st.totalDistance += moved;
  st.prevX = p.x;
  st.prevY = p.y;

  if (p.hp / p.maxHp < 0.3) st.lowHpFrames++;

  if (moved > 0.8 && state.enemies.length > 0) {
    const nearest = nearestEnemy();
    if (nearest) {
      const toEnemy  = Math.atan2(nearest.y - p.y, nearest.x - p.x);
      const moveDir  = Math.atan2(dy, dx);
      let   diff     = moveDir - toEnemy;
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const absDiff  = Math.abs(diff);
      if (absDiff < Math.PI * 0.45) st.aggressionFrames++;
      else if (absDiff > Math.PI * 0.7) st.kiteFrames++;
    }
  } else if (moved < 0.5) {
    st.stationaryFrames++;
  }
}

function deriveMBTI() {
  const st  = state.deathStats;
  const tr  = state.tracker;
  const ev  = state.evolution;
  const p   = state.player;
  const tf  = Math.max(1, st?.totalFrames || 1);

  const aggrR  = (st?.aggressionFrames || 0) / tf;
  const kiteR  = (st?.kiteFrames       || 0) / tf;
  const statR  = (st?.stationaryFrames || 0) / tf;
  const lowHpR = (st?.lowHpFrames      || 0) / tf;
  const dashPM = tr.dashCount / Math.max(1, state.time / 60);
  const eliteR = (st?.eliteKills       || 0) / Math.max(1, state.kills);
  const petR   = tr.dogKills / Math.max(1, state.kills);
  const explR  = Math.min(1, (st?.totalDistance || 0) / 45000);
  const infR   = Math.min(1, (ev.corrupt || 0) / 100);
  const critN  = p.crit / 100;

  const scores = {
    INTJ: 10 + eliteR*42 + (1-lowHpR)*18 + Math.max(0,(1-dashPM/8))*14 + (1-aggrR)*16,
    ENTP: 10 + dashPM*5  + aggrR*18 + infR*20 + lowHpR*22 + explR*8,
    ISTP: 10 + critN*28  + eliteR*20 + (1-aggrR)*20 + (1-infR)*16,
    ENFP: 10 + explR*35  + aggrR*14 + (1-statR)*18 + infR*8  + dashPM*2.5,
    INFP: 10 + petR*42   + infR*24  + (1-aggrR)*14 + kiteR*8,
    ESTJ: 10 + statR*36  + Math.max(0,(1-dashPM/8))*18 + (1-kiteR)*24 + (1-infR)*8,
    INFJ: 10 + kiteR*30  + (1-lowHpR)*22 + (state.time > 90 ? 18 : 0) + (1-aggrR)*14,
    ESFP: 10 + aggrR*28  + lowHpR*26 + dashPM*3.5 + (1-eliteR)*8,
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function drawDcPortrait(canvas, typeKey) {
  const pc = canvas.getContext("2d");
  pc.imageSmoothingEnabled = false;
  const S = 10;
  pc.fillStyle = "#06030f";
  pc.fillRect(0, 0, canvas.width, canvas.height);

  const DEFS = {
    INTJ: {
      pal:{".":"#06030f","1":"#1a0840","2":"#3a1880","3":"#6038c0","4":"#9060f0","5":"#c0a0ff","6":"#44ccff"},
      rows:["..122...",".12332..",".2334421","12655621","12644321","12334321",".1233210","...11..."]
    },
    ENTP: {
      pal:{".":"#06030f","1":"#401800","2":"#804010","3":"#c06020","4":"#ff8820","5":"#ffc060","6":"#ff4040"},
      rows:["6.1221.6","63444436","14433441","14366441","14344341","14433441","63444436","6.1221.6"]
    },
    ISTP: {
      pal:{".":"#06030f","1":"#002030","2":"#004060","3":"#0080a0","4":"#44ccff","5":"#80e8ff","6":"#44ff88"},
      rows:["..122...",".12332..",".2344321","12644321","12611321","12344321",".1233210","...11..."]
    },
    ENFP: {
      pal:{".":"#06030f","1":"#300020","2":"#601040","3":"#a02070","4":"#ff50a0","5":"#ff90c0","6":"#ffe0f0","7":"#ffff80"},
      rows:["7.1221.7","71344317","13445431","13566531","13455431","13445431","71344317","7.1221.7"]
    },
    INFP: {
      pal:{".":"#06030f","1":"#001a08","2":"#003a18","3":"#006030","4":"#7ca85a","5":"#a0ffc0","6":"#c8ffb0"},
      rows:["..122...",".12332..",".2334321","12644321","12644321","12334321",".1232210","..4544.."]
    },
    ESTJ: {
      pal:{".":"#06030f","1":"#201000","2":"#503010","3":"#886020","4":"#ffcc20","5":"#ffe880","6":"#c08010"},
      rows:["61111116","12222221","23333332","24466442","24466442","23333332","12222221","61111116"]
    },
    INFJ: {
      pal:{".":"#06030f","1":"#1a0030","2":"#400060","3":"#7000a0","4":"#e070ff","5":"#f0b0ff","6":"#ffffff","7":"#ffee00"},
      rows:["..122...",".12332..",".2334321","13655431","72644327","12344321",".1233210","...11..."]
    },
    ESFP: {
      pal:{".":"#06030f","1":"#200000","2":"#500000","3":"#900010","4":"#ff2020","5":"#ff6060","6":"#ff8040"},
      rows:["..122...",".12332..",".2444321","12466421","12466421","14444431",".1433210","...11..."]
    },
  };

  const def = DEFS[typeKey];
  if (!def) return;
  def.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === "." || ch === " ") return;
      const col = def.pal[ch];
      if (col) { pc.fillStyle = col; pc.fillRect(c * S, r * S, S, S); }
    }
  });

  const type = MBTI_TYPES[typeKey];
  if (type) {
    const grd = pc.createRadialGradient(40, 40, 12, 40, 40, 42);
    grd.addColorStop(0, "transparent");
    grd.addColorStop(1, type.color + "50");
    pc.fillStyle = grd;
    pc.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function persistMBTI(typeKey) {
  try {
    const hist = JSON.parse(localStorage.getItem("starcont_mbti") || "[]");
    hist.push(typeKey);
    if (hist.length > 10) hist.shift();
    localStorage.setItem("starcont_mbti", JSON.stringify(hist));
  } catch(e) {}
}

function getMBTIHistory() {
  try { return JSON.parse(localStorage.getItem("starcont_mbti") || "[]"); }
  catch(e) { return []; }
}

function showDeathCard() {
  const typeKey = deriveMBTI();
  const type    = MBTI_TYPES[typeKey] || MBTI_TYPES.ENTP;
  persistMBTI(typeKey);
  const history = getMBTIHistory();

  const overlay = document.getElementById("deathCard");
  const card    = overlay.querySelector(".dc-card");

  // Tint card border + glow to personality color
  card.style.borderColor  = type.color + "80";
  card.style.boxShadow    = `0 0 48px ${type.color}28, inset 0 0 80px rgba(0,0,0,0.6)`;

  // Portrait
  drawDcPortrait(document.getElementById("dcPortrait"), typeKey);

  // Header
  const codeEl = document.getElementById("dcCode");
  codeEl.textContent    = typeKey;
  codeEl.style.color    = type.color;
  codeEl.style.textShadow = `0 0 20px ${type.color}`;
  document.getElementById("dcName").textContent  = type.name;
  document.getElementById("dcQuote").textContent = `"${type.quote}"`;

  // Tags
  document.getElementById("dcTags").innerHTML =
    type.tags.map(t => `<span class="dc-tag">${t}</span>`).join("");

  // Stats
  const ev = state.evolution;
  const p  = state.player;
  const tr = state.tracker;
  document.getElementById("dcStats").innerHTML = [
    { l:"存活时间", v: formatTime(state.time) },
    { l:"击杀数",   v: state.kills },
    { l:"回合数",   v: state.round },
    { l:"冲刺次数", v: tr.dashCount },
    { l:"暴击率",   v: Math.round(p.crit) + "%" },
    { l:"变异流派", v: BUILD_TYPES[ev.dominant]?.label || "无" },
  ].map(s =>
    `<div class="dc-stat">
       <div class="dc-stat-label">${s.l}</div>
       <div class="dc-stat-value" style="color:${type.color}">${s.v}</div>
     </div>`
  ).join("");

  // AI logs — staggered reveal
  const logsEl = document.getElementById("dcAiLogs");
  logsEl.innerHTML = type.ai_logs
    .map(t => `<div class="dc-ai-log-line">${t}</div>`)
    .join("");
  Array.from(logsEl.children).forEach((div, i) => {
    setTimeout(() => div.classList.add("visible"), 700 + i * 620);
  });

  // Recommend build
  document.getElementById("dcRecommend").innerHTML =
    `推荐 Build：<strong>${type.build}</strong>`;

  // History (cross-session)
  const histEl = document.getElementById("dcHistory");
  if (history.length > 1) {
    const prev = history.slice(0, -1)
      .map(k => `<span style="color:${MBTI_TYPES[k]?.color||'#666'}">${k}</span>`)
      .join('<span style="color:#2a1840"> → </span>');
    const cur = `<span class="dc-history-current" style="color:${type.color}">[${typeKey}]</span>`;
    histEl.innerHTML = `历史人格：${prev}<span style="color:#2a1840"> → </span>${cur}`;
  } else {
    histEl.innerHTML = `<span style="color:#3a2860">首次档案已写入系统。</span>`;
  }

  overlay.classList.add("show");
}

// ─── Gamified AI Enemy Interaction System ────────────────

function initSituation() {
  return {
    tactic: "neutral",       // current tactic label
    tacticTimer: 0,          // cooldown before re-analyzing
    tacticLock: 0,           // lock duration for current tactic
    coordTimer: 0,           // coordination chatter cooldown
    threatLevel: 0,          // 0-5 (maps to F/D/C/B/A/S)
    threatShown: -1,         // last threatLevel shown to player
    killStreak: 0,           // kills in last 5s window
    killStreakTimer: 0,
    secondProtocol: false,   // boss escalation triggered
    spawnBias: null,         // override for spawnDirector: { kind, weight }
    bossEscTimer: 0,
  };
}

const TACTIC_DIALOGUE = {
  pursue:       ["血量见底了！追！", "给我冲！别让它喘息！", "包围它！", "机会来了！"],
  purify:       ["腐化污染？净化协议启动！", "感染体清除中...", "别让它传播！", "隔离目标！"],
  surround:     ["盾甲突破！改变战术！", "分散攻击，找薄弱点！", "包抄！", "两翼夹击！"],
  rapid_counter:["速度流...已记录", "反制快速攻击模式", "节奏已掌握，等待失误", "过快了——调整频率"],
  second_proto: ["启动第二协议", "强化覆盖完毕", "进入镇压模式", "不计代价——消灭"],
};
const COORD_MELEE = ["你压制，我绕后！", "掩护我！", "换位！", "它要滚了——卡住！"];
const COORD_ARCHER= ["我从远处牵制！", "注意，有宠物！", "集火！", "不要站在一起！"];

function addEnemySpeech(enemy, text, role) {
  if (!state.enemySpeeches) state.enemySpeeches = [];
  // remove any existing bubble for this enemy
  state.enemySpeeches = state.enemySpeeches.filter(s => s.enemy !== enemy);
  state.enemySpeeches.push({ enemy, text, role: role || "normal", life: 1.0, age: 0 });
}

function updateEnemySpeeches(dt) {
  if (!state.enemySpeeches) return;
  const DURATION = 2.2;
  for (let i = state.enemySpeeches.length - 1; i >= 0; i--) {
    const s = state.enemySpeeches[i];
    s.age += dt;
    s.life = Math.max(0, 1 - s.age / DURATION);
    if (s.life <= 0 || !state.enemies.includes(s.enemy)) {
      state.enemySpeeches.splice(i, 1);
    }
  }
}

function drawEnemySpeeches() {
  if (!state.enemySpeeches || !state.enemySpeeches.length) return;
  ctx.save();
  ctx.font = "bold 13px 'Microsoft YaHei', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const s of state.enemySpeeches) {
    const e = s.enemy;
    const rise = s.age * 18;
    const bx = e.x;
    const by = e.y - e.r - 22 - rise;
    const alpha = Math.min(1, s.life * 3);
    const tw = ctx.measureText(s.text).width;
    const pad = 9;
    const bw = tw + pad * 2;
    const bh = 22;
    const roleColor = s.role === "boss" ? "#ff50a0" : s.role === "elite" ? "#b060ff" : "#44ccff";
    ctx.globalAlpha = alpha;
    // pill background
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.beginPath();
    ctx.roundRect(bx - bw/2, by - bh/2, bw, bh, bh/2);
    ctx.fill();
    // colored border
    ctx.strokeStyle = roleColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // text
    ctx.fillStyle = "#f0eeff";
    ctx.fillText(s.text, bx, by);
    // tiny tail
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.beginPath();
    ctx.moveTo(bx - 5, by + bh/2 - 1);
    ctx.lineTo(bx + 5, by + bh/2 - 1);
    ctx.lineTo(bx, by + bh/2 + 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function triggerTacticSpeech(tactic) {
  const lines = TACTIC_DIALOGUE[tactic];
  if (!lines || !state.enemies.length) return;
  const pool = [...state.enemies].sort(() => Math.random() - 0.5).slice(0, 4);
  pool.forEach((e, i) => {
    window.setTimeout(() => {
      if (state.enemies.includes(e)) {
        addEnemySpeech(e, lines[i % lines.length], e.kind);
      }
    }, i * 420);
  });
}

function getThreatRating(level) {
  return ["F", "D", "C", "B", "A", "S"][Math.min(5, level)];
}

function showThreatProfile() {
  const sit = state.situation;
  const p = state.player;
  const tl = sit.threatLevel;
  const rating = getThreatRating(tl);
  const colors = ["#aaaaaa","#88cc44","#44ccff","#b060ff","#ff8820","#ff50a0"];
  const col = colors[tl] || "#aaaaaa";
  const cx = canvas.clientWidth / 2;

  window.setTimeout(() => floatText(cx, 160, `[ 行为分析完成 ]`, "#8899bb"), 0);
  window.setTimeout(() => {
    const traits = [];
    const tr = state.tracker;
    if (tr.isDasher)       traits.push("闪避型");
    if (tr.isRapidFire)    traits.push("速攻型");
    if (tr.isTank)         traits.push("耐久型");
    if (tr.isInfect)       traits.push("感染型");
    if (tr.isLowHpFighter) traits.push("险境型");
    const traitStr = traits.length ? traits.join(" · ") : "未知";
    floatText(cx, 188, traitStr, "#ccddff");
  }, 520);
  window.setTimeout(() => floatText(cx, 216, `威胁评级：${rating} 级`, col), 1050);
  if (tl >= 5) {
    window.setTimeout(() => floatText(cx, 242, "禁忌档案已解锁", "#ff50a0"), 1600);
  }
}

function triggerBossEscalation(boss) {
  const sit = state.situation;
  if (sit.secondProtocol) return;
  sit.secondProtocol = true;
  // Boost boss
  boss.speed  = (boss.speed || 80)  * 1.35;
  boss.damage = (boss.damage || 20) * 1.50;
  boss.hp     = Math.min(boss.hp + boss.maxHp * 0.25, boss.maxHp * 1.25);
  boss.escalated = true;
  addEnemySpeech(boss, "启动第二协议", "boss");
  window.setTimeout(() => {
    if (state.enemies.includes(boss)) addEnemySpeech(boss, "进入镇压模式", "boss");
  }, 1200);
  floatText(canvas.clientWidth/2, 140, "★ 第二协议启动 ★", "#ff50a0");
  burst(boss.x, boss.y, "#ff50a0", 60);
  // Nearby enemies also react
  const allies = state.enemies.filter(e => e !== boss && e.kind !== "boss").slice(0, 3);
  allies.forEach((e, i) => {
    window.setTimeout(() => {
      if (state.enemies.includes(e)) {
        addEnemySpeech(e, TACTIC_DIALOGUE.second_proto[i % 4], e.kind);
        e.speed = (e.speed || 80) * 1.2;
      }
    }, i * 300 + 600);
  });
}

function analyzeSituation(dt) {
  if (!state.running || !state.situation) return;
  const sit = state.situation;
  sit.tacticTimer  -= dt;
  sit.tacticLock   -= dt;
  sit.coordTimer   -= dt;
  sit.killStreakTimer -= dt;
  sit.bossEscTimer -= dt;
  if (sit.killStreakTimer <= 0) { sit.killStreak = 0; sit.killStreakTimer = 5; }

  // Update threat level based on round + tracker flags
  const tr = state.tracker;
  let tl = Math.floor(state.round / 3);
  if (tr.isDasher)       tl++;
  if (tr.isRapidFire)    tl++;
  if (tr.isTank)         tl++;
  if (tr.isInfect)       tl++;
  if (tr.isLowHpFighter) tl++;
  sit.threatLevel = Math.min(5, tl);

  // Show threat profile when it increases (at most once per tier)
  if (sit.threatLevel > sit.threatShown && sit.threatLevel > 0 && state.roundTime > 5) {
    sit.threatShown = sit.threatLevel;
    showThreatProfile();
  }

  // Boss escalation check
  if (sit.bossEscTimer <= 0 && sit.threatLevel >= 4) {
    const boss = state.enemies.find(e => e.kind === "boss");
    if (boss && !sit.secondProtocol) {
      triggerBossEscalation(boss);
      sit.bossEscTimer = 999;
    }
  }

  // Tactic analysis (every ~3.5s, not locked)
  if (sit.tacticTimer > 0 || sit.tacticLock > 0) return;
  sit.tacticTimer = 3.5 + Math.random() * 1.5;

  const p = state.player;
  let newTactic = null;

  if (p.hp < p.maxHp * 0.28) {
    newTactic = "pursue";
    sit.spawnBias = { kind: "normal", weight: 0.7 };
  } else if (tr.isInfect && state.kills > 10) {
    newTactic = "purify";
    sit.spawnBias = { kind: "elite", weight: 0.5 };
  } else if (tr.isTank && p.shield > 0) {
    newTactic = "surround";
    sit.spawnBias = { kind: "archer", weight: 0.65 };
  } else if (tr.isRapidFire || tr.isDasher) {
    newTactic = "rapid_counter";
    sit.spawnBias = { kind: "archer", weight: 0.55 };
  }

  if (newTactic && newTactic !== sit.tactic) {
    sit.tactic = newTactic;
    sit.tacticLock = 7;
    triggerTacticSpeech(newTactic);
  } else if (!newTactic) {
    sit.tactic = "neutral";
    sit.spawnBias = null;
  }
}

function updateCoordination(dt) {
  if (!state.running || !state.situation) return;
  const sit = state.situation;
  if (sit.coordTimer > 0) return;
  sit.coordTimer = 6 + Math.random() * 4;

  const melees  = state.enemies.filter(e => e.kind === "normal" || e.kind === "elite");
  const archers = state.enemies.filter(e => e.kind === "archer");
  if (!melees.length || !archers.length) return;

  const m = melees[Math.floor(Math.random() * melees.length)];
  const a = archers[Math.floor(Math.random() * archers.length)];
  addEnemySpeech(m, COORD_MELEE[Math.floor(Math.random() * COORD_MELEE.length)], m.kind);
  window.setTimeout(() => {
    if (state.enemies.includes(a)) {
      addEnemySpeech(a, COORD_ARCHER[Math.floor(Math.random() * COORD_ARCHER.length)], a.kind);
    }
  }, 600);
}

// ═══════════════════════════════════════════════════════════
//  STAGE PARTNER — 艾拉（Ella）
// ═══════════════════════════════════════════════════════════

function initPartner() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  return {
    name:    '艾拉',
    x: w * 0.45, y: h * 0.52,
    z: 0, r: 18,
    hp: 80, maxHp: 80,
    invuln: 0,
    speed:   210,
    damage:  0,           // set from player each round start
    attackCd: 0,
    attackRate: 1.1,      // fire every 1.1s
    facing:  1,
    anim: { name: 'Idle', frame: 0, timer: 0, fps: 8 },
    downed: false,        // knocked out
    downedTimer: 0,
    reviveTimer: 8,       // auto-revives after 8s
    slashFx: 0,           // attack flash
    talkCd: rand(8, 14),  // periodic battle chatter
  };
}

function _partnerNearestEnemy() {
  const pt = state.partner;
  let best = null, bestD = Infinity;
  for (const e of state.enemies) {
    const d = distance(pt, e);
    if (d < bestD) { bestD = d; best = e; }
  }
  return bestD < 500 ? best : null;
}

function updatePartner(dt) {
  const pt = state.partner;
  if (!pt) return;
  const p  = state.player;
  const w  = canvas.clientWidth, h = canvas.clientHeight;

  // Scale partner damage with player (60% of player's current damage)
  pt.damage = Math.max(8, Math.round(p.damage * 0.6));

  pt.invuln -= dt;
  pt.attackCd -= dt;
  pt.slashFx  -= dt;

  // ── Downed state ───────────────────────────────────────────
  if (pt.downed) {
    pt.downedTimer += dt;
    if (pt.downedTimer >= pt.reviveTimer) {
      pt.downed      = false;
      pt.downedTimer = 0;
      pt.hp          = Math.round(pt.maxHp * 0.4);
      floatText(pt.x, pt.y - 60, '艾拉复活！', '#80ffb0');
    }
    // Slowly crawl toward player when downed
    const ddx = p.x - pt.x, ddy = p.y - pt.y;
    const dd  = Math.hypot(ddx, ddy) || 1;
    pt.x += (ddx / dd) * 40 * dt;
    pt.y += (ddy / dd) * 40 * dt;
    _animPartner('Idle', dt, 4);
    return;
  }

  // ── Find target ────────────────────────────────────────────
  const tgt = _partnerNearestEnemy();

  // ── Movement ───────────────────────────────────────────────
  let moveX = 0, moveY = 0;
  if (tgt) {
    const dist = distance(pt, tgt);
    const prefDist = 160; // preferred attack distance
    if (dist > prefDist + 20) {
      // Move toward enemy
      const ang = Math.atan2(tgt.y - pt.y, tgt.x - pt.x);
      moveX = Math.cos(ang); moveY = Math.sin(ang);
    } else if (dist < prefDist - 30) {
      // Back off
      const ang = Math.atan2(pt.y - tgt.y, pt.x - tgt.x);
      moveX = Math.cos(ang) * 0.5; moveY = Math.sin(ang) * 0.5;
    }
  } else {
    // No enemies → drift toward player (stay within 140px)
    const dx = p.x - pt.x, dy = p.y - pt.y;
    const d  = Math.hypot(dx, dy) || 1;
    if (d > 140) { moveX = dx / d; moveY = dy / d; }
  }

  if (moveX !== 0 || moveY !== 0) {
    const nx = pt.x + moveX * pt.speed * dt;
    const ny = pt.y + moveY * pt.speed * dt;
    if (nx > pt.r && nx < w - pt.r) pt.x = nx;
    if (ny > pt.r && ny < h - pt.r) pt.y = ny;
    pt.facing = moveX > 0 ? 1 : moveX < 0 ? -1 : pt.facing;
    pt.z = terrainHeightAt(pt.x, pt.y);
    _animPartner('Walk', dt, 10);
  } else {
    _animPartner('Idle', dt, 6);
  }

  // ── Attack ─────────────────────────────────────────────────
  if (tgt && pt.attackCd <= 0) {
    pt.attackCd = pt.attackRate;
    pt.slashFx  = 0.3;
    _animPartner('Attack1', dt, 10);
    const ang = Math.atan2(tgt.y - pt.y, tgt.x - pt.x);
    const spd = 480;
    state.partnerBullets.push({
      x: pt.x, y: pt.y - 14, z: 12,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      r: 5, life: 1.2, damage: pt.damage,
      color: '#60ffcc'
    });
  }

  // ── Periodic chatter ───────────────────────────────────────
  pt.talkCd -= dt;
  if (pt.talkCd <= 0) {
    pt.talkCd = rand(10, 18);
    const quips = [
      '放开我的同伴！', '这边！', '看我的！',
      '别让他们包围！', '小心背后！', '交给我！'
    ];
    floatText(pt.x, pt.y - 55, quips[Math.floor(Math.random() * quips.length)], '#a0ffe0');
  }
}

function _animPartner(name, dt, fps) {
  const pt = state.partner;
  if (!pt) return;
  if (pt.anim.name !== name && name === 'Attack1' && pt.slashFx > 0) {
    pt.anim.name = name; pt.anim.frame = 0; pt.anim.timer = 0;
  } else if (pt.anim.name !== name && name !== 'Attack1') {
    pt.anim.name = name; pt.anim.frame = 0; pt.anim.timer = 0;
  }
  pt.anim.timer += dt;
  const def = SPRITE_DEFS.heroine;
  const frameCount = def?.frames[name] || 4;
  if (pt.anim.timer >= 1 / fps) {
    pt.anim.timer = 0;
    pt.anim.frame = (pt.anim.frame + 1) % frameCount;
  }
}

function updatePartnerBullets(dt) {
  const bullets = state.partnerBullets;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) { bullets.splice(i, 1); continue; }
    // Hit enemies
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (distance(b, e) < e.r + b.r) {
        e.hp -= b.damage;
        e.invuln = (e.invuln || 0) + 0.12;
        burst(b.x, b.y, '#60ffcc', 5);
        floatText(e.x, e.y - e.r - 12, Math.round(b.damage), '#60ffcc');
        bullets.splice(i, 1);
        hit = true;
        if (e.hp <= 0) { killEnemy(e, j); }
        break;
      }
    }
  }
}

function partnerTakeDamage(dmg) {
  const pt = state.partner;
  if (!pt || pt.downed || pt.invuln > 0) return;
  const actual = Math.round(dmg * 0.55); // partner has some damage resist
  pt.hp -= actual;
  pt.invuln = 0.4;
  if (actual > 0) floatText(pt.x, pt.y - 44, `-${actual}`, '#ff8060');
  burst(pt.x, pt.y, '#ff6040', 6);
  if (pt.hp <= 0) {
    pt.hp = 0;
    pt.downed = true;
    pt.downedTimer = 0;
    floatText(pt.x, pt.y - 64, '艾拉倒下了！', '#ff4040');
    burst(pt.x, pt.y, '#ff2020', 18);
  }
}

function drawPartner() {
  const pt = state.partner;
  if (!pt) return;
  const z   = terrainHeightAt(pt.x, pt.y);
  const sy  = pt.y - z;
  const a   = pt.downed ? 0.45 : (pt.invuln > 0 ? 0.55 + Math.sin(pt.invuln * 40) * 0.45 : 1);

  ctx.save();
  ctx.globalAlpha = a;
  drawPixelShadow(pt.x, pt.y + 10, 22, 8, 0.22);
  ctx.translate(Math.round(pt.x), Math.round(sy));
  ctx.imageSmoothingEnabled = false;

  const animName = pt.downed ? 'Idle' : pt.anim.name;
  const flipX    = pt.facing < 0;
  const drawn    = spritesReady && drawSprite('heroine', animName, pt.anim.frame, 0, 12, 90, flipX, 1);

  if (!drawn) {
    // Pixel art fallback — small heroine silhouette
    ctx.fillStyle = '#d04090';
    ctx.fillRect(-8, -36, 16, 24);
    ctx.fillRect(-6, -12, 12, 16);
    ctx.beginPath(); ctx.arc(0, -42, 9, 0, Math.PI*2);
    ctx.fillStyle = '#f08080'; ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // Attack slash FX
  if (pt.slashFx > 0) {
    ctx.save();
    ctx.globalAlpha = pt.slashFx / 0.3;
    ctx.strokeStyle = '#80ffcc'; ctx.lineWidth = 2;
    ctx.beginPath();
    const fx = pt.x + pt.facing * 24, fy = sy - 10;
    ctx.moveTo(fx - 12, fy - 12); ctx.lineTo(fx + 12, fy + 12);
    ctx.moveTo(fx + 12, fy - 12); ctx.lineTo(fx - 12, fy + 12);
    ctx.stroke();
    ctx.restore();
  }

  // HP bar
  const bw = 44, bh = 5;
  const bx  = pt.x - bw / 2, by = sy - 64;
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  const pct = Math.max(0, pt.hp / pt.maxHp);
  const hpColor = pct > 0.5 ? '#50e080' : pct > 0.25 ? '#e0c030' : '#e03030';
  ctx.fillStyle = hpColor;
  ctx.fillRect(bx, by, bw * pct, bh);

  // Name tag
  ctx.font = '700 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = pt.downed ? '#ff6060' : '#a0ffe0';
  ctx.fillText(pt.downed ? `艾拉 （倒地 ${Math.ceil(pt.reviveTimer - pt.downedTimer)}s）` : '艾拉', pt.x, sy - 72);

  // Partner bullets
  for (const b of state.partnerBullets) {
    const bz = terrainHeightAt(b.x, b.y);
    const bsy = b.y - bz - (b.z || 0);
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.life * 2.5);
    ctx.fillStyle = b.color || '#60ffcc';
    ctx.shadowColor = b.color || '#60ffcc'; ctx.shadowBlur = 6;
    ctx.beginPath();
    // Arrow shape
    const bAng = Math.atan2(b.vy, b.vx);
    ctx.translate(b.x, bsy);
    ctx.rotate(bAng);
    ctx.fillRect(-9, -2, 12, 4);
    ctx.beginPath(); ctx.moveTo(3, -4); ctx.lineTo(9, 0); ctx.lineTo(3, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// ─── AI Hunter ────────────────────────────────────────────

function initHunterTracker() {
  return {
    dashCount: 0,     // total roll presses
    fireRateTicks: 0, // frames with rapid fire active
    dogKills: 0,      // kills credited to dog
    lowHpFrames: 0,   // frames spent below 25% HP
    playerKills: 0,   // total player kills
    // derived flags
    isDasher: false,
    isRapidFire: false,
    isTank: false,
    isInfect: false,
    isLowHpFighter: false,
  };
}

function initHunter() {
  return {
    active: false, inCombat: false, spawnedThisRound: false,
    phase: 0,
    x: -600, y: -600, z: 0, r: 26,
    hp: 0, maxHp: 0,
    speed: 130, damage: 10,
    attackCd: 0, dashCd: 0, shootCd: 0, invuln: 0, wobble: 0,
    // Observer
    observeTimer: 0, observeDur: 5.0,
    hiddenTimer: 10.0,
    alpha: 0,
    // Learned
    learnedDash: false, learnedShield: false,
    learnedInfect: false, learnedRanged: false,
    mirrorSpeed: 1.0,
    // Counter
    counterLowHp: false, counterKite: false, counterDash: false,
    // Visual
    corruption: 0, extraEyes: 0, glitchT: 0,
    mirrorColor: "#cc1010", mirrorDark: "#440008",
    mirrorPet: false,
    // Stats
    timesKilled: 0, totalObs: 0,
  };
}

function hunterGetPhase() {
  const r = state.round;
  if (r >= 16) return 4;
  if (r >= 10) return 3;
  if (r >= 3)  return 2;  // combat from round 3
  if (r >= 2)  return 1;  // observer round 2
  return 0;               // no hunter round 1
}

function trackPlayer(dt) {
  if (!state.running || paused || !state.tracker) return;
  const p = state.player;
  const tr = state.tracker;
  const ev = state.evolution;

  if (state.dog) tr.dogKills = state.dog.kills;
  if (p.hp / p.maxHp < 0.25) tr.lowHpFrames++;
  if (p.fireRate < 0.42 || ev.dominant === "speed") tr.fireRateTicks++;

  tr.isDasher       = tr.dashCount > 22;
  tr.isRapidFire    = p.fireRate < 0.42 || ev.dominant === "speed";
  tr.isTank         = ev.dominant === "tank" || (p.traits.damageReduction || 0) > 0.3;
  tr.isInfect       = ev.dominant === "corrupt" || tr.dogKills > 8;
  tr.isLowHpFighter = tr.lowHpFrames > 500;
}

function updateHunterAdaptation() {
  const h = state.hunter;
  const p = state.player;
  const tr = state.tracker;
  const phase = h.phase;

  h.mirrorSpeed = 0.45 + phase * 0.07;  // was 0.65+0.10, slower
  h.speed  = Math.max(80, p.speed * h.mirrorSpeed);
  h.damage = Math.round(p.damage * (0.22 + phase * 0.07)); // was 0.38+0.10, softer

  if (phase >= 2) {
    h.learnedDash    = tr.isDasher;
    h.learnedShield  = tr.isTank;
    h.learnedRanged  = tr.isRapidFire || tr.isInfect;
    h.learnedInfect  = tr.isInfect;
  }
  if (phase >= 3) {
    h.counterLowHp = tr.isLowHpFighter;
    h.counterDash  = tr.isDasher;
    h.counterKite  = tr.isRapidFire && !tr.isTank;
  }

  h.corruption  = Math.min(1, (phase - 1) / 3.0);
  h.extraEyes   = [0, 0, 2, 4, 6][phase] || 0;
  h.mirrorPet   = phase >= 3 && !!(state.dog && state.dog.gear.length > 0);

  if (phase >= 3) {
    h.mirrorColor = p.classColor || "#cc1010";
    h.mirrorDark  = "#330008";
  }
}

function updateHunter(dt) {
  if (!state.running || paused || !state.hunter) return;
  const h = state.hunter;
  const newPhase = hunterGetPhase();
  if (newPhase !== h.phase) {
    h.phase = newPhase;
    updateHunterAdaptation();
  }
  if (h.phase === 0) return;

  h.glitchT += dt;
  h.wobble  += dt * 4;

  if (h.phase === 1) {
    updateHunterObserver(dt);
  } else {
    updateHunterCombat(dt);
  }
}

function updateHunterObserver(dt) {
  const h = state.hunter;
  const p = state.player;
  const w = canvas.clientWidth, ht = canvas.clientHeight;

  if (!h.active) {
    h.hiddenTimer -= dt;
    if (h.hiddenTimer <= 0) {
      const side = Math.floor(rand(0,4));
      h.x = [rand(w*0.2,w*0.8), w-20, rand(w*0.2,w*0.8), 20][side];
      h.y = [20, rand(ht*0.3,ht*0.7), ht-20, rand(ht*0.3,ht*0.7)][side];
      h.z = terrainHeightAt(h.x, h.y);
      h.active = true;
      h.observeTimer = 0;
      h.alpha = 0;
      h.totalObs++;
      if (h.totalObs === 1) floatText(p.x, p.y - 80, "你感到有什么东西在注视你…", "#aa0020");
    }
    return;
  }

  // Fade in/out
  if (h.observeTimer < 0.7) {
    h.alpha = Math.min(1, h.alpha + dt * 1.4);
  } else if (h.observeTimer > h.observeDur - 0.7) {
    h.alpha = Math.max(0, h.alpha - dt * 1.4);
    if (h.alpha <= 0) {
      h.active = false;
      h.hiddenTimer = 12 + rand(-2, 4);
      return;
    }
  }
  h.observeTimer += dt;

  // Glide toward player, stop at ~260px
  const dist = distance(p, h);
  if (dist > 270) {
    const ang = Math.atan2(p.y - h.y, p.x - h.x);
    h.x += Math.cos(ang) * 50 * dt;
    h.y += Math.sin(ang) * 50 * dt;
  }
  settleOnTerrain(h, dt, 5);
}

function updateHunterCombat(dt) {
  const h = state.hunter;
  const p = state.player;
  const w = canvas.clientWidth, ht = canvas.clientHeight;

  // Spawn mid-round (not on boss rounds)
  if (!h.spawnedThisRound && state.roundTime >= 12 && state.round % state.shopEvery !== 0) {
    h.spawnedThisRound = true;
    h.inCombat = true;
    h.active   = true;
    const side = Math.floor(rand(0,4));
    h.x = [rand(w*0.25,w*0.75), w-24, rand(w*0.25,w*0.75), 24][side];
    h.y = [24, rand(ht*0.25,ht*0.75), ht-24, rand(ht*0.25,ht*0.75)][side];
    h.z = terrainHeightAt(h.x, h.y);
    h.alpha = 1;

    const phaseHp = [1, 1, 1.2, 1.5, 1.9][h.phase] || 1;  // was 1/1/1.4/1.9/2.5
    h.maxHp = (100 + state.round * 30) * phaseHp;          // was 150 + round*55
    h.hp    = h.maxHp;

    const msgs = ["","","模仿者降临！", "镜像体降临！", "完全镜像降临！"];
    if (msgs[h.phase]) floatText(w/2, 100, msgs[h.phase], "#ff2020");
    burst(h.x, h.y, "#ff2020", 28);
    updateHunterAdaptation();
  }

  if (!h.inCombat) return;

  h.attackCd -= dt; h.dashCd -= dt;
  h.shootCd  -= dt; h.invuln -= dt;
  const dist  = distance(p, h);
  const angle = Math.atan2(p.y - h.y, p.x - h.x);

  // Movement
  if (h.counterLowHp && p.hp / p.maxHp < 0.28) {
    // Cut off retreat toward nearest edge
    const ex = p.x < w/2 ? 30 : w-30;
    const ey = p.y < ht/2 ? 30 : ht-30;
    const ba = Math.atan2((p.y+ey)/2 - h.y, (p.x+ex)/2 - h.x);
    h.x += Math.cos(ba) * h.speed * 1.6 * dt;
    h.y += Math.sin(ba) * h.speed * 1.6 * dt;
  } else if (h.learnedRanged && dist > 190) {
    h.x += Math.cos(angle) * h.speed * 0.85 * dt;
    h.y += Math.sin(angle) * h.speed * 0.85 * dt;
  } else if (dist > 55) {
    h.x += Math.cos(angle) * h.speed * dt;
    h.y += Math.sin(angle) * h.speed * dt;
  }
  h.x = Math.max(28, Math.min(w-28, h.x));
  h.y = Math.max(60, Math.min(ht-28, h.y));
  settleOnTerrain(h, dt, 7);

  // Dash
  if (h.learnedDash && h.dashCd <= 0 && dist > 200) {
    h.dashCd = 2.8 + rand(0, 1.2);
    h.x += Math.cos(angle) * 140;
    h.y += Math.sin(angle) * 140;
    burst(h.x, h.y, h.mirrorColor, 10);
  }

  // Melee
  if (dist < p.r + h.r + 8 && h.attackCd <= 0) {
    h.attackCd = 0.85;
    if (p.invuln <= 0) {
      const dmg = h.learnedShield ? Math.round(h.damage * 1.3) : h.damage;
      p.hp -= dmg;
      p.invuln = 0.35;
      floatText(p.x, p.y - 54, `-${dmg}`, "#ff2030");
      burst(p.x, p.y, "#ff2030", 7);
    }
  }

  // Ranged
  if (h.learnedRanged && h.shootCd <= 0 && dist < 440) {
    h.shootCd = h.phase >= 3 ? 1.3 : 1.9;
    const jitter = h.counterKite ? 20 : 55; // more accurate when countering kite
    const bAng = Math.atan2(
      p.y + rand(-jitter, jitter) - h.y,
      p.x + rand(-jitter, jitter) - h.x
    );
    const spd = 145 + h.phase * 18;
    state.enemyBullets.push({
      x: h.x, y: h.y - 12,
      vx: Math.cos(bAng)*spd, vy: Math.sin(bAng)*spd,
      r: 6, life: 1.6,
      damage: Math.round(h.damage * 0.65),
      hunterBullet: true
    });
  }

  // Infect nearby enemy (chain build mirror)
  if (h.learnedInfect && Math.random() < 0.003) {
    const nearby = state.enemies.find(e => !e.hunterInfected && !e.infected && distance(e, h) < 180);
    if (nearby) {
      nearby.hunterInfected = true;
      nearby.speed *= 1.25;
      floatText(nearby.x, nearby.y - 20, "猎手腐化！", "#aa00ff");
    }
  }

  if (h.hp <= 0) killHunter();
}

function killHunter() {
  const h = state.hunter;
  h.inCombat = false;
  h.active   = false;
  h.timesKilled++;
  const gold = 55 + state.round * 10;
  state.coins += gold;
  state.player.xp = (state.player.xp || 0) + 18;
  burst(h.x, h.y, "#ff2020", 55);
  burst(h.x, h.y, h.mirrorColor, 35);
  floatText(h.x, h.y - 44, `猎手已击杀！ +${gold}金币`, "#ffd45c");
  h.x = -600; h.y = -600;
}

function drawHunter() {
  const h = state.hunter;
  if (!h || h.phase === 0) return;
  if (!h.active && !h.inCombat) return;
  const a = h.inCombat ? 1 : h.alpha;
  if (a < 0.02) return;

  const sx = h.x, sy2 = h.y - (h.z || 0);
  const t  = h.glitchT;
  const phase = h.phase;
  const glitch = (phase >= 3 && Math.sin(t * 14.7) > 0.88) ? rand(-5, 5) : 0;
  const gx = sx + glitch;
  const gy = sy2 + (phase >= 4 && Math.sin(t * 19.3) > 0.9 ? rand(-3, 3) : 0);

  ctx.save();
  ctx.globalAlpha = a;

  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath(); ctx.ellipse(sx, sy2+20, 18, 7, 0, 0, Math.PI*2); ctx.fill();

  if (phase === 1) {
    // ── OBSERVER: smoke silhouette ──────────────────────────
    ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 0;
    ctx.globalAlpha = a * 0.65;
    ctx.fillStyle = "#0a0008";
    ctx.beginPath(); ctx.ellipse(gx+2, gy+3, 20, 28, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#110010";
    ctx.beginPath(); ctx.ellipse(gx, gy, 16, 24, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx-1, gy-26, 11, 11, 0, 0, Math.PI*2); ctx.fill();
    // Red eyes
    ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff1010";
    ctx.beginPath(); ctx.arc(gx-5, gy-27, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx+5, gy-27, 3, 0, Math.PI*2); ctx.fill();
    // Smoke wisps
    for (let i = 0; i < 4; i++) {
      const ang = t * 0.7 + i * Math.PI*0.5;
      ctx.globalAlpha = a * 0.28;
      ctx.fillStyle = "#330020";
      ctx.beginPath();
      ctx.arc(gx + Math.cos(ang)*(13+Math.sin(t+i)*5),
              gy + Math.sin(ang)*(17+Math.sin(t*1.2+i)*4),
              5+i, 0, Math.PI*2);
      ctx.fill();
    }

  } else if (phase === 2) {
    // ── MIMIC: dark humanoid ────────────────────────────────
    ctx.shadowColor = h.mirrorColor; ctx.shadowBlur = 0;
    ctx.fillStyle = "#180014";
    ctx.fillRect(gx-7, gy+6, 6, 14); // legs
    ctx.fillRect(gx+2, gy+6, 6, 14);
    ctx.beginPath(); ctx.ellipse(gx, gy, 13, 20, 0, 0, Math.PI*2); ctx.fill(); // body
    ctx.fillStyle = h.mirrorColor + "30";
    ctx.beginPath(); ctx.ellipse(gx, gy, 8, 13, 0, 0, Math.PI*2); ctx.fill(); // inner glow
    ctx.fillStyle = "#180014";
    ctx.fillRect(gx-19, gy-8, 6, 15); // arms
    ctx.fillRect(gx+13, gy-8, 6, 15);
    ctx.beginPath(); ctx.ellipse(gx, gy-22, 12, 12, 0, 0, Math.PI*2); ctx.fill(); // head
    // 3 eyes
    ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff1010";
    for (const [ex, ey] of [[-6,gy-23],[6,gy-23],[0,gy-29]]) {
      ctx.beginPath(); ctx.arc(gx+ex, ey, 2.5, 0, Math.PI*2); ctx.fill();
    }

  } else {
    // ── MIRROR / FULL MIRROR ────────────────────────────────
    if (phase >= 4) {
      ctx.save();
      ctx.globalAlpha = a * (0.22 + Math.sin(t*3)*0.08);
      ctx.fillStyle = "#200040";
      ctx.beginPath(); ctx.arc(gx, gy, 40, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    ctx.shadowColor = h.mirrorColor; ctx.shadowBlur = 0;
    const lw = Math.sin(t*7)*2;
    ctx.fillStyle = h.mirrorDark;
    ctx.fillRect(gx-8+lw, gy+6, 7, 14); // legs
    ctx.fillRect(gx+2-lw, gy+6, 7, 14);
    const bd = phase >= 4 ? Math.sin(t*12)*0.18 : 0;
    ctx.beginPath(); ctx.ellipse(gx, gy, 14, 22, bd, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = h.mirrorColor + "bb";
    ctx.beginPath(); ctx.ellipse(gx-1, gy-1, 10, 17, 0, 0, Math.PI*2); ctx.fill();

    // Corruption splotches
    ctx.fillStyle = "#00000077";
    for (let i = 0; i < Math.floor(h.corruption * 5); i++) {
      ctx.beginPath();
      ctx.ellipse(gx+Math.sin(i*2.1)*9, gy+Math.cos(i*1.7)*12, 4+i, 3+i, i*0.5, 0, Math.PI*2);
      ctx.fill();
    }

    // Arms (phase 4: elongated)
    ctx.fillStyle = h.mirrorDark;
    ctx.fillRect(gx-20, gy-10, 7, phase>=4?22:16);
    ctx.fillRect(gx+14, gy-10, 7, phase>=4?22:16);

    // Head
    const hd = phase >= 4 ? 1.15 + Math.sin(t*8)*0.07 : 1;
    ctx.fillStyle = h.mirrorDark;
    ctx.beginPath(); ctx.ellipse(gx, gy-23, 13*hd, 13, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = h.mirrorColor + "99";
    ctx.beginPath(); ctx.ellipse(gx-1, gy-24, 9, 9, 0, 0, Math.PI*2); ctx.fill();

    // Multiple eyes
    const eyePos = [
      [gx-6,gy-24],[gx+6,gy-24],
      [gx,gy-30],[gx-13,gy-20],[gx+13,gy-20],[gx,gy-17]
    ].slice(0, h.extraEyes);
    ctx.shadowColor = "#ff0010"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff0010";
    for (const [ex, ey] of eyePos) {
      ctx.globalAlpha = (phase>=4 && Math.abs(Math.sin(t*4+ex))>0.92) ? a*0.15 : a;
      ctx.beginPath(); ctx.arc(ex, ey, 2.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = a;

    // Phase 4: scan-line glitch
    if (phase >= 4) {
      ctx.save();
      ctx.globalAlpha = a * 0.14;
      ctx.fillStyle = "#ff0020";
      for (let sl = -32; sl < 32; sl += 4) {
        if (Math.sin(t*9 + sl*0.4) > 0.75) ctx.fillRect(gx-20, gy+sl, 40, 1.5);
      }
      ctx.restore();
    }

    // Dark pet orbiting (phase 3+)
    if (h.mirrorPet) {
      const pa = state.pet.angle * 1.4 + Math.PI;
      const px2 = gx + Math.cos(pa)*44, py2 = gy + Math.sin(pa)*22;
      ctx.save();
      ctx.globalAlpha = a * 0.72;
      ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 0;
      ctx.fillStyle = "#1a0010";
      ctx.beginPath(); ctx.ellipse(px2, py2, 10, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px2-8, py2-2, 5, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff0020";
      ctx.beginPath(); ctx.arc(px2-11, py2-3, 1.8, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  // ── Threat aura ring ──────────────────────────────────────
  if (h.inCombat) {
    const ring = 0.5 + Math.sin(t * 4) * 0.5;
    ctx.save();
    ctx.globalAlpha = a * (0.18 + ring * 0.22);
    const auraColor = phase >= 4 ? "#ff0030" : phase >= 3 ? "#cc0020" : "#880018";
    const auraGrd = ctx.createRadialGradient(gx, gy, h.r * 0.6, gx, gy, h.r * 2.2 + ring * 10);
    auraGrd.addColorStop(0, auraColor + "66");
    auraGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrd;
    ctx.beginPath(); ctx.arc(gx, gy, h.r * 2.2 + ring * 10, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── HP bar (combat only) ───────────────────────────────────
  if (h.inCombat && h.maxHp > 0) {
    const bw = 80, bh = 7;
    const pct = Math.max(0, h.hp / h.maxHp);
    const barY = sy2 - h.r - 18;
    // Phase name
    const phaseName = ["","🕵 观察者","👤 模仿者","🪞 镜像体","💀 完全镜像"][phase] || "";
    ctx.globalAlpha = a;
    ctx.font = "700 10px 'Microsoft YaHei', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(phaseName, sx+1, barY - 4);
    ctx.fillStyle = phase >= 4 ? "#ff4060" : phase >= 3 ? "#ee2040" : "#cc1030";
    ctx.fillText(phaseName, sx, barY - 5);
    // Bar background
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = "#100008";
    ctx.beginPath();
    ctx.roundRect(sx - bw/2 - 1, barY - 1, bw + 2, bh + 2, 3);
    ctx.fill();
    // HP fill gradient
    if (pct > 0) {
      const hpGrd = ctx.createLinearGradient(sx - bw/2, barY, sx + bw/2, barY);
      const c1 = phase >= 4 ? "#ff1030" : "#cc0020";
      const c2 = phase >= 3 ? "#ff5060" : "#ff2040";
      hpGrd.addColorStop(0, c1); hpGrd.addColorStop(1, c2);
      ctx.fillStyle = hpGrd;
      ctx.beginPath();
      ctx.roundRect(sx - bw/2, barY, bw * pct, bh, 2);
      ctx.fill();
    }
    // Bar border
    ctx.strokeStyle = phase >= 4 ? "#ff1020" : "#880010";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sx - bw/2 - 1, barY - 1, bw + 2, bh + 2, 3);
    ctx.stroke();
    // Danger flash when low HP
    if (pct < 0.3) {
      ctx.globalAlpha = a * (0.4 + Math.sin(t*6)*0.4);
      ctx.fillStyle = "#ff0030";
      ctx.font = "bold 11px monospace";
      ctx.fillText("⚠", sx + bw/2 + 8, barY + 6);
    }
  }

  ctx.restore();
}

function dogHas(id) { return state.dog && state.dog.gear.includes(id); }

function triggerDogKill(enemy) {
  const dog = state.dog;
  const p   = state.player;
  dog.kills++;

  if (dogHas("bone")) {
    p.hp = Math.min(p.maxHp, p.hp + 8);
    dog.soulPts.push({ x:enemy.x, y:enemy.y-20, vy:-45, alpha:1.0 });
    floatText(enemy.x, enemy.y - 28, "灵魂 +8", "#78f3ce");
  }

  if (dogHas("core")) {
    dog.scale = Math.min(2.2, 1.0 + dog.kills * 0.04);
  }

}

function updateDog(dt) {
  if (!state.running || !state.dog) return;
  const dog = state.dog;
  const p   = state.player;

  const dogX = p.x + Math.cos(state.pet.angle) * 54;
  const dogY = p.y + Math.sin(state.pet.angle) * 28;

  if (dogHas("collar") && dog.comboTimer > 0) {
    dog.comboTimer -= dt;
    if (dog.comboTimer <= 0) dog.comboCount = 0;
  }

  if (dogHas("collar") && dog.comboCount > 0) {
    dog.trailPts.unshift({ x:dogX, y:dogY, life:0.35 });
    if (dog.trailPts.length > 14) dog.trailPts.pop();
  }
  for (const pt of dog.trailPts) pt.life -= dt;
  dog.trailPts = dog.trailPts.filter(pt => pt.life > 0);

  for (const sp of dog.soulPts) { sp.y += sp.vy * dt; sp.alpha -= dt * 1.2; }
  dog.soulPts = dog.soulPts.filter(sp => sp.alpha > 0);

  if (dog.armorFlash > 0) dog.armorFlash -= dt * 2;

  if (dogHas("shoes")) {
    dog.teleportCd -= dt;
    if (dog.teleportFx > 0) dog.teleportFx -= dt * 3;
    if (dog.teleportCd <= 0) {
      const target = state.enemies
        .filter(e => !e.infected && distance({x:dogX,y:dogY}, e) < 320)
        .sort((a,b) => distance({x:dogX,y:dogY},a) - distance({x:dogX,y:dogY},b))[0];
      if (target) {
        dog.teleportCd = 3.5;
        dog.teleportFx = 1.0;
        const dmg = p.damage * 1.2 * (1 + dog.comboCount * 0.1);
        target.hp -= dmg;
        target.lastHitByDog = true;
        floatText(target.x, target.y - target.r - 20, Math.round(dmg), "#8844ff");
        burst(target.x, target.y, "#8844ff", 14);
        if (dogHas("collar")) { dog.comboCount = Math.min(8, dog.comboCount + 2); dog.comboTimer = 2.0; }
        if (dogHas("mask") && Math.random() < 0.25) { target.bleed = (target.bleed||0) + 3.0; }
      }
    }
  }

  dog.attackCd -= dt;
  // Phantom Hunt: dog attacks twice as fast + chains to second enemy
  const phantomSpeed = (dog._phantomTimer||0) > 0 ? 0.5 : 1.0;
  const baseRate = dogHas("collar") ? 1.5 / (1 + dog.comboCount * 0.14) * phantomSpeed : 1.5 * phantomSpeed;
  if (dog.attackCd <= 0) {
    // Corrupt Hunt: prefer corrupted enemies
    const corruptHunting = (dog._corruptHuntTimer||0) > 0;
    let nearby = state.enemies.filter(e => !e.infected && distance({x:dogX, y:dogY}, e) < 65 + dog.scale * 10);
    if (corruptHunting && nearby.length > 0) {
      // Try to find a corrupted enemy nearby first
      const corrupted = nearby.filter(e => (e.corrupted||0) > 0);
      if (corrupted.length > 0) nearby = corrupted;
    }
    if (nearby.length > 0) {
      const target = nearby[0];
      const dmg = p.damage * 0.35 * (corruptHunting ? 1.35 : 1);
      target.hp -= dmg;
      target.lastHitByDog = true;
      floatText(target.x, target.y - target.r - 14, Math.round(dmg), corruptHunting ? "#cc44ff" : "#c8903a");
      burst(target.x, target.y, corruptHunting ? "#aa22ff" : "#c8903a", corruptHunting ? 8 : 4);
      dog.attackCd = baseRate;
      // Phantom Hunt chain: also strike second nearby enemy
      if ((dog._phantomTimer||0) > 0) {
        const chain2 = state.enemies.find(e => !e.infected && e !== target && distance({x:dogX,y:dogY},e) < 130);
        if (chain2) {
          chain2.hp -= dmg * 0.55;
          floatText(chain2.x, chain2.y-chain2.r-10, Math.round(dmg*0.55), '#ff6688');
          burst(chain2.x, chain2.y, '#ff6688', 5);
        }
      }
      if (dogHas("collar")) { dog.comboCount = Math.min(8, dog.comboCount + 1); dog.comboTimer = 2.0; }
      if (dogHas("mask") && Math.random() < 0.25) { target.bleed = (target.bleed||0) + 3.0; }
    } else {
      dog.attackCd = Math.min(dog.attackCd + dt * 0.5, 0);
    }
  }
  // Ritual dog: glowing-eye trail particles
  if ((dog._ritualTimer||0) > 0 && Math.random() < 0.3) {
    state.particles.push({ x:dogX, y:dogY-10, vx:rand(-10,10), vy:rand(-30,-5),
      color:'#8833dd', life:rand(0.25,0.5), size:rand(2,4) });
  }

  for (const e of state.enemies) {
    if ((e.bleed||0) > 0) {
      e.bleed -= dt;
      e.hp -= p.damage * 0.08 * dt;
    }
  }

  for (const e of state.enemies) {
    if (!e.infected) continue;
    e.infected -= dt;
    if (e.infected <= 0) { e.infected = 0; continue; }
    const foeTarget = state.enemies.find(f => !f.infected && f !== e);
    if (foeTarget) {
      const ang = Math.atan2(foeTarget.y - e.y, foeTarget.x - e.x);
      e.x += Math.cos(ang) * e.speed * dt;
      e.y += Math.sin(ang) * e.speed * dt;
      if (distance(e, foeTarget) < e.r + foeTarget.r) {
        foeTarget.hp -= e.damage * dt * 2;
      }
    }
  }
}

function petResonance(dt) {
  const p = state.player;
  if (p.petCharge < 100) return;
  p.petCharge = 0;
  state.pet.pulse = 0.65;
  for (const enemy of state.enemies) {
    if (distance(p, enemy) < 210) enemy.hp -= p.damage * 2.4;
  }
  burst(p.x, p.y, "#78f3ce", 42);
  floatText(p.x, p.y-86, "人宠共鸣", "#78f3ce");
}

function updateParticles(dt) {
  state.pet.pulse = Math.max(0, state.pet.pulse - dt);
  for (let i = state.afterimages.length-1; i >= 0; i--) {
    const img = state.afterimages[i];
    img.life -= dt;
    if (img.life <= 0) state.afterimages.splice(i, 1);
  }
  for (let i = state.particles.length-1; i >= 0; i--) {
    const part = state.particles[i];
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.life -= dt;
    if (part.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floating.length-1; i >= 0; i--) {
    const txt = state.floating[i];
    txt.y -= 30 * dt;
    txt.life -= dt;
    if (txt.life <= 0) state.floating.splice(i, 1);
  }
  // Melee slash VFX
  if (state.meleeSlashes) {
    for (let i = state.meleeSlashes.length-1; i >= 0; i--) {
      state.meleeSlashes[i].life -= dt;
      if (state.meleeSlashes[i].life <= 0) state.meleeSlashes.splice(i, 1);
    }
  }
}

function burst(x, y, color, amount) {
  for (let i=0; i<amount; i++) {
    const a = rand(0, Math.PI*2);
    const spd = rand(40, 200);
    state.particles.push({ x, y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
      color, life:rand(0.25,0.72), size:rand(2,5) });
  }
}

function floatText(x, y, text, color) {
  state.floating.push({ x, y, text, color, life:0.9 });
}

// ─── UI ───────────────────────────────────────────────────
function updateUi() {
  const p = state.player;
  ui.hpBar.style.width  = `${Math.max(0, p.hp/p.maxHp)*100}%`;
  ui.xpBar.style.width  = `${Math.max(0, (p.xp||0)/(p.needXp||12))*100}%`;
  ui.hpText.textContent = `生命 ${Math.ceil(Math.max(0,p.hp))} / ${p.maxHp}`;
  ui.xpText.textContent = `星尘 ${Math.floor(p.xp||0)} / ${p.needXp||12}`;
  const _bossLocked = state.round % state.shopEvery === 0 &&
    state.roundTime > state.roundDuration &&
    state.enemies.some(e => e.kind === 'boss');
  ui.timer.textContent  = _bossLocked
    ? '⚔ 击杀BOSS'
    : formatTime(Math.max(0, state.roundDuration - state.roundTime));
  ui.wave.textContent   = `第 ${state.round} 回合`;
  ui.coins.textContent  = `金币 ${state.coins}`;
  ui.chapter.textContent = chapters[state.chapter].name;
  const ev = state.evolution;
  const domLabel = BUILD_TYPES[ev.dominant]?.label || "无变异";
  // evolve bar — delegate entirely to updateEvolveBar() for route-aware display
  updateEvolveBar();
  const gameWrap = document.querySelector(".game-wrap");
  if (gameWrap) gameWrap.dataset.build = ev.dominant;
  updateRouteHud();
  ui.stats.innerHTML = [
    `流派 ${p.className}`,
    `攻击 ${Math.round(p.damage)}`,
    `攻速 ${(1/p.fireRate).toFixed(1)}/秒`,
    `移速 ${Math.round(p.speed)}`,
    `弹道 ${p.projectiles}`,
    `暴击 ${Math.round(p.crit)}%`,
    p.shieldMax>0 ? `护盾 ${Math.round(p.shield)}/${p.shieldMax}` : null,
    `武器 ${state.ownedWeapons.length}`,
    `共鸣 ${Math.min(100,Math.round(p.petCharge))}%`,
    `体型 ${Math.round(ev.bodyScale*100)}%`
  ].filter(Boolean).map(s=>`<span>${s}</span>`).join("");
}

function endGame(win) {
  if (state.over) return;
  state.over = true; state.running = false; paused = true;
  // 短暂延迟后显示死亡人格卡
  setTimeout(showDeathCard, win ? 400 : 1200);
}

// ─── Loop ─────────────────────────────────────────────────
let frameHeartbeat = performance.now();
function loop(now) {
  frameHeartbeat = performance.now();
  const dt = Math.min(0.033, (now-last)/1000);
  last = now;
  ensureRunningState();
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

setInterval(() => {
  const now = performance.now();
  if (now - frameHeartbeat < 80) return;
  const dt = Math.min(0.033, (now - last) / 1000) || 0.033;
  last = now;
  frameHeartbeat = now;
  ensureRunningState();
  update(dt);
  draw();
}, 33);

// ─── Input ────────────────────────────────────────────────
window.addEventListener("keydown", ev => {
  // Don't capture game keys while the dialogue input is focused
  const dlgFocused = document.activeElement === document.getElementById("dlgInput");
  if (dlgFocused) return;
  keys[ev.code] = true;
  if (ev.code === "Space") { ev.preventDefault(); if (state?.running) roll(); }
  if (ev.code === "KeyQ")  { ev.preventDefault(); useSkillQ(); }
  if (ev.code === "KeyE")  { ev.preventDefault(); useSkillE(); }
});
window.addEventListener("keyup", ev => { keys[ev.code] = false; });
window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", () => {
  canvas.focus?.();
  ensureRunningState();
});
canvas.tabIndex = 0;

// ═══════════════════════════════════════════════════════════
//  PRE-BOSS PACT OFFER
// ═══════════════════════════════════════════════════════════

function openPreBossOffer(onDone) {
  const modal = document.getElementById("preBossModal");
  const cardsEl = document.getElementById("pbCards");
  const skipBtn = document.getElementById("pbSkipBtn");
  const eyebrow = document.getElementById("pbEyebrow");
  if (!modal || !cardsEl) { onDone(); return; }

  eyebrow.textContent = `⚠ 第 ${state.round} 关 · BOSS 即将来袭 · 血盟契约`;

  // Generate 3 random pact offers
  const shuffled = upgrades.slice().sort(() => Math.random() - 0.5);
  const sidePool = SIDE_EFFECTS.slice().sort(() => Math.random() - 0.5);
  cardsEl.innerHTML = "";

  const offers = shuffled.slice(0, 3).map((upg, i) => {
    const rarity = rarities[Math.floor(Math.random() * 3) + 1]; // 稀有~传说
    const value  = upg.stat === "fireRate"
      ? +(upg.base * rarity.power * 1.4).toFixed(3)
      : Math.round(upg.base * rarity.power * 1.4); // 40% stronger than normal
    const valStr = upg.stat === "crit" || upg.stat === "goldRate"
      ? Math.round(value) + "%" : value;
    const side   = sidePool[i % sidePool.length];

    // Cost: HP or coins
    const hpCost   = Math.round(state.player.hp * (0.18 + Math.random() * 0.12));
    const coinCost  = 40 + state.round * 12;
    const useHp     = Math.random() < 0.5 || state.coins < coinCost;
    const cost = useHp
      ? { type:"hp",   amount: hpCost,   label: `失去 ${hpCost} 生命`, cls:"pb-cost-hp" }
      : { type:"coin", amount: coinCost,  label: `消耗 ${coinCost} ◆`, cls:"pb-cost-coin" };

    return { upg, value, rarity, side, cost, valStr };
  });

  for (const offer of offers) {
    const card = document.createElement("button");
    card.className = "pb-card";
    card.innerHTML =
      `<div class="pb-card-item-name">${offer.upg.name}</div>` +
      `<div class="pb-card-bonus">${offer.upg.text} <span class="pb-val">+${offer.valStr}</span></div>` +
      `<div class="pb-card-cost ${offer.cost.cls}">${offer.cost.label}</div>` +
      `<div class="pb-card-divider"></div>` +
      `<div class="pb-card-side">⚠ 副作用：${offer.side.desc}</div>`;
    card.addEventListener("click", () => {
      // Apply cost
      if (offer.cost.type === "hp") {
        state.player.hp = Math.max(1, state.player.hp - offer.cost.amount);
      } else {
        state.coins = Math.max(0, state.coins - offer.cost.amount);
      }
      // Apply upgrade
      const p = state.player;
      if (offer.upg.stat === "maxHp") { p.maxHp += offer.value; p.hp = Math.min(p.maxHp, p.hp + offer.value); }
      else if (offer.upg.stat === "projectiles") { p.projectiles = Math.min(6, p.projectiles + 1); }
      else if (offer.upg.stat === "goldRate")    { p.goldRate += offer.value / 100; }
      else if (offer.upg.stat === "fireRate")    { p.fireRate = Math.max(0.08, p.fireRate + offer.value); }
      else { p[offer.upg.stat] += offer.value; }
      if (offer.upg.build) addEvolutionScore(offer.upg.build, 10 + offer.rarity.power * 3);
      // Apply side effect
      offer.side.apply();
      floatText(p.x, p.y - 100, `契约：${offer.upg.name}`, "#d060ff");
      modal.classList.remove("show");
      onDone();
    });
    cardsEl.appendChild(card);
  }

  // Skip button
  const newSkip = skipBtn.cloneNode(true);
  skipBtn.replaceWith(newSkip);
  newSkip.addEventListener("click", () => {
    modal.classList.remove("show");
    onDone();
  });

  modal.classList.add("show");
}

// ═══════════════════════════════════════════════════════════
//  STAGE MODE — SELECT / VICTORY
// ═══════════════════════════════════════════════════════════

// openStageSelect replaced by inline renderStageGrid in initMainMenu

function showStageVictory() {
  // Mark cleared, then show result
  if (_currentStage) markStageCleared(_currentStage.id);
  const nextStage = STAGES.find(s => s.id === (_currentStage?.id || 0) + 1);
  const title = `🏆 通关 · ${_currentStage?.name || ""}`;

  document.getElementById("resultKicker").textContent = "关卡通关";
  document.getElementById("resultTitle").textContent  = title;

  const nextBtn = document.getElementById("nextStageBtn");
  if (nextStage) {
    document.getElementById("resultBody").innerHTML =
      `<div style="font-size:15px;color:#e0d090;line-height:2.2">
        下一关 <strong style="color:#ffe060">「${nextStage.name}」</strong> 已解锁！<br>
        <span style="font-size:12px;color:#a09060">${nextStage.stars} · ${nextStage.rounds}回合 · ${nextStage.desc}</span>
      </div>`;
    if (nextBtn) {
      nextBtn.style.display = "";
      nextBtn.textContent   = `▶ 进入「${nextStage.name}」`;
      // Re-wire click every time (avoid duplicate listeners)
      const fresh = nextBtn.cloneNode(true);
      nextBtn.replaceWith(fresh);
      fresh.addEventListener("click", () => {
        _currentStage = nextStage;
        _stageMode    = true;
        hide(ui.resultModal);
        startGame();
      });
    }
  } else {
    document.getElementById("resultBody").innerHTML =
      `<div style="font-size:15px;color:#ffe060;line-height:2">
        🌟 全部关卡已通关！<br>
        <span style="font-size:13px;color:#a09060">你是真正的星陨霸主！</span>
      </div>`;
    if (nextBtn) nextBtn.style.display = "none";
  }
  show(ui.resultModal);
}

// ── Start game in stage mode ────────────────────────────────
function startStagedGame() {
  _stageMode = true;
  // Stage mode: only the specific number of rounds, boss at end
  // shopEvery set to stage.rounds so boss appears on the last round
  startGame();
  if (_currentStage) {
    state.shopEvery = _currentStage.rounds;
  }
}

// Class selection is now handled via #mmClassTabs in the main menu
// ui.classCards is kept in DOM (hidden) for backward-compat; no listener needed
ui.startBtn?.addEventListener("click", startGame);
ui.restartBtn.addEventListener("click", resetToMenu);
ui.nextRoundBtn.addEventListener("click", startNextRound);
document.getElementById("routeConfirmBtn")?.addEventListener("click", confirmRouteSelection);
document.getElementById("dcRestartBtn")?.addEventListener("click", resetToMenu);
document.getElementById("dcMenuBtn")?.addEventListener("click", resetToMenu);
document.getElementById("menuFromResultBtn")?.addEventListener("click", resetToMenu);
document.getElementById("dcShareBtn")?.addEventListener("click", () => {
  // Canvas screenshot via existing game canvas
  const link = document.createElement("a");
  link.download = "starcont-death-card.png";
  link.href = canvas.toDataURL();
  link.click();
});

// ═══════════════════════════════════════════════════════════
//  PIXEL-ART ICON SYSTEM
// ═══════════════════════════════════════════════════════════

function _mkIcon(ctx, rows, pal) {
  const s = 6; // 6px per cell → 48×48 canvas (8×8 grid)
  ctx.clearRect(0, 0, 48, 48);
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const col = pal[row[c]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(c * s, r * s, s, s); }
    }
  });
}

function makeIconCanvas(name) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 48;
  cv.style.cssText = "display:block;width:48px;height:48px;image-rendering:pixelated;margin:0 auto 6px;flex-shrink:0;";
  const cx = cv.getContext("2d");
  cx.imageSmoothingEnabled = false;
  (ITEM_ICONS[name] || ITEM_ICONS._default)(cx);
  return cv;
}

const ITEM_ICONS = {
  _default(ctx) {
    _mkIcon(ctx, [
      "........","...W....","..WBW...","...W....","...W....","...W....","........","........"
    ], { W: "#e8d090", B: "#ffe050" });
  },
  // ── Weapons ──────────────────────────────────────────────
  "双刃短刀"(ctx) {
    _mkIcon(ctx, [
      "B.....B.","..B..B..","...BB...","..GBBG..","...BB...",".B....B.","H......H","........"
    ], { B: "#c8d0e0", G: "#c8a030", H: "#7a4820" });
  },
  "影袭靴"(ctx) {
    _mkIcon(ctx, [
      "........","..BB....","..BBB...","BBBB....","BBBBB...","BBBBBBB.","..S.....","........"
    ], { B: "#8a5a30", S: "#3a2010" });
  },
  "电流匕首"(ctx) {
    _mkIcon(ctx, [
      "......YE",".....YE.","....YE..","..GGG...","...B....","...B....","...H....","...H...."
    ], { Y: "#ffe040", E: "#4090ff", G: "#c0c870", B: "#c0d8e8", H: "#7a4820" });
  },
  "深海重甲"(ctx) {
    _mkIcon(ctx, [
      ".SSSSSS.","SBBBBBS.","SB....BS","SB.C..BS","SB....BS","SB....BS","SBBBBBS.",".SSSSSS."
    ], { S: "#8090a8", B: "#304880", C: "#60b0ff" });
  },
  "锚链巨锤"(ctx) {
    _mkIcon(ctx, [
      ".HHHHHHH","HHHHHHHH","HHHHHHHH","....S...","....S...","....S...","....S...","....S..."
    ], { H: "#909098", S: "#7a4820" });
  },
  "石肤核心"(ctx) {
    _mkIcon(ctx, [
      "..RRRR..","..RRRR..","RRDDDDRRR","RRDBDDRR","RRDBDDRR","..RRRR..","..RRRR..","........"
    ], { R: "#808070", D: "#a0a090", B: "#c0c8a8" });
  },
  "潮汐法杖"(ctx) {
    _mkIcon(ctx, [
      "...OO...","..OWWO..","...OO...","...S....","..WSW...","...S....","...S....","...S...."
    ], { O: "#1890b0", W: "#60d0ff", S: "#7a5030" });
  },
  "深渊核心"(ctx) {
    _mkIcon(ctx, [
      "..DDDD..","..DPPD..",".DPBBPD.","DDPBBPDD",".DPBBPD.","..DPPD..","..DDDD..","........"
    ], { D: "#380060", P: "#7030b0", B: "#c050f0" });
  },
  "雷暴环"(ctx) {
    _mkIcon(ctx, [
      "..RRRR..",".R....R.","R..L...R","R.LL...R","R..L...R","R......R",".R....R.","..RRRR.."
    ], { R: "#a0b8d0", L: "#ffe040" });
  },
  "血肉触手"(ctx) {
    _mkIcon(ctx, [
      "....FF..","..FFFFF.",".FFFF...","FFF.....","FFS.....","..FFS...","....FFS.","......F."
    ], { F: "#d05050", S: "#ff8080" });
  },
  "肌肉外壳"(ctx) {
    _mkIcon(ctx, [
      ".AAAAAA.","APAAAAPA","APAMMAAP",".AAMMA..","..AMMA..","..AAAA..","..A..A..","........"
    ], { A: "#c07030", P: "#e09850", M: "#c03030" });
  },
  "混沌棱晶"(ctx) {
    _mkIcon(ctx, [
      "...C....","..CPC...","CPRPC...","PRWRPC..","CPRPC...",".CPC....","..C.....","........"
    ], { C: "#8040c0", P: "#b060e0", R: "#e040a0", W: "#ffffff" });
  },
  // ── Dog Gear ─────────────────────────────────────────────
  "狂暴项圈"(ctx) {
    _mkIcon(ctx, [
      "........","..RRRR..","..R..R..",".R....R.","R......R","R.RRRR.R",".R....R.","..RRRR.."
    ], { R:"#ff2020" });
  },
  "重甲背心"(ctx) {
    _mkIcon(ctx, [
      "..SSSS..","SSSSSSSS","SMSSSSMS","SMSSSSMS","SSSSSSSS",".S.SS.S.","........","........"
    ], { S:"#a0b8c8", M:"#ddeeff" });
  },
  "感染犬链"(ctx) {
    _mkIcon(ctx, [
      "........","..KKKK..","..KKKK..","..KKKK..","...KK...","..K..K..","..K..K..","........"
    ], { K:"#1a001a" });
  },
  "灵魂骨头"(ctx) {
    _mkIcon(ctx, [
      "..G..G..","..G..G..","..GGGG..","...GG...","..GGGG..","..G..G..","..G..G..","........"
    ], { G:"#78f3ce" });
  },
  "影子鞋"(ctx) {
    _mkIcon(ctx, [
      "........","........","..DDDD..","D.DDDD.D","DDDDDDDD","DDDDDDDD",".D....D.","........"
    ], { D:"#442266" });
  },
  "巨兽核心"(ctx) {
    _mkIcon(ctx, [
      "...OO...","..OOOO..","..OOOO..","OOOOOOOO","OOOOOOOO","..OOOO..","...OO...","........"
    ], { O:"#ff8020" });
  },
  "尖牙面具"(ctx) {
    _mkIcon(ctx, [
      "........","..FFFF..","F.FFFF.F","FF.FF.FF","FFF..FFF",".FF..FF.","........","........"
    ], { F:"#ff3030" });
  },
  // ── Upgrades ─────────────────────────────────────────────
  "星火法杖"(ctx) {
    _mkIcon(ctx, [
      "...F....","..FYF...",".FFFFF..","...F....","...S....","...S....","...S....","...H...."
    ], { F: "#f07020", Y: "#ffe030", S: "#8060a0", H: "#4a3070" });
  },
  "风行靴"(ctx) {
    _mkIcon(ctx, [
      "........","..BB....","..BBBW..","BBBBWW..","BBBBBWW.","SSSSSSSW","..S...W.","........"
    ], { B: "#607090", S: "#2a3040", W: "#60c0ff" });
  },
  "秘银护心"(ctx) {
    _mkIcon(ctx, [
      ".M.M....","MMMMM...","MMHHMM..","MHHHHM..","MHHHHM..","MHHHM...","..MM....","........"
    ], { M: "#90a8d0", H: "#e04060" });
  },
  "回旋星刃"(ctx) {
    _mkIcon(ctx, [
      "...S....","..BSB...","SSSSSSSS","..BSB...","...S....","........","........","........"
    ], { S: "#c0c8d8", B: "#e0e8f0", X: "#ffe040" });
  },
  "猎星目镜"(ctx) {
    _mkIcon(ctx, [
      "........","..RRRR..","..R..R..","..R.PR..","..R..R..","..RRRR..","....C...","........"
    ], { R: "#c0901c", P: "#2030a0", C: "#c0901c" });
  },
  "丰收钱袋"(ctx) {
    _mkIcon(ctx, [
      "...NN...","..NNNN..","NBBBBBN.","NBBBBBN.","NBBBBBN.",".NBBBBN.","..NNNN..","........"
    ], { N: "#c89040", B: "#a87030" });
  },
  "血肉之核"(ctx) {
    _mkIcon(ctx, [
      "..DDDD..","..DRRD..",".DRPRD..","DDRPRDDD",".DRPRD..","..DRRD..","..DDDD..","........"
    ], { D: "#5a0020", R: "#c03040", P: "#e06080" });
  },
  "混沌脉冲"(ctx) {
    _mkIcon(ctx, [
      "...Y....","..YY....","..Y.....","YY......","....YY..","....YY..","...YY...","........"
    ], { Y: "#ffe040" });
  },
  // ── Blind boxes ──────────────────────────────────────────
  "青铜盲盒"(ctx) {
    _mkIcon(ctx, [
      "BBBBBBBB","B..GG..B","B.G..G.B","B.GGGG.B","BBBBBBBB","B......B","B......B","BBBBBBBB"
    ], { B: "#c89050", G: "#e8b030" });
  },
  "秘银盲盒"(ctx) {
    _mkIcon(ctx, [
      "BBBBBBBB","B..GG..B","B.G..G.B","B.GGGG.B","BBBBBBBB","B......B","B......B","BBBBBBBB"
    ], { B: "#90a8c8", G: "#c0d8f0" });
  },
  "曜金盲盒"(ctx) {
    _mkIcon(ctx, [
      "BBBBBBBB","B..GG..B","B.G..G.B","B.GGGG.B","BBBBBBBB","B......B","B......B","BBBBBBBB"
    ], { B: "#c8a020", G: "#fff060" });
  },
  "星陨盲盒"(ctx) {
    _mkIcon(ctx, [
      "BBBBBBBB","B..SS..B","B.S..S.B","B.SSSS.B","BBBBBBBB","B.S..S.B","B......B","BBBBBBBB"
    ], { B: "#6030a0", S: "#ff50c0" });
  },
  "诅咒盲盒"(ctx) {
    _mkIcon(ctx, [
      "BBBBBBBB","B..XX..B","B.X..X.B","B.XXXX.B","BBBBBBBB","B.X..X.B","B......B","BBBBBBBB"
    ], { B: "#201808", X: "#ff3030" });
  },
};

// ─── Boot ─────────────────────────────────────────────────
resizeCanvas();
state = baseState();
updateUi();
preloadSprites(() => { console.log("Sprites ready"); });
preloadTileset(() => { _mapCanvas = null; console.log("Tileset ready"); }); // invalidate cached map
requestAnimationFrame(loop);

// ═══════════════════════════════════════════════════════════
//  MAIN MENU
// ═══════════════════════════════════════════════════════════
(function initMainMenu() {
  const menuEl   = document.getElementById("mainMenu");
  const startBtn = document.getElementById("menuStartBtn");
  const exitBtn  = document.getElementById("menuExitBtn");
  const pCanvas  = document.getElementById("menuParticles");
  if (!menuEl || !pCanvas) return;

  const pc = pCanvas.getContext("2d");

  // ── Particle state (dandelion seeds + sparkles) ──────────
  const fireflies = Array.from({ length: 26 }, (_, i) => ({
    x: Math.random() * 1280,
    y: Math.random() * 680,
    vx: (Math.random() - 0.3) * 0.5,
    vy: -(Math.random() * 0.5 + 0.15),  // float upward
    size: Math.random() * 2 + 1,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.8,
    color: Math.random() > 0.5 ? "#fffbe8" : "#ffeea0"
  }));

  const leaves = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * 1280,
    y: 200 + Math.random() * 480,
    vx: -(0.3 + Math.random() * 0.55),
    vy: (Math.random() - 0.4) * 0.22,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.035,
    size: 5 + Math.random() * 5,
    alpha: 0.4 + Math.random() * 0.45
  }));

  // ── Canvas resize ────────────────────────────────────────
  function resizeMenu() {
    const r = menuEl.getBoundingClientRect();
    pCanvas.width  = r.width  || 1280;
    pCanvas.height = r.height || 720;
  }

  // ── Draw loop ────────────────────────────────────────────
  let t = 0;
  function drawMenu(now) {
    if (!menuEl.classList.contains("show")) return;
    resizeMenu();
    const W = pCanvas.width, H = pCanvas.height;
    t = (now || 0) * 0.001;
    pc.clearRect(0, 0, W, H);

    // Dandelion seeds (float upward, drift sideways)
    for (const f of fireflies) {
      f.phase += 0.016 * f.speed;
      const alpha = 0.35 + 0.60 * (0.5 + 0.5 * Math.sin(f.phase));
      f.x += f.vx + Math.sin(t * 0.6 + f.phase) * 0.22;
      f.y += f.vy;
      if (f.y < -10) { f.y = H + 10; f.x = Math.random() * W; }
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;

      // Soft glow (warm white/gold in daylight)
      const grd = pc.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 6);
      grd.addColorStop(0,   hexAlpha(f.color, alpha * 0.65));
      grd.addColorStop(0.4, hexAlpha(f.color, alpha * 0.20));
      grd.addColorStop(1,   hexAlpha(f.color, 0));
      pc.fillStyle = grd;
      pc.beginPath();
      pc.arc(f.x, f.y, f.size * 6, 0, Math.PI * 2);
      pc.fill();

      // Dandelion seed: cross pixel
      pc.fillStyle = f.color;
      pc.globalAlpha = alpha;
      pc.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 2, 2, 5);
      pc.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 1, 5, 2);
      pc.globalAlpha = 1;
    }

    // Pixel leaves (green, warmer tones for daytime)
    for (const l of leaves) {
      l.x += l.vx;
      l.y += l.vy + Math.sin(t + l.rot) * 0.10;
      l.rot += l.rotV;
      if (l.x < -20) { l.x = W + 20; l.y = H * 0.3 + Math.random() * H * 0.55; }

      pc.save();
      pc.globalAlpha = l.alpha;
      pc.translate(l.x, l.y);
      pc.rotate(l.rot);
      const s = l.size;
      pc.fillStyle = "#4a9028";
      pc.fillRect(-s / 2, -s / 4, s, s / 2);
      pc.fillStyle = "#60b038";
      pc.fillRect(-s / 4, -s / 2, s / 2, s);
      pc.restore();
    }

    // Sunlight shimmer near ground
    pc.save();
    const shimY = H * 0.86 + Math.sin(t * 0.25) * H * 0.03;
    const sGrd = pc.createLinearGradient(0, shimY - 20, 0, shimY + 20);
    sGrd.addColorStop(0,   "rgba(220,255,150,0)");
    sGrd.addColorStop(0.5, "rgba(220,255,150,0.05)");
    sGrd.addColorStop(1,   "rgba(220,255,150,0)");
    pc.fillStyle = sGrd;
    pc.fillRect(0, shimY - 20, W, 40);
    pc.restore();
  }
  requestAnimationFrame(drawMenu);

  // helper: hex color with alpha
  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  // ── Button wiring ────────────────────────────────────────
  // ─── Mode toggle helpers ──────────────────────────────────
  function setMenuMode(mode) {
    const shopView  = document.getElementById("mmShopView");
    const stageView = document.getElementById("mmStageView");
    const startBtnEl = document.getElementById("menuStartBtn");
    const stageBtnEl = document.getElementById("menuStageBtn");
    if (mode === "infinite") {
      shopView.style.display  = "";
      stageView.style.display = "none";
      startBtnEl?.classList.add("mm-btn-primary");
      startBtnEl?.classList.remove("mm-btn-stage", "mm-btn-dim");
      if (startBtnEl) { startBtnEl.textContent = "∞ 开始游戏"; startBtnEl.disabled = false; }
      stageBtnEl?.classList.remove("mm-btn-primary");
      stageBtnEl?.classList.add("mm-btn-stage");
      _stageMode    = false;
      _currentStage = null;
    } else {
      shopView.style.display  = "none";
      stageView.style.display = "";
      stageBtnEl?.classList.add("mm-btn-primary");
      stageBtnEl?.classList.remove("mm-btn-stage");
      startBtnEl?.classList.remove("mm-btn-primary");
      startBtnEl?.classList.add("mm-btn-stage");
      if (startBtnEl) {
        startBtnEl.textContent = _currentStage
          ? `▶ 出发：${_currentStage.name}`
          : "↑ 请先选择关卡";
        startBtnEl.disabled = !_currentStage;
      }
      renderStageGrid();
    }
  }

  function renderStageGrid() {
    const grid = document.getElementById("mmStageGrid");
    const sel  = document.getElementById("mmStageSelected");
    const startBtnEl = document.getElementById("menuStartBtn");
    if (!grid) return;
    grid.innerHTML = "";
    for (const stage of STAGES) {
      const status = stageStatus(stage.id);
      const card = document.createElement("button");
      const isSelected = _currentStage?.id === stage.id;
      card.className = `stage-card stage-${status}${isSelected ? " stage-active-sel" : ""}`;
      const cleared = status === "cleared";
      card.innerHTML = status === "locked"
        ? `<div class="stage-lock-icon">🔒</div>
           <div class="stage-name">${stage.name}</div>
           <div class="stage-stars">${stage.stars}</div>`
        : `<div class="stage-num">${cleared ? "✓" : stage.id}</div>
           <div class="stage-name">${stage.name}</div>
           <div class="stage-rounds">${stage.rounds} 关</div>
           <div class="stage-stars">${stage.stars}</div>`;
      if (status !== "locked") {
        card.addEventListener("click", () => {
          _currentStage = stage;
          _stageMode    = true;
          renderStageGrid(); // re-render to show selection
          if (sel) sel.innerHTML =
            `▶ 已选：<strong>${stage.name}</strong> · ${stage.rounds} 关 · ${stage.desc}`;
          // Update start button
          if (startBtnEl) {
            startBtnEl.textContent = `▶ 出发：${stage.name}`;
            startBtnEl.disabled = false;
          }
        });
      }
      grid.appendChild(card);
    }
  }

  // ∞/▶ Start button — starts game in current mode
  startBtn?.addEventListener("click", () => {
    if (startBtn.disabled) return;
    menuEl.classList.remove("show");
    if (!_stageMode) {
      _currentStage = null;
    }
    startGame();
  });

  // ▦ Stage mode button — toggle right panel
  document.getElementById("menuStageBtn")?.addEventListener("click", () => {
    const isStageActive = document.getElementById("mmStageView")?.style.display !== "none";
    setMenuMode(isStageActive ? "infinite" : "stage");
  });

  exitBtn?.addEventListener("click", () => {
    if (confirm("确认退出游戏？")) window.close();
  });

  // Initial shop render (called once after all JS is loaded)
  renderMenuShop();
  setMenuMode("infinite"); // start in infinite mode
})();
