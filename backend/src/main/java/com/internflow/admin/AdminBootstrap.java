package com.internflow.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.internflow.user.Role;
import com.internflow.user.RoleRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

// Creates the first admin from local settings when no admin exists yet
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrap(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank() || userRepository.existsByRole_Name("ADMIN")) {
            return;
        }
        if (password.length() < 8) {
            log.warn("The first admin was not created: app.admin.password needs at least 8 characters");
            return;
        }
        String normalized = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalized)) {
            log.warn("The first admin was not created: that email already belongs to another account");
            return;
        }
        Role role = roleRepository.findByName("ADMIN").orElse(null);
        if (role == null) {
            log.warn("The first admin was not created: the ADMIN role is missing");
            return;
        }

        User admin = new User();
        admin.setEmail(normalized);
        admin.setFullName("Platform Admin");
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(role);
        admin.setApproved(true);
        userRepository.save(admin);
        log.info("Created the first admin account ({})", normalized);
    }
}