package com.internflow.health;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private static final Instant START_TIME = Instant.now();

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp = false;
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbUp = true;
        } catch (Exception ignored) {
        }

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();

        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        long uptimeSeconds = runtimeBean.getUptime() / 1000;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", dbUp ? "UP" : "DEGRADED");
        response.put("database", dbUp ? "UP" : "DOWN");
        response.put("uptimeSeconds", uptimeSeconds);
        response.put("startedAt", START_TIME.toString());
        response.put("memoryUsedMb", usedMemory / (1024 * 1024));
        response.put("memoryFreeMb", freeMemory / (1024 * 1024));
        response.put("memoryMaxMb", maxMemory / (1024 * 1024));
        response.put("availableProcessors", runtime.availableProcessors());

        return dbUp ? ResponseEntity.ok(response) : ResponseEntity.status(503).body(response);
    }
}
