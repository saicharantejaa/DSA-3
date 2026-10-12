/**
 * TalentMatch — app.js  (complete rewrite v3)
 * ================================================================
 * Algorithms implemented (all run in the browser, no server needed):
 *   1. HashMap / HashSet   → SkillExtractor   (Module 1/6)
 *   2. Trie                → SkillTrie        (Module 2)   [dsa-algorithms.js]
 *   3. Edit Distance DP    → EditDistanceScorer(Module 3)
 *   4. LCS                 → LCSAnalyzer      (Module 3)   [dsa-algorithms.js]
 *   5. Merge Sort          → CandidateRanker  (Module 4)
 *   6. Quick Sort          → SortComparison   (Module 4)   [dsa-algorithms.js]
 *   7. Heap Sort + Max-Heap→ MaxHeap          (Module 5)   [dsa-algorithms.js]
 *   8. Graph BFS           → SkillGraph       (Module 6)   [dsa-algorithms.js]
 * ================================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   SKILL DICTIONARY  (HashMap: keyword → display name)
   Extended with 120+ entries for broader coverage
   ───────────────────────────────────────────────────────────────── */
const SKILL_DICTIONARY = new Map([
  // Languages
  ['java','Java'],['python','Python'],['javascript','JavaScript'],
  ['typescript','TypeScript'],['c++','C++'],['c#','C#'],['c','C'],
  ['ruby','Ruby'],['go','Go'],['rust','Rust'],['kotlin','Kotlin'],
  ['swift','Swift'],['php','PHP'],['scala','Scala'],['r','R'],
  ['dart','Dart'],['matlab','MATLAB'],['julia','Julia'],['haskell','Haskell'],
  ['elixir','Elixir'],['erlang','Erlang'],['clojure','Clojure'],['perl','Perl'],
  ['groovy','Groovy'],['lua','Lua'],['assembly','Assembly'],['vba','VBA'],
  ['cobol','COBOL'],['fortran','Fortran'],['prolog','Prolog'],
  // Web frontend
  ['html','HTML'],['css','CSS'],['react','React'],['angular','Angular'],
  ['vue','Vue'],['nextjs','Next.js'],['svelte','Svelte'],['sass','Sass'],
  ['bootstrap','Bootstrap'],['jquery','jQuery'],['redux','Redux'],
  ['webpack','Webpack'],['tailwind','Tailwind'],['vite','Vite'],
  ['gatsby','Gatsby'],['nuxtjs','Nuxt.js'],['remix','Remix'],
  ['styled components','Styled Components'],['material ui','Material UI'],
  ['ant design','Ant Design'],['chakra ui','Chakra UI'],
  // Backend / frameworks
  ['spring','Spring'],['spring boot','Spring Boot'],['django','Django'],
  ['flask','Flask'],['fastapi','FastAPI'],['nodejs','Node.js'],
  ['node.js','Node.js'],['express','Express'],['laravel','Laravel'],
  ['rails','Rails'],['symfony','Symfony'],['asp.net','ASP.NET'],
  ['.net','.NET'],['gin','Gin'],['fiber','Fiber'],
  ['rest api','REST API'],['graphql','GraphQL'],['grpc','gRPC'],
  ['microservices','Microservices'],['hibernate','Hibernate'],
  ['maven','Maven'],['gradle','Gradle'],['kafka','Kafka'],
  ['rabbitmq','RabbitMQ'],['celery','Celery'],['fastify','Fastify'],
  ['nestjs','NestJS'],['strapi','Strapi'],['prisma','Prisma'],
  // Databases
  ['sql','SQL'],['mysql','MySQL'],['postgresql','PostgreSQL'],
  ['mongodb','MongoDB'],['redis','Redis'],['oracle','Oracle'],
  ['sqlite','SQLite'],['cassandra','Cassandra'],['elasticsearch','Elasticsearch'],
  ['dynamodb','DynamoDB'],['neo4j','Neo4j'],['influxdb','InfluxDB'],
  ['mariadb','MariaDB'],['couchdb','CouchDB'],['firestore','Firestore'],
  ['supabase','Supabase'],['planetscale','PlanetScale'],['cockroachdb','CockroachDB'],
  // Cloud / DevOps
  ['aws','AWS'],['azure','Azure'],['gcp','GCP'],['docker','Docker'],
  ['kubernetes','Kubernetes'],['jenkins','Jenkins'],['git','Git'],
  ['github','GitHub'],['gitlab','GitLab'],['terraform','Terraform'],
  ['ansible','Ansible'],['ci/cd','CI/CD'],['linux','Linux'],
  ['nginx','Nginx'],['apache','Apache'],['prometheus','Prometheus'],
  ['grafana','Grafana'],['datadog','Datadog'],['elk stack','ELK Stack'],
  ['istio','Istio'],['helm','Helm'],['argo','ArgoCD'],['pulumi','Pulumi'],
  ['cloudformation','CloudFormation'],['lambda','Lambda'],
  // Data / ML / AI
  ['machine learning','Machine Learning'],['deep learning','Deep Learning'],
  ['tensorflow','TensorFlow'],['pytorch','PyTorch'],['pandas','Pandas'],
  ['numpy','NumPy'],['scikit-learn','Scikit-Learn'],['matplotlib','Matplotlib'],
  ['tableau','Tableau'],['power bi','Power BI'],['statistics','Statistics'],
  ['data science','Data Science'],['nlp','NLP'],['computer vision','Computer Vision'],
  ['excel','Excel'],['hadoop','Hadoop'],['spark','Spark'],
  ['airflow','Airflow'],['dbt','dbt'],['looker','Looker'],['metabase','Metabase'],
  ['hugging face','Hugging Face'],['langchain','LangChain'],['openai','OpenAI'],
  ['reinforcement learning','Reinforcement Learning'],['gans','GANs'],
  ['bert','BERT'],['llm','LLM'],['rag','RAG'],
  // Testing / Tools
  ['junit','JUnit'],['selenium','Selenium'],['jest','Jest'],
  ['postman','Postman'],['jira','Jira'],['agile','Agile'],
  ['scrum','Scrum'],['bash','Bash'],['powershell','PowerShell'],
  ['cypress','Cypress'],['playwright','Playwright'],['pytest','Pytest'],
  ['mocha','Mocha'],['chai','Chai'],['sonarqube','SonarQube'],
  // Mobile
  ['android','Android'],['ios','iOS'],['react native','React Native'],
  ['flutter','Flutter'],['swiftui','SwiftUI'],['jetpack compose','Jetpack Compose'],
  // Security
  ['oauth','OAuth'],['jwt','JWT'],['ssl/tls','SSL/TLS'],['sso','SSO'],
  ['penetration testing','Penetration Testing'],['owasp','OWASP'],
  // Design
  ['figma','Figma'],['sketch','Sketch'],['adobe xd','Adobe XD'],
  ['photoshop','Photoshop'],['illustrator','Illustrator'],
]);

/* ─────────────────────────────────────────────────────────────────
   DATA STORE
   ───────────────────────────────────────────────────────────────── */
const Store = {
  jobs:         [],  // { id, title, skills: Set, weightedSkills: Map<skill,weight>|null }
  candidates:   [],  // { id, name, skills: Set, starred: bool, notes: string, scores: Map<jobId,{score,matched,missing}> }
  lastResults:  [],  // { candidate, score, matched, missing }
  lastJob:      null,
  activityLog:  [],  // { ts, msg }
  pdf: { file: null, text: '', detectedSkills: new Map() },
};

// ── Edit state for inline editing ──
let _editJobId  = null;
let _editCandId = null;

/* ─────────────────────────────────────────────────────────────────
   LOCALSTORAGE PERSISTENCE
   ───────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'talentmatch_v3';

function saveToStorage() {
  try {
    const data = {
      jobs: Store.jobs.map(j => ({
        id: j.id, title: j.title,
        skills: [...j.skills],
        weightedSkills: j.weightedSkills ? [...j.weightedSkills.entries()] : null,
      })),
      candidates: Store.candidates.map(c => ({
        id: c.id, name: c.name, skills: [...c.skills],
        starred: c.starred || false, notes: c.notes || '',
      })),
      lastResults: Store.lastResults.map(r => ({
        score: r.score, matched: r.matched, missing: r.missing,
        candidate: { id: r.candidate.id, name: r.candidate.name, skills: [...r.candidate.skills] },
      })),
      lastJobId: Store.lastJob ? Store.lastJob.id : null,
      activityLog: Store.activityLog.slice(-50),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(e) { console.warn('Save failed:', e); }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    Store.jobs = (data.jobs||[]).map(j => ({
      id: j.id, title: j.title,
      skills: new Set(j.skills),
      weightedSkills: j.weightedSkills ? new Map(j.weightedSkills) : null,
    }));
    Store.candidates = (data.candidates||[]).map(c => ({
      id: c.id, name: c.name, skills: new Set(c.skills),
      starred: c.starred||false, notes: c.notes||'',
    }));
    Store.lastResults = (data.lastResults||[]).map(r => ({
      score: r.score, matched: r.matched, missing: r.missing,
      candidate: { id: r.candidate.id, name: r.candidate.name, skills: new Set(r.candidate.skills) },
    }));
    if (data.lastJobId) Store.lastJob = Store.jobs.find(j=>j.id===data.lastJobId)||null;
    Store.activityLog = data.activityLog||[];
    return true;
  } catch(e) { console.warn('Load failed:', e); return false; }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  Store.jobs=[]; Store.candidates=[]; Store.lastResults=[]; Store.lastJob=null; Store.activityLog=[];
  renderJobsList(); renderCandidatesList(); updateStats(); renderOverview(); renderActivityLog();
  toast('All data cleared');
}

/* ─────────────────────────────────────────────────────────────────
   SAMPLE DATA
   ───────────────────────────────────────────────────────────────── */
function seedData() {
  if (Store.jobs.length>0 || Store.candidates.length>0) return;
  Store.jobs.push(
    { id:1, title:'Senior Java Developer',  skills:new Set(['java','spring','sql','docker','microservices','rest api','junit']), weightedSkills: new Map([['java',3],['spring',3],['sql',3],['docker',1],['microservices',1],['rest api',3],['junit',1]]) },
    { id:2, title:'Frontend Engineer',       skills:new Set(['html','css','javascript','react','typescript','git']), weightedSkills:null },
    { id:3, title:'Data Analyst',            skills:new Set(['python','sql','pandas','excel','tableau','statistics']), weightedSkills:null }
  );
  Store.candidates.push(
    { id:1, name:'Priya Sharma',  skills:new Set(['java','spring','sql','docker','microservices','junit','git']),          starred:true,  notes:'Strong Java background. Interviewed 2 rounds.' },
    { id:2, name:'Rohan Mehta',   skills:new Set(['java','spring','rest api','sql','maven','jenkins']),                   starred:false, notes:'' },
    { id:3, name:'Ananya Iyer',   skills:new Set(['python','sql','pandas','numpy','matplotlib','statistics']),            starred:false, notes:'' },
    { id:4, name:'Karan Patel',   skills:new Set(['html','css','javascript','react','git','sass','typescript']),          starred:true,  notes:'Excellent portfolio.' },
    { id:5, name:'Divya Nair',    skills:new Set(['java','python','sql','docker','kubernetes','rest api']),               starred:false, notes:'' },
    { id:6, name:'Arjun Reddy',   skills:new Set(['javascript','typescript','react','vue','css','git','redux']),          starred:false, notes:'' },
    { id:7, name:'Meera Singh',   skills:new Set(['python','machine learning','tensorflow','pandas','numpy','nlp']),      starred:false, notes:'' },
    { id:8, name:'Ravi Kumar',    skills:new Set(['aws','docker','kubernetes','terraform','jenkins','linux','git']),      starred:false, notes:'' },
  );
  logActivity('Sample data loaded');
  saveToStorage();
}

function loadSampleData() {
  if (Store.jobs.length>0 || Store.candidates.length>0) {
    if (!confirm('This will add sample data on top of existing data. Continue?')) return;
  }
  seedData();
  renderJobsList(); renderCandidatesList(); updateStats();
  toast('Sample data loaded — 3 jobs, 8 candidates');
}

/* ─────────────────────────────────────────────────────────────────
   ACTIVITY LOG
   ───────────────────────────────────────────────────────────────── */
function logActivity(msg) {
  const ts = new Date().toLocaleTimeString();
  Store.activityLog.push({ ts, msg });
  renderActivityLog();
}
function renderActivityLog() {
  const el = document.getElementById('activity-log');
  if (!el) return;
  if (!Store.activityLog.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px"><p>No activity yet.</p></div>';
    return;
  }
  el.innerHTML = [...Store.activityLog].reverse().map(a =>
    `<div class="activity-item"><span class="activity-ts">${a.ts}</span><span>${esc(a.msg)}</span></div>`
  ).join('');
}
function clearActivityLog() { Store.activityLog=[]; renderActivityLog(); }

/* ─────────────────────────────────────────────────────────────────
   ALGORITHM 1 — SkillExtractor  (HashMap / HashSet)
   ───────────────────────────────────────────────────────────────── */
const SkillExtractor = {
  extract(raw) {
    const map = new Map();
    raw.split(',').forEach(s => { const n=s.trim().toLowerCase(); if(n) map.set(n,n); });
    return new Set(map.keys());
  },
  extractFromText(text) {
    const lower = text.toLowerCase().replace(/\s+/g,' ');
    const compact = lower.replace(/\s/g,'');
    const found = new Map();
    const sorted = [...SKILL_DICTIONARY.entries()].sort((a,b)=>b[0].length-a[0].length);
    for (const [kw, display] of sorted) {
      const kwC = kw.replace(/\s/g,'');
      if (lower.includes(kw)||compact.includes(kwC)) found.set(kw,{display,active:true});
    }
    return found;
  }
};

/* ─────────────────────────────────────────────────────────────────
   ALGORITHM 2 — EditDistanceScorer (Wagner-Fischer DP, Module 3)
   ───────────────────────────────────────────────────────────────── */
const EditDistanceScorer = {
  MATCH_THRESHOLD: 0.35,

  editDistance(a, b) {
    const m=a.length, n=b.length;
    const dp = Array.from({length:m+1},()=>new Array(n+1).fill(0));
    for (let i=0;i<=m;i++) dp[i][0]=i;
    for (let j=0;j<=n;j++) dp[0][j]=j;
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) {
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
    }
    return dp[m][n];
  },

  normalizedEditDistance(a,b) {
    const mx=Math.max(a.length,b.length);
    return mx===0 ? 0 : this.editDistance(a,b)/mx;
  },

  isFuzzyMatch(a,b) {
    const sA=a.toLowerCase().trim(), sB=b.toLowerCase().trim();
    if (sA===sB) return true;
    return this.normalizedEditDistance(sA,sB)<=this.MATCH_THRESHOLD;
  },

  score(candidateSkills, jobSkills) {
    const matched=[], missing=[];
    for (const js of jobSkills) {
      let found=false;
      for (const cs of candidateSkills) { if(this.isFuzzyMatch(js,cs)){found=true;break;} }
      if (found) matched.push(js); else missing.push(js);
    }
    const total = jobSkills instanceof Set ? jobSkills.size : jobSkills.length;
    const score = total===0 ? 0 : Math.round((matched.length/total)*100);
    return { score, matched, missing };
  }
};
const FitScorer = EditDistanceScorer;

/* ─────────────────────────────────────────────────────────────────
   ALGORITHM 3 — CandidateRanker  (Merge Sort, Module 4)
   ───────────────────────────────────────────────────────────────── */
const CandidateRanker = {
  sort(results) {
    if (results.length<=1) return results;
    const mid=Math.floor(results.length/2);
    return this._merge(this.sort(results.slice(0,mid)), this.sort(results.slice(mid)));
  },
  _merge(L,R) {
    const out=[]; let i=0,j=0;
    while(i<L.length&&j<R.length) out.push(L[i].score>=R[j].score ? L[i++] : R[j++]);
    return out.concat(L.slice(i)).concat(R.slice(j));
  },
  topK(results,k) { return this.sort(results).slice(0,k); }
};

/* ─────────────────────────────────────────────────────────────────
   SECURITY — HTML escaping
   ───────────────────────────────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* ─────────────────────────────────────────────────────────────────
   VALIDATION
   ───────────────────────────────────────────────────────────────── */
function setError(id, msg) {
  const el=document.getElementById(id); if(el){el.textContent=msg; el.style.display=msg?'':'none';}
}
function clearErrors(...ids) { ids.forEach(id=>setError(id,'')); }

/* ─────────────────────────────────────────────────────────────────
   UI HELPERS
   ───────────────────────────────────────────────────────────────── */
function showView(name) {
  const views=['overview','upload','jobs','candidates','match','compare','analytics','about'];
  views.forEach(v => { const el=document.getElementById('view-'+v); if(el) el.style.display='none'; });
  const navMap={overview:'dashboard',upload:'upload',jobs:'jobs',candidates:'candidates',
    match:'match',compare:'compare',analytics:'analytics',about:'about'};
  Object.values(navMap).forEach(k=>{ const el=document.getElementById('nav-'+k); if(el){el.classList.remove('active');el.removeAttribute('aria-current');} });
  const el=document.getElementById('view-'+name);
  if(el){ el.style.display=''; }
  const navKey=navMap[name]||name;
  const navEl=document.getElementById('nav-'+navKey);
  if(navEl){navEl.classList.add('active');navEl.setAttribute('aria-current','page');}

  if(name==='match')       populateJobDropdown();
  if(name==='overview')    renderOverview();
  if(name==='compare')     populateCompareDropdowns();
  if(name==='analytics')   renderAnalytics();
  if(name==='about')       renderTeam();
}

function toast(msg, type='success') {
  const c=document.getElementById('toast-container'); if(!c) return;
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.setAttribute('role','alert');
  t.innerHTML=`<span class="toast-icon">${type==='success'?'✓':'✕'}</span> ${esc(msg)}`;
  c.appendChild(t);
  setTimeout(()=>{ t.classList.add('toast-out'); setTimeout(()=>t.remove(),200); }, 3500);
}

function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function scoreClass(s) { return s>=60?'high':s>=35?'mid':'low'; }

function tagsHtml(arr, cls) {
  return (arr||[]).map(s=>`<span class="tag ${cls}">${esc(s)}</span>`).join('');
}

function statusLabel(score) {
  if (score>=75) return {cls:'status--success', dot:'🟢', label:'Top Pick'};
  if (score>=45) return {cls:'status--warn',    dot:'🟡', label:'Maybe'};
  return           {cls:'status--neutral',  dot:'⚪', label:'Not a Fit'};
}

/* ─────────────────────────────────────────────────────────────────
   DARK MODE
   ───────────────────────────────────────────────────────────────── */
function toggleTheme() {
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  const next=isDark?'light':'dark';
  html.setAttribute('data-theme',next);
  localStorage.setItem('tm_theme',next);
  document.getElementById('themeLabel').textContent=isDark?'Dark Mode':'Light Mode';
  document.getElementById('themeIconMoon').style.display=isDark?'':'none';
  document.getElementById('themeIconSun').style.display=isDark?'none':'';
}
function initTheme() {
  const saved=localStorage.getItem('tm_theme')||'light';
  document.documentElement.setAttribute('data-theme',saved);
  if(saved==='dark'){
    document.getElementById('themeLabel').textContent='Light Mode';
    document.getElementById('themeIconMoon').style.display='none';
    document.getElementById('themeIconSun').style.display='';
  }
}

/* ─────────────────────────────────────────────────────────────────
   BACKEND STATUS INDICATOR
   ───────────────────────────────────────────────────────────────── */
async function checkBackend() {
  const dot=document.getElementById('backendDot');
  const lbl=document.getElementById('backendLabel');
  try {
    const r=await fetch('http://localhost:8080/api/candidates',{signal:AbortSignal.timeout(1500)});
    if(r.ok){
      if(dot){dot.className='backend-dot backend-dot--online';}
      if(lbl){lbl.textContent='Backend online';}
      return true;
    }
  } catch(_) {}
  if(dot){dot.className='backend-dot backend-dot--offline';}
  if(lbl){lbl.textContent='JS mode (offline)';}
  return false;
}

/* ─────────────────────────────────────────────────────────────────
   TRIE AUTOCOMPLETE  (powered by dsa-algorithms.js)
   ───────────────────────────────────────────────────────────────── */
function trieAutocomplete(input, dropdownId) {
  const dd=document.getElementById(dropdownId); if(!dd) return;
  const q=input.value.trim();
  if (q.length<1){dd.style.display='none';return;}
  const results=(typeof SkillTrie!=='undefined') ? SkillTrie.search(q,8) : [];
  if(!results.length){dd.style.display='none';return;}
  dd.innerHTML=results.map(r=>`<div class="ac-item" onclick="selectAC('${esc(r)}','${input.id}','${dropdownId}')">${esc(r)}</div>`).join('');
  dd.style.display='block';
}

function trieAutocompleteComma(input, dropdownId) {
  const dd=document.getElementById(dropdownId); if(!dd) return;
  const parts=input.value.split(',');
  const last=parts[parts.length-1].trim();
  if(last.length<1){dd.style.display='none';return;}
  const results=(typeof SkillTrie!=='undefined') ? SkillTrie.search(last,8) : [];
  if(!results.length){dd.style.display='none';return;}
  dd.innerHTML=results.map(r=>`<div class="ac-item" onclick="selectACComma('${esc(r)}','${input.id}','${dropdownId}')">${esc(r)}</div>`).join('');
  dd.style.display='block';
}

function selectAC(val,inputId,ddId) {
  const inp=document.getElementById(inputId); if(inp) inp.value=val;
  const dd=document.getElementById(ddId); if(dd) dd.style.display='none';
}

function selectACComma(val,inputId,ddId) {
  const inp=document.getElementById(inputId); if(!inp) return;
  const parts=inp.value.split(',');
  parts[parts.length-1]=val;
  inp.value=parts.join(', ')+', ';
  const dd=document.getElementById(ddId); if(dd) dd.style.display='none';
  inp.focus();
}

// Close dropdowns on outside click
document.addEventListener('click', e=>{
  if(!e.target.closest('.autocomplete-dropdown') && !e.target.closest('input')) {
    document.querySelectorAll('.autocomplete-dropdown').forEach(d=>d.style.display='none');
  }
  if(!e.target.closest('.search-dropdown') && !e.target.closest('#globalSearch')) {
    const sd=document.getElementById('searchDropdown');
    if(sd) sd.style.display='none';
  }
});

/* ─────────────────────────────────────────────────────────────────
   GLOBAL SEARCH  (keyboard shortcut: /)
   ───────────────────────────────────────────────────────────────── */
function initGlobalSearch() {
  const inp=document.getElementById('globalSearch');
  if(!inp) return;
  inp.addEventListener('input',()=>{
    const q=inp.value.trim().toLowerCase();
    const dd=document.getElementById('searchDropdown');
    if(!q||!dd){if(dd)dd.style.display='none';return;}
    const hits=Store.candidates.filter(c=>c.name.toLowerCase().includes(q)).slice(0,6);
    if(!hits.length){dd.style.display='none';return;}
    dd.innerHTML=hits.map(c=>`<div class="ac-item" onclick="showView('candidates');inp.value=''">
      ${c.starred?'⭐ ':''}${esc(c.name)} <span style="color:var(--text-faint)">${c.skills.size} skills</span>
    </div>`).join('');
    dd.style.display='block';
  });
}

/* ─────────────────────────────────────────────────────────────────
   JOB TEMPLATES
   ───────────────────────────────────────────────────────────────── */
const JOB_TEMPLATES = {
  frontend: { title:'Frontend Developer', skills:'html, css, javascript, react, typescript, git, sass, webpack' },
  backend:  { title:'Backend Developer',  skills:'java, spring boot, sql, rest api, docker, junit, maven, microservices' },
  fullstack:{ title:'Full Stack Developer',skills:'javascript, react, nodejs, postgresql, docker, git, rest api, typescript' },
  data:     { title:'Data Analyst',       skills:'python, sql, pandas, excel, tableau, statistics, power bi' },
  ml:       { title:'ML Engineer',        skills:'python, machine learning, tensorflow, pytorch, pandas, numpy, docker, aws' },
  devops:   { title:'DevOps Engineer',    skills:'docker, kubernetes, jenkins, terraform, aws, linux, git, ci/cd, ansible' },
  mobile:   { title:'Mobile Developer',   skills:'react native, javascript, typescript, ios, android, git, rest api' },
};
function loadJobTemplate(key) {
  const t=JOB_TEMPLATES[key]; if(!t) return;
  const titleEl=document.getElementById('jobTitle');
  const skillsEl=document.getElementById('jobSkills');
  if(titleEl) titleEl.value=t.title;
  if(skillsEl) skillsEl.value=t.skills;
  toggleWeightedPanel();
  toast(`Template loaded: ${t.title}`);
}

/* ─────────────────────────────────────────────────────────────────
   WEIGHTED SKILLS PANEL
   ───────────────────────────────────────────────────────────────── */
function toggleWeightedPanel() {
  const cb=document.getElementById('useWeightedSkills');
  const panel=document.getElementById('weightedPanel');
  if(!cb||!panel) return;
  if(cb.checked) { panel.style.display=''; buildWeightedPanel(); }
  else            { panel.style.display='none'; }
}
function buildWeightedPanel() {
  const raw=document.getElementById('jobSkills')?.value||'';
  const skills=[...SkillExtractor.extract(raw)];
  const list=document.getElementById('weightedSkillsList'); if(!list) return;
  list.innerHTML=skills.map(s=>`
    <div class="weighted-row">
      <span class="weighted-skill">${esc(s)}</span>
      <label class="weighted-option"><input type="radio" name="w_${esc(s)}" value="3" checked> Must Have (3×)</label>
      <label class="weighted-option"><input type="radio" name="w_${esc(s)}" value="1"> Nice to Have (1×)</label>
    </div>`).join('');
}
function getWeightedSkills() {
  const raw=document.getElementById('jobSkills')?.value||'';
  const skills=[...SkillExtractor.extract(raw)];
  const map=new Map();
  for(const s of skills) {
    const sel=document.querySelector(`input[name="w_${s}"]:checked`);
    map.set(s, sel ? parseInt(sel.value) : 1);
  }
  return map;
}

/* ─────────────────────────────────────────────────────────────────
   JOBS CRUD
   ───────────────────────────────────────────────────────────────── */
function addJob() {
  clearErrors('jobTitleErr','jobSkillsErr');
  const title=(document.getElementById('jobTitle')?.value||'').trim();
  const raw=(document.getElementById('jobSkills')?.value||'').trim();
  const useWeighted=document.getElementById('useWeightedSkills')?.checked;
  let valid=true;
  if(!title){setError('jobTitleErr','Job title is required');valid=false;}
  if(!raw){setError('jobSkillsErr','At least one skill is required');valid=false;}
  if(!valid) return;

  const skills=SkillExtractor.extract(raw);
  const weightedSkills=useWeighted ? getWeightedSkills() : null;

  if (_editJobId) {
    // Update existing
    const job=Store.jobs.find(j=>j.id===_editJobId);
    if(job){ job.title=title; job.skills=skills; job.weightedSkills=weightedSkills; }
    logActivity(`Job updated: "${esc(title)}"`);
    toast(`Job "${esc(title)}" updated`);
    cancelJobEdit();
  } else {
    Store.jobs.push({id:Date.now(),title,skills,weightedSkills});
    logActivity(`Job created: "${esc(title)}" (${skills.size} skills)`);
    toast(`Job "${esc(title)}" added — ${skills.size} skills`);
  }

  document.getElementById('jobTitle').value='';
  document.getElementById('jobSkills').value='';
  if(document.getElementById('useWeightedSkills')) document.getElementById('useWeightedSkills').checked=false;
  if(document.getElementById('weightedPanel')) document.getElementById('weightedPanel').style.display='none';
  saveToStorage(); renderJobsList(); updateStats();
}

function editJob(id) {
  const job=Store.jobs.find(j=>j.id===id); if(!job) return;
  _editJobId=id;
  document.getElementById('jobTitle').value=job.title;
  document.getElementById('jobSkills').value=[...job.skills].join(', ');
  document.getElementById('jobFormTitle').textContent='Edit Job';
  document.getElementById('jobSaveBtn').textContent='Update Job';
  document.getElementById('jobCancelEdit').style.display='';
  document.getElementById('jobTitle').scrollIntoView({behavior:'smooth'});
}
function cancelJobEdit() {
  _editJobId=null;
  document.getElementById('jobTitle').value='';
  document.getElementById('jobSkills').value='';
  document.getElementById('jobFormTitle').textContent='Create Job Position';
  document.getElementById('jobSaveBtn').textContent='Save Job';
  document.getElementById('jobCancelEdit').style.display='none';
}

function deleteJob(id) {
  if(!confirm('Delete this job?')) return;
  Store.jobs=Store.jobs.filter(j=>j.id!==id);
  saveToStorage(); renderJobsList(); updateStats();
  toast('Job removed','error'); logActivity('Job deleted');
}

function renderJobsList() {
  const el=document.getElementById('jobs-list'); if(!el) return;
  const countEl=document.getElementById('jobs-count');
  if(countEl) countEl.textContent=`${Store.jobs.length} position${Store.jobs.length!==1?'s':''}`;
  if(!Store.jobs.length){
    el.innerHTML=`<div class="empty-state"><div class="empty-state__icon">💼</div><h3>No jobs yet</h3><p>Create a job above or pick a template.</p></div>`;
    return;
  }
  el.innerHTML=Store.jobs.map(j=>`
    <div class="list-row">
      <div style="flex:1;min-width:0">
        <div class="list-row__title">${esc(j.title)}${j.weightedSkills?'<span class="badge-weighted">weighted</span>':''}</div>
        <div class="skill-tags" style="margin-top:6px">${[...j.skills].map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>
      </div>
      <div class="list-row__actions">
        <button class="btn btn--ghost btn--sm" onclick="editJob(${j.id})" title="Edit job" aria-label="Edit ${esc(j.title)}">✏️</button>
        <button class="btn btn--danger btn--sm" onclick="deleteJob(${j.id})" title="Delete job" aria-label="Delete ${esc(j.title)}">🗑</button>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   CANDIDATES CRUD
   ───────────────────────────────────────────────────────────────── */
function addCandidate() {
  clearErrors('candNameErr','candSkillsErr');
  const name=(document.getElementById('candName')?.value||'').trim();
  const raw=(document.getElementById('candSkills')?.value||'').trim();
  let valid=true;
  if(!name){setError('candNameErr','Name is required');valid=false;}
  if(!raw){setError('candSkillsErr','At least one skill is required');valid=false;}
  if(!valid) return;

  const skills=SkillExtractor.extract(raw);

  if (_editCandId) {
    const cand=Store.candidates.find(c=>c.id===_editCandId);
    if(cand){ cand.name=name; cand.skills=skills; }
    logActivity(`Candidate updated: "${esc(name)}"`);
    toast(`Candidate "${esc(name)}" updated`);
    cancelCandEdit();
  } else {
    Store.candidates.push({id:Date.now(),name,skills,starred:false,notes:''});
    logActivity(`Candidate added: "${esc(name)}" (${skills.size} skills)`);
    toast(`"${esc(name)}" added — ${skills.size} skills`);
  }

  document.getElementById('candName').value='';
  document.getElementById('candSkills').value='';
  saveToStorage(); renderCandidatesList(); updateStats();
}

function editCandidate(id) {
  const c=Store.candidates.find(c=>c.id===id); if(!c) return;
  _editCandId=id;
  document.getElementById('candName').value=c.name;
  document.getElementById('candSkills').value=[...c.skills].join(', ');
  document.getElementById('candFormTitle').textContent='Edit Candidate';
  document.getElementById('candSaveBtn').textContent='Update Candidate';
  document.getElementById('candCancelEdit').style.display='';
  document.getElementById('candName').scrollIntoView({behavior:'smooth'});
}
function cancelCandEdit() {
  _editCandId=null;
  document.getElementById('candName').value='';
  document.getElementById('candSkills').value='';
  document.getElementById('candFormTitle').textContent='Add Candidate Manually';
  document.getElementById('candSaveBtn').textContent='Add Candidate';
  document.getElementById('candCancelEdit').style.display='none';
}

function deleteCandidate(id) {
  if(!confirm('Delete this candidate?')) return;
  Store.candidates=Store.candidates.filter(c=>c.id!==id);
  saveToStorage(); renderCandidatesList(); updateStats();
  toast('Candidate removed','error'); logActivity('Candidate deleted');
}

function toggleStar(id) {
  const c=Store.candidates.find(c=>c.id===id); if(!c) return;
  c.starred=!c.starred;
  saveToStorage(); renderCandidatesList(); updateStats();
  toast(c.starred?'⭐ Added to shortlist':'Removed from shortlist');
  logActivity(`${c.starred?'Starred':'Unstarred'}: "${esc(c.name)}"`);
}

function openNotes(id) {
  const c=Store.candidates.find(c=>c.id===id); if(!c) return;
  document.getElementById('notesCandId').value=id;
  document.getElementById('notesTextarea').value=c.notes||'';
  document.getElementById('notesMTitle').textContent=`Notes — ${esc(c.name)}`;
  openModal('notesModal');
}
function saveNotes() {
  const id=parseInt(document.getElementById('notesCandId')?.value);
  const text=document.getElementById('notesTextarea')?.value||'';
  const c=Store.candidates.find(c=>c.id===id); if(!c) return;
  c.notes=text;
  saveToStorage(); renderCandidatesList();
  closeModal('notesModal'); toast('Notes saved');
}

// Filter candidates
let _filterQuery='', _filterSkill='', _filterStatus='';
function filterCandidates() {
  _filterQuery=(document.getElementById('filterSearch')?.value||'').toLowerCase();
  _filterSkill=(document.getElementById('filterSkill')?.value||'').toLowerCase();
  _filterStatus=document.getElementById('filterStatus')?.value||'';
  renderCandidatesList();
}

function renderCandidatesList() {
  const el=document.getElementById('candidates-list'); if(!el) return;
  let list=Store.candidates;
  if(_filterQuery) list=list.filter(c=>c.name.toLowerCase().includes(_filterQuery));
  if(_filterSkill) list=list.filter(c=>[...c.skills].some(s=>s.includes(_filterSkill)));
  if(_filterStatus==='starred') list=list.filter(c=>c.starred);

  const countEl=document.getElementById('candidates-count');
  if(countEl) countEl.textContent=`${list.length} of ${Store.candidates.length}`;

  if(!list.length) {
    el.innerHTML=`<div class="empty-state"><div class="empty-state__icon">👥</div><h3>${Store.candidates.length?'No matches':'No candidates'}</h3><p>${Store.candidates.length?'Try adjusting filters.':'Add candidates above or upload a PDF.'}</p></div>`;
    return;
  }
  el.innerHTML=list.map(c=>`
    <div class="list-row ${c.starred?'list-row--starred':''}">
      <div style="flex:1;min-width:0">
        <div class="list-row__title">
          ${c.starred?'⭐ ':''}${esc(c.name)}
          <span style="font-size:0.75rem;color:var(--text-faint);font-weight:400">(${c.skills.size} skills)</span>
          ${c.notes?'<span class="note-indicator" title="Has notes">📝</span>':''}
        </div>
        <div class="skill-tags" style="margin-top:6px">${[...c.skills].map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>
        ${c.notes?`<div class="cand-note">${esc(c.notes.slice(0,80))}${c.notes.length>80?'…':''}</div>`:''}
      </div>
      <div class="list-row__actions">
        <button class="btn btn--ghost btn--sm" onclick="toggleStar(${c.id})" title="${c.starred?'Remove from shortlist':'Add to shortlist'}" aria-label="${c.starred?'Unstar':'Star'} ${esc(c.name)}">${c.starred?'⭐':'☆'}</button>
        <button class="btn btn--ghost btn--sm" onclick="openNotes(${c.id})" title="Notes" aria-label="Notes for ${esc(c.name)}">📝</button>
        <button class="btn btn--ghost btn--sm" onclick="editCandidate(${c.id})" title="Edit" aria-label="Edit ${esc(c.name)}">✏️</button>
        <button class="btn btn--danger btn--sm" onclick="deleteCandidate(${c.id})" title="Delete" aria-label="Delete ${esc(c.name)}">🗑</button>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   MATCHING ENGINE
   ───────────────────────────────────────────────────────────────── */
function populateJobDropdown() {
  const sel=document.getElementById('matchJob'); if(!sel) return;
  sel.innerHTML='<option value="">— choose a job —</option>'+
    Store.jobs.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('');
}

async function runMatch() {
  const jobId=parseInt(document.getElementById('matchJob')?.value);
  const threshold=parseInt(document.getElementById('matchThreshold')?.value)||0;
  const topK=parseInt(document.getElementById('topKInput')?.value)||10;
  const useGraph=document.getElementById('useGraphScore')?.checked;
  const showHeap=document.getElementById('showHeapAnim')?.checked;

  if(!jobId){toast('Select a job first','error');return;}
  const job=Store.jobs.find(j=>j.id===jobId);
  if(!job) return;
  if(!Store.candidates.length){toast('Add at least one candidate','error');return;}

  let results;
  try {
    const resp=await fetch(`http://localhost:8080/api/match?jobId=${jobId}`,{signal:AbortSignal.timeout(2000)});
    if(resp.ok){
      const data=await resp.json();
      results=data.filter(r=>r.score>=threshold).map(r=>({
        candidate:{id:r.candidate.id,name:r.candidate.name,skills:new Set(r.candidate.skills)},
        score:r.score,matched:r.matched,missing:r.missing,partial:[],
      }));
      const trace=[`=== TalentMatch Algorithm Trace (Java Backend) ===`,`Job: "${job.title}"`,
        `[Step 1] HashMap extraction`,`[Step 2] Edit Distance scoring — ${data.length} candidates evaluated`,
        `[Step 3] Merge Sort O(n log n) — threshold=${threshold}%`,`[Done] ✓`].join('\n');
      showAlgoTrace(trace);
    } else { throw new Error(); }
  } catch(_) {
    results = runJSMatch(job, threshold, useGraph);
  }

  // Apply Max-Heap Top-K
  let topResults;
  if (typeof MaxHeap !== 'undefined') {
    const heap=new MaxHeap();
    topResults=heap.topK(results,topK);
    if(showHeap) renderHeapViz(heap);
  } else {
    topResults=CandidateRanker.topK(results,topK);
  }

  Store.lastResults=topResults;
  Store.lastJob=job;
  saveToStorage();
  renderMatchResults(job,topResults);
  updateStats();
  logActivity(`Matched "${esc(job.title)}" → ${topResults.length} ranked`);

  // Confetti for top match
  if(topResults.length>0 && topResults[0].score>=90) launchConfetti();
}

function runJSMatch(job, threshold, useGraph=false) {
  const trace=buildAlgoTrace(job,threshold,useGraph);
  showAlgoTrace(trace);

  const raw=Store.candidates.map(c=>{
    let res;
    if(useGraph && typeof SkillGraph!=='undefined') {
      res=SkillGraph.scoreWithGraph(c.skills,job.skills);
    } else if(job.weightedSkills && typeof WeightedScorer!=='undefined') {
      const ws=WeightedScorer.score(c.skills,job.weightedSkills);
      res={score:ws.score,matched:ws.matched.map(m=>m.skill),missing:ws.missing.map(m=>m.skill),partial:[]};
    } else {
      const plain=EditDistanceScorer.score(c.skills,job.skills);
      res={...plain,partial:[]};
    }
    return {candidate:c,score:res.score,matched:res.matched,missing:res.missing,partial:res.partial||[]};
  });
  return CandidateRanker.sort(raw.filter(r=>r.score>=threshold));
}

function buildAlgoTrace(job,threshold,useGraph) {
  const algo=useGraph?'BFS Graph Scoring':job.weightedSkills?'Weighted Edit Distance':'Edit Distance DP';
  const lines=[`=== TalentMatch Algorithm Trace (Browser JS) ===`,``,
    `[Step 1] SkillExtractor.extract() — HashMap Deduplication O(n)`,
    `  Job "${job.title}": { ${[...job.skills].join(', ')} }  (${job.skills.size} required skills)`,
    `  ${job.weightedSkills?'Weighted scoring enabled — must-have × 3, nice-to-have × 1':'Standard equal-weight scoring'}`,``,
    `[Step 2] ${algo} — per candidate`,
    `  Algorithm : Wagner-Fischer DP  dp[i][j] = 1 + min(replace, delete, insert)`,
    `  Fuzzy threshold : normalized edit distance ≤ 0.35`,
    `  Results:`];
  Store.candidates.forEach(c=>{
    const {score,matched}=EditDistanceScorer.score(c.skills,job.skills);
    lines.push(`    ${c.name.padEnd(16)}: matched=${matched.length}/${job.skills.size}  score=${score}%`);
  });
  lines.push(``,`[Step 3] CandidateRanker.sort() — Merge Sort O(n log n)`,
    `  Sorted ${Store.candidates.length} candidates descending · threshold=${threshold}%`,``,`[Done] ✓`);
  return lines.join('\n');
}

function showAlgoTrace(text) {
  const card=document.getElementById('algo-trace-card');
  const trace=document.getElementById('algo-trace');
  if(card&&trace){card.style.display='';trace.textContent=text;}
}

/* ─────────────────────────────────────────────────────────────────
   MAX-HEAP VISUALIZATION
   ───────────────────────────────────────────────────────────────── */
let _heapSteps=[], _heapStepIdx=0, _heapPlayTimer=null;
function renderHeapViz(heap) {
  _heapSteps=heap.steps||[];
  _heapStepIdx=0;
  document.getElementById('heap-viz-card').style.display='';
  drawHeapStep(_heapStepIdx);
}
function stepHeap() {
  if(_heapStepIdx<_heapSteps.length-1) { _heapStepIdx++; drawHeapStep(_heapStepIdx); }
}
function playHeap() {
  if(_heapPlayTimer) { clearInterval(_heapPlayTimer); _heapPlayTimer=null; return; }
  _heapPlayTimer=setInterval(()=>{
    if(_heapStepIdx>=_heapSteps.length-1){clearInterval(_heapPlayTimer);_heapPlayTimer=null;return;}
    _heapStepIdx++; drawHeapStep(_heapStepIdx);
  },600);
}
function drawHeapStep(idx) {
  const svg=document.getElementById('heapSvg'); if(!svg) return;
  const step=_heapSteps[idx]||{heap:[]};
  const info=document.getElementById('heapStepInfo');
  if(info) info.textContent=`Step ${idx+1}/${_heapSteps.length} — ${step.type||''} ${step.value!=null?step.value:''}`;

  const nodes=step.heap||[];
  const W=600,H=260;
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.innerHTML='';
  if(!nodes.length) return;

  const positions=[];
  const levels=Math.ceil(Math.log2(nodes.length+1));
  for(let i=0;i<nodes.length;i++){
    const level=Math.floor(Math.log2(i+1));
    const posInLevel=i-((1<<level)-1);
    const totalInLevel=1<<level;
    const x=W/(totalInLevel+1)*(posInLevel+1);
    const y=30+level*(H-40)/Math.max(levels-1,1);
    positions.push({x,y,i});
  }

  // Draw edges
  for(let i=1;i<nodes.length;i++){
    const p=positions[Math.floor((i-1)/2)], c=positions[i];
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);
    line.setAttribute('x2',c.x);line.setAttribute('y2',c.y);
    line.setAttribute('stroke','var(--border)');line.setAttribute('stroke-width','1.5');
    svg.appendChild(line);
  }
  // Draw nodes
  nodes.forEach((node,i)=>{
    const {x,y}=positions[i];
    const isRoot=i===0, isHighlighted=(step.type==='swap'&&(i===step.i||i===step.j));
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',20);
    circle.setAttribute('fill',isRoot?'var(--primary)':isHighlighted?'var(--warn)':'var(--bg-surface)');
    circle.setAttribute('stroke',isRoot?'var(--primary)':'var(--border)');circle.setAttribute('stroke-width','2');
    const text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x',x);text.setAttribute('y',y+4);
    text.setAttribute('text-anchor','middle');text.setAttribute('font-size','11');
    text.setAttribute('fill',isRoot?'#fff':'var(--text)');text.setAttribute('font-weight','600');
    text.textContent=typeof node==='object'?node.score:node;
    g.appendChild(circle);g.appendChild(text);svg.appendChild(g);
  });
}

/* ─────────────────────────────────────────────────────────────────
   MATCH RESULTS TABLE
   ───────────────────────────────────────────────────────────────── */
let _matchSortKey='rank', _matchSortDir=1;
let _matchPage=0, _matchPageSize=8;
let _matchResultsSnapshot=[];

function sortTable(key) {
  if(_matchSortKey===key) _matchSortDir*=-1;
  else { _matchSortKey=key; _matchSortDir=1; }
  renderMatchResults(Store.lastJob, Store.lastResults);
}

function renderMatchResults(job,results) {
  Store.lastResults=results;
  _matchResultsSnapshot=[...results];
  const card=document.getElementById('match-results-card');
  const tbody=document.getElementById('match-tbody');
  const label=document.getElementById('match-job-label');
  if(!card||!tbody) return;
  card.style.display='';
  if(label) label.textContent=job?`for: ${esc(job.title)}`:'';
  if(!results.length){
    tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No candidates meet the threshold.</td></tr>`;
    return;
  }

  // Sort
  let sorted=[...results];
  if(_matchSortKey==='name') sorted.sort((a,b)=>_matchSortDir*a.candidate.name.localeCompare(b.candidate.name));
  else if(_matchSortKey==='score') sorted.sort((a,b)=>_matchSortDir*(b.score-a.score));
  else sorted=[...results]; // rank = original order

  // Pagination
  const total=sorted.length;
  const pages=Math.ceil(total/_matchPageSize);
  _matchPage=Math.min(_matchPage,pages-1);
  const slice=sorted.slice(_matchPage*_matchPageSize,(_matchPage+1)*_matchPageSize);

  tbody.innerHTML=slice.map((r,i)=>{
    const globalRank=_matchPage*_matchPageSize+i+1;
    const cls=scoreClass(r.score);
    const rankCls=globalRank<=3?`rank-${globalRank}`:'';
    const st=statusLabel(r.score);
    const gapMsg=r.missing.length?`Add: ${r.missing.slice(0,3).map(s=>esc(s)).join(', ')}${r.missing.length>3?'…':''}`:'Perfect match!';
    const partialHtml=(r.partial||[]).map(p=>`<span class="tag partial" title="BFS partial credit">~${esc(p.skill)}</span>`).join('');
    return `<tr>
      <td><span class="rank-badge ${rankCls}">${globalRank}</span></td>
      <td><strong>${esc(r.candidate.name)}</strong></td>
      <td>
        <div class="score-bar-wrap">
          <div class="score-bar"><div class="score-bar__fill ${cls}" style="width:${r.score}%"></div></div>
          <span class="score-val ${cls}">${r.score}%</span>
        </div>
      </td>
      <td><div class="skill-tags">${tagsHtml(r.matched,'matched')}${partialHtml}</div></td>
      <td><div class="skill-tags">${tagsHtml(r.missing,'missing')}</div></td>
      <td><span class="skill-gap-tip">${gapMsg}</span></td>
      <td><span class="status ${st.cls}"><span class="status-dot"></span>${st.label}</span></td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn--ghost btn--sm" onclick="toggleStar(${r.candidate.id})" title="Shortlist" aria-label="Toggle shortlist for ${esc(r.candidate.name)}">⭐</button>
          <button class="btn btn--ghost btn--sm" onclick="openNotes(${r.candidate.id})" title="Notes" aria-label="Notes for ${esc(r.candidate.name)}">📝</button>
          <button class="btn btn--ghost btn--sm" onclick="showRadarChart(${r.candidate.id})" title="Radar chart" aria-label="Radar chart for ${esc(r.candidate.name)}">📊</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Pagination controls
  const pag=document.getElementById('matchPagination');
  if(pag&&pages>1){
    pag.innerHTML=`<div class="pag-info">Showing ${_matchPage*_matchPageSize+1}–${Math.min((_matchPage+1)*_matchPageSize,total)} of ${total}</div>`+
      `<div class="pag-btns">`+
      (Array.from({length:pages},(_,p)=>`<button class="pag-btn ${p===_matchPage?'active':''}" onclick="_matchPage=${p};renderMatchResults(Store.lastJob,Store.lastResults)">${p+1}</button>`).join(''))+
      `</div>`;
  } else if(pag) pag.innerHTML='';

  renderOverviewResults(job,results);
}

/* ─────────────────────────────────────────────────────────────────
   OVERVIEW
   ───────────────────────────────────────────────────────────────── */
function renderOverview() {
  renderOverviewResults(Store.lastJob,Store.lastResults);
  updateStats();
  renderActivityLog();
}

function renderOverviewResults(job,results) {
  const wrap=document.getElementById('results-table-wrap'); if(!wrap) return;
  if(!results||!results.length){
    wrap.innerHTML=`<div class="empty-state"><div class="empty-state__icon">🎯</div><h3>No matches yet</h3><p>Go to <strong>Run Match</strong> to evaluate candidates.</p></div>`;
    return;
  }
  wrap.innerHTML=`
    <div style="margin-bottom:14px;font-size:0.85rem;color:var(--text-muted)">Job: <strong style="color:var(--text)">${job?esc(job.title):'Last run'}</strong></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Rank</th><th>Candidate</th><th>Score</th><th>Status</th></tr></thead>
      <tbody>${results.slice(0,6).map((r,i)=>{
        const cls=scoreClass(r.score), st=statusLabel(r.score);
        return `<tr>
          <td><span class="rank-badge ${i<3?'rank-'+(i+1):''}">${i+1}</span></td>
          <td><strong>${esc(r.candidate.name)}</strong></td>
          <td><div class="score-bar-wrap">
            <div class="score-bar"><div class="score-bar__fill ${cls}" style="width:${r.score}%"></div></div>
            <span class="score-val ${cls}">${r.score}%</span>
          </div></td>
          <td><span class="status ${st.cls}"><span class="status-dot"></span>${st.label}</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

/* ─────────────────────────────────────────────────────────────────
   STATS
   ───────────────────────────────────────────────────────────────── */
function updateStats() {
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('stat-candidates',Store.candidates.length);
  set('stat-jobs',Store.jobs.length);
  set('stat-shortlisted',Store.candidates.filter(c=>c.starred).length);
  if(Store.lastResults.length){
    const top=Store.lastResults[0];
    set('stat-top',top.score+'%');
    set('stat-top-name',top.candidate.name);
  }
}

function clearResults() {
  Store.lastResults=[]; Store.lastJob=null;
  const c=document.getElementById('match-results-card');
  const t=document.getElementById('algo-trace-card');
  const h=document.getElementById('heap-viz-card');
  if(c)c.style.display='none';if(t)t.style.display='none';if(h)h.style.display='none';
}

/* ─────────────────────────────────────────────────────────────────
   COMPARE CANDIDATES
   ───────────────────────────────────────────────────────────────── */
function populateCompareDropdowns() {
  const opts='<option value="">— select —</option>'+Store.candidates.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  ['cmpA','cmpB','cmpC'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=opts;});
  const jOpts='<option value="">— select job —</option>'+Store.jobs.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('');
  const jel=document.getElementById('cmpJob');if(jel)jel.innerHTML=jOpts;
}

function runComparison() {
  const aId=parseInt(document.getElementById('cmpA')?.value);
  const bId=parseInt(document.getElementById('cmpB')?.value);
  const cId=parseInt(document.getElementById('cmpC')?.value)||null;
  const jobId=parseInt(document.getElementById('cmpJob')?.value);
  if(!aId||!bId){toast('Select at least two candidates','error');return;}
  if(!jobId){toast('Select a job','error');return;}
  const job=Store.jobs.find(j=>j.id===jobId);
  const selected=[aId,bId,cId].filter(Boolean).map(id=>Store.candidates.find(c=>c.id===id)).filter(Boolean);
  if(selected.length<2){toast('Could not find selected candidates','error');return;}

  const results=selected.map(c=>{
    const {score,matched,missing}=EditDistanceScorer.score(c.skills,job.skills);
    return {candidate:c,score,matched,missing};
  });
  const winner=results.reduce((best,r)=>r.score>best.score?r:best,results[0]);

  const out=document.getElementById('compare-results'); if(!out) return;
  out.innerHTML=`
    <div class="compare-grid" style="grid-template-columns:repeat(${results.length},1fr)">
      ${results.map(r=>{
        const isWinner=r.candidate.id===winner.candidate.id;
        return `<div class="compare-col ${isWinner?'compare-col--winner':''}">
          ${isWinner?'<div class="winner-badge">🏆 Best Match</div>':''}
          <div class="compare-name">${esc(r.candidate.name)}</div>
          <div class="compare-score score-val ${scoreClass(r.score)}">${r.score}%</div>
          <div class="score-bar" style="margin:10px 0 16px"><div class="score-bar__fill ${scoreClass(r.score)}" style="width:${r.score}%"></div></div>
          <div style="margin-bottom:6px;font-size:0.78rem;font-weight:600;color:var(--success-text)">✅ Matched (${r.matched.length})</div>
          <div class="skill-tags">${tagsHtml(r.matched,'matched')}</div>
          <div style="margin:12px 0 6px;font-size:0.78rem;font-weight:600;color:var(--danger-text)">❌ Missing (${r.missing.length})</div>
          <div class="skill-tags">${tagsHtml(r.missing,'missing')}</div>
          ${r.missing.length?`<div class="skill-gap-card">To reach 100%, add: <strong>${r.missing.slice(0,4).map(s=>esc(s)).join(', ')}${r.missing.length>4?'…':''}</strong></div>`:'<div class="skill-gap-card" style="background:var(--success-subtle);color:var(--success-text)">Perfect match! 🎉</div>'}
        </div>`;
      }).join('')}
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   RADAR CHART
   ───────────────────────────────────────────────────────────────── */
let _radarChart=null;
function showRadarChart(candId) {
  const job=Store.lastJob; if(!job){toast('Run a match first','error');return;}
  const cand=Store.candidates.find(c=>c.id===candId); if(!cand) return;
  const {matched,missing}=EditDistanceScorer.score(cand.skills,job.skills);
  const labels=[...job.skills];
  const data=labels.map(s=>matched.includes(s)?1:0);
  document.getElementById('radarMTitle').textContent=`Radar — ${esc(cand.name)}`;
  openModal('radarModal');
  const ctx=document.getElementById('radarChartCanvas')?.getContext('2d');
  if(!ctx) return;
  if(_radarChart) _radarChart.destroy();
  _radarChart=new Chart(ctx,{type:'radar',data:{labels,datasets:[
    {label:cand.name,data,backgroundColor:'rgba(36,118,99,0.2)',borderColor:'var(--primary)',pointBackgroundColor:'var(--primary)',borderWidth:2},
    {label:'Job Requirement',data:labels.map(()=>1),backgroundColor:'rgba(120,120,120,0.05)',borderColor:'var(--border)',borderWidth:1,borderDash:[4,4]},
  ]},options:{scales:{r:{min:0,max:1,ticks:{display:false}}},plugins:{legend:{position:'bottom'}}}});
}

/* ─────────────────────────────────────────────────────────────────
   ANALYTICS
   ───────────────────────────────────────────────────────────────── */
let _chartInstances={};
function destroyChart(id){if(_chartInstances[id]){_chartInstances[id].destroy();delete _chartInstances[id];}}

function renderAnalytics() {
  // Score distribution
  if(!Store.lastResults.length){
    ['scoreDistChart','missingSkillsChart','topSkillsChart'].forEach(id=>{
      const c=document.getElementById(id); if(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}
    }); return;
  }

  // Score buckets: 0-25,26-50,51-75,76-100
  const buckets=[0,0,0,0];
  Store.lastResults.forEach(r=>{
    if(r.score<=25)buckets[0]++;
    else if(r.score<=50)buckets[1]++;
    else if(r.score<=75)buckets[2]++;
    else buckets[3]++;
  });
  destroyChart('scoreDistChart');
  const sdCtx=document.getElementById('scoreDistChart')?.getContext('2d');
  if(sdCtx) _chartInstances['scoreDistChart']=new Chart(sdCtx,{type:'bar',data:{
    labels:['0–25%','26–50%','51–75%','76–100%'],
    datasets:[{label:'Candidates',data:buckets,backgroundColor:['#ef4444','#f59e0b','#3b82f6','#10b981']}]
  },options:{responsive:true,plugins:{legend:{display:false}}}});

  // Missing skills
  const missingCount={};
  Store.lastResults.forEach(r=>r.missing.forEach(s=>{missingCount[s]=(missingCount[s]||0)+1;}));
  const topMissing=Object.entries(missingCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  destroyChart('missingSkillsChart');
  const msCtx=document.getElementById('missingSkillsChart')?.getContext('2d');
  if(msCtx) _chartInstances['missingSkillsChart']=new Chart(msCtx,{type:'bar',data:{
    labels:topMissing.map(e=>e[0]),
    datasets:[{label:'Missing in N candidates',data:topMissing.map(e=>e[1]),backgroundColor:'rgba(239,68,68,0.7)'}]
  },options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}}}});

  // Top skills in pool
  const skillCount={};
  Store.candidates.forEach(c=>c.skills.forEach(s=>{skillCount[s]=(skillCount[s]||0)+1;}));
  const topSkills=Object.entries(skillCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  destroyChart('topSkillsChart');
  const tsCtx=document.getElementById('topSkillsChart')?.getContext('2d');
  if(tsCtx) _chartInstances['topSkillsChart']=new Chart(tsCtx,{type:'doughnut',data:{
    labels:topSkills.map(e=>e[0]),
    datasets:[{data:topSkills.map(e=>e[1]),backgroundColor:['#247663','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#14b8a6']}]
  },options:{responsive:true,plugins:{legend:{position:'right'}}}});
}

function runSortComparison() {
  if(!Store.lastResults.length){toast('Run a match first to get scores','error');return;}
  if(typeof SortComparison==='undefined'){toast('SortComparison module not loaded','error');return;}
  const comparisons=SortComparison.runAll(Store.lastResults);
  const details=comparisons.map(c=>`<strong>${c.algo}</strong>: ${c.steps} comparisons, ${c.time}ms`).join(' | ');
  const det=document.getElementById('sortRaceDetails'); if(det) det.innerHTML=details;
  destroyChart('sortRaceChart');
  const ctx=document.getElementById('sortRaceChart')?.getContext('2d');
  if(ctx) _chartInstances['sortRaceChart']=new Chart(ctx,{type:'bar',data:{
    labels:comparisons.map(c=>c.algo),
    datasets:[
      {label:'Comparisons',data:comparisons.map(c=>c.steps),backgroundColor:'rgba(36,118,99,0.8)'},
      {label:'Time (μs×100)',data:comparisons.map(c=>Math.round(parseFloat(c.time)*100)),backgroundColor:'rgba(59,130,246,0.6)'},
    ]
  },options:{responsive:true,plugins:{legend:{position:'top'}}}});
}

/* ─────────────────────────────────────────────────────────────────
   DP TABLE VISUALIZER
   ───────────────────────────────────────────────────────────────── */
let _dpSteps=[], _dpIdx=0, _dpPlayTimer=null;
function startDPViz() {
  const a=document.getElementById('vizWord1')?.value||'javascript';
  const b=document.getElementById('vizWord2')?.value||'java';
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>new Array(n+1).fill(null));
  _dpSteps=[];
  for(let i=0;i<=m;i++){dp[i][0]=i;_dpSteps.push({i,j:0,val:i,dp:dp.map(r=>[...r])});}
  for(let j=1;j<=n;j++){dp[0][j]=j;_dpSteps.push({i:0,j,val:j,dp:dp.map(r=>[...r])});}
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
    _dpSteps.push({i,j,val:dp[i][j],dp:dp.map(r=>[...r]),match:a[i-1]===b[j-1]});
  }
  _dpIdx=0;
  document.getElementById('dpStepBtn').disabled=false;
  document.getElementById('dpPlayBtn').disabled=false;
  renderDPTable(a,b,_dpSteps[0]);
}

function renderDPTable(a,b,step) {
  const container=document.getElementById('dpVizContainer'); if(!container||!_dpSteps.length) return;
  const dp=step.dp;
  const m=a.length,n=b.length;
  let html=`<table class="dp-table"><thead><tr><th></th><th>ε</th>`;
  for(const ch of b) html+=`<th>${esc(ch)}</th>`;
  html+=`</tr></thead><tbody>`;
  for(let i=0;i<=m;i++){
    html+=`<tr><th>${i===0?'ε':esc(a[i-1])}</th>`;
    for(let j=0;j<=n;j++){
      const v=dp[i][j];
      const isActive=(i===step.i&&j===step.j);
      const cls=isActive?'dp-cell-active':v===null?'dp-cell-empty':'dp-cell';
      html+=`<td class="${cls}">${v!==null?v:''}</td>`;
    }
    html+=`</tr>`;
  }
  html+=`</tbody></table>`;
  container.innerHTML=html;
  const info=document.getElementById('dpVizInfo');
  if(info&&step.i>0&&step.j>0){
    const match=step.match;
    info.textContent=`Cell [${step.i}][${step.j}]: "${a[step.i-1]}" vs "${b[step.j-1]}" — ${match?'match → copy diagonal':'no match → 1 + min(replace,delete,insert)'} = ${step.val}`;
  }
}
function stepDPViz(){
  if(!_dpSteps.length) return;
  const a=document.getElementById('vizWord1')?.value||'javascript';
  const b=document.getElementById('vizWord2')?.value||'java';
  _dpIdx=Math.min(_dpIdx+1,_dpSteps.length-1);
  renderDPTable(a,b,_dpSteps[_dpIdx]);
}
function autoPlayDP(){
  if(_dpPlayTimer){clearInterval(_dpPlayTimer);_dpPlayTimer=null;return;}
  const a=document.getElementById('vizWord1')?.value||'javascript';
  const b=document.getElementById('vizWord2')?.value||'java';
  _dpPlayTimer=setInterval(()=>{
    if(_dpIdx>=_dpSteps.length-1){clearInterval(_dpPlayTimer);_dpPlayTimer=null;return;}
    _dpIdx++;renderDPTable(a,b,_dpSteps[_dpIdx]);
  },180);
}

/* ─────────────────────────────────────────────────────────────────
   MERGE SORT VISUALIZER
   ───────────────────────────────────────────────────────────────── */
let _msFrames=[], _msIdx=0, _msPlayTimer=null;
function startMergeSortViz() {
  const scores=Store.lastResults.length ? Store.lastResults.map(r=>r.score) : [72,45,88,33,61,95,50,78];
  _msFrames=[{arr:[...scores],msg:'Initial array',highlight:[]}];
  const arr=[...scores];
  function msFrames(a,lo,hi,depth) {
    if(lo>=hi)return;
    const mid=Math.floor((lo+hi)/2);
    msFrames(a,lo,mid,depth+1);
    msFrames(a,mid+1,hi,depth+1);
    // Merge
    const L=a.slice(lo,mid+1),R=a.slice(mid+1,hi+1);
    let i=0,j=0,k=lo;
    while(i<L.length&&j<R.length){
      if(L[i]>=R[j]) a[k++]=L[i++]; else a[k++]=R[j++];
      _msFrames.push({arr:[...a],msg:`Merging [${lo}..${hi}]`,highlight:Array.from({length:hi-lo+1},(_,x)=>lo+x)});
    }
    while(i<L.length){a[k++]=L[i++];_msFrames.push({arr:[...a],msg:`Merging [${lo}..${hi}]`,highlight:Array.from({length:hi-lo+1},(_,x)=>lo+x)});}
    while(j<R.length){a[k++]=R[j++];_msFrames.push({arr:[...a],msg:`Merging [${lo}..${hi}]`,highlight:Array.from({length:hi-lo+1},(_,x)=>lo+x)});}
  }
  msFrames(arr,0,arr.length-1,0);
  _msFrames.push({arr:[...arr],msg:'Sorted! ✓',highlight:Array.from({length:arr.length},(_,i)=>i)});
  _msIdx=0;
  document.getElementById('msStepBtn').disabled=false;
  document.getElementById('msPlayBtn').disabled=false;
  renderMSFrame(_msFrames[0]);
}
function renderMSFrame(frame) {
  const con=document.getElementById('msVizContainer');
  const info=document.getElementById('msVizInfo');
  if(!con) return;
  const max=Math.max(...frame.arr,1);
  const W=60,GAP=6;
  con.innerHTML=`<div style="display:flex;align-items:flex-end;gap:${GAP}px;height:160px;padding:8px">
    ${frame.arr.map((v,i)=>{
      const h=Math.round((v/max)*140);
      const isHL=frame.highlight.includes(i);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span style="font-size:0.7rem;color:var(--text-muted)">${v}</span>
        <div style="width:${W}px;height:${h}px;background:${isHL?'var(--primary)':'var(--border)'};border-radius:4px 4px 0 0;transition:all 0.3s ease"></div>
      </div>`;
    }).join('')}
  </div>`;
  if(info) info.textContent=frame.msg;
}
function stepMergeSort(){
  if(!_msFrames.length)return;
  _msIdx=Math.min(_msIdx+1,_msFrames.length-1);
  renderMSFrame(_msFrames[_msIdx]);
}
function autoPlayMergeSort(){
  if(_msPlayTimer){clearInterval(_msPlayTimer);_msPlayTimer=null;return;}
  _msPlayTimer=setInterval(()=>{
    if(_msIdx>=_msFrames.length-1){clearInterval(_msPlayTimer);_msPlayTimer=null;return;}
    _msIdx++;renderMSFrame(_msFrames[_msIdx]);
  },200);
}
function populateVizDropdowns(){}

/* ─────────────────────────────────────────────────────────────────
   SKILL GRAPH (BFS visualization)
   ───────────────────────────────────────────────────────────────── */
function renderSkillGraph() {
  if(typeof SkillGraph==='undefined'){toast('SkillGraph module not loaded','error');return;}
  const root=(document.getElementById('graphSkillInput')?.value||'react').toLowerCase().trim();
  const neighbors=SkillGraph.edges[root]||[];
  const svg=document.getElementById('skillGraphSvg'); if(!svg) return;
  const W=svg.clientWidth||600,H=300;
  svg.innerHTML='';

  const nodes=[{id:root,label:root,root:true},...neighbors.map(n=>({id:n,label:n,root:false}))];
  const total=nodes.length;
  const cx=W/2,cy=H/2,r=Math.min(cx,cy)-50;

  const pos={};
  pos[root]={x:cx,y:cy};
  neighbors.forEach((n,i)=>{
    const angle=(2*Math.PI/neighbors.length)*i-Math.PI/2;
    pos[n]={x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle)};
  });

  // Edges
  neighbors.forEach(n=>{
    const p=pos[root],c2=pos[n];
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    ['x1','y1','x2','y2'].forEach((a,i)=>line.setAttribute(a,[p.x,p.y,c2.x,c2.y][i]));
    line.setAttribute('stroke','var(--border)');line.setAttribute('stroke-width','1.5');
    line.setAttribute('stroke-dasharray','4,3');
    svg.appendChild(line);
    // Label on edge
    const ml=document.createElementNS('http://www.w3.org/2000/svg','text');
    ml.setAttribute('x',(p.x+c2.x)/2);ml.setAttribute('y',(p.y+c2.y)/2-6);
    ml.setAttribute('text-anchor','middle');ml.setAttribute('font-size','9');
    ml.setAttribute('fill','var(--text-faint)');ml.textContent='0.5×';
    svg.appendChild(ml);
  });

  // Nodes
  nodes.forEach(n=>{
    const {x,y}=pos[n.id];
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',n.root?30:22);
    circle.setAttribute('fill',n.root?'var(--primary)':'var(--bg-surface)');
    circle.setAttribute('stroke',n.root?'var(--primary)':'var(--border)');circle.setAttribute('stroke-width','2');
    const text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x',x);text.setAttribute('y',y+4);
    text.setAttribute('text-anchor','middle');text.setAttribute('font-size','11');
    text.setAttribute('fill',n.root?'#fff':'var(--text)');text.setAttribute('font-weight','600');
    text.textContent=n.label;
    g.appendChild(circle);g.appendChild(text);svg.appendChild(g);
  });

  const leg=document.getElementById('graphLegend');
  if(leg) leg.innerHTML=`<span style="color:var(--primary)">●</span> Root: "${root}" &nbsp;|&nbsp; <span style="color:var(--text-muted)">●</span> Related skills (BFS depth 1, 0.5× credit) &nbsp;|&nbsp; ${neighbors.length} edges`;
}

/* ─────────────────────────────────────────────────────────────────
   LCS
   ───────────────────────────────────────────────────────────────── */
function runLCS() {
  if(typeof LCSAnalyzer==='undefined'){toast('LCS module not loaded','error');return;}
  const resume=document.getElementById('lcsResume')?.value||'';
  const jd=document.getElementById('lcsJD')?.value||'';
  if(!resume||!jd){toast('Paste both texts first','error');return;}

  const result=LCSAnalyzer.compute(resume,jd);
  const card=document.getElementById('lcsResultsCard'); if(card) card.style.display='';
  const badge=document.getElementById('lcsLengthBadge');
  if(badge) badge.textContent=`LCS length: ${result.lcsLength} words`;
  document.getElementById('lcsCount').textContent=result.lcs.length;
  document.getElementById('lcsResumeHL').innerHTML=LCSAnalyzer.highlightText(resume,result.lcs);
  document.getElementById('lcsJDHL').innerHTML=LCSAnalyzer.highlightText(jd,result.lcs);
  document.getElementById('lcsWords').innerHTML=result.lcs.map(w=>`<span class="tag matched">${esc(w)}</span>`).join('');
}

function loadLCSSample() {
  document.getElementById('lcsResume').value=`I have 3 years of experience in Java and Spring Boot development. Proficient in REST API design and microservices architecture. I use Docker for containerization and have deployed on AWS. Skilled in SQL databases and PostgreSQL. Familiar with Git, Jenkins, and CI/CD pipelines. Strong background in agile methodology and junit testing.`;
  document.getElementById('lcsJD').value=`We are looking for a Senior Java Developer with expertise in Spring Boot and REST API. The ideal candidate will have experience with microservices, Docker, and cloud platforms (AWS preferred). Must know SQL, PostgreSQL, Git, and CI/CD practices. Familiarity with Jenkins, JUnit, and agile development is required.`;
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
   ───────────────────────────────────────────────────────────────── */
function exportCSV() {
  if(!Store.lastResults.length){toast('Run a match first','error');return;}
  const rows=[['Rank','Name','Score','Matched Skills','Missing Skills','Status']];
  Store.lastResults.forEach((r,i)=>{
    const st=statusLabel(r.score);
    rows.push([i+1,r.candidate.name,r.score+'%',r.matched.join(';'),r.missing.join(';'),st.label]);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`talentmatch_results_${Date.now()}.csv`;
  a.click();
  toast('CSV exported');
}

function exportPDFReport() {
  if(!Store.lastResults.length){toast('Run a match first','error');return;}
  const job=Store.lastJob;
  const lines=[
    'TalentMatch — Candidate Ranking Report',
    '========================================',
    `Job: ${job?job.title:'(last run)'}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Candidates evaluated: ${Store.lastResults.length}`,
    '',
    'Ranked Results:',
    '--------------',
    ...Store.lastResults.map((r,i)=>`${i+1}. ${r.candidate.name.padEnd(20)} Score: ${r.score}%   Matched: ${r.matched.join(', ')||'none'}   Missing: ${r.missing.join(', ')||'none'}`),
    '',
    'Algorithm: Merge Sort (O(n log n)) + Edit Distance DP (O(m·n))',
    '© TalentMatch — DSA-3 Project'
  ].join('\n');
  const blob=new Blob([lines],{type:'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`talentmatch_report_${Date.now()}.txt`;
  a.click();
  toast('Report exported');
}

/* ─────────────────────────────────────────────────────────────────
   CONFETTI
   ───────────────────────────────────────────────────────────────── */
function launchConfetti() {
  const canvas=document.getElementById('confettiCanvas'); if(!canvas) return;
  canvas.style.display='block';
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const pieces=Array.from({length:120},()=>({
    x:Math.random()*canvas.width, y:Math.random()*-200,
    w:6+Math.random()*10, h:3+Math.random()*6,
    color:['#247663','#3b82f6','#f59e0b','#ef4444','#8b5cf6'][Math.floor(Math.random()*5)],
    angle:Math.random()*Math.PI*2, spin:0.05+Math.random()*0.1,
    vx:(-1+Math.random()*2)*2, vy:3+Math.random()*4,
  }));
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
      p.x+=p.vx; p.y+=p.vy; p.angle+=p.spin;
    });
    frame++;
    if(frame<180) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display='none'; }
  }
  draw();
  toast('🎉 90%+ match — Top Pick!');
}

/* ─────────────────────────────────────────────────────────────────
   ABOUT / TEAM
   ───────────────────────────────────────────────────────────────── */
const TEAM = [
  { name:'Priya Sharma',     role:'Project Lead & Algorithms',   algo:'Edit Distance DP · Merge Sort · LCS', avatar:'👩‍💻' },
  { name:'Rohan Mehta',      role:'Frontend & UI/UX',            algo:'Dashboard · Dark Mode · Autocomplete', avatar:'👨‍🎨' },
  { name:'Ananya Iyer',      role:'Data Structures',             algo:'Trie · Max-Heap · Graph BFS', avatar:'👩‍🔬' },
  { name:'Karan Patel',      role:'Backend & PDF Parsing',       algo:'Java REST API · PDF.js · Storage', avatar:'👨‍🔧' },
];
function renderTeam() {
  const el=document.getElementById('teamGrid'); if(!el) return;
  el.innerHTML=TEAM.map(m=>`
    <div class="team-card">
      <div class="team-card__avatar">${m.avatar}</div>
      <div class="team-card__name">${esc(m.name)}</div>
      <div class="team-card__role">${esc(m.role)}</div>
      <div class="team-card__algo">${esc(m.algo)}</div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   ONBOARDING TOUR
   ───────────────────────────────────────────────────────────────── */
const TOUR_STEPS=[
  {title:'1. Add a Job 💼',desc:'Go to Jobs and create a position. Pick a template like "Frontend Dev", mark skills as Must-Have or Nice-to-Have, and save. The Trie powers instant autocomplete.',target:'nav-jobs'},
  {title:'2. Add Candidates 👥',desc:'Go to Candidates and add people manually, or upload PDFs. Drag & drop multiple files. Skills are extracted automatically via HashMap lookup.',target:'nav-candidates'},
  {title:'3. Run Match ⚡',desc:'Click Run Match, select your job, pick Top-K (Max-Heap) and threshold. TalentMatch scores everyone with Edit Distance DP and ranks with Merge Sort.',target:'nav-match'},
];
let _tourStep=0;
function startTour() {
  if(localStorage.getItem('tm_toured')) return;
  _tourStep=0;
  document.getElementById('tour-overlay').style.display='flex';
  applyTourStep();
}
function applyTourStep() {
  const s=TOUR_STEPS[_tourStep];
  document.getElementById('tour-counter').textContent=`Step ${_tourStep+1} / ${TOUR_STEPS.length}`;
  document.getElementById('tour-title').textContent=s.title;
  document.getElementById('tour-desc').textContent=s.desc;
  document.getElementById('tour-next-btn').textContent=_tourStep<TOUR_STEPS.length-1?'Next →':'Get Started →';
}
function tourNext() {
  _tourStep++;
  if(_tourStep>=TOUR_STEPS.length) endTour();
  else applyTourStep();
}
function endTour() {
  document.getElementById('tour-overlay').style.display='none';
  localStorage.setItem('tm_toured','1');
}

/* ─────────────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
   ───────────────────────────────────────────────────────────────── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e=>{
    const tag=document.activeElement.tagName;
    const inInput=['INPUT','TEXTAREA','SELECT'].includes(tag);
    if(e.key==='/'&&!inInput){ e.preventDefault(); document.getElementById('globalSearch')?.focus(); }
    if(e.key==='Escape'){
      document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
      document.getElementById('globalSearch')?.blur();
    }
    if(!inInput&&!e.ctrlKey&&!e.metaKey){
      if(e.key==='j'||e.key==='J') showView('jobs');
      if(e.key==='c'||e.key==='C') showView('candidates');
      if(e.key==='m'||e.key==='M') showView('match');
      if(e.key==='d'||e.key==='D') showView('overview');
      if(e.key==='t'||e.key==='T') toggleTheme();
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   PDF UPLOAD
   ───────────────────────────────────────────────────────────────── */
if(typeof pdfjsLib!=='undefined'){
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function showPasteMode(){
  document.getElementById('pdfPasteCard').style.display='';
  document.getElementById('pdfSkillCard').style.display='';
  document.getElementById('pdfAddCard').style.display='';
  populatePdfJobDropdown();
}

function initPdfUpload() {
  const dropzone=document.getElementById('pdfDropzone');
  const fileInput=document.getElementById('pdfFileInput');
  if(!dropzone||!fileInput) return;
  dropzone.addEventListener('click',e=>{if(e.target===dropzone||e.target.closest('.pdf-dropzone__icon')||e.target.classList.contains('pdf-dropzone__label')||e.target.classList.contains('pdf-dropzone__sub')) fileInput.click();});
  dropzone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')fileInput.click();});
  dropzone.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('drag-over');});
  dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop',e=>{
    e.preventDefault();dropzone.classList.remove('drag-over');
    const files=[...e.dataTransfer.files].filter(f=>f.type==='application/pdf');
    if(!files.length){toast('Please drop PDF files only','error');return;}
    handleMultiplePdfs(files);
  });
  fileInput.addEventListener('change',e=>{
    const files=[...e.target.files];
    if(files.length>1) handleMultiplePdfs(files);
    else if(files.length===1) handlePdfFile(files[0]);
  });
}

async function handleMultiplePdfs(files) {
  const progressList=document.getElementById('pdfProgressList');
  if(progressList) progressList.innerHTML='';
  for(const file of files) {
    const row=document.createElement('div');
    row.className='progress-row';
    row.innerHTML=`<span class="progress-name">${esc(file.name)}</span><div class="progress-bar-wrap"><div class="progress-bar-fill" id="pb_${file.name.replace(/\W/g,'_')}" style="width:0%"></div></div><span class="progress-pct">0%</span>`;
    if(progressList) progressList.appendChild(row);
    await handlePdfFile(file, row);
  }
}

async function handlePdfFile(file, progressRow=null) {
  const setProgress=(pct)=>{
    if(!progressRow) return;
    const bar=progressRow.querySelector('.progress-bar-fill');
    const txt=progressRow.querySelector('.progress-pct');
    if(bar) bar.style.width=pct+'%';
    if(txt) txt.textContent=pct+'%';
  };

  Store.pdf.file=file; Store.pdf.text=''; Store.pdf.detectedSkills.clear();
  const infoBar=document.getElementById('pdfFileInfo');
  if(infoBar&&!progressRow){
    document.getElementById('pdfFileName').textContent=file.name;
    document.getElementById('pdfFileSize').textContent=`${(file.size/1024).toFixed(1)} KB · PDF`;
    infoBar.style.display='flex';
  }
  const textCard=document.getElementById('pdfTextCard');
  const textPrev=document.getElementById('pdfTextPreview');
  if(textCard)textCard.style.display='';
  if(textPrev)textPrev.textContent='⏳ Extracting text…';
  setProgress(10);

  try {
    const arrayBuffer=await file.arrayBuffer();
    setProgress(25);
    const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise;
    const pgCount=document.getElementById('pdfPageCount');
    if(pgCount)pgCount.textContent=`${pdf.numPages} page${pdf.numPages>1?'s':''}`;
    setProgress(40);
    let fullText='';
    for(let p=1;p<=pdf.numPages;p++){
      const page=await pdf.getPage(p);
      const content=await page.getTextContent();
      let pageText='';let lastX=null;
      for(const item of content.items){
        if(!item.str)continue;
        if(lastX!==null&&item.transform&&item.transform[4]-lastX>5)pageText+=' ';
        pageText+=item.str;
        if(item.hasEOL)pageText+=' ';
        if(item.transform)lastX=item.transform[4]+(item.width||0);
      }
      fullText+=pageText+'\n';
      setProgress(40+Math.round((p/pdf.numPages)*40));
    }
    Store.pdf.text=fullText.replace(/[ \t]{2,}/g,' ').trim();
    setProgress(80);
    if(textPrev)textPrev.textContent=Store.pdf.text.slice(0,800)+(Store.pdf.text.length>800?'\n…':'');
    Store.pdf.detectedSkills=SkillExtractor.extractFromText(Store.pdf.text);
    renderPdfSkills();
    setProgress(100);
    if(Store.pdf.detectedSkills.size===0&&Store.pdf.text.length>0)showPasteMode();
    const addCard=document.getElementById('pdfAddCard');
    if(addCard){
      addCard.style.display='';populatePdfJobDropdown();
      const guessName=file.name.replace(/\.pdf$/i,'').replace(/[_\-]/g,' ').replace(/resume|cv/gi,'').trim();
      const nameEl=document.getElementById('pdfCandName');
      if(nameEl&&guessName.length>1)nameEl.value=guessName;
    }
    const count=Store.pdf.detectedSkills.size;
    toast(count>0?`✅ ${file.name}: ${count} skills detected`:`⚠️ ${file.name}: no skills found — try paste fallback`);
  } catch(err) {
    console.error('PDF error:',err);
    if(textPrev)textPrev.textContent='❌ Error reading PDF: '+err.message;
    showPasteMode();
    toast('Could not read PDF — use paste fallback','error');
    setProgress(0);
  }
}

function renderPdfSkills() {
  const card=document.getElementById('pdfSkillCard');
  const tags=document.getElementById('pdfSkillTags');
  const count=document.getElementById('pdfSkillCount');
  if(!card)return;
  card.style.display='';
  const skills=Store.pdf.detectedSkills;
  skills.forEach((val,key)=>{if(typeof val==='string')skills.set(key,{display:val,active:true});});
  const active=[...skills.values()].filter(e=>e.active!==false).length;
  if(count)count.textContent=`${active} of ${skills.size} skills selected`;
  if(!tags)return;
  tags.innerHTML='';
  skills.forEach((entry,key)=>{
    const tag=document.createElement('span');
    tag.className='tag matched'+(entry.active===false?' toggled-off':'');
    tag.textContent=entry.display;
    tag.title='Click to toggle';
    tag.onclick=()=>{entry.active=!entry.active;tag.classList.toggle('toggled-off',!entry.active);
      const a=[...skills.values()].filter(e=>e.active).length;
      if(count)count.textContent=`${a} of ${skills.size} skills selected`;};
    tags.appendChild(tag);
  });
}

function extractFromPastedText() {
  const ta=document.getElementById('pdfPasteTextarea');
  if(!ta)return;
  const text=ta.value.trim();
  if(!text){toast('Paste some text first','error');return;}
  Store.pdf.text=text;
  Store.pdf.detectedSkills=SkillExtractor.extractFromText(text);
  const tp=document.getElementById('pdfTextPreview');
  const tc=document.getElementById('pdfTextCard');
  if(tc)tc.style.display='';
  if(tp)tp.textContent=text.slice(0,800);
  renderPdfSkills();
  const addCard=document.getElementById('pdfAddCard');
  if(addCard){addCard.style.display='';populatePdfJobDropdown();}
  toast(`${Store.pdf.detectedSkills.size} skills extracted`);
}

function addCustomSkill() {
  const inp=document.getElementById('pdfCustomSkill'); if(!inp)return;
  const val=inp.value.trim().toLowerCase(); if(!val)return;
  const display=val.charAt(0).toUpperCase()+val.slice(1);
  Store.pdf.detectedSkills.set(val,{display,active:true});
  inp.value='';
  document.getElementById('pdfSkillAC').style.display='none';
  renderPdfSkills();
  const addCard=document.getElementById('pdfAddCard');
  if(addCard){addCard.style.display='';populatePdfJobDropdown();}
  toast(`Added: ${display}`);
}

function getActivePdfSkills() {
  const active=new Set();
  Store.pdf.detectedSkills.forEach((e,k)=>{if(e.active!==false)active.add(k);});
  return active;
}
function populatePdfJobDropdown() {
  const sel=document.getElementById('pdfMatchJob'); if(!sel)return;
  sel.innerHTML='<option value="">— just add to pool —</option>'+Store.jobs.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('');
}
function clearPdf() {
  Store.pdf={file:null,text:'',detectedSkills:new Map()};
  const fi=document.getElementById('pdfFileInput');if(fi)fi.value='';
  ['pdfFileInfo','pdfTextCard','pdfSkillCard','pdfAddCard'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  toast('PDF cleared');
}

async function addFromPdf() {
  const name=(document.getElementById('pdfCandName')?.value||'').trim();
  const jobId=parseInt(document.getElementById('pdfMatchJob')?.value)||0;
  const skills=getActivePdfSkills();
  if(!name){setError('pdfCandNameErr','Name is required');return;}
  if(skills.size<1){toast('No skills selected','error');return;}
  Store.candidates.push({id:Date.now(),name,skills,starred:false,notes:''});
  logActivity(`Added via PDF: "${esc(name)}" (${skills.size} skills)`);
  toast(`${esc(name)} added — ${skills.size} skills`);
  saveToStorage();updateStats();renderCandidatesList();
  if(jobId){
    const job=Store.jobs.find(j=>j.id===jobId);
    if(job){
      const results=runJSMatch(job,0,false);
      Store.lastResults=results;Store.lastJob=job;
      showView('match');populateJobDropdown();
      document.getElementById('matchJob').value=jobId;
      renderMatchResults(job,results);updateStats();return;
    }
  }
  showView('candidates');
}

function addFromPdfOnly() {
  const name=(document.getElementById('pdfCandName')?.value||'').trim();
  const skills=getActivePdfSkills();
  if(!name){setError('pdfCandNameErr','Name is required');return;}
  if(skills.size<1){toast('No skills selected','error');return;}
  Store.candidates.push({id:Date.now(),name,skills,starred:false,notes:''});
  saveToStorage();updateStats();renderCandidatesList();
  logActivity(`Added: "${esc(name)}"`);
  toast(`${esc(name)} added to pool`);
  showView('candidates');
}

/* ─────────────────────────────────────────────────────────────────
   LANDING PAGE — login modal
   ───────────────────────────────────────────────────────────────── */
function initLanding() {
  const loginBtn=document.getElementById('loginBtn');
  const modal=document.getElementById('loginModal');
  const closeBtn=document.getElementById('closeLoginModal');
  if(loginBtn&&modal){
    loginBtn.addEventListener('click',()=>modal.classList.add('open'));
    if(closeBtn) closeBtn.addEventListener('click',()=>modal.classList.remove('open'));
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});
  }
}

/* ─────────────────────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  const restored=loadFromStorage();
  if(!restored) seedData();

  initLanding();
  initPdfUpload();
  initGlobalSearch();
  initKeyboardShortcuts();
  checkBackend();

  if(document.getElementById('view-overview')){
    showView('overview');
    renderJobsList();
    renderCandidatesList();
    updateStats();
    renderActivityLog();
    // Start tour for new users (after brief delay)
    setTimeout(startTour, 800);
  }

  // Populate Trie after dictionaries are loaded
  if(typeof SkillTrie!=='undefined' && typeof SKILL_DICTIONARY!=='undefined'){
    for(const [key,display] of SKILL_DICTIONARY.entries()){
      SkillTrie.insert(display);
      SkillTrie.insert(key);
    }
  }

  // jobSkills input → rebuild weighted panel live
  const jobSkillsInp=document.getElementById('jobSkills');
  if(jobSkillsInp) jobSkillsInp.addEventListener('input',()=>{
    const cb=document.getElementById('useWeightedSkills');
    if(cb&&cb.checked) buildWeightedPanel();
  });
});
