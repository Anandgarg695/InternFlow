package com.internflow.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.admin.AdminDtos.AdminOverview;
import com.internflow.admin.AdminDtos.AdminUserResponse;
import com.internflow.common.ApiException;
import com.internflow.common.PageResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import com.internflow.notification.NotificationService;

@Service
public class AdminService {

    @Autowired
    private NotificationService notifications;

    private static final Set<String> ROLES = Set.of("STUDENT", "COMPANY", "MENTOR", "ADMIN");

    private final UserRepository userRepository;
    private final EntityManager em;

    public AdminService(UserRepository userRepository, EntityManager em) {
        this.userRepository = userRepository;
        this.em = em;
    }

    @Transactional(readOnly = true)
    public AdminOverview overview() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (String role : List.of("STUDENT", "COMPANY", "MENTOR", "ADMIN")) {
            byRole.put(role, 0L);
        }
        List<?> rows = em.createNativeQuery(
                "select r.name, count(*) from users u join roles r on r.id = u.role_id group by r.name")
                .getResultList();
        for (Object row : rows) {
            Object[] cols = (Object[]) row;
            byRole.put((String) cols[0], ((Number) cols[1]).longValue());
        }

        return new AdminOverview(byRole,
                count("select count(*) from users where enabled = false"),
                count("select count(*) from users u join roles r on r.id = u.role_id "
                        + "where r.name = 'COMPANY' and u.approved = false"),
                count("select count(*) from internships"),
                count("select count(*) from internships where status = 'OPEN'"),
                count("select count(*) from applications"),
                count("select count(*) from applications where status = 'SELECTED'"),
                count("select count(*) from placements"),
                count("select count(*) from placements where status = 'COMPLETED'"),
                count("select count(*) from certificates"));
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> users(String role, String q, boolean pending, int page, int size) {
        String roleFilter = role == null ? "" : role.trim().toUpperCase();
        if (!roleFilter.isEmpty() && !ROLES.contains(roleFilter)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown role");
        }
        // Wildcard characters typed by the user are removed so they cannot change the search
        String text = q == null ? "" : q.trim().toLowerCase().replaceAll("[%_\\\\]", "");
        if (text.length() > 100) {
            text = text.substring(0, 100);
        }

        Page<User> result = userRepository.search(roleFilter, pending, text, "%" + text + "%",
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.of(result.map(this::toResponse));
    }

    @Transactional
    public AdminUserResponse setEnabled(Long adminId, Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (!enabled) {
            if (user.getId().equals(adminId)) {
                throw new ApiException(HttpStatus.CONFLICT, "You cannot disable your own account");
            }
            if ("ADMIN".equals(user.getRole().getName()) && user.isEnabled()
                    && userRepository.countByRole_NameAndEnabledTrue("ADMIN") <= 1) {
                throw new ApiException(HttpStatus.CONFLICT, "This is the last active admin");
            }
        }
        user.setEnabled(enabled);
        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse setApproved(Long userId, boolean approved) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (!"COMPANY".equals(user.getRole().getName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only company accounts need approval");
        }
        user.setApproved(approved);
                if (approved) {
            notifications.send(user.getId(), "Company approved",
                    "Your company account was approved. You can publish internships now.",
                    "/company/internships");
        }
        userRepository.save(user);
        return toResponse(user);
    }

    private long count(String sql) {
        return ((Number) em.createNativeQuery(sql).getSingleResult()).longValue();
    }

    private AdminUserResponse toResponse(User u) {
        return new AdminUserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole().getName(),
                u.isEnabled(), u.isApproved(), u.getCreatedAt());
    }
}