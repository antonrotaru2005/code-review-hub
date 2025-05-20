package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByPrId(Long prId);
    List<Feedback> findByUserUsername(String username);

    int countByUserUsername(String username);

    @Query("""
      SELECT AVG(LENGTH(f.comment))
      FROM Feedback f
      WHERE f.user.username = :username
    """)
    Double findAvgCommentLengthByUsername(@Param("username") String username);

    @Query("""
      SELECT COUNT(DISTINCT f.repoFullName)
      FROM Feedback f
      WHERE f.user.username = :username
    """)
    int countDistinctReposByUsername(@Param("username") String username);

    @Query("""
      SELECT MAX(f.createdAt)
      FROM Feedback f
      WHERE f.user.username = :username
    """)
    LocalDateTime findLastFeedbackAtByUsername(@Param("username") String username);

    @Query("""
      SELECT AVG(f.rate)
      FROM Feedback f
      WHERE f.user.username = :username
        AND f.rate > 0
    """)
    Double findAvgRateByUsername(@Param("username") String username);
}
