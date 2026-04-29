// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

function PokeBall({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="white" stroke="#222" strokeWidth="4"/>
      <path d="M2 50 Q2 2 50 2 Q98 2 98 50 Z" fill="#CC0000"/>
      <rect x="2" y="46" width="96" height="8" fill="#222"/>
      <circle cx="50" cy="50" r="14" fill="white" stroke="#222" strokeWidth="4"/>
      <circle cx="50" cy="50" r="7" fill="#CC0000"/>
    </svg>
  );
}

const COMMISSION = 0.03;
const TCG_API = "https://api.pokemontcg.io/v2";
const fmt = n => `$${Number(n).toLocaleString("es-AR")}`;

const SET_COLORS = {
  "151":"#DAA520","Scarlet & Violet":"#7B1FA2","Paradox Rift":"#1565C0",
  "Evolving Skies":"#00897B","Brilliant Stars":"#F9A825","Crown Zenith":"#6D4C41",
  "Sword & Shield":"#2E7D32","Vivid Voltage":"#F57F17","Silver Tempest":"#546E7A",
  "Mega Evolución":"#AD1457","Shining Legends":"#FF8F00","Battle Styles":"#C62828",
  "Fusion Strike":"#6A1B9A","Paldea Evolved":"#283593","Obsidian Flames":"#BF360C",
  "Temporal Forces":"#00695C","Twilight Masquerade":"#4527A0","Shrouded Fable":"#37474F",
  "Stellar Crown":"#0277BD","Surging Sparks":"#EF6C00","Prismatic Evolutions":"#880E4F",
};
const TYPE_COLORS = {
  "Fuego":"#FF4C1A","Eléctrico":"#F9A825","Psíquico":"#B24BF3","Dragón":"#4B7BEC",
  "Oscuro":"#5B5EA6","Incoloro":"#7F8C8D","Agua":"#2E86C1","Planta":"#27AE60",
  "Lucha":"#C0392B","Metal":"#7F8C8D","Hada":"#FF69B4",
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
const SETS = ["Todos","151","Scarlet & Violet","Paradox Rift","Evolving Skies","Brilliant Stars",
  "Crown Zenith","Sword & Shield","Vivid Voltage","Silver Tempest","Mega Evolución",
  "Shining Legends","Battle Styles","Fusion Strike","Paldea Evolved","Obsidian Flames",
  "Temporal Forces","Twilight Masquerade","Shrouded Fable","Stellar Crown",
  "Surging Sparks","Prismatic Evolutions"];

const PRODUCT_TYPES = ["Todos","Caja","Lata","Bundle","Mazo","Sobre","Colección Especial","ETB","Blister"];
const PRODUCT_TYPE_COLORS = {
  "Caja":"#E53935","Lata":"#8E24AA","Bundle":"#1E88E5","Mazo":"#43A047",
  "Sobre":"#FB8C00","Colección Especial":"#DAA520","ETB":"#00ACC1","Blister":"#F06292",
};
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#080A12;}::-webkit-scrollbar-thumb{background:#DAA520;border-radius:3px;}
.card{background:#10131F;border:1px solid rgba(255,255,255,.07);border-radius:16px;transition:all .25s;}
.card:hover{border-color:rgba(218,165,32,.3);box-shadow:0 0 28px rgba(218,165,32,.07);transform:translateY(-3px);}
.btn{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;border-radius:10px;font-weight:700;transition:all .2s;}
.btn-gold{background:linear-gradient(135deg,#DAA520,#B8860B);color:#fff;padding:11px 24px;font-size:14px;}
.btn-gold:hover{box-shadow:0 4px 22px rgba(218,165,32,.4);transform:scale(1.04);}
.btn-gold:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;color:#aaa;border:1px solid rgba(255,255,255,.12);padding:10px 20px;font-size:14px;}
.btn-ghost:hover{border-color:#DAA520;color:#DAA520;}
.btn-outline{background:transparent;color:#DAA520;border:1px solid #DAA520;padding:10px 20px;font-size:14px;}
.btn-outline:hover{background:rgba(218,165,32,.1);}
.btn-mp{background:linear-gradient(135deg,#009EE3,#0066B2);color:#fff;padding:16px;font-size:15px;width:100%;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;}
.btn-mp:hover{box-shadow:0 4px 22px rgba(0,158,227,.4);transform:scale(1.02);}
.btn-danger{background:rgba(231,76,60,.12);color:#E74C3C;border:1px solid rgba(231,76,60,.25);padding:8px 16px;font-size:13px;}
.btn-danger:hover{background:rgba(231,76,60,.22);}
.input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#E8E8F0;padding:13px 16px;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border-color .2s;}
.input:focus{border-color:#DAA520;}
.input::placeholder{color:#555;}
.select{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#E8E8F0;padding:13px 16px;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;}
.select:focus{border-color:#DAA520;}
.select option{background:#10131F;}
label{display:block;font-size:11px;font-weight:700;color:#555;letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px;font-family:'DM Sans',sans-serif;}
.filter-chip{background:rgba(255,255,255,.04);color:#666;border:1px solid rgba(255,255,255,.08);padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;font-family:'DM Sans',sans-serif;}
.filter-chip.active{color:#080A12;font-weight:700;border-color:transparent;background:#DAA520;}
.filter-chip:hover{transform:scale(1.04);border-color:rgba(218,165,32,.4);color:#DAA520;}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadein .2s;}
.modal{background:#10131F;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:32px;width:100%;max-width:520px;position:relative;animation:slidein .25s ease;max-height:90vh;overflow-y:auto;}
.modal::-webkit-scrollbar{width:4px;}
@keyframes fadein{from{opacity:0;}to{opacity:1;}}
@keyframes slidein{from{transform:translateY(18px);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@keyframes glow{0%,100%{opacity:.2;}50%{opacity:.5;}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.spinner{width:26px;height:26px;border:3px solid rgba(218,165,32,.2);border-top-color:#DAA520;border-radius:50%;animation:spin .8s linear infinite;}
.autocomplete-item{padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .15s;}
.autocomplete-item:hover{background:rgba(218,165,32,.08);}
.upload-zone{border:2px dashed rgba(255,255,255,.1);border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;}
.upload-zone:hover,.upload-zone.drag{border-color:#DAA520;background:rgba(218,165,32,.04);}
`;

// ── HELPERS ────────────────────────────────────────────────────────────────────
function Stars({ rating, size=14, interactive=false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ fontSize:size, cursor:interactive?"pointer":"default", color:i<=(interactive?hover||rating:rating)?"#DAA520":"#333", transition:"color .1s" }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(i)}>★</span>
      ))}
    </div>
  );
}

function SellerBadge({ reviews, size="sm" }) {
  if (!reviews || !reviews.length) return <span style={{ fontSize:11, color:"#444", fontFamily:"'DM Sans',sans-serif" }}>Sin reseñas</span>;
  const avg = (reviews.reduce((s,x) => s+x.rating,0)/reviews.length).toFixed(1);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <Stars rating={Math.round(avg)} size={size==="sm"?11:14} />
      <span style={{ fontSize:size==="sm"?11:13, color:"#DAA520", fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{avg}</span>
      <span style={{ fontSize:size==="sm"?10:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>({reviews.length})</span>
    </div>
  );
}

// ── AUTH MODAL ─────────────────────────────────────────────────────────────────
function AuthModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", province:"Buenos Aires" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (err) { setError("Email o contraseña incorrectos."); setLoading(false); return; }
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        onLogin({ id: data.user.id, email: data.user.email, name: profile?.name || data.user.email, province: profile?.province || "" });
      } else {
        if (!form.name || !form.email || !form.password) { setError("Completá todos los campos."); setLoading(false); return; }
        if (form.password.length < 6) { setError("Mínimo 6 caracteres."); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (err) { setError(err.message); setLoading(false); return; }
        await supabase.from("profiles").insert({ id: data.user.id, name: form.name, province: form.province });
        onLogin({ id: data.user.id, email: form.email, name: form.name, province: form.province });
      }
    } catch(e) { setError("Error inesperado. Intentá de nuevo."); }
    setLoading(false);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><PokeBall size={36}/></div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520",letterSpacing:2}}>TIENDA POKE ROJO</div>
          <div style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{mode==="login"?"Ingresá a tu cuenta":"Creá tu cuenta gratis"}</div>
        </div>
        <div style={{display:"flex",background:"rgba(255,255,255,.04)",borderRadius:10,padding:4,marginBottom:20}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} className="btn" style={{flex:1,background:mode===m?"rgba(218,165,32,.15)":"transparent",color:mode===m?"#DAA520":"#555",border:"none",padding:"9px",fontSize:13,fontWeight:700,borderRadius:8}}>
              {m==="login"?"Iniciar sesión":"Registrarse"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="register"&&<div><label>Nombre completo</label><input className="input" placeholder="Ej: Lucas García" value={form.name} onChange={f("name")}/></div>}
          <div><label>Email</label><input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={f("email")}/></div>
          <div><label>Contraseña</label><input className="input" type="password" placeholder={mode==="register"?"Mínimo 6 caracteres":"••••••••"} value={form.password} onChange={f("password")}/></div>
          {mode==="register"&&<div><label>Provincia</label><select className="select" style={{width:"100%"}} value={form.province} onChange={f("province")}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>}
          {error&&<div style={{background:"rgba(231,76,60,.1)",border:"1px solid rgba(231,76,60,.3)",color:"#E74C3C",padding:"10px 14px",borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>⚠️ {error}</div>}
          <button className="btn btn-gold" style={{width:"100%",padding:"14px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={submit} disabled={loading}>
            {loading?<><div className="spinner"/>Verificando...</>:mode==="login"?"Entrar a la Tienda":"Crear cuenta"}
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
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setLoading(true);
    const { data, error } = await supabase.from("reviews").insert({
      seller_id: purchase.sellerId, buyer_id: userId,
      card_name: purchase.name, rating, comment
    }).select().single();
    if (!error) { onSubmit(data); setDone(true); setTimeout(onClose, 1800); }
    setLoading(false);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        {done ? (
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:48,marginBottom:12,animation:"float 1.5s ease-in-out infinite"}}>⭐</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520",letterSpacing:1}}>¡GRACIAS POR TU RESEÑA!</div>
          </div>
        ) : <>
          <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,marginBottom:6}}>CALIFICAR VENDEDOR</div>
          <div style={{color:"#555",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:22}}>Compraste: <strong style={{color:"#aaa"}}>{purchase.name}</strong></div>
          <div style={{marginBottom:18}}>
            <label>Tu calificación *</label>
            <div style={{display:"flex",gap:6,marginTop:4}}><Stars rating={rating} size={28} interactive onRate={setRating}/></div>
            {rating>0&&<div style={{fontSize:12,color:"#DAA520",marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>{["","😞 Muy malo","😕 Malo","😐 Regular","😊 Bueno","🤩 Excelente"][rating]}</div>}
          </div>
          <div style={{marginBottom:20}}>
            <label>Comentario (opcional)</label>
            <textarea className="input" rows={3} placeholder="Contá tu experiencia..." value={comment} onChange={e=>setComment(e.target.value)} style={{resize:"vertical"}}/>
          </div>
          <button className="btn btn-gold" style={{width:"100%",padding:"14px",display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={submit} disabled={!rating||loading}>
            {loading?<><div className="spinner"/>Enviando...</>:"Enviar calificación"}
          </button>
        </>}
      </div>
    </div>
  );
}

// ── SELLER MODAL ───────────────────────────────────────────────────────────────
function SellerModal({ seller, allCards, onClose, onBuy, userId }) {
  const [sellerReviews, setSellerReviews] = useState([]);
  const [tab, setTab] = useState("cartas");
  const sellerCards = allCards.filter(c=>c.seller_id===seller.id||c.sellerId===seller.id);

  useEffect(() => {
    supabase.from("reviews").select("*").eq("seller_id", seller.id).order("created_at", {ascending:false})
      .then(({data}) => data && setSellerReviews(data));
  }, [seller.id]);

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <button onClick={onClose} className="btn" style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",color:"#888",width:30,height:30,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:24}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#DAA520,#B8860B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#fff",flexShrink:0}}>{seller.name[0]}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontWeight:700,fontSize:20}}>{seller.name}</div>
            <div style={{color:"#555",fontSize:13,marginBottom:4}}>📍 {seller.province}</div>
            <SellerBadge reviews={sellerReviews} size="md"/>
          </div>
          <div style={{marginLeft:"auto",textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#DAA520"}}>{sellerCards.length}</div>
            <div style={{fontSize:11,color:"#555"}}>cartas activas</div>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:20}}>
          {["cartas","reseñas"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"#DAA520":"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",padding:"14px 18px",borderBottom:tab===t?"2px solid #DAA520":"2px solid transparent",transition:"all .2s"}}>
              {t==="cartas"?`🃏 Cartas (${sellerCards.length})`:`⭐ Reseñas (${sellerReviews.length})`}
            </button>
          ))}
        </div>
        {tab==="cartas"&&(sellerCards.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#444",fontFamily:"'DM Sans',sans-serif"}}>Sin cartas activas.</div>:
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sellerCards.map(c=>(
              <div key={c.id} style={{display:"flex",gap:12,alignItems:"center",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:12}}>
                {c.img_url||c.imgUrl?<img src={c.img_url||c.imgUrl} alt={c.name} style={{width:42,height:58,objectFit:"contain",borderRadius:6,flexShrink:0}}/>:<div style={{width:42,height:58,background:"rgba(255,255,255,.05)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>}
                <div style={{flex:1,fontFamily:"'DM Sans',sans-serif"}}>
                  <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                  <div style={{color:"#555",fontSize:12}}>{c.set_name||c.set} · <span style={{color:COND_COLOR[c.condition]}}>{COND_LABEL[c.condition]}</span></div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#DAA520"}}>{fmt(c.price)}</div>
                  {userId&&userId!==(c.seller_id||c.sellerId)&&<button className="btn btn-gold" style={{padding:"6px 14px",fontSize:12,marginTop:4}} onClick={()=>{onBuy(c);onClose();}}>Comprar</button>}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="reseñas"&&(sellerReviews.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#444",fontFamily:"'DM Sans',sans-serif"}}>Sin reseñas todavía.</div>:
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {sellerReviews.map(r=>(
              <div key={r.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:14,fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><Stars rating={r.rating} size={14}/><span style={{fontSize:11,color:"#444"}}>{r.created_at?.split("T")[0]}</span></div>
                <div style={{fontSize:13,color:"#aaa",marginBottom:4}}>Carta: <strong style={{color:"#E8E8F0"}}>{r.card_name}</strong></div>
                {r.comment&&<div style={{fontSize:13,color:"#888",fontStyle:"italic"}}>"{r.comment}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CHECKOUT MODAL ─────────────────────────────────────────────────────────────
function CheckoutModal({ card, user, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState((card.shipping||["Andreani"])[0]);
  const base = card.price, commission = Math.round(base*COMMISSION), total = base+commission;

  const pay = async () => {
    setStep(2);
    // Save pending purchase first
    const { data: purchaseData } = await supabase.from("purchases").insert({
      card_id: card.id, buyer_id: user.id,
      seller_id: card.seller_id || card.sellerId,
      card_name: card.name, amount: total,
      commission, shipping_method: shipping, status: "pending",
      seller_name: card.seller_name || card.sellerName,
      seller_province: card.province,
      card_img_url: card.img_url || card.imgUrl,
      card_set: card.set_name || card.set
    }).select().single();
    // Mark card as reserved
    await supabase.from("cards").update({ sold: true }).eq("id", card.id);
    // Call MP edge function
    try {
      const fnRes = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/bright-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id, cardName: card.name, amount: total,
          buyerEmail: user.email, shippingMethod: shipping,
          sellerName: card.seller_name || card.sellerName,
          sellerProvince: card.province
        })
      });
      const mpData = await fnRes.json();
      if (mpData?.init_point) {
        window.location.href = mpData.init_point;
        return;
      }
    } catch(e) { console.error('MP error:', e); }
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
            {(card.img_url||card.imgUrl)?<img src={card.img_url||card.imgUrl} alt={card.name} style={{width:56,height:78,objectFit:"contain",borderRadius:8,flexShrink:0}}/>:<div style={{width:56,height:78,background:"rgba(255,255,255,.05)",borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🃏</div>}
            <div style={{fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontWeight:700,fontSize:15}}>{card.name}</div>
              <div style={{color:"#666",fontSize:12,marginTop:2}}>{card.set_name||card.set} · <span style={{color:COND_COLOR[card.condition]}}>{COND_LABEL[card.condition]}</span></div>
              <div style={{color:"#555",fontSize:11,marginTop:3}}>Vendedor: {card.seller_name||card.sellerName} · {card.province}</div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label>Forma de envío</label>
            <select className="select" style={{width:"100%"}} value={shipping} onChange={e=>setShipping(e.target.value)}>
              {(card.shipping||["Andreani","OCA","Correo Argentino"]).map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{fontSize:11,color:"#444",marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>⚠️ Costo de envío a coordinar con el vendedor post-compra.</div>
          </div>
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:14,marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"#888"}}><span>Precio carta</span><span style={{color:"#E8E8F0"}}>{fmt(base)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"#888"}}><span>Comisión servicio (3%)</span><span>+{fmt(commission)}</span></div>
            <div style={{height:1,background:"rgba(255,255,255,.07)",margin:"10px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span style={{fontSize:15}}>Total</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520"}}>{fmt(total)}</span></div>
          </div>
          <button className="btn btn-mp" onClick={pay}><span style={{fontWeight:900,fontSize:16,background:"#fff",color:"#009EE3",borderRadius:5,padding:"1px 7px"}}>MP</span>Pagar con Mercado Pago</button>
          <div style={{fontSize:11,color:"#333",textAlign:"center",marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>🔒 Pago seguro · Compra garantizada</div>
        </>}
        {step===2&&<div style={{textAlign:"center",padding:"44px 20px"}}>
          <div style={{marginBottom:16,animation:"spin 1s linear infinite",display:"inline-block"}}><PokeBall size={44}/></div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520",marginBottom:8,letterSpacing:2}}>PROCESANDO PAGO</div>
          <div style={{color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:14,marginBottom:22}}>Conectando con Mercado Pago...</div>
          <div style={{display:"flex",justifyContent:"center"}}><div className="spinner" style={{width:34,height:34,borderWidth:4}}/></div>
        </div>}
        {step===3&&<div style={{textAlign:"center",padding:"44px 20px"}}>
          <div style={{fontSize:60,marginBottom:12,animation:"float 1.5s ease-in-out infinite"}}>🎉</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#27AE60",letterSpacing:1,marginBottom:8}}>¡PAGO APROBADO!</div>
          <div style={{color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.7}}>Compraste <strong style={{color:"#E8E8F0"}}>{card.name}</strong> exitosamente.<br/>El vendedor te contactará para el envío por {shipping}.</div>
        </div>}
      </div>
    </div>
  );
}

// ── PUBLISH FORM ───────────────────────────────────────────────────────────────
function PublishForm({ user, onPublish }) {
  const [form, setForm] = useState({ name:"", set:"", setId:"", condition:"NM", price:"", type:"", rarity:"", description:"", imgUrl:"", uploadedImg:"", quantity:"1" });
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [imgMode, setImgMode] = useState("official");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const ff = k => e => setForm(p=>({...p,[k]:e.target.value}));

  useEffect(() => {
    if (query.length<2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const apiKey = import.meta.env.VITE_TCG_API_KEY || "";
        const res = await fetch(`${TCG_API}/cards?q=name:${encodeURIComponent(query)}*&pageSize=24&select=id,name,set,types,rarity,number,images`, {
          headers: apiKey ? { "X-Api-Key": apiKey } : {}
        });
        const data = await res.json();
        setSuggestions(data.data||[]);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const pickCard = (c) => {
    const typeEs = c.types ? TYPE_EN_TO_ES[c.types[0]]||c.types[0] : "Incoloro";
    setSelectedCard(c);
    setForm(p=>({...p, name:c.name, set:c.set?.name||"", setId:c.set?.id||"", type:typeEs, rarity:c.rarity||"", imgUrl:c.images?.large||c.images?.small||""}));
    setQuery(c.name);
    setSuggestions([]);
  };

  const handleFile = (file) => {
    if (!file||!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setForm(p=>({...p, uploadedImg:e.target.result}));
    reader.readAsDataURL(file);
    setImgMode("upload");
  };

  const finalImg = imgMode==="upload" ? form.uploadedImg : form.imgUrl;

  const publish = async () => {
    if (!form.name||!form.price) return;
    setLoading(true);
    const { data, error } = await supabase.from("cards").insert({
      seller_id: user.id, seller_name: user.name,
      name: form.name, set_name: form.set, set_id: form.setId,
      condition: form.condition, price: Number(form.price),
      type: form.type||"Incoloro", rarity: form.rarity,
      img_url: finalImg, province: user.province,
      shipping: ["Andreani","OCA","Correo Argentino"],
      description: form.description, quantity: Number(form.quantity)||1,
      hot: false, sold: false
    }).select().single();
    setLoading(false);
    if (!error && data) { onPublish(data); setStep(1); }
  };

  if (step===1) return (
    <div style={{maxWidth:500,margin:"60px auto",textAlign:"center"}}>
      <div className="card" style={{padding:48}}>
        <div style={{fontSize:54,marginBottom:12,animation:"float 2s ease-in-out infinite"}}>🎉</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#DAA520",marginBottom:8,letterSpacing:1}}>¡CARTA PUBLICADA!</div>
        <div style={{color:"#888",fontSize:14,marginBottom:24}}>Tu carta ya está visible en el marketplace.</div>
        <button className="btn btn-gold" onClick={()=>{setStep(0);setForm({name:"",set:"",setId:"",condition:"NM",price:"",type:"",rarity:"",description:"",imgUrl:"",uploadedImg:"",quantity:"1"});setQuery("");setSelectedCard(null);}}>Publicar otra</button>
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
        <div>
          <label>🔍 Buscar carta en base de datos Pokémon TCG</label>
          <div style={{position:"relative"}}>
            <input className="input" placeholder="Ej: Charizard, Pikachu VMAX, Gardevoir ex..." value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value)setSelectedCard(null);}} onBlur={()=>setTimeout(()=>setSuggestions([]),150)}/>
            {searching&&<div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}><div className="spinner" style={{width:16,height:16,borderWidth:2}}/></div>}
            {suggestions.length>0&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#14172A",border:"1px solid rgba(218,165,32,.2)",borderRadius:12,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,.6)",maxHeight:360,overflowY:"auto",padding:12}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:8}}>
                  {suggestions.map(s=>(
                    <div key={s.id} onMouseDown={e=>{e.preventDefault();pickCard(s);}} style={{cursor:"pointer",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:8,display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#DAA520";e.currentTarget.style.background="rgba(218,165,32,.08)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.background="rgba(255,255,255,.04)";}}>
                      {s.images?.small
                        ?<img src={s.images.small} alt="" style={{width:60,height:84,objectFit:"contain",borderRadius:6}}/>
                        :<div style={{width:60,height:84,background:"rgba(255,255,255,.05)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>
                      }
                      <div style={{fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>
                        <div style={{fontWeight:700,fontSize:11,color:"#E8E8F0",lineHeight:1.2}}>{s.name}</div>
                        <div style={{color:"#666",fontSize:10,marginTop:2}}>{s.set?.name}</div>
                        {s.rarity&&<div style={{color:"#DAA520",fontSize:9,marginTop:1}}>{s.rarity}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(selectedCard||form.name)&&(
          <div style={{display:"flex",gap:16,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:16,alignItems:"flex-start"}}>
            <div style={{flexShrink:0,width:100}}>
              {finalImg?<img src={finalImg} alt="" style={{width:100,borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}/>:<div style={{width:100,height:140,background:"rgba(255,255,255,.04)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🃏</div>}
              <div style={{display:"flex",gap:6,marginTop:10}}>
                {form.imgUrl&&<button className="btn" onClick={()=>setImgMode("official")} style={{flex:1,padding:"5px",fontSize:10,background:imgMode==="official"?"rgba(218,165,32,.15)":"rgba(255,255,255,.04)",color:imgMode==="official"?"#DAA520":"#666",border:`1px solid ${imgMode==="official"?"#DAA520":"rgba(255,255,255,.1)"}`,borderRadius:6}}>Oficial</button>}
                <button className="btn" onClick={()=>fileRef.current?.click()} style={{flex:1,padding:"5px",fontSize:10,background:imgMode==="upload"?"rgba(218,165,32,.15)":"rgba(255,255,255,.04)",color:imgMode==="upload"?"#DAA520":"#666",border:`1px solid ${imgMode==="upload"?"#DAA520":"rgba(255,255,255,.1)"}`,borderRadius:6}}>📷 Tuya</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files&&handleFile(e.target.files[0])}/>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
              <div><label>Nombre *</label><input className="input" placeholder="Nombre de la carta" value={form.name} onChange={ff("name")}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label>Set</label><input className="input" placeholder="Ej: Scarlet & Violet" value={form.set} onChange={ff("set")}/></div>
                <div><label>Rareza</label><input className="input" placeholder="Ej: Ultra Rara" value={form.rarity} onChange={ff("rarity")}/></div>
              </div>
              <div><label>Tipo</label>
                <select className="select" style={{width:"100%"}} value={form.type} onChange={ff("type")}>
                  <option value="">-- Seleccioná --</option>
                  {Object.values(TYPE_EN_TO_ES).filter((v,i,a)=>a.indexOf(v)===i).map(t=><option key={t}>{t}</option>)}
                  <option>Incoloro</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {!selectedCard&&!form.uploadedImg&&(
          <div className={`upload-zone${dragOver?" drag":""}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current?.click()}>
            <div style={{fontSize:28,marginBottom:8}}>📷</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",color:"#555",fontSize:13}}>Arrastrá una foto o <span style={{color:"#DAA520",cursor:"pointer"}}>hacé clic para subir</span></div>
            <div style={{fontSize:11,color:"#444",marginTop:4}}>JPG, PNG, WEBP · Máx 5MB</div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files&&handleFile(e.target.files[0])}/>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label>Condición</label>
            <select className="select" style={{width:"100%"}} value={form.condition} onChange={ff("condition")}>
              {CONDITIONS.map(c=><option key={c} value={c}>{COND_LABEL[c]} ({c})</option>)}
            </select>
          </div>
          <div><label>Cantidad de ejemplares *</label><input className="input" type="number" min="1" max="99" placeholder="Ej: 1" value={form.quantity} onChange={ff("quantity")}/></div>
        </div>

        <div><label>Precio (ARS) *</label><input className="input" type="number" placeholder="Ej: 5000" value={form.price} onChange={ff("price")}/></div>

        {Number(form.price)>0&&(
          <div style={{background:"rgba(218,165,32,.05)",border:"1px solid rgba(218,165,32,.12)",borderRadius:9,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Precio carta</span><span>{fmt(form.price)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Comisión (3%)</span><span>+{fmt(Math.round(Number(form.price)*COMMISSION))}</span></div>
            <div style={{borderTop:"1px solid rgba(218,165,32,.1)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700}}>
              <span>Total comprador</span><span style={{color:"#DAA520"}}>{fmt(Math.round(Number(form.price)*(1+COMMISSION)))}</span>
            </div>
            <div style={{color:"#444",fontSize:11,marginTop:4}}>✓ Vos recibís {fmt(form.price)}</div>
          </div>
        )}

        <div><label>Descripción adicional</label><textarea className="input" rows={3} placeholder="Idioma, estado detallado, si es foil..." value={form.description} onChange={ff("description")} style={{resize:"vertical"}}/></div>

        <button className="btn btn-gold" style={{width:"100%",padding:"15px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={publish} disabled={!form.name||!form.price||loading}>
          {loading?<><div className="spinner"/>Publicando...</>:"Publicar en la tienda"}
        </button>
      </div>
    </div>
  );
}

// ── CARD ITEM ──────────────────────────────────────────────────────────────────
function CardItem({ card, userId, onBuy, onLogin, onSellerClick, reviews }) {
  const cardReviews = reviews.filter(r=>r.seller_id===(card.seller_id||card.sellerId));
  const setColor = SET_COLORS[card.set_name||card.set] || "#444";
  const imgUrl = card.img_url || card.imgUrl;
  const sellerName = card.seller_name || card.sellerName;
  const sellerId = card.seller_id || card.sellerId;

  return (
    <div className="card" style={{padding:0,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
      {card.hot&&<span style={{position:"absolute",top:10,right:10,background:"linear-gradient(135deg,#E53935,#B71C1C)",color:"#fff",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",zIndex:2}}>🔥 HOT</span>}
      <div style={{height:160,background:`linear-gradient(160deg,${setColor}18,${setColor}30)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
        {imgUrl?<img src={imgUrl} alt={card.name} style={{height:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))"}} onError={e=>e.target.style.display="none"}/>:<div style={{fontSize:52,opacity:.6}}>🃏</div>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:40,background:"linear-gradient(to top,rgba(16,19,31,1),transparent)"}}/>
      </div>
      <div style={{padding:"14px 14px 16px",display:"flex",flexDirection:"column",flex:1,fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{card.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{background:setColor+"22",color:setColor,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{card.set_name||card.set}</span>
          {card.quantity>1&&<span style={{fontSize:10,color:"#DAA520",fontWeight:700}}>x{card.quantity}</span>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{background:COND_COLOR[card.condition]+"22",color:COND_COLOR[card.condition],padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>{COND_LABEL[card.condition]}</span>
          <span style={{fontSize:10,color:"#444"}}>📍{card.province}</span>
        </div>
        <button onClick={()=>onSellerClick(card)} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"6px 10px",marginBottom:10,cursor:"pointer",textAlign:"left",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#888"}}>@{sellerName}</span>
          <SellerBadge reviews={cardReviews}/>
        </button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto"}}>
          <div>
            <div style={{fontSize:10,color:"#444"}}>ARS</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520",lineHeight:1}}>{fmt(card.price)}</div>
          </div>
          {userId==null
            ?<button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={onLogin}>Ingresar</button>
            :userId===sellerId
              ?<span style={{fontSize:11,color:"#444"}}>Tu carta</span>
              :<button className="btn btn-gold" style={{padding:"8px 14px",fontSize:12}} onClick={()=>onBuy(card)}>Comprar</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── SEALED PRODUCT ITEM ────────────────────────────────────────────────────────
function SealedItem({ product, userId, onBuy, onLogin, onSellerClick, reviews }) {
  const rep = reviews.filter(r => r.seller_id === product.seller_id);
  const typeColor = PRODUCT_TYPE_COLORS[product.product_type] || "#DAA520";

  return (
    <div className="card" style={{padding:0,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{height:160,background:`linear-gradient(160deg,${typeColor}18,${typeColor}30)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
        {product.img_url
          ?<img src={product.img_url} alt={product.name} style={{height:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))"}} onError={e=>e.target.style.display="none"}/>
          :<div style={{fontSize:52,opacity:.6}}>📦</div>
        }
        <div style={{position:"absolute",top:10,left:10,background:typeColor,color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{product.product_type}</div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:40,background:"linear-gradient(to top,rgba(16,19,31,1),transparent)"}}/>
      </div>
      <div style={{padding:"14px 14px 16px",display:"flex",flexDirection:"column",flex:1,fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{product.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          {product.set_name&&<span style={{background:"rgba(255,255,255,.06)",color:"#888",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{product.set_name}</span>}
          <span style={{background:product.condition==="Sellado"?"rgba(39,174,96,.15)":"rgba(243,156,18,.15)",color:product.condition==="Sellado"?"#27AE60":"#F39C12",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{product.condition}</span>
          {product.quantity>1&&<span style={{fontSize:10,color:"#DAA520",fontWeight:700}}>x{product.quantity}</span>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:10,color:"#444"}}>📍{product.province}</span>
        </div>
        <button onClick={()=>onSellerClick(product)} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"6px 10px",marginBottom:10,cursor:"pointer",textAlign:"left",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#888"}}>@{product.seller_name}</span>
          <SellerBadge reviews={rep}/>
        </button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto"}}>
          <div>
            <div style={{fontSize:10,color:"#444"}}>ARS</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#DAA520",lineHeight:1}}>{fmt(product.price)}</div>
          </div>
          {userId==null
            ?<button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={onLogin}>Ingresar</button>
            :userId===product.seller_id
              ?<span style={{fontSize:11,color:"#444"}}>Tu producto</span>
              :<button className="btn btn-gold" style={{padding:"8px 14px",fontSize:12}} onClick={()=>onBuy(product)}>Comprar</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── PUBLISH SEALED FORM ────────────────────────────────────────────────────────
function PublishSealedForm({ user, onPublish }) {
  const [form, setForm] = useState({ name:"", product_type:"Caja", set_name:"", condition:"Sellado", price:"", description:"", quantity:"1", uploadedImg:"" });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const ff = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleFile = (file) => {
    if (!file||!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setForm(p=>({...p, uploadedImg:e.target.result}));
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!form.name||!form.price) return;
    setLoading(true);
    const { data, error } = await supabase.from("sealed_products").insert({
      seller_id: user.id, seller_name: user.name,
      name: form.name, product_type: form.product_type,
      set_name: form.set_name, condition: form.condition,
      price: Number(form.price), img_url: form.uploadedImg||"",
      province: user.province, description: form.description,
      quantity: Number(form.quantity)||1,
      shipping: ["Andreani","OCA","Correo Argentino"],
      hot: false, sold: false
    }).select().single();
    setLoading(false);
    if (!error && data) { onPublish(data); setStep(1); }
  };

  if (step===1) return (
    <div style={{maxWidth:500,margin:"60px auto",textAlign:"center"}}>
      <div className="card" style={{padding:48}}>
        <div style={{fontSize:54,marginBottom:12,animation:"float 2s ease-in-out infinite"}}>🎉</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#DAA520",marginBottom:8,letterSpacing:1}}>¡PRODUCTO PUBLICADO!</div>
        <div style={{color:"#888",fontSize:14,marginBottom:24}}>Ya está visible en el marketplace.</div>
        <button className="btn btn-gold" onClick={()=>{setStep(0);setForm({name:"",product_type:"Caja",set_name:"",condition:"Sellado",price:"",description:"",quantity:"1",uploadedImg:""});}}>Publicar otro</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:600,paddingTop:28}}>
      <div style={{marginBottom:22}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:1}}>PUBLICAR PRODUCTO SELLADO</div>
        <div style={{color:"#555",fontSize:13,marginTop:3}}>Cajas, latas, bundles y más.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {/* Image upload */}
        {form.uploadedImg
          ?<div style={{position:"relative",display:"inline-block"}}>
            <img src={form.uploadedImg} alt="" style={{width:160,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}/>
            <button className="btn btn-danger" style={{position:"absolute",top:8,right:8,padding:"4px 10px",fontSize:11}} onClick={()=>setForm(p=>({...p,uploadedImg:""}))}>✕</button>
          </div>
          :<div className={`upload-zone${dragOver?" drag":""}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current?.click()}>
            <div style={{fontSize:28,marginBottom:8}}>📷</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",color:"#555",fontSize:13}}>Subí una foto del producto</div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files&&handleFile(e.target.files[0])}/>
          </div>
        }
        <div><label>Nombre del producto *</label><input className="input" placeholder="Ej: Caja Scarlet & Violet 151" value={form.name} onChange={ff("name")}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label>Tipo de producto *</label>
            <select className="select" style={{width:"100%"}} value={form.product_type} onChange={ff("product_type")}>
              {PRODUCT_TYPES.filter(t=>t!=="Todos").map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label>Estado</label>
            <select className="select" style={{width:"100%"}} value={form.condition} onChange={ff("condition")}>
              <option>Sellado</option>
              <option>Abierto</option>
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label>Set / Expansión</label><input className="input" placeholder="Ej: 151" value={form.set_name} onChange={ff("set_name")}/></div>
          <div><label>Cantidad *</label><input className="input" type="number" min="1" placeholder="1" value={form.quantity} onChange={ff("quantity")}/></div>
        </div>
        <div><label>Precio (ARS) *</label><input className="input" type="number" placeholder="Ej: 25000" value={form.price} onChange={ff("price")}/></div>
        {Number(form.price)>0&&(
          <div style={{background:"rgba(218,165,32,.05)",border:"1px solid rgba(218,165,32,.12)",borderRadius:9,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Precio producto</span><span>{fmt(form.price)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#888",marginBottom:6}}><span>Comisión (3%)</span><span>+{fmt(Math.round(Number(form.price)*COMMISSION))}</span></div>
            <div style={{borderTop:"1px solid rgba(218,165,32,.1)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total comprador</span><span style={{color:"#DAA520"}}>{fmt(Math.round(Number(form.price)*(1+COMMISSION)))}</span></div>
            <div style={{color:"#444",fontSize:11,marginTop:4}}>✓ Vos recibís {fmt(form.price)}</div>
          </div>
        )}
        <div><label>Descripción</label><textarea className="input" rows={3} placeholder="Contenido, idioma, estado detallado..." value={form.description} onChange={ff("description")} style={{resize:"vertical"}}/></div>
        <button className="btn btn-gold" style={{width:"100%",padding:"15px",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={publish} disabled={!form.name||!form.price||loading}>
          {loading?<><div className="spinner"/>Publicando...</>:"📦 Publicar producto"}
        </button>
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
  const [filterSet, setFilterSet] = useState("Todos");
  const [sortBy, setSortBy] = useState("reciente");
  const [cards, setCards] = useState([]);
  const [sealedProducts, setSealedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'approved' | 'failed' | 'pending'
  const [lastPurchase, setLastPurchase] = useState(null);

  // Detect MP return params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) {
      setPaymentStatus(status);
      // Load last purchase from Supabase
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data } = await supabase.from("purchases")
            .select("*").eq("buyer_id", session.user.id)
            .order("created_at", { ascending: false }).limit(1).single();
          if (data) {
            setLastPurchase({
              cardName: data.card_name,
              cardImg: data.card_img_url,
              sellerName: data.seller_name,
              sellerProvince: data.seller_province,
              shipping: data.shipping_method,
              total: data.amount,
              set: data.card_set
            });
            if (status === 'approved') {
              await supabase.from("purchases").update({ status: 'approved' }).eq("id", data.id);
            }
          }
        }
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => {
            if (data) setUser({ id: session.user.id, email: session.user.email, name: data.name, province: data.province });
          });
      }
    });
  }, []);

  // Load cards
  const loadCards = async () => {
    setLoadingCards(true);
    const { data } = await supabase.from("cards").select("*").eq("sold", false).order("listed_at", { ascending: false });
    if (data) setCards(data);
    setLoadingCards(false);
  };

  // Load sealed products
  const loadSealedProducts = async () => {
    const { data } = await supabase.from("sealed_products").select("*").eq("sold", false).order("listed_at", { ascending: false });
    if (data) setSealedProducts(data);
  };

  // Load reviews
  const loadReviews = async () => {
    const { data } = await supabase.from("reviews").select("*");
    if (data) setReviews(data);
  };

  // Load purchases for current user
  const loadPurchases = async () => {
    if (!user) return;
    const { data } = await supabase.from("purchases").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false });
    if (data) setPurchases(data.map(p => ({ ...p, reviewed: false })));
  };

  useEffect(() => { loadCards(); loadSealedProducts(); loadReviews(); }, []);
  useEffect(() => { if (user) loadPurchases(); }, [user]);

  const login = u => { setUser(u); setShowAuth(false); };
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setMenuOpen(false); setTab("marketplace"); setPurchases([]);
  };

  const onBuy = card => { if(!user){setShowAuth(true);return;} setCheckoutCard(card); };

  const onPurchaseSuccess = () => {
    loadCards();
    loadPurchases();
  };

  const onPublish = () => { loadCards(); };

  const openSeller = (card) => {
    setSellerModal({ id: card.seller_id||card.sellerId, name: card.seller_name||card.sellerName, province: card.province });
  };

  const myListings = cards.filter(c => c.seller_id === user?.id);

  const filtered = cards
    .filter(c => filterSet==="Todos" || (c.set_name||c.set)===filterSet)
    .filter(c => [c.name, c.seller_name, c.set_name].join(" ").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortBy==="asc" ? a.price-b.price : sortBy==="desc" ? b.price-a.price : 0);

  return (
    <div style={{minHeight:"100vh",background:"#080A12",color:"#E8E8F0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:-280,right:-180,width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(218,165,32,.06) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 5s ease-in-out infinite"}}/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,.06)",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,10,18,.92)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setTab("marketplace")}>
          <PokeBall size={22}/>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:"#DAA520",lineHeight:1}}>TIENDA POKE ROJO</div>
            <div style={{fontSize:9,color:"#444",letterSpacing:2,textTransform:"uppercase"}}>Argentina · Cartas Individuales</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {user?<>
            <button className="btn btn-outline" style={{padding:"8px 16px",fontSize:13}} onClick={()=>setTab("vender")}>+ Carta</button>
            <button className="btn btn-outline" style={{padding:"8px 16px",fontSize:13}} onClick={()=>setTab("vender-sellado")}>+ Sellado</button>
            <div style={{position:"relative"}}>
              <button onClick={()=>setMenuOpen(o=>!o)} className="btn btn-ghost" style={{padding:"7px 14px",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#DAA520,#B8860B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{user.name[0]}</div>
                {user.name.split(" ")[0]}
              </button>
              {menuOpen&&(
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"#10131F",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:8,minWidth:210,zIndex:100}}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:6}}>
                    <div style={{fontWeight:700,fontSize:14}}>{user.name}</div>
                    <div style={{fontSize:12,color:"#555"}}>{user.email}</div>
                    <div style={{fontSize:12,color:"#555",marginTop:2}}>📍 {user.province}</div>
                    <div style={{marginTop:6}}><SellerBadge reviews={reviews.filter(r=>r.seller_id===user.id)} size="md"/></div>
                  </div>
                  {[{l:"🏪 Mis publicaciones",a:()=>{setTab("mis-publicaciones");setMenuOpen(false);}},{l:"📦 Mis compras",a:()=>{setTab("mis-compras");setMenuOpen(false);}}].map(i=>(
                    <button key={i.l} onClick={i.a} className="btn" style={{width:"100%",background:"none",border:"none",color:"#aaa",padding:"9px 14px",fontSize:13,textAlign:"left",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{i.l}</button>
                  ))}
                  <div style={{borderTop:"1px solid rgba(255,255,255,.06)",marginTop:6,paddingTop:6}}>
                    <button onClick={logout} className="btn" style={{width:"100%",background:"none",border:"none",color:"#E74C3C",padding:"9px 14px",fontSize:13,textAlign:"left",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(231,76,60,.08)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>🚪 Cerrar sesión</button>
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

        {/* PAYMENT CONFIRMATION */}
        {paymentStatus && (
          <div className="modal-bg">
            <div className="modal" style={{maxWidth:480}}>
              {paymentStatus === 'approved' ? <>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{fontSize:60,marginBottom:12,animation:"float 1.5s ease-in-out infinite"}}>🎉</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#27AE60",letterSpacing:1,marginBottom:6}}>¡PAGO APROBADO!</div>
                  <div style={{color:"#888",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>Tu compra fue confirmada por Mercado Pago</div>
                </div>
                {lastPurchase && (
                  <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
                    <div style={{display:"flex",gap:14,alignItems:"center",background:"rgba(255,255,255,.04)",borderRadius:12,padding:14,border:"1px solid rgba(255,255,255,.07)"}}>
                      {lastPurchase.cardImg
                        ?<img src={lastPurchase.cardImg} alt="" style={{width:52,height:72,objectFit:"contain",borderRadius:8,flexShrink:0}}/>
                        :<div style={{width:52,height:72,background:"rgba(255,255,255,.05)",borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🃏</div>
                      }
                      <div style={{fontFamily:"'DM Sans',sans-serif"}}>
                        <div style={{fontWeight:700,fontSize:15}}>{lastPurchase.cardName}</div>
                        <div style={{color:"#666",fontSize:12,marginTop:2}}>{lastPurchase.set}</div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#DAA520",marginTop:4}}>{fmt(lastPurchase.total)}</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(218,165,32,.06)",border:"1px solid rgba(218,165,32,.15)",borderRadius:12,padding:14,fontFamily:"'DM Sans',sans-serif"}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#DAA520",marginBottom:10}}>📦 DATOS PARA EL ENVÍO</div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:"#888"}}>Vendedor</span><span style={{fontWeight:600}}>{lastPurchase.sellerName}</span></div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:"#888"}}>Provincia</span><span style={{fontWeight:600}}>📍 {lastPurchase.sellerProvince}</span></div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#888"}}>Envío elegido</span><span style={{fontWeight:600,color:"#DAA520"}}>{lastPurchase.shipping}</span></div>
                    </div>
                    <div style={{background:"rgba(0,158,227,.05)",border:"1px solid rgba(0,158,227,.12)",borderRadius:12,padding:14,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                      <div style={{fontWeight:700,color:"#009EE3",marginBottom:6}}>📋 ¿Qué pasa ahora?</div>
                      <div style={{color:"#888",lineHeight:1.8}}>
                        1. El vendedor fue notificado de tu compra<br/>
                        2. Coordinarán el envío por <strong style={{color:"#E8E8F0"}}>{lastPurchase.shipping}</strong><br/>
                        3. El costo del envío lo acordás con el vendedor<br/>
                        4. Cuando recibas la carta, dejá tu reseña ⭐
                      </div>
                    </div>
                  </div>
                )}
                <button className="btn btn-gold" style={{width:"100%",padding:"14px"}} onClick={()=>{setPaymentStatus(null);loadCards();loadPurchases();}}>
                  Volver al marketplace
                </button>
              </> : paymentStatus === 'failed' ? <>
                <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                  <div style={{fontSize:54,marginBottom:12}}>❌</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#E74C3C",letterSpacing:1,marginBottom:8}}>PAGO FALLIDO</div>
                  <div style={{color:"#888",fontSize:14,fontFamily:"'DM Sans',sans-serif",marginBottom:24}}>El pago no pudo procesarse.</div>
                  <button className="btn btn-gold" style={{width:"100%",padding:"14px"}} onClick={()=>{setPaymentStatus(null);loadCards();}}>Volver al marketplace</button>
                </div>
              </> : <>
                <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                  <div style={{fontSize:54,marginBottom:12}}>⏳</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#F39C12",letterSpacing:1,marginBottom:8}}>PAGO PENDIENTE</div>
                  <div style={{color:"#888",fontSize:14,fontFamily:"'DM Sans',sans-serif",marginBottom:24}}>Tu pago está siendo procesado.</div>
                  <button className="btn btn-gold" style={{width:"100%",padding:"14px"}} onClick={()=>{setPaymentStatus(null);loadCards();}}>Volver al marketplace</button>
                </div>
              </>}
            </div>
          </div>
        )}

        {/* MARKETPLACE TABS */}
        {(tab==="marketplace"||tab==="sellado")&&<>
          {/* Section switcher */}
          <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:24,marginTop:20}}>
            <button onClick={()=>setTab("marketplace")} style={{background:"none",border:"none",color:tab==="marketplace"?"#DAA520":"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",padding:"14px 24px",borderBottom:tab==="marketplace"?"2px solid #DAA520":"2px solid transparent",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
              🃏 Cartas individuales <span style={{background:"rgba(218,165,32,.15)",color:"#DAA520",padding:"2px 8px",borderRadius:20,fontSize:11}}>{cards.length}</span>
            </button>
            <button onClick={()=>setTab("sellado")} style={{background:"none",border:"none",color:tab==="sellado"?"#DAA520":"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",padding:"14px 24px",borderBottom:tab==="sellado"?"2px solid #DAA520":"2px solid transparent",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
              📦 Producto sellado <span style={{background:"rgba(218,165,32,.15)",color:"#DAA520",padding:"2px 8px",borderRadius:20,fontSize:11}}>{sealedProducts.length}</span>
            </button>
          </div>
        </>}

        {/* MARKETPLACE - CARTAS */}
        {tab==="marketplace"&&<>
          <div style={{padding:"30px 0 22px",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,.05)",marginBottom:22}}>
            <div style={{flex:1,minWidth:240}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:50,lineHeight:.88,marginBottom:10}}>
                <span style={{color:"#DAA520"}}>COMPRÁ</span> Y <span style={{color:"#DAA520"}}>VENDÉ</span><br/>
                <span style={{color:"#888",fontSize:30}}>CARTAS POKÉMON</span>
              </div>
              <div style={{color:"#555",fontSize:13}}>Marketplace argentino · Pagás en pesos · Envíos a todo el país</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              {[{v:`${cards.length}`,l:"Cartas",i:"🃏"},{v:`${new Set(cards.map(c=>c.seller_id)).size}`,l:"Vendedores",i:"👤"},{v:`${reviews.length}`,l:"Reseñas",i:"⭐"}].map(s=>(
                <div key={s.l} className="card" style={{padding:"14px 18px",textAlign:"center",minWidth:88}}>
                  <div style={{fontSize:18,marginBottom:2}}>{s.i}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#DAA520"}}>{s.v}</div>
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
            {SETS.map(s=>(
              <button key={s} className={`filter-chip ${filterSet===s?"active":""}`}
                style={filterSet===s?{background:"#DAA520",color:"#080A12",borderColor:"transparent"}:{}}
                onClick={()=>setFilterSet(s)}>{s}</button>
            ))}
          </div>

          {loadingCards ? (
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><div className="spinner" style={{width:40,height:40,borderWidth:4}}/></div>
              <div style={{color:"#555",fontFamily:"'DM Sans',sans-serif"}}>Cargando cartas...</div>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
                {filtered.map(c=><CardItem key={c.id} card={c} userId={user?.id} onBuy={onBuy} onLogin={()=>setShowAuth(true)} onSellerClick={openSeller} reviews={reviews}/>)}
              </div>
              {filtered.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#333"}}><div style={{fontSize:44,marginBottom:10}}>🃏</div><div>No hay cartas con ese filtro.</div></div>}
            </>
          )}
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

        {/* VENDER SELLADO */}
        {tab==="vender-sellado"&&<>
          {!user?(
            <div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{fontSize:44,marginBottom:14}}>🔒</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,marginBottom:8,letterSpacing:1}}>NECESITÁS INICIAR SESIÓN</div>
              <div style={{color:"#555",marginBottom:20}}>Para publicar productos primero tenés que registrarte.</div>
              <button className="btn btn-gold" onClick={()=>setShowAuth(true)}>Iniciar sesión / Registrarse</button>
            </div>
          ):<PublishSealedForm user={user} onPublish={()=>loadSealedProducts()}/>}
        </>}

        {/* SELLADO MARKETPLACE */}
        {tab==="sellado"&&<>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
              <input className="input" style={{paddingLeft:38}} placeholder="Buscar producto, set o vendedor..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="reciente">Más recientes</option>
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </select>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
            {PRODUCT_TYPES.map(t=>(
              <button key={t} className={`filter-chip ${filterSet===t?"active":""}`}
                style={filterSet===t?{background:PRODUCT_TYPE_COLORS[t]||"#DAA520",color:"#fff",borderColor:"transparent"}:{}}
                onClick={()=>setFilterSet(t)}>{t}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
            {sealedProducts
              .filter(p=>filterSet==="Todos"||p.product_type===filterSet)
              .filter(p=>[p.name,p.seller_name,p.set_name].join(" ").toLowerCase().includes(search.toLowerCase()))
              .sort((a,b)=>sortBy==="asc"?a.price-b.price:sortBy==="desc"?b.price-a.price:0)
              .map(p=><SealedItem key={p.id} product={p} userId={user?.id} onBuy={onBuy} onLogin={()=>setShowAuth(true)} onSellerClick={openSeller} reviews={reviews}/>)
            }
          </div>
          {sealedProducts.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#333"}}><div style={{fontSize:44,marginBottom:10}}>📦</div><div>No hay productos sellados publicados todavía.</div></div>}
        </>}
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
                  {c.img_url?<img src={c.img_url} alt="" style={{width:42,height:58,objectFit:"contain",borderRadius:6,flexShrink:0}}/>:<div style={{width:42,height:58,background:"rgba(255,255,255,.05)",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🃏</div>}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                    <div style={{color:"#555",fontSize:12}}>{c.set_name} · <span style={{color:COND_COLOR[c.condition]}}>{COND_LABEL[c.condition]}</span> · {c.rarity}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#DAA520"}}>{fmt(c.price)}</div>
                  <button className="btn btn-danger" onClick={async()=>{await supabase.from("cards").delete().eq("id",c.id);loadCards();}}>Eliminar</button>
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
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{c.card_name}</div>
                    <div style={{color:"#555",fontSize:12}}>Envío: {c.shipping_method}</div>
                  </div>
                  <div style={{textAlign:"right",marginRight:8}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#DAA520"}}>{fmt(c.amount)}</div>
                    <div style={{fontSize:11,color:"#27AE60",fontWeight:700}}>✓ PAGADO</div>
                  </div>
                  {!c.reviewed?(
                    <button className="btn btn-outline" style={{padding:"8px 14px",fontSize:12,flexShrink:0}} onClick={()=>setReviewTarget({...c,idx:i,sellerId:c.seller_id,name:c.card_name,sellerName:"Vendedor"})}>⭐ Calificar</button>
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
        ⬤ Tienda Poke Rojo · Argentina · Cartas individuales · Pagos seguros vía Mercado Pago
      </div>

      {showAuth&&<AuthModal onLogin={login} onClose={()=>setShowAuth(false)}/>}
      {checkoutCard&&<CheckoutModal card={checkoutCard} user={user} onClose={()=>setCheckoutCard(null)} onSuccess={onPurchaseSuccess}/>}
      {sellerModal&&<SellerModal seller={sellerModal} allCards={cards} onClose={()=>setSellerModal(null)} onBuy={onBuy} userId={user?.id}/>}
      {reviewTarget&&<ReviewModal purchase={reviewTarget} userId={user?.id} onClose={()=>setReviewTarget(null)} onSubmit={()=>{loadReviews();setPurchases(p=>p.map((x,i)=>i===reviewTarget.idx?{...x,reviewed:true}:x));}}/>}
    </div>
  );
}
