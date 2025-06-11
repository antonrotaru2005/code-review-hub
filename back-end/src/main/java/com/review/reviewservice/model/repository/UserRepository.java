package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByBitbucketUuid(String uuid);
    List<String> getUserRolesByUsername(String username);
}
