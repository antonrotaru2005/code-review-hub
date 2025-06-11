package com.review.reviewservice.service;

import com.review.reviewservice.exceptions.*;
import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.repository.TeamRepository;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.RoleRepository;
import com.review.reviewservice.util.SecurityUtil;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SecurityUtil securityUtil;
    private static final String USER_NOT_FOUND_PREFIX = "User not found: ";
    private static final String ROLE_TEAM_ADMIN = "ROLE_TEAM_ADMIN";

    @Transactional
    public Team createTeam(String name, String password, String creatorUsername) {
        Optional<Team> existing = teamRepository.findByName(name);
        if (existing.isPresent()) {
            throw new TeamAlreadyExistsException("A team with this name and password already exists.");
        }

        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + creatorUsername));
        Team team = new Team();
        team.setName(name);
        team.setCreatedBy(creator);
        team.getMembers().add(creator);
        team.setPassword(password);
        teamRepository.save(team);

        Role teamAdminRole = roleRepository.findByName(ROLE_TEAM_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: ROLE_TEAM_ADMIN"));
        creator.getRoles().add(teamAdminRole);

        userRepository.save(creator);

        reAuthenticate(creatorUsername);

        return team;
    }

    @Transactional
    public void joinTeam(Long teamId, String username, String providedPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        Team team = findById(teamId);

        if (!team.getPassword().equals(providedPassword)) {
            throw new WrongTeamPasswordException();
        }

        if (team.getMembers().contains(user)) {
            throw new AlreadyMemberException("You are already a member of team " + teamId);
        }

        team.getMembers().add(user);
        teamRepository.save(team);
    }

    @Transactional
    public void leaveTeam(Long teamId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        Team team = findById(teamId);

        if (!team.getMembers().contains(user)) {
            throw new ResourceNotFoundException(
                    "User " + username + " is not a member of team " + teamId);
        }

        boolean isCreator = team.getCreatedBy().getUsername().equals(username);

        team.getMembers().remove(user);

        if (isCreator) {
            if (team.getMembers().isEmpty()) {
                teamRepository.delete(team);
                if (!hasOtherCreatedTeams(user, teamId)) {
                    removeTeamAdminRole(user);
                    userRepository.save(user);
                }
                reAuthenticate(username);
                return;
            } else {
                User newCreator = team.getMembers().iterator().next();
                team.setCreatedBy(newCreator);
                if (!hasOtherCreatedTeams(user, teamId)) {
                    removeTeamAdminRole(user);
                    userRepository.save(user);
                }
            }
        }

        teamRepository.save(team);
        userRepository.save(user);

        reAuthenticate(username);
    }


    @Transactional
    public void deleteTeam(Long teamId, String username) {
        Team team = findById(teamId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        if (!team.getCreatedBy().getUsername().equals(username)) {
            throw new AccessDeniedException("You are not the admin of the team: " + username);
        }

        for (String memberUsername : team.getMembers().stream().map(User::getUsername).toList()) {
            User member = userRepository.findByUsername(memberUsername)
                    .orElse(null);
            if (member != null) {
                member.getTeams().remove(team);
                if (memberUsername.equals(username) && !hasOtherCreatedTeams(user, teamId)) {
                    removeTeamAdminRole(member);
                }
                userRepository.save(member);
            }
        }

        teamRepository.delete(team);
        reAuthenticate(username);
    }

    @Transactional(readOnly = true)
    public List<User> getTeamMembers(Long teamId, String username) {
        Team team = findById(teamId);
        if (!isTeamMember(teamId, username) && !isTeamAdmin(teamId, username)) {
            throw new AccessDeniedException("You do not have access to the team members: " + username);
        }
        return List.copyOf(team.getMembers());
    }

    @Transactional(readOnly = true)
    public List<User> getTeamMembers(Long teamId) {
        Team team = findById(teamId);
        return List.copyOf(team.getMembers());
    }

    @Transactional(readOnly = true)
    public boolean isTeamAdmin(Long teamId, String username) {
        Team team = findById(teamId);
        return team.getCreatedBy().getUsername().equals(username);
    }

    @Transactional(readOnly = true)
    public boolean isTeamMember(Long teamId, String username) {
        Team team = findById(teamId);
        return team.getMembers().stream()
                .anyMatch(u -> u.getUsername().equals(username));
    }

    @Transactional(readOnly = true)
    public boolean isTeamAdminForUser(String username, String adminUsername) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        return user.getTeams().stream()
                .anyMatch(team -> team.getCreatedBy().getUsername().equals(adminUsername));
    }

    @Transactional(readOnly = true)
    public Team findById(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        return new ArrayList<>(user.getTeams());
    }

    @Transactional(readOnly = true)
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsCreatedBy(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_PREFIX + username));
        return teamRepository.findAllByCreatedBy(user);
    }

    private void removeTeamAdminRole(User user) {
        user.getRoles().removeIf(role -> role.getName().equals(ROLE_TEAM_ADMIN));
    }

    private void reAuthenticate(String username) {
        OAuth2AuthenticationToken auth =
                (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        Map<String, Object> attributes = auth.getPrincipal().getAttributes();
        securityUtil.reAuthenticate(username, attributes);
    }

    private boolean hasOtherCreatedTeams(User user, Long excludeTeamId) {
        return teamRepository.findAllByCreatedBy(user)
                .stream()
                .anyMatch(team -> !team.getId().equals(excludeTeamId));
    }
}