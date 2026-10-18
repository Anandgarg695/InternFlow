package com.internflow.auth;

import com.internflow.user.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    // ADMIN is deliberately missing: nobody can self-register as admin.
    public enum RegistrationRole {
        STUDENT, COMPANY, MENTOR
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull RegistrationRole role) {
    }

    public record LoginRequest(
            @NotBlank String email,
            @NotBlank String password) {
    }

    public record UserResponse(Long id, String fullName, String email, String role) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().getName());
        }
    }

    public record AuthResponse(String token, String tokenType, long expiresIn, UserResponse user) {
    }
}