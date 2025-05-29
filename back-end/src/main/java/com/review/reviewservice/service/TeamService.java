package com.review.reviewservice.service;

import com.review.reviewservice.exceptions.AccessDeniedException;
import com.review.reviewservice.exceptions.AlreadyMemberException;
import com.review.reviewservice.exceptions.ResourceNotFoundException;
import com.review.reviewservice.exceptions.WrongTeamPasswordException;
import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.repository.TeamRepository;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public TeamService(TeamRepository teamRepository,
                       UserRepository userRepository,
                       RoleRepository roleRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public Team createTeam(String name, String password, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUsername));
        Team team = new Team();
        team.setName(name);
        team.setCreatedBy(creator);
        team.getMembers().add(creator);
        team.setPassword(password);
        teamRepository.save(team);

        Role teamAdminRole = roleRepository.findByName("ROLE_TEAM_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: ROLE_TEAM_ADMIN"));
        creator.getRoles().add(teamAdminRole);
        userRepository.save(creator);

        return team;
    }

    @Transactional
    public void joinTeam(Long teamId, String username, String providedPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
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
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Team team = findById(teamId);

        if (!team.getMembers().contains(user)) {
            throw new ResourceNotFoundException(
                    "User " + username + " is not a member of team " + teamId);
        }

        if (team.getCreatedBy().getUsername().equals(username)) {
            team.getMembers().remove(user);
            if (team.getMembers().isEmpty()) {
                teamRepository.delete(team);
                return;
            }
            // Select the first remaining member as the new creator
            User newCreator = team.getMembers().iterator().next();
            team.setCreatedBy(newCreator);
        } else {
            team.getMembers().remove(user);
        }

        teamRepository.save(team);
    }

    @Transactional
    public void deleteTeam(Long teamId, String username) {
        Team team = findById(teamId);
        if (!team.getCreatedBy().getUsername().equals(username)) {
            throw new AccessDeniedException("You are not the admin of the team: " + username);
        }
        teamRepository.delete(team);
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
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
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
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return new ArrayList<>(user.getTeams());
    }

    @Transactional(readOnly = true)
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsCreatedBy(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return teamRepository.findAllByCreatedBy(user);
    }
}