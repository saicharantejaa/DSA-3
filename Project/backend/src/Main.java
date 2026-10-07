import algorithm.CandidateRanker;
import algorithm.EditDistanceScorer;
import algorithm.EditDistanceScorer.Result;
import algorithm.SkillExtractor;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import model.Candidate;
import model.Job;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.*;

/**
 * TalentMatch — Main Entry Point
 *
 * Simple HTTP server (no frameworks, pure JDK).
 * Endpoints:
 *   GET  /api/candidates          — list all candidates
 *   GET  /api/jobs                — list all jobs
 *   GET  /api/match?jobId=<id>    — run matching algorithm for a job
 *
 * Run:
 *   cd backend/src
 *   javac -d . model/*.java algorithm/*.java Main.java
 *   java Main
 *
 * Then open: http://localhost:8080/api/match?jobId=1
 */
public class Main {

    // In-memory data (replaces a database for this demo)
    static List<Job>       jobs       = new ArrayList<>();
    static List<Candidate> candidates = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        // ---- Seed sample data ----
        seedData();

        // ---- Start HTTP server on port 8080 ----
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/api/candidates", Main::handleCandidates);
        server.createContext("/api/jobs",       Main::handleJobs);
        server.createContext("/api/match",      Main::handleMatch);

        server.start();
        System.out.println("✅ TalentMatch server started on http://localhost:8080");
        System.out.println("   Try: http://localhost:8080/api/match?jobId=1");
    }

    // ------------------------------------------------------------------
    //  HANDLER: GET /api/candidates
    // ------------------------------------------------------------------
    static void handleCandidates(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equals("GET")) { ex.sendResponseHeaders(405, -1); return; }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < candidates.size(); i++) {
            Candidate c = candidates.get(i);
            if (i > 0) sb.append(",");
            sb.append(candidateToJson(c));
        }
        sb.append("]");

        sendJson(ex, 200, sb.toString());
    }

    // ------------------------------------------------------------------
    //  HANDLER: GET /api/jobs
    // ------------------------------------------------------------------
    static void handleJobs(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equals("GET")) { ex.sendResponseHeaders(405, -1); return; }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < jobs.size(); i++) {
            Job j = jobs.get(i);
            if (i > 0) sb.append(",");
            sb.append(jobToJson(j));
        }
        sb.append("]");

        sendJson(ex, 200, sb.toString());
    }

    // ------------------------------------------------------------------
    //  HANDLER: GET /api/match?jobId=<id>
    //
    //  Pipeline:
    //    1. Find the job by ID
    //    2. EditDistanceScorer.score()  — Wagner-Fischer DP per candidate
    //    3. CandidateRanker.sort()      — Merge Sort descending
    //    4. Return JSON array of ranked results
    // ------------------------------------------------------------------
    static void handleMatch(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equals("GET")) { ex.sendResponseHeaders(405, -1); return; }

        // Parse query param: ?jobId=<id>
        String query  = ex.getRequestURI().getQuery(); // "jobId=1"
        int    jobId  = parseJobId(query);

        // Find job
        Job job = jobs.stream().filter(j -> j.id == jobId).findFirst().orElse(null);
        if (job == null) {
            sendJson(ex, 404, "{\"error\":\"Job not found\"}");
            return;
        }

        // Step 2: Score each candidate (Edit Distance — Wagner-Fischer DP, Module 3)
        List<Result> results = new ArrayList<>();
        for (Candidate c : candidates) {
            results.add(EditDistanceScorer.score(c, job));
        }

        // Step 3: Sort by score descending (Merge Sort)
        List<Result> ranked = CandidateRanker.sort(results);

        // Step 4: Build JSON response
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < ranked.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(resultToJson(ranked.get(i), i + 1));
        }
        sb.append("]");

        // Add CORS header so browser JS can call this
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        sendJson(ex, 200, sb.toString());
    }

    // ------------------------------------------------------------------
    //  HELPERS
    // ------------------------------------------------------------------
    static void sendJson(HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes("UTF-8");
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    static int parseJobId(String query) {
        if (query == null) return -1;
        for (String part : query.split("&")) {
            if (part.startsWith("jobId=")) {
                try { return Integer.parseInt(part.substring(6)); }
                catch (NumberFormatException e) { return -1; }
            }
        }
        return -1;
    }

    static String candidateToJson(Candidate c) {
        return "{\"id\":" + c.id + ",\"name\":\"" + c.name + "\",\"skills\":" + setToJson(c.skills) + "}";
    }

    static String jobToJson(Job j) {
        return "{\"id\":" + j.id + ",\"title\":\"" + j.title + "\",\"skills\":" + setToJson(j.skills) + "}";
    }

    static String resultToJson(Result r, int rank) {
        return "{" +
            "\"rank\":" + rank + "," +
            "\"candidate\":" + candidateToJson(r.candidate) + "," +
            "\"score\":" + r.score + "," +
            "\"matched\":" + listToJson(r.matched) + "," +
            "\"missing\":" + listToJson(r.missing) +
        "}";
    }

    static String setToJson(Set<String> set) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (String s : set) {
            if (!first) sb.append(",");
            sb.append("\"").append(s).append("\"");
            first = false;
        }
        return sb.append("]").toString();
    }

    static String listToJson(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(list.get(i)).append("\"");
        }
        return sb.append("]").toString();
    }

    // ------------------------------------------------------------------
    //  SEED DATA — sample jobs and candidates
    // ------------------------------------------------------------------
    static void seedData() {
        // Jobs
        jobs.add(new Job(1, "Senior Java Developer",
            SkillExtractor.extract("java, spring, sql, docker, microservices, rest api")));
        jobs.add(new Job(2, "Frontend Engineer",
            SkillExtractor.extract("html, css, javascript, react, typescript, git")));
        jobs.add(new Job(3, "Data Analyst",
            SkillExtractor.extract("python, sql, pandas, excel, tableau, statistics")));

        // Candidates
        candidates.add(new Candidate(1, "Priya Sharma",
            SkillExtractor.extract("java, spring, sql, docker, microservices, junit, git")));
        candidates.add(new Candidate(2, "Rohan Mehta",
            SkillExtractor.extract("java, spring, rest api, sql, maven, jenkins")));
        candidates.add(new Candidate(3, "Ananya Iyer",
            SkillExtractor.extract("python, sql, pandas, numpy, matplotlib, statistics")));
        candidates.add(new Candidate(4, "Karan Patel",
            SkillExtractor.extract("html, css, javascript, react, git, sass")));
        candidates.add(new Candidate(5, "Divya Nair",
            SkillExtractor.extract("java, python, sql, docker, kubernetes, rest api")));
        candidates.add(new Candidate(6, "Arjun Reddy",
            SkillExtractor.extract("javascript, typescript, react, vue, css, git")));

        System.out.println("Loaded " + jobs.size() + " jobs and " + candidates.size() + " candidates.");
    }
}
