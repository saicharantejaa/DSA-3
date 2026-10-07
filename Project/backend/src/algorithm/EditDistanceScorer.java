package algorithm;

import model.Candidate;
import model.Job;

import java.util.ArrayList;
import java.util.List;

/**
 * EditDistanceScorer — Algorithm: Edit Distance (Wagner-Fischer DP)
 *
 * SOURCE: DSA-3 Syllabus, Module-3 (Advanced Dynamic Programming)
 *   "Edit distance and its variants: Levenshtein, Damerau-Levenshtein,
 *    weighted edit distance; the Wagner-Fischer algorithm."
 *
 * WHY IT REPLACES JACCARD:
 *   Jaccard requires EXACT skill matches (set intersection).
 *   Edit Distance allows FUZZY matches — it handles real-world resume typos,
 *   abbreviations, and spacing differences.
 *     e.g. "JavaScrpt" vs "JavaScript" → edit distance = 2  → MATCH ✓
 *          "spring boot" vs "springboot" → edit distance = 1 → MATCH ✓
 *
 * ALGORITHM: Wagner-Fischer (bottom-up DP table)
 *   dp[i][j] = min edits to transform a[0..i] into b[0..j]
 *   Time: O(m × n)  where m, n = skill string lengths
 *   Space: O(m × n)
 *
 * SCORING FORMULA:
 *   For each required job skill, find the BEST matching candidate skill
 *   using normalized edit distance = editDist(a,b) / max(len(a), len(b))
 *   If normalized distance ≤ THRESHOLD (0.35), the skill is counted as matched.
 *   Final score = (matched job skills / total job skills) × 100
 */
public class EditDistanceScorer {

    // A skill pair is considered a match if ≤ 35% of chars differ
    private static final double MATCH_THRESHOLD = 0.35;

    /** Holds the scoring result for one candidate–job pair. */
    public static class Result {
        public final Candidate candidate;
        public final int       score;        // 0–100
        public final List<String> matched;   // job skills that were matched
        public final List<String> missing;   // job skills not found in candidate

        public Result(Candidate candidate, int score,
                      List<String> matched, List<String> missing) {
            this.candidate = candidate;
            this.score     = score;
            this.matched   = matched;
            this.missing   = missing;
        }
    }

    // ------------------------------------------------------------------
    //  STEP 1 — Wagner-Fischer Edit Distance (Module 3 core algorithm)
    //
    //  dp[i][j] = minimum edits (insert / delete / replace)
    //             to turn a.substring(0,i) into b.substring(0,j)
    //
    //  Recurrence:
    //    if a[i-1] == b[j-1]:  dp[i][j] = dp[i-1][j-1]          (no cost)
    //    else:                 dp[i][j] = 1 + min(
    //                                        dp[i-1][j],          (delete)
    //                                        dp[i][j-1],          (insert)
    //                                        dp[i-1][j-1] )       (replace)
    // ------------------------------------------------------------------
    public static int editDistance(String a, String b) {
        int m = a.length();
        int n = b.length();

        // dp table: (m+1) × (n+1)
        int[][] dp = new int[m + 1][n + 1];

        // Base cases: transform empty prefix ↔ full string
        for (int i = 0; i <= m; i++) dp[i][0] = i; // delete i chars
        for (int j = 0; j <= n; j++) dp[0][j] = j; // insert j chars

        // Fill DP table bottom-up
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];                    // same char, no edit
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j - 1],                            // replace
                        Math.min(dp[i - 1][j], dp[i][j - 1])        // delete / insert
                    );
                }
            }
        }
        return dp[m][n];
    }

    // ------------------------------------------------------------------
    //  STEP 2 — Normalized Edit Distance
    //  Divides raw distance by max string length → range [0.0, 1.0]
    //  0.0 = identical, 1.0 = completely different
    // ------------------------------------------------------------------
    public static double normalizedEditDistance(String a, String b) {
        int maxLen = Math.max(a.length(), b.length());
        if (maxLen == 0) return 0.0;
        return (double) editDistance(a, b) / maxLen;
    }

    // ------------------------------------------------------------------
    //  STEP 3 — Fuzzy skill match
    //  Returns true if the two skills are "close enough"
    // ------------------------------------------------------------------
    public static boolean isFuzzyMatch(String skillA, String skillB) {
        return normalizedEditDistance(skillA, skillB) <= MATCH_THRESHOLD;
    }

    // ------------------------------------------------------------------
    //  STEP 4 — Score a candidate against a job
    //  For each required job skill, find if any candidate skill matches
    //  (exact OR fuzzy via edit distance).
    // ------------------------------------------------------------------
    public static Result score(Candidate candidate, Job job) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String jobSkill : job.skills) {
            boolean found = false;

            // Check every candidate skill for fuzzy match
            for (String candSkill : candidate.skills) {
                if (isFuzzyMatch(jobSkill, candSkill)) {
                    found = true;
                    break; // no need to keep checking once matched
                }
            }

            if (found) matched.add(jobSkill);
            else        missing.add(jobSkill);
        }

        // Score = matched / total job skills × 100
        int totalJobSkills = job.skills.size();
        int scorePercent   = totalJobSkills == 0
            ? 0
            : (int) Math.round((double) matched.size() / totalJobSkills * 100);

        return new Result(candidate, scorePercent, matched, missing);
    }

    // Quick demo
    public static void main(String[] args) {
        System.out.println("=== Wagner-Fischer Edit Distance Demo ===");
        System.out.println();

        // --- Edit distance examples ---
        String[][] pairs = {
            {"java",       "java"},        // exact
            {"javascript", "java script"}, // spacing
            {"python",     "Pyhton"},      // typo (but we lowercase, so: python vs pyhton)
            {"spring",     "sprint"},      // 1 edit
            {"docker",     "dicker"},      // 1 edit
            {"react",      "angular"},     // very different
        };

        System.out.printf("%-15s %-15s %6s %8s %s%n",
            "Skill A", "Skill B", "Dist", "Norm", "Match?");
        System.out.println("-".repeat(60));

        for (String[] p : pairs) {
            String a = p[0].toLowerCase();
            String b = p[1].toLowerCase();
            int    d = editDistance(a, b);
            double n = normalizedEditDistance(a, b);
            boolean m = isFuzzyMatch(a, b);
            System.out.printf("%-15s %-15s %6d %7.2f   %s%n",
                a, b, d, n, m ? "✓ MATCH" : "✗ NO");
        }

        System.out.println();

        // --- Full candidate scoring ---
        java.util.Set<String> candSkills = new java.util.HashSet<>(
            java.util.Arrays.asList("java", "spring", "sql", "dockr", "microservices"));
        java.util.Set<String> jobSkills = new java.util.HashSet<>(
            java.util.Arrays.asList("java", "spring boot", "sql", "docker", "rest api"));

        Candidate c = new Candidate(1, "Aarav Mehta",  candSkills);
        Job       j = new Job(1, "Senior Java Dev", jobSkills);

        Result r = score(c, j);
        System.out.println("Candidate : " + c.name);
        System.out.println("Score     : " + r.score + "%");
        System.out.println("Matched   : " + r.matched);
        System.out.println("Missing   : " + r.missing);
        System.out.println();
        System.out.println("Note: 'dockr' fuzzy-matched 'docker' (edit dist=1)");
    }
}
