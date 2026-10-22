package com.internflow.profile;

import java.math.BigDecimal;

import com.internflow.user.User;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class StudentProfileDtos {

    private StudentProfileDtos() {
    }

    // Empty fields are sent as null. The URL patterns only allow http(s) links,
    // so nobody can store a "javascript:" link that we might render later.
    public record StudentProfileRequest(
            @Pattern(regexp = "^[0-9+\\-\\s]{7,20}$", message = "Enter a valid phone number") String phone,
            @Size(max = 200) String university,
            @Size(max = 150) String degree,
            @Size(max = 150) String branch,
            @Min(value = 2000, message = "Enter a valid year") @Max(value = 2100, message = "Enter a valid year") Integer graduationYear,
            @DecimalMin(value = "0.0", message = "CGPA must be between 0 and 10") @DecimalMax(value = "10.0", message = "CGPA must be between 0 and 10") BigDecimal cgpa,
            @Size(max = 1000) String skills,
            @Size(max = 2000) String bio,
            @Pattern(regexp = "^https?://.{3,}$", message = "Must start with http:// or https://") @Size(max = 255) String linkedinUrl,
            @Pattern(regexp = "^https?://.{3,}$", message = "Must start with http:// or https://") @Size(max = 255) String githubUrl) {
    }

    public record StudentProfileResponse(
            String fullName,
            String email,
            String phone,
            String university,
            String degree,
            String branch,
            Integer graduationYear,
            BigDecimal cgpa,
            String skills,
            String bio,
            String linkedinUrl,
            String githubUrl,
            boolean complete) {

        public static StudentProfileResponse of(User user, StudentProfile p) {
            if (p == null) {
                return new StudentProfileResponse(user.getFullName(), user.getEmail(),
                        null, null, null, null, null, null, null, null, null, null, false);
            }
                        boolean complete = p.isComplete();
            return new StudentProfileResponse(user.getFullName(), user.getEmail(),
                    p.getPhone(), p.getUniversity(), p.getDegree(), p.getBranch(),
                    p.getGraduationYear(), p.getCgpa(), p.getSkills(), p.getBio(),
                    p.getLinkedinUrl(), p.getGithubUrl(), complete);
        }

        private static boolean hasText(String s) {
            return s != null && !s.isBlank();
        }
    }
}