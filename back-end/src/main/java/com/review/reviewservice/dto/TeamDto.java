package com.review.reviewservice.dto;

import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.Team;

import java.util.List;

public record TeamDto(
        Long id,
        String name,
        String createdByUsername,
        List<UserDto> members
) {
    public static TeamDto fromEntity(Team team) {
        List<UserDto> memberDtos = team.getMembers().stream()
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
        return new TeamDto(
                team.getId(),
                team.getName(),
                team.getCreatedBy().getUsername(),
                memberDtos
        );
    }
}