"use strict";
const $ = selector => document.querySelector(selector);
const labels = {
 en:{menu:"Menu",next:"Next",prev:"Previous",details:"View details",search:"Search the menu",all:"All",photo:"Photo",video:"Video",close:"Close",empty:"No items found.",from:"from",reels:"Browse items",sizes:"Size"},
 es:{menu:"Carta",next:"Siguiente",prev:"Anterior",details:"Ver de cerca",search:"Buscar en la carta",all:"Todo",photo:"Foto",video:"Vídeo",close:"Cerrar",empty:"No se encontraron productos.",from:"desde",reels:"Recorrer productos",sizes:"Tamaño"},
 ru:{menu:"Меню",next:"Далее",prev:"Назад",details:"Рассмотреть",search:"Поиск по меню",all:"Все",photo:"Фото",video:"Видео",close:"Закрыть",empty:"Ничего не найдено.",from:"от",reels:"Блюда и напитки",sizes:"Размер"},
 zh:{menu:"菜单",next:"下一个",prev:"上一个",details:"查看详情",search:"搜索菜单",all:"全部",photo:"照片",video:"视频",close:"关闭",empty:"未找到商品。",from:"起",reels:"浏览商品",sizes:"规格"}
};
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const introVideo=document.querySelector("#introVideo");
let introVisible=false;
function syncIntroPlayback(){
 if(introVisible && !document.hidden && !reduced.matches)introVideo.play().catch(()=>{});
 else introVideo.pause();
}
new IntersectionObserver(([entry])=>{
 introVisible=entry.isIntersecting;
 syncIntroPlayback();
}).observe(introVideo);
document.addEventListener("visibilitychange",syncIntroPlayback);
reduced.addEventListener("change",syncIntroPlayback);
let lang="ru",products=[],index=0,size=0,motionFrame=0;
const words=()=>labels[lang];
const label=field=>field[lang]||field.ru;
const menuWords={en:["Food","Drinks","Printed drinks menu","View the printed menu","Category","Food extras"],es:["Comida","Bebidas","Carta de bebidas del salón","Ver la carta impresa","Categoría","Extras de cocina"],ru:["Еда","Напитки","Печатная карта напитков","Открыть печатное меню","Категория","Добавки к блюдам"],zh:["餐食","饮品","店内纸质饮品单","查看纸质菜单","类别","餐食加料"]};
const weight=v=>({Бокал:{en:"Glass",es:"Copa",ru:"Бокал",zh:"杯"},Бутылка:{en:"Bottle",es:"Botella",ru:"Бутылка",zh:"瓶"},Порция:{en:"Serving",es:"Porción",ru:"Порция",zh:"份"}}[v]?.[lang])||formatWeight(v);
const formatWeight=v=>lang==="ru"?v:v.replace(/мл/g,lang==="zh"?"毫升":"ml").replace(/г/g,lang==="zh"?"克":"g");
const product=()=>products[index];
const variant=()=>product().sizes[size];
function button(text,fn){const el=document.createElement("button");el.type="button";el.textContent=text;el.onclick=fn;return el}
function photoPath(key, enlarged = false) {
  if (key.startsWith("media/")) return key;
  return (enlarged ? "canva-zoom/" : "canva-web/") + key + ".webp?v=jugos";
}
function picture(key, enlarged = false) {
  const img = new Image();
  img.alt = "";
  img.src = photoPath(key, enlarged);
  return img;
}
function paperPage(n){
 const img=new Image();img.src="printed/"+n+".webp";img.alt=menuWords[lang][3];return img;
}
function paperLink(n){
 const a=document.createElement("a");a.href="printed/"+n+".webp";a.target="_blank";a.rel="noopener";a.textContent=menuWords[lang][3]+" ↗";return a;
}
function price(p){const min=Math.min(...p.sizes.map(v=>v.price));return (p.sizes.length>1||p.sizes[0].fromPrice)?(lang==="zh"?min+" ₽ 起":words().from+" "+min+" ₽"):min+" ₽"}
function movie(file){const v=document.createElement("video");v.muted=true;v.playsInline=true;v.loop=true;v.autoplay=true;v.src=file.startsWith("media/")?file:"motion/"+file;if(variant().photo)v.poster=photoPath(variant().photo);return v}
function choose(i,focus=false){index=(i+products.length)%products.length;size=0;render();if(focus)$("#scene").focus({preventScroll:true})}
function render(){
 const p=product(),v=variant(),t=words(),scene=$("#scene");
$("#category").textContent=label(p.cat);$("#title").textContent=label(p.name);$("#description").textContent=label(p.desc);
 $("#detail").hidden=!v.photo&&!v.video&&(p.section==="drinks"||!p.paper);$("#detail").textContent=(v.photo||v.video?t.details:menuWords[lang][3])+" ↗";$("#position").textContent=String(index+1).padStart(2,"0")+" / "+products.length;
 $("#prev").ariaLabel=t.prev;$("#next").ariaLabel=t.next;
 // Tableware travels with the photograph. Use the stage platform only for standalone vessels.
 const foodCategories = ["Combos","Desayunos","Ensaladas y entradas","Sobre pan","Sopas","Platos calientes","Postres y hojaldres","Tés"];
 const hasSaucer = ["81648d96","84895588","9ffc0317","516f57a1","a09ad6a8","541f4b96","3ae0e442","9745bafd","62d658cf","84c79c1c"];
 const plated = !v.photo || foodCategories.includes(p.cat.es) || hasSaucer.includes(v.photo);
 scene.classList.toggle("plated",plated);
 scene.classList.toggle("latte-cup",p.name.es==="Latte");
 scene.classList.toggle("drink-text",p.section==="drinks"&&!v.photo);
 scene.classList.toggle("small-mug",v.photo==="189367c8");
 $("#actor").replaceChildren(v.photo?picture(v.photo):p.section==="drinks"||!p.paper?"":paperPage(p.paper));
 refreshExtraPrice();
 const sizes=$("#sizes");sizes.ariaLabel=t.sizes;sizes.replaceChildren(...p.sizes.map((item,i)=>{
   if(p.sizes.length===1){const a=document.createElement("span");a.textContent=weight(item.weight);return a}
   const b=button(weight(item.weight),()=>{size=i;render();sizes.children[i].focus()});b.setAttribute("aria-pressed",i===size);return b
 }));
 document.querySelectorAll(".close").forEach(b=>b.ariaLabel=t.close);
}
const sections={
 drinks:{en:"Coffee shop",es:"Cafetería",ru:"Кофейня",zh:"咖啡馆"},
 food:{en:"Food",es:"Comida",ru:"Еда",zh:"餐食"},
 "sin-alcohol":{en:"Non-alcoholic drinks",es:"Bebidas sin alcohol",ru:"Безалкогольные напитки",zh:"无酒精饮品"},
 "con-alcohol":{en:"Alcoholic drinks",es:"Bebidas con alcohol",ru:"Алкогольные напитки",zh:"酒精饮品"}
};
const barPhotos={
 "Vinos tintos":"vino-tinto",
 "Vinos blancos":"vino-blanco",
 "Vinos rosados":"vino-rosado",
 "Espumantes":"espumante",
 "Cócteles":"cocteles",
 "Bebidas calientes con alcohol":"vino-caliente",
 "Destilados":"whisky"
};
const sectionOf=p=>p.drinkSection||p.section;
function majorSection(key,searching){
 const section=document.createElement("details");
 section.className="major-section";section.id=key==="food"?"comida":key;
 if(!searching)section.name="major-menu";
 const summary=document.createElement("summary"),heading=document.createElement("h2");
 heading.textContent=label(sections[key]);summary.append(heading);
 const coverPhotos={drinks:"cafeteria-barista","sin-alcohol":"cover-limonada-frutilla","con-alcohol":"cover-copas-vino"};
 const cover="canva-web/"+(coverPhotos[key]||"cover-"+key)+".webp";
 summary.style.setProperty("--cover","url("+cover+")");
 const body=document.createElement("div");body.className="section-content";
 const video=document.createElement("video");
 const videoPosters={food:"canva-web/preview-comida.webp?v=porada-comida-13","con-alcohol":"canva-web/preview-bar-hd.webp?v=vinos-4s","sin-alcohol":"canva-web/preview-limonada.webp"};
 video.className="section-loop";video.poster=videoPosters[key]||cover;video.preload="none";
 video.muted=true;video.loop=true;video.playsInline=true;video.controls=true;video.ariaLabel=label(sections[key]);
 if(!searching)body.append(video);
 section.append(summary,body);
 section.ontoggle=()=>{
  if(searching||!section.isConnected)return;
  if(!section.open){video.pause();return}
  if(!video.hasAttribute("src")){
   const version={food:"?v=porada-comida-13",drinks:"?v=cafeteria-barista","sin-alcohol":"?v=porada-cocteles-hd","con-alcohol":"?v=vinos-4s"};
   video.src="motion/section-"+key+".mp4"+(version[key]||"");
  }
  if(!reduced.matches)video.play().catch(()=>{});
 };
 section.open=searching;
 return {section,body}
}
function list(){
 const t=words(),filter=$("#search").value.trim().toLocaleLowerCase();
 const matches=products.map((p,i)=>({p,i})).filter(({p})=>Object.values(p.name).some(n=>n.toLocaleLowerCase().includes(filter)));
 const ordered=Object.keys(sections).flatMap(key=>matches
  .filter(({p})=>sectionOf(p)===key || (
   !filter && key==="drinks" && p.drinkSection==="sin-alcohol" &&
   p.cat.es==="Café frío y matcha" && p.cardPhoto
  ))
  .map(entry=>({...entry,key})));
 const results=$("#results");results.replaceChildren();
 let lastSection="",lastCat="",drinkGroup,cardGrid,sectionBody;
 for(const {p,i,key} of ordered){
  const useCards=key==="drinks"||!p.drinkSection||(key==="sin-alcohol"&&["Bebidas frescas","Café frío y matcha"].includes(p.cat.es));
  if(key!==lastSection){
   const {section,body}=majorSection(key,Boolean(filter));
   results.append(section);sectionBody=body;lastSection=key;lastCat=""
  }
  if(p.cat.ru!==lastCat){
   drinkGroup=document.createElement("details");drinkGroup.className="drink-group";
   if(!filter)drinkGroup.name="drink-sections";
   drinkGroup.open=Boolean(filter);
   const summary=document.createElement("summary");summary.textContent=label(p.cat);
   const beer=["Cervezas","Cervezas sin alcohol"].includes(p.cat.es);
   let icon=p.cardPhoto||"cover-"+key;
   if(p.cat.es==="Postres y hojaldres")icon="56d55e92";
   if(p.cat.es==="Café frío y matcha")icon="0555273b";
   if(key==="con-alcohol")icon=barPhotos[p.cat.es]||"copas-vino";
   if(beer)icon="chop-cerveza";
   const thumb=picture(icon);thumb.loading="lazy";thumb.className="group-photo";
   if(beer)thumb.classList.add("beer-photo");
   summary.prepend(thumb);
   drinkGroup.append(summary);
   if(useCards){cardGrid=document.createElement("div");cardGrid.className="cafe-grid";
    drinkGroup.append(cardGrid)}
   sectionBody.append(drinkGroup);lastCat=p.cat.ru;
  }
  if(!useCards || !p.cardPhoto){drinkGroup.append(drinkRow(p,i,useCards));continue}
  const b=button("",()=>{choose(i);$("#productView").showModal();history.pushState({productView:true},"","");$("#backMenu").focus()});b.className="tile";
  const img=picture(p.cardPhoto);img.loading="lazy";b.append(img);
  const n=document.createElement("strong"),amount=document.createElement("small");n.textContent=label(p.name);amount.textContent=price(p);b.append(n);if(p.sizes.some(v=>v.extras?.length)){
   const badge=document.createElement("span");badge.className="options-badge";badge.textContent=extraWords[lang].badge;b.append(badge);
  }
  b.append(amount);
  cardGrid.append(b);
 }
 if(!matches.length)results.textContent=t.empty;
}
function drinkRow(p,i,hasProductView){
 const row=document.createElement("article");row.className="drink-row";
 const name=document.createElement("h4");name.textContent=label(p.name);row.append(name);
 const sizes=document.createElement("div");sizes.className="drink-sizes";
 for(const [j,v] of p.sizes.entries()){
  const action=Boolean(hasProductView||v.photo||v.extras?.length);
  const line=action?button("",()=>{
   index=i;size=j;
   if(v.photo||!v.extras?.length){render();$("#productView").showModal();history.pushState({productView:true},"","");$("#backMenu").focus()}
   else openExtras()
  }):document.createElement("div");
  line.className="drink-serving";
  const volume=document.createElement("span"),amount=document.createElement("strong");
  volume.textContent=weight(v.weight);amount.id="serving-"+i+"-"+j;
  const totals=extraTotals(savedExtras.get(v),v);
  amount.textContent=servingPrice(v,totals);
  line.append(volume,amount);
  if(v.extras?.length){const option=document.createElement("small");option.className="drink-option";option.textContent=extraWords[lang].badge;line.append(option)}
  if(action){line.ariaLabel=[label(p.name),volume.textContent,amount.textContent,v.extras?.length?extraWords[lang].button:words().details].filter(Boolean).join(" · ")}
  sizes.append(line);
 }
 row.append(sizes);
 const desc=label(p.desc);
 if(desc){const note=document.createElement("p");note.textContent=desc;row.append(note)}
 return row
}
const reviewCopy={
 en:{title:"How was your visit?",help:"To publish your rating, select your stars and submit your review on each platform where you want to share it."},
 es:{title:"¿Cómo estuvo tu visita?",help:"Para publicar tu calificación, elegí las estrellas y enviá tu reseña en cada plataforma donde quieras compartirla."},
 ru:{title:"Как вам у нас?",help:"Чтобы опубликовать оценку, выберите звёзды и отправьте отзыв на каждой площадке, где хотите им поделиться."},
 zh:{title:"这次到店体验如何？",help:"要公开评价，请在想要分享的平台上选择星级并提交评价。"}
};
const stars=$("#reviewStars");
for(let value=1;value<=5;value++){
 const star=document.createElement("label"),radio=document.createElement("input"),icon=document.createElement("span");
 radio.type="radio";radio.name="visit-rating";radio.value=value;
 icon.textContent="★";icon.setAttribute("aria-hidden","true");
 star.append(radio,icon);stars.append(star);
}
function updateReview(){
 const selected=Number(stars.querySelector(":checked")?.value||0);
 $("#reviewTitle").textContent=reviewCopy[lang].title;
 $("#reviewHelp").textContent=reviewCopy[lang].help;
 for(const radio of stars.querySelectorAll("input")){
  radio.ariaLabel=({en:radio.value+" out of 5 stars",es:radio.value+" de 5 estrellas",ru:radio.value+" из 5",zh:radio.value+" 星（满分 5 星）"})[lang];
  radio.parentElement.classList.toggle("filled",Number(radio.value)<=selected);
 }
}
stars.addEventListener("change",updateReview);
const photoCopy={
 en:{title:"Share your dish on Instagram",hint:"Open your Instagram and choose Story, or take a photo here first.",instagram:"Open my Instagram",take:"Take a photo",choose:"Choose a photo",share:"Share photo…",save:"Save photo",alt:"Preview of your dish",ready:"Tap Share photo and choose Instagram Stories if available. You can also save the photo and choose it from your gallery in Instagram.",fallback:"Save your photo, open your Instagram and choose Story. Select your photo from the gallery.",invalid:"This image could not be opened. Try another photo or take one in Instagram."},
 es:{title:"Compartí tu plato en Instagram",hint:"Abrí tu Instagram y elegí Historia, o sacá primero la foto acá.",instagram:"Abrir mi Instagram",take:"Sacar foto",choose:"Elegir foto",share:"Compartir foto…",save:"Guardar foto",alt:"Vista previa de tu plato",ready:"Tocá Compartir foto y elegí Historias de Instagram si aparece. También podés guardar la foto y elegirla desde la galería en Instagram.",fallback:"Guardá la foto, abrí tu Instagram y elegí Historia. Seleccioná la foto desde la galería.",invalid:"No se pudo abrir esta imagen. Elegí otra o sacá la foto en Instagram."},
 ru:{title:"Поделитесь блюдом в Instagram",hint:"Откройте свой Instagram и выберите «История» или сначала сфотографируйте блюдо здесь.",instagram:"Открыть мой Instagram",take:"Снять фото",choose:"Из галереи",share:"Поделиться фото…",save:"Сохранить фото",alt:"Предпросмотр фото блюда",ready:"Нажмите «Поделиться фото» и выберите истории Instagram, если они доступны. Можно также сохранить фото и выбрать его из галереи в Instagram.",fallback:"Сохраните фото, откройте свой Instagram и выберите «История». Добавьте снимок из галереи.",invalid:"Не удалось открыть изображение. Выберите другое фото или сделайте снимок в Instagram."},
 zh:{title:"在 Instagram 分享美食",hint:"打开自己的 Instagram 并选择「快拍」，也可以先在这里拍照。",instagram:"打开我的 Instagram",take:"拍照",choose:"从相册选择",share:"分享照片…",save:"保存照片",alt:"菜品照片预览",ready:"点「分享照片」，如果选项中有 Instagram 快拍，请选择它。也可以先保存照片，再到 Instagram 从相册添加。",fallback:"保存照片，打开自己的 Instagram，选择「快拍」，然后从相册添加照片。",invalid:"无法打开图片。请选择其他照片，或在 Instagram 内拍照。"}
};
let dishFile=null, dishUrl="", photoMessage="", photoRequest=0;
function updatePhoto(){
 const copy=photoCopy[lang];
 for(const [id,key] of Object.entries({photoTitle:"title",photoHint:"hint",instagramPhoto:"instagram",takePhoto:"take",choosePhoto:"choose",sharePhoto:"share",savePhoto:"save"})){
  $("#"+id).textContent=copy[key];
 }
 $("#dishPreview").alt=copy.alt;
 $("#photoStatus").textContent=copy[photoMessage]||"";
}
async function selectDishPhoto(event){
 const file=event.target.files[0];
 event.target.value="";
 if(!file)return;
 const request=++photoRequest;
 const url=URL.createObjectURL(file);
 const preview=new Image();
 preview.src=url;
 try{await preview.decode()}catch{
  URL.revokeObjectURL(url);
  if(request===photoRequest){photoMessage="invalid";updatePhoto()}
  return;
 }
 if(request!==photoRequest){URL.revokeObjectURL(url);return}
 if(dishUrl)URL.revokeObjectURL(dishUrl);
 dishFile=file;dishUrl=url;
 $("#dishPreview").src=url;
 $("#savePhoto").href=url;$("#savePhoto").download=file.name;
 $("#photoResult").hidden=false;
 const canShare=Boolean(navigator.canShare?.({files:[file]}));
 $("#sharePhoto").hidden=!canShare;
 photoMessage=canShare?"ready":"fallback";updatePhoto();
 (canShare?$("#sharePhoto"):$("#savePhoto")).focus();
}
$("#takePhoto").onclick=()=>$("#dishCamera").click();
$("#choosePhoto").onclick=()=>$("#dishGallery").click();
$("#dishCamera").onchange=selectDishPhoto;
$("#dishGallery").onchange=selectDishPhoto;
$("#sharePhoto").onclick=async()=>{
 if(!dishFile)return;
 try{await navigator.share({files:[dishFile]})}
 catch(error){if(error.name!=="AbortError"){photoMessage="fallback";updatePhoto()}}
};
const loadCopy={
 en:{error:"The menu could not be loaded",retry:"Try again"},
 es:{error:"No se pudo cargar la carta",retry:"Volver a cargar"},
 ru:{error:"Не удалось загрузить меню",retry:"Попробовать ещё раз"},
 zh:{error:"菜单加载失败",retry:"重新加载"}
};
let menuFailed=false;
function catalog(){
 document.documentElement.lang=lang;$("#lang").value=lang;
 $("#lang").ariaLabel=({ru:"Язык меню",zh:"菜单语言",es:"Idioma de la carta",en:"Menu language"})[lang];
 $("#promoTitle").textContent=({en:"Offers",es:"Promociones",ru:"Акции",zh:"优惠活动"})[lang];
 updateReview();
 updatePhoto();
 const t=words();$("#drawerTitle").textContent=menuFailed?loadCopy[lang].error:t.menu;$("#search").placeholder=t.search;$("#search").ariaLabel=t.search;
 $("#retryMenu").hidden=!menuFailed;$("#retryMenu").textContent=loadCopy[lang].retry;
 $("#search").disabled=!products.length;
 if(products.length)list()
}
function details(clip=false){
 const p=product(),v=variant();$("#infoTitle").textContent=label(p.name);$("#recipe").textContent=label(p.desc);
 clip=Boolean(v.video&&(clip||!v.photo));
 const media=clip?movie(v.video):v.photo?picture(v.photo,true):paperPage(p.paper);media.alt=label(p.name);if(clip)media.controls=true;$("#media").replaceChildren(media);if(!v.photo&&p.paper)$("#media").append(paperLink(p.paper));
 $("#mediaControls").replaceChildren(...(v.video&&v.photo?[button(clip?words().photo:"▶ "+words().video,()=>details(!clip))]:[]))
}
$("#lang").onchange=e=>{lang=e.target.value;catalog()};
$("#prev").onclick=()=>choose(index-1);$("#next").onclick=()=>choose(index+1);
$("#detail").onclick=()=>{details();$("#info").showModal()};
$("#search").oninput=list;
function returnToCatalog(){
 if(history.state?.productView) history.back();
 else $("#productView").close();
}
$("#backMenu").onclick=returnToCatalog;
$("#productView").oncancel=e=>{e.preventDefault();returnToCatalog()};
window.addEventListener("popstate",()=>{if($("#extraPanel").open)$("#extraPanel").close();if($("#info").open)$("#info").close();if($("#productView").open)$("#productView").close()});
$("#productView").onclose=()=>$("#actor").replaceChildren();
$("#info .close").onclick=()=>$("#info").close();
$("#info").onclick=e=>{if(e.target===$("#info"))$("#info").close()};
$("#info").onclose=()=>$("#media").replaceChildren();
const scene=$("#scene");let start=null;
function move(x,y){cancelAnimationFrame(motionFrame);motionFrame=requestAnimationFrame(()=>{scene.style.setProperty("--px",x+"px");scene.style.setProperty("--py",y+"px")})}
scene.onpointermove=e=>{if(reduced.matches)return;const r=scene.getBoundingClientRect();move(((e.clientX-r.left)/r.width-.5)*22,((e.clientY-r.top)/r.height-.5)*14)};
scene.onpointerleave=()=>move(0,0);
scene.onpointerdown=e=>{if(!e.target.closest("button"))start=[e.clientX,e.clientY]};
scene.onpointercancel=()=>{start=null;move(0,0)};
scene.onpointerup=e=>{if(start){const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy))choose(index+(dx<0?1:-1))}start=null;move(0,0)};
document.onkeydown=e=>{if(!$("#productView").open||$("#extraPanel").open||$("#info").open||e.target.closest("select")||!products.length)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();choose(index+(e.key==="ArrowRight"?1:-1))}};
reduced.addEventListener("change",()=>{if($("#productView").open)render()});
async function init(){
 menuFailed=false;catalog();
 try{
  const response=await fetch("menu.json",{cache:"no-cache"});if(!response.ok)throw Error("menu");
  products=await response.json();
 }catch{menuFailed=true;catalog();return}
 $("#search").value="";
 catalog();
}
$("#retryMenu").onclick=init;
init();
const extraWords={
 en:{badge:"+ Options",button:"Options",title:"Customize",apply:"Apply selection",total:"Drink price",one:"Choose one option",max:"Maximum",add:"Add",remove:"Remove"},
 es:{badge:"+ Opciones",button:"Opciones",title:"Personalizar",apply:"Aplicar selección",total:"Precio de la bebida",one:"Elegí una opción",max:"Máximo",add:"Agregar",remove:"Quitar"},
 ru:{badge:"+ Выбор",button:"Варианты",title:"Выберите варианты",apply:"Применить",total:"Стоимость напитка",one:"Выберите один вариант",max:"Максимум",add:"Добавить",remove:"Убрать"},
 zh:{badge:"+ 可选",button:"可选项",title:"自选搭配",apply:"确认选择",total:"饮品价格",one:"请选择一项",max:"最多",add:"添加",remove:"减少"}
};
const savedExtras=new WeakMap();
let draftExtras=null;
const groupsForDrink=(v=variant())=>(v.extras||[]).map(key=>ingredientGroups[key]);
const choiceKey=(g,o)=>g.options[0].id+":"+o.id;
function extraTotals(selection,v=variant()){
 let count=0,amount=0;
 for(const g of groupsForDrink(v))for(const o of g.options){
  const n=selection?.[choiceKey(g,o)]||0;count+=n;amount+=n*o.price;
 }
 return {count,amount};
}
function servingPrice(v,{count,amount}){
 return (v.fromPrice&&!count&&lang!=="zh"?words().from+" ":"")+(v.price+amount)+" ₽"+(v.fromPrice&&!count&&lang==="zh"?" 起":"");
}
function refreshExtraPrice(){
 const v=variant(),totals=extraTotals(savedExtras.get(v)),count=totals.count;
 const formatted=servingPrice(v,totals);
 $("#price").textContent=formatted;
 const b=$("#extrasButton");b.hidden=!v.extras?.length;
 const listPrice=document.getElementById("serving-"+index+"-"+size);
 if(listPrice)listPrice.textContent=formatted;
 b.textContent=(count?"✓ ":"+ ")+extraWords[lang].button+(count?" · "+count:"");
}
function openExtras(){
 const t=extraWords[lang],v=variant(),groups=groupsForDrink();
 draftExtras={...savedExtras.get(v)};
 $("#extraTitle").textContent=t.title;$("#extraDrink").textContent=[label(product().name),weight(v.weight)].filter(Boolean).join(" · ");
 $("#totalLabel").textContent=product().section==="food"?({en:"Dish price",es:"Precio del plato",ru:"Стоимость блюда",zh:"菜品价格"})[lang]:t.total;$("#applyExtras").textContent=t.apply;$("#extraPanel .close").ariaLabel=words().close;
 const refreshers=[];
 const applyState=()=>{
  $("#extraTotal").textContent=(v.price+extraTotals(draftExtras).amount)+" ₽";
  const valid=refreshers.map(refresh=>refresh());$("#applyExtras").disabled=valid.includes(false);
 };
 const sections=groups.map(g=>{
  const section=document.createElement("section"),title=document.createElement("h3"),hint=document.createElement("small");
  title.textContent=label(g.title);hint.textContent=g.min===1&&g.max===1?t.one:g.max==null?"":t.max+" "+g.max;section.append(title,hint);
  const controls=g.options.map(o=>{
   const key=choiceKey(g,o),name=label(o.name),single=g.max===1;
   if(!Object.hasOwn(draftExtras,key))draftExtras[key]=o.initial;
   const row=document.createElement("div");row.className="extra-row";
   const text=document.createElement("span"),meta=document.createElement("small");text.textContent=name;
   meta.textContent=[weight(o.weight),(o.price?"+":"")+o.price+" ₽"].filter(Boolean).join(" · ");text.append(meta);
   const select=button(single?"○":"+",()=>{
    if(single){for(const other of g.options)draftExtras[choiceKey(g,other)]=0;draftExtras[key]=1}
    else draftExtras[key]++;applyState()
   });select.ariaLabel=t.add+" · "+name;
   const minus=button("−",()=>{draftExtras[key]--;applyState()});minus.ariaLabel=t.remove+" · "+name;
   const qty=document.createElement("span");qty.className="qty";row.append(text,minus,qty,select);section.append(row);
   return sum=>{const n=draftExtras[key];minus.hidden=single||!n;qty.hidden=single||!n;qty.textContent=n;
    if(single){select.textContent=n?"✓":"○";select.setAttribute("aria-pressed",Boolean(n))}
    else select.disabled=(o.max>0&&n>=o.max)||(g.max!=null&&sum>=g.max);
   };
  });
  refreshers.push(()=>{const sum=g.options.reduce((acc,o)=>acc+draftExtras[choiceKey(g,o)],0);controls.forEach(update=>update(sum));return sum>=g.min&&(g.max==null||sum<=g.max)});
  return section;
 });
 $("#extraGroups").replaceChildren(...sections);applyState();$("#extraPanel").showModal();$("#extraPanel").scrollTop=0;
}
$("#extrasButton").onclick=openExtras;
$("#applyExtras").onclick=()=>{savedExtras.set(variant(),{...draftExtras});refreshExtraPrice();$("#extraPanel").close()};
