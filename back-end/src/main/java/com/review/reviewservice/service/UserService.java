package com.review.reviewservice.service;

import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for user-related operations.
 */
@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns all users as DTOs.
     */
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Finds a user by username and returns as DTO.
     */
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return toDto(user);
    }

    /**
     * Maps User entity to UserDto, including roles.
     */
    private UserDto toDto(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        String aiModel = user.getAiModel() != null
                ? user.getAiModel().getModel()
                : null;

        return new UserDto(
                user.getUsername(),        // username
                user.getUsername(),        // name (sau alt câmp de display)
                user.getEmail(),           // email
                null,
                aiModel,                   // aiModel
                roles                      // lista de roluri
        );
    }
}
