package com.cyp.prompt.expert_backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.cyp.prompt.expert_backend.converter.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalPrompt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String enrichedPrompt;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private List<String> appliedInferences = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String aiResponse;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
