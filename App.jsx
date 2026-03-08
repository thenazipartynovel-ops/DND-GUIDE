/* globals: React, ReactDOM — loaded via CDN in index.html */
const {
  useState, useEffect, useRef, useCallback, useMemo, memo
} = React;

/* ═══════════════════════════════════════════════════════════════
   ⚔️  THE WAR TABLE  v6.0  —  World-Class Edition
   🔥  Firebase Realtime Database  (live multi-device sync)
   🔑  DM Password: SECRET HAHAHAHAHAH YOU THINK YOU COULD JUST FIGURE IT OUT BY LOOKING HERE, WHAT A FOOL... GET TRICKED LMAO
   💰  Multi-currency: Copper · Silver · Gold · Platinum
   📊  Stats: STR · CON · DEX · AGI · CHA  (base + bonus)
═══════════════════════════════════════════════════════════════ */

// ── Firebase Config ──────────────────────────────────────────
const FB_CFG = {
  apiKey:"AIzaSyBAGezEAUWkj6BE90iOgCZzQN5MR_pK3jM",
  authDomain:"dnddnd-4fe6f.firebaseapp.com",
  databaseURL:"https://dnddnd-4fe6f-default-rtdb.firebaseio.com",
  projectId:"dnddnd-4fe6f",
  storageBucket:"dnddnd-4fe6f.firebasestorage.app",
  messagingSenderId:"1057300769702",
  appId:"1:1057300769702:web:e16e5d6e6551eb3982fd67",
};

const _vk = [71,13,29,47,83,11,37,59];
const _tc = {
  motionA:{ x:[142,119,22,56],  y:[194,200,153,227] },
  motionB:{ x:[124,89,197,222], y:[225,227,169,134] },
  motionC:{ x:[222,173,135,230],y:[233,244,89,241]  },
  motionD:{ x:[12,101,72,173],  y:[156,9,99,125]    },
};
const _rv = () => {
  const t = _tc;
  return [
    ...t.motionA.x,...t.motionA.y, ...t.motionB.x,...t.motionB.y,
    ...t.motionC.x,...t.motionC.y, ...t.motionD.x,...t.motionD.y,
  ].map((v,i) => v ^ _vk[i % _vk.length]);
};
const _verify = async (pw) => {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    const got = Array.from(new Uint8Array(buf));
    const exp = _rv();
    return got.length === exp.length && got.every((v,i) => v === exp[i]);
  } catch { return false; }
};

// ── Fonts ─────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&display=swap');`;

// ── Dark Neumorphic Theme ─────────────────────────────────────
const N = {
  base:"#171423", light:"#221f30", dark:"#0d0b14",
  surface:"#1c1929", border:"#2c2841",
  text:"#d4cfea", dim:"#6a6382", gold:"#d4a96a", accent:"#9b72cf",
};
// BUG FIX #13: nR/nI are pure functions; IS computed once is fine since
// React re-applies style objects on every render (not mutating the const).
const neu = (s=6, inset=false) => {
  const b = Math.round(s * 0.6);
  return inset
    ? `inset -${b}px -${b}px ${s}px ${N.light}, inset ${b}px ${b}px ${s}px ${N.dark}`
    : `-${s}px -${s}px ${s*2}px ${N.light}, ${s}px ${s}px ${s*2}px ${N.dark}`;
};
const nR = (s=5)  => ({ background: N.surface, boxShadow: neu(s) });
const nI = (s=4)  => ({ background: N.base,    boxShadow: neu(s, true) });

// ── Currency ──────────────────────────────────────────────────
// Stored as separate P/G/S/C integer fields. 1P=10G=100S=1000C
const COINS = {
  P:{ name:"Platinum",label:"pp",col:"#c4b5fd",bg:"#1c1a38",gem:"#ddd6fe",rate:1000 },
  G:{ name:"Gold",    label:"gp",col:"#fbbf24",bg:"#211700",gem:"#fde68a",rate:100  },
  S:{ name:"Silver",  label:"sp",col:"#94a3b8",bg:"#131922",gem:"#e2e8f0",rate:10   },
  C:{ name:"Copper",  label:"cp",col:"#c97316",bg:"#1b1008",gem:"#fdba74",rate:1    },
};
const COIN_KEYS = ["P","G","S","C"];

function toCopper(cur) {
  if (!cur) return 0;  // BUG FIX #26: null/undefined guard
  return COIN_KEYS.reduce((s,k) => s + (parseInt(cur[k])||0) * COINS[k].rate, 0);
}
// BUG FIX #10/#11: Better conversion display — fractions shown as <1 not 0.00
function getConversions(type, amount) {
  const n = parseInt(amount) || 0;
  const totalCopper = n * COINS[type].rate;
  return COIN_KEYS.reduce((acc,k) => {
    const v = totalCopper / COINS[k].rate;
    acc[k] = v;
    return acc;
  }, {});
}
function fmtConv(v) {
  if (v === 0) return "0";
  if (Number.isInteger(v)) return v.toLocaleString();
  if (v < 1) return `<1 (≈${(1/v).toFixed(0)} needed)`;
  return v.toFixed(2).replace(/\.?0+$/,"");
}
function mkCurrency(c={}) {
  return {
    P: Math.max(0, parseInt(c?.P)||0),
    G: Math.max(0, parseInt(c?.G)||0),
    S: Math.max(0, parseInt(c?.S)||0),
    C: Math.max(0, parseInt(c?.C)||0),
  };
}

// ── D&D Stats ─────────────────────────────────────────────────
const STAT_DEFS = [
  { k:"STR", name:"Strength",     col:"#f87171", icon:"⚔️" },
  { k:"CON", name:"Constitution", col:"#4ade80", icon:"🛡" },
  { k:"DEX", name:"Dexterity",    col:"#60a5fa", icon:"🎯" },
  { k:"AGI", name:"Agility",      col:"#fbbf24", icon:"⚡" },
  { k:"CHA", name:"Charisma",     col:"#f472b6", icon:"✨" },
];
// BUG FIX #16: mkStats always returns all 5 stats with valid defaults
function mkStats(s) {
  return STAT_DEFS.reduce((acc, {k}) => ({
    ...acc,
    [k]: {
      base:  Math.max(1, Math.min(30, parseInt(s?.[k]?.base)  || 10)),
      bonus: parseInt(s?.[k]?.bonus) || 0,
    },
  }), {});
}

// ── Game constants ────────────────────────────────────────────
const RACES   = ["Human","Elf","High Elf","Wood Elf","Half-Elf","Dwarf","Hill Dwarf","Mountain Dwarf","Halfling","Gnome","Tiefling","Dragonborn","Half-Orc","Aasimar","Genasi","Tabaxi","Kenku","Other"];
const CLASSES = ["Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard","Other"];
const CLS_G   = { Barbarian:"🪓",Bard:"🎵",Cleric:"✝️",Druid:"🌿",Fighter:"⚔️",Monk:"👊",Paladin:"🛡️",Ranger:"🏹",Rogue:"🗡️",Sorcerer:"✨",Warlock:"🌑",Wizard:"🔮",Other:"⚡" };
const CONDS   = ["Blinded","Charmed","Deafened","Exhausted","Frightened","Grappled","Incapacitated","Invisible","Paralyzed","Petrified","Poisoned","Prone","Restrained","Stunned"];
const COND_G  = { Blinded:"👁",Charmed:"💞",Deafened:"🔇",Exhausted:"😴",Frightened:"😱",Grappled:"🤜",Incapacitated:"💀",Invisible:"🫥",Paralyzed:"⚡",Petrified:"🪨",Poisoned:"🤢",Prone:"⬇️",Restrained:"⛓️",Stunned:"💫" };
const ST_MAP  = {
  alive:       { l:"Alive",  c:"#4ade80", bg:"#0a1a0e", dot:"#22c55e" },
  unconscious: { l:"Down",   c:"#f59e0b", bg:"#1c1400", dot:"#f59e0b" },
  dead:        { l:"Fallen", c:"#f87171", bg:"#1c0808", dot:"#ef4444" },
};

// ── Player normalization ──────────────────────────────────────
// BUG FIX #3: effMaxHp handles BOTH {base,bonus} object AND legacy plain number
function effMaxHp(p) {
  if (!p?.maxHp) return 20;
  if (typeof p.maxHp === "number") return Math.max(1, p.maxHp);
  return Math.max(1, (parseInt(p.maxHp.base)||20) + (parseInt(p.maxHp.bonus)||0));
}

function mkP(raw = {}) {
  const p = raw;
  // BUG FIX #3: normalise legacy maxHp (plain number → object)
  const maxHpObj = (typeof p.maxHp === "object" && p.maxHp !== null)
    ? { base: Math.max(1, parseInt(p.maxHp.base)||20), bonus: parseInt(p.maxHp.bonus)||0 }
    : { base: Math.max(1, parseInt(p.maxHp)||20), bonus: 0 };

  // BUG FIX #4: migrate old {success,fail} → {s,f}
  const rawDs = p.deathSaves || {};
  const deathSaves = {
    s: parseInt(rawDs.s ?? rawDs.success) || 0,
    f: parseInt(rawDs.f ?? rawDs.fail)    || 0,
  };

  return {
    id:          p.id || Date.now(),
    name:        String(p.name || "Unknown"),
    race:        String(p.race || "Human"),
    class:       String(p.class || "Fighter"),
    level:       Math.max(1, Math.min(20, parseInt(p.level)||1)),
    status:      ["alive","unconscious","dead"].includes(p.status) ? p.status : "alive",
    color:       String(p.color || "#9b72cf"),
    hp:          Math.max(0, parseInt(p.hp)||0),
    maxHp:       maxHpObj,
    ac:          Math.max(1, Math.min(30, parseInt(p.ac)||10)),
    initiative:  Math.max(-10, Math.min(20, parseInt(p.initiative)||0)),
    stats:       mkStats(p.stats),     // BUG FIX #16: always full stats
    currency:    mkCurrency(p.currency),
    inventory:   Array.isArray(p.inventory) ? p.inventory.filter(Boolean) : [],
    conditions:  Array.isArray(p.conditions) ? p.conditions.filter(c => CONDS.includes(c)) : [],
    deathSaves,
    inspiration: Boolean(p.inspiration),
    notes:       String(p.notes || ""),
    xp:          Math.max(0, parseInt(p.xp)||0),
  };
}

function hpCol(hp, max) {
  const r = max > 0 ? hp / max : 0;
  if (r > .6) return "#4ade80";
  if (r > .3) return "#facc15";
  if (r > 0)  return "#f87171";
  return "#4b5563";
}
// BUG FIX #5/#6: safe number clamping — never returns NaN
function safeInt(v, fallback=0) { const n=parseInt(v); return isNaN(n)?fallback:n; }
function clamp(v,lo,hi) { return Math.max(lo, Math.min(hi, safeInt(v,lo))); }

// ── Default players ───────────────────────────────────────────
const DEF_PLAYERS = [
  { id:1, name:"Monkeh",        race:"Half-Elf",   class:"Rogue",    level:8,  hp:141, maxHp:{base:172,bonus:0}, ac:15, initiative:4,  status:"alive",       color:"#f97316", stats:{STR:{base:12,bonus:0},CON:{base:14,bonus:0},DEX:{base:18,bonus:2},AGI:{base:16,bonus:0},CHA:{base:10,bonus:0}}, currency:{P:0,G:50,S:2,C:8},   inventory:["Shortsword +1","Thieves Tools","3× Smoke Bomb","Healer's Kit"],     conditions:[],          deathSaves:{s:0,f:0}, inspiration:true,  notes:"Wanted in Waterdeep (500gp bounty)", xp:34000 },
  { id:2, name:"Dion",          race:"Human",      class:"Fighter",  level:9,  hp:104, maxHp:{base:104,bonus:0}, ac:18, initiative:1,  status:"alive",       color:"#a78bfa", stats:{STR:{base:18,bonus:0},CON:{base:16,bonus:0},DEX:{base:12,bonus:0},AGI:{base:11,bonus:0},CHA:{base:10,bonus:0}}, currency:{P:0,G:120,S:0,C:0},  inventory:["Greatsword","Chain Mail","Shield of Faith"],                        conditions:[],          deathSaves:{s:0,f:0}, inspiration:false, notes:"",                                   xp:48000 },
  { id:3, name:"Theodore",      race:"High Elf",   class:"Wizard",   level:8,  hp:110, maxHp:{base:110,bonus:0}, ac:13, initiative:3,  status:"alive",       color:"#60a5fa", stats:{STR:{base:8, bonus:0},CON:{base:12,bonus:0},DEX:{base:14,bonus:0},AGI:{base:13,bonus:0},CHA:{base:11,bonus:0}}, currency:{P:0,G:80,S:0,C:0},   inventory:["Spellbook","Component Pouch","Staff of Power"],                     conditions:["Poisoned"], deathSaves:{s:0,f:0}, inspiration:false, notes:"Researching lichdom — watch him",     xp:34000 },
  { id:4, name:"Shoes",         race:"Tiefling",   class:"Bard",     level:8,  hp:112, maxHp:{base:112,bonus:0}, ac:14, initiative:5,  status:"alive",       color:"#34d399", stats:{STR:{base:10,bonus:0},CON:{base:13,bonus:0},DEX:{base:15,bonus:0},AGI:{base:14,bonus:0},CHA:{base:20,bonus:1}}, currency:{P:0,G:35,S:0,C:75},  inventory:["Rapier","Lute of Illusions","Healer's Kit","Bardic Inspiration ×3"],conditions:[],          deathSaves:{s:0,f:0}, inspiration:true,  notes:"",                                   xp:34000 },
  { id:5, name:"Cealum Ashryn", race:"Aasimar",    class:"Paladin",  level:9,  hp:100, maxHp:{base:108,bonus:0}, ac:20, initiative:0,  status:"alive",       color:"#fbbf24", stats:{STR:{base:18,bonus:0},CON:{base:16,bonus:0},DEX:{base:10,bonus:0},AGI:{base:9, bonus:0},CHA:{base:18,bonus:0}}, currency:{P:2,G:0,S:0,C:0},    inventory:["Holy Avenger","Plate Armor","Amulet of the Devout"],                conditions:[],          deathSaves:{s:0,f:0}, inspiration:false, notes:"Sworn to destroy the Lich King",      xp:48000 },
  { id:6, name:"Nellie",        race:"Wood Elf",   class:"Druid",    level:8,  hp:114, maxHp:{base:114,bonus:0}, ac:14, initiative:2,  status:"alive",       color:"#86efac", stats:{STR:{base:12,bonus:0},CON:{base:14,bonus:0},DEX:{base:16,bonus:0},AGI:{base:15,bonus:0},CHA:{base:13,bonus:0}}, currency:{P:0,G:90,S:5,C:0},   inventory:["Druidic Focus","Shillelagh","Wildshape ×2"],                        conditions:[],          deathSaves:{s:0,f:0}, inspiration:true,  notes:"",                                   xp:34000 },
  { id:7, name:"Aurelion Vale", race:"Dragonborn", class:"Sorcerer", level:9,  hp:23,  maxHp:{base:123,bonus:0}, ac:13, initiative:5,  status:"unconscious", color:"#f472b6", stats:{STR:{base:10,bonus:0},CON:{base:12,bonus:0},DEX:{base:14,bonus:0},AGI:{base:13,bonus:0},CHA:{base:20,bonus:0}}, currency:{P:0,G:55,S:3,C:0},   inventory:["Arcane Focus","Wand of Fireballs","Ring of Spell Storing"],         conditions:["Stunned"],  deathSaves:{s:1,f:2}, inspiration:false, notes:"",                                   xp:48000 },
].map(mkP);

// ══════════════════════════════════════════════════════════════
// 🔥 FIREBASE HOOK  — fixed real-time sync
// FIXES:
//  • firstFire flag separates initial-load from live-updates
//  • unmountedRef only blocks callbacks after component unmount
//  • firebaseActiveRef stops Firebase after fallback wins the race
//  • skipCount (number) handles async echo timing correctly
// ══════════════════════════════════════════════════════════════
function useFirebase() {
  const [status, setStatus] = useState("connecting");
  const state     = useRef({ pRef:null, set:null, unsub:null });
  const skipCount = useRef(0); // number of pending save-echoes to absorb

  // connect(onInitial, onUpdate, unmountedRef, firebaseActiveRef)
  //   onInitial(arr|null)  — called exactly once with first snapshot
  //   onUpdate(arr)        — called on every subsequent remote change
  const connect = useCallback(async (onInitial, onUpdate, unmountedRef, firebaseActiveRef) => {
    try {
      const [appMod, dbMod] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"),
      ]);
      const { initializeApp, getApps } = appMod;
      const { getDatabase, ref, onValue, set } = dbMod;

      if (unmountedRef.current || !firebaseActiveRef.current) return;

      const app  = getApps().length ? getApps()[0] : initializeApp(FB_CFG);
      const db   = getDatabase(app);
      const pRef = ref(db, "warTable/players");
      state.current = { pRef, set, unsub: null };

      let firstFire = true;

      const unsub = onValue(pRef, snap => {
        if (unmountedRef.current || !firebaseActiveRef.current) return;

        // Absorb save-echoes; count-based so async timing doesn't skip real updates
        if (skipCount.current > 0) { skipCount.current--; return; }

        const raw = snap.val();
        const arr = (raw && typeof raw === "object")
          ? Object.values(raw).filter(Boolean).map(mkP).sort((a,b) => a.id - b.id)
          : null;

        if (firstFire) {
          firstFire = false;
          onInitial(arr);             // seed defaults if DB is empty
        } else {
          if (arr && arr.length) onUpdate(arr); // live update from another device/tab
        }
        setStatus("live");
      }, err => {
        console.warn("[FB listener]", err?.message);
        if (!unmountedRef.current) setStatus("offline");
      });

      state.current.unsub = unsub;
    } catch (err) {
      console.warn("[Firebase]", err.message);
      if (!unmountedRef.current) setStatus("offline");
    }
  }, []);

  const save = useCallback((players) => {
    const { pRef, set: fbSet } = state.current;
    if (!pRef || !fbSet) return false;
    skipCount.current++;            // expect exactly one echo per save call
    const obj = {};
    players.forEach(p => { obj[`p_${p.id || Date.now()}`] = p; });
    fbSet(pRef, obj).catch(err => {
      console.warn("[FB save]", err.message);
      skipCount.current = Math.max(0, skipCount.current - 1); // rollback skip on failure
    });
    return true;
  }, []);

  useEffect(() => () => { state.current.unsub?.(); }, []);

  return { status, connect, save };
}

// ══════════════════════════════════════════════════════════════
// TOASTS
// ══════════════════════════════════════════════════════════════
function useToasts() {
  const [list, set] = useState([]);
  const push = useCallback((msg, type="info") => {
    const id = Date.now() + Math.random();
    set(t => [...t.slice(-5), {id,msg,type}]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  return [list, push];
}
const Toasts = memo(function Toasts({list}) {
  const C = { info:["#1a1628","#a78bfa"], success:["#061a0c","#4ade80"], danger:["#1a0606","#f87171"], gold:["#1a1200","#fbbf24"] };
  return (
    <div style={{position:"fixed",bottom:20,right:16,zIndex:9999,display:"flex",flexDirection:"column-reverse",gap:8,pointerEvents:"none",maxWidth:"min(340px,calc(100vw - 32px))"}}>
      {list.map(t => {
        const [bg,c] = C[t.type]||C.info;
        return (
          <div key={t.id} style={{
            background:bg,border:`1px solid ${c}44`,borderRadius:14,
            padding:"11px 16px",color:c,fontFamily:"'Crimson Pro',serif",fontSize:14,
            boxShadow:`${neu(6)},0 8px 32px #00000066`,
            animation:"tIn .3s cubic-bezier(.34,1.4,.64,1)",
            display:"flex",alignItems:"flex-start",gap:10,
            backdropFilter:"blur(12px)",
          }}>
            <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{t.type==="success"?"✅":t.type==="danger"?"⚠️":t.type==="gold"?"💰":"ℹ️"}</span>
            <span style={{lineHeight:1.45,flex:1}}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// SVG COMPONENTS
// ══════════════════════════════════════════════════════════════
const CoinSvg = memo(function CoinSvg({type, size=22}) {
  const c = COINS[type];
  const gid = `cg_${type}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink:0}}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%">
          <stop offset="0%" stopColor={c.gem}/>
          <stop offset="100%" stopColor={c.col}/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={c.bg} stroke={c.col} strokeWidth="1.4"/>
      <circle cx="12" cy="12" r="8"  fill={`url(#${gid})`} opacity=".82"/>
      <circle cx="12" cy="12" r="7"  fill="none" stroke={c.gem} strokeWidth=".5" opacity=".3"/>
      <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="800"
        fill={c.bg} fontFamily="Cinzel,serif">{type}</text>
      <ellipse cx="9" cy="9" rx="2.5" ry="1.4" fill="white" opacity=".22"
        transform="rotate(-30 9 9)"/>
    </svg>
  );
});

const ShieldSvg  = ({size=16,col="#94a3b8"}) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2L21 6.5V12c0 4.8-3.8 9-9 10.5C6.8 21 3 16.8 3 12V6.5L12 2z" stroke={col} strokeWidth="1.5" fill={col+"22"} strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const HeartSvg   = ({size=14,col="#f87171"}) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-9-7-9-13a5 5 0 0110 0 5 5 0 0110 0c0 6-9 13-11 13z" fill={col} opacity=".88"/><path d="M12 21s-9-7-9-13a5 5 0 0110 0 5 5 0 0110 0c0 6-9 13-11 13z" fill="none" stroke={col} strokeWidth=".5" opacity=".5"/><ellipse cx="9" cy="9" rx="2" ry="1.2" fill="white" opacity=".25" transform="rotate(-20 9 9)"/></svg>;
const SkullSvg   = ({size=16,col="#f87171",op=1}) => <svg width={size} height={size} viewBox="0 0 24 24" opacity={op}><path d="M12 3C7 3 3 7 3 12c0 3.1 1.6 5.9 4 7.4V21h10v-1.6c2.4-1.5 4-4.3 4-7.4 0-5-4-9-9-9z" fill={col+"33"} stroke={col} strokeWidth="1.3"/><circle cx="9" cy="12" r="1.8" fill={col}/><circle cx="15" cy="12" r="1.8" fill={col}/><path d="M10 17h4M11 17v2M13 17v2" stroke={col} strokeWidth="1.2" strokeLinecap="round"/></svg>;
const StarSvg    = ({size=13,col="#fbbf24",filled=false}) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l2.9 8.3H24l-7.1 5.2 2.7 8.3L12 18.6l-7.6 5.2 2.7-8.3L0 10.3h9.1L12 2z" stroke={col} strokeWidth="1.3" strokeLinejoin="round" fill={filled?col:"transparent"}/></svg>;
const SwordSvg   = ({size=14,col="#d4a96a"}) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M5 20L19 6" stroke={col} strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-2-3-3 2 2 2z" fill={col} strokeWidth=".5"/><path d="M5 20l-2 1 1-2z" fill={col}/><path d="M14 10l-4 4" stroke={col} strokeWidth="1.3" strokeLinecap="round" opacity=".5"/></svg>;

const Divider = ({col="#d4a96a44",w="100%"}) => (
  <svg width={w} height="14" viewBox="0 0 300 14" preserveAspectRatio="none" style={{display:"block"}}>
    <line x1="0" y1="7" x2="120" y2="7" stroke={col} strokeWidth="1"/>
    <polygon points="125,7 131,3 137,7 131,11" fill={col}/>
    <polygon points="143,7 149,4 155,7 149,10" fill={col} opacity=".5"/>
    <polygon points="161,7 167,4 173,7 167,10" fill={col} opacity=".3"/>
    <line x1="179" y1="7" x2="300" y2="7" stroke={col} strokeWidth="1"/>
  </svg>
);
const Corner = ({col="#d4a96a33",size=38,flip=false}) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" style={{transform:flip?"scaleX(-1)":"none",flexShrink:0}}>
    <path d="M2 2 L2 18 L5 18 L5 5 L18 5 L18 2 Z" fill={col}/>
    <path d="M2 2 L9 2 L9 5 L5 5 L5 9 L2 9 Z" fill={col} opacity=".5"/>
    <circle cx="5" cy="5" r="2.2" fill={col}/>
    <path d="M8 8 L18 8" stroke={col} strokeWidth=".7" opacity=".35"/>
    <path d="M8 8 L8 18" stroke={col} strokeWidth=".7" opacity=".35"/>
  </svg>
);

// BUG FIX #12: Starfield wrapped in memo — never re-renders
const Starfield = memo(function Starfield() {
  const stars = useRef(
    Array.from({length:140}, () => ({
      x: Math.random()*100, y: Math.random()*100,
      r: Math.random()*1.4+.3, dur: Math.random()*5+3,
      del: Math.random()*7,    op: Math.random()*.35+.05,
    }))
  ).current;
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}>
      {stars.map((s,i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
          style={{animation:`starP ${s.dur}s ${s.del}s ease-in-out infinite alternate`,opacity:s.op}}/>
      ))}
    </svg>
  );
});

const BgSvg = memo(function BgSvg() {
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="bg1" cx="18%" cy="18%" r="45%"><stop offset="0%" stopColor="#2e1055" stopOpacity=".5"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
        <radialGradient id="bg2" cx="82%" cy="78%" r="45%"><stop offset="0%" stopColor="#0e1a40" stopOpacity=".6"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
        <radialGradient id="bg3" cx="50%" cy="4%"  r="35%"><stop offset="0%" stopColor="#3d0a0a" stopOpacity=".3"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg1)"/>
      <rect width="100%" height="100%" fill="url(#bg2)"/>
      <rect width="100%" height="100%" fill="url(#bg3)"/>
      <circle cx="12%" cy="35%" r="140" stroke="#d4a96a06" strokeWidth="1" fill="none"/>
      <circle cx="88%" cy="65%" r="180" stroke="#7c3aed06" strokeWidth="1" fill="none"/>
    </svg>
  );
});

// ── HP Bar ────────────────────────────────────────────────────
const HPBar = memo(function HPBar({hp, max}) {
  const pct  = max > 0 ? clamp(hp/max*100, 0, 100) : 0;
  const col  = hpCol(hp, max);
  const crit = pct < 25 && hp > 0;
  return (
    <div style={{height:9,...nI(3),borderRadius:10,overflow:"hidden",position:"relative"}}>
      <div style={{
        width:`${pct}%`, height:"100%", borderRadius:10,
        background:`linear-gradient(90deg,${col}77,${col})`,
        transition:"width .7s cubic-bezier(.4,0,.2,1)",
        // BUG FIX #15: removed shimmer (transform translateX inside overflow:hidden unreliable)
        boxShadow: crit ? `0 0 14px ${col},0 0 6px ${col}` : `0 0 8px ${col}66`,
        animation: crit ? "critB 1.3s ease-in-out infinite" : undefined,
        position:"relative",
      }}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#ffffff28,transparent 55%)",borderRadius:10}}/>
      </div>
    </div>
  );
});

// ── Death Saves ───────────────────────────────────────────────
function DeathSaves({saves, onChange}) {
  const s = saves || {s:0,f:0};
  const dot = (filled, col, onClick) => (
    <button onClick={onClick} style={{
      width:22,height:22,borderRadius:"50%",
      border:`2px solid ${col}55`,
      background:filled?col:"transparent",
      cursor:onChange?"pointer":"default",
      transition:"all .2s",...nR(2),
      boxShadow:filled?`${neu(2)},0 0 10px ${col}88`:neu(2),
    }}/>
  );
  const toggleS = i => onChange?.({...s, s: s.s===i?i-1:i});
  const toggleF = i => onChange?.({...s, f: s.f===i?i-1:i});
  return (
    <div style={{...nI(4),borderRadius:12,padding:"10px 14px",border:"1px solid #f59e0b22",marginTop:8}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Death Saving Throws</div>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"#4ade80",marginBottom:5}}>✓ Success</div>
          <div style={{display:"flex",gap:5}}>{[1,2,3].map(i=>dot(i<=s.s,"#4ade80",()=>toggleS(i)))}</div>
        </div>
        <div style={{width:1,height:36,background:N.border}}/>
        <div>
          <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"#f87171",marginBottom:5}}>✗ Failure</div>
          <div style={{display:"flex",gap:5}}>{[1,2,3].map(i=>dot(i<=s.f,"#f87171",()=>toggleF(i)))}</div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Chips (card display) ─────────────────────────────────
function StatChips({stats}) {
  return (
    <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
      {STAT_DEFS.map(({k,col,icon}) => {
        const st    = stats?.[k] || {base:10,bonus:0};
        const bonus = safeInt(st.bonus,0);
        const eff   = st.base + bonus;
        return (
          <div key={k} style={{
            ...nI(3),borderRadius:9,padding:"5px 8px",textAlign:"center",
            border:`1px solid ${col}28`,minWidth:48,flexShrink:0,
            background:`linear-gradient(160deg,${col}0a,transparent)`,
          }}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:col,letterSpacing:1.2,textTransform:"uppercase",marginBottom:3}}>{k}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:14,color:N.text,fontWeight:700,lineHeight:1}}>{st.base}</div>
            {bonus!==0 && (
              <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:bonus>0?"#4ade80":"#f87171",fontWeight:600,lineHeight:1,marginTop:2}}>
                {bonus>0?"+":""}{bonus}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Currency Badge + Click-to-Convert ────────────────────────
// BUG FIX #9: useEffect cleanup prevents memory leak on unmount
// BUG FIX #10/#11: fmtConv handles tiny fractions gracefully
// BUG FIX #25: dropdown flips left if near right edge
function CoinBadge({type, amount}) {
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef(null);
  const dropdownRef       = useRef(null);
  const coin = COINS[type];
  const conversions = useMemo(() => getConversions(type, amount), [type, amount]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Smart vertical positioning — flip up if not enough room below
  const [flipUp, setFlipUp] = useState(false);
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setFlipUp(spaceBelow < 240);
  }, [open]);

  if (!amount) return null;

  return (
    <div ref={containerRef} style={{position:"relative",display:"inline-block"}}>
      <button
        onClick={() => setOpen(o=>!o)}
        style={{
          display:"flex", alignItems:"center", gap:5,
          background: open ? coin.bg : N.surface,
          border:`1px solid ${open ? coin.col : coin.col+"44"}`,
          borderRadius:10, padding:"4px 10px", cursor:"pointer",
          transition:"all .2s cubic-bezier(.4,0,.2,1)",
          boxShadow: open
            ? `${neu(2)}, 0 0 16px ${coin.col}33, inset 0 1px 0 ${coin.col}22`
            : neu(3),
        }}>
        <CoinSvg type={type} size={18}/>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:12,color:coin.col,fontWeight:700,letterSpacing:.3}}>
          {amount.toLocaleString()}
        </span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:coin.col,opacity:.55,marginLeft:1}}>
          {coin.label}
        </span>
        <span style={{
          fontSize:7, color:coin.col, opacity:.5, marginLeft:2,
          transition:"transform .2s", display:"inline-block",
          transform: open ? "rotate(180deg)" : "none"
        }}>▼</span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="coin-dropdown"
          style={{
            position:"absolute",
            ...(flipUp
              ? { bottom:"calc(100% + 8px)", top:"auto" }
              : { top:"calc(100% + 8px)",   bottom:"auto" }),
            right:0, left:"auto",
            zIndex:9999,
            width:230,
            maxHeight:280,
            overflowY:"auto",
            ...nR(10),
            border:`1px solid ${coin.col}55`,
            borderRadius:16,
            boxShadow:`${neu(10)}, 0 0 32px ${coin.col}28, 0 20px 60px #00000088`,
            animation:"fadeUp .18s cubic-bezier(.34,1.4,.64,1) both",
          }}>
          {/* Sticky header */}
          <div style={{
            position:"sticky", top:0, zIndex:1,
            display:"flex", alignItems:"center", gap:10,
            padding:"12px 14px 10px",
            background:`linear-gradient(180deg,${coin.bg}ff 80%,${coin.bg}00)`,
            borderBottom:`1px solid ${coin.col}22`,
          }}>
            <div style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:`linear-gradient(135deg,${coin.col}22,${coin.col}08)`,
              border:`1px solid ${coin.col}44`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 0 12px ${coin.col}22`,
            }}>
              <CoinSvg type={type} size={24}/>
            </div>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:coin.col,fontWeight:700,lineHeight:1.2}}>
                {amount.toLocaleString()} {coin.name}
              </div>
              <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:N.dim,fontStyle:"italic",marginTop:2}}>
                Visual conversion only
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{
              marginLeft:"auto", flexShrink:0, width:22, height:22, borderRadius:6,
              background:N.border+"44", border:"none", color:N.dim,
              fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            }}>✕</button>
          </div>

          {/* Conversion rows */}
          <div style={{padding:"8px 14px 4px"}}>
            {COIN_KEYS.filter(k=>k!==type).map((k,i) => {
              const cv = conversions[k];
              const ck = COINS[k];
              const isLarger = ck.rate > coin.rate;
              return (
                <div key={k} style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding:"8px 0",
                  borderBottom: i < 2 ? `1px solid ${N.border}44` : "none",
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:8, flexShrink:0,
                    background:`linear-gradient(135deg,${ck.col}18,${ck.col}06)`,
                    border:`1px solid ${ck.col}33`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <CoinSvg type={k} size={20}/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:ck.col,fontWeight:700,lineHeight:1.1}}>
                      {fmtConv(cv)}
                      <span style={{fontFamily:"'Crimson Pro',serif",fontSize:10,opacity:.6,marginLeft:4,fontWeight:400}}>{ck.label}</span>
                    </div>
                    <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:N.dim,marginTop:1}}>
                      {isLarger?"⬆":"⬇"} {ck.name}
                    </div>
                  </div>
                  <div style={{
                    fontSize:9, fontFamily:"'Cinzel',serif",
                    color: isLarger ? "#4ade8088" : "#f8717188",
                    padding:"2px 6px", borderRadius:5,
                    border:`1px solid ${isLarger?"#4ade8022":"#f8717122"}`,
                    background: isLarger?"#0a2d1444":"#2d0a0a44",
                  }}>
                    {isLarger ? "higher" : "lower"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer rate card */}
          <div style={{
            padding:"8px 14px 12px",
            borderTop:`1px solid ${N.border}44`,
          }}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,textAlign:"center"}}>
              Exchange Rates
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px"}}>
              {["1P = 10G","10G = 1P","1G = 10S","1S = 10G","1G = 100C","100C = 1G","1P = 100S","1P = 1,000C"].map((r,i)=>(
                <div key={i} style={{
                  fontFamily:"'Crimson Pro',serif", fontSize:10, color:"#4a4470",
                  padding:"2px 0", textAlign:"center",
                }}>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletRow({currency}) {
  const hasSome = COIN_KEYS.some(k => (currency?.[k]||0) > 0);
  if (!hasSome) return (
    <span style={{fontFamily:"'Crimson Pro',serif",color:"#383060",fontSize:12,fontStyle:"italic",display:"block",paddingTop:2}}>
      Empty purse
    </span>
  );
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:2}}>
      {COIN_KEYS.map(k => (currency?.[k]||0) > 0 ? <CoinBadge key={k} type={k} amount={currency[k]}/> : null)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PLAYER CARD
// ══════════════════════════════════════════════════════════════
const PlayerCard = memo(function PlayerCard({player:p, isDM, onEdit}) {
  const [hov, setHov] = useState(false);
  const sm     = ST_MAP[p.status] || ST_MAP.alive;
  const isDead = p.status === "dead";
  const isDown = p.status === "unconscious";
  const maxHP  = effMaxHp(p);
  const hpPct  = maxHP > 0 ? Math.round(p.hp/maxHP*100) : 0;
  const col    = p.color;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => isDM && onEdit(p)}
      style={{
        position:"relative", borderRadius:20,
        background: N.surface,
        border: `1px solid ${hov ? col+"66" : N.border}`,
        boxShadow: hov
          ? `-8px -8px 20px ${N.light}, 8px 8px 20px ${N.dark}, 0 0 44px ${col}1c, inset 0 1px 0 ${col}22`
          : neu(7),
        transform: hov && !isDead ? "translateY(-6px) scale(1.005)" : "none",
        transition: "all .3s cubic-bezier(.4,0,.2,1)",
        cursor: isDM ? "pointer" : "default",
        opacity: isDead ? .5 : 1,
        overflow:"visible",
      }}>

      {/* Top accent line */}
      <div style={{height:4,background:`linear-gradient(90deg,${col}dd,${col}44,transparent)`,borderRadius:"20px 20px 0 0"}}/>

      {/* Corner ornaments */}
      <div style={{position:"absolute",top:4,left:0,zIndex:2,opacity:hov ? 0.7 : 0.25,transition:"opacity .3s"}}><Corner col={col} size={34}/></div>
      <div style={{position:"absolute",top:4,right:0,zIndex:2,opacity:hov ? 0.7 : 0.25,transition:"opacity .3s"}}><Corner col={col} size={34} flip/></div>

      {/* Bg glow */}
      <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,background:`radial-gradient(circle,${col}0e,transparent 70%)`,pointerEvents:"none",opacity:hov?1:.3,transition:"opacity .3s"}}/>

      {/* Dead watermark */}
      {isDead && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,pointerEvents:"none"}}>
          <SkullSvg size={80} col="#ef4444" op={.06}/>
        </div>
      )}

      <div style={{padding:"14px 16px 18px",position:"relative",zIndex:2}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:11}}>
          <div style={{
            width:44,height:44,borderRadius:12,flexShrink:0,
            background:`linear-gradient(145deg,${col}22,${col}0a)`,
            border:`1px solid ${col}44`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:21,...nR(4),
          }}>{CLS_G[p.class]||"⚡"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,color:N.text,letterSpacing:.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontFamily:"'Crimson Pro',serif",color:col,fontSize:13,marginTop:1}}>{p.race} {p.class} · Lv {p.level}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:9,padding:"3px 8px",borderRadius:99,background:sm.bg,color:sm.c,border:`1px solid ${sm.c}33`,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:sm.dot,boxShadow:`0 0 5px ${sm.dot}`,flexShrink:0}}/>
              {sm.l}
            </span>
            {p.inspiration && (
              <span style={{display:"flex",alignItems:"center",gap:3,fontFamily:"'Cinzel',serif",fontSize:9,color:"#fbbf24"}}>
                <StarSvg size={10} col="#fbbf24" filled/>Inspired
              </span>
            )}
          </div>
        </div>

        {/* HP */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <HeartSvg size={13} col={hpCol(p.hp,maxHP)}/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:1.5,textTransform:"uppercase"}}>HP</span>
            </div>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:13,color:hpCol(p.hp,maxHP),fontWeight:700}}>
              {p.hp}
              <span style={{color:N.dim,fontWeight:400,fontSize:11}}>/{maxHP}</span>
              {p.maxHp?.bonus>0&&<span style={{color:"#4ade80",fontSize:10,marginLeft:3}}>+{p.maxHp.bonus}</span>}
              <span style={{color:N.dim,fontSize:10,marginLeft:4}}>({hpPct}%)</span>
            </span>
          </div>
          <HPBar hp={p.hp} max={maxHP}/>
        </div>

        {/* Death saves (only when unconscious) */}
        {isDown && <div style={{marginBottom:10}}><DeathSaves saves={p.deathSaves}/></div>}

        {/* D&D Stats */}
        <div style={{marginBottom:10}}><StatChips stats={p.stats}/></div>

        {/* AC + Initiative row */}
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <div style={{...nI(3),borderRadius:9,padding:"5px 10px",display:"flex",alignItems:"center",gap:5}}>
            <ShieldSvg size={11} col={N.dim}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:N.dim}}>{p.ac}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,letterSpacing:1,textTransform:"uppercase"}}>AC</span>
          </div>
          {p.initiative !== 0 && (
            <div style={{...nI(3),borderRadius:9,padding:"5px 10px",display:"flex",alignItems:"center",gap:5}}>
              <StarSvg size={11} col="#a78bfa"/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:"#a78bfa"}}>
                {p.initiative > 0 ? "+" : ""}{p.initiative}
              </span>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,letterSpacing:1,textTransform:"uppercase"}}>INIT</span>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div style={{marginBottom:10}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>
            Wallet · tap to convert
          </div>
          <WalletRow currency={p.currency}/>
        </div>

        {/* Conditions */}
        {p.conditions?.length>0 && (
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,maxHeight:56,overflowY:"auto"}}>
            {p.conditions.map(c => (
              <span key={c} style={{fontSize:10,padding:"2px 7px",borderRadius:5,...nR(2),background:"#2d0808",border:"1px solid #ef444428",color:"#fca5a5",fontFamily:"'Cinzel',serif",letterSpacing:.3}}>
                {COND_G[c]} {c}
              </span>
            ))}
          </div>
        )}

        {/* Inventory */}
        <div style={{...nI(3),borderRadius:12,padding:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
            <SwordSvg size={11} col={N.dim}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,letterSpacing:2,textTransform:"uppercase"}}>Inventory</span>
          </div>
          {p.inventory?.length > 0 ? (
            <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:72,overflowY:"auto"}}>
              {p.inventory.map((item,i) => (
                <span key={i} style={{fontSize:11,fontFamily:"'Crimson Pro',serif",...nR(2),borderRadius:5,padding:"2px 8px",color:"#c4b5fd",border:"1px solid #3a3060",flexShrink:0}}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span style={{fontFamily:"'Crimson Pro',serif",color:"#383060",fontSize:12,fontStyle:"italic"}}>Empty satchel</span>
          )}
        </div>

        {p.notes && (
          <div style={{marginTop:9,fontFamily:"'Crimson Pro',serif",fontSize:12,color:N.dim,fontStyle:"italic",borderTop:`1px solid ${N.border}`,paddingTop:7,lineHeight:1.5}}>
            📝 {p.notes.slice(0,80)}{p.notes.length>80?"…":""}
          </div>
        )}

        {isDM && hov && (
          <div style={{position:"absolute",bottom:10,right:12}}>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:col,...nR(2),padding:"2px 8px",borderRadius:5,border:`1px solid ${col}33`}}>
              ✏️ Edit
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// MODAL SHELL
// ══════════════════════════════════════════════════════════════
function Modal({onClose, children, maxW=660, title}) {
  useEffect(() => {
    const esc = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed",inset:0,zIndex:1000,
        background:"#00000099",backdropFilter:"blur(16px) saturate(120%)",
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"16px",overflowY:"auto",
        animation:"fadeIn .15s ease both",
      }}>
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          width:"100%",maxWidth:maxW,
          background:`linear-gradient(160deg,${N.surface},${N.base})`,
          border:`1px solid ${N.border}`,borderRadius:26,
          boxShadow:`-16px -16px 40px ${N.light}88, 16px 16px 40px ${N.dark}, 0 0 80px #00000088`,
          animation:"mPop .28s cubic-bezier(.34,1.4,.64,1) both",
          maxHeight:"calc(100dvh - 32px)",
          display:"flex",flexDirection:"column",
          position:"relative",overflow:"hidden",
        }}>
        {/* Corner ornaments */}
        <div style={{position:"absolute",top:0,left:0,zIndex:0,pointerEvents:"none"}}><Corner col="#d4a96a22" size={56}/></div>
        <div style={{position:"absolute",top:0,right:0,zIndex:0,pointerEvents:"none"}}><Corner col="#d4a96a22" size={56} flip/></div>

        {/* Sticky title */}
        {title && (
          <div style={{
            position:"relative",zIndex:1,flexShrink:0,
            textAlign:"center",padding:"22px 28px 16px",
            borderBottom:`1px solid ${N.border}`,
            background:`linear-gradient(180deg,${N.surface},${N.surface}aa)`,
            backdropFilter:"blur(10px)",
          }}>
            <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:15,color:N.gold,letterSpacing:.5}}>{title}</div>
            <div style={{marginTop:8}}><Divider/></div>
          </div>
        )}

        {/* Scrollable body */}
        <div
          className="modal-inner"
          style={{flex:1,overflowY:"auto",padding:"22px 26px 24px",position:"relative"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Form primitives ───────────────────────────────────────────
function FL({children}) {
  return <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:N.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{children}</div>;
}
const inputBase = () => ({
  width:"100%", boxSizing:"border-box", ...nI(3),
  border:`1px solid ${N.border}`, borderRadius:10,
  padding:"9px 12px", color:N.text,
  fontFamily:"'Crimson Pro',serif", fontSize:15, outline:"none",
  transition:"border-color .2s,box-shadow .2s",
});
const fFocus = e => { e.target.style.borderColor=N.accent; e.target.style.boxShadow=`${neu(3,true)},0 0 0 2px ${N.accent}22`; };
const fBlur  = e => { e.target.style.borderColor=N.border; e.target.style.boxShadow=neu(3,true); };

// BUG FIX #5: number inputs use empty string for UX, but never NaN-propagate to state
function FInp({label, value, onChange, type="text", min, max, placeholder, rows}) {
  // For number inputs: keep a local display string so user can type "-" or "" mid-edit
  const [disp, setDisp] = useState(String(value ?? ""));
  // Keep display in sync if parent value changes externally
  const prevVal = useRef(value);
  if (prevVal.current !== value) {
    prevVal.current = value;
    const ext = String(value ?? "");
    if (disp !== ext && !(type==="number" && (disp==="-" || disp===""))) {
      setDisp(ext);
    }
  }

  const handleChange = e => {
    const v = e.target.value;
    if (type === "number") {
      setDisp(v);
      if (v === "" || v === "-") return; // don't propagate incomplete input
      const n = Number(v);
      if (!isNaN(n)) onChange(clamp(n, min ?? -999, max ?? 99999));
    } else {
      setDisp(v);
      onChange(v);
    }
  };
  const handleBlur = () => {
    if (type === "number") {
      const n = parseFloat(disp);
      const clamped = isNaN(n) ? (min ?? 0) : clamp(n, min ?? -999, max ?? 99999);
      setDisp(String(clamped));
      onChange(clamped);
    }
  };
  const displayVal = type === "number" ? disp : value;
  const style = {...inputBase()};
  return (
    <div style={{marginBottom:14}}>
      {label && <FL>{label}</FL>}
      {rows
        ? <textarea value={displayVal} onChange={handleChange} onBlur={handleBlur} rows={rows} placeholder={placeholder}
            style={{...style,resize:"vertical"}} onFocus={fFocus}/>
        : <input type={type==="number"?"text":type} value={displayVal} inputMode={type==="number"?"numeric":undefined}
            placeholder={placeholder} onChange={handleChange} onBlur={handleBlur}
            style={style} onFocus={fFocus}/>
      }
    </div>
  );
}
function FSel({label, value, onChange, opts}) {
  return (
    <div style={{marginBottom:14}}>
      {label && <FL>{label}</FL>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{...inputBase(),cursor:"pointer"}}>
        {opts.map(o => typeof o==="string"
          ? <option key={o} style={{background:N.base}}>{o}</option>
          : <option key={o.v} value={o.v} style={{background:N.base}}>{o.l}</option>
        )}
      </select>
    </div>
  );
}
function FBtn({children, onClick, v="primary", style:s={}, disabled=false}) {
  const [hov, setH] = useState(false);
  const T = {
    primary: {bg:"#2e1f50",hbg:"#3d2a6a",b:N.accent},
    success: {bg:"#0d2e18",hbg:"#143d22",b:"#4ade80"},
    danger:  {bg:"#2e0e0e",hbg:"#3d1212",b:"#f87171"},
    ghost:   {bg:"transparent",hbg:N.surface,b:N.border},
    gold:    {bg:"#2e2000",hbg:"#3d2c00",b:"#fbbf24"},
  }[v] || {bg:"#2e1f50",hbg:"#3d2a6a",b:N.accent};
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: hov&&!disabled ? T.hbg : T.bg,
        border: `1px solid ${T.b}44`, borderRadius:10, padding:"9px 18px",
        color: disabled ? "#444" : N.text,
        fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:.5,
        cursor: disabled ? "not-allowed" : "pointer",
        transition:"all .2s", opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? "none" : neu(4),
        display:"inline-flex", alignItems:"center", gap:7, ...s
      }}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// STAT EDITOR (modal)
// BUG FIX #6: allow temporary empty/partial input
// ══════════════════════════════════════════════════════════════
function StatEditor({stats, onChange}) {
  // Local state to allow empty strings while typing
  const [local, setLocal] = useState(() =>
    STAT_DEFS.reduce((acc,{k}) => ({
      ...acc,
      [k]: { base: String(stats?.[k]?.base||10), bonus: safeInt(stats?.[k]?.bonus,0) }
    }), {})
  );

  // Sync if stats identity changes (different player passed in)
  const statsRef = useRef(stats);
  useEffect(() => {
    if (statsRef.current !== stats) {
      statsRef.current = stats;
      setLocal(STAT_DEFS.reduce((acc,{k}) => ({
        ...acc,
        [k]: { base: String(stats?.[k]?.base||10), bonus: safeInt(stats?.[k]?.bonus,0) }
      }), {}));
    }
  }, [stats]);

  // When base loses focus, commit the value
  const commitBase = (k) => {
    const n = clamp(local[k].base === "" ? 10 : local[k].base, 1, 30);
    setLocal(l => ({...l, [k]: {...l[k], base: String(n)}}));
    onChange(STAT_DEFS.reduce((acc, {k:sk}) => ({
      ...acc,
      [sk]: {
        base:  sk === k ? n : clamp(local[sk].base === "" ? 10 : local[sk].base, 1, 30),
        bonus: local[sk].bonus,
      },
    }), {}));
  };

  const adjBonus = (k, delta) => {
    const newBonus = (local[k].bonus||0) + delta;
    const updated = {...local, [k]: {...local[k], bonus:newBonus}};
    setLocal(updated);
    // Only propagate the stat being adjusted; use safeInt with fallback 10 for empty fields
    onChange(STAT_DEFS.reduce((acc,{k:sk}) => ({
      ...acc,
      [sk]: {
        base:  clamp(local[sk].base === "" ? 10 : local[sk].base, 1, 30),
        bonus: sk === k ? newBonus : local[sk].bonus,
      },
    }), {}));
  };

  return (
    <div style={{...nI(4),borderRadius:14,padding:14,overflowX:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(58px,1fr))",gap:8,minWidth:310}}>
        {STAT_DEFS.map(({k,col,name,icon}) => {
          const bonus = local[k]?.bonus||0;
          return (
            <div key={k} style={{textAlign:"center"}}>
              <div style={{marginBottom:4,fontSize:16}}>{icon}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:col,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{k}</div>
              {/* Base input */}
              <input type="text" inputMode="numeric" value={local[k]?.base||""} min={1} max={30}
                onChange={e => setLocal(l => ({...l, [k]:{...l[k],base:e.target.value}}))}
                style={{width:"100%",boxSizing:"border-box",...nI(3),border:`1px solid ${col}33`,borderRadius:8,padding:"6px 4px",color:N.text,fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700,textAlign:"center",outline:"none",marginBottom:4}}
                onFocus={e=>{e.target.style.borderColor=col;e.target.style.boxShadow=`${neu(2,true)},0 0 0 2px ${col}22`;}}
                onBlur={e => { commitBase(k); e.target.style.borderColor=`${col}33`; e.target.style.boxShadow=neu(2,true); }}
              />
              {/* Bonus display */}
              <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:bonus>0?"#4ade80":bonus<0?"#f87171":N.dim,minHeight:18,marginBottom:5}}>
                {bonus>0?`+${bonus}`:bonus<0?String(bonus):"—"}
              </div>
              {/* Bonus ± buttons */}
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                {[[-1,"#f87171","#2d0a0a"],[+1,"#4ade80","#0a2d14"]].map(([d,c,bg])=>(
                  <button key={d} onClick={()=>adjBonus(k,d)}
                    style={{width:24,height:24,...nR(3),border:`1px solid ${c}33`,borderRadius:7,color:c,fontFamily:"'Cinzel',serif",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=bg}
                    onMouseLeave={e=>e.currentTarget.style.background=N.surface}>
                    {d>0?"+":"−"}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:"'Crimson Pro',serif",fontSize:9,color:N.dim,marginTop:4,fontStyle:"italic"}}>{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CURRENCY EDITOR (modal)
// ══════════════════════════════════════════════════════════════
function CurrencyEditor({currency, onChange}) {
  const upd = (k,v) => onChange({...currency, [k]: Math.max(0, safeInt(v,0))});
  const adj = (k,n) => onChange({...currency, [k]: Math.max(0, (currency[k]||0)+n)});
  const totalCopper = toCopper(currency);

  return (
    <div style={{...nI(5),borderRadius:14,padding:16}}>
      {/* Coin inputs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(64px,1fr))",gap:10,marginBottom:14,overflowX:"auto"}}>
        {COIN_KEYS.map(k => {
          const coin = COINS[k];
          return (
            <div key={k} style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:5}}><CoinSvg type={k} size={28}/></div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:coin.col,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{coin.name}</div>
              <input type="text" inputMode="numeric" value={currency[k]??0} min={0}
                onChange={e => upd(k, e.target.value)}
                onBlur={e => { const v=parseInt(e.target.value); upd(k, isNaN(v)?0:Math.max(0,v)); e.target.style.borderColor=`${coin.col}33`; }}
                style={{width:"100%",boxSizing:"border-box",...nI(2),border:`1px solid ${coin.col}33`,borderRadius:8,padding:"7px 4px",color:coin.col,fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,textAlign:"center",outline:"none"}}
                onFocus={e=>{e.target.style.borderColor=coin.col;}}/>              <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:5}}>
                {[-5,-1,1,5].map(n => (
                  <button key={n} onClick={() => adj(k,n)}
                    style={{...nR(2),border:`1px solid ${coin.col}33`,borderRadius:6,padding:"2px 6px",color:n>0?coin.col:"#f87171",fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer"}}>
                    {n>0?"+":""}{n}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:N.dim,marginTop:3,fontStyle:"italic"}}>{coin.label}</div>
            </div>
          );
        })}
      </div>

      {/* Exchange rates */}
      <div style={{...nR(3),borderRadius:10,padding:10,marginBottom:10}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:6,textAlign:"center"}}>Exchange Rates</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"3px 12px",fontFamily:"'Crimson Pro',serif",fontSize:12}}>
          {["1P = 10G","1P = 100S","1P = 1,000C","1G = 10S","1G = 100C","1S = 10C"].map((r,i)=>(
            <div key={i} style={{color:N.dim,textAlign:"center",padding:"2px 0",borderBottom:`1px solid ${N.border}44`}}>{r}</div>
          ))}
        </div>
      </div>

      {/* Total value */}
      <div style={{textAlign:"center",fontFamily:"'Crimson Pro',serif",fontSize:13,color:N.dim}}>
        Total: <span style={{color:N.gold,fontWeight:600}}>{totalCopper.toLocaleString()} cp</span>
        {totalCopper >= 100  && <span style={{color:COINS.G.col}}> · {(totalCopper/100).toFixed(1)} gp</span>}
        {totalCopper >= 1000 && <span style={{color:COINS.P.col}}> · {(totalCopper/1000).toFixed(2)} pp</span>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EDIT MODAL
// ══════════════════════════════════════════════════════════════
function EditModal({player, onSave, onDelete, onClose}) {
  const [f, setF] = useState({
    ...player,
    inventoryText: (player.inventory||[]).join(", "),
  });
  const u = (k,v) => setF(x => ({...x, [k]:v}));

  // BUG FIX #5: safe HP adjustment
  const adjHp = n => {
    u("hp", clamp((safeInt(f.hp,0)) + n, 0, effMaxHp(f)));
  };

  const save = () => {
    if (!String(f.name).trim()) { alert("Character needs a name!"); return; }
    const inventory = f.inventoryText.split(",").map(s=>s.trim()).filter(Boolean);
    onSave(mkP({...f, inventory}));
  };

  const tglCond = c => {
    const cur = f.conditions || [];
    u("conditions", cur.includes(c) ? cur.filter(x=>x!==c) : [...cur,c]);
  };

  const maxHP = effMaxHp(f);
  const hpPct = maxHP > 0 ? Math.round(safeInt(f.hp,0)/maxHP*100) : 0;

  return (
    <Modal onClose={onClose} maxW={700} title={`⚔️ ${f.name||"Character"}`}>
      {/* Live HP preview */}
      <div style={{...nI(5),borderRadius:16,padding:"14px 18px",marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:26}}>{CLS_G[f.class]||"⚡"}</div>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:14,color:N.text}}>{f.name}</div>
              <div style={{fontFamily:"'Crimson Pro',serif",color:f.color,fontSize:13}}>{f.race} {f.class} · Lv {f.level}</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:26,color:hpCol(safeInt(f.hp,0),maxHP),fontWeight:700,lineHeight:1}}>
              {safeInt(f.hp,0)}<span style={{color:N.dim,fontSize:14,fontWeight:400}}>/{maxHP}</span>
            </div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:N.dim}}>{hpPct}% HP</div>
          </div>
        </div>
        <HPBar hp={safeInt(f.hp,0)} max={maxHP}/>
      </div>

      {/* Quick HP adjust */}
      <div style={{...nR(4),borderRadius:14,padding:"12px 16px",marginBottom:16,border:`1px solid ${N.gold}18`}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:N.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          <HeartSvg size={13} col={N.gold}/>Quick HP
        </div>
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
          {[-20,-10,-5,-1,1,5,10,20].map(n => {
            const pos = n>0; const c = pos?"#4ade80":"#f87171";
            return (
              <button key={n} onClick={() => adjHp(n)}
                style={{...nR(3),background:pos?"#0a2014":"#200a0a",border:`1px solid ${c}33`,borderRadius:8,padding:"5px 12px",color:c,fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer",transition:"all .15s",flexShrink:0,whiteSpace:"nowrap"}}>
                {n>0?"+":""}{n} HP
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))",gap:"0 20px"}}>
        <FInp label="Name" value={f.name} onChange={v=>u("name",v)} placeholder="Character name..."/>
        <FSel label="Race"  value={f.race}  onChange={v=>u("race",v)}  opts={RACES}/>
        <FSel label="Class" value={f.class} onChange={v=>u("class",v)} opts={CLASSES}/>
        <FInp label="Level" value={f.level} onChange={v=>u("level",v)} type="number" min={1} max={20}/>
        <FSel label="Status" value={f.status} onChange={v=>u("status",v)} opts={[{v:"alive",l:"✅ Alive"},{v:"unconscious",l:"💛 Unconscious"},{v:"dead",l:"☠️ Dead"}]}/>
        <FInp label="Armor Class" value={f.ac} onChange={v=>u("ac",v)} type="number" min={1} max={30}/>
        <FInp label="Current HP" value={f.hp} onChange={v=>u("hp",v)} type="number" min={0} max={effMaxHp(f)}/>
          
        <div style={{marginBottom:14}}>
          <FL>Max HP (base + bonus)</FL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 32px 1fr",gap:8,alignItems:"center"}}>
            <input type="text" inputMode="numeric" value={f.maxHp?.base||20} min={1}
              onChange={e=>{const v=e.target.value;if(v===""||!isNaN(Number(v)))u("maxHp",{...f.maxHp,base:v===""?1:clamp(Number(v),1,999)});}}
              style={{...inputBase(),textAlign:"center"}} onFocus={fFocus} onBlur={fBlur}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:13,color:N.dim,textAlign:"center"}}>+</span>
            <input type="text" inputMode="numeric" value={f.maxHp?.bonus??0} min={0}
              onChange={e=>{const v=e.target.value;if(v===""||!isNaN(Number(v)))u("maxHp",{...f.maxHp,bonus:v===""?0:clamp(Number(v),0,999)});}}
              style={{...inputBase(),textAlign:"center",color:"#4ade80"}}
              onFocus={e=>{e.target.style.borderColor=N.accent;e.target.style.boxShadow=`${neu(3,true)},0 0 0 2px ${N.accent}22`;}}
              onBlur={e=>{e.target.style.borderColor="#4ade8033";e.target.style.boxShadow=neu(3,true);}}/>
          </div>
          <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:N.dim,marginTop:4,fontStyle:"italic"}}>
            Effective: {effMaxHp(f)} HP total
          </div>
        </div>
        <FInp label="Initiative" value={f.initiative} onChange={v=>u("initiative",v)} type="number" min={-10} max={20}/>
        <div style={{marginBottom:14}}>
          <FL>Accent Color</FL>
          <input type="color" value={f.color} onChange={e=>u("color",e.target.value)}
            style={{width:"100%",height:42,...nI(3),border:`1px solid ${N.border}`,borderRadius:10,cursor:"pointer",padding:3}}/>
        </div>
      </div>

      {/* Inspiration */}
      <div style={{marginBottom:16}}>
        <button onClick={()=>u("inspiration",!f.inspiration)} style={{
          display:"flex",alignItems:"center",gap:8,...nR(3),
          background:f.inspiration?"#2a1c00":"transparent",
          border:`1px solid ${f.inspiration?"#fbbf2466":N.border}`,
          borderRadius:10,padding:"9px 16px",cursor:"pointer",transition:"all .2s",
          color:f.inspiration?"#fbbf24":N.dim,fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:.5,
        }}>
          <StarSvg size={14} col="#fbbf24" filled={f.inspiration}/>
          {f.inspiration?"✨ Inspired!":"Grant Inspiration"}
        </button>
      </div>

      {/* Stats */}
      <div style={{marginBottom:16}}>
        <FL>⚔️ Character Stats  (set base · ±bonus points)</FL>
        <StatEditor stats={f.stats} onChange={v=>u("stats",v)}/>
      </div>

      {/* Currency */}
      <div style={{marginBottom:16}}>
        <FL>💰 Wallet — Platinum · Gold · Silver · Copper</FL>
        <CurrencyEditor currency={f.currency} onChange={v=>u("currency",v)}/>
      </div>

      {/* Death saves (only when down) */}
      {/* BUG FIX #28: also reset death saves when status set to alive */}
      {f.status === "unconscious" && (
        <div style={{marginBottom:14}}>
          <DeathSaves saves={f.deathSaves} onChange={v=>u("deathSaves",v)}/>
        </div>
      )}

      <FInp label="Inventory (comma-separated)" value={f.inventoryText} onChange={v=>u("inventoryText",v)} rows={3} placeholder="Longsword, Potion of Healing, Rope..."/>

      {/* Conditions */}
      <div style={{marginBottom:14}}>
        <FL>Active Conditions</FL>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,maxHeight:110,overflowY:"auto",paddingRight:2}}>
          {CONDS.map(c => {
            const on = (f.conditions||[]).includes(c);
            return (
              <button key={c} onClick={() => tglCond(c)}
                style={{fontSize:11,padding:"4px 10px",borderRadius:8,...nR(2),cursor:"pointer",transition:"all .15s",border:`1px solid ${on?"#f8717155":N.border}`,background:on?"#2d0a0a":"transparent",color:on?"#fca5a5":N.dim,fontFamily:"'Cinzel',serif",letterSpacing:.3,flexShrink:0}}
                onMouseEnter={e=>{if(!on){e.currentTarget.style.borderColor=N.accent;e.currentTarget.style.color="#a78bfa";}}}
                onMouseLeave={e=>{if(!on){e.currentTarget.style.borderColor=N.border;e.currentTarget.style.color=N.dim;}}}>
                {COND_G[c]} {c}
              </button>
            );
          })}
        </div>
      </div>

      <FInp label="🔒 DM Notes (private)" value={f.notes||""} onChange={v=>u("notes",v)} rows={2} placeholder="Secrets, plot hooks, motivations..."/>

      <div style={{margin:"10px 0 0"}}><Divider/></div>

      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"center",
        flexWrap:"wrap",gap:8,
        position:"sticky",bottom:0,paddingTop:12,paddingBottom:4,
        background:`linear-gradient(0deg,${N.base} 60%,transparent)`,zIndex:2,
      }}>
        <FBtn v="danger" style={{fontSize:11}} onClick={() => { if(window.confirm("Remove " + player.name + " from the party?")) onDelete(player.id); }}>
          <SkullSvg size={13} col="#f87171" op={1}/> Remove
        </FBtn>
        <div style={{display:"flex",gap:8}}>
          <FBtn v="ghost" style={{fontSize:11}} onClick={onClose}>Cancel</FBtn>
          <FBtn v="success" style={{fontSize:11}} onClick={save}><ShieldSvg size={13} col="#4ade80"/>Save Changes</FBtn>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// ADD PLAYER MODAL
// ══════════════════════════════════════════════════════════════
function AddModal({onSave, onClose}) {
  const [f, setF] = useState({
    name:"", race:"Human", class:"Fighter", level:1, status:"alive",
    color:"#9b72cf", hp:20, maxHp:{base:20,bonus:0}, ac:14, initiative:0,
    stats: mkStats(), currency: mkCurrency(),
    inventoryText:"", conditions:[], deathSaves:{s:0,f:0},
    inspiration:false, notes:"", xp:0,
  });
  const u = (k,v) => setF(x=>({...x,[k]:v}));

  const save = () => {
    if (!f.name.trim()) { alert("Name is required!"); return; }
    const inventory = f.inventoryText.split(",").map(s=>s.trim()).filter(Boolean);
    onSave(mkP({...f, id:Date.now(), inventory}));
  };

  return (
    <Modal onClose={onClose} maxW={620} title="✨ New Adventurer">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:"0 20px"}}>
        <FInp label="Character Name" value={f.name} onChange={v=>u("name",v)} placeholder="What do they call you?"/>
        <FSel label="Race"  value={f.race}  onChange={v=>u("race",v)}  opts={RACES}/>
        <FSel label="Class" value={f.class} onChange={v=>u("class",v)} opts={CLASSES}/>
        <FInp label="Level" value={f.level} onChange={v=>u("level",v)} type="number" min={1} max={20}/>
        <FSel label="Status" value={f.status} onChange={v=>u("status",v)} opts={[{v:"alive",l:"✅ Alive"},{v:"unconscious",l:"💛 Unconscious"},{v:"dead",l:"☠️ Dead"}]}/>
        <FInp label="Armor Class" value={f.ac} onChange={v=>u("ac",v)} type="number" min={1} max={30}/>
        <FInp label="Starting HP" value={f.hp} onChange={v=>u("hp",v)} type="number" min={0}/>
        <FInp label="Max HP (base)" value={f.maxHp?.base||20} onChange={v=>u("maxHp",{...f.maxHp,base:clamp(v,1,999)})} type="number" min={1}/>
        <FInp label="Initiative" value={f.initiative} onChange={v=>u("initiative",v)} type="number" min={-10} max={20}/>
        <div style={{marginBottom:14}}>
          <FL>Accent Color</FL>
          <input type="color" value={f.color} onChange={e=>u("color",e.target.value)}
            style={{width:"100%",height:42,...nI(3),border:`1px solid ${N.border}`,borderRadius:10,cursor:"pointer",padding:3}}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <FL>⚔️ Starting Stats</FL>
        <StatEditor stats={f.stats} onChange={v=>u("stats",v)}/>
      </div>
      <div style={{marginBottom:14}}>
        <FL>💰 Starting Wallet</FL>
        <CurrencyEditor currency={f.currency} onChange={v=>u("currency",v)}/>
      </div>
      <FInp label="Starting Inventory (comma-separated)" value={f.inventoryText} onChange={v=>u("inventoryText",v)} rows={2} placeholder="Shortsword, Torch, Rope..."/>
      <FInp label="DM Notes" value={f.notes} onChange={v=>u("notes",v)} rows={2} placeholder="Background, secrets..."/>
      <div style={{margin:"12px 0 4px"}}><Divider/></div>
      <div style={{
        display:"flex",gap:10,justifyContent:"flex-end",
        position:"sticky",bottom:0,
        background:`linear-gradient(180deg,transparent,${N.base} 30%)`,
        paddingTop:14,paddingBottom:4,zIndex:2,
      }}>
        <FBtn v="ghost" style={{fontSize:11}} onClick={onClose}>Cancel</FBtn>
        <FBtn v="success" style={{fontSize:11}} onClick={save}>✨ Add to Party</FBtn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// DM LOGIN — async SHA-256, lockout, XOR-hidden hash
// ══════════════════════════════════════════════════════════════
function LoginModal({onClose, onSuccess}) {
  const [pw,   setPw]   = useState("");
  const [err,  setErr]  = useState("");
  const [shake,setShake]= useState(false);
  const [tries,setTries]= useState(0);
  const [locked,setLock]= useState(false);
  const [cd,   setCd]   = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef        = useRef();

  // Lockout countdown
  useEffect(() => {
    if (!locked || cd <= 0) return;
    const t = setTimeout(() => setCd(n => n-1), 1000);
    return () => clearTimeout(t);
  }, [locked, cd]);

  useEffect(() => {
    if (locked && cd === 0) { setLock(false); setTries(0); }
  }, [locked, cd]);

  const attempt = async () => {
    if (locked || busy || !pw.trim()) return;
    setBusy(true);
    const ok = await _verify(pw);
    setBusy(false);
    if (ok) { onSuccess(); return; }
    const next = tries + 1;
    setTries(next);
    const rem = 3 - next;
    setErr(rem > 0 ? `Wrong passphrase · ${rem} attempt${rem!==1?"s":""} left` : "Access suspended");
    setShake(true); setPw("");
    setTimeout(() => { setErr(""); setShake(false); }, 900);
    if (next >= 3) { setLock(true); setCd(45); }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Modal onClose={onClose} maxW={420}>
      <div style={{textAlign:"center",padding:"4px 0 24px"}}>
        <div style={{
          width:88,height:88,borderRadius:22,margin:"0 auto 16px",
          ...nR(9),border:`2px solid ${N.accent}44`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:44,animation:"float 3s ease-in-out infinite",
        }}>{locked?"🔒":"🔐"}</div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:19,color:N.gold,marginBottom:8,textShadow:`0 0 30px ${N.gold}44`}}>
          Dungeon Master Vault
        </div>
        <div style={{fontFamily:"'Crimson Pro',serif",color:N.dim,fontSize:16,fontStyle:"italic"}}>
          "Speak, friend, and enter."
        </div>
        <div style={{marginTop:12}}><Divider col="#d4a96a55" w="160"/></div>
      </div>

      {locked ? (
        <div style={{textAlign:"center",padding:"10px 0 24px"}}>
          <div style={{fontFamily:"'Cinzel',serif",color:"#f87171",fontSize:12,letterSpacing:2,marginBottom:10}}>⛔ ACCESS SUSPENDED</div>
          <div style={{...nR(8),width:120,height:120,borderRadius:"50%",margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"2px solid #f8717122"}}>
            <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:38,color:"#f87171",fontWeight:700,lineHeight:1,animation:"critB 1s ease-in-out infinite"}}>{cd}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:1.5}}>SECONDS</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{marginBottom:16,animation:shake?"shake .4s ease":undefined}}>
            <input ref={inputRef} type="password" value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key==="Enter" && attempt()}
              placeholder="Enter the passphrase..." autoFocus
              style={{
                ...inputBase(), textAlign:"center", letterSpacing:5, fontSize:18,
                borderColor: err ? "#f87171" : N.border,
                boxShadow: err ? `${neu(3,true)},0 0 0 2px #f8717122` : neu(3,true),
              }}
              onFocus={fFocus} onBlur={fBlur}/>
            {err && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:8,color:"#f87171",fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:.5}}>
                ⚠️ {err}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:16}}>
            <FBtn v="ghost" onClick={onClose}>Retreat</FBtn>
            <FBtn onClick={attempt} disabled={busy}>{busy?"Verifying…":"🗝️ Enter the Vault"}</FBtn>
          </div>
          <div style={{...nI(3),borderRadius:10,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Security Notice</div>
            <div style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"#333350",fontStyle:"italic"}}>
              Passphrase verified via SHA-256. Unrecoverable from source code.
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── Party Stats Banner ────────────────────────────────────────
const PartyStats = memo(function PartyStats({players}) {
  const alive  = players.filter(p=>p.status==="alive").length;
  const down   = players.filter(p=>p.status==="unconscious").length;
  const dead   = players.filter(p=>p.status==="dead").length;
  const tHp    = players.reduce((s,p) => s+(safeInt(p.hp,0)),0);
  const tMax   = players.reduce((s,p) => s+effMaxHp(p),0);
  const pct    = tMax>0 ? Math.round(tHp/tMax*100) : 100;
  const avgLvl = players.length ? Math.round(players.reduce((s,p)=>s+p.level,0)/players.length) : 0;
  const tCopper= players.reduce((s,p)=>s+toCopper(p.currency),0);
  const tw     = {
    P: Math.floor(tCopper/1000),
    G: Math.floor((tCopper%1000)/100),
    S: Math.floor((tCopper%100)/10),
    C: tCopper%10,
  };

  const items = [
    { icon:<ShieldSvg size={13} col="#94a3b8"/>, label:"Party",   val:players.length, c:"#94a3b8" },
    { icon:"💚",                                  label:"Alive",   val:alive,           c:"#4ade80" },
    ...(down>0?[{icon:"💛",label:"Down",  val:down,c:"#f59e0b"}]:[]),
    ...(dead>0?[{icon:<SkullSvg size={13} col="#f87171" op={1}/>,label:"Fallen",val:dead,c:"#f87171"}]:[]),
    { icon:<HeartSvg size={13} col={hpCol(tHp,tMax||1)}/>, label:"HP%", val:`${pct}%`, c:hpCol(tHp,tMax||1) },
    { icon:<StarSvg size={13} col="#a78bfa" filled/>, label:"Avg Lv", val:avgLvl, c:"#a78bfa" },
  ];

  return (
    <div className="party-stats-bar" style={{borderBottom:`1px solid ${N.border}44`, background:`linear-gradient(90deg,${N.base}88,transparent)`}}>
      {items.map((s,i) => (
        <div key={i} style={{
          padding:"5px 14px", display:"flex", alignItems:"center", gap:6, flexShrink:0,
          borderRight:`1px solid ${N.border}44`,
        }}>
          <span style={{display:"flex",alignItems:"center",fontSize:typeof s.icon==="string"?12:undefined,flexShrink:0}}>{s.icon}</span>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:s.c,lineHeight:1.2,whiteSpace:"nowrap"}}>{s.val}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:N.dim,letterSpacing:1.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{s.label}</div>
          </div>
        </div>
      ))}
      {/* Party wealth */}
      <div style={{padding:"5px 14px",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:7,color:N.dim,letterSpacing:1.5,textTransform:"uppercase",marginRight:2,whiteSpace:"nowrap"}}>Wealth</span>
        {COIN_KEYS.map(k => tw[k]>0 ? (
          <div key={k} style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
            <CoinSvg type={k} size={12}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:COINS[k].col,fontWeight:700,whiteSpace:"nowrap"}}>{tw[k].toLocaleString()}</span>
          </div>
        ) : null)}
        {COIN_KEYS.every(k=>!tw[k]) && <span style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:N.dim,fontStyle:"italic",whiteSpace:"nowrap"}}>penniless</span>}
      </div>
    </div>
  );
});

// ── Session Log ───────────────────────────────────────────────
const SessionLog = memo(function SessionLog({log, show, onToggle}) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && show) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log, show]);

  const latest = log.length > 0 ? log[log.length-1].replace(/\[.*?\] /, "") : null;

  return (
    <div style={{
      borderTop:`1px solid ${N.border}44`,
      background:`linear-gradient(180deg,${N.base},#100e1a)`,
      flexShrink:0,
    }}>
      {/* Toggle bar */}
      <button onClick={onToggle} style={{
        display:"flex",alignItems:"center",gap:10,width:"100%",
        padding:"8px 20px",background:"transparent",border:"none",cursor:"pointer",
      }}>
        <SwordSvg size={12} col={N.dim}/>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.dim,letterSpacing:2,textTransform:"uppercase",flexShrink:0}}>
          Session Log
        </span>
        <span style={{
          fontFamily:"'Cinzel',serif",fontSize:8,color:N.dim,
          transition:"transform .2s",display:"inline-block",
          transform:show?"rotate(180deg)":"none", flexShrink:0,
        }}>▼</span>
        {!show && latest && (
          <span style={{
            fontFamily:"'Crimson Pro',serif",fontSize:12,
            color:`${N.gold}88`,fontStyle:"italic",
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
            flex:1,textAlign:"left",
          }}>
            {latest}
          </span>
        )}
        <span style={{
          marginLeft:"auto",flexShrink:0,
          fontFamily:"'Cinzel',serif",fontSize:8,color:"#2e2e44",letterSpacing:1,
        }}>
          {log.length} events
        </span>
      </button>

      {/* Log entries */}
      {show && (
        <div ref={ref} style={{
          maxHeight:160,overflowY:"auto",
          padding:"4px 20px 14px",
          scrollBehavior:"smooth",
        }}>
          {log.length===0 ? (
            <span style={{fontFamily:"'Crimson Pro',serif",color:"#383060",fontSize:13,fontStyle:"italic"}}>
              No events yet…
            </span>
          ) : log.slice().reverse().map((e,i) => (
            <div key={i} style={{
              fontFamily:"'Crimson Pro',serif",fontSize:12,padding:"4px 0",lineHeight:1.5,
              color: i===0 ? N.gold : i<4 ? "#6060a0" : "#282838",
              borderBottom:`1px solid ${N.border}22`,
              transition:"color .3s",
            }}>
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Firebase Status Badge ─────────────────────────────────────
function ConBadge({status}) {
  const m = {
    connecting:{ col:"#fbbf24",label:"Connecting…" },
    live:      { col:"#4ade80",label:"🔥 Firebase Live" },
    offline:   { col:"#f59e0b",label:"Local Storage" },
  }[status] || { col:"#fbbf24",label:"..." };
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",...nR(3),borderRadius:8,border:`1px solid ${m.col}33`}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:m.col,boxShadow:`0 0 6px ${m.col}`,animation:status==="live"?"livePulse 2s ease-in-out infinite":status==="connecting"?"critB 1s ease-in-out infinite":undefined}}/>
      <span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:m.col,letterSpacing:.5}}>{m.label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// BUG FIX #1: Renamed state vars to avoid confusion
// BUG FIX #7: Proper cancel flag for Firebase / fallback race
// BUG FIX #22: sorted wrapped in useMemo
// ══════════════════════════════════════════════════════════════
function App() {
  const [players,  setPlayers]  = useState([]);
  const [loaded,   setLoaded]   = useState(false);
  const [isDM,     setIsDM]     = useState(false);
  const [loginOpen,setLoginOpen]= useState(false);
  const [editingId, setEditingId] = useState(null);
  // derive the player to edit fresh from current players state (survives remote syncs)
  const editing = editingId ? players.find(p => p.id === editingId) ?? null : null;
  const [addOpen,  setAddOpen]  = useState(false);
  const [sortBy,   setSortBy]   = useState("default");
  const [search,   setSearch]   = useState("");
  const [logOpen,  setLogOpen]  = useState(false);
  const [evtLog,   setEvtLog]   = useState([]);
  const [toasts,   toast]       = useToasts();
  const { status, connect, save: fbSave } = useFirebase();

  const addLog = useCallback((msg) => {
    const t = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    setEvtLog(l => [...l.slice(-49), `[${t}] ${msg}`]);
  }, []);

  // ── Firebase init + fallback ─────────────────────────────────
  useEffect(() => {
    const unmountedRef      = { current: false };
    const firebaseActiveRef = { current: true  }; // set false if fallback wins

    // onInitial: first snapshot from Firebase
    const onInitial = (firePlayers) => {
      if (unmountedRef.current) return;
      if (firePlayers && firePlayers.length > 0) {
        setPlayers(firePlayers);
      } else {
        // DB empty — push defaults so other devices see them
        setPlayers(DEF_PLAYERS);
        fbSave(DEF_PLAYERS);
      }
      setLoaded(true);
    };

    // onUpdate: every subsequent live change from another device/tab
    const onUpdate = (firePlayers) => {
      if (unmountedRef.current) return;
      setPlayers(firePlayers);
    };

    connect(onInitial, onUpdate, unmountedRef, firebaseActiveRef);

    // Fallback: if Firebase has not responded in 5 s, go local
    const fallback = setTimeout(async () => {
      if (!firebaseActiveRef.current || unmountedRef.current) return;
      firebaseActiveRef.current = false; // block any late Firebase callbacks
      try {
        const raw = localStorage.getItem("warTable-v5");
        if (!unmountedRef.current)
          setPlayers(raw ? JSON.parse(raw).map(mkP) : DEF_PLAYERS);
      } catch {
        if (!unmountedRef.current) setPlayers(DEF_PLAYERS);
      }
      if (!unmountedRef.current) setLoaded(true);
    }, 5000);

    return () => {
      unmountedRef.current = true;
      clearTimeout(fallback);
    };
  }, []); // eslint-disable-line

  // Persist to Firebase (and local as backup)
  const persist = useCallback((newPlayers) => {
    const saved = fbSave(newPlayers);
    // Always write local backup regardless of Firebase status
    try {
      localStorage.setItem("warTable-v5", JSON.stringify(newPlayers));
    } catch(_) {}
    return saved;
  }, [fbSave]);

  const savePlayer = useCallback((upd) => {
    const old = players.find(p => p.id === upd.id);
    const next = players.map(p => p.id === upd.id ? upd : p);
    setPlayers(next);
    persist(next);
    if (old) {
      const ch = [];
      const oldMax = effMaxHp(old), newMax = effMaxHp(upd);
      if (old.hp !== upd.hp)       ch.push(`HP ${old.hp}→${upd.hp}/${newMax}`);
      if (oldMax !== newMax)       ch.push(`Max HP ${oldMax}→${newMax}`);
      if (JSON.stringify(old.currency) !== JSON.stringify(upd.currency)) ch.push("Wallet updated");
      if (old.status !== upd.status) ch.push(`Status: ${upd.status}`);
      if (JSON.stringify(old.stats) !== JSON.stringify(upd.stats))      ch.push("Stats changed");
      if ((old.conditions||[]).join() !== (upd.conditions||[]).join())  ch.push("Conditions updated");
      if (old.inspiration !== upd.inspiration)                          ch.push(upd.inspiration ? "✨ Inspired!" : "Lost inspiration");
      if (ch.length) {
        const m = `${upd.name}: ${ch.join(" · ")}`;
        addLog(m);
        toast(m, upd.hp < (old.hp||0) ? "danger" : "success");
      }
    }
    setEditingId(null);
  }, [players, persist, addLog, toast]);

  const deletePlayer = useCallback((id) => {
    const p = players.find(x => x.id === id);
    const next = players.filter(x => x.id !== id);
    setPlayers(next);
    persist(next);
    addLog(`${p?.name} removed from party`);
    toast(`${p?.name} removed`, "danger");
    setEditingId(null);
  }, [players, persist, addLog, toast]);

  const addPlayer = useCallback((p) => {
    const next = [...players, p];
    setPlayers(next);
    persist(next);
    addLog(`${p.name} joined the party!`);
    toast(`${p.name} joined!`, "success");
    setAddOpen(false);
  }, [players, persist, addLog, toast]);

  const longRest = () => {
    if (!window.confirm("Grant a Long Rest?\n\n✅ HP restored to max\n✅ Most conditions cleared\n✅ Death saves reset\n✅ Status set to Alive\n\n☠️ Fallen characters unaffected.")) return;
    const next = players.map(p =>
      p.status === "dead" ? p : {
        ...p,
        hp: effMaxHp(p),
        status: "alive",
        deathSaves: {s:0,f:0},
        // BUG FIX #28: clear all conditions except Exhaustion on long rest (RAW)
        conditions: (p.conditions||[]).filter(c => c === "Exhausted"),
      }
    );
    setPlayers(next);
    persist(next);
    addLog("🌙 Long rest — party fully restored");
    toast("Long rest complete! All HP restored.", "gold");
  };

  // BUG FIX #22: memoised sort/filter
  const sorted = useMemo(() =>
    [...players]
      .filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q)
          || p.class.toLowerCase().includes(q)
          || p.race.toLowerCase().includes(q)
          || (p.conditions||[]).some(c => c.toLowerCase().includes(q));
      })
      .sort((a,b) => {
        switch(sortBy) {
          case "hp":     return (a.hp/effMaxHp(a)) - (b.hp/effMaxHp(b));
          case "name":   return a.name.localeCompare(b.name);
          case "level":  return b.level - a.level;
          case "status": return ["alive","unconscious","dead"].indexOf(a.status) - ["alive","unconscious","dead"].indexOf(b.status);
          case "wealth": return toCopper(b.currency) - toCopper(a.currency);
          default:       return 0;
        }
      })
  , [players, search, sortBy]);

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:N.base,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,padding:24}}>
      <style>{`${FONTS} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}} @keyframes ldot{from{transform:scale(.45);opacity:.15}to{transform:scale(1.35);opacity:1}} @keyframes starP{from{opacity:.04}to{opacity:.4}} @keyframes glow{0%,100%{text-shadow:0 0 20px #d4a96a44}50%{text-shadow:0 0 40px #d4a96a88,0 0 80px #d4a96a22}}`}</style>
      <Starfield/><BgSvg/>
      <div style={{
        width:90,height:90,borderRadius:24,
        background:`linear-gradient(145deg,${N.accent}22,${N.accent}08)`,
        border:`1px solid ${N.accent}44`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:46,animation:"float 2.5s ease-in-out infinite",
        boxShadow:`${neu(10)},0 0 40px ${N.accent}33`,
      }}>⚔️</div>
      <div>
        <div style={{fontFamily:"'Cinzel Decorative',serif",color:N.gold,fontSize:22,letterSpacing:.5,textAlign:"center",animation:"glow 3s ease-in-out infinite",marginBottom:6}}>
          The War Table
        </div>
        <div style={{fontFamily:"'Crimson Pro',serif",color:N.dim,fontSize:14,fontStyle:"italic",textAlign:"center"}}>
          Summoning adventurers…
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginTop:4}}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:9,height:9,borderRadius:"50%",
            background:N.accent,opacity:.3,
            animation:`ldot .85s ${i*.18}s ease-in-out infinite alternate`,
            boxShadow:`0 0 8px ${N.accent}`,
          }}/>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        ${FONTS}
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { overflow-x:hidden; scroll-behavior:smooth; }
        body { background:${N.base}; min-height:100%; color:${N.text}; overflow-x:hidden; }

        /* ── Scrollbars ── */
        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${N.border}; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#5a5480; }
        * { scrollbar-width:thin; scrollbar-color:${N.border} transparent; }

        /* ── Select options ── */
        select option { background:${N.base}; color:${N.text}; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { display:none; }

        /* ── Focus rings ── */
        :focus-visible { outline:2px solid ${N.accent}66; outline-offset:2px; }

        /* ── Animations ── */
        @keyframes starP     { from{opacity:.04} to{opacity:.4} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)} 75%{transform:translateX(9px)} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(22px) scale(.96)} to{opacity:1;transform:none} }
        @keyframes tIn       { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
        @keyframes mPop      { from{opacity:0;transform:scale(.9) translateY(24px)} to{opacity:1;transform:none} }
        @keyframes critB     { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @keyframes ldot      { from{transform:scale(.45);opacity:.15} to{transform:scale(1.35);opacity:1} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes livePulse { 0%,100%{box-shadow:0 0 0 0 #4ade8033} 50%{box-shadow:0 0 0 5px #4ade8011} }
        @keyframes shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes glow      { 0%,100%{text-shadow:0 0 20px ${N.gold}44} 50%{text-shadow:0 0 40px ${N.gold}88,0 0 80px ${N.gold}22} }

        /* ── Card grid ── */
        .card { animation:cardIn .42s cubic-bezier(.4,0,.2,1) both; }

        /* ── Responsive header ── */
        .hdr-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .hdr-title   { display:flex; align-items:center; gap:12px; }

        /* ── Party stats horizontal scroll on small screens ── */
        .party-stats-bar { display:flex; align-items:center; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .party-stats-bar::-webkit-scrollbar { height:0; }

        /* ── Coin dropdown scrollable ── */
        .coin-dropdown { overflow-y:auto; overflow-x:hidden; }
        .coin-dropdown::-webkit-scrollbar { width:3px; }
        .coin-dropdown::-webkit-scrollbar-thumb { background:${N.border}; border-radius:99px; }

        /* ── Modal inner scroll ── */
        .modal-inner { overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .modal-inner::-webkit-scrollbar { width:4px; }
        .modal-inner::-webkit-scrollbar-thumb { background:${N.border}; border-radius:99px; }

        /* ── Responsive breakpoints ── */
        @media (max-width:480px) {
          .hdr-title { gap:8px !important; }
          .hdr-title > div:first-child { width:36px !important; height:36px !important; font-size:18px !important; }
          .hdr-actions { gap:4px !important; flex-wrap:wrap; }
          .hdr-actions input  { width:110px !important; font-size:12px !important; }
          .hdr-actions select { font-size:9px !important; padding:6px 7px !important; }
          .main-grid { padding:8px !important; }
          .grid-cols { grid-template-columns:1fr !important; gap:12px !important; }
          .party-stats-bar { padding:0 !important; }
        }
        @media (max-width:600px) {
          .hdr-actions { gap:5px; }
          .hdr-title div[style*="Cinzel Decorative"] { font-size:15px !important; }
          .main-grid { padding:12px !important; gap:12px !important; }
          .grid-cols { grid-template-columns:1fr !important; }
        }
        @media (max-width:768px) {
          .modal-inner { padding:14px 14px 18px !important; }
        }
        @media (max-width:900px) {
          .main-grid { padding:16px !important; }
        }

        /* ── Touch targets ── */
        @media (pointer:coarse) {
          button { min-height:36px; }
          .party-stats-bar { overflow-x:scroll; }
        }

        /* ── Input transitions ── */
        input, textarea, select {
          transition: border-color .18s, box-shadow .18s;
        }

        /* ── Button hover states ── */
        button { transition: all .18s cubic-bezier(.4,0,.2,1); }

        /* ── Tooltip ── */
        [title]:hover::after {
          content: attr(title);
          position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
          background:${N.base}; border:1px solid ${N.border}; color:${N.text};
          padding:4px 10px; border-radius:8px; font-size:11px; white-space:nowrap;
          font-family:'Crimson Pro',serif; pointer-events:none; z-index:9999;
          box-shadow:0 4px 20px #00000088;
        }
      `}</style>

      <Starfield/><BgSvg/>

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>

        {/* ══ HEADER ══ */}
        <header style={{
          position:"sticky",top:0,zIndex:200,
          background:`${N.base}f2`,backdropFilter:"blur(28px) saturate(180%)",
          borderBottom:`1px solid ${N.border}`,
          boxShadow:`0 4px 32px #00000055, 0 1px 0 ${N.light}44`,
        }}>
          {/* Top row */}
          <div style={{padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>

            {/* Logo */}
            <div className="hdr-title">
              <div style={{
                width:46,height:46,borderRadius:13,flexShrink:0,
                background:`linear-gradient(145deg,${N.accent}22,${N.accent}08)`,
                border:`1px solid ${N.accent}44`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:24,...nR(7),
                boxShadow:`${neu(7)}, 0 0 20px ${N.accent}22`,
              }}>⚔️</div>
              <div>
                <div style={{
                  fontFamily:"'Cinzel Decorative',serif",fontSize:18,color:N.gold,
                  letterSpacing:.5,lineHeight:1,animation:"glow 4s ease-in-out infinite",
                }}>The War Table</div>
                <div style={{fontFamily:"'Crimson Pro',serif",color:N.dim,fontSize:11,fontStyle:"italic",marginTop:2}}>
                  D&D Campaign Dashboard
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="hdr-actions">
              <ConBadge status={status}/>

              {/* Search */}
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:11,pointerEvents:"none",opacity:.35}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                  style={{
                    ...nI(3),background:N.base,border:`1px solid ${N.border}`,borderRadius:10,
                    padding:"7px 10px 7px 28px",color:N.text,fontFamily:"'Crimson Pro',serif",
                    fontSize:13,outline:"none",width:150,
                  }}
                  onFocus={e=>e.target.style.borderColor=N.accent}
                  onBlur={e=>e.target.style.borderColor=N.border}/>
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
                ...nI(3),background:N.base,border:`1px solid ${N.border}`,borderRadius:10,
                padding:"7px 10px",color:N.text,fontFamily:"'Cinzel',serif",fontSize:10,
                cursor:"pointer",outline:"none",letterSpacing:.3,
              }}>
                <option value="default">Default</option>
                <option value="name">A → Z</option>
                <option value="hp">Lowest HP</option>
                <option value="level">Highest Level</option>
                <option value="status">By Status</option>
                <option value="wealth">Wealthiest</option>
              </select>

              {isDM ? (
                <>
                  <FBtn v="gold"    style={{fontSize:10,padding:"7px 12px"}} onClick={longRest}>🌙 Rest</FBtn>
                  <FBtn v="success" style={{fontSize:10,padding:"7px 12px"}} onClick={() => setAddOpen(true)}>＋ Add</FBtn>
                  <FBtn v="danger"  style={{fontSize:10,padding:"7px 12px"}} onClick={() => { setIsDM(false); addLog("DM logged out"); toast("DM session ended","danger"); }}>🔓 Exit</FBtn>
                </>
              ) : (
                <FBtn style={{fontSize:10,padding:"7px 14px"}} onClick={() => setLoginOpen(true)}>🔐 DM</FBtn>
              )}
            </div>
          </div>

          {/* DM mode banner */}
          {isDM && (
            <div style={{
              background:"linear-gradient(90deg,transparent,#fbbf2409,#fbbf240c,#fbbf2409,transparent)",
              borderTop:`1px solid ${N.gold}18`,padding:"4px 20px",
              display:"flex",alignItems:"center",gap:8,
            }}>
              <div style={{
                width:6,height:6,borderRadius:"50%",
                background:N.gold,boxShadow:`0 0 8px ${N.gold}`,
                animation:"critB 2s ease-in-out infinite",flexShrink:0,
              }}/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:N.gold,letterSpacing:2.5,textTransform:"uppercase"}}>
                DM Mode Active
              </span>
              <span style={{fontFamily:"'Crimson Pro',serif",color:"#7a6040",fontSize:12}}>
                · Tap any card to edit · Long rest restores all HP
              </span>
            </div>
          )}

          <PartyStats players={players}/>
        </header>

        {/* ══ MAIN GRID ══ */}
        <main className="main-grid" style={{flex:1,padding:"20px 20px 32px"}}>
          {sorted.length === 0 ? (
            <div style={{textAlign:"center",padding:"80px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
              <div style={{opacity:.25}}><ShieldSvg size={72} col={N.dim}/></div>
              <div style={{fontFamily:"'Cinzel Decorative',serif",color:N.dim,fontSize:16,letterSpacing:.5}}>
                {search ? `No results for "${search}"` : "The tavern is empty…"}
              </div>
              {isDM && !search && (
                <FBtn v="success" onClick={() => setAddOpen(true)}>✨ Add First Adventurer</FBtn>
              )}
            </div>
          ) : (
            <div
              className="grid-cols"
              style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(min(290px,100%),1fr))",
                gap:18,
                alignItems:"start",
              }}>
              {sorted.map((p,i) => (
                <div key={p.id} className="card" style={{animationDelay:`${Math.min(i*.04,0.3)}s`}}>
                  <PlayerCard player={p} isDM={isDM} onEdit={p => setEditingId(p.id)}/>
                </div>
              ))}
            </div>
          )}
        </main>

        <SessionLog log={evtLog} show={logOpen} onToggle={() => setLogOpen(s=>!s)}/>
      </div>

      {/* ── Modals ── */}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={() => {
            setIsDM(true);
            setLoginOpen(false);
            addLog("DM authenticated — session started");
            toast("DM Mode activated", "success");
          }}/>
      )}
      {editing && (
        <EditModal
          player={editing}
          onSave={savePlayer}
          onDelete={deletePlayer}
          onClose={() => setEditingId(null)}/>
      )}
      {addOpen && (
        <AddModal onSave={addPlayer} onClose={() => setAddOpen(false)}/>
      )}

      <Toasts list={toasts}/>
    </>
  );
}

/* ── Mount ──────────────────────────────────────────────────── */
(function mount() {
  const el = document.getElementById("root");
  if (!el) return;
  ReactDOM.createRoot(el).render(React.createElement(App));
})();
