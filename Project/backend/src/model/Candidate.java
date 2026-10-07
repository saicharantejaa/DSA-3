package model;

import java.util.HashSet;
import java.util.Set;

/**
 * Represents a job candidate.
 * Skills stored in a HashSet for O(1) lookup.
 */
public class Candidate {
    public final int id;
    public final String name;
    public final Set<String> skills; // HashSet<String>

    public Candidate(int id, String name, Set<String> skills) {
        this.id     = id;
        this.name   = name;
        this.skills = new HashSet<>(skills);
    }

    @Override
    public String toString() {
        return "Candidate{id=" + id + ", name='" + name + "', skills=" + skills + "}";
    }
}
