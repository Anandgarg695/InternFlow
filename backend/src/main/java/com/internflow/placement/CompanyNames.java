package com.internflow.placement;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Component
public class CompanyNames {

    private final CompanyProfileRepository profileRepository;
    private final UserRepository userRepository;

    public CompanyNames(CompanyProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    public Map<Long, String> forCompanies(Collection<Long> companyUserIds) {
        Map<Long, String> names = new HashMap<>();
        if (companyUserIds.isEmpty()) {
            return names;
        }
        for (User user : userRepository.findAllById(companyUserIds)) {
            names.put(user.getId(), user.getFullName());
        }
        for (CompanyProfile profile : profileRepository.findByUserIdIn(companyUserIds)) {
            String name = profile.getCompanyName();
            if (name != null && !name.isBlank()) {
                names.put(profile.getUser().getId(), name);
            }
        }
        return names;
    }
}