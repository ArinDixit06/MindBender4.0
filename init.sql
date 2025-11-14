-- Create the 'public' schema if it doesn't exist (Supabase usually handles this)
-- CREATE SCHEMA IF NOT EXISTS public;

-- Enable the 'uuid-ossp' extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Temporarily disable foreign key checks for dropping tables
SET session_replication_role = 'replica';

-- Drop tables in reverse order of creation to respect foreign key constraints
DROP TABLE IF EXISTS public.knowledge_maps CASCADE;
DROP TABLE IF EXISTS public.student_progress CASCADE;
DROP TABLE IF EXISTS public.knowledge_quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.knowledge_progress CASCADE;
DROP TABLE IF EXISTS public.knowledge_prerequisites CASCADE;
DROP TABLE IF EXISTS public.knowledge_path_concepts CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.quests CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.knowledge_quiz_questions CASCADE;
DROP TABLE IF EXISTS public.knowledge_learning_paths CASCADE;
DROP TABLE IF EXISTS public.knowledge_concepts CASCADE;
DROP TABLE IF EXISTS public.knowledge_subjects CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.curriculums CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;


-- Table: public.schools
CREATE TABLE public.schools (
  school_id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_name character varying NOT NULL,
  domain_name character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  admin_email character varying NOT NULL,
  description text,
  logo_url text,
  subscription_tier character varying DEFAULT 'free'::character varying,
  knowledge_map_id uuid,
  CONSTRAINT schools_pkey PRIMARY KEY (school_id)
);

-- Table: public.users
CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  hashed_password text NOT NULL,
  role character varying NOT NULL DEFAULT 'student'::character varying,
  school_id uuid,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(school_id)
);

-- Table: public.curriculums
CREATE TABLE public.curriculums (
  curriculum_id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  subject_name character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT curriculums_pkey PRIMARY KEY (curriculum_id),
  CONSTRAINT curriculums_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(school_id)
);

-- Table: public.chat_sessions
CREATE TABLE public.chat_sessions (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Table: public.achievements
CREATE TABLE public.achievements (
  achievement_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title character varying NOT NULL,
  description text,
  earned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT achievements_pkey PRIMARY KEY (achievement_id),
  CONSTRAINT achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Table: public.knowledge_subjects
CREATE TABLE public.knowledge_subjects (
  subject_id uuid NOT NULL DEFAULT gen_random_uuid(),
  curriculum_id uuid,
  name character varying NOT NULL,
  board character varying,
  class character varying,
  stream character varying,
  description text,
  CONSTRAINT knowledge_subjects_pkey PRIMARY KEY (subject_id),
  CONSTRAINT knowledge_subjects_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(curriculum_id)
);

-- Table: public.knowledge_concepts
CREATE TABLE public.knowledge_concepts (
  concept_id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id uuid,
  title character varying NOT NULL,
  content text,
  difficulty character varying,
  est_time_to_learn integer,
  CONSTRAINT knowledge_concepts_pkey PRIMARY KEY (concept_id),
  CONSTRAINT knowledge_concepts_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.knowledge_subjects(subject_id)
);

-- Table: public.knowledge_learning_paths
CREATE TABLE public.knowledge_learning_paths (
  path_id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id uuid,
  title character varying NOT NULL,
  description text,
  difficulty_level character varying,
  created_by uuid,
  CONSTRAINT knowledge_learning_paths_pkey PRIMARY KEY (path_id),
  CONSTRAINT knowledge_learning_paths_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.knowledge_subjects(subject_id),
  CONSTRAINT knowledge_learning_paths_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);

-- Table: public.knowledge_quiz_questions
CREATE TABLE public.knowledge_quiz_questions (
  question_id uuid NOT NULL DEFAULT gen_random_uuid(),
  concept_id uuid,
  question_text text NOT NULL,
  question_type character varying NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  explanation text,
  difficulty character varying,
  CONSTRAINT knowledge_quiz_questions_pkey PRIMARY KEY (question_id),
  CONSTRAINT knowledge_quiz_questions_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.notes
CREATE TABLE public.notes (
  note_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  concept_id uuid,
  title character varying,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  last_modified timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notes_pkey PRIMARY KEY (note_id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT notes_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.quests
CREATE TABLE public.quests (
  quest_id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  title character varying NOT NULL,
  subject character varying,
  description text,
  due_date timestamp without time zone,
  xp_reward integer DEFAULT 0,
  importance character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_published boolean DEFAULT false,
  CONSTRAINT quests_pkey PRIMARY KEY (quest_id),
  CONSTRAINT quests_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(school_id),
  CONSTRAINT quests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);

-- Table: public.resources
CREATE TABLE public.resources (
  resource_id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  title character varying NOT NULL,
  url text NOT NULL,
  type character varying NOT NULL,
  uploaded_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resources_pkey PRIMARY KEY (resource_id),
  CONSTRAINT resources_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(school_id),
  CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id)
);

-- Table: public.tests
CREATE TABLE public.tests (
  test_id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id uuid,
  title character varying NOT NULL,
  description text,
  max_marks integer,
  duration_minutes integer,
  created_by uuid,
  CONSTRAINT tests_pkey PRIMARY KEY (test_id),
  CONSTRAINT tests_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.knowledge_subjects(subject_id),
  CONSTRAINT tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);

-- Table: public.chat_messages
CREATE TABLE public.chat_messages (
  message_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  user_id uuid,
  content text NOT NULL,
  message_type character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (message_id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(session_id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Table: public.knowledge_path_concepts
CREATE TABLE public.knowledge_path_concepts (
  path_id uuid NOT NULL,
  concept_id uuid NOT NULL,
  step_order integer NOT NULL,
  CONSTRAINT knowledge_path_concepts_pkey PRIMARY KEY (path_id, concept_id),
  CONSTRAINT knowledge_path_concepts_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.knowledge_learning_paths(path_id),
  CONSTRAINT knowledge_path_concepts_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.knowledge_prerequisites
CREATE TABLE public.knowledge_prerequisites (
  concept_id uuid NOT NULL,
  prerequisite_id uuid NOT NULL,
  CONSTRAINT knowledge_prerequisites_pkey PRIMARY KEY (concept_id, prerequisite_id),
  CONSTRAINT knowledge_prerequisites_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id),
  CONSTRAINT knowledge_prerequisites_prerequisite_id_fkey FOREIGN KEY (prerequisite_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.knowledge_progress
CREATE TABLE public.knowledge_progress (
  progress_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  concept_id uuid,
  status character varying DEFAULT 'not_started'::character varying,
  score numeric,
  completed_at timestamp without time zone,
  last_visited timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT knowledge_progress_pkey PRIMARY KEY (progress_id),
  CONSTRAINT knowledge_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT knowledge_progress_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.knowledge_quiz_attempts
CREATE TABLE public.knowledge_quiz_attempts (
  attempt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  concept_id uuid,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  answers_json jsonb,
  CONSTRAINT knowledge_quiz_attempts_pkey PRIMARY KEY (attempt_id),
  CONSTRAINT knowledge_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT knowledge_quiz_attempts_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.knowledge_concepts(concept_id)
);

-- Table: public.student_progress
CREATE TABLE public.student_progress (
  progress_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  quest_id uuid,
  xp_earned integer NOT NULL,
  completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_progress_pkey PRIMARY KEY (progress_id),
  CONSTRAINT student_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT student_progress_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(quest_id)
);

-- Table: public.knowledge_maps
CREATE TABLE public.knowledge_maps (
  map_id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  curriculum_id uuid,
  topic_name character varying NOT NULL,
  description text,
  difficulty_level character varying,
  prerequisite_topic_id uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT knowledge_maps_pkey PRIMARY KEY (map_id),
  CONSTRAINT knowledge_maps_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(school_id),
  CONSTRAINT knowledge_maps_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(curriculum_id),
  CONSTRAINT knowledge_maps_prerequisite_topic_id_fkey FOREIGN KEY (prerequisite_topic_id) REFERENCES public.knowledge_maps(map_id)
);

-- Update schools table to add foreign key to knowledge_maps
ALTER TABLE public.schools
ADD CONSTRAINT schools_knowledge_map_id_fkey FOREIGN KEY (knowledge_map_id) REFERENCES public.knowledge_maps(map_id);

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
