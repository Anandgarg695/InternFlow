package com.internflow.profile;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.profile.StudentProfileDtos.StudentProfileRequest;
import com.internflow.profile.StudentProfileDtos.StudentProfileResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class StudentProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    public StudentProfileService(StudentProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse get(Long userId) {
        User user = findUser(userId);
        StudentProfile profile = profileRepository.findByUserId(userId).orElse(null);
        return StudentProfileResponse.of(user, profile);
    }

    @Transactional
    public StudentProfileResponse save(Long userId, StudentProfileRequest request) {
        User user = findUser(userId);
        StudentProfile profile = profileRepository.findByUserId(userId).orElseGet(() -> {
            StudentProfile created = new StudentProfile();
            created.setUser(user);
            return created;
        });

        profile.setPhone(clean(request.phone()));
        profile.setUniversity(clean(request.university()));
        profile.setDegree(clean(request.degree()));
        profile.setBranch(clean(request.branch()));
        profile.setGraduationYear(request.graduationYear());
        profile.setCgpa(request.cgpa());
        profile.setSkills(clean(request.skills()));
        profile.setBio(clean(request.bio()));
        profile.setLinkedinUrl(clean(request.linkedinUrl()));
        profile.setGithubUrl(clean(request.githubUrl()));

        profileRepository.save(profile);
        return StudentProfileResponse.of(user, profile);
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