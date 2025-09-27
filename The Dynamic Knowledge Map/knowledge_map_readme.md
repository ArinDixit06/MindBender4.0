# Knowledge Map Integration Guide

## Overview
The Dynamic Knowledge Map is a gamified learning feature that visualizes subject concepts as interconnected nodes, similar to a skill tree in video games. Students must master prerequisite concepts before unlocking advanced ones.

## Files Created
1. `knowledge-map.html` - The main Knowledge Map page
2. `knowledge-map.js` - Frontend JavaScript for map functionality
3. `knowledge-map-schema.sql` - Database schema for Supabase
4. API routes to add to your existing `hello.js` server file

## Integration Steps

### 1. Database Setup
Execute the SQL schema in your Supabase dashboard:
```sql
-- Run the entire knowledge-map-schema.sql file in your Supabase SQL editor
```

### 2. Update Navigation
Add the Knowledge Map link to all your existing HTML pages' navigation:
```html
<li class="nav-item">
    <a href="knowledge-map.html" class="nav-link">
        <i class="fas fa-map"></i>
        <span class="link-text">Knowledge Map</span>
    </a>
</li>
```

### 3. Server Integration
Add the API routes from `knowledge-map-api.js` to your existing `hello.js` file:
- Copy all the routes starting from `// ============= KNOWLEDGE MAP API ROUTES =============`
- Paste them before your server start code (`app.listen(PORT, ...)`)

### 4. File Placement
- Place `knowledge-map.html` in your project root directory
- Place `knowledge-map.js` in your project root directory
- Ensure both files are accessible by your web server

## Features Included

### Core Functionality
- **Visual Knowledge Map**: Interactive node-based visualization
- **Prerequisite System**: Concepts unlock only when prerequisites are completed
- **Progress Tracking**: Visual indicators for mastered, available, in-progress, and locked concepts
- **Integrated Quizzing**: Built-in quiz system with automatic progression
- **Smart Recommendations**: AI-powered next step suggestions
- **Progress Analytics**: Detailed learning statistics

### Gamification Elements
- **Status-based Coloring**: Green (completed), Orange (available), Blue (learning), Gray (locked)
- **Interactive Nodes**: Click to view details, start learning, or take quizzes
- **Progress Bars**: Visual representation of subject mastery
- **Achievement System**: Ready for badges and milestones

### Mobile Responsive
- Adaptive layout for different screen sizes
- Touch-friendly interface
- Collapsible progress sidebar on mobile

## Technical Architecture

### Frontend (knowledge-map.js)
- **Map Rendering**: SVG-based connections, CSS-positioned nodes
- **State Management**: Local storage + server synchronization
- **Quiz Engine**: Multi-question assessment system
- **Progress Tracking**: Real-time updates with visual feedback

### Backend API Endpoints
- `GET /api/knowledge/subjects` - Available subjects for student
- `GET /api/knowledge/subject/:id` - Concept map data
- `POST /api/knowledge/start-learning/:conceptId` - Begin learning
- `GET /api/knowledge/quiz/:conceptId` - Fetch quiz questions
- `POST /api/knowledge/quiz/:conceptId/submit` - Submit quiz answers
- `GET /api/knowledge/progress/summary` - Student progress overview
- `GET /api/knowledge/recommendations` - AI recommendations
- `GET /api/knowledge/analytics` - Learning analytics

### Database Schema
- **knowledge_concepts**: Individual learning concepts
- **knowledge_prerequisites**: Prerequisite relationships
- **knowledge_progress**: Student progress tracking
- **knowledge_quiz_questions**: Assessment questions
- **knowledge_quiz_attempts**: Quiz history

## Customization Options

### Adding New Subjects
1. Insert into `knowledge_subjects` table
2. Add concepts with X/Y coordinates for positioning
3. Define prerequisite relationships
4. Create quiz questions

### Concept Positioning
- Concepts use absolute positioning (X, Y coordinates)
- Recommended spacing: 150-200px between nodes
- Layout supports multiple learning paths

### Quiz Configuration
- Supports multiple choice questions
- Configurable passing score (default: 70%)
- Automatic concept unlocking on quiz success

## Sample Data Included
- **Mathematics**: Basic arithmetic through quadratic equations
- **Science**: Scientific method through genetics
- **Prerequisites**: Logical learning progression
- **Quiz Questions**: Sample assessments for each concept

## Future Enhancements
- **Learning Paths**: Guided sequences through concepts
- **Adaptive Difficulty**: AI-adjusted question difficulty
- **Collaborative Learning**: Peer interaction features
- **Advanced Analytics**: Learning pattern analysis
- **Content Integration**: Direct links to video lessons

## Troubleshooting
- Ensure all database tables are created correctly
- Check that API routes are properly integrated
- Verify student authentication is working
- Confirm prerequisite relationships are correctly defined

## Performance Notes
- Map rendering is optimized for up to 50 concepts per subject
- Quiz data is cached client-side for better performance
- Progress updates are batched to minimize server requests