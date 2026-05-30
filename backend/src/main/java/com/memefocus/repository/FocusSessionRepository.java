package com.memefocus.repository;

import com.memefocus.model.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findByUserId(Long userId);
    List<FocusSession> findByUserIdAndStartTimeAfter(Long userId, LocalDateTime dateTime);
}
