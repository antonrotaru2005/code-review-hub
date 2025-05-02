package com.review.reviewservice.service;

import com.review.reviewservice.dto.FeedbackDto;
import com.review.reviewservice.model.entity.Feedback;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.FeedbackRepository;
import com.review.reviewservice.model.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    public FeedbackDto save(Long prId, String uuid, String comment, String repoFullName) {
        User user = userRepository.findByBitbucketUuid(uuid)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + uuid));

        Feedback f = new Feedback();
        f.setPrId(prId);
        f.setComment(comment);
        f.setRepoFullName(repoFullName);
        f.setUser(user);
        return toDto(feedbackRepository.save(f));
    }


    public List<FeedbackDto> getByPr(Long prId) {
        return feedbackRepository.findByPrId(prId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<FeedbackDto> getByUser(String username) {
        return feedbackRepository.findByUserUsername(username).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private FeedbackDto toDto(Feedback f) {
        return new FeedbackDto(
                f.getId(),
                f.getRepoFullName(),
                f.getPrId(),
                f.getComment(),
                f.getCreatedAt(),
                f.getUser().getId(),
                f.getUser().getUsername()
        );
    }
}
