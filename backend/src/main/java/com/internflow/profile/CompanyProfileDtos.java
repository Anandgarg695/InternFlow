package com.internflow.profile;

import com.internflow.user.User;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class CompanyProfileDtos {

    private CompanyProfileDtos() {
    }

    // Empty fields are sent as null. Only http(s) links are accepted, and the size
    // must be one of the fixed ranges the form offers.
    public record CompanyProfileRequest(
            @Size(max = 200) String companyName,
            @Size(max = 100) String industry,
            @Pattern(regexp = "^(1-10|11-50|51-200|201-1000|1000\\+)$", message = "Choose one of the listed sizes") String companySize,
            @Pattern(regexp = "^https?://.{3,}$", message = "Must start with http:// or https://") @Size(max = 255) String website,
            @Size(max = 150) String location,
            @Pattern(regexp = "^[0-9+\\-\\s]{7,20}$", message = "Enter a valid phone number") String contactPhone,
            @Pattern(regexp = "^https?://.{3,}$", message = "Must start with http:// or https://") @Size(max = 255) String linkedinUrl,
            @Size(max = 2000) String description) {
    }

    public record CompanyProfileResponse(
            String contactName,
            String email,
            String companyName,
            String industry,
            String companySize,
            String website,
            String location,
            String contactPhone,
            String linkedinUrl,
            String description,
            boolean complete) {

        public static CompanyProfileResponse of(User user, CompanyProfile p) {
            if (p == null) {
                return new CompanyProfileResponse(user.getFullName(), user.getEmail(),
                        null, null, null, null, null, null, null, null, false);
            }
            boolean complete = hasText(p.getCompanyName()) && hasText(p.getIndustry())
                    && hasText(p.getLocation()) && hasText(p.getDescription());
            return new CompanyProfileResponse(user.getFullName(), user.getEmail(),
                    p.getCompanyName(), p.getIndustry(), p.getCompanySize(), p.getWebsite(),
                    p.getLocation(), p.getContactPhone(), p.getLinkedinUrl(), p.getDescription(), complete);
        }

        private static boolean hasText(String s) {
            return s != null && !s.isBlank();
        }
    }
}