package model;

import java.util.HashSet;
import java.util.Set;

/**
 * Represents a job posting.
 * Skills stored in a HashSet for O(1) lookup.
 */
public class Job {
    public final int id;
    public final String title;
    public final Set<String> skills; // HashSet<String>

    public Job(int id, String title, Set<String> skills) {
        this.id     = id;
        this.title  = title;
        this.skills = new HashSet<>(skills);
    }

    @Override
    public String toString() {
        return "Job{id=" + id + ", title='" + title + "', skills=" + skills + "}";
    }
}
