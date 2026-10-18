package com.internflow.rbac;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RolePingController {

    @GetMapping("/student/ping")
    public Map<String, String> student() {
        return Map.of("message", "Hello student");
    }

    @GetMapping("/company/ping")
    public Map<String, String> company() {
        return Map.of("message", "Hello company");
    }

    @GetMapping("/mentor/ping")
    public Map<String, String> mentor() {
        return Map.of("message", "Hello mentor");
    }

    @GetMapping("/admin/ping")
    public Map<String, String> admin() {
        return Map.of("message", "Hello admin");
    }
}