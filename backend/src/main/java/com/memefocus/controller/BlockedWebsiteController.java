package com.memefocus.controller;

import com.memefocus.model.BlockedWebsite;
import com.memefocus.repository.BlockedWebsiteRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/blocked-websites")
public class BlockedWebsiteController {

    @Autowired
    private BlockedWebsiteRepository blockedWebsiteRepository;

    public record AddWebsiteRequest(String url) {}

    @GetMapping
    public ResponseEntity<List<BlockedWebsite>> getBlockedWebsites(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<BlockedWebsite> sites = blockedWebsiteRepository.findByUserId(userId);
        return ResponseEntity.ok(sites);
    }

    @PostMapping
    public ResponseEntity<?> addWebsite(@RequestBody AddWebsiteRequest requestBody, HttpServletRequest request) {
        if (requestBody.url() == null || requestBody.url().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Website URL cannot be empty"));
        }

        Long userId = (Long) request.getAttribute("userId");
        String formattedUrl = formatUrl(requestBody.url().trim());

        if (blockedWebsiteRepository.existsByUrlAndUserId(formattedUrl, userId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Website is already blocked"));
        }

        BlockedWebsite website = new BlockedWebsite(formattedUrl, userId);
        BlockedWebsite savedWebsite = blockedWebsiteRepository.save(website);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedWebsite);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeWebsite(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<BlockedWebsite> siteOpt = blockedWebsiteRepository.findById(id);

        if (siteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BlockedWebsite website = siteOpt.get();
        if (!website.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        blockedWebsiteRepository.delete(website);
        return ResponseEntity.ok(Map.of("message", "Website removed from block list"));
    }

    /**
     * Helper to clean up input urls (e.g. remove http://, https://, www., and paths)
     * so that the blocker can match domains accurately.
     */
    private String formatUrl(String url) {
        String cleanUrl = url.toLowerCase();
        if (cleanUrl.startsWith("http://")) {
            cleanUrl = cleanUrl.substring(7);
        } else if (cleanUrl.startsWith("https://")) {
            cleanUrl = cleanUrl.substring(8);
        }
        if (cleanUrl.startsWith("www.")) {
            cleanUrl = cleanUrl.substring(4);
        }
        int slashIndex = cleanUrl.indexOf('/');
        if (slashIndex != -1) {
            cleanUrl = cleanUrl.substring(0, slashIndex);
        }
        return cleanUrl;
    }
}
