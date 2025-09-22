-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create students table
CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  class VARCHAR(10) NOT NULL,
  board VARCHAR(50) NOT NULL,
  stream VARCHAR(50),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  student_id INTEGER UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  parent_email VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Create quests table
CREATE TABLE quests (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  chapter VARCHAR(100),
  topic VARCHAR(255),
  due_date DATE,
  importance VARCHAR(20) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  xp_value INTEGER DEFAULT 25,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Create chat history table
CREATE TABLE chat_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  subject VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_quests_student_id ON quests(student_id);
CREATE INDEX idx_quests_completed ON quests(completed);
CREATE INDEX idx_chat_history_student_id ON chat_history(student_id);

-- Create achievements table (optional - for future expansion)
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Sample data for testing (optional - remove in production)
-- INSERT INTO students (student_id, name, class, board, stream) 
-- VALUES (123456, 'Test Student', '10', 'CBSE', NULL);

-- INSERT INTO users (student_id, email, parent_email, password) 
-- VALUES (123456, 'test@student.com', 'parent@email.com', '$2a$10$YourHashedPasswordHere');