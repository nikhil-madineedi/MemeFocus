package com.memefocus.repository;

import com.memefocus.model.BlockedWebsite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlockedWebsiteRepository extends JpaRepository<BlockedWebsite, Long> {
    List<BlockedWebsite> findByUserId(Long userId);
    boolean existsByUrlAndUserId(String url, Long userId);
}
