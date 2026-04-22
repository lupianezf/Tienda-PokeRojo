// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const COMMISSION = 0.03;
const TCG_API = "https://api.pokemontcg.io/v2";
const fmt = n => `$${Number(n).toLocaleString("es-AR")}`;

const TYPE_COLORS = {
  "Fuego":"#FF4C1A","Eléctrico":"#FFD700","Psíquico":"#B24BF3","Dragón":"#4B7BEC",
  "Oscuro":"#5B5EA6","Incoloro":"#7F8C8D","Agua":"#2E86C1","Planta":"#27AE60",
  "Lucha":"#C0392B","Metal":"#7F8C8D","Hada":"#FF69B4","Fuego/Planta":"#FF6B35"
};
const TYPE_EN_TO_ES = {
  "Fire":"Fuego","Lightning":"Eléctrico","Psychic":"Psíquico","Dragon":"Dragón",
  "Darkness":"Oscuro","Colorless":"Incoloro","Water":"Agua","Grass":"Planta",
  "Fighting":"Lucha","Metal":"Metal","Fairy":"Hada"
};
const COND_COLOR = { NM:"#27AE60", LP:"#F39C12", MP:"#E67E22", HP:"#E74C3C", M:"#2980B9" };
const COND_LABEL = { NM:"Near Mint", LP:"Leve Play", MP:"Mod. Play", HP:"Heavy Play", M:"Mint" };
const CONDITIONS = ["M","NM","LP","MP","HP"];
const PROVINCES = ["Buenos Aires","CABA","Córdoba","Rosario","Mendoza","Santa Fe","Tucumán",
  "La Plata","Mar del Plata","Salta","Misiones","Neuquén","Corrientes","Chaco","Entre Ríos",
  "San Juan","Jujuy","Río Negro","San Luis","La Rioja","Chubut","Santa Cruz","Tierra del Fuego"];
const TYPES_ES = ["Todos","Fuego","Eléctrico","Psíquico","Dragón","Oscuro","Agua","Planta","Lucha","Metal","Incoloro","Hada"];

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
let USERS = [
  { id: 1, email:"ash@pokemon.com", password:"pikachu", name:"Ash K.", province:"Buenos Aires" },
  { id: 2, email:"misty@pokemon.com", password:"togepi", name:"Misty W.", province:"Córdoba" },
  { id: 3, email:"brock@pokemon.com", password:"onix123", name:"Brock S.", province:"Mendoza" },
];

let REVIEWS = [
  { id:1, sellerId:2, buyerId:1, cardName:"Pikachu VMAX", rating:5, comment:"Carta llegó perfecta, muy bien embalada. Re recomendable!", date:"2025-03-10" },
  { id:2, sellerId:2, buyerId:3, cardName:"Mewtwo GX", rating:4, comment:"Buena carta, condición tal como se describió. Envío rápido.", date:"2025-03-18" },
  { id:3, sellerId:1, buyerId:2, cardName:"Charizard V", rating:5, comment:"Excelente vendedor, muy honesto con la condición.", date:"2025-04-01" },
  { id:4, sellerId:3, buyerId:1, cardName:"Rayquaza VMAX", rating:3, comment:"Carta ok pero tardó un poco el envío.", date:"2025-04-05" },
];

let CARDS = [
  { id:1, name:"Charizard VMAX", set:"Sword & Shield", setId:"swsh1", number:"20/202", condition:"NM", price:18500, type:"Fuego", rarity:"Ultra Rara", sellerId:2, sellerName:"Misty W.", imgUrl:"https://images.pokemontcg.io/swsh1/20_hires.png", hot:true, province:"Córdoba", shipping:["Andreani","OCA"], listedAt: Date.now()-86400000*3 },
  { id:2, name:"Pikachu V", set:"Vivid Voltage", setId:"swsh4", number:"43/185", condition:"LP", price:2200, type:"Eléctrico", rarity:"Rara V", sellerId:2, sellerName:"Misty W.", imgUrl:"https://images.pokemontcg.io/swsh4/43_hires.png", hot:false, province:"Córdoba", shipping:["Correo Argentino"], listedAt: Date.now()-86400000*2 },
  { id:3, name:"Mewtwo GX", set:"Shining Legends", setId:"sm35", number:"39/73", condition:"NM", price:9800, type:"Psíquico", rarity:"GX", sellerId:1, sellerName:"Ash K.", imgUrl:"https://images.pokemontcg.io/sm35/39_hires.png", hot:true, province:"Buenos Aires", shipping:["Andreani","OCA","Correo Argentino"], listedAt: Date.now()-86400000*5 },
  { id:4, name:"Rayquaza V", set:"Evolving Skies", setId:"swsh7", number:"110/203", condition:"NM", price:7500, type:"Dragón", rarity:"V", sellerId:2, sellerName:"Misty W.", imgUrl:"https://images.pokemontcg.io/swsh7/110_hires.png", hot:false, province:"Córdoba", shipping:["OCA"], listedAt: Date.now()-86400000*1 },
  { id:5, name:"Umbreon VMAX", set:"Evolving Skies", setId:"swsh7", number:"95/203", condition:"NM", price:42000, type:"Oscuro", rarity:"Alt Art", sellerId:1, sellerName:"Ash K.", imgUrl:"https://images.pokemontcg.io/swsh7/95_hires.png", hot:true, province:"Buenos Aires", shipping:["Andreani"], listedAt: Date.now()-86400000*7 },
  { id:6, name:"Gardevoir ex", set:"Scarlet & Violet", setId:"sv1", number:"86/198", condition:"M", price:5400, type:"Psíquico", rarity:"ex", sellerId:3, sellerName:"Brock S.", imgUrl:"https://images.pokemontcg.io/sv1/86_hires.png", hot:false, province:"Mendoza", shipping:["Andreani","OCA"], listedAt: Date.now()-86400000*4 },
  { id:7, name:"Lugia V", set:"Silver Tempest", setId:"swsh12", number:"186/195", condition:"NM", price:35000, type:"Incoloro", rarity:"Alt Art", sellerId:3, sellerName:"Brock S.", imgUrl:"https://images.pokemontcg.io/swsh12/186_hires.png", hot:true, province:"Mendoza", shipping:["Andreani"], listedAt: Date.now()-86400000*6 },
  { id:8, name:"Blastoise V", set:"Battle Styles", setId:"swsh5", number:"17/163", condition:"LP", price:3200, type:"Agua", rarity:"V", sellerId:1, sellerName:"Ash K.", imgUrl:"https://images.pokemontcg.io/swsh5/17_hires.png", hot:false, province:"Buenos Aires", shipping:["Correo Argentino","OCA"], listedAt: Date.now()-86400000*2 },
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
function getReputation(sellerId) {
  const r = REVIEWS.filter(x => x.sellerId === sellerId);
  if (!r.length) return { avg: null, count: 0 };
  return { avg: (r.reduce((s,x) => s+x.rating,0)/r.length).toFixed(1), count: r.length };
}

function Stars({ rating, size=14, interactive=false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ fontSize:size, cursor:interactive?"pointer":"default", color: i<=(interactive?hover||rating:rating) ? "#FFD700":"#333", transition:"color .1s" }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(i)}>★</span>
      ))}
    </div>
  );
}

function SellerBadge({ sellerId, size="sm" }) {
  const rep = getReputation(sellerId);
  if (!rep.count) return <span style={{ fontSize:11, color:"#444", fontFamily:"'DM Sans',sans-serif" }}>Sin reseñas</span>;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <Stars rating={Math.round(rep.avg)} size={size==="sm"?11:14} />
      <span style={{ fontSize:size==="sm"?11:13, color:"#FFD700", fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{rep.avg}</span>
      <span style={{ fontSize:size==="sm"?10:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>({rep.count})</span>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#080A12;}::-webkit-scrollbar-thumb{background:#FFD700;border-radius:3px;}
.card{background:#10131F;border:1px solid rgba(255,255,255,.07);border-radius:16px;transition:all .25s;}
.card:hover{border-color:rgba(255,215,0,.3);box-shadow:0 0 28px rgba(255,215,0,.07);transform:translateY(-3px);}
.btn{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;border-radius:10px;font-weight:700;transition:all .2s;}
.btn-gold{background:linear-gradient(135deg,#FFD700,#FF9500);color:#080A12;padding:11px 24px;font-size:14px;}
.btn-gold:hover{box-shadow:0 4px 22px rgba(255,215,0,.4);transform:scale(1.04);}
.btn-gold:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;color:#aaa;border:1px solid rgba(255,255,255,.12);padding:10px 20px;font-size:14px;}
.btn-ghost:hover{border-color:#FFD700;color:#FFD700;}
.btn-outline{background:transparent;color:#FFD700;border:1px solid #FFD700;padding:10px 20px;font-size:14px;}
.btn-outline:hover{background:rgba(255,215,0,.1);}
.btn-mp{background:linear-gradient(135deg,#009EE3,#0066B2);color:#fff;padding:16px;font-size:15px;width:100%;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;}
.btn-mp:hover{box-shadow:0 4px 22px rgba(0,158,227,.4);transform:scale(1.02);}
.btn-danger{background:rgba(231,76,60,.12);color:#E74C3C;border:1px solid rgba(231,76,60,.25);padding:8px 16px;font-size:13px;}
.btn-danger:hover{background:rgba(231,76,60,.22);}
.input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#E8E8F0;padding:13px 16px;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border-color .2s;}
.input:focus{border-color:#FFD700;}
.input::placeholder{color:#555;}
.select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#E8E8F0;padding:13px 16px;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;}
.select:focus{border-color:#FFD700;}
.select option{background:#10131F;}
label{display:block;font-size:11px;font-weight:700;color:#555;letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px;font-family:'DM Sans',sans-serif;}
.filter-chip{background:rgba(255,255,255,.04);color:#666;border:1px solid rgba(255,255,255,.08);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;font-family:'DM Sans',sans-serif;}
.filter-chip.active{color:#080A12;font-weight:700;border-color:transparent;}
.filter-chip:hover{transform:scale(1.05);}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadein .2s;}
.modal{background:#10131F;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:32px;width:100%;max-width:520px;position:relative;animation:slidein .25s ease;max-height:90vh;overflow-y:auto;}
.modal::-webkit-scrollbar{width:4px;}
@keyframes fadein{from{opacity:0;}to{opacity:1;}}
@keyframes slidein{from{transform:translateY(18px);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@keyframes glow{0%,100%{opacity:.2;}50%{opacity:.5;}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
.spinner{width:26px;height:26px;border:3px solid rgba(255,215,0,.2);border-top-color:#FFD700;border-radius:50%;animation:spin .8s linear infinite;}
.autocomplete-item{padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .15s;}
.autocomplete-item:hover{background:rgba(255,215,0,.08);}
.upload-zone{border:2px dashed rgba(255,255,255,.1);border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;}
.upload-zone:hover,.upload-zone.drag{border-color:#FFD700;background:rgba(255,215,0,.04);}
.tab-underline{background:none;border:none;color:#555;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;padding:14px 18px;border-bottom:2px solid transparent;transition:all .2s;}
.tab-underline.active{color:#FFD700;border-bottom-color:#FFD700;}
.tab-underline:hover{color:#FFD700;}
`;

// ── AUTH MODAL ─────────────────────────────────────────────────────────────────
function AuthModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", province:"Buenos Aires" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async () => {
    setError(""); setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    if (mode === "login") {
      const u = USERS.find(u=>u.email===form.email&&u.password===form.password);
      u ? onLogin(u) : setError("Email o contraseña incorrectos.");
    } else {
      if (!form.name||!form.email||!form.password) { setError("Completá todos los campos."); setLoading(false); return; }
      if (form.password.length < 6) { setError("Mínimo 6 caracteres."); setLoading(false); return; }
      const nu = { id:Date.now(), ...form };
      USERS.push(nu); onLogin(nu);
    }
    setLoading(false);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button onClick={onClose} className="btn" style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:30,marginBottom:6 }}>⚡</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#FFD700",letterSpacing:2 }}>TIENDA POKE ROJO</div>
          <div style={{ fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",marginTop:3 }}>{mode==="login"?"Ingresá a tu cuenta":"Creá tu cuenta gratis"}</div>
        </div>
        <div style={{ display:"flex",background:"rgba(255,255,255,.04)",borderRadius:10,padding:4,marginBottom:20 }}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} className="btn" style={{ flex:1,background:mode===m?"rgba(255,215,0,.12)":"transparent",color:mode===m?"#FFD700":"#555",border:"none",padding:"9px",fontSize:13,fontWeight:700,borderRadius:8 }}>
              {m==="login"?"Iniciar sesión":"Registrarse"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {mode==="register"&&<div><label>Nombre completo</label><input className="input" placeholder="Ej: Lucas García" value={form.name} onChange={f("name")}/></div>}
          <div><label>Email</label><input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={f("email")}/></div>
          <div><label>Contraseña</label><input className="input" type="password" placeholder={mode==="register"?"Mínimo 6 caracteres":"••••••••"} value={form.password} onChange={f("password")}/></div>
          {mode==="register"&&<div><label>Provincia</label><select className="select" style={{width:"100%"}} value={form.province} onChange={f("province")}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>}
          {error&&<div style={{background:"rgba(231,76,60,.1)",border:"1px solid rgba(231,76,60,.3)",color:"#E74C3C",padding:"10px 14px",borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>⚠️ {error}</div>}
          {mode==="login"&&<div style={{background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.12)",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>
            💡 Demo: <strong style={{color:"#FFD700"}}>ash@pokemon.com</strong> / <strong style={{color:"#FFD700"}}>pikachu</strong>
          </div>}
          <button className="btn btn-gold" style={{width:"100%",padding:"14px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={submit} disabled={loading}>
            {loading?<><div className="spinner"/>Verificando...</>:mode==="login"?"Entrar al Mercado":"Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── REVIEW MODAL ───────────────────────────────────────────────────────────────
function ReviewModal({ purchase, userId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!rating) return;
    const rev = { id:Date.now(), sellerId:purchase.sellerId, buyerId:userId, cardName:purchase.name, rating, comment, date: new Date().toISOString().split("T")[0] };
    REVIEWS.push(rev);
    onSubmit(rev);
    setDone(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:420 }}>
        {done ? (
          <div style={{ textAlign:"center",padding:"32px 0" }}>
            <div style={{ fontSize:48,marginBottom:12,animation:"float 1.5s ease-in-out infinite" }}>⭐</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#FFD700",letterSpacing:1 }}>¡GRACIAS POR TU RESEÑA!</div>
          </div>
        ) : <>
          <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,marginBottom:6 }}>CALIFICAR VENDEDOR</div>
          <div style={{ color:"#555",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:22 }}>Compraste: <strong style={{color:"#aaa"}}>{purchase.name}</strong></div>

          <div style={{ background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:16,marginBottom:20,display:"flex",alignItems:"center",gap:14 }}>
            {purchase.imgUrl
              ? <img src={purchase.imgUrl} alt="" style={{width:52,height:72,objectFit:"contain",borderRadius:6,flexShrink:0}}/>
              : <div style={{width:52,height:72,background:"rgba(255,255,255,.05)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🃏</div>
            }
            <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontWeight:700 }}>{purchase.sellerName}</div>
              <SellerBadge sellerId={purchase.sellerId} size="md"/>
              <div style={{ fontSize:12,color:"#555",marginTop:4 }}>📍 {purchase.province}</div>
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <label>Tu calificación *</label>
            <div style={{ display:"flex",gap:6,marginTop:4 }}>
              <Stars rating={rating} size={28} interactive onRate={setRating}/>
            </div>
            {rating > 0 && <div style={{ fontSize:12,color:"#FFD700",marginTop:6,fontFamily:"'DM Sans',sans-serif" }}>
              {["","😞 Muy malo","😕 Malo","😐 Regular","😊 Bueno","🤩 Excelente"][rating]}
            </div>}
          </div>
          <div style={{ marginBottom:20 }}>
            <label>Comentario (opcional)</label>
            <textarea className="input" rows={3} placeholder="Contá tu experiencia con el vendedor..." value={comment} onChange={e=>setComment(e.target.value)} style={{resize:"vertical"}}/>
          </div>
          <button className="btn btn-gold" style={{width:"100%",padding:"14px"}} onClick={submit} disabled={!rating}>
            Enviar calificación
          </button>
        </>}
      </div>
    </div>
  );
}

// ── SELLER PROFILE MODAL ───────────────────────────────────────────────────────
function SellerModal({ seller, allCards, onClose, onBuy, userId }) {
  const rep = getReputation(seller.id);
  const sellerReviews = REVIEWS.filter(r=>r.sellerId===seller.id).sort((a,b)=>b.date.localeCompare(a.date));
  const sellerCards = allCards.filter(c=>c.sellerId===seller.id);
  const [tab, setTab] = useState("cartas");

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:560 }}>
        <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>

        {/* Header */}
        <div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:24 }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#FFD700,#FF9500)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#080A12",flexShrink:0 }}>
            {seller.name[0]}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ fontWeight:700,fontSize:20 }}>{seller.name}</div>
            <div style={{ color:"#555",fontSize:13,marginBottom:4 }}>📍 {seller.province}</div>
            {rep.count ? (
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <Stars rating={Math.round(rep.avg)} size={16}/>
                <span style={{ color:"#FFD700",fontWeight:700,fontSize:14 }}>{rep.avg}</span>
                <span style={{ color:"#555",fontSize:12 }}>· {rep.count} reseña{rep.count!==1?"s":""}</span>
              </div>
            ) : <span style={{ color:"#444",fontSize:13 }}>Sin reseñas aún</span>}
          </div>
          <div style={{ marginLeft:"auto",textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#FFD700" }}>{sellerCards.length}</div>
            <div style={{ fontSize:11,color:"#555" }}>cartas activas</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:20 }}>
          {["cartas","reseñas"].map(t=>(
            <button key={t} className={`tab-underline ${tab===t?"active":""}`} onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>
              {t==="cartas"?`🃏 Cartas (${sellerCards.length})`:`⭐ Reseñas (${sellerReviews.length})`}
            </button>
          ))}
        </div>

        {tab === "cartas" && (
          sellerCards.length === 0
          ? <div style={{textAlign:"center",padding:"40px 0",color:"#444",fontFamily:"'DM Sans',sans-serif"}}>Este vendedor no tiene cartas activas.</div>
          : <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {sellerCards.map(c=>(
                <div key={c.id} style={{ display:"flex",gap:12,alignItems:"center",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:12 }}>
                  {c.imgUrl
                    ? <img src={c.imgUrl} alt={c.name} style={{width:42,height:58,objectFit:"contain",borderRadius:6,flexShrink:0}}/>
                    : <div style={{width:42,height:58,background:`${TYPE_COLORS[c.type]||"#333"}22`,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>
                  }
                  <div style={{ flex:1,fontFamily:"'DM Sans',sans-serif" }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{c.name}</div>
                    <div style={{ color:"#555",fontSize:12 }}>{c.set} · <span style={{color:COND_COLOR[c.condition]}}>{COND_LABEL[c.condition]}</span></div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#FFD700" }}>{fmt(c.price)}</div>
                    {userId && userId!==c.sellerId && <button className="btn btn-gold" style={{padding:"6px 14px",fontSize:12,marginTop:4}} onClick={()=>{onBuy(c);onClose();}}>Comprar</button>}
                  </div>
                </div>
              ))}
            </div>
        )}

        {tab === "reseñas" && (
          sellerReviews.length === 0
          ? <div style={{textAlign:"center",padding:"40px 0",color:"#444",fontFamily:"'DM Sans',sans-serif"}}>Todavía no hay reseñas.</div>
          : <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {sellerReviews.map(r=>(
                <div key={r.id} style={{ background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:14,fontFamily:"'DM Sans',sans-serif" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                    <Stars rating={r.rating} size={14}/>
                    <span style={{ fontSize:11,color:"#444" }}>{r.date}</span>
                  </div>
                  <div style={{ fontSize:13,color:"#aaa",marginBottom:4 }}>Carta: <strong style={{color:"#E8E8F0"}}>{r.cardName}</strong></div>
                  {r.comment&&<div style={{ fontSize:13,color:"#888",fontStyle:"italic" }}>"{r.comment}"</div>}
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}

// ── CHECKOUT MODAL ─────────────────────────────────────────────────────────────
function CheckoutModal({ card, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState(card.shipping[0]);
  const base = card.price, commission = Math.round(base*COMMISSION), total = base+commission;

  const pay = async () => {
    setStep(2);
    await new Promise(r=>setTimeout(r,2200));
    setStep(3);
    setTimeout(()=>{onSuccess();onClose();},2400);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&step===1&&onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        {step===1&&<>
          <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,marginBottom:20}}>RESUMEN DE COMPRA</div>

          <div style={{display:"flex",gap:14,alignItems:"center",background:"rgba(255,255,255,.04)",borderRadius:12,padding:14,marginBottom:16,border:"1px solid rgba(255,255,255,.07)"}}>
            {card.imgUrl
              ? <img src={card.imgUrl} alt={card.name} style={{width:56,height:78,objectFit:"contain",borderRadius:8,flexShrink:0}}/>
              : <div style={{width:56,height:78,background:`${TYPE_COLORS[card.type]||"#333"}22`,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🃏</div>
            }
            <div style={{fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontWeight:700,fontSize:15}}>{card.name}</div>
              <div style={{color:"#666",fontSize:12,marginTop:2}}>{card.set} · <span style={{color:COND_COLOR[card.condition]}}>{COND_LABEL[card.condition]}</span></div>
              <div style={{marginTop:6}}><SellerBadge sellerId={card.sellerId}/></div>
              <div style={{color:"#555",fontSize:11,marginTop:3}}>Vendedor: {card.sellerName} · {card.province}</div>
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <label>Forma de envío</label>
            <select className="select" style={{width:"100%"}} value={shipping} onChange={e=>setShipping(e.target.value)}>
              {card.shipping.map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{fontSize:11,color:"#444",marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>⚠️ Costo de envío a coordinar con el vendedor post-compra.</div>
          </div>

          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:14,marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"#888"}}><span>Precio carta</span><span style={{color:"#E8E8F0"}}>{fmt(base)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"#888"}}><span>Comisión servicio (3%)</span><span>+{fmt(commission)}</span></div>
            <div style={{height:1,background:"rgba(255,255,255,.07)",margin:"10px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}>
              <span style={{fontSize:15}}>Total</span>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#FFD700"}}>{fmt(total)}</span>
            </div>
          </div>

          <button className="btn btn-mp" onClick={pay}>
            <span style={{fontWeight:900,fontSize:16,background:"#fff",color:"#009EE3",borderRadius:5,padding:"1px 7px"}}>MP</span>
            Pagar con Mercado Pago
          </button>
          <div style={{fontSize:11,color:"#333",textAlign:"center",marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>🔒 Pago seguro · Compra garantizada</div>
        </>}
        {step===2&&<div style={{textAlign:"center",padding:"44px 20px"}}>
          <div style={{fontSize:44,marginBottom:16,animation:"spin 1s linear infinite",display:"inline-block"}}>⚡</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#FFD700",marginBottom:8,letterSpacing:2}}>PROCESANDO PAGO</div>
          <div style={{color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:14,marginBottom:22}}>Conectando con Mercado Pago...</div>
          <div style={{display:"flex",justifyContent:"center"}}><div className="spinner" style={{width:34,height:34,borderWidth:4}}/></div>
        </div>}
        {step===3&&<div style={{textAlign:"center",padding:"44px 20px"}}>
          <div style={{fontSize:60,marginBottom:12,animation:"float 1.5s ease-in-out infinite"}}>🎉</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#27AE60",letterSpacing:1,marginBottom:8}}>¡PAGO APROBADO!</div>
          <div style={{color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.7}}>
            Compraste <strong style={{color:"#E8E8F0"}}>{card.name}</strong> exitosamente.<br/>El vendedor te contactará para el envío por {shipping}.
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── PUBLISH FORM ───────────────────────────────────────────────────────────────
function PublishForm({ user, onPublish }) {
  const [form, setForm] = useState({ name:"", set:"", setId:"", number:"", condition:"NM", price:"", type:"", rarity:"", description:"", imgUrl:"", uploadedImg:"" });
  const [step, setStep] = useState(0); // 0=form, 1=success
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [imgMode, setImgMode] = useState("official"); // official | upload
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const searchRef = useRef();
  const ff = k => e => setForm(p=>({...p,[k]:e.target.value}));

  // Debounced TCG search
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${TCG_API}/cards?q=name:"${query}"*&pageSize=8&select=id,name,set,types,rarity,number,images`);
        const data = await res.json();
        setSuggestions(data.data || []);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const pickCard = (c) => {
    const typeEs = c.types ? TYPE_EN_TO_ES[c.types[0]] || c.types[0] : "Incoloro";
    setSelectedCard(c);
    setForm(p=>({...p,
      name: c.name,
      set: c.set?.name || "",
      setId: c.set?.id || "",
      number: c.number || "",
      type: typeEs,
      rarity: c.rarity || "",
      imgUrl: c.images?.large || c.images?.small || "",
    }));
    setQuery(c.name);
    setSuggestions([]);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => { setForm(p=>({...p, uploadedImg:e.target.result})); };
    reader.readAsDataURL(file);
    setImgMode("upload");
  };

  const finalImg = imgMode === "upload" ? form.uploadedImg : form.imgUrl;

  const publish = () => {
    if (!form.name || !form.price) return;
    const nc = {
      id: Date.now(), name:form.name, set:form.set, setId:form.setId, number:form.number,
      condition:form.condition, price:Number(form.price), type:form.type||"Incoloro",
      rarity:form.rarity, sellerId:user.id, sellerName:user.name,
      imgUrl: finalImg, hot:false, province:user.province,
      shipping:["Andreani","OCA","Correo Argentino"], listedAt:Date.now(),
    };
    CARDS.unshift(nc);
    onPublish(nc);
    setStep(1);
  };

  if (step === 1) return (
    <div style={{maxWidth:500,margin:"60px auto",textAlign:"center"}}>
      <div className="card" style={{padding:48}}>
        <div style={{fontSize:54,marginBottom:12,animation:"float 2s ease-in-out infinite"}}>🎉</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#FFD700",marginBottom:8,letterSpacing:1}}>¡CARTA PUBLICADA!</div>
        <div style={{color:"#888",fontSize:14,marginBottom:24}}>Tu carta ya está visible en el marketplace.</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-gold" onClick={()=>{setStep(0);setForm({name:"",set:"",setId:"",number:"",condition:"NM",price:"",type:"",rarity:"",description:"",imgUrl:"",uploadedImg:""});setQuery("");setSelectedCard(null);}}>Publicar otra</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:600,paddingTop:28}}>
      <div style={{marginBottom:22}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:1}}>PUBLICAR CARTA</div>
        <div style={{color:"#555",fontSize:13,marginTop:3}}>Buscá la carta en la base de datos oficial o cargá los datos manualmente.</div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {/* TCG Search */}
        <div>
          <label>🔍 Buscar carta en base de datos Pokémon TCG</label>
          <div style={{position:"relative"}}>
            <input className="input" placeholder="Ej: Charizard, Pikachu VMAX, Gardevoir ex..." value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value){setSelectedCard(null);}}} ref={searchRef}/>
            {searching && <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}><div className="spinner" style={{width:16,height:16,borderWidth:2}}/></div>}
            {suggestions.length>0 && (
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#14172A",border:"1px solid rgba(255,215,0,.2)",borderRadius:12,zIndex:50,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>
                {suggestions.map(s=>(
                  <div key={s.id} className="autocomplete-item" onClick={()=>pickCard(s)}>
                    {s.images?.small
                      ? <img src={s.images.small} alt="" style={{width:34,height:47,objectFit:"contain",borderRadius:4,flexShrink:0}}/>
                      : <div style={{width:34,height:47,background:"rgba(255,255,255,.05)",borderRadius:4,flexShrink:0}}/>
                    }
                    <div style={{fontFamily:"'DM Sans',sans-serif"}}>
                      <div style={{fontWeight:700,fontSize:13}}>{s.name}</div>
                      <div style={{color:"#666",fontSize:11}}>{s.set?.name} · {s.rarity} {s.number&&`· #${s.number}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {query.length>=2&&!searching&&suggestions.length===0&&!selectedCard&&<div style={{fontSize:12,color:"#555",marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>No se encontraron resultados. Completá los datos manualmente.</div>}
        </div>

        {/* Preview + image */}
        {(selectedCard||form.name) && (
          <div style={{display:"flex",gap:16,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:16,alignItems:"flex-start"}}>
            {/* Image panel */}
            <div style={{flexShrink:0,width:100}}>
              {finalImg
                ? <img src={finalImg} alt="" style={{width:100,borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}/>
                : <div style={{width:100,height:140,background:"rgba(255,255,255,.04)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🃏</div>
              }
              <div style={{display:"flex",gap:6,marginTop:10}}>
                {form.imgUrl&&<button className="btn" onClick={()=>setImgMode("official")} style={{flex:1,padding:"5px",fontSize:10,background:imgMode==="official"?"rgba(255,215,0,.15)":"rgba(255,255,255,.04)",color:imgMode==="official"?"#FFD700":"#666",border:`1px solid ${imgMode==="official"?"#FFD700":"rgba(255,255,255,.1)"}`,borderRadius:6}}>Oficial</button>}
                <button className="btn" onClick={()=>fileRef.current?.click()} style={{flex:1,padding:"5px",fontSize:10,background:imgMode==="upload"?"rgba(255,215,0,.15)":"rgba(255,255,255,.04)",color:imgMode==="upload"?"#FFD700":"#666",border:`1px solid ${imgMode==="upload"?"#FFD700":"rgba(255,255,255,.1)"}`,borderRadius:6}}>📷 Tuya</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
            </div>

            {/* Fields */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
              <div><label>Nombre *</label><input className="input" placeholder="Nombre de la carta" value={form.name} onChange={ff("name")}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label>Set</label><input className="input" placeholder="Ej: Sword & Shield" value={form.set} onChange={ff("set")}/></div>
                <div><label>Rareza</label><input className="input" placeholder="Ej: Ultra Rara" value={form.rarity} onChange={ff("rarity")}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label>Tipo</label>
                  <select className="select" style={{width:"100%"}} value={form.type} onChange={ff("type")}>
                    <option value="">-- Seleccioná --</option>
                    {Object.values(TYPE_EN_TO_ES).filter((v,i,a)=>a.indexOf(v)===i).map(t=><option key={t}>{t}</option>)}
                    <option>Incoloro</option>
                  </select>
                </div>
                <div><label>Nº de carta</label><input className="input" placeholder="Ej: 20/202" value={form.number} onChange={ff("number")}/></div>
              </div>
            </div>
          </div>
        )}

        {/* Upload zone if no card selected */}
        {!selectedCard&&!form.uploadedImg&&(
          <div className={`upload-zone${dragOver?" drag":""}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current?.click()}>
            <div style={{fontSize:28,marginBottom:8}}>📷</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",color:"#555",fontSize:13}}>Arrastrá una foto o <span style={{color:"#FFD700",cursor:"pointer"}}>hacé clic para subir</span></div>
            <div style={{fontSize:11,color:"#444",marginTop:4}}>JPG, PNG, WEBP · Máx 5MB</div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label>Condición</label>
            <select className="select" style={{width:"100%"}} value={form.condition} onChange={ff("condition")}>
              {CONDITIONS.map(c=><option key={c} value={c}>{COND_LABEL[c]} ({c})</option>)}
            </select>
          </div>
          <div><label>Precio (ARS) *</label>
            <input className="input" type="number" placeholder="Ej: 5000" value={form.price} onChange={ff("price")}/>
          </div>
        </div>

        {Number(form.price)>0&&(
          <div style={{background:"rgba(255,215,0,.05)",border:"1px solid rgba(255,215,0,.12)",borderRadius:9,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Precio carta</span><span>{fmt(form.price)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Comisión (3%)</span><span>+{fmt(Math.round(Number(form.price)*COMMISSION))}</span></div>
            <div style={{borderTop:"1px solid rgba(255,215,0,.1)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700}}>
              <span>Total comprador</span><span style={{color:"#FFD700"}}>{fmt(Math.round(Number(form.price)*(1+COMMISSION)))}</span>
            </div>
            <div style={{color:"#444",fontSize:11,marginTop:4}}>✓ Vos recibís {fmt(form.price)}</div>
          </div>
        )}

        <div><label>Descripción adicional</label><textarea className="input" rows={3} placeholder="Idioma, estado detallado, si es foil, firmada..." value={form.description} onChange={ff("description")} style={{resize:"vertical"}}/></div>

        <div style={{background:"rgba(0,158,227,.05)",border:"1px solid rgba(0,158,227,.12)",borderRadius:10,padding:12,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{color:"#009EE3",fontWeight:700,marginBottom:3}}>📦 Envíos</div>
          <div style={{color:"#666",lineHeight:1.6}}>Tu carta va a aceptar Andreani, OCA y Correo Argentino. El comprador elige y lo coordina con vos post-compra.</div>
        </div>

        <button className="btn btn-gold" style={{width:"100%",padding:"15px",fontSize:15}} onClick={publish} disabled={!form.name||!form.price}>
          ⚡ Publicar en el mercado
        </button>
      </div>
    </div>
  );
}

// ── CARD ITEM ──────────────────────────────────────────────────────────────────
function CardItem({ card, userId, onBuy, onLogin, onSellerClick }) {
  const rep = getReputation(card.sellerId);

  return (
    <div className="card" style={{padding:0,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
      {card.hot&&<span style={{position:"absolute",top:10,right:10,background:"linear-gradient(135deg,#FF4C1A,#FF0044)",color:"#fff",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",zIndex:2}}>🔥 HOT</span>}

      {/* Card image */}
      <div style={{height:160,background:`linear-gradient(160deg,${TYPE_COLORS[card.type]||"#1A1D2E"}18,${TYPE_COLORS[card.type]||"#1A1D2E"}30)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
        {card.imgUrl
          ? <img src={card.imgUrl} alt={card.name} style={{height:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))"}} onError={e=>e.target.style.display="none"}/>
          : <div style={{fontSize:52,opacity:.6}}>🃏</div>
        }
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:40,background:"linear-gradient(to top,rgba(16,19,31,1),transparent)"}}/>
      </div>

      <div style={{padding:"14px 14px 16px",display:"flex",flexDirection:"column",flex:1,fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{card.name}</div>
        <div style={{color:"#555",fontSize:11,marginBottom:8}}>{card.set}{card.number&&` · #${card.number}`}</div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{background:COND_COLOR[card.condition]+"22",color:COND_COLOR[card.condition],padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>{COND_LABEL[card.condition]}</span>
          <span style={{fontSize:10,color:"#444"}}>📍{card.province}</span>
        </div>

        {/* Seller + rep */}
        <button onClick={()=>onSellerClick(card)} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"6px 10px",marginBottom:10,cursor:"pointer",textAlign:"left",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>@{card.sellerName}</span>
          {rep.count>0?<SellerBadge sellerId={card.sellerId}/>:<span style={{fontSize:10,color:"#444"}}>Sin reseñas</span>}
        </button>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto"}}>
          <div>
            <div style={{fontSize:10,color:"#444"}}>ARS</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#FFD700",lineHeight:1}}>{fmt(card.price)}</div>
          </div>
          {userId==null
            ?<button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={onLogin}>Ingresar</button>
            :userId===card.sellerId
              ?<span style={{fontSize:11,color:"#444"}}>Tu carta</span>
              :<button className="btn btn-gold" style={{padding:"8px 14px",fontSize:12}} onClick={()=>onBuy(card)}>Comprar</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [checkoutCard, setCheckoutCard] = useState(null);
  const [sellerModal, setSellerModal] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [tab, setTab] = useState("marketplace");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [sortBy, setSortBy] = useState("reciente");
  const [cards, setCards] = useState(CARDS);
  const [purchases, setPurchases] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const myListings = cards.filter(c=>c.sellerId===user?.id);
  const refresh = () => { setCards([...CARDS]); forceUpdate(n=>n+1); };

  const login = u => { setUser(u); setShowAuth(false); };
  const logout = () => { setUser(null); setMenuOpen(false); setTab("marketplace"); };

  const onBuy = card => { if(!user){setShowAuth(true);return;} setCheckoutCard(card); };

  const onPurchaseSuccess = () => {
    const bought = { ...checkoutCard, purchasedAt:new Date(), reviewed:false };
    setPurchases(p=>[bought,...p]);
    CARDS = CARDS.filter(c=>c.id!==checkoutCard.id);
    refresh();
  };

  const onPublish = () => refresh();

  const openSeller = (card) => {
    const seller = USERS.find(u=>u.id===card.sellerId) || { id:card.sellerId, name:card.sellerName, province:card.province };
    setSellerModal(seller);
  };

  const filtered = cards
    .filter(c=>filterType==="Todos"||c.type===filterType)
    .filter(c=>[c.name,c.sellerName,c.set].join(" ").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==="asc"?a.price-b.price:sortBy==="desc"?b.price-a.price:b.listedAt-a.listedAt);

  return (
    <div style={{minHeight:"100vh",background:"#080A12",color:"#E8E8F0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-280,right:-180,width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,215,0,.06) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 5s ease-in-out infinite"}}/>
      <div style={{position:"fixed",bottom:-200,left:-100,width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,158,227,.05) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 7s ease-in-out infinite 2s"}}/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,.06)",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,10,18,.92)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setTab("marketplace")}>
          <span style={{fontSize:20}}>⚡</span>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:"#FFD700",lineHeight:1}}>TIENDA POKE ROJO</div>
            <div style={{fontSize:9,color:"#444",letterSpacing:2,textTransform:"uppercase"}}>Argentina · Cartas Individuales</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {user?<>
            <button className="btn btn-outline" style={{padding:"8px 16px",fontSize:13}} onClick={()=>setTab("vender")}>+ Publicar</button>
            <div style={{position:"relative"}}>
              <button onClick={()=>setMenuOpen(o=>!o)} className="btn btn-ghost" style={{padding:"7px 14px",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#FFD700,#FF9500)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#080A12",flexShrink:0}}>{user.name[0]}</div>
                {user.name.split(" ")[0]}
              </button>
              {menuOpen&&(
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"#10131F",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:8,minWidth:210,zIndex:100}}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:6}}>
                    <div style={{fontWeight:700,fontSize:14}}>{user.name}</div>
                    <div style={{fontSize:12,color:"#555"}}>{user.email}</div>
                    <div style={{fontSize:12,color:"#555",marginTop:2}}>📍 {user.province}</div>
                    <div style={{marginTop:6}}><SellerBadge sellerId={user.id} size="md"/></div>
                  </div>
                  {[{l:"🏪 Mis publicaciones",a:()=>{setTab("mis-publicaciones");setMenuOpen(false);}},{l:"📦 Mis compras",a:()=>{setTab("mis-compras");setMenuOpen(false);}}].map(i=>(
                    <button key={i.l} onClick={i.a} className="btn" style={{width:"100%",background:"none",border:"none",color:"#aaa",padding:"9px 14px",fontSize:13,textAlign:"left",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}
                      onMouseEnter={e=>e.target.style.background="rgba(255,255,255,.05)"} onMouseLeave={e=>e.target.style.background="none"}>{i.l}</button>
                  ))}
                  <div style={{borderTop:"1px solid rgba(255,255,255,.06)",marginTop:6,paddingTop:6}}>
                    <button onClick={logout} className="btn" style={{width:"100%",background:"none",border:"none",color:"#E74C3C",padding:"9px 14px",fontSize:13,textAlign:"left",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}
                      onMouseEnter={e=>e.target.style.background="rgba(231,76,60,.08)"} onMouseLeave={e=>e.target.style.background="none"}>🚪 Cerrar sesión</button>
                  </div>
                </div>
              )}
            </div>
          </>:<>
            <button className="btn btn-ghost" onClick={()=>setShowAuth(true)}>Iniciar sesión</button>
            <button className="btn btn-gold" onClick={()=>setShowAuth(true)}>Registrarse</button>
          </>}
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px 80px"}}>

        {/* MARKETPLACE */}
        {tab==="marketplace"&&<>
          <div style={{padding:"30px 0 22px",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,.05)",marginBottom:22}}>
            <div style={{flex:1,minWidth:240}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:50,lineHeight:.88,marginBottom:10}}>
                <span style={{color:"#FFD700"}}>COMPRÁ</span> Y <span style={{color:"#FFD700"}}>VENDÉ</span><br/>
                <span style={{color:"#888",fontSize:30}}>CARTAS POKÉMON</span>
              </div>
              <div style={{color:"#555",fontSize:13}}>Marketplace argentino · Pagás en pesos · Envíos a todo el país</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              {[{v:`${cards.length}`,l:"Cartas",i:"🃏"},{v:`${USERS.length}`,l:"Vendedores",i:"👤"},{v:`${REVIEWS.length}`,l:"Reseñas",i:"⭐"}].map(s=>(
                <div key={s.l} className="card" style={{padding:"14px 18px",textAlign:"center",minWidth:88}}>
                  <div style={{fontSize:18,marginBottom:2}}>{s.i}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#FFD700"}}>{s.v}</div>
                  <div style={{fontSize:11,color:"#555"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
              <input className="input" style={{paddingLeft:38}} placeholder="Buscar carta, set o vendedor..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="reciente">Más recientes</option>
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </select>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
            {TYPES_ES.map(t=>(
              <button key={t} className={`filter-chip ${filterType===t?"active":""}`}
                style={filterType===t?{background:TYPE_COLORS[t]||"#FFD700",borderColor:"transparent"}:{}}
                onClick={()=>setFilterType(t)}>{t}</button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
            {filtered.map(c=><CardItem key={c.id} card={c} userId={user?.id} onBuy={onBuy} onLogin={()=>setShowAuth(true)} onSellerClick={openSeller}/>)}
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#333"}}><div style={{fontSize:44,marginBottom:10}}>🃏</div><div>No hay cartas con esos filtros.</div></div>}
        </>}

        {/* VENDER */}
        {tab==="vender"&&<>
          {!user?(
            <div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{fontSize:44,marginBottom:14}}>🔒</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,marginBottom:8,letterSpacing:1}}>NECESITÁS INICIAR SESIÓN</div>
              <div style={{color:"#555",marginBottom:20}}>Para publicar cartas primero tenés que registrarte.</div>
              <button className="btn btn-gold" onClick={()=>setShowAuth(true)}>Iniciar sesión / Registrarse</button>
            </div>
          ):<PublishForm user={user} onPublish={onPublish}/>}
        </>}

        {/* MIS PUBLICACIONES */}
        {tab==="mis-publicaciones"&&user&&<div style={{paddingTop:28}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,marginBottom:3,letterSpacing:1}}>MIS PUBLICACIONES</div>
          <div style={{color:"#555",fontSize:13,marginBottom:20}}>{myListings.length} carta{myListings.length!==1?"s":""} activa{myListings.length!==1?"s":""}</div>
          {myListings.length===0?(
            <div style={{textAlign:"center",padding:"60px 0",color:"#333"}}>
              <div style={{fontSize:44,marginBottom:10}}>📭</div>
              <div style={{marginBottom:16}}>No tenés cartas publicadas todavía.</div>
              <button className="btn btn-gold" onClick={()=>setTab("vender")}>Publicar primera carta</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {myListings.map(c=>(
                <div key={c.id} className="card" style={{padding:14,display:"flex",gap:12,alignItems:"center"}}>
                  {c.imgUrl
                    ?<img src={c.imgUrl} alt="" style={{width:42,height:58,objectFit:"contain",borderRadius:6,flexShrink:0}}/>
                    :<div style={{width:42,height:58,background:"rgba(255,255,255,.05)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>
                  }
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                    <div style={{color:"#555",fontSize:12}}>{c.set} · <span style={{color:COND_COLOR[c.condition]}}>{COND_LABEL[c.condition]}</span> · {c.rarity}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#FFD700"}}>{fmt(c.price)}</div>
                  <button className="btn btn-danger" onClick={()=>{CARDS=CARDS.filter(x=>x.id!==c.id);refresh();}}>Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* MIS COMPRAS */}
        {tab==="mis-compras"&&user&&<div style={{paddingTop:28}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,marginBottom:3,letterSpacing:1}}>MIS COMPRAS</div>
          <div style={{color:"#555",fontSize:13,marginBottom:20}}>{purchases.length} compra{purchases.length!==1?"s":""} realizadas</div>
          {purchases.length===0?(
            <div style={{textAlign:"center",padding:"60px 0",color:"#333"}}>
              <div style={{fontSize:44,marginBottom:10}}>🛒</div>
              <div style={{marginBottom:16}}>Todavía no realizaste ninguna compra.</div>
              <button className="btn btn-gold" onClick={()=>setTab("marketplace")}>Explorar marketplace</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {purchases.map((c,i)=>(
                <div key={i} className="card" style={{padding:14,display:"flex",gap:12,alignItems:"center"}}>
                  {c.imgUrl
                    ?<img src={c.imgUrl} alt="" style={{width:42,height:58,objectFit:"contain",borderRadius:6,flexShrink:0}}/>
                    :<div style={{width:42,height:58,background:"rgba(255,255,255,.05)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>
                  }
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                    <div style={{color:"#555",fontSize:12}}>Vendedor: {c.sellerName} · {c.province}</div>
                    <div style={{color:"#555",fontSize:12}}>Envío: {c.shipping.join(", ")}</div>
                  </div>
                  <div style={{textAlign:"right",marginRight:8}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#FFD700"}}>{fmt(Math.round(c.price*(1+COMMISSION)))}</div>
                    <div style={{fontSize:11,color:"#27AE60",fontWeight:700}}>✓ PAGADO</div>
                  </div>
                  {!c.reviewed?(
                    <button className="btn btn-outline" style={{padding:"8px 14px",fontSize:12,flexShrink:0}}
                      onClick={()=>setReviewTarget({...c,idx:i})}>⭐ Calificar</button>
                  ):(
                    <span style={{fontSize:12,color:"#555",flexShrink:0}}>✓ Calificado</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>

      <div style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"16px 24px",textAlign:"center",color:"#333",fontSize:12}}>
        ⚡ TIENDA POKE ROJO · Argentina · Cartas individuales · Pagos seguros vía Mercado Pago
      </div>

      {/* MODALS */}
      {showAuth&&<AuthModal onLogin={login} onClose={()=>setShowAuth(false)}/>}
      {checkoutCard&&<CheckoutModal card={checkoutCard} onClose={()=>setCheckoutCard(null)} onSuccess={onPurchaseSuccess}/>}
      {sellerModal&&<SellerModal seller={sellerModal} allCards={cards} onClose={()=>setSellerModal(null)} onBuy={onBuy} userId={user?.id}/>}
      {reviewTarget&&<ReviewModal
        purchase={reviewTarget} userId={user?.id}
        onClose={()=>setReviewTarget(null)}
        onSubmit={()=>{ setPurchases(p=>p.map((x,i)=>i===reviewTarget.idx?{...x,reviewed:true}:x)); forceUpdate(n=>n+1); }}
      />}
    </div>
  );
}
