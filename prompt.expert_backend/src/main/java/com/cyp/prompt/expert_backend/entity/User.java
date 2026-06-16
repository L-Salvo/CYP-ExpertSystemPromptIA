package com.cyp.prompt.expert_backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.cyp.prompt.expert_backend.enums.EducationLevel;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    // DEMO ACADÉMICA: contraseña en TEXTO PLANO, sin hashing ni Spring Security.
    // Simplificación deliberada — NO apto para producción (ver doc de auth demo).
    // Nullable: los usuarios creados por la vía legacy (POST /api/users) pueden no tenerla.
    @Column
    private String password;

    // Nullable: un usuario recién registrado todavía no completó el onboarding.
    // Estos campos se llenan en PUT /api/users/{id}/onboarding. Su ausencia es
    // justamente lo que permite calcular onboardingComplete (ver UserService).
    @Enumerated(EnumType.STRING)
    @Column
    private EducationLevel educationLevel;

    @Column
    private Integer studyYear;

    @Column(name = "works_in_it")
    private Boolean worksInIT;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserSkill> userSkills = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Chat> chats = new ArrayList<>();
}
