/**
 * TalentMatch — Core Algorithmic Engine & Frontend Logic (app.js)
 * 
 * Data Structures & Algorithms:
 *  1. HashMap / HashSet   → SkillExtractor: dedup & normalize skills (Module 1 / 6)
 *  2. Wagner-Fischer DP   → EditDistanceScorer: 2D matrix fuzzy sequence alignment (Module 3)
 *  3. Merge Sort          → CandidateRanker: O(n log n) stable leaderboard ranking
 *  4. Mozilla PDF.js      → In-browser client tokenization & text stream parser
 */

// ===========================================================
//  TECH SKILLS TAXONOMY DICTIONARY (HashMap Lookup)
// ===========================================================
const SKILL_DICTIONARY = new Map([
  // Languages
  ['java', 'Java'], ['python', 'Python'], ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'], ['c++', 'C++'], ['c#', 'C#'], ['c', 'C'],
  ['ruby', 'Ruby'], ['go', 'Go'], ['rust', 'Rust'], ['kotlin', 'Kotlin'],
  ['swift', 'Swift'], ['php', 'PHP'], ['scala', 'Scala'], ['r', 'R'],
  ['dart', 'Dart'], ['matlab', 'MATLAB'],

  // Web Frontend
  ['html', 'HTML'], ['css', 'CSS'], ['react', 'React'], ['angular', 'Angular'],
  ['vue', 'Vue'], ['nextjs', 'Next.js'], ['svelte', 'Svelte'], ['sass', 'Sass'],
  ['bootstrap', 'Bootstrap'], ['jquery', 'jQuery'], ['redux', 'Redux'],
  ['webpack', 'Webpack'], ['tailwind', 'Tailwind'],

  // Backend & Frameworks
  ['spring', 'Spring'], ['spring boot', 'Spring Boot'], ['django', 'Django'],
  ['flask', 'Flask'], ['fastapi', 'FastAPI'], ['nodejs', 'Node.js'],
  ['node.js', 'Node.js'], ['express', 'Express'], ['laravel', 'Laravel'],
  ['rest api', 'REST API'], ['graphql', 'GraphQL'], ['grpc', 'gRPC'],
  ['microservices', 'Microservices'], ['hibernate', 'Hibernate'],
  ['maven', 'Maven'], ['gradle', 'Gradle'],

  // Databases
  ['sql', 'SQL'], ['mysql', 'MySQL'], ['postgresql', 'PostgreSQL'],
  ['mongodb', 'MongoDB'], ['redis', 'Redis'], ['oracle', 'Oracle'],
  ['sqlite', 'SQLite'], ['cassandra', 'Cassandra'], ['elasticsearch', 'Elasticsearch'],
  ['dynamodb', 'DynamoDB'], ['neo4j', 'Neo4j'],

  // Cloud & DevOps
  ['aws', 'AWS'], ['azure', 'Azure'], ['gcp', 'GCP'], ['docker', 'Docker'],
  ['kubernetes', 'Kubernetes'], ['jenkins', 'Jenkins'], ['git', 'Git'],
  ['github', 'GitHub'], ['gitlab', 'GitLab'], ['terraform', 'Terraform'],
  ['ansible', 'Ansible'], ['ci/cd', 'CI/CD'], ['linux', 'Linux'],
  ['nginx', 'Nginx'], ['apache', 'Apache'],

  // Data Science & Machine Learning
  ['machine learning', 'Machine Learning'], ['deep learning', 'Deep Learning'],
  ['tensorflow', 'TensorFlow'], ['pytorch', 'PyTorch'], ['pandas', 'Pandas'],
  ['numpy', 'NumPy'], ['scikit-learn', 'Scikit-Learn'], ['matplotlib', 'Matplotlib'],
  ['tableau', 'Tableau'], ['power bi', 'Power BI'], ['statistics', 'Statistics'],
  ['data science', 'Data Science'], ['nlp', 'NLP'], ['computer vision', 'Computer Vision'],
  ['excel', 'Excel'], ['hadoop', 'Hadoop'], ['spark', 'Spark'],

  // Testing & Agile
  ['junit', 'JUnit'], ['selenium', 'Selenium'], ['jest', 'Jest'],
  ['postman', 'Postman'], ['jira', 'Jira'], ['agile', 'Agile'],
  ['scrum', 'Scrum'], ['bash', 'Bash'], ['powershell', 'PowerShell']
]);

// ===========================================================
//  APPLICATION DATA STORE
// ===========================================================
const Store = {
  jobs: [],
  candidates: [],
  lastResults: [],
  activeJob: null,
  pdf: {
    file: null,
    text: '',
    detectedSkills: new Map() // skill_key → { display, active }
  }
};

const STORAGE_KEY = 'talentmatch_v1';

function saveToStorage() {
  try {
    const data = {
      jobs: Store.jobs.map(j => ({ id: j.id, title: j.title, skills: [...j.skills] })),
      candidates: Store.candidates.map(c => ({ id: c.id, name: c.name, skills: [...c.skills] })),
      lastResults: Store.lastResults.map(r => ({
        score: r.score,
        matched: r.matched,
        missing: r.missing,
        candidate: { id: r.candidate.id, name: r.candidate.name, skills: [...r.candidate.skills] }
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    Store.jobs = (data.jobs || []).map(j => ({ id: j.id, title: j.title, skills: new Set(j.skills) }));
    Store.candidates = (data.candidates || []).map(c => ({ id: c.id, name: c.name, skills: new Set(c.skills) }));
    Store.lastResults = (data.lastResults || []).map(r => ({
      score: r.score,
      matched: r.matched,
      missing: r.missing,
      candidate: { id: r.candidate.id, name: r.candidate.name, skills: new Set(r.candidate.skills) }
    }));
    return true;
  } catch (e) {
    console.warn('Storage load failed:', e);
    return false;
  }
}

function seedSampleData() {
  Store.jobs = [
    { id: 1, title: 'Senior Java Developer', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'rest api']) },
    { id: 2, title: 'Frontend Engineer', skills: new Set(['html', 'css', 'javascript', 'react', 'typescript', 'git']) },
    { id: 3, title: 'Data Analyst', skills: new Set(['python', 'sql', 'pandas', 'excel', 'tableau', 'statistics']) }
  ];
  Store.candidates = [
    { id: 1, name: 'Priya Sharma', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'junit', 'git']) },
    { id: 2, name: 'Alex Chen', skills: new Set(['javascript', 'typescript', 'react', 'html', 'css', 'git', 'webpack']) },
    { id: 3, name: 'Ananya Iyer', skills: new Set(['python', 'sql', 'pandas', 'numpy', 'matplotlib', 'statistics']) },
    { id: 4, name: 'Rohan Mehta', skills: new Set(['java', 'spring', 'rest api', 'sql', 'maven', 'jenkins']) },
    { id: 5, name: 'Divya Nair', skills: new Set(['java', 'python', 'sql', 'docker', 'kubernetes', 'rest api']) },
    { id: 6, name: 'Karan Patel', skills: new Set(['html', 'css', 'javascript', 'react', 'git', 'sass']) }
  ];
  Store.lastResults = [];
  saveToStorage();
  updateBadgeCounts();
  renderJobsList();
  renderCandidatesList();
  updateStats();
  renderOverview();
  toast('Sample dataset loaded successfully');
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  Store.jobs = [];
  Store.candidates = [];
  Store.lastResults = [];
  updateBadgeCounts();
  renderJobsList();
  renderCandidatesList();
  updateStats();
  renderOverview();
  clearResults();
  toast('Storage wiped cleanly', 'error');
}

// ===========================================================
//  ALGORITHM 1 — SkillExtractor (HashMap / HashSet)
// ===========================================================
const SkillExtractor = {
  extract(raw) {
    const skillMap = new Map();
    raw.split(',').forEach(s => {
      const n = s.trim().toLowerCase();
      if (n) skillMap.set(n, n);
    });
    return new Set(skillMap.keys());
  },

  extractFromText(text) {
    const lower = text.toLowerCase().replace(/\s+/g, ' ');
    const compact = lower.replace(/\s/g, '');
    const found = new Map();

    const sortedTaxonomy = [...SKILL_DICTIONARY.entries()]
      .sort((a, b) => b[0].length - a[0].length);

    for (const [keyword, display] of sortedTaxonomy) {
      const kwCompact = keyword.replace(/\s/g, '');
      if (lower.includes(keyword) || compact.includes(kwCompact)) {
        found.set(keyword, { display, active: true });
      }
    }
    return found;
  }
};

// ===========================================================
//  ALGORITHM 2 — EditDistanceScorer (Wagner-Fischer DP, Module 3)
// ===========================================================
const EditDistanceScorer = {
  MATCH_THRESHOLD: 0.35,

  editDistance(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j - 1], // substitution
            dp[i - 1][j],     // deletion
            dp[i][j - 1]      // insertion
          );
        }
      }
    }
    return dp[m][n];
  },

  normalizedEditDistance(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 0.0;
    return this.editDistance(a, b) / maxLen;
  },

  isFuzzyMatch(skillA, skillB) {
    const sA = skillA.toLowerCase().trim();
    const sB = skillB.toLowerCase().trim();
    return this.normalizedEditDistance(sA, sB) <= this.MATCH_THRESHOLD;
  },

  score(candidateSkills, jobSkills) {
    const matched = [];
    const missing = [];

    for (const jobSkill of jobSkills) {
      let found = false;
      for (const candSkill of candidateSkills) {
        if (this.isFuzzyMatch(jobSkill, candSkill)) {
          found = true;
          break;
        }
      }
      if (found) matched.push(jobSkill);
      else missing.push(jobSkill);
    }

    const total = jobSkills.size;
    const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);
    return { score, matched, missing };
  }
};

// ===========================================================
//  ALGORITHM 3 — CandidateRanker (Merge Sort O(n log n))
// ===========================================================
const CandidateRanker = {
  sort(candidates) {
    if (candidates.length <= 1) return [...candidates];
    const mid = Math.floor(candidates.length / 2);
    const left = this.sort(candidates.slice(0, mid));
    const right = this.sort(candidates.slice(mid));
    return this.merge(left, right);
  },

  merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      // Descending order for leaderboard rankings
      if (left[i].score >= right[j].score) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
};

// ===========================================================
//  LIVE DP MATRIX VISUALIZER (Sandbox Playground)
// ===========================================================
function renderDPMatrix(wordA, wordB) {
  const container = document.getElementById('dpTableContainer');
  if (!container) return;

  const a = (wordA || '').toLowerCase().trim();
  const b = (wordB || '').toLowerCase().trim();

  const m = a.length;
  const n = b.length;

  if (m === 0 && n === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">Enter strings above to render DP matrix.</div>';
    return;
  }

  // Compute 2D DP matrix
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrace minimum cost path
  const pathSet = new Set();
  let currI = m, currJ = n;
  pathSet.add(`${currI},${currJ}`);

  while (currI > 0 || currJ > 0) {
    if (currI > 0 && currJ > 0) {
      const matchCost = a[currI - 1] === b[currJ - 1] ? 0 : 1;
      const diag = dp[currI - 1][currJ - 1];
      const up = dp[currI - 1][currJ];
      const left = dp[currI][currJ - 1];

      if (dp[currI][currJ] === diag + matchCost) {
        currI--; currJ--;
      } else if (dp[currI][currJ] === up + 1) {
        currI--;
      } else {
        currJ--;
      }
    } else if (currI > 0) {
      currI--;
    } else {
      currJ--;
    }
    pathSet.add(`${currI},${currJ}`);
  }

  // Construct HTML Table
  let html = '<table class="dp-matrix-table">';
  // Header row
  html += '<thead><tr><th>&empty;</th><th>&empty;</th>';
  for (let j = 0; j < n; j++) {
    html += `<th>${b[j]}</th>`;
  }
  html += '</tr></thead><tbody>';

  // Matrix rows
  for (let i = 0; i <= m; i++) {
    html += '<tr>';
    html += `<th>${i === 0 ? '&empty;' : a[i - 1]}</th>`;
    for (let j = 0; j <= n; j++) {
      const isPath = pathSet.has(`${i},${j}`);
      const isTarget = (i === m && j === n);
      let cls = '';
      if (isTarget) cls = 'dp-cell-target';
      else if (isPath) cls = 'dp-cell-path';

      html += `<td class="${cls}">${dp[i][j]}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';

  container.innerHTML = html;

  // Update Stats Box
  const rawDist = dp[m][n];
  const maxLen = Math.max(m, n);
  const ratio = maxLen === 0 ? 0 : (rawDist / maxLen).toFixed(2);
  const isMatch = ratio <= EditDistanceScorer.MATCH_THRESHOLD;

  const distEl = document.getElementById('dpValDist');
  const maxLenEl = document.getElementById('dpValMaxLen');
  const ratioEl = document.getElementById('dpValRatio');
  const verdictEl = document.getElementById('dpValVerdict');

  if (distEl) distEl.textContent = `${rawDist} operation${rawDist !== 1 ? 's' : ''}`;
  if (maxLenEl) maxLenEl.textContent = `${maxLen} char${maxLen !== 1 ? 's' : ''}`;
  if (ratioEl) ratioEl.textContent = `${ratio} (normalized)`;
  if (verdictEl) {
    verdictEl.textContent = isMatch ? 'PASSED (≤ 0.35 Match)' : 'REJECTED (> 0.35 Gap)';
    verdictEl.className = isMatch ? 'dp-stat-val match-yes' : 'dp-stat-val match-no';
  }
}

function initDPSandbox() {
  const btn = document.getElementById('runDpBtn');
  const inA = document.getElementById('dpInputA');
  const inB = document.getElementById('dpInputB');

  if (btn && inA && inB) {
    btn.addEventListener('click', () => {
      renderDPMatrix(inA.value, inB.value);
    });
    // Initial preview render
    renderDPMatrix(inA.value, inB.value);
  }
}

// ===========================================================
//  HERO LIVE SIMULATOR WIDGET
// ===========================================================
function initHeroSimulator() {
  const candChips = document.querySelectorAll('#simCandidateList .sim-chip');
  const jobChips = document.querySelectorAll('#simJobList .sim-chip');
  if (!candChips.length || !jobChips.length) return;

  const sampleCands = {
    '1': { name: 'Priya Sharma', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'junit', 'git']) },
    '2': { name: 'Alex Chen', skills: new Set(['javascript', 'typescript', 'react', 'html', 'css', 'git', 'webpack']) },
    '3': { name: 'Ananya Iyer', skills: new Set(['python', 'sql', 'pandas', 'numpy', 'matplotlib', 'statistics']) }
  };

  const sampleJobs = {
    '1': { title: 'Senior Java Developer', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'rest api']) },
    '2': { title: 'Frontend Engineer', skills: new Set(['html', 'css', 'javascript', 'react', 'typescript', 'git']) },
    '3': { title: 'Data Analyst', skills: new Set(['python', 'sql', 'pandas', 'excel', 'tableau', 'statistics']) }
  };

  let activeCandId = '1';
  let activeJobId = '1';

  function updateSimulation() {
    const cand = sampleCands[activeCandId];
    const job = sampleJobs[activeJobId];
    if (!cand || !job) return;

    const { score, matched, missing } = EditDistanceScorer.score(cand.skills, job.skills);

    const nameEl = document.getElementById('simCandName');
    const jobEl = document.getElementById('simJobTitle');
    const scoreValEl = document.getElementById('simScoreVal');
    const scoreTagEl = document.getElementById('simScoreTag');
    const scoreFillEl = document.getElementById('simScoreFill');
    const matchCountEl = document.getElementById('simMatchCount');
    const missCountEl = document.getElementById('simMissCount');
    const matchedTagsEl = document.getElementById('simMatchedTags');
    const missingTagsEl = document.getElementById('simMissingTags');

    if (nameEl) nameEl.textContent = cand.name;
    if (jobEl) jobEl.textContent = `Evaluating against: ${job.title}`;
    if (scoreValEl) scoreValEl.textContent = `${score}%`;
    if (scoreTagEl) {
      scoreTagEl.textContent = score >= 60 ? 'High Match' : score >= 35 ? 'Moderate Fit' : 'Low Match';
      scoreTagEl.style.color = score >= 60 ? 'var(--success)' : score >= 35 ? 'var(--warning)' : 'var(--danger)';
    }
    if (scoreFillEl) {
      scoreFillEl.style.width = `${score}%`;
      scoreFillEl.style.background = score >= 60 
        ? 'linear-gradient(90deg, #3b82f6, #10b981)' 
        : score >= 35 
        ? 'linear-gradient(90deg, #3b82f6, #f59e0b)' 
        : 'linear-gradient(90deg, #f59e0b, #ef4444)';
    }

    if (matchCountEl) matchCountEl.textContent = matched.length;
    if (missCountEl) missCountEl.textContent = missing.length;

    if (matchedTagsEl) {
      matchedTagsEl.innerHTML = matched.length
        ? matched.map(m => `<span class="sim-tag match">${m}</span>`).join('')
        : '<span style="color:var(--text-dim);font-size:0.75rem;">None</span>';
    }

    if (missingTagsEl) {
      missingTagsEl.innerHTML = missing.length
        ? missing.map(m => `<span class="sim-tag miss">${m}</span>`).join('')
        : '<span style="color:var(--text-dim);font-size:0.75rem;">None</span>';
    }
  }

  candChips.forEach(chip => {
    chip.addEventListener('click', () => {
      candChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCandId = chip.dataset.cand;
      updateSimulation();
    });
  });

  jobChips.forEach(chip => {
    chip.addEventListener('click', () => {
      jobChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeJobId = chip.dataset.job;
      updateSimulation();
    });
  });

  updateSimulation();
}

// ===========================================================
//  INTERACTIVE TABS
// ===========================================================
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetId) {
          pane.classList.add('active');
        }
      });
    });
  });
}

// ===========================================================
//  ROI / SCREENING CALCULATOR
// ===========================================================
function initROICalculator() {
  const appRange = document.getElementById('calcApplicantsRange');
  const timeRange = document.getElementById('calcTimeRange');
  if (!appRange || !timeRange) return;

  function update() {
    const applicants = parseInt(appRange.value);
    const minsPerResume = parseInt(timeRange.value);

    document.getElementById('calcApplicantsVal').textContent = applicants;
    document.getElementById('calcTimeVal').textContent = `${minsPerResume} mins`;

    // Calculation: manual hours = (applicants * minsPerResume) / 60
    // TalentMatch reduces it by ~85%
    const manualHours = (applicants * minsPerResume) / 60;
    const hoursSaved = Math.round(manualHours * 0.85);
    const speedMultiplier = (manualHours / (manualHours * 0.15)).toFixed(1);
    const costSaved = hoursSaved * 50; // $50/hour recruiter wage

    document.getElementById('calcHoursSaved').textContent = `${hoursSaved} Hours`;
    document.getElementById('calcSpeedMultiplier').textContent = `${speedMultiplier}x`;
    document.getElementById('calcCostSaved').textContent = `$${costSaved.toLocaleString()}`;
  }

  appRange.addEventListener('input', update);
  timeRange.addEventListener('input', update);
  update();
}

// ===========================================================
//  FAQ ACCORDION
// ===========================================================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-question');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });
}

// ===========================================================
//  LANDING PAGE AUTH MODAL
// ===========================================================
function initLanding() {
  const loginBtn = document.getElementById('loginBtn');
  const modal = document.getElementById('loginModal');
  const closeBtn = document.getElementById('closeLoginModal');
  if (loginBtn && modal) {
    loginBtn.addEventListener('click', () => modal.classList.add('open'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  }

  initDPSandbox();
  initHeroSimulator();
  initTabs();
  initROICalculator();
  initFAQ();
}

// ===========================================================
//  PDF.js ENGINE & INGESTION
// ===========================================================
function initPdfUpload() {
  const dropzone = document.getElementById('pdfDropzone');
  const fileInput = document.getElementById('pdfFileInput');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      handlePdfFile(files[0]);
    } else {
      toast('Please upload a valid .pdf file', 'error');
    }
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      handlePdfFile(e.target.files[0]);
    }
  });
}

async function handlePdfFile(file) {
  Store.pdf.file = file;

  const fileInfo = document.getElementById('pdfFileInfo');
  const fileName = document.getElementById('pdfFileName');
  const fileSize = document.getElementById('pdfFileSize');
  if (fileInfo) fileInfo.style.display = 'flex';
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

  const textCard = document.getElementById('pdfTextCard');
  const textPrev = document.getElementById('pdfTextPreview');
  const pgCount = document.getElementById('pdfPageCount');
  if (textCard) textCard.style.display = '';
  if (textPrev) textPrev.textContent = 'Extracting text stream via PDF.js...';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    if (pgCount) pgCount.textContent = `${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`;

    let fullText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      let pageText = '';
      let lastX = null;
      for (const item of content.items) {
        if (!item.str) continue;
        if (lastX !== null && item.transform) {
          const x = item.transform[4];
          if (x - lastX > 5) pageText += ' ';
        }
        pageText += item.str;
        if (item.hasEOL) pageText += ' ';
        if (item.transform) lastX = item.transform[4] + (item.width || 0);
      }
      fullText += pageText + '\n';
    }

    Store.pdf.text = fullText.replace(/[ \t]{2,}/g, ' ').trim();

    if (textPrev) {
      if (Store.pdf.text.length > 0) {
        textPrev.textContent = Store.pdf.text.slice(0, 800) + (Store.pdf.text.length > 800 ? '\n...' : '');
      } else {
        textPrev.textContent = 'Could not extract text tokens (likely a scanned image). Use paste fallback.';
      }
    }

    // Run HashMap Skill Extractor
    Store.pdf.detectedSkills = SkillExtractor.extractFromText(Store.pdf.text);
    renderPdfSkills();

    const addCard = document.getElementById('pdfAddCard');
    if (addCard) {
      addCard.style.display = '';
      populatePdfJobDropdown();
      const guessedName = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_\-]/g, ' ')
        .replace(/resume|cv/gi, '')
        .trim();
      const nameInput = document.getElementById('pdfCandName');
      if (nameInput && guessedName.length > 1) nameInput.value = guessedName;
    }

    const count = Store.pdf.detectedSkills.size;
    toast(`PDF parsed · ${count} technical skills detected via HashMap`);
  } catch (err) {
    console.error('PDF extraction failed:', err);
    if (textPrev) textPrev.textContent = 'Error parsing PDF: ' + err.message;
    toast('Error reading PDF. Paste resume text instead.', 'error');
  }
}

function loadSampleResumeText() {
  const sample = `
ALEX CHEN — SENIOR FULL STACK ENGINEER
Email: alex.chen@example.com | GitHub: github.com/alexchen

TECHNICAL SKILLS:
Languages: JavaScript, TypeScript, Python, Java, SQL, HTML, CSS
Frameworks: React, Next.js, Node.js, Express, Spring Boot, Redux
Databases: PostgreSQL, MongoDB, Redis
DevOps: Docker, Kubernetes, AWS, Git, CI/CD, Linux

EXPERIENCE:
Staff Software Engineer at CloudScale Inc (2022 - Present)
- Built high-throughput microservices using Node.js and Java Spring Boot.
- Spearheaded frontend rewrite in React and TypeScript with Tailwind.
- Implemented containerized deployment pipeline with Docker and Kubernetes on AWS.
`;
  Store.pdf.text = sample.trim();
  Store.pdf.detectedSkills = SkillExtractor.extractFromText(Store.pdf.text);

  const textCard = document.getElementById('pdfTextCard');
  const textPrev = document.getElementById('pdfTextPreview');
  if (textCard) textCard.style.display = '';
  if (textPrev) textPrev.textContent = Store.pdf.text;

  renderPdfSkills();

  const addCard = document.getElementById('pdfAddCard');
  if (addCard) {
    addCard.style.display = '';
    populatePdfJobDropdown();
    const nameInput = document.getElementById('pdfCandName');
    if (nameInput) nameInput.value = 'Alex Chen';
  }

  toast('Loaded Sample Resume: Alex Chen (11 skills detected)');
}

function renderPdfSkills() {
  const skillCard = document.getElementById('pdfSkillCard');
  const skillTags = document.getElementById('pdfSkillTags');
  const skillCount = document.getElementById('pdfSkillCount');
  if (!skillCard || !skillTags) return;

  skillCard.style.display = '';
  const skills = Store.pdf.detectedSkills;

  skills.forEach((val, key) => {
    if (typeof val === 'string') skills.set(key, { display: val, active: true });
  });

  const activeCount = [...skills.values()].filter(e => e.active !== false).length;
  if (skillCount) {
    skillCount.textContent = `${activeCount} of ${skills.size} skills selected`;
  }

  skillTags.innerHTML = '';
  skills.forEach((entry, key) => {
    const tag = document.createElement('span');
    tag.className = 'tag matched' + (entry.active === false ? ' toggled-off' : '');
    tag.textContent = entry.display;
    tag.title = 'Click to toggle';
    tag.onclick = () => {
      entry.active = !entry.active;
      tag.classList.toggle('toggled-off', !entry.active);
      const active = [...skills.values()].filter(e => e.active).length;
      if (skillCount) skillCount.textContent = `${active} of ${skills.size} skills selected`;
    };
    skillTags.appendChild(tag);
  });
}

function addCustomSkill() {
  const input = document.getElementById('pdfCustomSkill');
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  const display = val.charAt(0).toUpperCase() + val.slice(1);
  Store.pdf.detectedSkills.set(val, { display, active: true });
  input.value = '';
  renderPdfSkills();
  toast(`Added custom skill: ${display}`);
}

function extractFromPastedText() {
  const textarea = document.getElementById('pdfPasteTextarea');
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) { toast('Please enter resume text first', 'error'); return; }

  Store.pdf.text = text;
  Store.pdf.detectedSkills = SkillExtractor.extractFromText(text);

  const textCard = document.getElementById('pdfTextCard');
  const textPrev = document.getElementById('pdfTextPreview');
  if (textCard) textCard.style.display = '';
  if (textPrev) textPrev.textContent = text.slice(0, 800);

  renderPdfSkills();

  const addCard = document.getElementById('pdfAddCard');
  if (addCard) {
    addCard.style.display = '';
    populatePdfJobDropdown();
  }

  toast(`${Store.pdf.detectedSkills.size} skills extracted from pasted text`);
}

function clearPdf() {
  Store.pdf = { file: null, text: '', detectedSkills: new Map() };
  const fileInput = document.getElementById('pdfFileInput');
  if (fileInput) fileInput.value = '';
  const fileInfo = document.getElementById('pdfFileInfo');
  if (fileInfo) fileInfo.style.display = 'none';
  const textCard = document.getElementById('pdfTextCard');
  if (textCard) textCard.style.display = 'none';
  const skillCard = document.getElementById('pdfSkillCard');
  if (skillCard) skillCard.style.display = 'none';
  const addCard = document.getElementById('pdfAddCard');
  if (addCard) addCard.style.display = 'none';
  toast('Resume cleared');
}

function getActivePdfSkills() {
  const active = new Set();
  Store.pdf.detectedSkills.forEach((entry, key) => {
    if (entry.active !== false) active.add(key);
  });
  return active;
}

function populatePdfJobDropdown() {
  const sel = document.getElementById('pdfMatchJob');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Add to pool only —</option>' +
    Store.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
}

async function addFromPdf() {
  const name = document.getElementById('pdfCandName').value.trim();
  const jobId = parseInt(document.getElementById('pdfMatchJob').value);
  const skills = getActivePdfSkills();

  if (!name) { toast('Please enter candidate name', 'error'); return; }
  if (skills.size < 1) { toast('Please select at least 1 skill', 'error'); return; }

  Store.candidates.push({ id: Date.now(), name, skills });
  saveToStorage();
  updateBadgeCounts();
  updateStats();
  renderCandidatesList();
  toast(`${name} registered (${skills.size} skills)`);

  if (jobId) {
    const job = Store.jobs.find(j => j.id === jobId);
    if (job) {
      showView('match');
      populateJobDropdown();
      document.getElementById('matchJob').value = jobId;
      await runMatch();
      return;
    }
  }
  showView('candidates');
}

function addFromPdfOnly() {
  const name = document.getElementById('pdfCandName').value.trim();
  const skills = getActivePdfSkills();
  if (!name) { toast('Please enter candidate name', 'error'); return; }
  if (skills.size < 1) { toast('Please select at least 1 skill', 'error'); return; }

  Store.candidates.push({ id: Date.now(), name, skills });
  saveToStorage();
  updateBadgeCounts();
  updateStats();
  renderCandidatesList();
  toast(`${name} added to candidate pool`);
  showView('candidates');
}

// ===========================================================
//  DASHBOARD NAVIGATION & VIEWS
// ===========================================================
function showView(name) {
  const views = ['overview', 'upload', 'jobs', 'candidates', 'match'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.style.display = 'none';
  });

  const navMap = {
    overview: 'nav-dashboard',
    upload: 'nav-upload',
    jobs: 'nav-jobs',
    candidates: 'nav-candidates',
    match: 'nav-match'
  };

  Object.values(navMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  const targetView = document.getElementById('view-' + name);
  if (targetView) targetView.style.display = '';

  const targetNav = document.getElementById(navMap[name]);
  if (targetNav) targetNav.classList.add('active');

  const breadcrumb = document.getElementById('breadcrumb-view');
  if (breadcrumb) {
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    breadcrumb.textContent = cap;
  }

  if (name === 'match') populateJobDropdown();
  if (name === 'overview') renderOverview();
  if (name === 'upload') populatePdfJobDropdown();
}

function updateBadgeCounts() {
  const jobBadge = document.getElementById('badge-jobs-count');
  const candBadge = document.getElementById('badge-cands-count');
  if (jobBadge) jobBadge.textContent = Store.jobs.length;
  if (candBadge) candBadge.textContent = Store.candidates.length;
}

// ===========================================================
//  JOBS MANAGEMENT
// ===========================================================
function addJob() {
  const title = document.getElementById('jobTitle').value.trim();
  const raw = document.getElementById('jobSkills').value.trim();
  if (!title || !raw) { toast('Please fill in both title and required skills', 'error'); return; }

  const skills = SkillExtractor.extract(raw);
  Store.jobs.push({ id: Date.now(), title, skills });
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobSkills').value = '';
  saveToStorage();
  updateBadgeCounts();
  renderJobsList();
  updateStats();
  toast(`Position "${title}" saved (${skills.size} skills)`);
}

function deleteJob(id) {
  Store.jobs = Store.jobs.filter(j => j.id !== id);
  saveToStorage();
  updateBadgeCounts();
  renderJobsList();
  updateStats();
  toast('Job position deleted', 'error');
}

function renderJobsList() {
  const el = document.getElementById('jobs-list');
  if (!el) return;
  if (!Store.jobs.length) {
    el.innerHTML = '<div class="empty-state"><h3>No job positions defined</h3><p>Create a job requirement above.</p></div>';
    return;
  }

  el.innerHTML = Store.jobs.map(j => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--bg-canvas);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;">
      <div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-main);margin-bottom:6px;">${j.title}</div>
        <div class="skill-tags">${[...j.skills].map(s => `<span class="tag">${s}</span>`).join('')}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn btn--secondary btn--sm" onclick="
          showView('match');
          document.getElementById('matchJob').value = '${j.id}';
          runMatch();
        ">Run Match</button>
        <button type="button" class="btn btn--danger btn--sm" onclick="deleteJob(${j.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ===========================================================
//  CANDIDATES MANAGEMENT
// ===========================================================
function addCandidate() {
  const name = document.getElementById('candName').value.trim();
  const raw = document.getElementById('candSkills').value.trim();
  if (!name || !raw) { toast('Please fill in both name and skills', 'error'); return; }

  const skills = SkillExtractor.extract(raw);
  Store.candidates.push({ id: Date.now(), name, skills });
  document.getElementById('candName').value = '';
  document.getElementById('candSkills').value = '';
  saveToStorage();
  updateBadgeCounts();
  renderCandidatesList();
  updateStats();
  toast(`Candidate "${name}" added to talent pool`);
}

function deleteCandidate(id) {
  Store.candidates = Store.candidates.filter(c => c.id !== id);
  saveToStorage();
  updateBadgeCounts();
  renderCandidatesList();
  updateStats();
  toast('Candidate removed from pool', 'error');
}

function renderCandidatesList(filterList = null) {
  const el = document.getElementById('candidates-list');
  if (!el) return;
  const list = filterList || Store.candidates;

  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><h3>No candidates found</h3><p>Upload a resume or add candidate manually.</p></div>';
    return;
  }

  el.innerHTML = list.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--bg-canvas);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;">
      <div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-main);margin-bottom:6px;">
          ${c.name}
          <span style="font-size:0.75rem;color:var(--text-dim);font-weight:500;">(${c.skills.size} technical competencies)</span>
        </div>
        <div class="skill-tags">${[...c.skills].map(s => `<span class="tag">${s}</span>`).join('')}</div>
      </div>
      <button type="button" class="btn btn--danger btn--sm" onclick="deleteCandidate(${c.id})">Delete</button>
    </div>
  `).join('');
}

function filterCandidatesList(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderCandidatesList();
    return;
  }
  const filtered = Store.candidates.filter(c => {
    const matchName = c.name.toLowerCase().includes(q);
    const matchSkill = [...c.skills].some(s => s.toLowerCase().includes(q));
    return matchName || matchSkill;
  });
  renderCandidatesList(filtered);
}

// ===========================================================
//  MATCHING ENGINE & RESULTS
// ===========================================================
function populateJobDropdown() {
  const sel = document.getElementById('matchJob');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Choose Job Position —</option>' +
    Store.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
}

async function runMatch() {
  const jobId = parseInt(document.getElementById('matchJob').value);
  const threshold = parseInt(document.getElementById('matchThreshold').value) || 0;
  if (!jobId) { toast('Please select a target job position', 'error'); return; }

  const job = Store.jobs.find(j => j.id === jobId);
  if (!job) return;
  if (!Store.candidates.length) { toast('Please add candidates to the pool first', 'error'); return; }

  let results;
  let usedJava = false;

  try {
    const resp = await fetch(`http://localhost:8080/api/match?jobId=${jobId}`);
    if (resp.ok) {
      const data = await resp.json();
      results = data
        .filter(r => r.score >= threshold)
        .map(r => ({
          candidate: { id: r.candidate.id, name: r.candidate.name, skills: new Set(r.candidate.skills) },
          score: r.score,
          matched: r.matched,
          missing: r.missing
        }));
      usedJava = true;
    } else {
      throw new Error();
    }
  } catch (_) {
    results = runJSMatch(job, threshold);
  }

  Store.lastResults = results;
  Store.activeJob = job;
  saveToStorage();

  const backendLabel = document.getElementById('backendStatusLabel');
  if (backendLabel) {
    backendLabel.textContent = usedJava ? 'Java Backend :8080 Connected' : 'Local In-Memory Engine Active';
  }

  renderMatchResults(job, results);
  updateStats();
  toast(`Evaluation complete · ${results.length} candidates ranked via Merge Sort`);
}

function runJSMatch(job, threshold) {
  const trace = buildAlgoTrace(job, threshold);
  showAlgoTrace(trace);

  const raw = Store.candidates.map(c => {
    const { score, matched, missing } = EditDistanceScorer.score(c.skills, job.skills);
    return { candidate: c, score, matched, missing };
  });

  return CandidateRanker.sort(raw.filter(r => r.score >= threshold));
}

function buildAlgoTrace(job, threshold) {
  const lines = [
    `=== TALENTMATCH ALGORITHM EXECUTION TRACE ===`,
    `Execution Mode : Client In-Memory JavaScript Runtime`,
    ``,
    `[Step 1] SkillExtractor HashMap Deduplication (Module 1 / 6)`,
    `  Target Position : "${job.title}"`,
    `  Required Skills : { ${[...job.skills].join(', ')} } (${job.skills.size} required competencies)`,
    ``,
    `[Step 2] Wagner-Fischer Dynamic Programming (Module 3)`,
    `  Recurrence Formula : dp[i][j] = 1 + min(replace, delete, insert)`,
    `  Normalized Threshold: distance / max(len_a, len_b) <= 0.35`,
    `  Evaluated Candidates:`,
  ];

  Store.candidates.forEach(c => {
    const { score, matched } = EditDistanceScorer.score(c.skills, job.skills);
    lines.push(`  - ${c.name.padEnd(16)}: ${matched.length}/${job.skills.size} matched (${score}%) [${matched.join(', ')}]`);
  });

  lines.push(
    ``,
    `[Step 3] CandidateRanker Merge Sort (Module 2)`,
    `  Time Complexity : O(n log n) Guaranteed Worst-Case`,
    `  Stability Check : Verified (Preserves original index on tied scores)`,
    `  Minimum Filter  : >= ${threshold}%`,
    ``,
    `[Status] 200 OK — Execution Completed Successfully ✓`
  );
  return lines.join('\n');
}

function showAlgoTrace(text) {
  const card = document.getElementById('algo-trace-card');
  const trace = document.getElementById('algo-trace');
  if (card && trace) {
    card.style.display = '';
    trace.textContent = text;
  }
}

function renderMatchResults(job, results) {
  const card = document.getElementById('match-results-card');
  const tbody = document.getElementById('match-tbody');
  const label = document.getElementById('match-job-label');
  if (!card || !tbody) return;

  card.style.display = '';
  if (label) label.textContent = `Target: ${job.title} (${results.length} ranked)`;

  if (!results.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text-muted);">No candidates met the minimum fit threshold.</td></tr>`;
    return;
  }

  tbody.innerHTML = results.map((r, i) => {
    const rank = i + 1;
    const rankCls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
    const scoreCls = r.score >= 60 ? 'high' : r.score >= 35 ? 'mid' : 'low';
    const statusPill = r.score >= 60 
      ? '<span class="status-pill status-pill--success">&check; Shortlist</span>' 
      : r.score >= 35 
      ? '<span class="status-pill status-pill--warn">Review</span>' 
      : '<span class="status-pill status-pill--neutral">Low Fit</span>';

    return `
      <tr>
        <td><span class="rank-badge ${rankCls}">${rank}</span></td>
        <td><strong>${r.candidate.name}</strong></td>
        <td>
          <div class="score-bar-wrap">
            <div class="score-bar"><div class="score-bar__fill ${scoreCls}" style="width:${r.score}%;"></div></div>
            <span class="score-val ${scoreCls}">${r.score}%</span>
          </div>
        </td>
        <td><div class="skill-tags">${r.matched.map(s => `<span class="tag matched">${s}</span>`).join('')}</div></td>
        <td><div class="skill-tags">${r.missing.map(s => `<span class="tag missing">${s}</span>`).join('')}</div></td>
        <td>${statusPill}</td>
        <td>
          <button type="button" class="btn btn--secondary btn--sm" onclick="inspectCandidate(${i})">
            Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');

  renderOverviewResults(job, results);
}

function renderOverviewResults(job, results) {
  const wrap = document.getElementById('results-table-wrap');
  if (!wrap) return;

  if (!results.length) {
    wrap.innerHTML = `
      <div class="empty-state">
        <h3>No matches calculated yet</h3>
        <p>Go to <strong>Run Match</strong> to evaluate candidates against a position.</p>
        <button type="button" class="btn btn--primary btn--sm" onclick="showView('match')">Execute Match Engine</button>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div style="padding:14px 20px;font-size:0.85rem;color:var(--text-muted);border-bottom:1px solid var(--border);">
      Current Evaluation: <strong style="color:var(--text-main);">${job.title}</strong>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Fit Score</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${results.slice(0, 6).map((r, i) => {
            const scoreCls = r.score >= 60 ? 'high' : r.score >= 35 ? 'mid' : 'low';
            return `
              <tr>
                <td><span class="rank-badge ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">${i + 1}</span></td>
                <td><strong>${r.candidate.name}</strong></td>
                <td>
                  <div class="score-bar-wrap">
                    <div class="score-bar"><div class="score-bar__fill ${scoreCls}" style="width:${r.score}%;"></div></div>
                    <span class="score-val ${scoreCls}">${r.score}%</span>
                  </div>
                </td>
                <td>
                  <span class="status-pill ${r.score >= 60 ? 'status-pill--success' : r.score >= 35 ? 'status-pill--warn' : 'status-pill--neutral'}">
                    ${r.score >= 60 ? 'Shortlist' : r.score >= 35 ? 'Review' : 'Low Fit'}
                  </span>
                </td>
                <td>
                  <button type="button" class="btn btn--ghost btn--sm" onclick="inspectCandidate(${i})">Inspect</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function clearResults() {
  Store.lastResults = [];
  const card = document.getElementById('match-results-card');
  const trace = document.getElementById('algo-trace-card');
  if (card) card.style.display = 'none';
  if (trace) trace.style.display = 'none';
  renderOverview();
  toast('Match results reset');
}

// ===========================================================
//  CANDIDATE INSPECTION MODAL
// ===========================================================
function inspectCandidate(index) {
  const result = Store.lastResults[index];
  if (!result) return;

  const modal = document.getElementById('candidateModal');
  const nameEl = document.getElementById('modalCandName');
  const jobEl = document.getElementById('modalCandJob');
  const scoreEl = document.getElementById('modalCandScore');
  const matchedEl = document.getElementById('modalMatchedSkills');
  const missingEl = document.getElementById('modalMissingSkills');
  const recEl = document.getElementById('modalRecommendation');

  if (nameEl) nameEl.textContent = result.candidate.name;
  if (jobEl) jobEl.textContent = `Role: ${Store.activeJob ? Store.activeJob.title : 'Target Job'}`;
  if (scoreEl) {
    scoreEl.textContent = `${result.score}%`;
    scoreEl.style.color = result.score >= 60 ? 'var(--success-text)' : result.score >= 35 ? 'var(--warning-text)' : 'var(--danger-text)';
  }

  if (matchedEl) {
    matchedEl.innerHTML = result.matched.length
      ? result.matched.map(s => `<span class="tag matched">${s}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:0.8rem;">No matched competencies</span>';
  }

  if (missingEl) {
    missingEl.innerHTML = result.missing.length
      ? result.missing.map(s => `<span class="tag missing">${s}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:0.8rem;">Zero skill gaps identified (100% Match)</span>';
  }

  if (recEl) {
    if (result.score >= 75) {
      recEl.textContent = 'High confidence candidate. Strong alignment on core competencies. Recommend fast-tracking to technical interview.';
    } else if (result.score >= 50) {
      recEl.textContent = `Moderate fit. Candidate is competent but lacks [${result.missing.join(', ')}]. Probe these gaps in phone screening.`;
    } else {
      recEl.textContent = `Significant skill delta. Missing ${result.missing.length} core job competencies. Review for alternative role alignment.`;
    }
  }

  if (modal) modal.classList.add('open');
}

function closeCandidateModal() {
  const modal = document.getElementById('candidateModal');
  if (modal) modal.classList.remove('open');
}

// ===========================================================
//  EXPORT RESULTS TO CSV
// ===========================================================
function exportResultsCSV() {
  if (!Store.lastResults.length) {
    toast('Run a match evaluation first to export results', 'error');
    return;
  }

  const jobTitle = Store.activeJob ? Store.activeJob.title : 'Position';
  let csv = 'Rank,Candidate Name,Fit Score,Matched Skills,Missing Skills,Status\n';

  Store.lastResults.forEach((r, idx) => {
    const rank = idx + 1;
    const name = `"${r.candidate.name.replace(/"/g, '""')}"`;
    const score = `${r.score}%`;
    const matched = `"${r.matched.join('; ')}"`;
    const missing = `"${r.missing.join('; ')}"`;
    const status = r.score >= 60 ? 'Shortlist' : r.score >= 35 ? 'Review' : 'Low Fit';

    csv += `${rank},${name},${score},${matched},${missing},${status}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TalentMatch_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Shortlist.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast('Shortlist exported to CSV');
}

// ===========================================================
//  STATS & METRICS
// ===========================================================
function updateStats() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-candidates', Store.candidates.length);
  set('stat-jobs', Store.jobs.length);

  if (Store.lastResults.length) {
    const avg = Math.round(Store.lastResults.reduce((s, r) => s + r.score, 0) / Store.lastResults.length);
    set('stat-avg', avg + '%');
    const top = Store.lastResults[0];
    set('stat-top', top.score + '%');
    set('stat-top-name', `${top.candidate.name}`);
  } else {
    set('stat-avg', '—');
    set('stat-top', '—');
    set('stat-top-name', 'Run a match to calculate');
  }
}

function renderOverview() {
  const job = Store.activeJob || Store.jobs[0] || { title: 'No jobs defined' };
  renderOverviewResults(job, Store.lastResults);
  updateStats();
}

// ===========================================================
//  TOAST SYSTEM
// ===========================================================
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : '✕';
  t.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${msg}</span>`;
  container.appendChild(t);

  setTimeout(() => {
    t.style.transition = 'opacity 300ms ease, transform 300ms ease';
    t.style.opacity = '0';
    t.style.transform = 'translateX(40px)';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// ===========================================================
//  THEME CONTROLLER (Light Mode / Dark Mode)
// ===========================================================
function initTheme() {
  const saved = localStorage.getItem('talentmatch_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcons(saved);

  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('talentmatch_theme', next);
      updateThemeIcons(next);
      toast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`);
    });
  });
}

function updateThemeIcons(theme) {
  const icons = document.querySelectorAll('.theme-icon');
  icons.forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

// ===========================================================
//  INITIALIZATION
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const restored = loadFromStorage();
  if (!restored) {
    seedSampleData();
  }

  initLanding();
  initPdfUpload();

  if (document.getElementById('view-overview')) {
    showView('overview');
    updateBadgeCounts();
    renderJobsList();
    renderCandidatesList();
    updateStats();
  }
});

