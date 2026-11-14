(() => {
  "use strict";

  const SAVE_KEY = "studyspaceWorldOrderV1";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const money = n => new Intl.NumberFormat("de-DE", {style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
  const percent = n => Math.round(n) + "%";
  const months = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const today = () => new Date().toISOString().slice(0,10);

  const SEEDS = [
    {id:"arvend",name:"Republik Arvend",flag:"🇩🇪",region:"Nördlicher Kontinent",capital:"Alden",government:"Parlamentarische Republik",orientation:"Sozialliberal",population:58,economy:84,stability:72,military:55,technology:82,resources:"Maschinenbau, Forschung",description:"Eine exportorientierte Demokratie mit starker Industrie und einem gut ausgebauten Bildungssystem."},
    {id:"varelia",name:"Varelia",flag:"🇫🇷",region:"Westlicher Kontinent",capital:"Varenne",government:"Semipräsidentielle Republik",orientation:"Zentristisch",population:46,economy:78,stability:68,military:69,technology:76,resources:"Luftfahrt, Landwirtschaft",description:"Ein einflussreicher Staat, der auf Diplomatie und europäische Kooperation setzt."},
    {id:"korvath",name:"Korvath",flag:"🇷🇺",region:"Östlicher Kontinent",capital:"Korsin",government:"Präsidialrepublik",orientation:"Nationalkonservativ",population:91,economy:68,stability:57,military:91,technology:61,resources:"Energie, Metalle",description:"Eine große Regionalmacht mit bedeutenden Rohstoffvorkommen und starkem Sicherheitsapparat."},
    {id:"nerath",name:"Nerath",flag:"🇧🇷",region:"Südlicher Kontinent",capital:"Nera",government:"Föderale Republik",orientation:"Pragmatisch",population:74,economy:71,stability:63,military:58,technology:62,resources:"Erze, Agrarprodukte",description:"Ein bevölkerungsreicher Staat mit großen Rohstoff- und Agrarreserven."},
    {id:"eldoria",name:"Eldoria",flag:"🇯🇵",region:"Östlicher Kontinent",capital:"Eld",government:"Parlamentarische Monarchie",orientation:"Technokratisch",population:39,economy:92,stability:79,military:53,technology:97,resources:"Halbleiter, Robotik",description:"Eine hoch technisierte Handelsnation, die Wissen und Innovation als strategische Stärke nutzt."},
    {id:"sorevia",name:"Sorevia",flag:"🇳🇱",region:"Westlicher Kontinent",capital:"Sora",government:"Parlamentarische Republik",orientation:"Liberaldemokratisch",population:18,economy:88,stability:82,military:35,technology:86,resources:"Häfen, Finanzdienstleistungen",description:"Ein kleiner, wohlhabender Staat mit international vernetzten Häfen und Finanzmärkten."},
    {id:"darsun",name:"Darsun",flag:"🇹🇷",region:"Mittlerer Kontinent",capital:"Dara",government:"Republik",orientation:"Konservativ",population:67,economy:62,stability:54,military:75,technology:59,resources:"Textilien, Transitwege",description:"Ein strategisch gelegener Staat zwischen mehreren Wirtschaftsregionen."},
    {id:"belvar",name:"Belvar",flag:"🇨🇦",region:"Nördlicher Kontinent",capital:"Bel",government:"Föderale Demokratie",orientation:"Sozialdemokratisch",population:31,economy:79,stability:85,military:48,technology:74,resources:"Holz, Wasser, Agrarwirtschaft",description:"Ein stabiler Staat mit großen Flächen, Rohstoffen und ausgeprägten Sozialinstitutionen."},
    {id:"teren",name:"Teren",flag:"🇨🇭",region:"Mittlerer Kontinent",capital:"Ter",government:"Konföderation",orientation:"Neutral und föderal",population:9,economy:87,stability:91,military:29,technology:88,resources:"Präzisionstechnik, Finanzwesen",description:"Ein neutraler Vermittler, der internationale Konferenzen und Schlichtung anbietet."},
    {id:"myrak",name:"Myrak",flag:"🇸🇦",region:"Südlicher Kontinent",capital:"Myr",government:"Konstitutionelle Monarchie",orientation:"Monarchisch-pragmatisch",population:24,economy:73,stability:61,military:65,technology:64,resources:"Energie, Chemie",description:"Ein bedeutender Energieexporteur, dessen Einnahmen stark von Rohstoffmärkten abhängen."},
    {id:"caldria",name:"Caldria",flag:"🇬🇧",region:"Westlicher Kontinent",capital:"Calden",government:"Parlamentarische Monarchie",orientation:"Liberal-konservativ",population:53,economy:86,stability:70,military:72,technology:83,resources:"Finanzen, Medien, Dienstleistungen",description:"Ein global vernetzter Staat mit starken Finanz- und Medieninstitutionen."},
    {id:"ostara",name:"Ostara",flag:"🇰🇷",region:"Östlicher Kontinent",capital:"Ost",government:"Präsidiale Demokratie",orientation:"Reformorientiert",population:43,economy:76,stability:66,military:62,technology:91,resources:"Elektronik, Schiffbau",description:"Eine dynamische Industriemacht, die in Forschung und regionale Partnerschaften investiert."}
  ];

  const BUILTIN_QUESTIONS = [
    {id:"w1",q:"Was beschreibt das Bruttoinlandsprodukt (BIP)?",a:"Den Gesamtwert aller Waren und Dienstleistungen, die innerhalb eines Landes in einem bestimmten Zeitraum produziert werden.",subject:"Wirtschaft"},
    {id:"w2",q:"Was ist ein bilaterales Abkommen?",a:"Eine Vereinbarung zwischen zwei Staaten.",subject:"Politik"},
    {id:"w3",q:"Was bedeutet Gewaltenteilung?",a:"Die Aufteilung staatlicher Macht auf Legislative, Exekutive und Judikative, damit Macht kontrolliert und begrenzt wird.",subject:"Politik"},
    {id:"w4",q:"Was ist eine Koalition?",a:"Ein Zusammenschluss mehrerer Parteien, die gemeinsam eine Regierung bilden oder parlamentarisch zusammenarbeiten.",subject:"Politik"},
    {id:"w5",q:"Was bedeutet Inflation?",a:"Ein anhaltender Anstieg des allgemeinen Preisniveaus; Geld verliert dadurch an Kaufkraft.",subject:"Wirtschaft"},
    {id:"w6",q:"Was ist ein Veto im Sicherheitsrat-Modell?",a:"Ein besonderes Stimmrecht, mit dem ein einzelnes Mitglied einen Beschluss verhindern kann.",subject:"Internationale Beziehungen"},
    {id:"w7",q:"Was versteht man unter Diplomatie?",a:"Die Pflege und Gestaltung der Beziehungen zwischen Staaten durch Gespräche, Verhandlungen und offizielle Vertretungen.",subject:"Internationale Beziehungen"},
    {id:"w8",q:"Was ist ein Handelsbilanzüberschuss?",a:"Ein Land exportiert wertmäßig mehr Waren und Dienstleistungen, als es importiert.",subject:"Wirtschaft"},
    {id:"w9",q:"Was bedeutet Föderalismus?",a:"Staatliche Aufgaben und Kompetenzen sind zwischen einer zentralen Ebene und Gliedstaaten aufgeteilt.",subject:"Politik"},
    {id:"w10",q:"Was ist eine Resolution?",a:"Eine förmliche Beschlussvorlage oder Erklärung einer politischen oder internationalen Organisation.",subject:"Internationale Beziehungen"},
    {id:"w11",q:"Was bedeutet Nachhaltigkeit in der Politik?",a:"Politische Entscheidungen berücksichtigen langfristige ökologische, wirtschaftliche und soziale Folgen.",subject:"Politik"},
    {id:"w12",q:"Was ist Entwicklungshilfe?",a:"Unterstützung für wirtschaftliche, soziale oder institutionelle Entwicklung, etwa durch Finanzierung, Wissen oder Infrastruktur.",subject:"Internationale Beziehungen"}
  ];

  const LAWS = [
    {id:"education",name:"Bildungsoffensive",tag:"Bildung",cost:150,description:"Zusätzliche Investitionen in Schulen, Hochschulen und berufliche Bildung.",effects:{technology:4,economy:2,approval:5,stability:2},support:43},
    {id:"energy",name:"Energie- und Infrastrukturpakt",tag:"Infrastruktur",cost:190,description:"Modernisiert Netze und verringert langfristige Energieabhängigkeiten.",effects:{economy:5,stability:2,approval:2},support:48},
    {id:"transparency",name:"Transparenzgesetz",tag:"Institutionen",cost:90,description:"Stärkt Kontrolle, öffentliche Rechenschaft und Vertrauen in Institutionen.",effects:{stability:6,approval:4,influence:2},support:45},
    {id:"research",name:"Nationaler Forschungsfonds",tag:"Forschung",cost:180,description:"Fördert Universitäten, Innovation und internationale Forschungskooperation.",effects:{technology:6,economy:2,research:5},support:42},
    {id:"health",name:"Gesundheitsversorgung stärken",tag:"Soziales",cost:170,description:"Verbessert den Zugang zu medizinischer Versorgung und soziale Sicherheit.",effects:{approval:6,stability:4},support:46},
    {id:"trade",name:"Offene-Handels-Strategie",tag:"Wirtschaft",cost:120,description:"Vereinfacht Handelsverfahren und unterstützt exportorientierte Unternehmen.",effects:{economy:5,influence:3,approval:1},support:50},
    {id:"climate",name:"Klimaschutz- und Anpassungsgesetz",tag:"Klima",cost:160,description:"Investiert in Anpassung, Effizienz und klimafreundliche Technologien.",effects:{technology:2,stability:3,approval:3},support:44},
    {id:"civic",name:"Bürgerbeteiligungsgesetz",tag:"Demokratie",cost:80,description:"Erweitert Beteiligungsmöglichkeiten und stärkt die demokratische Legitimation.",effects:{approval:5,stability:3,influence:1},support:47}
  ];

  const MINISTERS = [
    {id:"lena",name:"Lena Voss",field:"economy",role:"Wirtschaft",bonus:"Wirtschaft +2 pro Jahr"},
    {id:"amir",name:"Amir Keller",field:"foreign",role:"Außenpolitik",bonus:"Diplomatie erhält einen kleinen Bonus"},
    {id:"mira",name:"Mira Aydin",field:"education",role:"Bildung",bonus:"Technologie wächst etwas schneller"},
    {id:"jonas",name:"Jonas Rehm",field:"finance",role:"Finanzen",bonus:"Monatliche Ausgaben sinken leicht"},
    {id:"sana",name:"Sana Berg",field:"social",role:"Soziales",bonus:"Regierungsstabilität verbessert sich"},
    {id:"noah",name:"Noah Winter",field:"environment",role:"Umwelt",bonus:"Klimaschutzbeschlüsse erhalten einen Bonus"}
  ];

  const EVENTS = [
    {id:"energy",title:"Energiepreise steigen",text:"Auf den Weltmärkten steigen die Energiepreise. Unternehmen und Haushalte erwarten eine Reaktion deiner Regierung.",choices:[{id:"support",label:"Haushalte entlasten",cost:100,effects:{approval:4,stability:2},result:"Du finanzierst eine befristete Entlastung."},{id:"invest",label:"Energieeffizienz fördern",cost:140,effects:{technology:3,economy:2,approval:2},result:"Du investierst in Effizienz und neue Technologien."},{id:"wait",label:"Markt beobachten",cost:0,effects:{approval:-2},result:"Du greifst nicht ein. Die Haushalte reagieren zurückhaltend."}]},
    {id:"summit",title:"Einladung zum Weltgipfel",text:"Mehrere Regierungen schlagen einen Gipfel zu Handel, Forschung und globalen Standards vor.",choices:[{id:"host",label:"Gipfel mitfinanzieren",cost:90,effects:{influence:7,approval:2},result:"Dein Land gewinnt internationale Sichtbarkeit."},{id:"send",label:"Delegation entsenden",cost:35,effects:{influence:3,research:2},result:"Deine Delegation knüpft neue Kontakte."},{id:"decline",label:"Einladung ablehnen",cost:0,effects:{treasury:20},result:"Du sparst Mittel, verzichtest aber auf Kontakte."}]},
    {id:"drought",title:"Ernteausfälle in Belvar",text:"Belvar meldet schwere Ernteausfälle. Mehrere Staaten diskutieren gemeinsame Nahrungsmittelhilfe.",choices:[{id:"aid",label:"Nahrungsmittelhilfe leisten",cost:110,effects:{influence:6,approval:3},result:"Deine Unterstützung wird positiv aufgenommen."},{id:"forum",label:"Weltforum einschalten",cost:45,effects:{influence:4,stability:1},result:"Du organisierst eine koordinierte Hilfsaktion."},{id:"decline",label:"Keine Hilfe zusagen",cost:0,effects:{approval:-1},result:"Du konzentrierst dich auf den eigenen Haushalt."}]},
    {id:"recession",title:"Abkühlung der Weltwirtschaft",text:"Die internationale Nachfrage lässt nach. Exportorientierte Unternehmen melden weniger Aufträge.",choices:[{id:"stimulus",label:"Konjunkturprogramm",cost:170,effects:{economy:4,approval:3},result:"Du stützt Nachfrage und Beschäftigung."},{id:"training",label:"Weiterbildung fördern",cost:100,effects:{technology:3,stability:2},result:"Du setzt auf Qualifizierung und langfristige Produktivität."},{id:"budget",label:"Haushalt vorsichtig halten",cost:0,effects:{stability:1,approval:-2},result:"Du schützt die Staatskasse, aber die Wirtschaft erhält wenig Impulse."}]},
    {id:"migration",title:"Humanitäre Aufnahmefrage",text:"Eine Krise in einer Nachbarregion führt zu steigenden Schutz- und Unterstützungsanfragen. Kommunen bitten um koordinierte Hilfe.",choices:[{id:"support",label:"Kommunen unterstützen",cost:125,effects:{stability:3,approval:3,influence:2},result:"Du stellst zusätzliche Mittel und Koordination bereit."},{id:"cooperate",label:"Internationale Abstimmung",cost:55,effects:{influence:5,stability:1},result:"Du organisierst eine gemeinsame Beratungsrunde."},{id:"delay",label:"Entscheidung vertagen",cost:0,effects:{stability:-2,approval:-2},result:"Die Unsicherheit bleibt bestehen."}]},
    {id:"research",title:"Forschungsdurchbruch",text:"Eine Universität deines Landes meldet einen wichtigen Fortschritt. Unternehmen und Forschungseinrichtungen bitten um weitere Unterstützung.",choices:[{id:"fund",label:"Forschung zusätzlich fördern",cost:120,effects:{technology:5,research:5,economy:2},result:"Du finanzierst Folgeprojekte und stärkst den Forschungsstandort."},{id:"partner",label:"Internationale Kooperation",cost:60,effects:{technology:3,influence:4,research:3},result:"Du öffnest das Projekt für internationale Partner."},{id:"observe",label:"Erst Ergebnisse abwarten",cost:0,effects:{treasury:10},result:"Du wartest auf weitere Erkenntnisse."}]},
    {id:"protest",title:"Proteste gegen Lebenshaltungskosten",text:"In mehreren Städten demonstrieren Menschen wegen steigender Lebenshaltungskosten. Die Opposition fordert schnelle Maßnahmen.",choices:[{id:"relief",label:"Gezielte Entlastung",cost:140,effects:{approval:6,stability:3},result:"Du unterstützt besonders belastete Haushalte."},{id:"dialogue",label:"Runden Tisch einberufen",cost:35,effects:{stability:4,influence:1},result:"Gewerkschaften, Unternehmen und Kommunen verhandeln."},{id:"reject",label:"Forderungen zurückweisen",cost:0,effects:{approval:-5,stability:-3},result:"Die Proteste halten an."}]}
  ];

  let state = loadGame();
  let activeView = "dashboard";
  let quiz = {items:[],index:0,revealed:false,seen:[]};
  let toastTimer = null;

  function loadGame() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (data && data.version === 1 && data.player && Array.isArray(data.countries)) { migrateExtendedState(data); return data; }
    } catch (error) { console.warn("WORLD ORDER Spielstand konnte nicht gelesen werden.", error); }
    return null;
  }
  function saveGame() {
    if (!state) return;
    try {
      state.savedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if ($("wo-save-status")) $("wo-save-status").textContent = "Automatisch gespeichert";
    } catch (error) {
      if ($("wo-save-status")) $("wo-save-status").textContent = "Speicherproblem";
      console.error(error);
    }
  }
  function makeCountries() {
    return SEEDS.map((item, index) => ({...item, economy:clamp(item.economy,1,100), stability:clamp(item.stability,1,100), military:clamp(item.military,1,100), technology:clamp(item.technology,1,100), trend:0, tradeOpen:false, lastAction:""}));
  }
  function createGame(countryId, difficulty, role) {
    const countries = makeCountries();
    const chosen = countries.find(c => c.id === countryId) || countries[0];
    const relationships = {};
    countries.filter(c=>c.id!==chosen.id).forEach(c => {
      const seed = (chosen.id.length*7 + c.id.length*3) % 15;
      relationships[c.id] = 8 + seed;
      if (c.region === chosen.region) relationships[c.id] += 5;
      if (c.orientation.includes("Neutral")) relationships[c.id] += 7;
      relationships[c.id] = clamp(relationships[c.id], -100, 100);
    });
    state = {
      version:1, countryId:chosen.id, difficulty:difficulty || "normal", role:role || "head",
      year:2028, month:1, turn:0, actionPoints:3, nextElection:36,
      player:{treasury:1100,approval:58,stability:chosen.stability,economy:chosen.economy,military:chosen.military,technology:chosen.technology,influence:30,research:12,tax:22,parliament:56,relationships, budget:{education:20,health:22,infrastructure:20,defense:18,diplomacy:10,reserves:10}, tradePartners:[], alliances:[], laws:[], ministers:{}, memberships:["world-forum"], eventCount:0},
      countries, news:[], resolutions:[], politics:{parties:[{id:"civic",name:"Bürgerforum",ideology:"sozialliberal",support:31,government:true},{id:"conservative",name:"Konservative Allianz",ideology:"konservativ",support:24},{id:"social",name:"Soziale Gerechtigkeit",ideology:"sozialdemokratisch",support:19},{id:"green",name:"Zukunft & Klima",ideology:"ökologisch",support:15},{id:"liberal",name:"Freiheitspartei",ideology:"liberal",support:11}],campaigns:0,lastElection:null,coalition:["civic"],mandate:56}, learningStats:{answered:0,known:0,unsure:0,researchEarned:0}, rewardLedger:[], achievements:[], currentEvent:null, lastEconomy:{income:0,expenses:0,net:0}, society:{happiness:64,inequality:42,freedom:72,mediaTrust:61,environment:55,employment:91}, policies:{welfare:50,freedom:65,green:45,industry:55,education:60}, trade:{imports:[],exports:[],agreements:[]}, researchTree:{unlocked:["basic-research"],completed:[]}, projects:[], climate:{emissions:52,renewables:38,adaptation:30}
    };
    addNews("Regierungsübernahme", "Du übernimmst die Führung von "+chosen.name+". Dein erster Monat beginnt.", "success");
    saveGame();
    activeView = "dashboard";
    render();
  }
  const playerCountry = () => state && state.countries.find(c=>c.id===state.countryId);
  const countryById = id => state && state.countries.find(c=>c.id===id);
  const relation = id => Number(state?.player?.relationships?.[id]) || 0;
  const relationLabel = value => value >= 60 ? "Enge Partnerschaft" : value >= 25 ? "Gute Beziehungen" : value >= -10 ? "Ausgewogen" : value >= -40 ? "Angespannt" : "Schwierig";
  const relationTone = value => value >= 25 ? "positive" : value <= -25 ? "negative" : "neutral";
  const turnLabel = () => months[(state.month-1)%12] + " " + state.year;

  function addNews(title, text, tone) {
    if (!state) return;
    state.news.unshift({id:"n"+Date.now()+Math.random().toString(36).slice(2,6),title,text,tone:tone||"neutral",date:turnLabel()});
    state.news = state.news.slice(0,80);
  }
  function notify(message) {
    const box=$("wo-toast"); if(!box)return;
    box.textContent=message; box.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove("show"),2600);
  }
  function spendAP(amount) {
    if (state.actionPoints < amount) { notify("Für diesen Monat sind keine politischen Aktionspunkte mehr übrig."); return false; }
    state.actionPoints -= amount; return true;
  }
  function changeStat(key, amount) {
    const p=state.player;
    if (key==="treasury") p.treasury=Math.max(0,p.treasury+amount);
    else if (["approval","stability","economy","military","technology","influence","research","parliament"].includes(key)) p[key]=clamp(p[key]+amount,0,100);
  }
  function effectApply(effects) { Object.entries(effects||{}).forEach(([key,value])=>changeStat(key,value)); }
  function renderHeader() {
    const stats=$("wo-top-stats");
    if(!state){stats.innerHTML='<span class="wo-muted">Deine neue internationale Simulation</span>';return;}
    const p=state.player, c=playerCountry();
    stats.innerHTML='<div class="wo-stat"><span>Staatskasse</span><strong>'+money(p.treasury)+'</strong></div>'+
      '<div class="wo-stat"><span>Zustimmung</span><strong>'+Math.round(p.approval)+'%</strong></div>'+
      '<div class="wo-stat"><span>Einfluss</span><strong>'+Math.round(p.influence)+'</strong></div>'+
      '<div class="wo-stat"><span>Forschung</span><strong>'+Math.round(p.research)+'</strong></div>'+
      '<div class="wo-stat wo-date"><span>'+esc(c.name)+'</span><strong>'+esc(turnLabel())+'</strong></div>';
    $("wo-save-status").textContent="Spielstand gespeichert";
  }
  function renderNav() {
    document.querySelectorAll("#wo-nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===activeView));
    $("wo-turn-button").disabled=!state;
    $("wo-export-button").disabled=!state;
    $("wo-reset-button").disabled=!state;
  }
  function render() {
    renderHeader(); renderNav();
    if(!state){$("wo-setup").hidden=false;$("wo-view").hidden=true;renderSetup();return;}
    $("wo-setup").hidden=true;$("wo-view").hidden=false;
    const views={dashboard:renderDashboard,world:renderWorld,atlas:renderAtlas,society:renderSociety,trade:renderTrade,research:renderResearch,diplomacy:renderDiplomacy,economy:renderEconomy,government:renderGovernment,politics:renderPolitics,organizations:renderOrganizations,learning:renderLearning,news:renderNews};
    const renderFn=views[activeView]||renderDashboard;
    $("wo-view").innerHTML=renderFn();
  }
  function renderSetup() {
    $("wo-setup").innerHTML=
      '<div class="wo-setup-hero"><div class="wo-kicker">STUDYSPACE · INTERNATIONALE POLITIK</div><h1>WORLD ORDER</h1><p>Führe einen modernen Staat durch Diplomatie, Innenpolitik, Wirtschaft und internationale Krisen. Zwölf Staaten verfolgen eigene Interessen – die Welt entwickelt sich auch ohne dich weiter.</p><div class="wo-hero-points"><span>🌐 12 Staaten</span><span>🏛️ Innenpolitik</span><span>🤝 Diplomatie</span><span>📚 Lernen mit deinem Wissen</span></div></div>'+
      '<form id="wo-start-form" class="wo-panel wo-start-panel"><div class="wo-panel-head"><div><span class="wo-kicker">NEUE SIMULATION</span><h2>Deine Regierung beginnt</h2><p>Wähle deinen Heimatstaat und den Schwierigkeitsgrad.</p></div></div>'+
      '<div class="wo-form-grid"><label>Dein Staat<select id="wo-country">'+SEEDS.map(c=>'<option value="'+c.id+'" '+(c.id==="arvend"?'selected':'')+'>'+c.flag+' '+esc(c.name)+' · '+esc(c.region)+'</option>').join("")+'</select></label>'+
      '<label>Schwierigkeit<select id="wo-difficulty"><option value="easy">Einsteiger – mehr finanzielle Spielräume</option><option value="normal" selected>Normal – ausgewogene Simulation</option><option value="hard">Anspruchsvoll – stärkere Krisen und Kosten</option></select></label>'+
      '<label>Deine Rolle<select id="wo-role"><option value="head" selected>Staatsoberhaupt / Regierungschef</option><option value="coalition">Regierungschef mit Koalitionspartnern</option></select></label></div>'+
      '<div class="wo-country-preview" id="wo-country-preview">'+previewCountry(SEEDS[0])+'</div>'+
      '<button class="wo-btn primary large" type="submit">Regierung bilden und Spiel beginnen →</button><p class="wo-muted">Du kannst jederzeit speichern. Dein Spielstand bleibt auch nach dem Schließen des Browsers erhalten.</p></form>';
    $("wo-country").addEventListener("change",()=>{$("wo-country-preview").innerHTML=previewCountry(SEEDS.find(c=>c.id===$("wo-country").value)||SEEDS[0]);});
  }
  function previewCountry(c) {
    return '<div class="wo-preview-flag">'+c.flag+'</div><div class="wo-preview-info"><strong>'+esc(c.name)+'</strong><span>'+esc(c.government)+' · '+esc(c.orientation)+'</span><p>'+esc(c.description)+'</p></div><div class="wo-preview-metrics"><span>Wirtschaft <b>'+c.economy+'</b></span><span>Stabilität <b>'+c.stability+'</b></span><span>Technologie <b>'+c.technology+'</b></span></div>';
  }
  function pageHead(kicker,title,desc,extra) {
    return '<div class="wo-page-head"><div><span class="wo-kicker">'+kicker+'</span><h1>'+title+'</h1><p>'+desc+'</p></div>'+(extra||"")+'</div>';
  }
  function panel(title,body,tag) {
    return '<section class="wo-panel"><div class="wo-panel-head"><h2>'+title+'</h2>'+(tag?'<span class="wo-tag">'+tag+'</span>':'')+'</div>'+body+'</section>';
  }
  function bar(label,value,color) {
    return '<div class="wo-bar-row"><div><span>'+label+'</span><strong>'+Math.round(value)+'/100</strong></div><div class="wo-bar"><i class="'+(color||"")+'" style="width:'+clamp(value,0,100)+'%"></i></div></div>';
  }
  function renderDashboard() {
    const p=state.player,c=playerCountry(),budgetTotal=Object.values(p.budget).reduce((a,b)=>a+b,0);
    const tradeIncome=p.tradePartners.length*8;
    const event=state.currentEvent
    let eventHtml=event?renderEvent(event):'<div class="wo-empty-event"><span class="wo-event-icon">✓</span><div><strong>Keine offene Krise</strong><p>Deine Regierung hat aktuell keine ungelöste Sonderlage. Die nächste internationale Entwicklung erscheint beim Monatswechsel.</p></div></div>';
    const recent=state.news.slice(0,4).map(n=>'<div class="wo-news-row"><span class="wo-news-dot '+esc(n.tone)+'"></span><div><strong>'+esc(n.title)+'</strong><p>'+esc(n.text)+'</p><small>'+esc(n.date)+'</small></div></div>').join("")||'<p class="wo-muted">Noch keine Nachrichten.</p>';
    return pageHead("REGIERUNGSZENTRALE","Guten Tag, Regierungschef.","Du führst "+esc(c.name)+". Deine Entscheidungen verändern die Lage im Land und die Beziehungen zur Welt.",'<button class="wo-btn primary" data-action="end-turn">Monat abschließen →</button>')+
      '<div class="wo-kpi-grid">'+
      '<div class="wo-kpi"><span>🏛️ Politische Stabilität</span><strong>'+Math.round(p.stability)+'%</strong><small>Institutionelle Lage</small></div>'+
      '<div class="wo-kpi"><span>📈 Wirtschaftskraft</span><strong>'+Math.round(p.economy)+'/100</strong><small>Wirtschaftlicher Entwicklungsstand</small></div>'+
      '<div class="wo-kpi"><span>🗳️ Parlamentsmehrheit</span><strong>'+Math.round(p.parliament)+'%</strong><small>Unterstützung deiner Regierung</small></div>'+
      '<div class="wo-kpi"><span>⚖️ Aktionspunkte</span><strong>'+p.actionPoints+'/3</strong><small>Politische Entscheidungen in diesem Monat</small></div></div>'+
      '<div class="wo-dashboard-grid"><div class="wo-main-column">'+
      panel("Aktuelle Lage",'<div class="wo-bars">'+bar("Regierungszustimmung",p.approval,"blue")+bar("Stabilität",p.stability,"green")+bar("Wirtschaft",p.economy,"gold")+bar("Technologie",p.technology,"purple")+'</div><div class="wo-inline-stats"><span>Bevölkerung <b>'+c.population+' Mio.</b></span><span>Militärischer Status <b>'+p.military+'/100</b></span><span>Nächste Wahl <b>in '+state.nextElection+' Monaten</b></span></div>')+
      panel("Aktuelle Lage der Welt",eventHtml,"MONAT "+state.turn)+
      panel("Neueste Nachrichten",recent,'<a data-view="news">Alle Nachrichten →</a>')+
      '</div><div class="wo-side-column">'+
      panel("Schnellzugriff",'<div class="wo-quick-actions"><button data-view="diplomacy">🤝 Diplomatie öffnen</button><button data-view="government">🏛️ Gesetze beraten</button><button data-view="economy">📊 Haushalt verwalten</button><button data-view="learning">📚 Lernmission starten</button></div>')+
      panel("Internationale Kontakte",'<div class="wo-contact-list">'+state.countries.filter(x=>x.id!==state.countryId).sort((a,b)=>relation(b.id)-relation(a.id)).slice(0,5).map(x=>'<div><span>'+x.flag+' '+esc(x.name)+'</span><b class="'+relationTone(relation(x.id))+'">'+(relation(x.id)>0?"+":"")+relation(x.id)+'</b></div>').join("")+'</div><button class="wo-btn ghost full" data-view="world">Alle Staaten ansehen</button>')+
      panel("Deine Lernbilanz",'<div class="wo-learning-mini"><strong>'+state.learningStats.known+'</strong><span>als gewusst bewertete Wiederholungen</span></div><p class="wo-muted">Wissen bringt Forschung und politischen Einfluss. Nutze deine StudySpace-Karten für echte Lernmissionen.</p><button class="wo-btn ghost full" data-view="learning">Weiterlernen</button>')+
      '</div></div>';
  }
  function renderEvent(event) {
    const target=event.targetId?countryById(event.targetId):null;
    return '<div class="wo-event-card"><div class="wo-event-top"><span class="wo-event-icon">⚠️</span><span class="wo-tag warning">ENTSCHEIDUNG ERFORDERLICH</span></div><h3>'+esc(event.title)+'</h3><p>'+esc(event.text)+'</p>'+(target?'<p class="wo-muted">Betroffener Staat: '+target.flag+' '+esc(target.name)+'</p>':'')+
      '<div class="wo-event-choices">'+event.choices.map(ch=>'<button data-action="event-choice" data-choice="'+ch.id+'"><strong>'+esc(ch.label)+'</strong><small>'+(ch.cost?money(ch.cost):"Keine direkten Kosten")+'</small></button>').join("")+'</div></div>';
  }
  function renderWorld() {
    const regions=[...new Set(state.countries.map(c=>c.region))];
    const groups=regions.map(region=>'<section class="wo-region"><h3>'+esc(region)+'</h3><div class="wo-country-grid">'+state.countries.filter(c=>c.region===region).map(c=>{
      const own=c.id===state.countryId, r=own?100:relation(c.id);
      return '<button class="wo-country-card '+(own?'own':'')+'" data-action="country-detail" data-country="'+c.id+'"><div class="wo-country-card-top"><span class="wo-flag">'+c.flag+'</span><span class="wo-tag">'+(own?'DEIN STAAT':esc(relationLabel(r)))+'</span></div><strong>'+esc(c.name)+'</strong><small>'+esc(c.capital)+' · '+esc(c.government)+'</small><div class="wo-country-mini"><span>Wirtschaft <b>'+c.economy+'</b></span><span>Stabilität <b>'+c.stability+'</b></span></div><div class="wo-country-strip"><i style="width:'+c.economy+'%"></i></div></button>';
    }).join("")+'</div></section>').join("");
    return pageHead("WELTKARTE","Die internationale Ordnung","Zwölf Staaten mit eigenen Interessen, Regierungen und wirtschaftlichen Ausgangslagen. Wähle einen Staat, um sein Profil zu öffnen.")+
      '<div class="wo-world-overview"><div><span>🌐</span><strong>'+state.countries.length+'</strong><small>Staaten in der Simulation</small></div><div><span>🤝</span><strong>'+state.player.tradePartners.length+'</strong><small>Aktive Handelsabkommen</small></div><div><span>🕊️</span><strong>'+state.player.alliances.length+'</strong><small>Partnerschaften</small></div><div><span>🏛️</span><strong>'+state.resolutions.filter(r=>r.passed).length+'</strong><small>Beschlossene Resolutionen</small></div></div>'+
      '<div class="wo-map-legend"><span><i class="own-dot"></i> Dein Staat</span><span><i class="ally-dot"></i> Enge Beziehung</span><span><i class="neutral-dot"></i> Neutrale Beziehung</span></div>'+groups+
      '<div id="wo-country-detail" class="wo-panel wo-detail-panel" hidden></div>';
  }
  function renderDiplomacy() {
    const others=state.countries.filter(c=>c.id!==state.countryId);
    const rows=others.slice().sort((a,b)=>relation(b.id)-relation(a.id)).map(c=>{
      const v=relation(c.id);
      return '<div class="wo-diplomacy-row"><div class="wo-dip-country"><span class="wo-flag">'+c.flag+'</span><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.orientation)+' · '+esc(c.region)+'</small></div></div><div class="wo-dip-rel"><strong class="'+relationTone(v)+'">'+(v>0?"+":"")+v+'</strong><span>'+esc(relationLabel(v))+'</span></div><button class="wo-btn small ghost" data-action="select-diplomacy" data-country="'+c.id+'">Verhandeln</button></div>';
    }).join("");
    return pageHead("AUSSENMINISTERIUM","Diplomatie & Beziehungen","Führe Gespräche, schließe Handelsabkommen und baue verlässliche Partnerschaften auf.")+
      '<div class="wo-diplomacy-layout"><div class="wo-panel"><div class="wo-panel-head"><h2>Staatenbeziehungen</h2><span class="wo-tag">'+others.length+' Partner</span></div><div class="wo-diplomacy-list">'+rows+'</div></div><div class="wo-panel" id="wo-diplomacy-form"><h2>Verhandlung vorbereiten</h2><p class="wo-muted">Wähle einen Staat in der Liste oder hier direkt aus.</p><label class="wo-field">Gesprächspartner<select id="wo-dip-country">'+others.map(c=>'<option value="'+c.id+'">'+c.flag+' '+esc(c.name)+'</option>').join("")+'</select></label><div id="wo-dip-profile">'+diplomacyProfile(others[0])+'</div><div class="wo-action-stack"><button class="wo-btn primary" data-action="diplomacy" data-kind="improve">🤝 Beziehungen verbessern · 50 € · 1 AP</button><button class="wo-btn" data-action="diplomacy" data-kind="trade">📦 Handelsabkommen · 70 € · 1 AP</button><button class="wo-btn" data-action="diplomacy" data-kind="alliance">🕊️ Partnerschaft vorschlagen · 80 € · 1 AP</button><button class="wo-btn" data-action="diplomacy" data-kind="summit">🏛️ Gipfeltreffen · 40 € · 1 AP</button></div><p class="wo-muted">Handelsabkommen bringen monatliche Einnahmen. Partnerschaften benötigen gute Beziehungen.</p></div></div>'+
      panel("Aktive Vereinbarungen",'<div class="wo-agreement-list">'+(state.player.tradePartners.length?state.player.tradePartners.map(id=>'<span class="wo-agreement">📦 '+esc(countryById(id)?.name||id)+' · Handel</span>').join(""):'<p class="wo-muted">Noch keine Handelsabkommen abgeschlossen.</p>')+(state.player.alliances.length?state.player.alliances.map(id=>'<span class="wo-agreement">🕊️ '+esc(countryById(id)?.name||id)+' · Partnerschaft</span>').join(""):'')+'</div>');
  }
  function diplomacyProfile(c) {
    if(!c)return '<p class="wo-muted">Kein Staat ausgewählt.</p>';
    const r=relation(c.id);
    return '<div class="wo-profile-box"><div class="wo-profile-flag">'+c.flag+'</div><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.capital)+' · '+esc(c.government)+'</small><p>'+esc(c.description)+'</p></div></div><div class="wo-rel-meter"><div><span>Beziehung</span><b class="'+relationTone(r)+'">'+(r>0?"+":"")+r+' / 100</b></div><div class="wo-bar"><i style="width:'+((r+100)/2)+'%"></i></div></div><div class="wo-profile-stats"><span>Wirtschaft <b>'+c.economy+'</b></span><span>Technologie <b>'+c.technology+'</b></span><span>Stabilität <b>'+c.stability+'</b></span></div>';
  }
  function renderEconomy() {
    const p=state.player,b=p.budget,total=Object.values(b).reduce((a,v)=>a+v,0),net=state.lastEconomy.net;
    const tradeNames=p.tradePartners.map(id=>countryById(id)?.name||id).join(", ")||"keine";
    return pageHead("FINANZMINISTERIUM","Wirtschaft & Haushalt","Steuereinnahmen, staatliche Investitionen und internationale Handelsbeziehungen bestimmen deinen finanziellen Spielraum.")+
      '<div class="wo-economy-kpis"><div><span>Staatskasse</span><strong>'+money(p.treasury)+'</strong></div><div><span>Monatliche Bilanz</span><strong class="'+(net>=0?'positive':'negative')+'">'+(net>=0?"+":"")+money(net)+'</strong></div><div><span>Steuersatz</span><strong>'+p.tax+'%</strong></div><div><span>Handelspartner</span><strong>'+p.tradePartners.length+'</strong></div></div>'+
      '<div class="wo-two-col">'+
      '<section class="wo-panel"><h2>Steuerpolitik</h2><p class="wo-muted">Höhere Steuern erhöhen zunächst die Einnahmen, können aber Zustimmung und Investitionsbereitschaft belasten.</p><form id="wo-tax-form"><label class="wo-field">Allgemeiner Steuersatz <strong id="wo-tax-value">'+p.tax+'%</strong><input type="range" min="10" max="40" step="1" id="wo-tax" value="'+p.tax+'"></label><div class="wo-range-labels"><span>10% niedrig</span><span>40% hoch</span></div><button class="wo-btn primary" type="submit">Steuersatz ändern · 1 AP</button></form></section>'+
      '<section class="wo-panel"><h2>Monatsbilanz</h2><div class="wo-budget-summary"><div><span>Einnahmen</span><strong class="positive">+'+money(state.lastEconomy.income)+'</strong></div><div><span>Ausgaben</span><strong class="negative">−'+money(state.lastEconomy.expenses)+'</strong></div><div><span>Netto</span><strong>'+(net>=0?"+":"")+money(net)+'</strong></div></div><p class="wo-muted">Deine nächste Haushaltsabrechnung erfolgt beim Monatswechsel.</p></section></div>'+
      '<section class="wo-panel"><div class="wo-panel-head"><h2>Staatshaushalt verteilen</h2><span class="wo-tag '+(total===100?'positive':'warning')+'">'+total+'/100 Budgetpunkte</span></div><p class="wo-muted">Verteile 100 Punkte auf sechs Bereiche. Mehr Investitionen können langfristig Wirkung entfalten, reduzieren aber den finanziellen Spielraum.</p><form id="wo-budget-form"><div class="wo-budget-grid">'+Object.entries({education:"Bildung",health:"Gesundheit",infrastructure:"Infrastruktur",defense:"Sicherheit",diplomacy:"Diplomatie",reserves:"Reserven"}).map(([k,v])=>'<label class="wo-budget-row"><span>'+v+'</span><strong><output id="out-'+k+'">'+b[k]+'</output></strong><input type="range" min="0" max="50" step="1" name="'+k+'" value="'+b[k]+'"></label>').join("")+'</div><div class="wo-form-footer"><span id="wo-budget-total">Gesamt: '+total+'/100</span><button class="wo-btn primary" type="submit">Haushalt beschließen · 1 AP</button></div></form></section>'+
      panel("Handel und wirtschaftliche Verflechtung",'<p>Aktive Handelspartner: <strong>'+esc(tradeNames)+'</strong></p><p class="wo-muted">Jedes Handelsabkommen erhöht die monatlichen Einnahmen und verbessert die Beziehungen. Einseitige Abhängigkeiten können durch mehrere Partner reduziert werden.</p><button class="wo-btn ghost" data-view="diplomacy">Handelsabkommen verhandeln</button>');
  }
  function renderGovernment() {
    const p=state.player;
    const lawCards=LAWS.map(l=>{
      const done=p.laws.includes(l.id);
      return '<article class="wo-law-card '+(done?'passed':'')+'"><div class="wo-law-top"><span class="wo-tag">'+esc(l.tag)+'</span><span class="wo-cost">'+money(l.cost)+'</span></div><h3>'+esc(l.name)+'</h3><p>'+esc(l.description)+'</p><div class="wo-law-effects">'+Object.entries(l.effects).map(([k,v])=>'<span>'+(v>0?"+":"")+v+' '+({technology:"Technik",economy:"Wirtschaft",approval:"Zustimmung",stability:"Stabilität",influence:"Einfluss",research:"Forschung"}[k]||k)+'</span>').join("")+'</div><button class="wo-btn '+(done?'ghost':'primary')+'" data-action="law" data-law="'+l.id+'" '+(done?'disabled':'')+'>'+(done?'✓ Verabschiedet':'Abstimmen · 1 AP')+'</button></article>';
    }).join("");
    const ministerSlots=[["foreign","Außenpolitik"],["economy","Wirtschaft"],["education","Bildung"],["finance","Finanzen"],["social","Soziales"],["environment","Umwelt"]];
    const ministerHtml=ministerSlots.map(([key,label])=>{
      const current=p.ministers[key],candidate=MINISTERS.find(m=>m.id===current);
      return '<div class="wo-minister-row"><div><strong>'+label+'</strong><small>'+(candidate?candidate.name+" · "+candidate.bonus:"Noch nicht besetzt")+'</small></div><select data-minister-slot="'+key+'"><option value="">Minister auswählen</option>'+MINISTERS.filter(m=>m.field===key).concat(MINISTERS.filter(m=>m.field!==key)).map(m=>'<option value="'+m.id+'" '+(current===m.id?'selected':'')+'>'+m.name+' – '+m.role+'</option>').join("")+'</select><button class="wo-btn small" data-action="appoint" data-slot="'+key+'">Ernennen</button></div>';
    }).join("");
    return pageHead("REGIERUNG & PARLAMENT","Innenpolitik","Verabschiede Gesetze, sichere Mehrheiten und stelle ein Kabinett zusammen. Nicht jede Reform findet im Parlament Zustimmung.")+
      '<div class="wo-government-summary"><div><span>Regierungszustimmung</span><strong>'+Math.round(p.approval)+'%</strong></div><div><span>Parlamentsunterstützung</span><strong>'+Math.round(p.parliament)+'%</strong></div><div><span>Wahl in</span><strong>'+state.nextElection+' Monaten</strong></div></div>'+
      '<div class="wo-two-col"><section class="wo-panel"><h2>Parlament</h2><p class="wo-muted">Die Unterstützung deiner Regierung beeinflusst, ob Reformen eine Mehrheit erhalten.</p>'+bar("Unterstützung im Parlament",p.parliament,"blue")+bar("Zustimmung in der Bevölkerung",p.approval,"green")+'<div class="wo-parliament-note">'+(p.parliament>=55?"Deine Regierung verfügt über eine belastbare Arbeitsmehrheit.":p.parliament>=45?"Du brauchst für wichtige Vorhaben zusätzliche Stimmen.":"Deine Regierung ist auf Kompromisse angewiesen.")+'</div></section><section class="wo-panel"><h2>Kabinett</h2><p class="wo-muted">Ernenne Fachleute für zentrale Ressorts. Ein Minister kann nur ein Ressort gleichzeitig führen.</p><div class="wo-ministers">'+ministerHtml+'</div></section></div>'+
      '<section class="wo-panel"><div class="wo-panel-head"><h2>Gesetzesvorhaben</h2><span class="wo-tag">'+p.laws.length+' verabschiedet</span></div><p class="wo-muted">Jedes Gesetz kostet Zeit und Geld. Effekte treten direkt ein; einige verändern die Entwicklung deines Staates über mehrere Monate.</p><div class="wo-law-grid">'+lawCards+'</div></section>';
  }
  function renderOrganizations() {
    const org=state.player.memberships.includes("world-forum");
    const past=state.resolutions.slice(0,5).map(r=>'<div class="wo-resolution-row"><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.date)+' · '+r.yes+' von 12 Stimmen</small></div><span class="wo-tag '+(r.passed?'positive':'negative')+'">'+(r.passed?'Angenommen':'Abgelehnt')+'</span></div>').join("")||'<p class="wo-muted">Noch keine Resolutionen beschlossen.</p>';
    return pageHead("MULTILATERALE POLITIK","Weltforum","Arbeite mit anderen Staaten an gemeinsamen Regeln. Du kannst Resolutionen vorschlagen und internationale Mehrheiten organisieren.")+
      '<div class="wo-org-hero"><div><span class="wo-org-symbol">🌐</span><div><span class="wo-kicker">INTERNATIONALE ORGANISATION</span><h2>Forum der Staaten (FDS)</h2><p>Eine fiktive multilaterale Organisation für Handel, Forschung, humanitäre Zusammenarbeit und gemeinsame Standards.</p></div></div><div class="wo-org-stats"><span>Mitglieder <b>12</b></span><span>Dein Einfluss <b>'+Math.round(state.player.influence)+'</b></span><span>Beschlüsse <b>'+state.resolutions.filter(r=>r.passed).length+'</b></span></div></div>'+
      '<div class="wo-two-col"><section class="wo-panel"><h2>Resolution einbringen</h2><p class="wo-muted">Eine Resolution benötigt Unterstützung mehrerer Staaten. Gute Beziehungen helfen, garantieren aber keine Zustimmung.</p><form id="wo-resolution-form"><label class="wo-field">Thema<select id="wo-resolution"><option value="research">Internationaler Forschungsverbund</option><option value="trade">Transparente Handelsstandards</option><option value="climate">Gemeinsamer Klimaschutzfonds</option><option value="education">Bildungs- und Austauschprogramm</option><option value="humanitarian">Humanitäre Koordination</option></select></label><button class="wo-btn primary" type="submit">Resolution einbringen · 1 AP · 12 Einfluss</button></form></section><section class="wo-panel"><h2>Dein Verhandlungsspielraum</h2>'+bar("Diplomatischer Einfluss",state.player.influence,"gold")+'<p class="wo-muted">Die Stimmen der anderen Staaten werden anhand ihrer Beziehungen, Interessen und Stabilität simuliert.</p><button class="wo-btn ghost" data-view="diplomacy">Beziehungen verbessern</button></section></div>'+
      panel("Bisherige Resolutionen",past);
  }
  function getLearningItems() {
    const items=[];
    try {
      const app=JSON.parse(localStorage.getItem("studyspaceData")||"{}");
      (Array.isArray(app.flashcards)?app.flashcards:[]).forEach(card=>{
        if(card.question&&card.answer) items.push({id:"card:"+card.id,rawId:card.id,q:card.question,a:card.answer,subject:(app.subjects||[]).find(s=>s.id===card.subjectId)?.name||"Karteikarten",source:"StudySpace-Karteikarten",due:card.studySchedule?.dueDate||"",kind:"card"});
      });
    } catch(error) { console.warn("Karteikarten konnten nicht gelesen werden.",error); }
    try {
      const knowledge=JSON.parse(localStorage.getItem("studyspaceKnowledgeV1")||"{}");
      (Array.isArray(knowledge.entries)?knowledge.entries:[]).forEach(item=>{
        if(item.question&&item.answer) items.push({id:"knowledge:"+item.id,rawId:item.id,q:item.question,a:item.answer,subject:item.title||"Wissen & Regeln",source:"Wissen & Regeln",due:item.nextReview?new Date(item.nextReview).toISOString().slice(0,10):"",kind:"knowledge",example:item.example||""});
      });
    } catch(error) { console.warn("Wissen & Regeln konnten nicht gelesen werden.",error); }
    if(!items.length) BUILTIN_QUESTIONS.forEach(item=>items.push({...item,kind:"builtin",source:"WORLD ORDER · Weltwissen"}));
    return items;
  }
  function renderLearning() {
    const items=getLearningItems(),cards=items.filter(x=>x.kind==="card").length,knowledge=items.filter(x=>x.kind==="knowledge").length;
    const current=quiz.items[quiz.index];
    let quizHtml;
    if(current) {
      quizHtml='<div class="wo-quiz-head"><span class="wo-tag">'+esc(current.source)+'</span><span>Frage '+(quiz.index+1)+' von '+quiz.items.length+'</span></div><h3 class="wo-question">'+esc(current.q)+'</h3><p class="wo-muted">'+esc(current.subject||"Allgemein")+'</p>'+
        (quiz.revealed?'<div class="wo-answer"><strong>Antwort</strong><p>'+esc(current.a)+'</p>'+(current.example?'<p class="wo-muted">Beispiel: '+esc(current.example)+'</p>':'')+'</div>':'<button class="wo-btn primary" data-action="reveal">Antwort anzeigen</button>')+
        (quiz.revealed?'<div class="wo-grade"><p>Wie sicher konntest du die Antwort wiedergeben?</p><button class="wo-btn primary" data-action="grade" data-result="known">✓ Gewusst</button><button class="wo-btn" data-action="grade" data-result="unsure">↻ Noch unsicher</button></div>':'');
    } else {
      quizHtml='<div class="wo-learn-empty"><span>📚</span><h3>Deine nächste Lernmission</h3><p>Starte eine kurze Wiederholung. WORLD ORDER bevorzugt vorhandene Karteikarten und Einträge aus Wissen & Regeln.</p><button class="wo-btn primary" data-action="start-quiz">Lernmission starten</button></div>';
    }
    return pageHead("WISSEN WIRD EINFLUSS","Lernakademie","Wiederhole deine StudySpace-Inhalte direkt im Spiel. Gewusste Antworten bringen Forschungspunkte und diplomatischen Einfluss.")+
      '<div class="wo-learning-stats"><div><strong>'+state.learningStats.answered+'</strong><span>beantwortete Fragen</span></div><div><strong>'+state.learningStats.known+'</strong><span>gewusst</span></div><div><strong>'+state.player.research+'</strong><span>Forschungspunkte</span></div><div><strong>'+state.learningStats.researchEarned+'</strong><span>durch Lernen verdient</span></div></div>'+
      '<div class="wo-learning-layout"><section class="wo-panel wo-quiz-panel"><div class="wo-panel-head"><h2>Deine Lernmission</h2><span class="wo-tag positive">Lernen zahlt sich aus</span></div>'+quizHtml+'</section><section class="wo-panel"><h2>Deine StudySpace-Sammlung</h2><div class="wo-source-stat"><span>▣ Karteikarten</span><strong>'+cards+'</strong></div><div class="wo-source-stat"><span>∑ Wissen & Regeln</span><strong>'+knowledge+'</strong></div><div class="wo-source-stat"><span>📁 Materialeinträge</span><strong>'+getMaterialCount()+'</strong></div><button class="wo-btn ghost full" data-action="start-material-quiz">Aus Hefter-OCR lernen</button><p class="wo-muted">Liest den erkannten Text deiner hochgeladenen Hefter aus dem StudySpace-Dateispeicher.</p><p class="wo-muted">Deine Karten und Wissenseinträge werden direkt aus deinem StudySpace-Speicher gelesen. Es werden keine Schuldateien verändert.</p><div class="wo-learning-links"><button class="wo-btn ghost" data-action="open-studyspace" data-target="flashcards">Karteikarten öffnen ↗</button><button class="wo-btn ghost" data-action="open-studyspace" data-target="knowledge">Wissen & Regeln öffnen ↗</button></div></section></div>'+
      '<div class="wo-learning-note"><strong>So funktioniert die Verbindung:</strong> Deine eigenen Lernfragen werden zuerst verwendet. Bei einer richtigen Wiederholung erhältst du +3 Forschung und +1 Einfluss. Bei einer unsicheren Antwort erhältst du +1 Forschung als Lernanreiz. Dieselbe Karte kann in einem späteren Spielmonat erneut belohnt werden.</div>';
  }
  function getMaterialCount() {
    try { const app=JSON.parse(localStorage.getItem("studyspaceData")||"{}");return Array.isArray(app.materials)?app.materials.length:0; } catch { return 0; }
  }

  function migrateExtendedState(data) {
    data.society=data.society||{happiness:64,inequality:42,freedom:72,mediaTrust:61,environment:55,employment:91};
    data.policies=data.policies||{welfare:50,freedom:65,green:45,industry:55,education:60};
    data.trade=data.trade||{imports:[],exports:[],agreements:[]};data.trade.agreements=data.trade.agreements||[];
    data.researchTree=data.researchTree||{unlocked:["basic-research"],completed:[]};
    data.researchTree.unlocked=data.researchTree.unlocked||["basic-research"];data.researchTree.completed=data.researchTree.completed||[];
    data.projects=data.projects||[];data.climate=data.climate||{emissions:52,renewables:38,adaptation:30};
    data.politics=data.politics||{parties:[{id:"civic",name:"Bürgerforum",ideology:"sozialliberal",support:31,government:true},{id:"conservative",name:"Konservative Allianz",ideology:"konservativ",support:24},{id:"social",name:"Soziale Gerechtigkeit",ideology:"sozialdemokratisch",support:19},{id:"green",name:"Zukunft & Klima",ideology:"ökologisch",support:15},{id:"liberal",name:"Freiheitspartei",ideology:"liberal",support:11}],campaigns:0,lastElection:null,coalition:["civic"],mandate:data.player.parliament||56};
    data.politics.parties=data.politics.parties||[];data.politics.coalition=data.politics.coalition||["civic"];data.politics.campaigns=data.politics.campaigns||0;
    data.player.relationships=data.player.relationships||{};data.player.tradePartners=data.player.tradePartners||[];
  }
  const TECHS=[
    {id:"basic-research",name:"Grundlagenforschung",cost:0,desc:"Basis für wissenschaftliche Entwicklung.",effect:"Starttechnologie"},
    {id:"clean-energy",name:"Erneuerbare Energien",cost:12,requires:"basic-research",desc:"Saubere Energie und geringere Emissionen.",effect:"+8 Umwelt, +4 Technologie"},
    {id:"digital-state",name:"Digitaler Staat",cost:12,requires:"basic-research",desc:"Digitale Verwaltung und bessere öffentliche Dienste.",effect:"+7 Technologie, +3 Zustimmung"},
    {id:"medical",name:"Medizinische Innovation",cost:14,requires:"basic-research",desc:"Gesundheit und gesellschaftliche Resilienz.",effect:"+7 Stabilität, +4 Zufriedenheit"},
    {id:"advanced-industry",name:"Industrie 4.0",cost:25,requires:"digital-state",desc:"Produktivere, wissensintensive Industrie.",effect:"+8 Wirtschaft, +5 Technologie"},
    {id:"climate-adapt",name:"Klimaanpassung",cost:24,requires:"clean-energy",desc:"Schützt Infrastruktur und Bevölkerung.",effect:"+10 Anpassung, +4 Umwelt"},
    {id:"education-network",name:"Internationales Bildungsnetz",cost:22,requires:"medical",desc:"Austausch und Humankapital.",effect:"+8 Forschung, +5 Einfluss"}
  ];
  const PROJECTS=[
    {id:"rail",name:"Transkontinentale Bahn",cost:180,turns:5,desc:"Verbindet wichtige Wirtschaftsregionen.",effect:"economy"},
    {id:"university",name:"Forschungsuniversität",cost:150,turns:4,desc:"Stärkt Bildung und Innovation.",effect:"technology"},
    {id:"grid",name:"Modernes Stromnetz",cost:200,turns:6,desc:"Erleichtert den Ausbau erneuerbarer Energien.",effect:"climate"},
    {id:"housing",name:"Bezahlbares Wohnen",cost:130,turns:4,desc:"Stärkt Zusammenhalt und Lebensqualität.",effect:"society"}
  ];
  function renderAtlas(){
    const regions=[...new Set(state.countries.map(c=>c.region))],coords={"Nördlicher Kontinent":[1,1],"Westlicher Kontinent":[0,2],"Mittlerer Kontinent":[2,2],"Östlicher Kontinent":[3,1],"Südlicher Kontinent":[2,3]};
    const blocks=regions.map(region=>'<section class="wo-atlas-region" style="grid-column:'+(coords[region][0]+1)+';grid-row:'+(coords[region][1]+1)+'"><h3>'+esc(region)+'</h3>'+state.countries.filter(c=>c.region===region).map(c=>'<button class="wo-atlas-country '+(c.id===state.countryId?'own':'')+'" data-action="country-detail" data-country="'+c.id+'"><span>'+c.flag+'</span><b>'+esc(c.name)+'</b><small>'+esc(c.capital)+'</small><i style="width:'+c.economy+'%"></i></button>').join("")+'</section>').join("");
    return pageHead("GEOPOLITISCHE ÜBERSICHT","Weltatlas","Schematische Übersicht der fünf Weltregionen. Wähle Staaten für Profile und diplomatische Aktionen.")+'<div class="wo-atlas-legend"><span>Dein Staat ist hervorgehoben</span><span>12 simulierte Staaten</span><span>Balken = Wirtschaftsindex</span></div><div class="wo-atlas-grid">'+blocks+'</div><div id="wo-country-detail" class="wo-panel wo-detail-panel" hidden></div>';
  }
  function renderSociety(){
    const s=state.society, opts=[["welfare","Sozialleistungen ausbauen","65 € · Zufriedenheit und Stabilität"],["press","Pressefreiheit schützen","45 € · Freiheit und Medienvertrauen"],["jobs","Beschäftigungsprogramm","70 € · Beschäftigung und Zustimmung"],["anti-corruption","Transparenzpaket","55 € · Vertrauen und Institutionen"]];
    return pageHead("INNENPOLITIK","Gesellschaft & Medien","Lebensqualität, Freiheit, Vertrauen und Beschäftigung beeinflussen die Stabilität deiner Regierung.")+
      '<div class="wo-kpi-grid"><div class="wo-kpi"><span>😊 Zufriedenheit</span><strong>'+Math.round(s.happiness)+'/100</strong></div><div class="wo-kpi"><span>🗞️ Medienvertrauen</span><strong>'+Math.round(s.mediaTrust)+'/100</strong></div><div class="wo-kpi"><span>🕊️ Freiheit</span><strong>'+Math.round(s.freedom)+'/100</strong></div><div class="wo-kpi"><span>💼 Beschäftigung</span><strong>'+Math.round(s.employment)+'/100</strong></div></div>'+
      '<div class="wo-two-col"><section class="wo-panel"><h2>Gesellschaftliche Lage</h2>'+bar("Zufriedenheit",s.happiness)+bar("Medienvertrauen",s.mediaTrust)+bar("Freiheit und Rechte",s.freedom)+bar("Beschäftigung",s.employment)+bar("Gleichheit",100-s.inequality)+bar("Umweltqualität",s.environment)+'</section><section class="wo-panel"><h2>Politische Maßnahmen</h2>'+opts.map(o=>'<div class="wo-policy-row"><div><b>'+o[1]+'</b><small>'+o[2]+'</small></div><button class="wo-btn small" data-action="society-policy" data-policy="'+o[0]+'">Umsetzen</button></div>').join("")+'</section></div>'+
      '<div class="wo-panel"><h2>Politische Zielkonflikte</h2><p class="wo-muted">Sicherheit, Freiheit, soziale Gerechtigkeit und wirtschaftliche Dynamik können miteinander konkurrieren. Zustimmung allein ist kein vollständiger Maßstab für eine stabile Demokratie.</p></div>';
  }
  function renderTrade(){
    const c=state.climate,s=state.society,deals=state.trade.agreements||[],partners=state.countries.filter(x=>x.id!==state.countryId);
    return pageHead("WIRTSCHAFT & NACHHALTIGKEIT","Handel & Klima","Verhandle Wirtschaftsbeziehungen, verringere Abhängigkeiten und gestalte den ökologischen Umbau.")+
      '<div class="wo-kpi-grid"><div class="wo-kpi"><span>🤝 Handelspartner</span><strong>'+deals.length+'</strong></div><div class="wo-kpi"><span>🌱 Erneuerbare</span><strong>'+c.renewables+'%</strong></div><div class="wo-kpi"><span>🏭 Emissionen</span><strong>'+c.emissions+'</strong></div><div class="wo-kpi"><span>🛡️ Anpassung</span><strong>'+c.adaptation+'</strong></div></div>'+
      '<div class="wo-two-col"><section class="wo-panel"><h2>Handelsabkommen</h2><p class="wo-muted">Ein Abkommen kostet 70 € und verbessert schrittweise die Wirtschaftsbeziehungen.</p><form id="wo-trade-form"><label class="wo-field">Partnerstaat<select id="wo-trade-country">'+partners.map(x=>'<option value="'+x.id+'">'+x.flag+' '+esc(x.name)+'</option>').join("")+'</select></label><button class="wo-btn primary" type="submit">Abkommen aushandeln · 70 €</button></form><div class="wo-list-spaced">'+(deals.map(id=>{const x=countryById(id);return '<div class="wo-policy-row"><b>'+(x?x.flag+' '+esc(x.name):esc(id))+'</b><span class="wo-tag positive">Aktiv</span></div>';}).join("")||'<p class="wo-muted">Noch keine zusätzlichen Abkommen.</p>')+'</div></section><section class="wo-panel"><h2>Klimapolitik</h2>'+bar("Erneuerbare Energien",c.renewables)+bar("Klimaanpassung",c.adaptation)+bar("Umweltqualität",s.environment)+bar("Emissionen (niedrig ist besser)",100-c.emissions)+
      '<div class="wo-policy-row"><div><b>Erneuerbaren-Offensive</b><small>100 € · saubere Energie</small></div><button class="wo-btn small" data-action="climate-policy" data-policy="renewables">Starten</button></div><div class="wo-policy-row"><div><b>Klimaanpassungsfonds</b><small>80 € · Schutz vor Klimafolgen</small></div><button class="wo-btn small" data-action="climate-policy" data-policy="adaptation">Starten</button></div><div class="wo-policy-row"><div><b>Emissionsstandards</b><small>55 € · weniger Emissionen</small></div><button class="wo-btn small" data-action="climate-policy" data-policy="standards">Einführen</button></div></section></div>';
  }
  function renderResearch(){
    const tree=state.researchTree;
    return pageHead("INNOVATION & BILDUNG","Forschung & Projekte","Investiere Forschungspunkte in Technologien und starte langfristige nationale Vorhaben.")+
      '<div class="wo-kpi-grid"><div class="wo-kpi"><span>🔬 Forschungspunkte</span><strong>'+Math.round(state.player.research)+'</strong></div><div class="wo-kpi"><span>Technologien</span><strong>'+tree.completed.length+'/'+(TECHS.length-1)+'</strong></div><div class="wo-kpi"><span>🏗️ Projekte</span><strong>'+state.projects.length+'</strong></div><div class="wo-kpi"><span>💡 Technologieindex</span><strong>'+Math.round(state.player.technology)+'</strong></div></div>'+
      '<section class="wo-panel"><h2>Technologiebaum</h2><div class="wo-tech-grid">'+TECHS.filter(t=>t.id!=="basic-research").map(t=>{const done=tree.completed.includes(t.id),ready=tree.unlocked.includes(t.id)||tree.unlocked.includes(t.requires)||tree.completed.includes(t.requires);return '<article class="wo-tech-card '+(done?'done':'')+'"><span class="wo-tag">'+(done?'Abgeschlossen':ready?'Verfügbar':'Voraussetzung fehlt')+'</span><h3>'+esc(t.name)+'</h3><p>'+esc(t.desc)+'</p><small>'+esc(t.effect)+' · '+t.cost+' Forschung</small><button class="wo-btn small '+(done?'ghost':'primary')+'" data-action="research" data-tech="'+t.id+'" '+(done||!ready?'disabled':'')+'>'+(done?'Erforscht':'Erforschen')+'</button></article>';}).join("")+'</div></section>'+
      '<section class="wo-panel"><h2>Nationale Großprojekte</h2><form id="wo-project-form" class="wo-inline-form"><select id="wo-project-select">'+PROJECTS.map(p=>'<option value="'+p.id+'">'+esc(p.name)+' · '+p.cost+' € · '+p.turns+' Monate</option>').join("")+'</select><button class="wo-btn primary" type="submit">Projekt starten</button></form><div class="wo-list-spaced">'+(state.projects.map(p=>'<div class="wo-policy-row"><div><b>'+esc(p.name)+'</b><small>Fortschritt: '+p.progress+'/'+p.turns+' Monate</small></div><span class="wo-tag">'+Math.round(p.progress/p.turns*100)+'%</span></div>').join("")||'<p class="wo-muted">Noch keine Großprojekte gestartet.</p>')+'</div></section>';
  }
  function applySocietyPolicy(policy){
    const p=state.player,s=state.society,costs={welfare:65,press:45,jobs:70,"anti-corruption":55},cost=costs[policy];if(!cost)return;
    if(!spendAP(1))return;if(p.treasury<cost){p.actionPoints++;notify("Nicht genügend Geld.");return;}p.treasury-=cost;
    if(policy==="welfare"){s.happiness=clamp(s.happiness+7,0,100);s.inequality=clamp(s.inequality-4,0,100);p.stability=clamp(p.stability+2,0,100);}
    if(policy==="press"){s.freedom=clamp(s.freedom+8,0,100);s.mediaTrust=clamp(s.mediaTrust+5,0,100);}
    if(policy==="jobs"){s.employment=clamp(s.employment+6,0,100);p.approval=clamp(p.approval+3,0,100);p.economy=clamp(p.economy+1,0,100);}
    if(policy==="anti-corruption"){s.mediaTrust=clamp(s.mediaTrust+7,0,100);p.parliament=clamp(p.parliament+2,0,100);s.freedom=clamp(s.freedom+2,0,100);}
    addNews("Gesellschaftspolitische Reform","Eine neue gesellschaftspolitische Maßnahme wurde beschlossen.","success");saveGame();render();
  }
  function applyClimatePolicy(policy){
    const p=state.player,c=state.climate,s=state.society,costs={renewables:100,adaptation:80,standards:55},cost=costs[policy];if(!cost)return;
    if(!spendAP(1))return;if(p.treasury<cost){p.actionPoints++;notify("Nicht genügend Geld.");return;}p.treasury-=cost;
    if(policy==="renewables"){c.renewables=clamp(c.renewables+9,0,100);c.emissions=clamp(c.emissions-5,0,100);p.technology=clamp(p.technology+1,0,100);}
    if(policy==="adaptation"){c.adaptation=clamp(c.adaptation+12,0,100);s.environment=clamp(s.environment+2,0,100);}
    if(policy==="standards"){c.emissions=clamp(c.emissions-7,0,100);s.environment=clamp(s.environment+5,0,100);p.approval=clamp(p.approval-1,0,100);}
    addNews("Klimapolitische Entscheidung","Eine Maßnahme für Klimaschutz oder Anpassung wurde beschlossen.","success");saveGame();render();
  }
  function makeTradeDeal(id){
    const c=countryById(id);if(!c||id===state.countryId)return;if(state.trade.agreements.includes(id)){notify("Es besteht bereits ein Abkommen.");return;}
    if(state.player.treasury<70){notify("Nicht genügend Geld.");return;}if(!spendAP(1))return;
    state.player.treasury-=70;state.trade.agreements.push(id);if(!state.player.tradePartners.includes(id))state.player.tradePartners.push(id);state.player.relationships[id]=clamp(relation(id)+8,-100,100);
    addNews("Neues Handelsabkommen","Mit "+c.name+" wurde ein Handelsabkommen geschlossen.","success");saveGame();render();
  }
  function unlockResearch(id){
    const t=TECHS.find(x=>x.id===id);if(!t||state.researchTree.completed.includes(id))return;
    if(!state.researchTree.unlocked.includes(t.requires)&&!state.researchTree.completed.includes(t.requires)){notify("Die notwendige Vorstufe fehlt.");return;}
    if(state.player.research<t.cost){notify("Dir fehlen Forschungspunkte.");return;}if(!spendAP(1))return;
    state.player.research-=t.cost;state.researchTree.completed.push(id);state.researchTree.unlocked.push(id);
    const p=state.player,s=state.society,c=state.climate;
    if(id==="clean-energy"){s.environment=clamp(s.environment+8,0,100);p.technology=clamp(p.technology+4,0,100);}
    if(id==="digital-state"){p.technology=clamp(p.technology+7,0,100);p.approval=clamp(p.approval+3,0,100);}
    if(id==="medical"){p.stability=clamp(p.stability+7,0,100);s.happiness=clamp(s.happiness+4,0,100);}
    if(id==="advanced-industry"){p.economy=clamp(p.economy+8,0,100);p.technology=clamp(p.technology+5,0,100);}
    if(id==="climate-adapt"){c.adaptation=clamp(c.adaptation+10,0,100);s.environment=clamp(s.environment+4,0,100);}
    if(id==="education-network"){p.research=clamp(p.research+8,0,100);p.influence=clamp(p.influence+5,0,100);}
    addNews("Forschungserfolg: "+t.name,"Eine neue Technologie wurde entwickelt.","success");saveGame();render();
  }
  function startProject(id){
    const t=PROJECTS.find(x=>x.id===id);if(!t)return;if(state.projects.some(x=>x.id===id)){notify("Dieses Projekt läuft bereits oder wurde bereits umgesetzt.");return;}
    if(state.player.treasury<t.cost){notify("Nicht genügend Geld.");return;}if(!spendAP(1))return;state.player.treasury-=t.cost;state.projects.push({...t,progress:0});addNews("Großprojekt begonnen",t.name+" wurde auf den Weg gebracht.","success");saveGame();render();
  }
  function runForeignOffice(id,move){
    const c=countryById(id),costs={visit:35,aid:90,sanction:50};if(!c||!costs[move])return;
    if(state.player.treasury<costs[move]){notify("Nicht genügend Geld.");return;}if(!spendAP(1))return;state.player.treasury-=costs[move];
    if(move==="visit")state.player.relationships[id]=clamp(relation(id)+9,-100,100);
    if(move==="aid"){state.player.relationships[id]=clamp(relation(id)+12,-100,100);c.stability=clamp(c.stability+3,0,100);}
    if(move==="sanction"){state.player.relationships[id]=clamp(relation(id)-14,-100,100);c.economy=clamp(c.economy-2,0,100);state.player.influence=clamp(state.player.influence+1,0,100);}
    addNews("Außenpolitische Initiative",({visit:"Ein Staatsbesuch stärkt den direkten Gesprächskanal.",aid:"Ein Hilfspaket unterstützt die Stabilität des Partnerstaats.",sanction:"Gezielte Sanktionen erhöhen den politischen Druck, verschlechtern aber Beziehungen."})[move],"neutral");saveGame();render();
  }
  function advanceExtendedWorld(){
    const s=state.society,c=state.climate,p=state.player;
    s.happiness=clamp(s.happiness+(p.approval-55)*.025+(p.stability-60)*.015,0,100);s.mediaTrust=clamp(s.mediaTrust+(s.freedom-60)*.012,0,100);
    s.employment=clamp(s.employment+(p.economy-65)*.012,0,100);s.environment=clamp(s.environment+(c.renewables-40)*.012-(c.emissions-45)*.008,0,100);
    state.projects.forEach(project=>{project.progress++;if(project.progress>=project.turns){if(project.effect==="economy")p.economy=clamp(p.economy+6,0,100);if(project.effect==="technology")p.technology=clamp(p.technology+7,0,100);if(project.effect==="climate"){c.renewables=clamp(c.renewables+10,0,100);c.emissions=clamp(c.emissions-6,0,100);}if(project.effect==="society"){s.happiness=clamp(s.happiness+8,0,100);s.inequality=clamp(s.inequality-5,0,100);}addNews("Großprojekt abgeschlossen",project.name+" entfaltet nun seine Wirkung.","success");}});
    state.projects=state.projects.filter(x=>x.progress<x.turns);
    state.countries.filter(x=>x.id!==state.countryId).forEach(country=>{const roll=Math.random();if(roll<.13){country.economy=clamp(country.economy+(Math.random()*3-1),0,100);country.stability=clamp(country.stability+(Math.random()*2-1),0,100);}if(roll<.035){const delta=Math.random()<.5?-1:1;state.player.relationships[country.id]=clamp(relation(country.id)+delta*4,-100,100);country.lastAction=delta>0?"Diplomatische Annäherung":"Politische Spannungen";addNews("Internationale Entwicklung: "+country.name,country.name+" verändert seinen außenpolitischen Kurs: "+country.lastAction+".","neutral");}});
    if(Math.random()<.12){const country=state.countries.filter(x=>x.id!==state.countryId).sort((a,b)=>a.stability-b.stability)[0];addNews("Internationale Lage","In "+country.name+" sorgen innenpolitische Entwicklungen für Unsicherheit.","warning");}
  }

  function politicalDefaultParties(){
    return [
      {id:"civic",name:"Bürgerforum",ideology:"sozialliberal",support:31,government:true},
      {id:"conservative",name:"Konservative Allianz",ideology:"konservativ",support:24},
      {id:"social",name:"Soziale Gerechtigkeit",ideology:"sozialdemokratisch",support:19},
      {id:"green",name:"Zukunft & Klima",ideology:"ökologisch",support:15},
      {id:"liberal",name:"Freiheitspartei",ideology:"liberal",support:11}
    ];
  }
  function renderPolitics(){
    const pol=state.politics,parties=pol.parties||politicalDefaultParties();
    const total=parties.reduce((sum,x)=>sum+x.support,0)||100;
    const rows=parties.slice().sort((a,b)=>b.support-a.support).map((party,index)=>{
      const seats=Math.round(party.support/total*100);
      const coalition=pol.coalition.includes(party.id);
      return '<div class="wo-policy-row"><div><b>'+(index+1)+'. '+esc(party.name)+'</b><small>'+esc(party.ideology)+(coalition?' · Regierungskoalition':' · Opposition')+'</small><div class="wo-bar" style="margin-top:7px"><i style="width:'+clamp(party.support,0,100)+'%"></i></div></div><span class="wo-tag">'+Math.round(party.support)+'% · '+seats+' Sitze</span></div>';
    }).join("");
    const coalitionSeats=parties.filter(x=>pol.coalition.includes(x.id)).reduce((sum,x)=>sum+x.support,0);
    const last=pol.lastElection?'<p class="wo-muted">Letzte Wahl: '+esc(pol.lastElection.date)+' · '+esc(pol.lastElection.result)+'</p>':'<p class="wo-muted">Noch keine Wahl in dieser Amtszeit durchgeführt.</p>';
    return pageHead("DEMOKRATIE & MEHRHEITEN","Parteien & Wahlen","Parteien reagieren auf deine Politik, konkurrieren um Stimmen und können nach einer Wahl Regierungsmehrheiten bilden.")+
      '<div class="wo-government-summary"><div><span>Wahl in</span><strong>'+state.nextElection+' Monaten</strong></div><div><span>Koalitionsanteil</span><strong>'+Math.round(coalitionSeats)+'%</strong></div><div><span>Wahlkampfaktionen</span><strong>'+pol.campaigns+'</strong></div></div>'+
      '<div class="wo-two-col"><section class="wo-panel"><h2>Parteienlandschaft</h2><p class="wo-muted">Die Umfragewerte verändern sich durch Wirtschaft, Zufriedenheit, Freiheit, Umweltpolitik und deine Entscheidungen.</p>'+rows+last+'</section>'+
      '<section class="wo-panel"><h2>Demokratische Strategie</h2><p class="wo-muted">Ein Wahlkampf kostet Geld und einen politischen Aktionspunkt. Er stärkt je nach Schwerpunkt unterschiedliche Wählergruppen.</p>'+
      '<div class="wo-action-stack"><button class="wo-btn primary" data-action="campaign" data-kind="jobs">Arbeitsplätze & Wirtschaft · 90 €</button><button class="wo-btn" data-action="campaign" data-kind="social">Soziale Sicherheit · 85 €</button><button class="wo-btn" data-action="campaign" data-kind="climate">Klima & Zukunft · 80 €</button><button class="wo-btn" data-action="campaign" data-kind="freedom">Freiheit & Transparenz · 75 €</button></div>'+
      '<div class="wo-parliament-note">Aktuelle Koalitionsstärke: <strong>'+Math.round(coalitionSeats)+'%</strong>. Für eine stabile Mehrheit werden mindestens 50% benötigt.</div></section></div>'+
      '<section class="wo-panel"><h2>Koalitionsverhandlungen</h2><p class="wo-muted">Nach einer Wahl kannst du Partner aufnehmen. Ein Koalitionswechsel kostet einen Aktionspunkt und kann politische Kompromisse erfordern.</p><div class="wo-inline-form"><select id="wo-coalition-party">'+parties.filter(x=>!pol.coalition.includes(x.id)).map(x=>'<option value="'+x.id+'">'+esc(x.name)+' · '+Math.round(x.support)+'%</option>').join("")+'</select><button class="wo-btn primary" data-action="coalition" data-party="selected">Partner aufnehmen</button></div></section>';
  }
  function runCampaign(kind){
    const p=state.player,pol=state.politics,costs={jobs:90,social:85,climate:80,freedom:75};
    if(!costs[kind])return;
    if(p.treasury<costs[kind]){notify("Nicht genügend Geld für den Wahlkampf.");return;}
    if(!spendAP(1))return;
    p.treasury-=costs[kind];pol.campaigns++;
    const target={jobs:"civic",social:"social",climate:"green",freedom:"liberal"}[kind];
    const party=pol.parties.find(x=>x.id===target);
    if(party)party.support=clamp(party.support+2.2,1,65);
    const gov=pol.parties.find(x=>x.government);
    if(gov&&gov.id!==target)gov.support=clamp(gov.support+.6,1,65);
    normalizePartySupport();
    addNews("Wahlkampf gestartet",({jobs:"Deine Regierung stellt Beschäftigung und Wachstum in den Mittelpunkt.",social:"Soziale Sicherheit wird zum Schwerpunkt deiner Kampagne.",climate:"Du wirbst mit Klimaschutz und langfristiger Modernisierung.",freedom:"Du setzt auf Bürgerrechte, Transparenz und Freiheit."})[kind],"success");
    saveGame();render();notify("Wahlkampfmaßnahme durchgeführt.");
  }
  function formCoalition(id){
    if(id==="selected")id=$("wo-coalition-party")?.value;
    const pol=state.politics,party=pol.parties.find(x=>x.id===id);
    if(!party||pol.coalition.includes(id)){notify("Diese Partei ist bereits Teil der Koalition.");return;}
    if(!spendAP(1))return;
    pol.coalition.push(id);party.government=true;
    addNews("Koalitionsabkommen", "Mit "+party.name+" wurde eine Zusammenarbeit vereinbart. Neue Kompromisse werden erforderlich.","success");
    saveGame();render();notify("Koalitionspartner aufgenommen.");
  }
  function normalizePartySupport(){
    const parties=state.politics.parties,total=parties.reduce((s,x)=>s+x.support,0)||1;
    parties.forEach(x=>x.support=clamp(x.support/total*100,1,80));
    const adjusted=parties.reduce((s,x)=>s+x.support,0);
    parties[0].support+=100-adjusted;
  }
  function runPoliticalMonth(){
    const pol=state.politics;if(!pol||!Array.isArray(pol.parties))return;
    const p=state.player,s=state.society;
    pol.parties.forEach(party=>{
      let delta=(Math.random()-.5)*.55;
      if(party.id==="civic")delta+=(p.approval-50)*.012+(p.economy-60)*.006;
      if(party.id==="social")delta+=(s.inequality-40)*.012+(s.happiness-60)*.008;
      if(party.id==="green")delta+=(s.environment-50)*.014+(state.climate.renewables-40)*.006;
      if(party.id==="liberal")delta+=(s.freedom-60)*.012+(s.mediaTrust-55)*.006;
      if(party.id==="conservative")delta+=(p.stability-60)*.012+(p.military-50)*.004;
      party.support=clamp(party.support+delta,2,70);
    });
    normalizePartySupport();
  }
  function runElection(){
    const pol=state.politics,p=state.player;
    normalizePartySupport();
    const winner=pol.parties.slice().sort((a,b)=>b.support-a.support)[0];
    const coalition=pol.parties.filter(x=>pol.coalition.includes(x.id)).reduce((sum,x)=>sum+x.support,0);
    const mandate=clamp(coalition+(p.approval-50)*.22+(p.stability-55)*.1,10,85);
    const won=pol.coalition.includes(winner.id)||coalition>=50;
    p.parliament=mandate;pol.mandate=mandate;pol.lastElection={date:turnLabel(),result:won?"Regierung bestätigt":"Regierungswechsel / schwierige Mehrheitsbildung"};
    if(won){p.influence=clamp(p.influence+8,0,100);p.approval=clamp(p.approval+3,0,100);addNews("Wahl: Regierung bestätigt","Die Regierungskoalition kann mit "+Math.round(mandate)+"% der Sitze weiterarbeiten.","success");}
    else{p.stability=clamp(p.stability-7,0,100);p.parliament=clamp(p.parliament-8,0,100);p.influence=clamp(p.influence-4,0,100);addNews("Wahl: schwierige Regierungsbildung","Die stärkste Partei ist nicht Teil deiner Koalition. Verhandlungen werden notwendig.","warning");}
    state.nextElection=36;
  }
  function renderNews() {
    const rows=state.news.map(n=>'<article class="wo-news-card"><div class="wo-news-card-head"><span class="wo-news-dot '+esc(n.tone)+'"></span><span class="wo-tag">'+esc(n.date)+'</span></div><h3>'+esc(n.title)+'</h3><p>'+esc(n.text)+'</p></article>').join("");
    return pageHead("PRESSE & INFORMATION","Nachrichtenarchiv","Verfolge die Ereignisse in deinem Land und in der internationalen Ordnung.")+
      '<div class="wo-news-toolbar"><span>'+state.news.length+' Meldungen gespeichert</span><button class="wo-btn ghost" data-action="export">Spielstand exportieren</button></div><div class="wo-news-grid">'+(rows||'<div class="wo-panel">Noch keine Nachrichten vorhanden.</div>')+'</div>';
  }
  function renderEventChoice(choiceId) {
    const event=state.currentEvent;
    if(!event)return;
    const choice=event.choices.find(c=>c.id===choiceId);
    if(!choice)return;
    if(state.player.treasury<choice.cost){notify("Für diese Entscheidung reicht deine Staatskasse nicht aus.");return;}
    state.player.treasury-=choice.cost;
    effectApply(choice.effects);
    addNews(event.title,choice.result,"success");
    state.currentEvent=null;
    state.player.eventCount++;
    saveGame();render();
  }
  function handleDiplomacy(kind,countryId) {
    const c=countryById(countryId);
    if(!c||c.id===state.countryId)return;
    const p=state.player, r=relation(c.id);
    const costs={improve:50,trade:70,alliance:80,summit:40};
    const cost=costs[kind]||0;
    if(p.treasury<cost){notify("Nicht genügend Geld in der Staatskasse.");return;}
    if(kind==="alliance"&&r<35){notify("Für eine Partnerschaft brauchst du mindestens +35 Beziehungspunkte.");return;}
    if(kind==="trade"&&p.tradePartners.includes(c.id)){notify("Mit diesem Staat besteht bereits ein Handelsabkommen.");return;}
    if(kind==="alliance"&&p.alliances.includes(c.id)){notify("Diese Partnerschaft besteht bereits.");return;}
    if(!spendAP(1))return;
    p.treasury-=cost;
    if(kind==="improve"){p.relationships[c.id]=clamp(r+10,-100,100);p.influence=clamp(p.influence+2,0,100);addNews("Diplomatisches Gespräch mit "+c.name,"Ein bilaterales Gespräch verbessert die Beziehungen um 10 Punkte.","success");}
    if(kind==="trade"){p.tradePartners.push(c.id);p.relationships[c.id]=clamp(r+7,-100,100);p.economy=clamp(p.economy+2,0,100);addNews("Handelsabkommen mit "+c.name,"Ein neues Abkommen stärkt den gegenseitigen Handel und bringt monatliche Einnahmen.","success");}
    if(kind==="alliance"){p.alliances.push(c.id);p.relationships[c.id]=clamp(r+8,-100,100);p.influence=clamp(p.influence+5,0,100);addNews("Strategische Partnerschaft","Du und "+c.name+" vereinbaren regelmäßige Konsultationen und engere Zusammenarbeit.","success");}
    if(kind==="summit"){p.relationships[c.id]=clamp(r+5,-100,100);p.influence=clamp(p.influence+4,0,100);addNews("Gipfeltreffen mit "+c.name,"Der Austausch schafft neue Gesprächskanäle.","success");}
    saveGame();render();notify("Diplomatische Aktion abgeschlossen.");
  }
  function passLaw(id) {
    const law=LAWS.find(l=>l.id===id),p=state.player;
    if(!law||p.laws.includes(id))return;
    if(p.treasury<law.cost){notify("Nicht genügend Geld für dieses Gesetz.");return;}
    if(p.parliament<law.support){notify("Für dieses Vorhaben fehlen parlamentarische Stimmen. Suche zuerst Unterstützung.");return;}
    if(!spendAP(1))return;
    p.treasury-=law.cost;p.laws.push(id);effectApply(law.effects);
    p.parliament=clamp(p.parliament-1,0,100);
    addNews("Gesetz verabschiedet: "+law.name,"Das Parlament hat die Reform angenommen. "+law.description,"success");
    saveGame();render();notify("Gesetz wurde verabschiedet.");
  }
  function appointMinister(slot,id) {
    const m=MINISTERS.find(x=>x.id===id);
    if(!m){notify("Bitte wähle einen Minister aus.");return;}
    if(Object.values(state.player.ministers).includes(id)&&state.player.ministers[slot]!==id){notify("Diese Person ist bereits für ein anderes Ressort zuständig.");return;}
    if(!spendAP(1))return;
    state.player.ministers[slot]=id;
    addNews("Kabinett umgebildet",m.name+" übernimmt das Ressort "+m.role+".","neutral");
    saveGame();render();
  }
  function resolveResolution(type) {
    const p=state.player;
    const defs={
      research:{title:"Internationaler Forschungsverbund",effect:"technology",value:2,interest:"technology"},
      trade:{title:"Transparente Handelsstandards",effect:"economy",value:2,interest:"economy"},
      climate:{title:"Gemeinsamer Klimaschutzfonds",effect:"stability",value:2,interest:"stability"},
      education:{title:"Bildungs- und Austauschprogramm",effect:"technology",value:2,interest:"education"},
      humanitarian:{title:"Humanitäre Koordination",effect:"influence",value:2,interest:"stability"}
    };
    const item=defs[type];if(!item)return;
    if(p.influence<12){notify("Du brauchst mindestens 12 Einflusspunkte, um eine Resolution einzubringen.");return;}
    if(!spendAP(1))return;
    p.influence-=12;
    let yes=1;
    state.countries.filter(c=>c.id!==state.countryId).forEach(c=>{
      let score=relation(c.id)/2 + (c[item.interest]||c.economy)/12 + (c.stability-60)/10;
      if(type==="trade"&&c.economy>75)score+=5;
      if(type==="climate"&&c.stability<60)score+=5;
      if(type==="research"&&c.technology>75)score+=5;
      if(score>6)yes++;
    });
    const passed=yes>=7;
    state.resolutions.unshift({title:item.title,date:turnLabel(),yes,passed});
    state.resolutions=state.resolutions.slice(0,20);
    if(passed){changeStat(item.effect,item.value);changeStat("influence",5);state.countries.filter(c=>c.id!==state.countryId).forEach(c=>{c.stability=clamp(c.stability+0.4,0,100);});}
    else {changeStat("influence",2);}
    addNews(passed?"Resolution angenommen":"Resolution abgelehnt",item.title+" erhält "+yes+" von 12 Stimmen. "+(passed?"Der Beschluss wird umgesetzt.":"Die notwendige Mehrheit wurde verfehlt."),passed?"success":"warning");
    saveGame();render();notify(passed?"Internationale Resolution angenommen.":"Keine Mehrheit erreicht.");
  }
  function changeTax(value) {
    const p=state.player,rate=clamp(value,10,40);
    if(rate===p.tax){notify("Der Steuersatz ist unverändert.");return;}
    if(!spendAP(1))return;
    const old=p.tax;p.tax=rate;
    if(rate>old){p.approval=clamp(p.approval-(rate-old)*0.45,0,100);p.parliament=clamp(p.parliament-(rate-old)*0.15,0,100);}
    else {p.approval=clamp(p.approval+(old-rate)*0.25,0,100);}
    addNews("Steuerpolitik geändert","Der allgemeine Steuersatz wurde von "+old+"% auf "+rate+"% verändert.","neutral");
    saveGame();render();
  }
  function saveBudget(form) {
    const values={};form.querySelectorAll("input[name]").forEach(input=>values[input.name]=Number(input.value));
    const total=Object.values(values).reduce((a,b)=>a+b,0);
    if(total!==100){notify("Die Budgetpunkte müssen genau 100 ergeben. Aktuell: "+total+".");return;}
    if(!spendAP(1))return;
    state.player.budget=values;
    addNews("Haushalt neu verteilt","Deine Regierung hat die staatlichen Ausgaben neu priorisiert.","neutral");
    saveGame();render();notify("Haushalt gespeichert.");
  }
  function endTurn() {
    const p=state.player;
    if(p.currentEvent||state.currentEvent){notify("Bitte löse zuerst das offene Ereignis.");return;}
    const budget=p.budget;
    const tradeBonus=p.tradePartners.length*8;
    const income=Math.round(58+p.economy*0.5+p.tax*0.65+tradeBonus);
    let expense=Math.round(55+budget.education*0.35+budget.health*0.4+budget.infrastructure*0.3+budget.defense*0.32+budget.diplomacy*0.2);
    if(state.difficulty==="easy")expense=Math.round(expense*0.9);
    if(state.difficulty==="hard")expense=Math.round(expense*1.12);
    const net=income-expense;
    p.treasury=Math.max(0,p.treasury+net);
    state.lastEconomy={income,expenses:expense,net};
    if(p.tax>28){p.approval=clamp(p.approval-1.4,0,100);p.stability=clamp(p.stability-0.5,0,100);}
    else if(p.tax<17){p.approval=clamp(p.approval+0.5,0,100);}
    if(budget.education>=20)p.technology=clamp(p.technology+0.35,0,100);
    if(budget.infrastructure>=20)p.economy=clamp(p.economy+0.3,0,100);
    if(budget.health>=20)p.stability=clamp(p.stability+0.25,0,100);
    if(net<0){p.stability=clamp(p.stability-1,0,100);}
    if(net>20)p.approval=clamp(p.approval+0.35,0,100);
    p.parliament=clamp(p.parliament+(p.approval-55)*0.025+(p.stability-60)*0.012,0,100);
    p.influence=clamp(p.influence+0.35,0,100);
    if(Object.values(p.ministers).includes("jonas"))p.treasury+=5;
    if(Object.values(p.ministers).includes("lena"))p.economy=clamp(p.economy+0.2,0,100);
    if(Object.values(p.ministers).includes("mira"))p.technology=clamp(p.technology+0.25,0,100);
    if(Object.values(p.ministers).includes("sana"))p.stability=clamp(p.stability+0.25,0,100);
    if(p.tradePartners.length)p.tradePartners.forEach(id=>{const c=countryById(id);if(c){p.relationships[id]=clamp(relation(id)+0.5,-100,100);c.economy=clamp(c.economy+0.12,0,100);}});
    state.countries.filter(c=>c.id!==state.countryId).forEach(c=>{
      c.economy=clamp(c.economy+(Math.random()*0.7-0.25),0,100);
      c.stability=clamp(c.stability+(Math.random()*0.5-0.2),0,100);
      c.technology=clamp(c.technology+(Math.random()*0.35),0,100);
      c.trend=Math.round((Math.random()*2-0.8)*10)/10;
    });
    advanceExtendedWorld();
    state.turn++;
    state.month++;
    if(state.month>12){state.month=1;state.year++;}
    state.nextElection--;
    if(state.nextElection<=0)runElection();
    runPoliticalMonth();
    p.actionPoints=3;
    const eventSeed=EVENTS[Math.floor(Math.random()*EVENTS.length)];
    state.currentEvent={...eventSeed,choices:eventSeed.choices.map(x=>({...x,effects:{...x.effects}})),targetId:null};
    if(state.difficulty==="hard"&&Math.random()<0.45){p.stability=clamp(p.stability-1,0,100);}
    addNews("Monatsbilanz: "+turnLabel(),"Einnahmen "+money(income)+", Ausgaben "+money(expense)+", Saldo "+(net>=0?"+":"")+money(net)+". Deine Aktionspunkte wurden erneuert.","neutral");
    saveGame();activeView="dashboard";render();notify("Neuer Monat: "+turnLabel()+". Eine neue Lage wartet auf deine Regierung.");
  }
  function gradeLearning(result) {
    const item=quiz.items[quiz.index];if(!item)return;
    const key=state.turn+":"+item.id;
    const already=state.rewardLedger.includes(key);
    state.learningStats.answered++;
    if(result==="known"){state.learningStats.known++;if(!already){state.player.research=clamp(state.player.research+3,0,100);state.player.influence=clamp(state.player.influence+1,0,100);state.learningStats.researchEarned+=3;}}
    else {state.learningStats.unsure++;if(!already){state.player.research=clamp(state.player.research+1,0,100);state.learningStats.researchEarned+=1;}}
    if(!already){state.rewardLedger.push(key);state.rewardLedger=state.rewardLedger.slice(-500);}
    addNews("Lernmission abgeschlossen",result==="known"?"Du hast eine Frage sicher beantwortet und Forschung gewonnen.":"Du hast eine schwierige Frage wiederholt und einen kleinen Forschungsfortschritt erzielt.","success");
    quiz.index++;quiz.revealed=false;
    if(quiz.index>=quiz.items.length){quiz.items=[];quiz.index=0;notify("Lernmission abgeschlossen. Deine Forschung wurde aktualisiert.");}
    saveGame();render();
  }
  function startQuiz() {
    const pool=getLearningItems();
    const due=pool.filter(x=>x.due && x.due<=today());
    const source=due.length?due:pool;
    const shuffled=source.slice().sort(()=>Math.random()-0.5);
    quiz={items:shuffled.slice(0,Math.min(8,shuffled.length)),index:0,revealed:false,seen:[]};
    render();
  }

  async function startMaterialQuiz(){
    const box=$("wo-save-status");if(box)box.textContent="Lade Heftertexte …";
    try{
      const app=JSON.parse(localStorage.getItem("studyspaceData")||"{}"),materials=Array.isArray(app.materials)?app.materials:[];
      if(!("indexedDB" in window))throw new Error("IndexedDB nicht verfügbar");
      const db=await new Promise((resolve,reject)=>{const req=indexedDB.open("StudySpaceFilesDB",1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      const records=await new Promise((resolve,reject)=>{const tx=db.transaction("files","readonly"),req=tx.objectStore("files").getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});
      const items=[];
      materials.forEach(m=>{const rec=records.find(x=>x.id===m.id),textContent=(rec?.extractedText||"").trim();if(!textContent)return;
        const subject=app.subjects?.find(x=>x.id===m.subjectId)?.name||"Hefter";
        const chunks=textContent.split(/(?<=[.!?])\s+/).filter(x=>x.length>35);
        const excerpt=(chunks.slice(0,5).join(" ")||textContent).slice(0,1400);
        items.push({id:"material:"+m.id,q:"Erkläre die wichtigsten Inhalte aus dem Material „"+(m.name||m.fileName||"Hefter")+"“ in eigenen Worten. Welche zentralen Begriffe, Zusammenhänge und Aussagen solltest du dir merken?",a:excerpt,subject,source:"StudySpace-Hefter · OCR",kind:"material"});
      });
      if(!items.length){notify("Keine erkannten Heftertexte gefunden. Öffne zuerst ein Material in StudySpace und lasse den Text erkennen.");if(box)box.textContent="Automatisch gespeichert";return;}
      quiz={items:items.slice(0,8),index:0,revealed:false,seen:[]};activeView="learning";render();notify(items.length+" Hefter-Lernmaterialien geladen.");
    }catch(error){console.warn(error);notify("Heftertexte konnten nicht geladen werden. Prüfe, ob die Materialien bereits per OCR erkannt wurden.");}
    if(box)box.textContent="Automatisch gespeichert";
  }
  function selectDiplomacyCountry(id) {
    const select=$("wo-dip-country");
    if(select){select.value=id;const profile=$("wo-dip-profile");if(profile)profile.innerHTML=diplomacyProfile(countryById(id));}
    const detail=$("wo-country-detail");
    if(detail&&countryById(id)){detail.hidden=false;detail.innerHTML=diplomacyProfile(countryById(id));}
  }
  function showCountryDetail(id) {
    const c=countryById(id);if(!c)return;
    const container=$("wo-country-detail");if(!container)return;
    container.hidden=false;
    container.innerHTML='<div class="wo-panel-head"><h2>'+c.flag+' '+esc(c.name)+'</h2><button class="wo-btn small ghost" data-action="close-detail">Schließen ×</button></div><p>'+esc(c.description)+'</p><div class="wo-profile-stats"><span>Regierung <b>'+esc(c.government)+'</b></span><span>Orientierung <b>'+esc(c.orientation)+'</b></span><span>Hauptstadt <b>'+esc(c.capital)+'</b></span><span>Bevölkerung <b>'+c.population+' Mio.</b></span><span>Wirtschaft <b>'+c.economy+'/100</b></span><span>Technologie <b>'+c.technology+'/100</b></span></div>'+(c.id!==state.countryId?'<p>Beziehung zu deinem Land: <strong class="'+relationTone(relation(id))+'">'+relation(id)+'</strong></p><div class="wo-country-actions"><button class="wo-btn primary" data-action="go-diplomacy" data-country="'+id+'">Diplomatie</button><button class="wo-btn small" data-action="ai-diplomacy" data-country="'+id+'" data-move="visit">Staatsbesuch · 35 €</button><button class="wo-btn small" data-action="ai-diplomacy" data-country="'+id+'" data-move="aid">Hilfspaket · 90 €</button><button class="wo-btn small" data-action="ai-diplomacy" data-country="'+id+'" data-move="sanction">Sanktionen · 50 €</button></div>':'<span class="wo-tag positive">Dein Heimatstaat</span>');
  }
  function exportSave() {
    if(!state)return;
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="world-order-spielstand.json";a.click();URL.revokeObjectURL(url);
  }
  function resetGame() {
    if(!confirm("Möchtest du nur den WORLD ORDER-Spielstand zurücksetzen? Dein Imperium, deine Fächer, Karteikarten und Lernmaterialien bleiben erhalten."))return;
    localStorage.removeItem(SAVE_KEY);state=null;quiz={items:[],index:0,revealed:false,seen:[]};activeView="dashboard";render();notify("WORLD ORDER wurde zurückgesetzt.");
  }

  function handleClick(event) {
    const view=event.target.closest("[data-view]");
    if(view){activeView=view.dataset.view;quiz={items:[],index:0,revealed:false,seen:[]};render();return;}
    const action=event.target.closest("[data-action]");
    if(!action)return;
    const kind=action.dataset.action;
    if(kind==="end-turn")endTurn();
    else if(kind==="event-choice")renderEventChoice(action.dataset.choice);
    else if(kind==="diplomacy")handleDiplomacy(action.dataset.kind,$("wo-dip-country")?.value);
    else if(kind==="select-diplomacy"){selectDiplomacyCountry(action.dataset.country);}
    else if(kind==="law")passLaw(action.dataset.law);
    else if(kind==="appoint"){appointMinister(action.dataset.slot,action.dataset.selected||document.querySelector('select[data-minister-slot="'+action.dataset.slot+'"]')?.value);}
    else if(kind==="country-detail")showCountryDetail(action.dataset.country);
    else if(kind==="close-detail"){$("wo-country-detail").hidden=true;}
    else if(kind==="go-diplomacy"){activeView="diplomacy";render();selectDiplomacyCountry(action.dataset.country);}
    else if(kind==="resolution")resolveResolution(action.dataset.type);
    else if(kind==="start-quiz")startQuiz();
    else if(kind==="start-material-quiz")startMaterialQuiz();
    else if(kind==="reveal"){quiz.revealed=true;render();}
    else if(kind==="grade")gradeLearning(action.dataset.result);
    else if(kind==="open-studyspace"){try{if(window.parent&&typeof window.parent.openPage==="function")window.parent.openPage(action.dataset.target);}catch(error){notify("Öffne den entsprechenden Lernbereich über die StudySpace-Navigation.");}}
    else if(kind==="export")exportSave();
    else if(kind==="society-policy")applySocietyPolicy(action.dataset.policy);
    else if(kind==="climate-policy")applyClimatePolicy(action.dataset.policy);
    else if(kind==="trade-deal")makeTradeDeal(action.dataset.country);
    else if(kind==="research")unlockResearch(action.dataset.tech);
    else if(kind==="ai-diplomacy")runForeignOffice(action.dataset.country,action.dataset.move);
    else if(kind==="campaign")runCampaign(action.dataset.kind);
    else if(kind==="coalition")formCoalition(action.dataset.party);
  }
  function handleSubmit(event) {
    const form=event.target;
    if(form.id==="wo-start-form"){event.preventDefault();createGame($("wo-country").value,$("wo-difficulty").value,$("wo-role").value);}
    if(form.id==="wo-tax-form"){event.preventDefault();changeTax($("wo-tax").value);}
    if(form.id==="wo-budget-form"){event.preventDefault();saveBudget(form);}
    if(form.id==="wo-resolution-form"){event.preventDefault();resolveResolution($("wo-resolution").value);}
    if(form.id==="wo-trade-form"){event.preventDefault();makeTradeDeal($("wo-trade-country").value);}
    if(form.id==="wo-project-form"){event.preventDefault();startProject($("wo-project-select").value);}
  }
  function handleChange(event) {
    if(event.target.id==="wo-dip-country"){const c=countryById(event.target.value);$("wo-dip-profile").innerHTML=diplomacyProfile(c);}
    if(event.target.matches("[data-minister-slot]")){
      const slot=event.target.dataset.ministerSlot;
      const btn=document.querySelector('[data-action="appoint"][data-slot="'+slot+'"]');
      if(btn)btn.dataset.selected=event.target.value;
    }
    if(event.target.matches(".wo-budget-row input")){
      const out=$("out-"+event.target.name);if(out)out.textContent=event.target.value;
      const total=[...document.querySelectorAll(".wo-budget-row input")].reduce((sum,x)=>sum+Number(x.value),0);
      $("wo-budget-total").textContent="Gesamt: "+total+"/100";
    }
    if(event.target.id==="wo-tax"){$("wo-tax-value").textContent=event.target.value+"%";}
  }

  function init() {
    const root=$("wo-app");
    if(!root)return;
    root.addEventListener("click",handleClick);
    root.addEventListener("submit",handleSubmit);
    root.addEventListener("change",handleChange);
    $("wo-turn-button").addEventListener("click",endTurn);
    $("wo-save-button").addEventListener("click",()=>{saveGame();notify("Spielstand gespeichert.");});
    $("wo-export-button").addEventListener("click",exportSave);
    $("wo-reset-button").addEventListener("click",resetGame);
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();