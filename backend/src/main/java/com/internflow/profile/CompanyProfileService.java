package com.internflow.profile;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.profile.CompanyProfileDtos.CompanyProfileRequest;
import com.internflow.profile.CompanyProfileDtos.CompanyProfileResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class CompanyProfileService {

    private final CompanyProfileRepository profileRepository;
    private final UserRepository userRepository;

    public CompanyProfileService(CompanyProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CompanyProfileResponse get(Long userId) {
        User user = findUser(userId);
        CompanyProfile profile = profileRepository.findByUserId(userId).orElse(null);
        return CompanyProfileResponse.of(user, profile);
    }

    @Transactional
    public CompanyProfileResponse save(Long userId, CompanyProfileRequest request) {
        User user = findUser(userId);
        CompanyProfile profile = profileRepository.findByUserId(userId).orElseGet(() -> {
            CompanyProfile created = new CompanyProfile();
            created.setUser(user);
            return created;
        });

        profile.setCompanyName(clean(request.companyName()));
        profile.setIndustry(clean(request.industry()));
        profile.setCompanySize(clean(request.companySize()));
        profile.setWebsite(clean(request.website()));
        profile.setLocation(clean(request.location()));
        profile.setContactPhone(clean(request.contactPhone()));
        profile.setLinkedinUrl(clean(request.linkedinUrl()));
        profile.setDescription(clean(request.description()));

        profileRepository.save(profile);
        return CompanyProfileResponse.of(user, profile);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}