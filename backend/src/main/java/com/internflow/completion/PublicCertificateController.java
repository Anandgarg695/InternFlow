package com.internflow.completion;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.completion.CompletionDtos.CertificateResponse;

@RestController
@RequestMapping("/api/public/certificates")
public class PublicCertificateController {

    private final CompletionService service;

    public PublicCertificateController(CompletionService service) {
        this.service = service;
    }

    @GetMapping("/{code}")
    public CertificateResponse verify(@PathVariable("code") String code) {
        return service.verify(code);
    }
}