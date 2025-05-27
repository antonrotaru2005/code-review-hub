package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.Team;
import com.review.reviewservice.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByName(String name);
    List<Team> findAllByCreatedBy(User user);
}
