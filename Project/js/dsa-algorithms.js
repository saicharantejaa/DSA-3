/**
 * TalentMatch — DSA Algorithms Module
 * =====================================================================
 * 1. Trie          → Skill Autocomplete (prefix tree)
 * 2. MaxHeap       → Top-K Priority Queue shortlisting
 * 3. WeightedSkills → Must-have (w=3) / Nice-to-have (w=1) scoring
 * 4. SkillGraph    → BFS for related-skill partial credit
 * 5. LCS           → Longest Common Subsequence (resume vs JD highlight)
 * 6. SortComparison → Merge Sort vs Quick Sort vs Heap Sort race
 * =====================================================================
 */

'use strict';

// ===================================================================
//  1. TRIE — Skill Autocomplete
// ===================================================================
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
    this.word = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    const lower = word.toLowerCase();
    for (const ch of lower) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
    node.word = word; // preserve original casing
  }

  /** Returns up to `limit` suggestions matching the given prefix */
  search(prefix, limit = 8) {
    const lower = prefix.toLowerCase();
    let node = this.root;
    for (const ch of lower) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const results = [];
    this._dfs(node, results, limit);
    return results;
  }

  _dfs(node, results, limit) {
    if (results.length >= limit) return;
    if (node.isEnd) results.push(node.word);
    for (const ch of Object.keys(node.children).sort()) {
      if (results.length >= limit) break;
      this._dfs(node.children[ch], results, limit);
    }
  }
}

// Build the global Trie from SKILL_DICTIONARY keys
const SkillTrie = (() => {
  const trie = new Trie();
  // SKILL_DICTIONARY is defined in app.js — wait for DOMContentLoaded
  const populate = () => {
    if (typeof SKILL_DICTIONARY !== 'undefined') {
      for (const [key, display] of SKILL_DICTIONARY.entries()) {
        trie.insert(display); // insert display name e.g. "JavaScript"
        trie.insert(key);     // also insert raw key e.g. "javascript"
      }
    }
  };
  document.addEventListener('DOMContentLoaded', populate);
  return trie;
})();

// ===================================================================
//  2. MAX-HEAP — Top-K Priority Queue
// ===================================================================
class MaxHeap {
  constructor() {
    this.heap = [];
    this.steps = []; // for animation
  }

  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i)   { return 2 * i + 1; }
  _right(i)  { return 2 * i + 2; }
  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  insert(item) {
    this.heap.push(item);
    this.steps.push({ type: 'insert', value: item.score, heap: [...this.heap] });
    this._bubbleUp(this.heap.length - 1);
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.heap[p].score < this.heap[i].score) {
        this._swap(p, i);
        this.steps.push({ type: 'swap', i: p, j: i, heap: [...this.heap] });
        i = p;
      } else break;
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._heapifyDown(0);
    }
    this.steps.push({ type: 'extract', value: max.score, heap: [...this.heap] });
    return max;
  }

  _heapifyDown(i) {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const l = this._left(i), r = this._right(i);
      if (l < n && this.heap[l].score > this.heap[largest].score) largest = l;
      if (r < n && this.heap[r].score > this.heap[largest].score) largest = r;
      if (largest !== i) {
        this._swap(i, largest);
        this.steps.push({ type: 'swap', i, j: largest, heap: [...this.heap] });
        i = largest;
      } else break;
    }
  }

  /** Extract top-K elements */
  topK(items, k) {
    this.heap = [];
    this.steps = [];
    for (const item of items) this.insert(item);
    const result = [];
    for (let i = 0; i < k && this.heap.length > 0; i++) {
      result.push(this.extractMax());
    }
    return result;
  }

  peek() { return this.heap[0] || null; }
  size() { return this.heap.length; }
}

// ===================================================================
//  3. WEIGHTED SKILL SCORING
// ===================================================================
const WeightedScorer = {
  MUST_HAVE: 3,
  NICE_TO_HAVE: 1,

  /**
   * jobSkills: Map<skillName, weight>  (weight = 3 or 1)
   * candidateSkills: Set<skillName>
   */
  score(candidateSkills, jobSkillWeights) {
    let totalWeight = 0;
    let earnedWeight = 0;
    const matched = [], missing = [];

    for (const [skill, weight] of jobSkillWeights.entries()) {
      totalWeight += weight;
      let found = false;
      for (const cs of candidateSkills) {
        if (EditDistanceScorer.isFuzzyMatch(skill, cs)) { found = true; break; }
      }
      if (found) {
        matched.push({ skill, weight });
        earnedWeight += weight;
      } else {
        missing.push({ skill, weight });
      }
    }

    const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
    return { score, matched, missing, totalWeight, earnedWeight };
  }
};

// ===================================================================
//  4. SKILL GRAPH — BFS for related-skill partial credit
// ===================================================================
const SkillGraph = {
  // Adjacency list: skill → [related skills]
  edges: {
    'react': ['javascript', 'typescript', 'redux', 'html', 'css'],
    'angular': ['javascript', 'typescript', 'html', 'css'],
    'vue': ['javascript', 'html', 'css'],
    'nextjs': ['react', 'javascript', 'typescript'],
    'spring': ['java', 'hibernate', 'maven'],
    'spring boot': ['spring', 'java', 'maven', 'rest api'],
    'hibernate': ['java', 'sql'],
    'django': ['python', 'sql'],
    'flask': ['python'],
    'fastapi': ['python'],
    'nodejs': ['javascript'],
    'express': ['nodejs', 'javascript'],
    'react native': ['react', 'javascript'],
    'flutter': ['dart'],
    'tensorflow': ['python', 'deep learning', 'machine learning'],
    'pytorch': ['python', 'deep learning', 'machine learning'],
    'pandas': ['python', 'data science'],
    'numpy': ['python'],
    'kubernetes': ['docker'],
    'jenkins': ['ci/cd', 'git'],
    'gitlab': ['git'],
    'github': ['git'],
    'mysql': ['sql'],
    'postgresql': ['sql'],
    'sqlite': ['sql'],
    'spark': ['python', 'java'],
    'hadoop': ['java'],
    'elasticsearch': ['java', 'python'],
  },

  /** BFS from each candidate skill — collect related skills at depth 1 with 0.5 credit */
  getRelatedSkills(candidateSkills, depth = 1) {
    const related = new Map(); // skill → credit (0 < c <= 0.5)
    for (const cs of candidateSkills) {
      const key = cs.toLowerCase().trim();
      const neighbors = this.edges[key] || [];
      for (const nb of neighbors) {
        if (!candidateSkills.has(nb) && !related.has(nb)) {
          related.set(nb, 0.5 / depth);
        }
      }
    }
    return related;
  },

  /**
   * Score with BFS partial credit.
   * Exact match = 1 point, related match = 0.5 points
   */
  scoreWithGraph(candidateSkills, jobSkills) {
    const related = this.getRelatedSkills(candidateSkills);
    let totalPossible = jobSkills.size;
    let earned = 0;
    const matched = [], partial = [], missing = [];

    for (const js of jobSkills) {
      let exactFound = false;
      for (const cs of candidateSkills) {
        if (EditDistanceScorer.isFuzzyMatch(js, cs)) { exactFound = true; break; }
      }
      if (exactFound) {
        matched.push(js);
        earned += 1;
      } else if (related.has(js.toLowerCase())) {
        partial.push({ skill: js, credit: related.get(js.toLowerCase()) });
        earned += related.get(js.toLowerCase());
      } else {
        missing.push(js);
      }
    }

    const score = totalPossible === 0 ? 0 : Math.round((earned / totalPossible) * 100);
    return { score, matched, partial, missing };
  }
};

// ===================================================================
//  5. LCS — Longest Common Subsequence
// ===================================================================
const LCSAnalyzer = {
  /**
   * Classic DP LCS on word arrays.
   * Returns { lcs: string[], table: number[][] }
   */
  compute(textA, textB) {
    const wordsA = this._tokenize(textA);
    const wordsB = this._tokenize(textB);
    const m = wordsA.length, n = wordsB.length;

    // Build DP table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (wordsA[i - 1].toLowerCase() === wordsB[j - 1].toLowerCase()) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack
    const lcs = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (wordsA[i - 1].toLowerCase() === wordsB[j - 1].toLowerCase()) {
        lcs.unshift(wordsA[i - 1]);
        i--; j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return { lcs, wordsA, wordsB, dp, lcsLength: dp[m][n] };
  },

  _tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s.+#]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  },

  /**
   * Highlight words in text that appear in the LCS set.
   * Returns HTML string with <mark> around matched words.
   */
  highlightText(text, lcsWords) {
    const lcsSet = new Set(lcsWords.map(w => w.toLowerCase()));
    // Split while preserving whitespace + punctuation
    return text.replace(/(\S+)/g, (word) => {
      const clean = word.replace(/[^\w.+#]/g, '').toLowerCase();
      return lcsSet.has(clean)
        ? `<mark class="lcs-highlight">${word}</mark>`
        : word;
    });
  }
};

// ===================================================================
//  6. SORT COMPARISON — Merge Sort vs Quick Sort vs Heap Sort
// ===================================================================
const SortComparison = {
  _steps: 0,

  mergeSort(arr) {
    this._steps = 0;
    const start = performance.now();
    const sorted = this._mergeSort([...arr]);
    const time = performance.now() - start;
    return { sorted, steps: this._steps, time: time.toFixed(3), algo: 'Merge Sort' };
  },

  _mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = this._mergeSort(arr.slice(0, mid));
    const right = this._mergeSort(arr.slice(mid));
    return this._merge(left, right);
  },

  _merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      this._steps++;
      if (left[i] >= right[j]) result.push(left[i++]);
      else result.push(right[j++]);
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  },

  quickSort(arr) {
    this._steps = 0;
    const start = performance.now();
    const sorted = this._quickSort([...arr], 0, arr.length - 1);
    const time = performance.now() - start;
    return { sorted, steps: this._steps, time: time.toFixed(3), algo: 'Quick Sort' };
  },

  _quickSort(arr, lo, hi) {
    if (lo < hi) {
      const p = this._partition(arr, lo, hi);
      this._quickSort(arr, lo, p - 1);
      this._quickSort(arr, p + 1, hi);
    }
    return arr;
  },

  _partition(arr, lo, hi) {
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      this._steps++;
      if (arr[j] >= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    return i + 1;
  },

  heapSort(arr) {
    this._steps = 0;
    const start = performance.now();
    const a = [...arr];
    const n = a.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) this._heapify(a, n, i);
    for (let i = n - 1; i > 0; i--) {
      [a[0], a[i]] = [a[i], a[0]];
      this._heapify(a, i, 0);
    }
    const time = performance.now() - start;
    return { sorted: a, steps: this._steps, time: time.toFixed(3), algo: 'Heap Sort' };
  },

  _heapify(arr, n, i) {
    let largest = i, l = 2 * i + 1, r = 2 * i + 2;
    this._steps++;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this._heapify(arr, n, largest);
    }
  },

  /** Run all three on same data, return comparison results */
  runAll(scores) {
    const arr = scores.map(s => s.score);
    return [
      this.mergeSort(arr),
      this.quickSort(arr),
      this.heapSort(arr)
    ];
  }
};

// ===================================================================
//  EXPORT (global namespace)
// ===================================================================
window.SkillTrie       = SkillTrie;
window.Trie            = Trie;
window.MaxHeap         = MaxHeap;
window.WeightedScorer  = WeightedScorer;
window.SkillGraph      = SkillGraph;
window.LCSAnalyzer     = LCSAnalyzer;
window.SortComparison  = SortComparison;
