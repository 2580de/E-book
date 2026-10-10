export const BOOKS = [
 {id:"quiet-coast",title:"The Quiet Coast",author:"Nadia Ferreira",category:"Fiction",format:"Book",length:312,year:2025,blurb:"A quiet, observant novel about a coastal town, the stories it keeps, and the people who return when the tide turns.",cover:"moss",rating:"4.6"},
 {id:"signals-dark",title:"Signals in the Dark",author:"Tomasz Werner",category:"Sci-Fi & Fantasy",format:"Audiobook",length:8.4,year:2024,blurb:"A radio astronomer finds a repeating signal that seems to know what humanity will do next.",cover:"rust",rating:"4.4"},
 {id:"letters-home",title:"Letters from Home",author:"Amara Okoye",category:"Biography & Memoir",format:"Video book",length:116,year:2025,blurb:"A visual memoir about family, belonging, and the ordinary letters that connect generations.",cover:"amber",rating:"4.8"},
 {id:"last-ledger",title:"The Last Ledger",author:"Hiro Sasaki",category:"Business & Economics",format:"Book",length:284,year:2023,blurb:"A practical story of risk, incentives, and the decisions that make or break a family business.",cover:"moss",rating:"4.2"},
 {id:"low-tide",title:"Low Tide",author:"Nadia Ferreira",category:"Mystery & Thriller",format:"Book",length:288,year:2022,blurb:"When a storm uncovers an old secret, a small harbour must decide which truths can survive daylight.",cover:"rust",rating:"4.3"},
 {id:"small-brave-steps",title:"Small, Brave Steps",author:"Mina Patel",category:"Self-Help & Growth",format:"Audiobook",length:5.2,year:2025,blurb:"Short, realistic practices for building focus, confidence, and durable habits one day at a time.",cover:"amber",rating:"4.5"},
 {id:"history-river",title:"A River Through Time",author:"Daniel K. Mensah",category:"History",format:"Book",length:366,year:2021,blurb:"A readable history of trade, migration, and the communities shaped by a changing river.",cover:"moss",rating:"4.7"},
 {id:"poems-after-rain",title:"Poems After Rain",author:"Wanjiku Njeri",category:"Poetry",format:"Book",length:144,year:2024,blurb:"A compact collection about memory, city life, and the fragile optimism of starting again.",cover:"rust",rating:"4.6"},
 {id:"quiet-coast-audio",title:"The Quiet Coast — Audiobook",author:"Nadia Ferreira",category:"Fiction",format:"Audiobook",length:8.7,year:2025,blurb:"The complete audio edition of The Quiet Coast, narrated with a thoughtful, unhurried pace.",cover:"moss",rating:"4.6"},
 {id:"coastal-towns",title:"Writing Coastal Towns",author:"Bookhub Editorial",category:"Fiction",format:"Article",length:6,year:2025,blurb:"Nadia Ferreira discusses place, memory, and building believable communities in fiction.",cover:"amber",rating:"4.1"},
 {id:"quiet-coast-video",title:"The Quiet Coast — Video Book",author:"Nadia Ferreira",category:"Fiction",format:"Video book",length:110,year:2025,blurb:"An illustrated screen adaptation that brings the novel's seaside atmosphere to life.",cover:"rust",rating:"4.4"},
 {id:"founders-fieldnotes",title:"Field Notes for Founders",author:"A. Mwangi",category:"Business & Economics",format:"Article",length:9,year:2026,blurb:"A concise guide to testing a small business idea before spending money building it.",cover:"moss",rating:"4.8"}
];
const KEY="bookhub:library:v1";
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"saved":[],"recent":[],"progress":{}}')}catch{return {saved:[],recent:[],progress:{}}}}
function write(state){try{localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent("bookhub:library-change",{detail:state}));}catch{}return state}
export function getLibrary(){return read()}
export function isSaved(id){return read().saved.includes(id)}
export function toggleSaved(id){const s=read();s.saved=s.saved.includes(id)?s.saved.filter(x=>x!==id):[...s.saved,id];write(s);return s.saved.includes(id)}
export function recordOpen(id){const s=read();s.recent=[id,...s.recent.filter(x=>x!==id)].slice(0,12);write(s)}
export function setProgress(id,value){const s=read();s.progress[id]=Math.max(0,Math.min(100,Number(value)||0));write(s)}
export function byId(id){return BOOKS.find(b=>b.id===id)}
export function coverClass(book){return book?.cover==="rust"?"rust":book?.cover==="amber"?"amber":""}
export function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
