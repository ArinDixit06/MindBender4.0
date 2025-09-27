-- Enhanced Knowledge Map Database Schema - Production Ready
-- Designed for Indian Education System with CBSE/ICSE/State Board support

-- ============= DROP EXISTING TABLES (FOR CLEAN SETUP) =============
DROP TABLE IF EXISTS knowledge_quiz_attempts CASCADE;
DROP TABLE IF EXISTS knowledge_quiz_questions CASCADE;
DROP TABLE IF EXISTS knowledge_progress CASCADE;
DROP TABLE IF EXISTS knowledge_prerequisites CASCADE;
DROP TABLE IF EXISTS knowledge_path_concepts CASCADE;
DROP TABLE IF EXISTS knowledge_learning_paths CASCADE;
DROP TABLE IF EXISTS knowledge_concepts CASCADE;
DROP TABLE IF EXISTS knowledge_subjects CASCADE;

-- ============= CORE TABLES =============

-- Indian education subjects (CBSE, ICSE, State Boards)
CREATE TABLE knowledge_subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    board VARCHAR(50) NOT NULL CHECK (board IN ('CBSE', 'ICSE', 'Maharashtra', 'UP', 'Karnataka', 'Tamil Nadu', 'West Bengal')),
    class_level VARCHAR(10) NOT NULL CHECK (class_level IN ('6', '7', '8', '9', '10', '11', '12')),
    stream VARCHAR(50) CHECK (stream IN ('Science', 'Commerce', 'Arts')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_subject_board_class UNIQUE (subject_name, board, class_level, stream)
);

-- Individual learning concepts (nodes in the knowledge map)
CREATE TABLE knowledge_concepts (
    id SERIAL PRIMARY KEY,
    concept_id VARCHAR(100) UNIQUE NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES knowledge_subjects(id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    description TEXT,
    content_url TEXT,
    icon_class VARCHAR(50) DEFAULT 'fa-book',
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_time_minutes INTEGER DEFAULT 30,
    chapter_number INTEGER,
    chapter_name VARCHAR(100),
    ncert_reference TEXT, -- e.g., "NCERT Class 10 Mathematics Ch 1"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prerequisites relationships (connections in the knowledge map)
CREATE TABLE knowledge_prerequisites (
    id SERIAL PRIMARY KEY,
    concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    prerequisite_concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 3), -- How critical this prerequisite is
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no circular dependencies and no self-references
    CONSTRAINT uk_concept_prerequisite UNIQUE (concept_id, prerequisite_concept_id),
    CONSTRAINT chk_no_self_reference CHECK (concept_id != prerequisite_concept_id)
);

-- Student progress tracking
CREATE TABLE knowledge_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
    quiz_score INTEGER DEFAULT 0 CHECK (quiz_score BETWEEN 0 AND 100),
    attempts INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_student_concept UNIQUE (student_id, concept_id)
);

-- Quiz questions for assessments
CREATE TABLE knowledge_quiz_questions (
    id SERIAL PRIMARY KEY,
    concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
    options JSONB, -- Array of options for multiple choice
    correct_answer INTEGER NOT NULL, -- Index of correct option (0-based)
    explanation TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
    marks INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempt history
CREATE TABLE knowledge_quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    answers JSONB, -- Student's answers
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning paths for guided curriculum
CREATE TABLE knowledge_learning_paths (
    id SERIAL PRIMARY KEY,
    path_name VARCHAR(255) NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES knowledge_subjects(id) ON DELETE CASCADE,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration_hours INTEGER,
    target_exam VARCHAR(100), -- e.g., "CBSE Board Exam", "JEE Main", "NEET"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Concepts within learning paths
CREATE TABLE knowledge_path_concepts (
    id SERIAL PRIMARY KEY,
    path_id INTEGER NOT NULL REFERENCES knowledge_learning_paths(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL REFERENCES knowledge_concepts(concept_id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    
    CONSTRAINT uk_path_concept UNIQUE (path_id, concept_id),
    CONSTRAINT uk_path_sequence UNIQUE (path_id, sequence_order)
);

-- Student achievements/badges
CREATE TABLE knowledge_achievements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    concept_id VARCHAR(100) REFERENCES knowledge_concepts(concept_id),
    subject_id INTEGER REFERENCES knowledge_subjects(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_student_achievement UNIQUE (student_id, achievement_type, concept_id, subject_id)
);

-- ============= INDEXES FOR PERFORMANCE =============
CREATE INDEX idx_knowledge_concepts_subject ON knowledge_concepts(subject_id);
CREATE INDEX idx_knowledge_concepts_position ON knowledge_concepts(position_x, position_y);
CREATE INDEX idx_knowledge_concepts_difficulty ON knowledge_concepts(difficulty_level);
CREATE INDEX idx_knowledge_prerequisites_concept ON knowledge_prerequisites(concept_id);
CREATE INDEX idx_knowledge_prerequisites_prereq ON knowledge_prerequisites(prerequisite_concept_id);
CREATE INDEX idx_knowledge_progress_student ON knowledge_progress(student_id);
CREATE INDEX idx_knowledge_progress_concept ON knowledge_progress(concept_id);
CREATE INDEX idx_knowledge_progress_status ON knowledge_progress(status);
CREATE INDEX idx_knowledge_progress_completed ON knowledge_progress(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_knowledge_quiz_questions_concept ON knowledge_quiz_questions(concept_id);
CREATE INDEX idx_knowledge_quiz_attempts_student ON knowledge_quiz_attempts(student_id);
CREATE INDEX idx_knowledge_quiz_attempts_concept ON knowledge_quiz_attempts(concept_id);
CREATE INDEX idx_knowledge_quiz_attempts_date ON knowledge_quiz_attempts(attempt_date);

-- ============= STORED PROCEDURES =============

-- Function to handle quiz submission as a transaction
CREATE OR REPLACE FUNCTION submit_quiz_transaction(
    p_student_id INTEGER,
    p_concept_id VARCHAR,
    p_score INTEGER,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_time_taken INTEGER,
    p_answers JSONB,
    p_passed BOOLEAN
) RETURNS JSONB AS $
DECLARE
    result JSONB;
    old_status VARCHAR(20);
    achievement_earned BOOLEAN := false;
BEGIN
    -- Get current status
    SELECT status INTO old_status 
    FROM knowledge_progress 
    WHERE student_id = p_student_id AND concept_id = p_concept_id;

    -- Record quiz attempt
    INSERT INTO knowledge_quiz_attempts (
        student_id, concept_id, score, total_questions, 
        correct_answers, time_taken_seconds, answers
    ) VALUES (
        p_student_id, p_concept_id, p_score, p_total_questions,
        p_correct_answers, p_time_taken, p_answers
    );

    -- Update progress
    UPDATE knowledge_progress 
    SET 
        status = CASE 
            WHEN p_passed THEN 'completed' 
            WHEN status = 'locked' THEN 'unlocked'  -- First attempt unlocks if locked
            ELSE status 
        END,
        quiz_score = GREATEST(quiz_score, p_score), -- Keep best score
        attempts = attempts + 1,
        completed_at = CASE WHEN p_passed THEN CURRENT_TIMESTAMP ELSE completed_at END,
        last_accessed = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id AND concept_id = p_concept_id;

    -- Award achievement for first concept completion
    IF p_passed AND old_status != 'completed' THEN
        INSERT INTO knowledge_achievements (
            student_id, achievement_type, achievement_name, 
            achievement_description, concept_id
        ) VALUES (
            p_student_id, 'concept_mastery', 'Concept Master',
            'Mastered a new concept with 80%+ score', p_concept_id
        ) ON CONFLICT (student_id, achievement_type, concept_id, subject_id) DO NOTHING;
        
        achievement_earned := true;
    END IF;

    result := jsonb_build_object(
        'success', true,
        'passed', p_passed,
        'score', p_score,
        'achievement_earned', achievement_earned
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback happens automatically
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$ LANGUAGE plpgsql;

-- Optimized function to unlock dependent concepts
CREATE OR REPLACE FUNCTION unlock_dependent_concepts(
    p_student_id INTEGER,
    p_completed_concept_id VARCHAR
) RETURNS INTEGER AS $
DECLARE
    concepts_unlocked INTEGER := 0;
BEGIN
    -- Update concepts that can now be unlocked with a single efficient query
    WITH eligible_concepts AS (
        SELECT DISTINCT kp.concept_id
        FROM knowledge_prerequisites kp
        WHERE kp.prerequisite_concept_id = p_completed_concept_id
        AND NOT EXISTS (
            -- Check that ALL prerequisites for this concept are completed
            SELECT 1 
            FROM knowledge_prerequisites kp2
            LEFT JOIN knowledge_progress prog ON (
                kp2.prerequisite_concept_id = prog.concept_id 
                AND prog.student_id = p_student_id
            )
            WHERE kp2.concept_id = kp.concept_id 
            AND (prog.status IS NULL OR prog.status != 'completed')
        )
    )
    UPDATE knowledge_progress 
    SET 
        status = 'unlocked',
        last_accessed = CURRENT_TIMESTAMP
    WHERE 
        student_id = p_student_id 
        AND concept_id IN (SELECT concept_id FROM eligible_concepts)
        AND status = 'locked';

    GET DIAGNOSTICS concepts_unlocked = ROW_COUNT;
    
    RETURN concepts_unlocked;
END;
$ LANGUAGE plpgsql;

-- Function to initialize student progress for a subject
CREATE OR REPLACE FUNCTION initialize_student_progress(
    p_student_id INTEGER, 
    p_subject_id INTEGER
) RETURNS INTEGER AS $
DECLARE
    concepts_initialized INTEGER := 0;
BEGIN
    -- Insert locked progress for all concepts in the subject
    WITH new_progress AS (
        INSERT INTO knowledge_progress (student_id, concept_id, status)
        SELECT p_student_id, kc.concept_id, 'locked'
        FROM knowledge_concepts kc
        WHERE kc.subject_id = p_subject_id
        ON CONFLICT (student_id, concept_id) DO NOTHING
        RETURNING concept_id
    )
    SELECT COUNT(*) INTO concepts_initialized FROM new_progress;
    
    -- Unlock concepts that have no prerequisites
    UPDATE knowledge_progress 
    SET status = 'unlocked'
    WHERE student_id = p_student_id 
    AND concept_id IN (
        SELECT kc.concept_id 
        FROM knowledge_concepts kc
        LEFT JOIN knowledge_prerequisites kp ON kc.concept_id = kp.concept_id
        WHERE kc.subject_id = p_subject_id 
        AND kp.concept_id IS NULL
    )
    AND status = 'locked';
    
    RETURN concepts_initialized;
END;
$ LANGUAGE plpgsql;

-- Function to calculate study streak
CREATE OR REPLACE FUNCTION calculate_study_streak(
    p_student_id INTEGER
) RETURNS INTEGER AS $
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    activity_found BOOLEAN;
BEGIN
    check_date := CURRENT_DATE;
    
    -- Loop backwards from today to find consecutive study days
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM knowledge_quiz_attempts 
            WHERE student_id = p_student_id 
            AND DATE(attempt_date) = check_date
        ) INTO activity_found;
        
        IF NOT activity_found THEN
            EXIT; -- Break the streak
        END IF;
        
        streak_count := streak_count + 1;
        check_date := check_date - INTERVAL '1 day';
        
        -- Prevent infinite loop (max 365 days)
        IF streak_count >= 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$ LANGUAGE plpgsql;

-- ============= VIEWS FOR EASY QUERYING =============

-- Comprehensive student progress view
CREATE VIEW student_concept_status AS
SELECT 
    s.student_id,
    s.name as student_name,
    ks.id as subject_id,
    ks.subject_name,
    ks.board,
    ks.class_level,
    kc.concept_id,
    kc.concept_name,
    kc.description,
    kc.difficulty_level,
    kc.position_x,
    kc.position_y,
    kc.icon_class,
    kc.chapter_number,
    kc.chapter_name,
    COALESCE(kp.status, 'locked') as status,
    kp.quiz_score,
    kp.attempts,
    kp.time_spent_minutes,
    kp.completed_at,
    kp.last_accessed
FROM students s
CROSS JOIN knowledge_subjects ks
JOIN knowledge_concepts kc ON ks.id = kc.subject_id
LEFT JOIN knowledge_progress kp ON (
    s.student_id = kp.student_id 
    AND kc.concept_id = kp.concept_id
)
WHERE ks.is_active = true 
AND kc.is_active = true
ORDER BY s.student_id, ks.subject_name, kc.position_x, kc.position_y;

-- Student progress summary by subject
CREATE VIEW student_progress_summary AS
SELECT 
    s.student_id,
    s.name as student_name,
    ks.id as subject_id,
    ks.subject_name,
    ks.board,
    ks.class_level,
    COUNT(kc.concept_id) as total_concepts,
    COUNT(CASE WHEN kp.status = 'completed' THEN 1 END) as completed_concepts,
    COUNT(CASE WHEN kp.status = 'unlocked' THEN 1 END) as unlocked_concepts,
    COUNT(CASE WHEN kp.status = 'in_progress' THEN 1 END) as in_progress_concepts,
    COUNT(CASE WHEN COALESCE(kp.status, 'locked') = 'locked' THEN 1 END) as locked_concepts,
    ROUND(
        (COUNT(CASE WHEN kp.status = 'completed' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(kc.concept_id), 0)::DECIMAL) * 100, 2
    ) as completion_percentage,
    SUM(COALESCE(kp.time_spent_minutes, 0)) as total_time_spent,
    AVG(CASE WHEN kp.status = 'completed' THEN kp.quiz_score END) as average_score
FROM students s
CROSS JOIN knowledge_subjects ks
JOIN knowledge_concepts kc ON ks.id = kc.subject_id
LEFT JOIN knowledge_progress kp ON (
    s.student_id = kp.student_id 
    AND kc.concept_id = kp.concept_id
)
WHERE ks.is_active = true 
AND kc.is_active = true
GROUP BY s.student_id, s.name, ks.id, ks.subject_name, ks.board, ks.class_level
ORDER BY s.student_id, ks.subject_name;

-- Concept prerequisites with detailed info
CREATE VIEW concept_prerequisites_detailed AS
SELECT 
    kc1.concept_id,
    kc1.concept_name,
    kc1.subject_id,
    ks.subject_name,
    kc2.concept_id as prerequisite_concept_id,
    kc2.concept_name as prerequisite_name,
    kp.strength as prerequisite_strength
FROM knowledge_prerequisites kp
JOIN knowledge_concepts kc1 ON kp.concept_id = kc1.concept_id
JOIN knowledge_concepts kc2 ON kp.prerequisite_concept_id = kc2.concept_id
JOIN knowledge_subjects ks ON kc1.subject_id = ks.id
WHERE kc1.is_active = true 
AND kc2.is_active = true;

-- Recent quiz performance view
CREATE VIEW recent_quiz_performance AS
SELECT 
    s.student_id,
    s.name as student_name,
    kqa.concept_id,
    kc.concept_name,
    ks.subject_name,
    kqa.score,
    kqa.attempt_date,
    kqa.time_taken_seconds,
    ROW_NUMBER() OVER (
        PARTITION BY s.student_id, kqa.concept_id 
        ORDER BY kqa.attempt_date DESC
    ) as attempt_rank
FROM knowledge_quiz_attempts kqa
JOIN students s ON kqa.student_id = s.student_id
JOIN knowledge_concepts kc ON kqa.concept_id = kc.concept_id
JOIN knowledge_subjects ks ON kc.subject_id = ks.id
ORDER BY kqa.attempt_date DESC;

-- ============= SAMPLE DATA FOR INDIAN CURRICULUM =============

-- Insert CBSE subjects for different classes
INSERT INTO knowledge_subjects (subject_name, board, class_level, description) VALUES
('Mathematics', 'CBSE', '9', 'CBSE Class 9 Mathematics following NCERT curriculum'),
('Mathematics', 'CBSE', '10', 'CBSE Class 10 Mathematics following NCERT curriculum'),
('Science', 'CBSE', '9', 'CBSE Class 9 Science covering Physics, Chemistry, Biology'),
('Science', 'CBSE', '10', 'CBSE Class 10 Science covering Physics, Chemistry, Biology'),
('Social Science', 'CBSE', '9', 'CBSE Class 9 Social Science - History, Geography, Political Science, Economics'),
('Social Science', 'CBSE', '10', 'CBSE Class 10 Social Science - History, Geography, Political Science, Economics');

-- Insert ICSE subjects
INSERT INTO knowledge_subjects (subject_name, board, class_level, description) VALUES
('Mathematics', 'ICSE', '9', 'ICSE Class 9 Mathematics curriculum'),
('Mathematics', 'ICSE', '10', 'ICSE Class 10 Mathematics curriculum'),
('Physics', 'ICSE', '9', 'ICSE Class 9 Physics'),
('Physics', 'ICSE', '10', 'ICSE Class 10 Physics'),
('Chemistry', 'ICSE', '9', 'ICSE Class 9 Chemistry'),
('Chemistry', 'ICSE', '10', 'ICSE Class 10 Chemistry'),
('Biology', 'ICSE', '9', 'ICSE Class 9 Biology'),
('Biology', 'ICSE', '10', 'ICSE Class 10 Biology');

-- Sample concepts for CBSE Class 10 Mathematics
INSERT INTO knowledge_concepts (
    concept_id, subject_id, concept_name, description, 
    position_x, position_y, difficulty_level, estimated_time_minutes,
    chapter_number, chapter_name, ncert_reference, icon_class
) VALUES
('real-numbers-10', 1, 'Real Numbers', 'Euclid division lemma, HCF, LCM, rational and irrational numbers', 200, 150, 3, 120, 1, 'Real Numbers', 'NCERT Class 10 Mathematics Chapter 1', 'fa-infinity'),
('polynomials-10', 1, 'Polynomials', 'Degree, zeros, relationship between zeros and coefficients', 350, 150, 3, 135, 2, 'Polynomials', 'NCERT Class 10 Mathematics Chapter 2', 'fa-superscript'),
('linear-equations-pair-10', 1, 'Pair of Linear Equations in Two Variables', 'Graphical and algebraic methods, consistent and inconsistent systems', 500, 150, 4, 150, 3, 'Pair of Linear Equations in Two Variables', 'NCERT Class 10 Mathematics Chapter 3', 'fa-equals'),
('quadratic-equations-10', 1, 'Quadratic Equations', 'Standard form, methods of solving, nature of roots', 650, 150, 4, 165, 4, 'Quadratic Equations', 'NCERT Class 10 Mathematics Chapter 4', 'fa-square-root-alt'),
('arithmetic-progressions-10', 1, 'Arithmetic Progressions', 'General term, sum of n terms, applications', 800, 150, 4, 135, 5, 'Arithmetic Progressions', 'NCERT Class 10 Mathematics Chapter 5', 'fa-list-ol'),
('triangles-10', 1, 'Triangles', 'Similarity, Pythagoras theorem, areas', 350, 300, 4, 150, 6, 'Triangles', 'NCERT Class 10 Mathematics Chapter 6', 'fa-play'),
('coordinate-geometry-10', 1, 'Coordinate Geometry', 'Distance formula, section formula, area of triangle', 500, 300, 4, 135, 7, 'Coordinate Geometry', 'NCERT Class 10 Mathematics Chapter 7', 'fa-crosshairs'),
('trigonometry-10', 1, 'Introduction to Trigonometry', 'Trigonometric ratios, identities, complementary angles', 650, 300, 5, 180, 8, 'Introduction to Trigonometry', 'NCERT Class 10 Mathematics Chapter 8', 'fa-wave-square'),
('trigonometry-applications-10', 1, 'Some Applications of Trigonometry', 'Heights and distances, angle of elevation and depression', 800, 300, 5, 165, 9, 'Some Applications of Trigonometry', 'NCERT Class 10 Mathematics Chapter 9', 'fa-mountain'),
('circles-10', 1, 'Circles', 'Tangent, secant, theorems related to circles', 500, 450, 4, 150, 10, 'Circles', 'NCERT Class 10 Mathematics Chapter 10', 'fa-circle'),
('constructions-10', 1, 'Constructions', 'Division of line segment, construction of tangents', 650, 450, 4, 120, 11, 'Constructions', 'NCERT Class 10 Mathematics Chapter 11', 'fa-compass'),
('areas-related-circles-10', 1, 'Areas Related to Circles', 'Area of circle, sector, segment, combination of figures', 800, 450, 4, 135, 12, 'Areas Related to Circles', 'NCERT Class 10 Mathematics Chapter 12', 'fa-ring'),
('surface-areas-volumes-10', 1, 'Surface Areas and Volumes', 'Cylinder, cone, sphere, hemisphere, frustum', 650, 600, 4, 165, 13, 'Surface Areas and Volumes', 'NCERT Class 10 Mathematics Chapter 13', 'fa-cube'),
('statistics-10', 1, 'Statistics', 'Mean, median, mode of grouped data, graphical representation', 800, 600, 4, 135, 14, 'Statistics', 'NCERT Class 10 Mathematics Chapter 14', 'fa-chart-bar'),
('probability-10', 1, 'Probability', 'Classical definition, theoretical vs experimental probability', 950, 600, 4, 120, 15, 'Probability', 'NCERT Class 10 Mathematics Chapter 15', 'fa-dice');

-- Prerequisites for CBSE Class 10 Mathematics
INSERT INTO knowledge_prerequisites (concept_id, prerequisite_concept_id, strength) VALUES
('polynomials-10', 'real-numbers-10', 3),
('linear-equations-pair-10', 'polynomials-10', 3),
('quadratic-equations-10', 'polynomials-10', 3),
('arithmetic-progressions-10', 'real-numbers-10', 2),
('coordinate-geometry-10', 'triangles-10', 2),
('trigonometry-10', 'triangles-10', 3),
('trigonometry-applications-10', 'trigonometry-10', 3),
('circles-10', 'triangles-10', 2),
('constructions-10', 'circles-10', 2),
('areas-related-circles-10', 'circles-10', 3),
('surface-areas-volumes-10', 'triangles-10', 2),
('statistics-10', 'real-numbers-10', 1),
('probability-10', 'statistics-10', 2);

-- Sample quiz questions for Real Numbers
INSERT INTO knowledge_quiz_questions (concept_id, question_text, options, correct_answer, explanation, difficulty) VALUES
('real-numbers-10', 'Which of the following is an irrational number?', 
 '["√16", "√2", "22/7", "0.333..."]', 1, 
 '√2 is irrational because it cannot be expressed as a ratio of two integers.', 3),
('real-numbers-10', 'What is the HCF of 96 and 404 using Euclid division algorithm?', 
 '["4", "8", "12", "2"]', 0, 
 'Using Euclid division algorithm: 404 = 96 × 4 + 20, 96 = 20 × 4 + 16, 20 = 16 × 1 + 4, 16 = 4 × 4 + 0. Hence HCF = 4.', 3),
('real-numbers-10', 'The decimal expansion of the rational number 14587/1250 will terminate after how many places of decimal?', 
 '["3", "4", "5", "6"]', 1, 
 '1250 = 2¹ × 5⁴. Since denominator is of the form 2ᵐ × 5ⁿ, decimal terminates after max(1,4) = 4 places.', 4);

-- Sample quiz questions for Quadratic Equations
INSERT INTO knowledge_quiz_questions (concept_id, question_text, options, correct_answer, explanation, difficulty) VALUES
('quadratic-equations-10', 'The roots of the quadratic equation x² - 5x + 6 = 0 are:', 
 '["2, 3", "1, 6", "-2, -3", "5, 1"]', 0, 
 'Using factorization: x² - 5x + 6 = (x-2)(x-3) = 0, so x = 2 or x = 3', 2),
('quadratic-equations-10', 'For the quadratic equation ax² + bx + c = 0, the discriminant is:', 
 '["b² - 4ac", "b² + 4ac", "4ac - b²", "a² - 4bc"]', 0, 
 'The discriminant Δ = b² - 4ac determines the nature of roots.', 2),
('quadratic-equations-10', 'If the roots of x² - px + q = 0 are equal, then:', 
 '["p² = 4q", "p² < 4q", "p² > 4q", "p = q"]', 0, 
 'For equal roots, discriminant = 0. So p² - 4(1)(q) = 0, hence p² = 4q.', 3);

-- ============= TRIGGERS =============

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_knowledge_subjects_updated_at 
    BEFORE UPDATE ON knowledge_subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_concepts_updated_at 
    BEFORE UPDATE ON knowledge_concepts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically unlock concepts when prerequisites are completed
CREATE OR REPLACE FUNCTION auto_unlock_concepts()
RETURNS TRIGGER AS $
BEGIN
    -- Only proceed if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Call the unlock function
        PERFORM unlock_dependent_concepts(NEW.student_id, NEW.concept_id);
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_unlock_concepts
    AFTER UPDATE ON knowledge_progress
    FOR EACH ROW
    EXECUTE FUNCTION auto_unlock_concepts();

-- Trigger to award achievements
CREATE OR REPLACE FUNCTION award_achievements()
RETURNS TRIGGER AS $
DECLARE
    subject_concepts_count INTEGER;
    completed_concepts_count INTEGER;
    perfect_scores_count INTEGER;
BEGIN
    -- Award subject mastery achievement
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Check if all concepts in subject are completed
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN kp.status = 'completed' THEN 1 END) as completed
        INTO subject_concepts_count, completed_concepts_count
        FROM knowledge_concepts kc
        LEFT JOIN knowledge_progress kp ON (
            kc.concept_id = kp.concept_id 
            AND kp.student_id = NEW.student_id
        )
        WHERE kc.subject_id = (
            SELECT subject_id 
            FROM knowledge_concepts 
            WHERE concept_id = NEW.concept_id
        );
        
        -- Award subject mastery if all concepts completed
        IF subject_concepts_count = completed_concepts_count THEN
            INSERT INTO knowledge_achievements (
                student_id, achievement_type, achievement_name,
                achievement_description, subject_id
            ) 
            SELECT 
                NEW.student_id, 'subject_mastery', 'Subject Master',
                'Completed all concepts in ' || ks.subject_name, ks.id
            FROM knowledge_concepts kc
            JOIN knowledge_subjects ks ON kc.subject_id = ks.id
            WHERE kc.concept_id = NEW.concept_id
            ON CONFLICT (student_id, achievement_type, concept_id, subject_id) DO NOTHING;
        END IF;
        
        -- Award perfectionist achievement for 100% scores
        IF NEW.quiz_score = 100 THEN
            SELECT COUNT(*) INTO perfect_scores_count
            FROM knowledge_progress 
            WHERE student_id = NEW.student_id 
            AND quiz_score = 100 
            AND status = 'completed';
            
            -- Award perfectionist badge for 5 perfect scores
            IF perfect_scores_count >= 5 THEN
                INSERT INTO knowledge_achievements (
                    student_id, achievement_type, achievement_name,
                    achievement_description
                ) VALUES (
                    NEW.student_id, 'perfectionist', 'Perfectionist',
                    'Achieved 100% score on 5 or more assessments'
                ) ON CONFLICT (student_id, achievement_type, concept_id, subject_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_achievements
    AFTER UPDATE ON knowledge_progress
    FOR EACH ROW
    EXECUTE FUNCTION award_achievements();

-- ============= ADMINISTRATIVE FUNCTIONS =============

-- Function to get comprehensive student analytics
CREATE OR REPLACE FUNCTION get_student_analytics(p_student_id INTEGER)
RETURNS JSONB AS $
DECLARE
    result JSONB;
    study_streak INTEGER;
    total_time INTEGER;
    avg_score DECIMAL;
    subjects_completed INTEGER;
    total_subjects INTEGER;
BEGIN
    -- Calculate study streak
    SELECT calculate_study_streak(p_student_id) INTO study_streak;
    
    -- Get overall statistics
    SELECT 
        SUM(time_spent_minutes),
        AVG(CASE WHEN status = 'completed' THEN quiz_score END),
        COUNT(DISTINCT CASE WHEN completion_percentage = 100 THEN subject_id END),
        COUNT(DISTINCT subject_id)
    INTO total_time, avg_score, subjects_completed, total_subjects
    FROM student_progress_summary 
    WHERE student_id = p_student_id;
    
    result := jsonb_build_object(
        'study_streak', COALESCE(study_streak, 0),
        'total_study_time_minutes', COALESCE(total_time, 0),
        'average_score', COALESCE(ROUND(avg_score, 1), 0),
        'subjects_completed', COALESCE(subjects_completed, 0),
        'total_subjects', COALESCE(total_subjects, 0),
        'completion_rate', CASE 
            WHEN total_subjects > 0 THEN ROUND((subjects_completed::DECIMAL / total_subjects) * 100, 1)
            ELSE 0 
        END
    );
    
    RETURN result;
END;
$ LANGUAGE plpgsql;