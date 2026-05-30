package com.memefocus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MemeFocusApplication {

    public static void main(String[] args) {
        System.out.println("=== MemeFocus Backend Startup Debug ===");
        System.out.println("SPRING_DATASOURCE_USERNAME: " + System.getenv("SPRING_DATASOURCE_USERNAME"));
        System.out.println("SPRING_DATASOURCE_PASSWORD: " + (System.getenv("SPRING_DATASOURCE_PASSWORD") != null ? "[SET]" : "[NOT SET]"));
        System.out.println("SPRING_DATASOURCE_URL: " + System.getenv("SPRING_DATASOURCE_URL"));
        System.out.println("DATABASE_URL: " + System.getenv("DATABASE_URL"));
        System.out.println("=======================================");
        SpringApplication.run(MemeFocusApplication.class, args);
    }
}
