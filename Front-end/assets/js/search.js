import {BOOKS,isSaved,toggleSaved,escapeHTML,coverClass} from "./catalog.js";
const form=document.querySelector("#library-search"), input=document.querySelector("#q2"), shelf=document.querySelector("#results"), status=document.querySelector("#result-status"), tabs=[...document.querySelectorAll("[data-type-tab]")];
const filters=[...document.querySelectorAll("[data-filter-type]")], categories=[...document.querySelectorAll("[data-filter-category]")], length=document.querySelector('input[name="len"]:checked'), sort=document.querySelector("#sort-results");
const params=new URLSearchParams(location.search);input.value=params.get("q")||"";
let activeType="All";
function matches(b){
 const q=input.value.trim().toLowerCase();
 const typeOn=filters.filter(x=>x.checked).map(x=>x.value);
 const catOn=categories.filter(x=>x.checked).map(x=>x.value);
 const lengthEl=document.querySelector('input[name="len"]:checked')?.value||"any";
 const hay=[b.title,b.author,b.category,b.format,b.blurb].join(" ").toLowerCase();
 if(q&&!hay.includes(q))return false;
 if(typeOn.length&&!typeOn.includes(b.format))return false;
 if(catOn.length&&!catOn.includes(b.category))return false;
 if(activeType!=="All"&&b.format!==activeType)return false;
 if(lengthEl==="short"&&!(b.format==="Audiobook"?b.length<3:b.length<200))return false;
 if(lengthEl==="long"&&!(b.format==="Audiobook"?b.length>10:b.length>400))return false;
 return true;
}
function render(){
 let list=BOOKS.filter(matches);const sortBy=sort?.value||"relevance";
 if(sortBy==="title")list.sort((a,b)=>a.title.localeCompare(b.title));
 if(sortBy==="newest")list.sort((a,b)=>b.year-a.year);
 if(sortBy==="rating")list.sort((a,b)=>Number(b.rating)-Number(a.rating));
 status.textContent=list.length+" result"+(list.length===1?"":"s")+" · sample catalogue";
 shelf.innerHTML=list.length?list.map(b=>`<article class="result-row ${b.format==="Audiobook"?"audio":b.format==="Video book"?"video":""}">
 <div class="spine ${coverClass(b)}" aria-hidden="true"></div><div><p class="r-title"><a href="book.html?id=${encodeURIComponent(b.id)}">${escapeHTML(b.title)}</a></p><p class="r-meta"><span class="fmt">${escapeHTML(b.format)}</span>${escapeHTML(b.author)} · ${escapeHTML(b.category)} · ${b.format==="Audiobook"?b.length+"h":b.format==="Video book"?b.length+" min":b.format==="Article"?b.length+" min read":b.length+" pages"}</p><p class="r-meta">${escapeHTML(b.blurb)}</p></div>
 <div class="r-actions"><a class="r-action" href="book.html?id=${encodeURIComponent(b.id)}">Explore</a><button class="icon-button" data-save="${b.id}" aria-pressed="${isSaved(b.id)}" aria-label="${isSaved(b.id)?"Remove from":"Save to"} shelf">${isSaved(b.id)?"♥ Saved":"＋ Save"}</button></div></article>`).join(""):`<div class="empty-state"><h2>No matching titles</h2><p>Try a different search term or remove one of your filters.</p><button class="btn btn-ghost" id="clear-filters" type="button">Clear filters</button></div>`;
}
form.addEventListener("submit",e=>{e.preventDefault();const p=new URLSearchParams();if(input.value.trim())p.set("q",input.value.trim());history.replaceState(null,"",location.pathname+(p.size?"?"+p:""));render()});
input.addEventListener("input",render);filters.forEach(x=>x.addEventListener("change",render));categories.forEach(x=>x.addEventListener("change",render));document.querySelectorAll('input[name="len"]').forEach(x=>x.addEventListener("change",render));sort?.addEventListener("change",render);
tabs.forEach(tab=>tab.addEventListener("click",e=>{e.preventDefault();activeType=tab.dataset.typeTab;tabs.forEach(t=>t.classList.toggle("active",t===tab));render()}));
shelf.addEventListener("click",e=>{const save=e.target.closest("[data-save]");if(save){toggleSaved(save.dataset.save);render();return}if(e.target.id==="clear-filters"){filters.forEach(x=>x.checked=false);categories.forEach(x=>x.checked=false);document.querySelector('input[name="len"][value="any"]').checked=true;activeType="All";tabs.forEach(t=>t.classList.toggle("active",t.dataset.typeTab==="All"));input.value="";render()}});
window.addEventListener("bookhub:library-change",render);render();
