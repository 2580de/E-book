"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";

type Book = { id: string; title: string; author: string; category: string; format: "Book" | "Audiobook" | "Video book" | "Article"; detail: string; color: string; rating: string; audioUrl?: string };
const BOOKS: Book[] = [
  { id:"quiet-coast", title:"The Quiet Coast", author:"Nadia Ferreira", category:"Fiction", format:"Book", detail:"A coastal town, the stories it keeps, and the people who return when the tide turns.", color:"moss", rating:"4.6" },
  { id:"signals-dark", title:"Signals in the Dark", author:"Tomasz Werner", category:"Sci-Fi & Fantasy", format:"Audiobook", detail:"A repeating signal from the stars seems to know what humanity will do next.", color:"blue", rating:"4.4" },
  { id:"letters-home", title:"Letters from Home", author:"Amara Okoye", category:"Biography & Memoir", format:"Video book", detail:"A visual memoir about family, belonging, and letters connecting generations.", color:"amber", rating:"4.8" },
  { id:"last-ledger", title:"The Last Ledger", author:"Hiro Sasaki", category:"Business & Economics", format:"Book", detail:"A story of risk, incentives, and decisions that shape a family business.", color:"indigo", rating:"4.2" },
  { id:"low-tide", title:"Low Tide", author:"Nadia Ferreira", category:"Mystery & Thriller", format:"Book", detail:"A storm uncovers a secret a small harbour thought it had buried.", color:"rose", rating:"4.3" },
  { id:"small-brave-steps", title:"Small, Brave Steps", author:"Mina Patel", category:"Self-Help & Growth", format:"Audiobook", detail:"Realistic practices for building focus, confidence, and durable habits.", color:"teal", rating:"4.5" },
  { id:"history-river", title:"A River Through Time", author:"Daniel K. Mensah", category:"History", format:"Book", detail:"Trade, migration, and communities shaped by a changing river.", color:"moss", rating:"4.7" },
  { id:"poems-after-rain", title:"Poems After Rain", author:"Wanjiku Njeri", category:"Poetry", format:"Book", detail:"A collection about memory, city life, and starting again.", color:"rose", rating:"4.6" },
  { id:"quiet-coast-audio", title:"The Quiet Coast — Audio", author:"Nadia Ferreira", category:"Fiction", format:"Audiobook", detail:"An unhurried audio edition of the coastal novel.", color:"blue", rating:"4.6" },
  { id:"coastal-towns", title:"Writing Coastal Towns", author:"Bookhub Editorial", category:"Fiction", format:"Article", detail:"A short editorial on place, memory, and believable fictional communities.", color:"amber", rating:"4.1" },
  { id:"field-notes", title:"Field Notes for Founders", author:"A. Mwangi", category:"Business & Economics", format:"Article", detail:"A practical guide to testing a business idea before investing in it.", color:"indigo", rating:"4.8" },
  { id:"sky-atlas", title:"The Sky Atlas", author:"Leila Haddad", category:"Science & Nature", format:"Book", detail:"An accessible journey through the objects and mysteries above us.", color:"teal", rating:"4.7" },
];
const GENRES = ["Fiction","Sci-Fi & Fantasy","Mystery & Thriller","Biography & Memoir","History","Business & Economics","Self-Help & Growth","Poetry","Science & Nature","Technology","Romance","Children & Young Adult"];
const FORMATS = ["Books","Audiobooks","Video books","Articles"];
const FORMAT_MATCH: Record<string,string> = { Books:"Book", Audiobooks:"Audiobook", "Video books":"Video book", Articles:"Article" };

export default function Home() {
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [stage, setStage] = useState<"auth"|"preferences"|"discover">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>(["Books","Audiobooks"]);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"error"|"success"|"note">("note");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("All formats");
  const [genreFilter, setGenreFilter] = useState("All genres");
  const [sort, setSort] = useState("Recommended");
  const [saved, setSaved] = useState<string[]>([]);
  const [userLabel, setUserLabel] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personalized, setPersonalized] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [audioBook, setAudioBook] = useState<Book | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [speechOffset, setSpeechOffset] = useState(0);
  const supabase = getSupabase();

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("bookhub:saved:v1") || "[]")); } catch {}
    if (!supabase) return;
    supabase.auth.getSession().then(async ({data}) => {
      if (!data.session?.user) return;
      const user = data.session.user;
      setUserLabel(user.user_metadata?.display_name || user.email || "Reader");
      const { data: profile } = await supabase.from("profiles").select("selected_categories,selected_formats").eq("id", user.id).maybeSingle();
      if (profile) {
        setGenres(profile.selected_categories || []);
        setFormats((profile.selected_formats || []).map((x:string) => FORMAT_MATCH[x] ? x : x === "Audio" ? "Audiobooks" : x));
        setStage((profile.selected_categories?.length || profile.selected_formats?.length) ? "discover" : "preferences");
      } else setStage("preferences");
    }).catch(() => {});
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserLabel(session.user.user_metadata?.display_name || session.user.email || "Reader");
        setStage("preferences");
      } else { setUserLabel(""); setStage("auth"); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = BOOKS.filter(b => (!q || [b.title,b.author,b.category,b.format,b.detail].join(" ").toLowerCase().includes(q))
      && (formatFilter === "All formats" || b.format === formatFilter)
      && (genreFilter === "All genres" || b.category === genreFilter));
    if (personalized && genres.length && sort === "Recommended") list.sort((a,b) => Number(genres.includes(b.category))-Number(genres.includes(a.category)));
    if (sort === "Title A–Z") list.sort((a,b) => a.title.localeCompare(b.title));
    if (sort === "Top rated") list.sort((a,b) => Number(b.rating)-Number(a.rating));
    if (sort === "Newest") list.sort((a,b) => b.id.localeCompare(a.id));
    return showAll ? list : list.slice(0,8);
  }, [query,formatFilter,genreFilter,genres,personalized,sort,showAll]);

  function toggle<T extends string>(value:T, list:T[], setList:(next:T[])=>void) {
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list,value]);
  }
  async function submitAuth(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus(""); setBusy(true);
    try {
      if (!supabase) { setStatus("Authentication is not configured yet. You can browse the sample catalogue as a guest."); setStatusKind("note"); return; }
      if (mode === "signup") {
        const {data,error} = await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim()}}});
        if(error) throw error;
        if(data.session) { setUserLabel(displayName.trim() || email); setStage("preferences"); }
        else { setStatus("Account request received. Check your email for a confirmation link, then sign in."); setStatusKind("success"); }
      } else {
        const {data,error} = await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error) throw error;
        setUserLabel(data.user.user_metadata?.display_name || data.user.email || "Reader");
        setStage("preferences");
      }
    } catch(err) { setStatus(err instanceof Error ? err.message : "Could not complete the request. Please try again."); setStatusKind("error"); }
    finally { setBusy(false); }
  }
  async function googleSignIn() {
    if(!supabase) { setStatus("Google sign-in needs Supabase configuration first."); setStatusKind("error"); return; }
    setBusy(true);
    try { const {error} = await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}}); if(error) throw error; }
    catch(err) { setStatus(err instanceof Error ? err.message : "Google sign-in could not start."); setStatusKind("error"); setBusy(false); }
  }
  async function savePreferences(skip=false) {
    setBusy(true); setStatus("");
    try {
      if (supabase) {
        const {data} = await supabase.auth.getUser();
        if(data.user) {
          const {error} = await supabase.from("profiles").upsert({id:data.user.id,selected_categories:skip?[]:genres,selected_formats:skip?[]:formats},{onConflict:"id"});
          if(error) throw error;
        }
      }
      setStage("discover"); setStatus(skip ? "You can add interests any time in settings." : "Your preferences are saved for this session and, when configured, your account."); setStatusKind("success");
    } catch(err) { setStatus(err instanceof Error ? err.message : "Could not save preferences. Check your profile table and access policies."); setStatusKind("error"); }
    finally { setBusy(false); }
  }
  function recordHistory(book:Book) { const item={item_key:book.id,title:book.title,author:book.author,description:book.detail,content_url:null,content_type:book.format,last_position_seconds:0,last_opened_at:new Date().toISOString()}; try{const old=JSON.parse(localStorage.getItem("bookhub:history:v1")||"[]");localStorage.setItem("bookhub:history:v1",JSON.stringify([item,...old.filter((x:{item_key:string})=>x.item_key!==book.id)].slice(0,100)))}catch{} if(supabase)void supabase.auth.getUser().then(({data})=>{if(data.user)void supabase.from("reading_history").upsert({...item,user_id:data.user.id},{onConflict:"user_id,item_key"})}); }
  function startAudio(book:Book, offset=0) { setAudioBook(book); setSpeechOffset(offset); recordHistory(book); if(book.audioUrl) { setAudioPlaying(true); return; } if(typeof window==="undefined"||!("speechSynthesis" in window)){setStatus("Text-to-speech is unavailable in this browser; this title needs a licensed audio file.");setStatusKind("note");return;} window.speechSynthesis.cancel(); const words=(book.title+". By "+book.author+". "+book.detail).split(/\\s+/); const utterance=new SpeechSynthesisUtterance(words.slice(Math.floor(offset*2.5)).join(" ")); utterance.onend=()=>setAudioPlaying(false); utterance.onerror=()=>setAudioPlaying(false); window.speechSynthesis.speak(utterance); setAudioPlaying(true); }
  function seekAudio(delta:number) { const next=Math.max(0,speechOffset+delta);setSpeechOffset(next);if(audioBook)startAudio(audioBook,next); }
  function stopAudio(){if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();setAudioBook(null);setAudioPlaying(false);}
  function toggleSave(id:string) {
    const next = saved.includes(id) ? saved.filter(x=>x!==id) : [...saved,id];
    setSaved(next); try { localStorage.setItem("bookhub:saved:v1",JSON.stringify(next)); } catch {}
  }
  async function signOut() {
    if(supabase) await supabase.auth.signOut();
    setUserLabel(""); setStage("auth"); setSettingsOpen(false);
  }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setStage("discover")}} aria-label="Bookhub home"><span className="brand-mark">b</span><span>bookhub<span className="brand-period">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button className={stage==="discover"?"nav-link active":"nav-link"} onClick={()=>setStage("discover")}>Discover</button>
        <button className="nav-link" onClick={()=>{setStage("discover");setGenreFilter("All genres")}}>Explore</button>
        <button className="nav-link" onClick={()=>{setStage("discover");setFormatFilter("All formats")}}>Library</button><a className="nav-link" href="/history">History</a><a className="nav-link" href="/community">Community</a>
      </nav>
      <div className="top-actions"><button className="icon-btn" aria-label="Open settings" onClick={()=>setSettingsOpen(!settingsOpen)}>☷</button>{userLabel ? <button className="profile-pill" onClick={()=>setSettingsOpen(!settingsOpen)}><span className="avatar">{userLabel.slice(0,1).toUpperCase()}</span><span className="profile-name">{userLabel.split("@")[0]}</span></button> : <button className="sign-in-small" onClick={()=>setStage("auth")}>Sign in</button>}</div>
      {settingsOpen && <div className="settings-menu"><p className="menu-label">YOUR SPACE</p><button onClick={()=>{setStage("preferences");setSettingsOpen(false)}}>Reading interests</button><button onClick={()=>{setGenreFilter("All genres");setFormatFilter("All formats");setStage("discover");setSettingsOpen(false)}}>Discover settings</button><button onClick={()=>{setPersonalized(!personalized);setSettingsOpen(false)}}>{personalized?"Turn off":"Turn on"} personalization</button><a href="#privacy" onClick={()=>setSettingsOpen(false)}>Privacy &amp; data</a><a href="#terms" onClick={()=>setSettingsOpen(false)}>Terms &amp; policies</a>{userLabel&&<button className="menu-signout" onClick={signOut}>Sign out</button>}</div>}
    </header>

    {stage==="auth" && <section className="auth-layout">
      <div className="auth-story"><span className="eyebrow"><i/> YOUR PERSONAL READING UNIVERSE</span><h1>Find a story.<br/><em>Find your world.</em></h1><p className="hero-copy">Books to read, voices to listen to, and ideas to keep. A calmer place to discover what moves you.</p><div className="story-stats"><div><strong>01</strong><span>Choose your interests</span></div><div><strong>02</strong><span>Build your shelf</span></div><div><strong>03</strong><span>Pick up anywhere</span></div></div>
      <div className="featured-strip"><div className="mini-cover cover-moss"><span>THE<br/>QUIET<br/>COAST</span></div><div className="mini-cover cover-blue"><span>SIGNALS<br/>IN THE<br/>DARK</span></div><div className="mini-cover cover-amber"><span>LETTERS<br/>FROM<br/>HOME</span></div><div className="strip-note"><span>CURATED FOR THE CURIOUS</span><strong>Read. Listen.<br/>Keep exploring.</strong></div></div></div>
      <section className="auth-card" aria-labelledby="auth-title"><div className="card-kicker">WELCOME TO BOOKHUB</div><h2 id="auth-title">{mode==="signin"?"Your next chapter starts here.":"Make room for more stories."}</h2><p className="card-subtitle">Sign in or create a free account to personalise your shelf.</p>
      <button className="google-btn" onClick={googleSignIn} disabled={busy}><span className="google-g">G</span> Continue with Google</button><div className="or-divider"><span>or continue with email</span></div>
      <div className="auth-tabs" role="tablist" aria-label="Account mode"><button className={mode==="signin"?"selected":""} role="tab" aria-selected={mode==="signin"} onClick={()=>{setMode("signin");setStatus("")}}>Sign in</button><button className={mode==="signup"?"selected":""} role="tab" aria-selected={mode==="signup"} onClick={()=>{setMode("signup");setStatus("")}}>Create account</button></div>
      <form className="auth-form" onSubmit={submitAuth}>{mode==="signup"&&<label>Your name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" placeholder="How should we call you?"/></label>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"} minLength={8} placeholder="At least 8 characters" required/></label><button className="primary-btn full" disabled={busy} type="submit">{busy?(mode==="signup"?"Creating account…":"Signing in…"):(mode==="signup"?"Create account":"Sign in")} <span>↗</span></button></form>
      {status&&<p className={"status "+statusKind} role="status">{status}</p>}<p className="legal-copy">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p><button className="guest-link" onClick={()=>{setStage("discover");setStatus("You are browsing sample titles as a guest.");setStatusKind("note")}}>Explore as a guest <span>→</span></button></section>
    </section>}

    {stage==="preferences" && <section className="preferences-wrap"><div className="preferences-intro"><span className="eyebrow"><i/> YOUR READING DNA</span><h1>A little about<br/><em>what you love.</em></h1><p>Choose a few interests. We’ll use them to shape recommendations, not to hide the rest of the catalogue. You can change these choices whenever you want.</p><div className="step-indicator"><span className="step-done">01</span><span className="step-line"/><span className="step-current">02</span><span className="step-line"/><span>03</span><small>PERSONALISE YOUR SHELF</small></div></div>
      <section className="preferences-card"><div className="card-heading"><div><span className="card-kicker">STEP 02 / PERSONALISE</span><h2>What pulls you in?</h2></div><span className="optional">OPTIONAL</span></div><p className="section-hint">Pick as many topics as you like.</p><div className="chip-grid">{GENRES.map(g=><button key={g} className={"choice-chip "+(genres.includes(g)?"chosen":"")} aria-pressed={genres.includes(g)} onClick={()=>toggle(g,genres,setGenres)}>{genres.includes(g)&&<span>✓ </span>}{g}</button>)}</div><div className="preference-divider"/><h3>How do you like to take it in?</h3><p className="section-hint">Choose one or more formats.</p><div className="format-grid">{FORMATS.map(f=><button key={f} className={"format-choice "+(formats.includes(f)?"chosen":"")} aria-pressed={formats.includes(f)} onClick={()=>toggle(f,formats,setFormats)}><span className="format-symbol">{f==="Books"?"▤":f==="Audiobooks"?"♫":f==="Video books"?"▷":"✳"}</span><span>{f}</span><span className="choice-check">{formats.includes(f)?"✓":"＋"}</span></button>)}</div><div className="preferences-actions"><button className="text-btn" onClick={()=>savePreferences(true)} disabled={busy}>Skip for now</button><button className="primary-btn" onClick={()=>savePreferences(false)} disabled={busy}>{busy?"Saving…":"Build my shelf"} <span>↗</span></button></div>{status&&<p className={"status "+statusKind} role="status">{status}</p>}</section></section>}

    {stage==="discover" && <section className="discovery">
      <div className="discovery-hero"><div><span className="eyebrow"><i/> A SHELF THAT FEELS LIKE YOURS</span><h1>{userLabel?<>Welcome back,<br/><em>{userLabel.split("@")[0]}.</em></>:<>Your next great<br/><em>discovery awaits.</em></>}</h1><p>Follow a question, meet a new voice, or return to a world you already love.</p><div className="hero-buttons"><button className="primary-btn" onClick={()=>document.getElementById("book-index")?.scrollIntoView({behavior:"smooth"})}>Explore the library <span>↘</span></button><button className="secondary-btn" onClick={()=>setStage("preferences")}>Tune my interests</button></div></div><div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-book cover-blue"><span className="book-mark">B.</span><span className="hero-book-title">SIGNALS<br/>IN THE<br/>DARK</span><span className="hero-book-author">T. WERNER</span></div><div className="hero-book back-book cover-moss"><span className="hero-book-title">THE QUIET<br/>COAST</span></div><div className="floating-note"><span>✦</span><div><strong>Made for your curiosity</strong><small>{personalized&&genres.length?genres.slice(0,2).join(" · "):"A world of stories to explore"}</small></div></div></div></div>
      <section className="index-section" id="book-index"><div className="index-heading"><div><span className="card-kicker">THE BOOK INDEX</span><h2>Explore your next favourite.</h2><p>Sample catalogue · more formats and titles can be connected as content becomes available.</p></div><button className="secondary-btn" onClick={()=>setStage("preferences")}>Edit interests ↗</button></div>
      <div className="search-controls"><label className="search-input"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles, authors, topics…"/></label><label className="select-wrap"><span>FORMAT</span><select value={formatFilter} onChange={e=>setFormatFilter(e.target.value)}><option>All formats</option>{["Book","Audiobook","Video book","Article"].map(x=><option key={x}>{x}</option>)}</select></label><label className="select-wrap"><span>GENRE</span><select value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}><option>All genres</option>{GENRES.filter(g=>BOOKS.some(b=>b.category===g)).map(x=><option key={x}>{x}</option>)}</select></label><label className="select-wrap"><span>SORT</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recommended</option><option>Newest</option><option>Top rated</option><option>Title A–Z</option></select></label></div>
      <div className="results-meta"><span>{visibleBooks.length} titles shown</span><div><button className={personalized?"toggle-chip on":"toggle-chip"} onClick={()=>setPersonalized(!personalized)} aria-pressed={personalized}><span/> Personalised picks</button><button className="toggle-chip" onClick={()=>{setFormatFilter("All formats");setGenreFilter("All genres");setQuery("");setSort("Recommended")}}>Reset filters</button></div></div>
      <div className="book-grid">{visibleBooks.map((b,i)=><article className="book-card" key={b.id}><div className={"cover cover-"+b.color} role="img" aria-label={"Illustrative cover for "+b.title}><span className="cover-format">{b.format}</span><span className="cover-decoration">{String(i+1).padStart(2,"0")}</span><strong>{b.title}</strong><small>{b.author}</small><span className="cover-bottom">BOOKHUB EDITION</span></div><div className="book-info"><div><span className="genre-label">{b.category}</span><h3>{b.title}</h3><p>{b.author}</p></div><button className={"save-btn "+(saved.includes(b.id)?"saved":"")} onClick={()=>toggleSave(b.id)} aria-label={saved.includes(b.id)?"Remove "+b.title+" from saved":"Save "+b.title} aria-pressed={saved.includes(b.id)}>{saved.includes(b.id)?"♥":"＋"}</button></div><div className="book-foot"><span>{b.format} <i/> ★ {b.rating}</span><button onClick={()=>{recordHistory(b);setStatus(b.title+": "+b.detail);setStatusKind("note")}}>Preview details ↗</button>{b.format==="Audiobook"&&<button onClick={()=>startAudio(b)}>Listen ♫</button>}</div></article>)}</div>{visibleBooks.length===0&&<div className="empty-state"><h3>No titles match those filters.</h3><p>Try a broader search or reset your filters.</p></div>}{!showAll&&visibleBooks.length>0&&<div className="load-more"><button className="secondary-btn" onClick={()=>setShowAll(true)}>Load more titles <span>↓</span></button></div>}{status&&<p className={"status "+statusKind} role="status">{status}</p>}</section>
      <section className="privacy-note" id="privacy"><div><span className="card-kicker">YOUR DATA, YOUR CALL</span><h2>Recommendations with the lights on.</h2><p>Interests are optional. You can turn personalisation off, reset filters, and edit your choices. Saved titles on this preview are stored in this browser; cross-device saving requires the account library table and policies to be configured.</p></div><button className="secondary-btn" onClick={()=>setSettingsOpen(true)}>Privacy &amp; settings ↗</button></section>
      <footer className="site-footer" id="terms"><a className="brand" href="#"><span className="brand-mark">b</span><span>bookhub<span className="brand-period">.</span></span></a><span>READ · LISTEN · WATCH</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a><button onClick={()=>setSettingsOpen(true)}>Settings</button></div><small>Sample titles are illustrative. Availability of full books, audio and video depends on licensed content connections.</small></footer>
    </section>}
    {audioBook && <aside className="audio-dock" aria-label="Audiobook player"><div className="audio-dock-copy"><span>NOW LISTENING</span><strong>{audioBook.title}</strong><small>{audioBook.author} · {audioBook.audioUrl?"Audio file":"Browser text-to-speech"}</small></div>{audioBook.audioUrl?<audio controls autoPlay src={audioBook.audioUrl} onPlay={()=>setAudioPlaying(true)} onPause={()=>setAudioPlaying(false)}/>:<div className="audio-controls"><button onClick={()=>seekAudio(-10)} aria-label="Seek backward 10 seconds">−10s</button><button onClick={()=>{if(audioPlaying){window.speechSynthesis.pause();setAudioPlaying(false)}else if(window.speechSynthesis.paused){window.speechSynthesis.resume();setAudioPlaying(true)}else startAudio(audioBook,speechOffset)}}>{audioPlaying?"Pause":"Play"}</button><button onClick={()=>seekAudio(10)} aria-label="Seek forward 10 seconds">+10s</button></div>}<button className="audio-close" onClick={stopAudio} aria-label="Close audio player">×</button></aside>}
    <nav className="mobile-nav" aria-label="Mobile navigation"><button onClick={()=>setStage("discover")}><span>⌂</span>Home</button><button onClick={()=>{setStage("discover");document.getElementById("book-index")?.scrollIntoView({behavior:"smooth"})}}><span>⌕</span>Discover</button><button onClick={()=>{setStage("discover");setQuery("");setGenreFilter("All genres");setFormatFilter("All formats")}}><span>▤</span>Index</button><button onClick={()=>setSettingsOpen(!settingsOpen)}><span>☷</span>Settings</button></nav>
  </main>;
}