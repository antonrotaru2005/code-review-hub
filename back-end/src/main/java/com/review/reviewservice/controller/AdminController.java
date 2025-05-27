package com.review.reviewservice.controller;

import com.review.reviewservice.dto.TeamDto;
import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.dto.FeedbackDto;
import com.review.reviewservice.dto.UserStatsDto;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.service.TeamService;
import com.review.reviewservice.service.FeedbackService;
import com.review.reviewservice.service.StatisticsService;
import com.review.reviewservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEAM_ADMIN')")
public class AdminController {
    private final UserService userService;
    private final TeamService teamService;
    private final FeedbackService feedbackService;
    private final StatisticsService statisticsService;

    @Autowired
    public AdminController(
            UserService userService,
            TeamService teamService,
            FeedbackService feedbackService,
            StatisticsService statisticsService
    ) {
        this.userService = userService;
        this.teamService = teamService;
        this.feedbackService = feedbackService;
        this.statisticsService = statisticsService;
    }

    /**
     * GET /api/admin/users
     * – ROLE_ADMIN: all users
     * – ROLE_TEAM_ADMIN: *not* allowed here
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> listAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/admin/teams
     * – ROLE_ADMIN: all teams
     * – ROLE_TEAM_ADMIN: only those they created
     */
    @GetMapping("/teams")
    public ResponseEntity<List<TeamDto>> listTeams(
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        boolean isAdmin = oauthUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String me = oauthUser.getAttribute("username");

        List<TeamDto> dtos = (isAdmin
                ? teamService.getAllTeams()
                : teamService.getTeamsCreatedBy(me)
        ).stream()
                .map(TeamDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/admin/teams/{id}/members
     * – ROLE_ADMIN: any team
     * – ROLE_TEAM_ADMIN: only if creator
     */
    @GetMapping("/teams/{id}/members")
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamAdmin(#id, principal.username)")
    public ResponseEntity<List<UserDto>> listTeamMembers(@PathVariable Long id) {
        List<User> members = teamService.getTeamMembers(id);
        List<UserDto> dtos = members.stream()
                .map(u -> new UserDto(
                        u.getUsername(),
                        u.getName(),
                        u.getEmail(),
                        u.getAvatar(),
                        u.getAiModel(),
                        u.getRoles().stream().map(Role::getName).toList(),
                        u.getTeams().stream().map(Team::getName).toList()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/admin/teams/{id}/members/{username}/feedbacks
     */
    @GetMapping("/teams/{id}/members/{username}/feedbacks")
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamAdmin(#id, principal.username)")
    public ResponseEntity<List<FeedbackDto>> listFeedbacksByMember(
            @PathVariable Long id,
            @PathVariable String username
    ) {
        return ResponseEntity.ok(feedbackService.getByUser(username));
    }

    /**
     * GET /api/admin/teams/{id}/members/{username}/stats
     */
    @GetMapping("/teams/{id}/members/{username}/stats")
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamAdmin(#id, principal.username)")
    public ResponseEntity<UserStatsDto> getUserStats(
            @PathVariable Long id,
            @PathVariable String username
    ) {
        return ResponseEntity.ok(statisticsService.getStatsForUser(username));
    }

    /**
     * DELETE /api/admin/teams/{id}/members/{username}/feedbacks/{feedbackId}
     */
    @DeleteMapping("/teams/{id}/members/{username}/feedbacks/{feedbackId}")
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamAdmin(#id, principal.username)")
    public ResponseEntity<Void> deleteMemberFeedback(
            @PathVariable Long id,
            @PathVariable String username,
            @PathVariable Long feedbackId
    ) {
        feedbackService.deleteById(feedbackId);
        return ResponseEntity.noContent().build();
    }
}
