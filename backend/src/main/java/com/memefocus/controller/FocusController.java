package com.memefocus.controller;

import com.memefocus.model.FocusSession;
import com.memefocus.model.User;
import com.memefocus.repository.FocusSessionRepository;
import com.memefocus.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/focus")
public class FocusController {

    @Autowired
    private FocusSessionRepository focusSessionRepository;

    @Autowired
    private UserRepository userRepository;

    public record LogSessionRequest(int durationMinutes) {}

    @PostMapping
    public ResponseEntity<?> logFocusSession(@RequestBody LogSessionRequest requestBody, HttpServletRequest request) {
        if (requestBody.durationMinutes() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Duration must be greater than 0"));
        }

        Long userId = (Long) request.getAttribute("userId");
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        LocalDateTime now = LocalDateTime.now();

        // 1. Record the focus session
        FocusSession session = new FocusSession(userId, requestBody.durationMinutes(), now);
        focusSessionRepository.save(session);

        // 2. Compute streaks
        // Fetch sessions post-yesterday to determine sequence
        List<FocusSession> sessions = focusSessionRepository.findByUserId(userId);
        
        // Sort sessions by date descending
        sessions.sort((s1, s2) -> s2.getStartTime().compareTo(s1.getStartTime()));

        LocalDate today = LocalDate.now();
        LocalDate lastSessionDate = null;

        // Find the date of the most recent session BEFORE this one
        for (FocusSession s : sessions) {
            LocalDate sDate = s.getStartTime().toLocalDate();
            if (!s.getId().equals(session.getId())) {
                lastSessionDate = sDate;
                break;
            }
        }

        if (lastSessionDate == null) {
            // First ever session
            user.setCurrentStreak(1);
        } else {
            if (lastSessionDate.equals(today)) {
                // Already did a session today, streak is maintained but not incremented again
            } else if (lastSessionDate.equals(today.minusDays(1))) {
                // Did a session yesterday, increment streak
                user.setCurrentStreak(user.getCurrentStreak() + 1);
            } else {
                // Streak was broken (last session was before yesterday)
                user.setCurrentStreak(1);
            }
        }

        user.setLongestStreak(Math.max(user.getLongestStreak(), user.getCurrentStreak()));
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Focus session logged successfully",
                "currentStreak", user.getCurrentStreak(),
                "longestStreak", user.getLongestStreak()
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        List<FocusSession> sessions = focusSessionRepository.findByUserId(userId);

        LocalDate today = LocalDate.now();
        int todayMinutes = 0;
        int totalMinutes = 0;

        for (FocusSession s : sessions) {
            totalMinutes += s.getDurationMinutes();
            if (s.getStartTime().toLocalDate().equals(today)) {
                todayMinutes += s.getDurationMinutes();
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("todayMinutes", todayMinutes);
        stats.put("totalMinutes", totalMinutes);
        stats.put("currentStreak", user.getCurrentStreak());
        stats.put("longestStreak", user.getLongestStreak());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getActivity(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<FocusSession> sessions = focusSessionRepository.findByUserId(userId);

        // Group sessions by date and count them
        Map<String, Integer> activityGrid = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (FocusSession s : sessions) {
            String dateStr = s.getStartTime().format(formatter);
            activityGrid.put(dateStr, activityGrid.getOrDefault(dateStr, 0) + 1);
        }

        return ResponseEntity.ok(activityGrid);
    }
}
