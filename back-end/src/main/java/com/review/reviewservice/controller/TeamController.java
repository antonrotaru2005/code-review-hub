package com.review.reviewservice.controller;

import com.review.reviewservice.dto.CreateTeamDto;
import com.review.reviewservice.dto.TeamDto;
import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(
            @RequestBody CreateTeamDto dto,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute("username");
        var team = teamService.createTeam(dto.name(), username);
        return ResponseEntity.ok(TeamDto.fromEntity(team));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute("username");
        teamService.joinTeam(id, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute("username");
        teamService.leaveTeam(id, username);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@teamService.isTeamAdmin(#id, principal.username) or hasRole('ROLE_TEAM_ADMIN')")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute("username");
        teamService.deleteTeam(id, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("@teamService.isTeamMember(#id, principal.username) or hasRole('ROLE_TEAM_ADMIN')")
    public ResponseEntity<List<UserDto>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute("username");
        var members = teamService.getTeamMembers(id, username)
                .stream()
                .map(u -> new UserDto(
                        u.getUsername(),
                        u.getName(),
                        u.getEmail(),
                        u.getAvatar(),
                        u.getAiModel(),
                        u.getRoles().stream().map(Role::getName).toList()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }
}
