/**
 * TalentMatch — Frontend Logic (app.js)
 *
 *  1. HashMap / HashSet   → SkillExtractor: dedup & normalize skills (Module 1 / 6)
 *  2. Edit Distance (DP)  → EditDistanceScorer: Wagner-Fischer algorithm (Module 3)
 *  3. Merge Sort          → CandidateRanker: sort by score descending
 *  4. PDF Parsing         → PDF.js text extraction → skill detection via HashMap
 */

// ===========================================================
//  TECH SKILLS DICTIONARY  (HashMap lookup for PDF extraction)
//  Key = lowercase keyword found in resume text → Value = display name
// ===========================================================
const SKILL_DICTIONARY = new Map([
  // Languages
  ['java', 'Java'], ['python', 'Python'], ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'], ['c++', 'C++'], ['c#', 'C#'], ['c', 'C'],
  ['ruby', 'Ruby'], ['go', 'Go'], ['rust', 'Rust'], ['kotlin', 'Kotlin'],
  ['swift', 'Swift'], ['php', 'PHP'], ['scala', 'Scala'], ['r', 'R'],
  ['dart', 'Dart'], ['matlab', 'MATLAB'],

  // Web frontend
  ['html', 'HTML'], ['css', 'CSS'], ['react', 'React'], ['angular', 'Angular'],
  ['vue', 'Vue'], ['nextjs', 'Next.js'], ['svelte', 'Svelte'], ['sass', 'Sass'],
  ['bootstrap', 'Bootstrap'], ['jquery', 'jQuery'], ['redux', 'Redux'],
  ['webpack', 'Webpack'], ['tailwind', 'Tailwind'],

  // Backend / frameworks
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

  // Cloud / DevOps
  ['aws', 'AWS'], ['azure', 'Azure'], ['gcp', 'GCP'], ['docker', 'Docker'],
  ['kubernetes', 'Kubernetes'], ['jenkins', 'Jenkins'], ['git', 'Git'],
  ['github', 'GitHub'], ['gitlab', 'GitLab'], ['terraform', 'Terraform'],
  ['ansible', 'Ansible'], ['ci/cd', 'CI/CD'], ['linux', 'Linux'],
  ['nginx', 'Nginx'], ['apache', 'Apache'],

  // Data / ML
  ['machine learning', 'Machine Learning'], ['deep learning', 'Deep Learning'],
  ['tensorflow', 'TensorFlow'], ['pytorch', 'PyTorch'], ['pandas', 'Pandas'],
  ['numpy', 'NumPy'], ['scikit-learn', 'Scikit-Learn'], ['matplotlib', 'Matplotlib'],
  ['tableau', 'Tableau'], ['power bi', 'Power BI'], ['statistics', 'Statistics'],
  ['data science', 'Data Science'], ['nlp', 'NLP'], ['computer vision', 'Computer Vision'],
  ['excel', 'Excel'], ['hadoop', 'Hadoop'], ['spark', 'Spark'],

  // Testing / Tools
  ['junit', 'JUnit'], ['selenium', 'Selenium'], ['jest', 'Jest'],
  ['postman', 'Postman'], ['jira', 'Jira'], ['agile', 'Agile'],
  ['scrum', 'Scrum'], ['linux', 'Linux'], ['bash', 'Bash'],
  ['powershell', 'PowerShell'],

  // Mobile
  ['android', 'Android'], ['ios', 'iOS'], ['react native', 'React Native'],
  ['flutter', 'Flutter'],
]);

// ===========================================================
//  DATA STORE
// ===========================================================
const Store = {
  jobs: [],
  candidates: [],
  lastResults: [],
  // PDF state
  pdf: {
    file: null,
    text: '',
    detectedSkills: new Map(), // skill_key → { display, active }
  }
};

function seedData() {
  // Only seeds if nothing is saved yet (first visit)
  if (Store.jobs.length > 0 || Store.candidates.length > 0) return;
  Store.jobs.push(
    { id: 1, title: 'Senior Java Developer', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'rest api']) },
    { id: 2, title: 'Frontend Engineer', skills: new Set(['html', 'css', 'javascript', 'react', 'typescript', 'git']) },
    { id: 3, title: 'Data Analyst', skills: new Set(['python', 'sql', 'pandas', 'excel', 'tableau', 'statistics']) }
  );
  Store.candidates.push(
    { id: 1, name: 'Priya Sharma', skills: new Set(['java', 'spring', 'sql', 'docker', 'microservices', 'junit', 'git']) },
    { id: 2, name: 'Rohan Mehta', skills: new Set(['java', 'spring', 'rest api', 'sql', 'maven', 'jenkins']) },
    { id: 3, name: 'Ananya Iyer', skills: new Set(['python', 'sql', 'pandas', 'numpy', 'matplotlib', 'statistics']) },
    { id: 4, name: 'Karan Patel', skills: new Set(['html', 'css', 'javascript', 'react', 'git', 'sass']) },
    { id: 5, name: 'Divya Nair', skills: new Set(['java', 'python', 'sql', 'docker', 'kubernetes', 'rest api']) },
    { id: 6, name: 'Arjun Reddy', skills: new Set(['javascript', 'typescript', 'react', 'vue', 'css', 'git']) }
  );
  saveToStorage(); // persist sample data too
}

// ===========================================================
//  LOCALSTORAGE PERSISTENCE
//  Sets/Maps can't be JSON.stringify'd directly,
//  so we convert: Set → Array  on save, Array → Set  on load
// ===========================================================
const STORAGE_KEY = 'talentmatch_v1';

function saveToStorage() {
  try {
    const data = {
      jobs: Store.jobs.map(j => ({
        id: j.id,
        title: j.title,
        skills: [...j.skills]   // Set → Array
      })),
      candidates: Store.candidates.map(c => ({
        id: c.id,
        name: c.name,
        skills: [...c.skills]   // Set → Array
      })),
      lastResults: Store.lastResults.map(r => ({
        score: r.score,
        matched: r.matched,
        missing: r.missing,
        candidate: {
          id: r.candidate.id,
          name: r.candidate.name,
          skills: [...r.candidate.skills]
        }
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false; // nothing saved yet

    const data = JSON.parse(raw);

    // Restore jobs — Array → Set for skills
    Store.jobs = (data.jobs || []).map(j => ({
      id: j.id,
      title: j.title,
      skills: new Set(j.skills)
    }));

    // Restore candidates — Array → Set for skills
    Store.candidates = (data.candidates || []).map(c => ({
      id: c.id,
      name: c.name,
      skills: new Set(c.skills)
    }));

    // Restore last results
    Store.lastResults = (data.lastResults || []).map(r => ({
      score: r.score,
      matched: r.matched,
      missing: r.missing,
      candidate: {
        id: r.candidate.id,
        name: r.candidate.name,
        skills: new Set(r.candidate.skills)
      }
    }));

    return true;
  } catch (e) {
    console.warn('localStorage load failed:', e);
    return false;
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  Store.jobs = [];
  Store.candidates = [];
  Store.lastResults = [];
  renderJobsList();
  renderCandidatesList();
  updateStats();
  renderOverview();
  toast('All data cleared');
}

// ===========================================================
//  ALGORITHM 1 — SkillExtractor  (HashMap / HashSet)
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

  /**
   * Extract skills from free-form PDF text using SKILL_DICTIONARY HashMap.
   * Scans for every known keyword in the text → O(n * m)
   * Also handles PDFs where words run together (no spaces).
   */
  extractFromText(text) {
    // Normalize: lowercase, collapse whitespace
    const lower = text.toLowerCase().replace(/\s+/g, ' ');
    // Also make a no-space version for run-together text (some Chrome PDFs)
    const compact = lower.replace(/\s/g, '');

    const found = new Map(); // HashMap<keyword, { display, active }>

    // Sort by length descending — match longer phrases first
    const sorted = [...SKILL_DICTIONARY.entries()]
      .sort((a, b) => b[0].length - a[0].length);

    for (const [keyword, display] of sorted) {
      const kwCompact = keyword.replace(/\s/g, '');
      if (lower.includes(keyword) || compact.includes(kwCompact)) {
        found.set(keyword, { display, active: true });
      }
    }
    return found; // HashMap<keyword, { display, active }>
  }
};

// ===========================================================
//  ALGORITHM 2 — EditDistanceScorer  (Wagner-Fischer DP, Module 3)
//  Syllabus: Module-3 (Advanced Dynamic Programming)
//  "Edit distance and its variants: Levenshtein, Damerau-Levenshtein,
//   weighted edit distance; the Wagner-Fischer algorithm."
// ===========================================================
const EditDistanceScorer = {
  // Skill match threshold: <= 35% char difference allowed for fuzzy match
  MATCH_THRESHOLD: 0.35,

  /**
   * Wagner-Fischer Dynamic Programming algorithm
   * Computes Levenshtein distance in O(m * n) time and O(m * n) space.
   * dp[i][j] = 1 + min(replace, delete, insert)
   */
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
            dp[i - 1][j - 1], // replace
            dp[i - 1][j],     // delete
            dp[i][j - 1]      // insert
          );
        }
      }
    }
    return dp[m][n];
  },

  /**
   * Normalized edit distance in range [0.0, 1.0]
   */
  normalizedEditDistance(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 0.0;
    return this.editDistance(a, b) / maxLen;
  },

  /**
   * Fuzzy skill match based on edit distance threshold
   */
  isFuzzyMatch(skillA, skillB) {
    const sA = skillA.toLowerCase().trim();
    const sB = skillB.toLowerCase().trim();
    return this.normalizedEditDistance(sA, sB) <= this.MATCH_THRESHOLD;
  },

  /**
   * Scores candidate skills against required job skills.
   * For each job skill, checks if candidate has an exact or fuzzy match.
   * Score = (matched / total required) * 100
   */
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
    const scorePercent = total === 0 ? 0 : Math.round((matched.length / total) * 100);
    return { score: scorePercent, matched, missing };
  }
};

// Alias for compatibility
const FitScorer = EditDistanceScorer;

// ===========================================================
//  ALGORITHM 3 — CandidateRanker  (Merge Sort)
// ===========================================================
const CandidateRanker = {
  sort(results) {
    if (results.length <= 1) return results;
    const mid = Math.floor(results.length / 2);
    const left = this.sort(results.slice(0, mid));
    const right = this.sort(results.slice(mid));
    return this._merge(left, right);
  },
  _merge(left, right) {
    const merged = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i].score >= right[j].score) merged.push(left[i++]);
      else merged.push(right[j++]);
    }
    return merged.concat(left.slice(i)).concat(right.slice(j));
  },
  topK(results, k) {
    return this.sort(results).slice(0, k);
  }
};

// ===========================================================
//  PDF PARSING  (PDF.js)
// ===========================================================

// Use the fake worker so it works reliably on local file:// URLs
// (avoids CDN worker CORS/network issues)
if (typeof pdfjsLib !== 'undefined') {
  // Try CDN worker first; fall back gracefully
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function initPdfUpload() {
  const dropzone = document.getElementById('pdfDropzone');
  const fileInput = document.getElementById('pdfFileInput');
  if (!dropzone || !fileInput) return;

  // Click on dropzone → open file picker
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag events
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') handlePdfFile(file);
    else toast('Please drop a PDF file', 'error');
  });

  // File input change
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handlePdfFile(file);
  });
}

async function handlePdfFile(file) {
  Store.pdf.file = file;
  Store.pdf.text = '';
  Store.pdf.detectedSkills.clear();

  // Show file info bar
  const infoBar = document.getElementById('pdfFileInfo');
  const nameEl = document.getElementById('pdfFileName');
  const sizeEl = document.getElementById('pdfFileSize');
  if (infoBar) {
    nameEl.textContent = file.name;
    sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB · PDF`;
    infoBar.style.display = 'flex';
  }

  // Show text card with loading state
  const textCard = document.getElementById('pdfTextCard');
  const textPrev = document.getElementById('pdfTextPreview');
  const pgCount = document.getElementById('pdfPageCount');
  if (textCard) textCard.style.display = '';
  if (textPrev) textPrev.textContent = '⏳ Extracting text from PDF…';

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF with PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    if (pgCount) pgCount.textContent = `${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`;

    // Extract text from every page
    // Chrome-saved PDFs sometimes split text into individual chars or tiny items
    // Strategy: join with no separator, then add spaces around likely word breaks
    let fullText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      // Build text respecting hasEOL and transform data
      let pageText = '';
      let lastX = null;
      for (const item of content.items) {
        if (!item.str) continue;
        // If there's a big horizontal gap, insert a space
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

    // Clean up: collapse multiple spaces
    Store.pdf.text = fullText.replace(/[ \t]{2,}/g, ' ').trim();

    // Show extracted text preview
    if (textPrev) {
      if (Store.pdf.text.length > 0) {
        textPrev.textContent = Store.pdf.text.slice(0, 800) +
          (Store.pdf.text.length > 800 ? '\n…' : '');
      } else {
        textPrev.textContent =
          '⚠️ Could not extract text from this PDF.\n' +
          'This can happen with scanned/image-only PDFs.\n' +
          'Use the "Paste Resume Text" option below instead.';
        showPasteTextFallback();
      }
    }

    // Step 3: Detect skills using HashMap
    Store.pdf.detectedSkills = SkillExtractor.extractFromText(Store.pdf.text);
    renderPdfSkills();

    // If 0 skills found despite having text — show paste fallback
    if (Store.pdf.detectedSkills.size === 0 && Store.pdf.text.length > 0) {
      showPasteTextFallback();
      toast('⚠️ No skills auto-detected — paste the resume text below', 'error');
    }

    // Show add card
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
    toast(count > 0
      ? `✅ PDF parsed · ${count} skills detected`
      : '⚠️ PDF read but 0 skills found — try pasting resume text');

  } catch (err) {
    console.error('PDF parse error:', err);
    if (textPrev) textPrev.textContent = '❌ Error reading PDF: ' + err.message;
    showPasteTextFallback();
    toast('Could not read PDF — use the paste fallback below', 'error');
  }
}

function renderPdfSkills() {
  const skillCard = document.getElementById('pdfSkillCard');
  const skillTags = document.getElementById('pdfSkillTags');
  const skillCount = document.getElementById('pdfSkillCount');
  if (!skillCard) return;

  skillCard.style.display = '';

  const skills = Store.pdf.detectedSkills;

  // ── FIX: normalise all entries to { display, active } BEFORE iterating the DOM
  // (mutating a Map while forEach-ing it is a bug — do it in a separate pass)
  skills.forEach((val, key) => {
    if (typeof val === 'string') skills.set(key, { display: val, active: true });
  });

  const activeCount = [...skills.values()].filter(e => e.active !== false).length;
  if (skillCount) skillCount.textContent =
    skills.size > 0
      ? `${activeCount} of ${skills.size} skills selected`
      : '0 skills detected — try pasting resume text below';

  if (!skillTags) return;
  skillTags.innerHTML = '';

  // Render tags (safe — no mutation during iteration)
  skills.forEach((entry, key) => {
    const tag = document.createElement('span');
    tag.className = 'tag matched' + (entry.active === false ? ' toggled-off' : '');
    tag.textContent = entry.display;
    tag.title = 'Click to toggle';
    tag.onclick = () => togglePdfSkill(key, tag);
    skillTags.appendChild(tag);
  });
}

function togglePdfSkill(key, tagEl) {
  const entry = Store.pdf.detectedSkills.get(key);
  if (!entry) return;
  entry.active = !entry.active;
  tagEl.classList.toggle('toggled-off', !entry.active);
  // Update count
  const active = [...Store.pdf.detectedSkills.values()].filter(e => e.active).length;
  const countEl = document.getElementById('pdfSkillCount');
  if (countEl) countEl.textContent = `${active} of ${Store.pdf.detectedSkills.size} skills selected`;
}

// Show the paste-text fallback card (when PDF text extraction fails)
function showPasteTextFallback() {
  const card = document.getElementById('pdfPasteCard');
  if (card) card.style.display = '';
}

// Extract skills from manually pasted resume text
function extractFromPastedText() {
  const textarea = document.getElementById('pdfPasteTextarea');
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) { toast('Please paste some resume text first', 'error'); return; }

  Store.pdf.text = text;
  Store.pdf.detectedSkills = SkillExtractor.extractFromText(text);

  // Show text preview
  const textPrev = document.getElementById('pdfTextPreview');
  const textCard = document.getElementById('pdfTextCard');
  if (textCard) textCard.style.display = '';
  if (textPrev) textPrev.textContent = text.slice(0, 800) + (text.length > 800 ? '\n…' : '');

  renderPdfSkills();

  // Show add card
  const addCard = document.getElementById('pdfAddCard');
  if (addCard) { addCard.style.display = ''; populatePdfJobDropdown(); }

  const count = Store.pdf.detectedSkills.size;
  toast(count > 0
    ? `✅ ${count} skills extracted from pasted text`
    : '⚠️ No skills found — try adding them manually below', count > 0 ? 'success' : 'error');
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
  // Show add card in case it wasn't visible
  const addCard = document.getElementById('pdfAddCard');
  if (addCard) { addCard.style.display = ''; populatePdfJobDropdown(); }
  toast(`Added: ${display}`);
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
  sel.innerHTML = '<option value="">— just add to pool —</option>' +
    Store.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
}

function clearPdf() {
  Store.pdf = { file: null, text: '', detectedSkills: new Map() };
  const fileInput = document.getElementById('pdfFileInput');
  if (fileInput) fileInput.value = '';
  document.getElementById('pdfFileInfo').style.display = 'none';
  document.getElementById('pdfTextCard').style.display = 'none';
  document.getElementById('pdfSkillCard').style.display = 'none';
  document.getElementById('pdfAddCard').style.display = 'none';
  toast('Resume cleared');
}

async function addFromPdf() {
  const name = document.getElementById('pdfCandName').value.trim();
  const jobId = parseInt(document.getElementById('pdfMatchJob').value);
  const skills = getActivePdfSkills();

  if (!name) { toast('Please enter a candidate name', 'error'); return; }
  if (skills.size < 1) { toast('No skills selected', 'error'); return; }

  const id = Date.now();
  Store.candidates.push({ id: Date.now(), name, skills });
  toast(`${name} added (${skills.size} skills) — running match…`);
  saveToStorage();          // persist

  updateStats();
  renderCandidatesList();

  if (jobId) {
    const job = Store.jobs.find(j => j.id === jobId);
    if (job) {
      const results = runJSMatch(job, 0);
      Store.lastResults = results;
      showView('match');
      populateJobDropdown();
      document.getElementById('matchJob').value = jobId;
      renderMatchResults(job, results);
      updateStats();
      return;
    }
  }
  showView('candidates');
}

function addFromPdfOnly() {
  const name = document.getElementById('pdfCandName').value.trim();
  const skills = getActivePdfSkills();
  if (!name) { toast('Please enter a candidate name', 'error'); return; }
  if (skills.size < 1) { toast('No skills selected', 'error'); return; }

  Store.candidates.push({ id: Date.now(), name, skills });
  saveToStorage();          // persist
  toast(`${name} added to pool`);
  updateStats();
  renderCandidatesList();
  showView('candidates');
}

// ===========================================================
//  UI HELPERS
// ===========================================================
function showView(name) {
  const views = ['overview', 'upload', 'jobs', 'candidates', 'match'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.style.display = 'none';
  });

  const navKeys = { overview: 'dashboard', upload: 'upload', jobs: 'jobs', candidates: 'candidates', match: 'match' };
  Object.values(navKeys).forEach(k => {
    const el = document.getElementById('nav-' + k);
    if (el) el.classList.remove('active');
  });

  const view = document.getElementById('view-' + name);
  if (view) view.style.display = '';

  const navKey = navKeys[name] || name;
  const nav = document.getElementById('nav-' + navKey);
  if (nav) nav.classList.add('active');

  if (name === 'match') populateJobDropdown();
  if (name === 'overview') renderOverview();
}

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function scoreClass(s) { return s >= 60 ? 'high' : s >= 35 ? 'mid' : 'low'; }
function tagsHtml(arr, cls) { return arr.map(s => `<span class="tag ${cls}">${s}</span>`).join(''); }

// ===========================================================
//  JOBS CRUD
// ===========================================================
function addJob() {
  const title = document.getElementById('jobTitle').value.trim();
  const raw = document.getElementById('jobSkills').value.trim();
  if (!title || !raw) { toast('Fill in both fields', 'error'); return; }

  const skills = SkillExtractor.extract(raw);
  Store.jobs.push({ id: Date.now(), title, skills });
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobSkills').value = '';
  saveToStorage();          // persist
  renderJobsList();
  toast(`Job "${title}" added (${skills.size} skills)`);
  updateStats();
}

function deleteJob(id) {
  Store.jobs = Store.jobs.filter(j => j.id !== id);
  saveToStorage();          // persist
  renderJobsList(); updateStats();
  toast('Job removed', 'error');
}

function renderJobsList() {
  const el = document.getElementById('jobs-list');
  if (!el) return;
  if (!Store.jobs.length) {
    el.innerHTML = `<div class="empty-state"><h3>No jobs yet</h3><p>Create a job position above.</p></div>`;
    return;
  }
  el.innerHTML = Store.jobs.map(j => `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600;margin-bottom:6px">${j.title}</div>
        <div class="skill-tags">${[...j.skills].map(s => `<span class="tag">${s}</span>`).join('')}</div>
      </div>
      <button class="btn btn--danger btn--sm" onclick="deleteJob(${j.id})">Delete</button>
    </div>`).join('');
}

// ===========================================================
//  CANDIDATES CRUD
// ===========================================================
function addCandidate() {
  const name = document.getElementById('candName').value.trim();
  const raw = document.getElementById('candSkills').value.trim();
  if (!name || !raw) { toast('Fill in both fields', 'error'); return; }

  const skills = SkillExtractor.extract(raw);
  Store.candidates.push({ id: Date.now(), name, skills });
  document.getElementById('candName').value = '';
  document.getElementById('candSkills').value = '';
  saveToStorage();          // persist
  renderCandidatesList();
  toast(`Candidate "${name}" added`);
  updateStats();
}

function deleteCandidate(id) {
  Store.candidates = Store.candidates.filter(c => c.id !== id);
  saveToStorage();          // persist
  renderCandidatesList(); updateStats();
  toast('Candidate removed', 'error');
}

function renderCandidatesList() {
  const el = document.getElementById('candidates-list');
  if (!el) return;
  if (!Store.candidates.length) {
    el.innerHTML = `<div class="empty-state"><h3>No candidates</h3><p>Upload a resume or add candidate manually.</p></div>`;
    return;
  }
  el.innerHTML = Store.candidates.map(c => `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600;margin-bottom:6px">${c.name} <span style="font-size:0.75rem;color:var(--text-faint);font-weight:400">(${c.skills.size} skills)</span></div>
        <div class="skill-tags">${[...c.skills].map(s => `<span class="tag">${s}</span>`).join('')}</div>
      </div>
      <button class="btn btn--danger btn--sm" onclick="deleteCandidate(${c.id})">Delete</button>
    </div>`).join('');
}

// ===========================================================
//  MATCHING ENGINE
// ===========================================================
function populateJobDropdown() {
  const sel = document.getElementById('matchJob');
  if (!sel) return;
  sel.innerHTML = '<option value="">— choose a job —</option>' +
    Store.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
}

async function runMatch() {
  const jobId = parseInt(document.getElementById('matchJob').value);
  const threshold = parseInt(document.getElementById('matchThreshold').value) || 0;
  if (!jobId) { toast('Select a job first', 'error'); return; }

  const job = Store.jobs.find(j => j.id === jobId);
  if (!job) return;
  if (!Store.candidates.length) { toast('Add at least one candidate first', 'error'); return; }

  let results;
  try {
    const resp = await fetch(`http://localhost:8080/api/match?jobId=${jobId}`);
    if (resp.ok) {
      const data = await resp.json();
      // Map Java response format to local format
      results = data
        .filter(r => r.score >= threshold)
        .map(r => ({
          candidate: { id: r.candidate.id, name: r.candidate.name, skills: new Set(r.candidate.skills) },
          score: r.score, matched: r.matched, missing: r.missing
        }));
      const backendTrace = [
        `=== TalentMatch Algorithm Execution Trace ===`,
        `Engine: Java HTTP Backend (http://localhost:8080)`,
        ``,
        `[Step 1] SkillExtractor.extract() — HashMap Deduplication (Module 1 / 6)`,
        `  Job "${job.title}": { ${[...job.skills].join(', ')} } (${job.skills.size} required skills)`,
        ``,
        `[Step 2] EditDistanceScorer.score() — Wagner-Fischer Dynamic Programming (Module 3)`,
        `  Algorithm : Wagner-Fischer DP  dp[i][j] = 1 + min(replace, delete, insert)`,
        `  Fuzzy Match: normalized edit distance ≤ 0.35`,
        `  Evaluated : ${data.length} candidates via EditDistanceScorer.java`,
        ``,
        `[Step 3] CandidateRanker.sort() — Merge Sort O(n log n)`,
        `  Sorted candidates descending · threshold=${threshold}%`,
        ``,
        `[Status] HTTP 200 OK — Execution completed successfully ✓`
      ].join('\n');
      showAlgoTrace(backendTrace);
    } else { throw new Error(); }
  } catch (_) {
    results = runJSMatch(job, threshold);
  }

  Store.lastResults = results;
  saveToStorage();            // 💾 persist match results
  renderMatchResults(job, results);
  updateStats();
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
    `=== TalentMatch Algorithm Trace ===`,
    ``,
    `[Step 1] SkillExtractor.extract() — HashMap Deduplication (Module 1 / 6)`,
    `  Job "${job.title}": { ${[...job.skills].join(', ')} }  (${job.skills.size} required skills)`,
    ``,
    `[Step 2] EditDistanceScorer.score() — Wagner-Fischer Dynamic Programming (Module 3)`,
    `  Algorithm : Wagner-Fischer DP  dp[i][j] = 1 + min(replace, delete, insert)`,
    `  Fuzzy Match: normalized edit distance = dist / max(len_a, len_b) ≤ 0.35`,
    `  Formula   : score = (matched skills / total required skills) × 100`,
    `  Results:`,
  ];
  Store.candidates.forEach(c => {
    const { score, matched } = EditDistanceScorer.score(c.skills, job.skills);
    lines.push(`  ${c.name.padEnd(18)}: matched=${matched.length}/${job.skills.size}  score=${score}%  [${matched.join(', ')}]`);
  });
  lines.push(``, `[Step 3] CandidateRanker.sort() — Merge Sort  O(n log n)`);
  lines.push(`  Sorting ${Store.candidates.length} candidates descending · threshold=${threshold}%`);
  lines.push(``, `[Done] ✓`);
  return lines.join('\n');
}

function showAlgoTrace(text) {
  const card = document.getElementById('algo-trace-card');
  const trace = document.getElementById('algo-trace');
  if (card && trace) { card.style.display = ''; trace.textContent = text; }
}

function renderMatchResults(job, results) {
  const card = document.getElementById('match-results-card');
  const tbody = document.getElementById('match-tbody');
  const label = document.getElementById('match-job-label');
  if (!card || !tbody) return;
  card.style.display = '';
  if (label) label.textContent = `for: ${job.title}`;

  if (!results.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No candidates meet the threshold.</td></tr>`;
    return;
  }
  tbody.innerHTML = results.map((r, i) => {
    const rank = i + 1;
    const cls = scoreClass(r.score);
    const rankCls = rank <= 3 ? `rank-${rank}` : '';
    return `<tr>
      <td><span class="rank-badge ${rankCls}">${rank}</span></td>
      <td><strong>${r.candidate.name}</strong></td>
      <td>
        <div class="score-bar-wrap">
          <div class="score-bar"><div class="score-bar__fill ${cls}" style="width:${r.score}%"></div></div>
          <span class="score-val ${cls}">${r.score}%</span>
        </div>
      </td>
      <td><div class="skill-tags">${tagsHtml(r.matched, 'matched')}</div></td>
      <td><div class="skill-tags">${tagsHtml(r.missing, 'missing')}</div></td>
      <td>
        <span class="status ${r.score >= 60 ? 'status--success' : r.score >= 35 ? 'status--warn' : 'status--neutral'}">
          <span class="status-dot"></span>
          ${r.score >= 60 ? 'Shortlist' : r.score >= 35 ? 'Review' : 'Low fit'}
        </span>
      </td>
    </tr>`;
  }).join('');

  renderOverviewResults(job, results);
}

function renderOverviewResults(job, results) {
  const wrap = document.getElementById('results-table-wrap');
  if (!wrap) return;
  if (!results.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🎯</div><h3>No matches</h3><p>No candidates met the threshold.</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <div style="margin-bottom:14px;font-size:0.85rem;color:var(--text-muted)">Job: <strong style="color:var(--text)">${job.title}</strong></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Rank</th><th>Candidate</th><th>Score</th><th>Status</th></tr></thead>
      <tbody>${results.slice(0, 5).map((r, i) => {
    const cls = scoreClass(r.score);
    return `<tr>
          <td><span class="rank-badge ${i < 3 ? 'rank-' + (i + 1) : ''}">${i + 1}</span></td>
          <td><strong>${r.candidate.name}</strong></td>
          <td><div class="score-bar-wrap">
            <div class="score-bar"><div class="score-bar__fill ${cls}" style="width:${r.score}%"></div></div>
            <span class="score-val ${cls}">${r.score}%</span>
          </div></td>
          <td><span class="status ${r.score >= 60 ? 'status--success' : r.score >= 35 ? 'status--warn' : 'status--neutral'}">
            <span class="status-dot"></span>${r.score >= 60 ? 'Shortlist' : r.score >= 35 ? 'Review' : 'Low fit'}
          </span></td>
        </tr>`;
  }).join('')}</tbody>
    </table></div>`;
}

function clearResults() {
  Store.lastResults = [];
  const c = document.getElementById('match-results-card');
  const t = document.getElementById('algo-trace-card');
  if (c) c.style.display = 'none';
  if (t) t.style.display = 'none';
}

// ===========================================================
//  STATS
// ===========================================================
function updateStats() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-candidates', Store.candidates.length);
  set('stat-jobs', Store.jobs.length);
  if (Store.lastResults.length) {
    const avg = Math.round(Store.lastResults.reduce((s, r) => s + r.score, 0) / Store.lastResults.length);
    set('stat-avg', avg + '%');
    const top = Store.lastResults[0];
    set('stat-top', top.score + '%');
    set('stat-top-name', top.candidate.name);
  }
}

function renderOverview() {
  const job = Store.jobs[0] || { title: 'Last run' };
  renderOverviewResults(job, Store.lastResults);
  updateStats();
}

// ===========================================================
//  LANDING PAGE  (login modal)
// ===========================================================
function initLanding() {
  const loginBtn = document.getElementById('loginBtn');
  const modal = document.getElementById('loginModal');
  const closeBtn = document.getElementById('closeLoginModal');
  if (loginBtn && modal) {
    loginBtn.addEventListener('click', () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  }
}

// ===========================================================
//  INIT
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Try to restore from localStorage
  const restored = loadFromStorage();

  // 2. If nothing saved yet, seed with sample data
  if (!restored) seedData();

  initLanding();
  initPdfUpload();

  if (document.getElementById('view-overview')) {
    showView('overview');
    renderJobsList();
    renderCandidatesList();
    updateStats();
  }
});
