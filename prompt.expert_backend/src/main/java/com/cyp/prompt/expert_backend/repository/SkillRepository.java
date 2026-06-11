package com.cyp.prompt.expert_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.enums.SkillCategory;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    /**
     * Filtra el catálogo por categoría. La columna {@code category} es un
     * {@link SkillCategory} persistido como STRING, por lo que la comparación
     * es exacta sobre el nombre del enum. La tolerancia a mayúsculas/minúsculas
     * del parámetro recibido por el endpoint se resuelve en {@code SkillService},
     * parseando el {@code String} a {@link SkillCategory} con {@code toUpperCase}.
     */
    List<Skill> findByCategory(SkillCategory category);
}
