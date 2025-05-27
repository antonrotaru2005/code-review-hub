package com.review.reviewservice.service;

import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.repository.TeamRepository;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.RoleRepository;
import com.review.reviewservice.exceptions.ResourceNotFoundException;
import com.review.reviewservice.exceptions.AccessDeniedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public TeamService(TeamRepository teamRepository,
                       UserRepository userRepository,
                       RoleRepository roleRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public Team createTeam(String name, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUsername));
        Team team = new Team();
        team.setName(name);
        team.setCreatedBy(creator);
        team.getMembers().add(creator);
        teamRepository.save(team);

        Role teamAdminRole = roleRepository.findByName("ROLE_TEAM_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: ROLE_TEAM_ADMIN"));
        creator.getRoles().add(teamAdminRole);
        userRepository.save(creator);

        return team;
    }

    @Transactional
    public void joinTeam(Long teamId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Team team = findById(teamId);
        team.getMembers().add(user);
        teamRepository.save(team);
    }

    @Transactional
    public void leaveTeam(Long teamId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Team team = findById(teamId);
        team.getMembers().remove(user);
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
    public Team findById(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return teamRepository.findAllByCreatedBy(user);
    }
}
