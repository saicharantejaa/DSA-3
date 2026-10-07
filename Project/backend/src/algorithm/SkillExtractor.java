package algorithm;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * SkillExtractor — Algorithm: HashMap / HashSet
 *
 * Parses a raw comma-separated skill string into a normalized Set<String>.
 *
 * Key DSA concepts used:
 *   - HashMap<String, String>  : stores skill → normalized_skill (for deduplication)
 *   - HashSet<String>          : final deduplicated skill set
 *
 * Time complexity:  O(n)  — single pass over tokens
 * Space complexity: O(n)  — HashMap of size ≤ n
 */
public class SkillExtractor {

    /**
     * Extract and normalize skills from a raw text string.
     *
     * @param rawText  comma-separated skills, e.g. "Java, Spring Boot, SQL"
     * @return         HashSet of normalized, deduplicated lowercase skill strings
     */
    public static Set<String> extract(String rawText) {
        // HashMap: key = normalized skill, value = normalized skill
        // Using HashMap here to demonstrate the data structure;
        // effectively acts as a HashSet with O(1) put/contains.
        Map<String, String> skillMap = new HashMap<>();

        String[] tokens = rawText.split(",");
        for (String token : tokens) {
            String normalized = token.trim().toLowerCase();
            if (!normalized.isEmpty()) {
                skillMap.put(normalized, normalized); // dedup: duplicate keys overwrite
            }
        }

        // Return as HashSet<String>
        return new HashSet<>(skillMap.keySet());
    }

    // Quick demo
    public static void main(String[] args) {
        String raw = "Java, Spring, SQL, Java, Docker, spring";
        Set<String> skills = extract(raw);
        System.out.println("Extracted skills: " + skills);
        // Output: [java, spring, sql, docker]  (deduplicated, lowercase)
    }
}
