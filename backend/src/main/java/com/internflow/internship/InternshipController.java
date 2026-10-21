package com.internflow.internship;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.common.PageResponse;
import com.internflow.internship.InternshipDtos.InternshipResponse;

@RestController
@RequestMapping("/api/internships")
public class InternshipController {

    private final InternshipService service;

    public InternshipController(InternshipService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<InternshipResponse> browse(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "workMode", required = false) String workMode,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "9") int size) {
        return service.browse(q, workMode, page, size);
    }

    @GetMapping("/{id}")
    public InternshipResponse get(@PathVariable("id") Long id) {
        return service.getOpen(id);
    }
}