package com.review.reviewservice.controller;

import com.review.reviewservice.dto.CreateTeamDto;
import com.review.reviewservice.dto.JoinTeamDto;
import com.review.reviewservice.dto.TeamDto;
import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.exceptions.TeamAlreadyExistsException;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private static final String USERNAME_KEY = "username";

    @Autowired
    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<TeamDto>> getMyTeams(
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        List<TeamDto> dtos = teamService.getTeamsForUser(username).stream()
                .map(TeamDto::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(
            @RequestBody CreateTeamDto dto,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        var team = teamService.createTeam(dto.name(), dto.password(), username);
        return ResponseEntity.ok(TeamDto.fromEntity(team));
    }

    @ExceptionHandler(TeamAlreadyExistsException.class)
    public ResponseEntity<String> handleTeamExists(TeamAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestBody JoinTeamDto dto
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        teamService.joinTeam(id, username, dto.password());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        teamService.leaveTeam(id, username);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@teamService.isTeamAdmin(#id, #oauthUser.getAttribute('username')) or hasRole('ROLE_TEAM_ADMIN')")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        teamService.deleteTeam(id, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("@teamService.isTeamMember(#id, #oauthUser.getAttribute('username')) or hasRole('ROLE_TEAM_ADMIN')")
    public ResponseEntity<List<UserDto>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String username = oauthUser.getAttribute(USERNAME_KEY);
        var members = teamService.getTeamMembers(id, username)
                .stream()
                .map(u -> new UserDto(
                        u.getUsername(),
                        u.getName(),
                        u.getEmail(),
                        u.getAvatar(),
                        u.getAiModel(),
                        u.getRoles().stream().map(Role::getName).toList(),
                        u.getTeams().stream().map(Team::getName).toList()
                ))
                .toList();
        return ResponseEntity.ok(members);
    }
}
