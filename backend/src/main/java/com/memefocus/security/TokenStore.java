package com.memefocus.security;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class TokenStore {
    private static final Map<String, Long> tokenToUserIdMap = new ConcurrentHashMap<>();

    public static String generateToken(Long userId) {
        String token = UUID.randomUUID().toString();
        tokenToUserIdMap.put(token, userId);
        return token;
    }

    public static Long getUserId(String token) {
        if (token == null) return null;
        return tokenToUserIdMap.get(token);
    }

    public static void removeToken(String token) {
        if (token != null) {
            tokenToUserIdMap.remove(token);
        }
    }
}
