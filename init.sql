-- Drop tables and views to ensure a clean slate for re-creation, respecting foreign key dependencies
DROP VIEW IF EXISTS concept_prerequisites_detailed; -- Added this line
DROP TABLE IF EXISTS knowledge_path_concepts;
DROP TABLE IF EXISTS knowledge_learning_paths;
DROP TABLE IF EXISTS knowledge_prerequisites;
DROP TABLE IF EXISTS knowledge_progress;
DROP TABLE IF EXISTS knowledge_quiz_questions;
DROP TABLE IF EXISTS knowledge_quiz_attempts;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS student_quests;
DROP TABLE IF EXISTS student_achievements;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS knowledge_maps;
DROP TABLE IF EXISTS curriculums;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS knowledge_concepts;
DROP TABLE IF EXISTS knowledge_subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;

-- Table: schools
CREATE TABLE schools (
    school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_email VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    knowledge_map_id UUID -- Optional FK to a top-level knowledge map, can be self-referencing or point to a specific map
);

-- Table: users
-- Modified to include school_id
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student', -- student, teacher, admin
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Table: curriculums
CREATE TABLE curriculums (
    curriculum_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, subject_name) -- A school cannot have two subjects with the same name
);

-- Table: knowledge_maps
CREATE TABLE knowledge_maps (
    map_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    curriculum_id UUID REFERENCES curriculums(curriculum_id) ON DELETE CASCADE,
    topic_name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50),
    prerequisite_topic_id UUID REFERENCES knowledge_maps(map_id) ON DELETE CASCADE, -- Self-referencing FK
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (curriculum_id, topic_name) -- A topic name must be unique within a curriculum
);

-- Table: quests
-- Modified to include school_id and created_by
CREATE TABLE quests (
    quest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255), -- Can be linked to curriculum.subject_name
    description TEXT,
    due_date TIMESTAMP,
    xp_reward INTEGER DEFAULT 0,
    importance VARCHAR(50),
    created_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE
);

-- Table: resources
-- Modified to include school_id and uploaded_by
CREATE TABLE resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- pdf/link/video
    uploaded_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: student_progress
CREATE TABLE student_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(quest_id) ON DELETE CASCADE,
    xp_earned INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, quest_id) -- A student can complete a quest only once
);

-- Table: achievements
CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, title) -- A user can earn an achievement only once
);

-- Table: chat_sessions
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'user' or 'bot'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_curriculums_school_id ON curriculums(school_id);
CREATE INDEX idx_knowledge_maps_school_id ON knowledge_maps(school_id);
CREATE INDEX idx_knowledge_maps_curriculum_id ON knowledge_maps(curriculum_id);
CREATE INDEX idx_quests_school_id ON quests(school_id);
CREATE INDEX idx_quests_created_by ON quests(created_by);
CREATE INDEX idx_resources_school_id ON resources(school_id);
CREATE INDEX idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX idx_student_progress_user_id ON student_progress(user_id);
CREATE INDEX idx_student_progress_quest_id ON student_progress(quest_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
