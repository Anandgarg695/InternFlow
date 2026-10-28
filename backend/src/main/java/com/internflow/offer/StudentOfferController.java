package com.internflow.offer;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.offer.OfferDtos.StudentOfferResponse;

@RestController
@RequestMapping("/api/student/offers")
public class StudentOfferController {

    private final OfferService service;

    public StudentOfferController(OfferService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentOfferResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listOwn(studentId(jwt));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        service.accept(studentId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<Void> decline(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        service.decline(studentId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    private Long studentId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}