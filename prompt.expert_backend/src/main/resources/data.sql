-- =============================================================
-- SEED DE DESARROLLO — se ejecuta sólo con profile dev
-- (spring.jpa.hibernate.ddl-auto=create-drop)
-- =============================================================

-- -------------------------------------------------------------
-- Skills del catálogo
-- Las categorías deben coincidir exactamente con SkillCategory
-- (enum persistido como STRING en mayúsculas).
-- -------------------------------------------------------------
INSERT INTO skills (name, category) VALUES
  ('Java',        'BACKEND'),
  ('Spring Boot', 'BACKEND'),
  ('PostgreSQL',  'DATABASE'),
  ('React',       'FRONTEND'),
  ('TypeScript',  'PROGRAMMING_LANGUAGE'),
  ('Python',      'PROGRAMMING_LANGUAGE'),
  ('Docker',      'DEVOPS'),
  ('Kubernetes',  'DEVOPS'),
  ('AWS',         'CLOUD'),
  ('Git',         'OTHER')
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------------
-- Usuario de desarrollo (ID=1 garantizado al ser el primero)
-- -------------------------------------------------------------
INSERT INTO users (name, email, education_level, study_year, works_in_it)
VALUES ('Lautaro', 'lautaro@example.com', 'UNIVERSITY_STUDENT', 3, true)
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------------
-- UserSkills: asociaciones usuario-skill con nivel
-- Se usa JOIN explícito para evitar producto cartesiano accidental.
-- -------------------------------------------------------------
INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 8
FROM users u JOIN skills s ON s.name = 'Java'
WHERE u.email = 'lautaro@example.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 7
FROM users u JOIN skills s ON s.name = 'Spring Boot'
WHERE u.email = 'lautaro@example.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 5
FROM users u JOIN skills s ON s.name = 'PostgreSQL'
WHERE u.email = 'lautaro@example.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 2
FROM users u JOIN skills s ON s.name = 'Docker'
WHERE u.email = 'lautaro@example.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level)
SELECT u.id, s.id, 3
FROM users u JOIN skills s ON s.name = 'React'
WHERE u.email = 'lautaro@example.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;
