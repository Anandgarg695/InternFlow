package com.internflow.interview;

import java.time.Instant;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.interview.InterviewDtos.ChatMessage;
import com.internflow.interview.InterviewDtos.ChatRequest;
import com.internflow.interview.InterviewDtos.SignalMessage;
import com.internflow.interview.InterviewDtos.SignalRequest;
import com.internflow.interview.InterviewDtos.VideoRoomResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/interviews/room")
public class VideoRoomController {

    private final VideoRoomService service;

    public VideoRoomController(VideoRoomService service) {
        this.service = service;
    }

    @GetMapping("/{roomCode}")
    public VideoRoomResponse join(@AuthenticationPrincipal Jwt jwt, @PathVariable("roomCode") String roomCode) {
        return service.joinRoom(userId(jwt), roomCode);
    }

    @PostMapping("/{roomCode}/signal")
    public void signal(@AuthenticationPrincipal Jwt jwt, @PathVariable("roomCode") String roomCode,
            @Valid @RequestBody SignalRequest request) {
        service.postSignal(userId(jwt), roomCode, request);
    }

    @GetMapping("/{roomCode}/signals")
    public List<SignalMessage> getSignals(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("roomCode") String roomCode,
            @RequestParam(name = "since", required = false) Instant since) {
        return service.getSignals(userId(jwt), roomCode, since);
    }

    @PostMapping("/{roomCode}/chat")
    public void chat(@AuthenticationPrincipal Jwt jwt, @PathVariable("roomCode") String roomCode,
            @Valid @RequestBody ChatRequest request) {
        service.postChat(userId(jwt), roomCode, request.text());
    }

    @GetMapping("/{roomCode}/chat")
    public List<ChatMessage> getChat(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("roomCode") String roomCode) {
        return service.getChat(userId(jwt), roomCode);
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
