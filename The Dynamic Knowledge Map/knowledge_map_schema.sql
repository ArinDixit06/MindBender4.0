-- Knowledge Map Database Schema for Scholarly
-- This extends your existing database with knowledge map functionality

-- Create subjects table for knowledge map (extends your existing subjects)
CREATE TABLE knowledge_subjects (
  id SERIAL PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  board VARCHAR(50) NOT NULL,
  class_level VARCHAR(10) NOT NULL,
  stream VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create concepts table (the nodes in the knowledge map)
CREATE TABLE knowledge_concepts (
  id SERIAL PRIMARY KEY,
  concept_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'basic-arithmetic'
  subject_id INTEGER REFERENCES knowledge_subjects(id) ON DELETE CASCADE,
  concept_name VARCHAR(255) NOT NULL,
  description TEXT,
  content_url TEXT, -- Link to learning material/video
  icon_class VARCHAR(50) DEFAULT 'fa-book', -- FontAwesome icon class
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
  estimated_time_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prerequisites table (defines the connections between concepts)
CREATE TABLE knowledge_prerequisites (
  id SERIAL PRIMARY KEY,
  concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  prerequisite_concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  strength INTEGER DEFAULT 1, -- How important this prerequisite is (1-3)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(concept_id, prerequisite_concept_id)
);

-- Create user progress table (tracks student progress through concepts)
CREATE TABLE knowledge_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
  concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  quiz_score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, concept_id)
);

-- Create quiz questions table
CREATE TABLE knowledge_quiz_questions (
  id SERIAL PRIMARY KEY,
  concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
  options JSON, -- Array of options for multiple choice
  correct_answer INTEGER, -- Index of correct option
  explanation TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz attempts table (tracks student quiz attempts)
CREATE TABLE knowledge_quiz_attempts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
  concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  answers JSON, -- Array of student answers
  attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create learning paths table (for structured learning sequences)
CREATE TABLE knowledge_learning_paths (
  id SERIAL PRIMARY KEY,
  path_name VARCHAR(255) NOT NULL,
  subject_id INTEGER REFERENCES knowledge_subjects(id) ON DELETE CASCADE,
  description TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level IN (1, 2, 3, 4, 5)),
  estimated_duration_hours INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create path concepts table (concepts in each learning path)
CREATE TABLE knowledge_path_concepts (
  id SERIAL PRIMARY KEY,
  path_id INTEGER REFERENCES knowledge_learning_paths(id) ON DELETE CASCADE,
  concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(path_id, concept_id)
);

-- Create indexes for better performance
CREATE INDEX idx_concepts_subject_id ON knowledge_concepts(subject_id);
CREATE INDEX idx_concepts_position ON knowledge_concepts(position_x, position_y);
CREATE INDEX idx_prerequisites_concept ON knowledge_prerequisites(concept_id);
CREATE INDEX idx_prerequisites_prereq ON knowledge_prerequisites(prerequisite_concept_id);
CREATE INDEX idx_progress_student ON knowledge_progress(student_id);
CREATE INDEX idx_progress_concept ON knowledge_progress(concept_id);
CREATE INDEX idx_progress_status ON knowledge_progress(status);
CREATE INDEX idx_quiz_questions_concept ON knowledge_quiz_questions(concept_id);
CREATE INDEX idx_quiz_attempts_student ON knowledge_quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_concept ON knowledge_quiz_attempts(concept_id);

-- Insert sample data for Mathematics
INSERT INTO knowledge_subjects (subject_name, board, class_level, description) 
VALUES 
('Mathematics', 'CBSE', '10', 'Class 10 Mathematics concepts following NCERT curriculum'),
('Science', 'CBSE', '10', 'Class 10 Science concepts covering Physics, Chemistry, and Biology');

-- Insert sample concepts for Mathematics
INSERT INTO knowledge_concepts (concept_id, subject_id, concept_name, description, position_x, position_y, icon_class, difficulty_level) 
VALUES 
('basic-arithmetic', 1, 'Basic Arithmetic', 'Learn addition, subtraction, multiplication, and division', 200, 150, 'fa-plus', 1),
('fractions', 1, 'Fractions', 'Understanding parts of a whole and operations with fractions', 350, 150, 'fa-divide', 2),
('decimals', 1, 'Decimals', 'Working with decimal numbers and place value', 500, 150, 'fa-dot-circle', 2),
('percentages', 1, 'Percentages', 'Converting between fractions, decimals, and percentages', 650, 150, 'fa-percentage', 2),
('algebra-basics', 1, 'Algebra Basics', 'Introduction to variables, expressions, and simple equations', 350, 300, 'fa-x', 3),
('linear-equations', 1, 'Linear Equations', 'Solving equations with one variable', 500, 300, 'fa-chart-line', 3),
('quadratic-equations', 1, 'Quadratic Equations', 'Second-degree polynomial equations and their solutions', 650, 300, 'fa-square', 4);

-- Insert sample concepts for Science
INSERT INTO knowledge_concepts (concept_id, subject_id, concept_name, description, position_x, position_y, icon_class, difficulty_level) 
VALUES 
('scientific-method', 2, 'Scientific Method', 'How scientists study and understand the natural world', 200, 150, 'fa-search', 1),
('matter-states', 2, 'States of Matter', 'Solid, liquid, gas, and plasma states', 350, 150, 'fa-water', 2),
('atomic-structure', 2, 'Atomic Structure', 'Protons, neutrons, and electrons in atoms', 500, 150, 'fa-atom', 3),
('chemical-bonds', 2, 'Chemical Bonds', 'How atoms connect to form compounds', 650, 150, 'fa-link', 3),
('cell-biology', 2, 'Cell Biology', 'Basic unit of life and cellular processes', 350, 300, 'fa-circle-dot', 2),
('genetics', 2, 'Genetics', 'Inheritance, DNA, and variation in living organisms', 500, 300, 'fa-dna', 4);

-- Insert prerequisites (the magic connections!)
INSERT INTO knowledge_prerequisites (concept_id, prerequisite_concept_id, strength) 
VALUES 
('fractions', 'basic-arithmetic', 3),
('decimals', 'fractions', 2),
('percentages', 'decimals', 2),
('algebra-basics', 'basic-arithmetic', 3),
('linear-equations', 'algebra-basics', 3),
('quadratic-equations', 'linear-equations', 3),
('matter-states', 'scientific-method', 2),
('atomic-structure', 'matter-states', 3),
('chemical-bonds', 'atomic-structure', 3),
('cell-biology', 'scientific-method', 2),
('genetics', 'cell-biology', 3);

-- Insert sample quiz questions for basic arithmetic
INSERT INTO knowledge_quiz_questions (concept_id, question_text, options, correct_answer, explanation, difficulty) 
VALUES 
('basic-arithmetic', 'What is 15 + 27?', '["32", "42", "52", "62"]', 1, 'Add the ones: 5 + 7 = 12. Add the tens: 1 + 2 + 1 (carry) = 4. Answer: 42', 1),
('basic-arithmetic', 'What is 8 × 7?', '["54", "56", "58", "64"]', 1, '8 × 7 = 56. You can think of it as 8 × (5 + 2) = 8 × 5 + 8 × 2 = 40 + 16 = 56', 1),
('basic-arithmetic', 'What is 84 ÷ 12?', '["6", "7", "8", "9"]', 1, '84 ÷ 12 = 7. You can verify: 7 × 12 = 84', 2),
('fractions', 'What is 1/2 + 1/4?', '["2/6", "3/4", "2/4", "1/6"]', 1, 'Find common denominator: 1/2 = 2/4, so 2/4 + 1/4 = 3/4', 2),
('fractions', 'Simplify 12/16', '["3/4", "6/8", "2/3", "4/5"]', 0, 'Divide both numerator and denominator by their GCD (4): 12÷4 = 3, 16÷4 = 4, so 12/16 = 3/4', 2);

-- Create a function to unlock concepts based on prerequisites
CREATE OR REPLACE FUNCTION update_concept_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- When a concept is completed, check if any locked concepts can be unlocked
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Find concepts that have the completed concept as a prerequisite
        UPDATE knowledge_progress 
        SET status = 'unlocked', last_accessed = CURRENT_TIMESTAMP
        WHERE student_id = NEW.student_id 
        AND concept_id IN (
            SELECT kp.concept_id 
            FROM knowledge_prerequisites kp 
            WHERE kp.prerequisite_concept_id = NEW.concept_id
            AND NOT EXISTS (
                -- Check if all prerequisites are met
                SELECT 1 FROM knowledge_prerequisites kp2
                JOIN knowledge_progress prog ON kp2.prerequisite_concept_id = prog.concept_id
                WHERE kp2.concept_id = kp.concept_id 
                AND prog.student_id = NEW.student_id
                AND prog.status != 'completed'
            )
        )
        AND status = 'locked';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically unlock concepts
CREATE TRIGGER trigger_update_concept_availability
    AFTER UPDATE ON knowledge_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_concept_availability();

-- Function to initialize student progress for a subject
CREATE OR REPLACE FUNCTION initialize_student_progress(p_student_id INTEGER, p_subject_id INTEGER)
RETURNS VOID AS $$
DECLARE
    concept_record RECORD;
BEGIN
    -- Insert locked progress for all concepts in the subject
    FOR concept_record IN 
        SELECT concept_id FROM knowledge_concepts WHERE subject_id = p_subject_id
    LOOP
        INSERT INTO knowledge_progress (student_id, concept_id, status)
        VALUES (p_student_id, concept_record.concept_id, 'locked')
        ON CONFLICT (student_id, concept_id) DO NOTHING;
    END LOOP;
    
    -- Unlock concepts that have no prerequisites
    UPDATE knowledge_progress 
    SET status = 'unlocked'
    WHERE student_id = p_student_id 
    AND concept_id IN (
        SELECT kc.concept_id 
        FROM knowledge_concepts kc
        LEFT JOIN knowledge_prerequisites kp ON kc.concept_id = kp.concept_id
        WHERE kc.subject_id = p_subject_id AND kp.concept_id IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Sample data: Initialize progress for student (you'll call this when a student first accesses a subject)
-- SELECT initialize_student_progress(123456, 1); -- For Mathematics
-- SELECT initialize_student_progress(123456, 2); -- For Science

-- Views for easier querying
CREATE VIEW student_concept_status AS
SELECT 
    s.student_id,
    s.name as student_name,
    ks.subject_name,
    kc.concept_id,
    kc.concept_name,
    kc.description,
    kc.difficulty_level,
    COALESCE(kp.status, 'locked') as status,
    kp.quiz_score,
    kp.attempts,
    kp.time_spent_minutes,
    kp.completed_at,
    kp.last_accessed
FROM students s
CROSS JOIN knowledge_subjects ks
CROSS JOIN knowledge_concepts kc
LEFT JOIN knowledge_progress kp ON s.student_id = kp.student_id AND kc.concept_id = kp.concept_id
WHERE kc.subject_id = ks.id
ORDER BY s.student_id, ks.subject_name, kc.position_x, kc.position_y;

-- View for concept prerequisites with names
CREATE VIEW concept_prerequisites_detailed AS
SELECT 
    kc1.concept_name as concept_name,
    kc1.concept_id,
    kc2.concept_name as prerequisite_name,
    kp.prerequisite_concept_id,
    kp.strength,
    ks.subject_name
FROM knowledge_prerequisites kp
JOIN knowledge_concepts kc1 ON kp.concept_id = kc1.concept_id
JOIN knowledge_concepts kc2 ON kp.prerequisite_concept_id = kc2.concept_id
JOIN knowledge_subjects ks ON kc1.subject_id = ks.id;

-- View for student progress summary
CREATE VIEW student_progress_summary AS
SELECT 
    s.student_id,
    s.name as student_name,
    ks.subject_name,
    COUNT(*) as total_concepts,
    COUNT(CASE WHEN kp.status = 'completed' THEN 1 END) as completed_concepts,
    COUNT(CASE WHEN kp.status = 'unlocked' THEN 1 END) as unlocked_concepts,
    COUNT(CASE WHEN kp.status = 'in_progress' THEN 1 END) as in_progress_concepts,
    ROUND(
        (COUNT(CASE WHEN kp.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
    ) as completion_percentage
FROM students s
CROSS JOIN knowledge_subjects ks
JOIN knowledge_concepts kc ON ks.id = kc.subject_id
LEFT JOIN knowledge_progress kp ON s.student_id = kp.student_id AND kc.concept_id = kp.concept_id
GROUP BY s.student_id, s.name, ks.id, ks.subject_name
ORDER BY s.student_id, ks.subject_name;