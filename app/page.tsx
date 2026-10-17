"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, BadgeCheck, BarChart3, Bell, Check,
  ChevronDown, CircleHelp, Clock3, CloudUpload, Coins, Compass, Droplets,
  House, Leaf, LogIn, LogOut, MapPin, Menu, PackageCheck, Route, ShieldCheck,
  Sprout, Truck, Upload, Users, Wallet, Wheat, X
} from "lucide-react";
import { calculateMandi, inr, type MandiOption } from "@/lib/calculations";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Section = "dashboard" | "mandi" | "profit" | "pooling" | "grade" | "sell";

const initialOptions: MandiOption[] = [
  { id: "nearby", name: "Nearby Mandi", distanceKm: 12, pricePerQuintal: 1200, transportCost: 100, handlingCost: 100, storageCost: 0, spoilagePercent: 0 },
  { id: "own", name: "Mandi B · Own truck", distanceKm: 68, pricePerQuintal: 1800, transportCost: 2000, handlingCost: 300, storageCost: 0, spoilagePercent: 0 },
  { id: "shared", name: "Mandi B · Shared truck", distanceKm: 68, pricePerQuintal: 1800, transportCost: 600, handlingCost: 300, storageCost: 0, spoilagePercent: 0, shared: true }
];

const navItems: { id: Section; label: string; icon: typeof House }[] = [
  { id: "dashboard", label: "Dashboard", icon: House },
  { id: "mandi", label: "Mandi compare", icon: Compass },
  { id: "profit", label: "Profit calculator", icon: Wallet },
  { id: "pooling", label: "Shared transport", icon: Truck },
  { id: "grade", label: "KisanGrade", icon: PackageCheck },
  { id: "sell", label: "Sell or wait", icon: Clock3 }
];

function Field({ label, value, onChange, type = "number", min, step = "1" }: {
  label: string; value: string | number; onChange: (value: string) => void;
  type?: string; min?: string; step?: string;
}) {
  return <label className="field"><span>{label}</span><input type={type} min={min} step={step} value={value} onChange={e => onChange(e.target.value)} /></label>;
}

export default function Home() {
  const [section, setSection] = useState<Section>("dashboard");
  const [crop, setCrop] = useState("Tomatoes");
  const [quantity, setQuantity] = useState("4");
  const [harvestAge, setHarvestAge] = useState("8");
  const [storage, setStorage] = useState(false);
  const [options, setOptions] = useState<MandiOption[]>(initialOptions);
  const [gradeImage, setGradeImage] = useState<string | null>(null);
  const [gradeName, setGradeName] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [poolJoined, setPoolJoined] = useState(false);

  const qty = Math.max(0, Number(quantity) || 0);
  const calculations = useMemo(() => options.map(o => ({ option: o, result: calculateMandi(o, qty) })), [options, qty]);
  const ranked = [...calculations].sort((a, b) => b.result.netReturn - a.result.netReturn);
  const best = ranked[0];
  const totalGradeQty = 400;
  const gradeRevenue = 150 * 20 + 170 * 15 + 80 * 8;

  function updateOption(id: string, key: keyof MandiOption, value: string) {
    setOptions(current => current.map(o => o.id === id ? { ...o, [key]: key === "name" ? value : Number(value) || 0 } : o));
  }

  async function askAI() {
    setAiLoading(true); setAiError(""); setAiExplanation("");
    try {
      const response = await fetch("/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop, quantityQuintals: qty, harvestAgeHours: Number(harvestAge),
          storageAvailable: storage,
          options: calculations.map(({ option, result }) => ({ ...option, ...result })),
          bestOption: best ? { ...best.option, ...best.result } : null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI explanation unavailable.");
      const r = data.recommendation;
      setAiExplanation([r.headline, ...r.reasoning.map((x: string) => `• ${x}`), `Next step: ${r.nextStep}`, ...(r.cautions || []).map((x: string) => `Caution: ${x}`)].join("\n"));
    } catch (e) { setAiError(e instanceof Error ? e.message : "AI explanation unavailable."); }
    finally { setAiLoading(false); }
  }

  async function handleAuth(e: FormEvent) {
    e.preventDefault(); setAuthMessage("");
    if (!supabaseConfigured || !supabase) {
      setAuthMessage("Add your Supabase URL and anon key in .env.local to enable real authentication. Demo mode remains available.");
      return;
    }
    const action = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (action.error) setAuthMessage(action.error.message);
    else {
      setUserEmail(authEmail);
      setAuthMessage(authMode === "signup" ? "Account request submitted. Check your email if confirmation is enabled." : "Signed in successfully.");
      if (authMode === "signin") setAuthOpen(false);
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserEmail("");
  }

  function onImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAiError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setAiError("Image must be 5 MB or smaller."); return; }
    setGradeName(file.name);
    const reader = new FileReader();
    reader.onload = () => setGradeImage(String(reader.result));
    reader.readAsDataURL(file);
    setAiError("");
  }

  const title = navItems.find(n => n.id === section)?.label || "Dashboard";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Sprout size={25} strokeWidth={2.2} /></div>
          <div><strong>KrishiSahay</strong><span>by KrishiSahay</span></div>
          <button className="mobile-close icon-btn" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="farm-chip"><div className="avatar">क</div><div><strong>Namaste, Farmer</strong><span>Smallholder workspace</span></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{navItems.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`} onClick={() => { setSection(item.id); setMobileNav(false); }}>
            <Icon size={18}/><span>{item.label}</span>{item.id === "pooling" && <span className="nav-dot"/>}
          </button>;
        })}</nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><strong>Need a hand?</strong><p>Use the numbers to compare what you could actually earn.</p><button onClick={() => setSection("profit")}>Open profit calculator <ArrowRight size={14}/></button></div>
          <div className="sidebar-foot"><span className="status-dot"/> Demo workspace <span className="demo-pill">SAMPLE DATA</span></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="crumb">Workspace <span>/</span> <strong>{title}</strong></div>
          <div className="top-actions"><span className="live-tag"><span/> DEMO DATA · NOT LIVE</span><button className="icon-btn notification" aria-label="Notifications"><Bell size={18}/><i/></button>
            {userEmail ? <button className="user-button" onClick={signOut}><span className="user-avatar">{userEmail[0].toUpperCase()}</span><span>{userEmail.split("@")[0]}</span><LogOut size={15}/></button> : <button className="signin-btn" onClick={() => setAuthOpen(true)}><LogIn size={15}/> Sign in</button>}
          </div>
        </header>

        <div className="content">
          {section === "dashboard" && <>
            <div className="welcome-row"><div><div className="eyebrow"><Leaf size={14}/> HARVEST TO PROFIT</div><h1>Good day, Farmer <span>👋</span></h1><p className="subhead">Let’s find the market that leaves more money in your pocket.</p></div><div className="harvest-badge"><Wheat size={19}/><div><span>Current harvest</span><strong>{crop} · {qty} quintals</strong></div><button onClick={() => setSection("profit")} aria-label="Edit harvest"><ArrowRight size={17}/></button></div></div>
            <div className="notice"><ShieldCheck size={18}/><span><strong>Estimate first, decide with confidence.</strong> All prices and transport costs on this screen are sample figures, not live mandi quotes.</span><button onClick={() => setSection("mandi")}>Compare markets <ArrowRight size={15}/></button></div>
            <div className="metric-grid">
              <div className="metric-card green"><div className="metric-top"><span>Best estimated net return</span><span className="metric-icon"><Coins size={18}/></span></div><strong>{best ? inr(best.result.netReturn) : "—"}</strong><div className="metric-bottom"><span className="positive"><ArrowDownRight size={14}/> Highest of 3 options</span><span>For {qty} qtl</span></div></div>
              <div className="metric-card"><div className="metric-top"><span>Recommended option</span><span className="metric-icon"><Route size={18}/></span></div><strong className="metric-text">{best?.option.shared ? "Shared transport" : best?.option.name || "—"}</strong><div className="metric-bottom"><span className="positive"><Check size={14}/> After estimated costs</span><span>Not just price</span></div></div>
              <div className="metric-card"><div className="metric-top"><span>Harvest urgency</span><span className="metric-icon amber"><Clock3 size={18}/></span></div><strong className="metric-text">{Number(harvestAge) >= 24 && !storage ? "High" : Number(harvestAge) >= 12 && !storage ? "Medium" : "Monitor"}</strong><div className="metric-bottom"><span className="warning-text"><Activity size={14}/> {storage ? "Storage available" : "No cold storage selected"}</span><span>{harvestAge}h since harvest</span></div></div>
            </div>
            <div className="section-heading"><div><h2>Your selling options</h2><p>Estimated net earnings, side by side</p></div><button className="text-btn" onClick={() => setSection("mandi")}>View all markets <ArrowRight size={15}/></button></div>
            <div className="market-grid">{ranked.map(({option, result}, index) => <div className={`market-card ${index === 0 ? "recommended" : ""}`} key={option.id}>
              <div className="market-card-top"><div className="market-symbol"><MapPin size={18}/></div>{index === 0 && <span className="best-label"><BadgeCheck size={13}/> BEST ESTIMATE</span>}</div>
              <h3>{option.name}</h3><div className="market-distance">{option.distanceKm} km away <span>·</span> {option.shared ? "Pooled trip" : "Individual trip"}</div>
              <div className="market-net"><span>Estimated net</span><strong>{inr(result.netReturn)}</strong></div>
              <div className="mini-breakdown"><span>Expected revenue <b>{inr(result.grossRevenue)}</b></span><span>Estimated costs <b>−{inr(result.totalCosts)}</b></span></div>
              <button className={`card-action ${index === 0 ? "primary" : ""}`} onClick={() => setSection("mandi")}>{index === 0 ? "See why it wins" : "Compare details"} <ArrowRight size={15}/></button>
            </div>)}</div>
            <div className="lower-grid"><div className="panel"><div className="panel-head"><div><h3>From harvest to profit</h3><p>Your next steps</p></div><span className="step-count">01 / 06</span></div><div className="workflow">{[{n:"01",t:"Register harvest",d:"Crop, quantity, location and harvest time",done:true},{n:"02",t:"Check quality grade",d:"Preliminary visual grade with clear caveats",done:false},{n:"03",t:"Compare market prices",d:"Look at expected net return, not only price",done:false},{n:"04",t:"Find a shared vehicle",d:"Split transport costs across compatible loads",done:false}].map(s=><div className="workflow-item" key={s.n}><div className={`workflow-number ${s.done ? "done" : ""}`}>{s.done ? <Check size={14}/> : s.n}</div><div><strong>{s.t}</strong><p>{s.d}</p></div><ArrowRight size={15}/></div>)}</div></div>
              <div className="panel insight-panel"><div className="insight-icon"><Sprout size={20}/></div><div className="eyebrow">KRISHISAHAY INSIGHT</div><h3>A higher price doesn’t always mean higher profit.</h3><p>Transport, handling and spoilage can eat into a better mandi price. Compare every cost before deciding.</p><button onClick={() => setSection("profit")}>Try the calculator <ArrowRight size={15}/></button><div className="insight-decoration"><Wheat size={76}/></div></div></div>
          </>}

          {section === "mandi" && <><PageIntro eyebrow="SMART MARKET SELECTION" title="Compare mandis by what you keep" subtitle="Change the sample inputs to see how transport, handling and spoilage affect your net return."/><div className="panel form-panel"><div className="panel-head"><div><h3>Harvest details</h3><p>These inputs drive the comparison below.</p></div><span className="sample-label">SAMPLE SCENARIO</span></div><div className="input-grid"><label className="field"><span>Crop</span><select value={crop} onChange={e=>setCrop(e.target.value)}><option>Tomatoes</option><option>Onions</option><option>Potatoes</option><option>Cauliflower</option><option>Peas</option></select></label><Field label="Quantity (quintals)" value={quantity} min="0.1" step="0.1" onChange={setQuantity}/><Field label="Hours since harvest" value={harvestAge} min="0" onChange={setHarvestAge}/><label className="check-field"><input type="checkbox" checked={storage} onChange={e=>setStorage(e.target.checked)}/><span><strong>Storage available</strong><small>May reduce urgency, if suitable storage is actually available.</small></span></label></div></div><div className="panel table-panel"><div className="panel-head"><div><h3>Market comparison</h3><p>Sorted by estimated net return · INR</p></div><span className="sample-label">NOT LIVE PRICES</span></div><div className="table-wrap"><table><thead><tr><th>Option</th><th>Gross revenue</th><th>Transport</th><th>Other costs</th><th>Net return</th></tr></thead><tbody>{ranked.map(({option,result},i)=><tr key={option.id}><td><div className="market-name"><span className={`rank ${i===0?"rank-first":""}`}>{i+1}</span><div><strong>{option.name}</strong><small>{option.distanceKm} km · {option.shared?"Shared vehicle":"Own/individual vehicle"}</small></div></div></td><td>{inr(result.grossRevenue)}</td><td>{inr(option.transportCost)}</td><td>{inr(option.handlingCost+option.storageCost+result.spoilageLoss)}</td><td><strong className={i===0?"net-highlight":""}>{inr(result.netReturn)}</strong>{i===0&&<small className="winner-sub">Best estimate</small>}</td></tr>)}</tbody></table></div><div className="table-note"><ShieldCheck size={16}/> Net return = gross revenue − transport − handling − storage − expected spoilage loss.</div></div><AIBox loading={aiLoading} explanation={aiExplanation} error={aiError} onAsk={askAI}/></>}

          {section === "profit" && <><PageIntro eyebrow="NET-PROFIT CALCULATOR" title="Calculate the money you actually keep" subtitle="Use your own expected sale price and costs. The calculation is deterministic; no AI model controls the totals."/><div className="calculator-layout"><div className="panel"><div className="panel-head"><div><h3>Update market assumptions</h3><p>Values are editable for a quick what-if analysis.</p></div></div><div className="editable-options">{options.map(o=><div className="editable-option" key={o.id}><h4>{o.name}</h4><div className="input-grid"><Field label="Price / quintal (₹)" value={o.pricePerQuintal} min="0" onChange={v=>updateOption(o.id,"pricePerQuintal",v)}/><Field label="Transport (₹)" value={o.transportCost} min="0" onChange={v=>updateOption(o.id,"transportCost",v)}/><Field label="Handling (₹)" value={o.handlingCost} min="0" onChange={v=>updateOption(o.id,"handlingCost",v)}/><Field label="Storage (₹)" value={o.storageCost} min="0" onChange={v=>updateOption(o.id,"storageCost",v)}/><Field label="Expected spoilage (%)" value={o.spoilagePercent} min="0" step="0.5" onChange={v=>updateOption(o.id,"spoilagePercent",v)}/></div></div>)}</div><button className="secondary-btn reset-btn" onClick={()=>setOptions(initialOptions)}>Reset sample figures</button></div><div className="panel result-panel"><div className="result-icon"><Wallet size={21}/></div><div className="eyebrow">BEST ESTIMATED OUTCOME</div><h2>{best ? inr(best.result.netReturn) : "—"}</h2><p>Estimated net return for {qty} quintals</p><div className="result-divider"/>{best&&<><div className="result-row"><span>Market</span><strong>{best.option.name}</strong></div><div className="result-row"><span>Gross sale revenue</span><strong>{inr(best.result.grossRevenue)}</strong></div><div className="result-row"><span>Transport</span><strong>−{inr(best.option.transportCost)}</strong></div><div className="result-row"><span>Handling + storage</span><strong>−{inr(best.option.handlingCost+best.option.storageCost)}</strong></div><div className="result-row"><span>Expected spoilage loss</span><strong>−{inr(best.result.spoilageLoss)}</strong></div><div className="result-row total"><span>Net per quintal</span><strong>{inr(best.result.netPerQuintal)}</strong></div></>}<div className="caution"><ShieldCheck size={16}/> This is an estimate, not a guaranteed selling price or profit.</div></div></div><div className="ppt-example"><div><span className="eyebrow">PPT WORKED EXAMPLE</span><h3>4 quintals of tomatoes · illustrative figures</h3><p>The original presentation uses fixed example numbers to explain why shared transport can improve returns.</p></div><div className="example-numbers"><div><span>Nearby mandi</span><strong>₹4,600</strong></div><div><span>Distant · own truck</span><strong>₹4,900</strong></div><div className="example-best"><span>Distant · shared truck</span><strong>₹6,300</strong></div></div></div></>}

          {section === "pooling" && <><PageIntro eyebrow="SHARED TRANSPORT" title="Make a small load go further" subtitle="Pool compatible harvests so one farmer doesn’t have to pay for an entire vehicle alone."/><div className="pool-hero"><div className="pool-hero-copy"><span className="pill-light"><Users size={14}/> SAMPLE POOL</span><h2>Two farmers. One route. A fairer fare.</h2><p>Example group travelling toward Mandi B. All names, availability and costs are illustrative; no real driver or vehicle has been booked.</p><div className="pool-stats"><div><strong>2</strong><span>Farmers in sample</span></div><div><strong>₹600</strong><span>Your example share</span></div><div><strong>₹1,400</strong><span>Other share of fare</span></div></div><button className="white-btn" onClick={()=>setPoolJoined(!poolJoined)}>{poolJoined?<><Check size={16}/> Joined sample pool</>:<>Join demo pool <ArrowRight size={16}/></>}</button></div><div className="pool-illustration"><div className="route-line"><span className="route-pin"><MapPin size={20}/></span><div className="route-dashes"/><span className="route-pin destination"><MapPin size={20}/></span></div><div className="route-labels"><div><strong>Your village</strong><span>Pickup point</span></div><div><strong>Mandi B</strong><span>68 km · sample route</span></div></div><div className="truck-illustration"><Truck size={100} strokeWidth={1.2}/></div></div></div><div className="two-panels"><div className="panel"><div className="panel-head"><div><h3>Sample trip details</h3><p>Transparent cost split</p></div><Truck size={19}/></div><div className="result-row"><span>Whole vehicle fare</span><strong>₹2,000</strong></div><div className="result-row"><span>Your share</span><strong>₹600</strong></div><div className="result-row"><span>Other farmer(s) share</span><strong>₹1,400</strong></div><div className="result-row total"><span>Total allocated</span><strong>₹2,000</strong></div></div><div className="panel"><div className="panel-head"><div><h3>Pooling checklist</h3><p>Before a real trip is confirmed</p></div><BadgeCheck size={19}/></div><ul className="checklist"><li><Check size={16}/> Same destination or compatible route</li><li><Check size={16}/> Crop and delivery timing match</li><li><Check size={16}/> Vehicle capacity and fare verified</li><li><Check size={16}/> Each farmer confirms their share</li></ul></div></div></>}

          {section === "grade" && <><PageIntro eyebrow="KISANGRADE · PRELIMINARY" title="Give buyers a clearer view of quality" subtitle="Upload a crop photo for the demo workflow. This starter shows the image and a manual preliminary grade; it does not claim to run a trained vision model."/><div className="grade-layout"><div className="panel upload-panel"><div className="panel-head"><div><h3>Crop photo</h3><p>Clear, well-lit image works best.</p></div><CloudUpload size={21}/></div><label className="upload-zone">{gradeImage?<img src={gradeImage} alt="Uploaded crop for preliminary visual review"/>:<><div className="upload-icon"><Upload size={25}/></div><strong>Upload a crop photo</strong><span>JPG, PNG or WEBP · max 5 MB</span><span className="browse-link">Choose image</span></>}<input type="file" accept="image/*" onChange={onImage} hidden/></label>{gradeName&&<p className="file-name"><Check size={14}/>{gradeName}</p>}<div className="grade-manual"><h4>Record a human-reviewed preliminary grade</h4><p>Select based on visible characteristics. Confirm with the buyer on delivery.</p><div className="grade-choice"><button onClick={()=>setGradeName((gradeName||"Crop photo")+" · Grade A (manual)")}><b>A</b><span>Premium</span></button><button onClick={()=>setGradeName((gradeName||"Crop photo")+" · Grade B (manual)")}><b>B</b><span>Standard</span></button><button onClick={()=>setGradeName((gradeName||"Crop photo")+" · Grade C (manual)")}><b>C</b><span>Lower commercial</span></button></div></div></div><div className="panel grade-info"><div className="grade-info-icon"><PackageCheck size={22}/></div><h3>Understand the grades</h3><div className="grade-definition"><span className="grade-letter a">A</span><div><strong>Premium</strong><p>Uniform size, colour and maturity; minimal visible defects.</p></div></div><div className="grade-definition"><span className="grade-letter b">B</span><div><strong>Standard</strong><p>Mixed sizes or minor cosmetic flaws; sound and suitable for sale.</p></div></div><div className="grade-definition"><span className="grade-letter c">C</span><div><strong>Lower commercial</strong><p>More cosmetic defects or irregular shapes; may suit processing buyers.</p></div></div><div className="safety-note"><ShieldCheck size={17}/><p><strong>Important:</strong> Photo grading is preliminary. It cannot determine internal damage, chemical residues or food safety. Rotten produce is not Grade C. A buyer should confirm grade on delivery.</p></div></div></div><div className="panel grade-revenue"><div className="panel-head"><div><h3>Illustrative grade-wise revenue</h3><p>Same example as the PPT · hypothetical prices</p></div><span className="sample-label">400 KG BATCH</span></div><div className="grade-revenue-grid"><div><span>Grade A · 150 kg × ₹20</span><strong>₹3,000</strong></div><div><span>Grade B · 170 kg × ₹15</span><strong>₹2,550</strong></div><div><span>Grade C · 80 kg × ₹8</span><strong>₹640</strong></div><div className="grade-total"><span>Total · {totalGradeQty} kg</span><strong>{inr(gradeRevenue)}</strong></div></div></div></>}

          {section === "sell" && <><PageIntro eyebrow="SPOILAGE-AWARE DECISIONS" title="Sell now or wait?" subtitle="Use harvest age, storage availability and the estimated net returns as decision support—not a guaranteed forecast."/><div className="urgency-card"><div className={`urgency-indicator ${Number(harvestAge)>=24&&!storage?"high":Number(harvestAge)>=12&&!storage?"medium":"low"}`}><Clock3 size={24}/></div><div className="urgency-main"><span className="eyebrow">CURRENT SELLING URGENCY · RULE-BASED DEMO</span><h2>{Number(harvestAge)>=24&&!storage?"High urgency":Number(harvestAge)>=12&&!storage?"Medium urgency":"Monitor conditions"}</h2><p>{storage?"Storage is marked available. Confirm that it is suitable for this crop and duration.":Number(harvestAge)>=24?"Harvest has been waiting for 24+ hours without storage in this demo. Prioritise confirming a buyer and transport.":Number(harvestAge)>=12?"Harvest age is 12+ hours without storage. Compare routes quickly and verify a buyer before dispatch.":"Harvest is recent in this example. Compare prices promptly and verify the data before making a decision."}</p></div><div className="urgency-input"><Field label="Hours since harvest" value={harvestAge} min="0" onChange={setHarvestAge}/><label className="inline-check"><input type="checkbox" checked={storage} onChange={e=>setStorage(e.target.checked)}/> Storage available</label></div></div><div className="two-panels"><div className="panel"><div className="panel-head"><div><h3>Sell sooner if…</h3><p>Conditions favour moving the crop</p></div><ArrowDownRight size={19}/></div><ul className="decision-list"><li><Check size={16}/><span>Crop is highly perishable and there is no suitable storage.</span></li><li><Check size={16}/><span>A buyer and a transport option are confirmed.</span></li><li><Check size={16}/><span>Expected additional price from waiting is smaller than extra costs and losses.</span></li></ul></div><div className="panel"><div className="panel-head"><div><h3>Waiting may work if…</h3><p>Only after verifying the assumptions</p></div><Clock3 size={19}/></div><ul className="decision-list"><li><Check size={16}/><span>Suitable storage is available and the crop can safely be held.</span></li><li><Check size={16}/><span>There is credible evidence of a better future price.</span></li><li><Check size={16}/><span>Expected extra revenue exceeds storage, spoilage and price-risk costs.</span></li></ul></div></div><div className="panel"><div className="panel-head"><div><h3>Best current estimated option</h3><p>Based on the values currently entered</p></div></div>{best&&<div className="best-option-row"><div className="best-option-icon"><BadgeCheck size={21}/></div><div><strong>{best.option.name}</strong><p>{inr(best.result.netReturn)} estimated net return · {inr(best.result.netPerQuintal)} per quintal</p></div><button className="primary-btn" onClick={()=>setSection("mandi")}>Review comparison <ArrowRight size={15}/></button></div>}</div></>}
          <footer className="footer"><div><Sprout size={17}/><strong>KrishiSahay</strong><span>Smarter Selling. Lower Losses. Better Returns.</span></div><span>Team Vertex · Hackathon demo · Sample data only</span></footer>
        </div>
      </section>

      {authOpen && <div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><div className="auth-modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-btn" onClick={()=>setAuthOpen(false)} aria-label="Close"><X size={18}/></button><div className="brand-mark modal-brand"><Sprout size={24}/></div><h2>{authMode==="signin"?"Welcome back":"Create your farmer account"}</h2><p>Save harvest details and return to your selling plan.</p><form onSubmit={handleAuth}><label className="field"><span>Email</span><input type="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label className="field"><span>Password</span><input type="password" required minLength={6} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-btn full-btn" type="submit">{authMode==="signin"?"Sign in":"Create account"} <ArrowRight size={15}/></button></form>{authMessage&&<div className="auth-message">{authMessage}</div>}<div className="auth-switch">{authMode==="signin"?"New to KrishiSahay?":"Already have an account?"} <button onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setAuthMessage("");}}>{authMode==="signin"?"Create account":"Sign in"}</button></div>{!supabaseConfigured&&<div className="auth-demo-note">Authentication is in demo mode until Supabase credentials are added.</div>}</div></div>}
    </main>
  );
}

function PageIntro({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}) {
  return <div className="page-intro"><div className="eyebrow"><Leaf size={14}/>{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>;
}
function AIBox({loading,explanation,error,onAsk}:{loading:boolean;explanation:string;error:string;onAsk:()=>void}) {
  return <div className="panel ai-panel"><div className="ai-symbol"><Activity size={20}/></div><div className="ai-content"><div className="eyebrow">AI-ASSISTED EXPLANATION · OPTIONAL</div><h3>Why is this option recommended?</h3><p>Ask the Vercel AI SDK to explain the trade-offs using the displayed figures. It does not calculate or override profit totals.</p>{explanation&&<pre className="ai-response">{explanation}</pre>}{error&&<div className="inline-error">{error}</div>}<button className="primary-btn" disabled={loading} onClick={onAsk}>{loading?"Generating explanation…":"Explain my options"} <ArrowRight size={15}/></button></div></div>;
}
