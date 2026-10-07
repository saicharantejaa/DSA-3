package algorithm;

import algorithm.EditDistanceScorer.Result;

import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

/**
 * CandidateRanker — Algorithms: Merge Sort + Priority Queue (Max-Heap)
 *
 * Sorts candidate EditDistanceScorer.Result objects by score (descending).
 *
 * Two methods provided:
 *   1. sort()  — full Merge Sort, O(n log n), returns all candidates ranked
 *   2. topK()  — Max-Heap Priority Queue, O(n log k), returns only top-K
 *
 * Why Merge Sort?
 *   - Stable: candidates with equal scores keep their original order
 *   - Predictable O(n log n) in all cases (no worst-case like QuickSort)
 *   - Great for leaderboard / ranking use cases
 */
public class CandidateRanker {

    // -------------------------------------------------------
    //  METHOD 1: Merge Sort  — O(n log n)
    // -------------------------------------------------------

    /**
     * Sort all candidates by fit score descending using Merge Sort.
     *
     * @param results  list of EditDistanceScorer.Result
     * @return         new list sorted descending by score
     */
    public static List<Result> sort(List<Result> results) {
        if (results.size() <= 1) return new ArrayList<>(results);

        int mid = results.size() / 2;
        List<Result> left  = sort(results.subList(0, mid));
        List<Result> right = sort(results.subList(mid, results.size()));

        return merge(left, right);
    }

    /** Merge two sorted halves (descending by score). */
    private static List<Result> merge(List<Result> left, List<Result> right) {
        List<Result> merged = new ArrayList<>();
        int i = 0, j = 0;

        while (i < left.size() && j < right.size()) {
            // Descending: pick the higher score first
            if (left.get(i).score >= right.get(j).score) {
                merged.add(left.get(i++));
            } else {
                merged.add(right.get(j++));
            }
        }

        // Append remaining elements
        while (i < left.size())  merged.add(left.get(i++));
        while (j < right.size()) merged.add(right.get(j++));

        return merged;
    }

    // -------------------------------------------------------
    //  METHOD 2: Top-K using Max-Heap (PriorityQueue)  — O(n log k)
    // -------------------------------------------------------

    /**
     * Return the top-K candidates by score using a Max-Heap.
     *
     * More efficient than full sort when you only need top-K
     * and K << N.
     *
     * @param results  list of EditDistanceScorer.Result
     * @param k        number of top candidates to return
     * @return         top-K list sorted descending
     */
    public static List<Result> topK(List<Result> results, int k) {
        // Max-Heap: highest score at top
        PriorityQueue<Result> maxHeap = new PriorityQueue<>(
            (a, b) -> b.score - a.score  // comparator: descending
        );
        maxHeap.addAll(results);

        List<Result> top = new ArrayList<>();
        int count = Math.min(k, maxHeap.size());
        for (int i = 0; i < count; i++) {
            top.add(maxHeap.poll()); // O(log n) each poll
        }
        return top;
    }

    // Quick demo
    public static void main(String[] args) {
        // Simulate results with dummy scores
        System.out.println("=== Merge Sort Demo ===");
        System.out.println("Sorts all candidates — O(n log n)");
        System.out.println("Use sort() for full ranking leaderboard.");
        System.out.println();
        System.out.println("=== Priority Queue / Top-K Demo ===");
        System.out.println("Use topK(results, 3) to get the top 3 candidates.");
    }
}
