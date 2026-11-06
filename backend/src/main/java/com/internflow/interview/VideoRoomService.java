package com.internflow.interview;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.interview.InterviewDtos.ChatMessage;
import com.internflow.interview.InterviewDtos.SignalMessage;
import com.internflow.interview.InterviewDtos.SignalRequest;
import com.internflow.interview.InterviewDtos.VideoRoomResponse;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class VideoRoomService {

    private final InterviewRepository interviewRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final CompanyProfileRepository companyProfileRepository;

    private final Map<String, List<SignalMessage>> signalsByRoom = new ConcurrentHashMap<>();
    private final Map<String, List<ChatMessage>> chatsByRoom = new ConcurrentHashMap<>();

    public VideoRoomService(InterviewRepository interviewRepository,
            InternshipApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            UserRepository userRepository,
            CompanyProfileRepository companyProfileRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.companyProfileRepository = companyProfileRepository;
    }

    @Transactional(readOnly = true)
    public VideoRoomResponse joinRoom(Long userId, String roomCode) {
        Interview interview = interviewRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video room not found"));

        InternshipApplication app = applicationRepository.findById(interview.getApplicationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        Internship internship = internshipRepository.findById(app.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        boolean isStudent = interview.getStudentId().equals(userId);
        boolean isCompany = internship.getCompanyId().equals(userId);

        if (!isStudent && !isCompany) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to join this interview room");
        }

        String studentName = userRepository.findById(interview.getStudentId())
                .map(User::getFullName).orElse("Candidate");
        String companyName = companyProfileRepository.findByUserId(internship.getCompanyId())
                .map(cp -> cp.getCompanyName()).orElse("Company");

        String role = isCompany ? "INTERVIEWER" : "CANDIDATE";
        return new VideoRoomResponse(interview.getRoomCode(), interview.getId(), role, studentName, companyName,
                internship.getTitle(), interview.getScheduledAt(), interview.getDurationMinutes(), interview.getStatus());
    }

    @Transactional(readOnly = true)
    public void postSignal(Long userId, String roomCode, SignalRequest request) {
        VideoRoomResponse room = joinRoom(userId, roomCode);
        signalsByRoom.computeIfAbsent(roomCode, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(new SignalMessage(room.role(), request.type(), request.payload(), Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<SignalMessage> getSignals(Long userId, String roomCode, Instant since) {
        VideoRoomResponse room = joinRoom(userId, roomCode);
        List<SignalMessage> list = signalsByRoom.getOrDefault(roomCode, Collections.emptyList());
        synchronized (list) {
            return list.stream()
                    .filter(s -> !s.fromRole().equals(room.role()))
                    .filter(s -> since == null || s.timestamp().isAfter(since))
                    .toList();
        }
    }

    @Transactional(readOnly = true)
    public void postChat(Long userId, String roomCode, String text) {
        VideoRoomResponse room = joinRoom(userId, roomCode);
        String senderName = room.role().equals("INTERVIEWER") ? room.companyName() : room.studentName();
        chatsByRoom.computeIfAbsent(roomCode, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(new ChatMessage(senderName, text.trim(), Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getChat(Long userId, String roomCode) {
        joinRoom(userId, roomCode);
        List<ChatMessage> list = chatsByRoom.getOrDefault(roomCode, Collections.emptyList());
        synchronized (list) {
            return new ArrayList<>(list);
        }
    }
}
