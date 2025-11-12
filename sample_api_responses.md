# Sample API Responses for StudyQuest Multi-School Extension

This document provides example JSON responses for the newly implemented or modified API endpoints.

---

## 1. `POST /register` (User Registration)

**Request Body Example:**
```json
{
  "name": "Alice Smith",
  "email": "alice@greenvalleyschool.edu",
  "password": "securepassword123",
  "role": "student"
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Alice Smith",
    "email": "alice@greenvalleyschool.edu",
    "role": "student",
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "xp": 0,
    "level": 1
  }
}
```

**Error Response (School not registered, Status: 400 Bad Request):**
```json
{
  "error": "School not registered for this email domain."
}
```

**Error Response (User already exists, Status: 409 Conflict):**
```json
{
  "error": "User with this email already exists"
}
```

---

## 2. `POST /login` (User Login)

**Request Body Example:**
```json
{
  "email": "alice@greenvalleyschool.edu",
  "password": "securepassword123"
}
```

**Successful Response (Status: 200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Alice Smith",
    "email": "alice@greenvalleyschool.edu",
    "role": "student",
    "xp": 150,
    "level": 2
  },
  "school": {
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "school_name": "Green Valley School",
    "domain_name": "greenvalleyschool.edu",
    "logo_url": "https://example.com/greenvalley_logo.png"
  }
}
```

**Error Response (Invalid credentials, Status: 400 Bad Request):**
```json
{
  "error": "Invalid email or password"
}
```

---

## 3. `GET /api/me` (Current User Info)

**Successful Response (Status: 200 OK):**
```json
{
  "user": {
    "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Alice Smith",
    "email": "alice@greenvalleyschool.edu",
    "role": "student",
    "xp": 150,
    "level": 2
  },
  "school": {
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "school_name": "Green Valley School",
    "domain_name": "greenvalleyschool.edu",
    "logo_url": "https://example.com/greenvalley_logo.png"
  }
}
```

**Error Response (Unauthorized, Status: 401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

## 4. `POST /api/schools/register` (School Registration)

**Request Body Example:**
```json
{
  "school_name": "Green Valley School",
  "domain_name": "greenvalleyschool.edu",
  "admin_email": "admin@greenvalleyschool.edu",
  "description": "A school focused on environmental education.",
  "logo_url": "https://example.com/greenvalley_logo.png",
  "subscription_tier": "premium"
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "School registered successfully",
  "school": {
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "school_name": "Green Valley School",
    "domain_name": "greenvalleyschool.edu",
    "created_at": "2023-10-27T10:00:00.000Z",
    "admin_email": "admin@greenvalleyschool.edu",
    "description": "A school focused on environmental education.",
    "logo_url": "https://example.com/greenvalley_logo.png",
    "subscription_tier": "premium",
    "knowledge_map_id": null
  }
}
```

**Error Response (Forbidden - not admin, Status: 403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

---

## 5. `GET /api/schools/:domain` (Get School Public Info)

**Request Example:** `GET /api/schools/greenvalleyschool.edu`

**Successful Response (Status: 200 OK):**
```json
{
  "school": {
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "school_name": "Green Valley School",
    "domain_name": "greenvalleyschool.edu",
    "logo_url": "https://example.com/greenvalley_logo.png",
    "description": "A school focused on environmental education."
  }
}
```

**Error Response (School not found, Status: 404 Not Found):**
```json
{
  "error": "School not found."
}
```

---

## 6. `POST /api/curriculum` (Create Curriculum Subject)

**Request Body Example:**
```json
{
  "subject_name": "Environmental Science",
  "description": "Study of environmental systems and sustainability."
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "Curriculum subject created successfully",
  "curriculum": {
    "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "subject_name": "Environmental Science",
    "description": "Study of environmental systems and sustainability.",
    "created_at": "2023-10-27T10:30:00.000Z"
  }
}
```

**Error Response (Forbidden - not teacher/admin, Status: 403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

---

## 7. `GET /api/curriculum` (Get School Curriculums)

**Successful Response (Status: 200 OK):**
```json
{
  "curriculums": [
    {
      "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "subject_name": "Environmental Science",
      "description": "Study of environmental systems and sustainability.",
      "created_at": "2023-10-27T10:30:00.000Z"
    },
    {
      "curriculum_id": "c5d6e7f8-a9b0-1234-5678-90abcdef1234",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "subject_name": "Mathematics",
      "description": "Core mathematics for high school.",
      "created_at": "2023-10-27T10:35:00.000Z"
    }
  ]
}
```

---

## 8. `POST /api/knowledge-map` (Create Knowledge Map Topic)

**Request Body Example:**
```json
{
  "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  "topic_name": "Ecosystems",
  "description": "Understanding different types of ecosystems and their components.",
  "difficulty_level": "intermediate",
  "prerequisite_topic_id": null
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "Knowledge map topic created successfully",
  "topic": {
    "map_id": "m1a2p3i4-d5e6-7890-1234-567890abcdef",
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
    "topic_name": "Ecosystems",
    "description": "Understanding different types of ecosystems and their components.",
    "difficulty_level": "intermediate",
    "prerequisite_topic_id": null,
    "created_at": "2023-10-27T10:45:00.000Z"
  }
}
```

---

## 9. `GET /api/knowledge-map` (Get School Knowledge Map Nodes)

**Successful Response (Status: 200 OK):**
```json
{
  "nodes": [
    {
      "map_id": "m1a2p3i4-d5e6-7890-1234-567890abcdef",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
      "topic_name": "Ecosystems",
      "description": "Understanding different types of ecosystems and their components.",
      "difficulty_level": "intermediate",
      "prerequisite_topic_id": null,
      "created_at": "2023-10-27T10:45:00.000Z",
      "subject_name": "Environmental Science"
    },
    {
      "map_id": "m5a6p7i8-d9e0-1234-5678-90abcdef1234",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "curriculum_id": "c1d2e3f4-a5b6-7890-1234-567890abcdef",
      "topic_name": "Biodiversity",
      "description": "Exploring the variety of life on Earth.",
      "difficulty_level": "advanced",
      "prerequisite_topic_id": "m1a2p3i4-d5e6-7890-1234-567890abcdef",
      "created_at": "2023-10-27T10:50:00.000Z",
      "subject_name": "Environmental Science"
    }
  ]
}
```

---

## 10. `POST /api/quests` (Create Quest)

**Request Body Example:**
```json
{
  "title": "Research Local Ecosystem",
  "subject": "Environmental Science",
  "description": "Visit a local park and document its ecosystem.",
  "due_date": "2023-11-15T23:59:59.000Z",
  "xp_reward": 100,
  "importance": "high",
  "is_published": true
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "Quest created successfully",
  "quest": {
    "quest_id": "q1u2e3s4-t5r6-7890-1234-567890abcdef",
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "title": "Research Local Ecosystem",
    "subject": "Environmental Science",
    "description": "Visit a local park and document its ecosystem.",
    "due_date": "2023-11-15T23:59:59.000Z",
    "xp_reward": 100,
    "importance": "high",
    "created_by": "t1e2a3c4-h5e6-7890-1234-567890abcdef",
    "created_at": "2023-10-27T11:00:00.000Z",
    "is_published": true
  }
}
```

---

## 11. `GET /api/quests` (Get School Quests)

**Request Example:** `GET /api/quests?search=ecosystem`

**Successful Response (Status: 200 OK):**
```json
{
  "quests": [
    {
      "quest_id": "q1u2e3s4-t5r6-7890-1234-567890abcdef",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "title": "Research Local Ecosystem",
      "subject": "Environmental Science",
      "description": "Visit a local park and document its ecosystem.",
      "due_date": "2023-11-15T23:59:59.000Z",
      "xp_reward": 100,
      "importance": "high",
      "is_published": true,
      "created_at": "2023-10-27T11:00:00.000Z",
      "created_by_name": "Teacher Jane",
      "is_completed": false,
      "completed_at": null
    },
    {
      "quest_id": "q5u6e7s8-t9r0-1234-5678-90abcdef1234",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "title": "Analyze Forest Ecosystem Data",
      "subject": "Environmental Science",
      "description": "Analyze provided data on a forest ecosystem.",
      "due_date": "2023-11-20T23:59:59.000Z",
      "xp_reward": 150,
      "importance": "medium",
      "is_published": true,
      "created_at": "2023-10-27T11:05:00.000Z",
      "created_by_name": "Teacher Jane",
      "is_completed": true,
      "completed_at": "2023-11-10T14:00:00.000Z"
    }
  ]
}
```

---

## 12. `PATCH /api/quests/:id/complete` (Complete Quest)

**Request Example:** `PATCH /api/quests/q1u2e3s4-t5r6-7890-1234-567890abcdef/complete`

**Successful Response (Status: 200 OK):**
```json
{
  "message": "Quest completed, XP and level updated!",
  "newXp": 50,
  "newLevel": 2
}
```

**Error Response (Quest already completed, Status: 409 Conflict):**
```json
{
  "message": "Quest already completed by this user."
}
```

---

## 13. `POST /api/resources` (Upload Resource)

**Request Body Example:**
```json
{
  "title": "Introduction to Photosynthesis",
  "url": "https://example.com/photosynthesis.pdf",
  "type": "pdf"
}
```

**Successful Response (Status: 201 Created):**
```json
{
  "message": "Resource uploaded successfully",
  "resource": {
    "resource_id": "r1e2s3o4-u5r6-7890-1234-567890abcdef",
    "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "title": "Introduction to Photosynthesis",
    "url": "https://example.com/photosynthesis.pdf",
    "type": "pdf",
    "uploaded_by": "t1e2a3c4-h5e6-7890-1234-567890abcdef",
    "created_at": "2023-10-27T11:15:00.000Z"
  }
}
```

---

## 14. `GET /api/resources` (Get School Resources)

**Request Example:** `GET /api/resources?q=photosynthesis`

**Successful Response (Status: 200 OK):**
```json
{
  "resources": [
    {
      "resource_id": "r1e2s3o4-u5r6-7890-1234-567890abcdef",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "title": "Introduction to Photosynthesis",
      "url": "https://example.com/photosynthesis.pdf",
      "type": "pdf",
      "created_at": "2023-10-27T11:15:00.000Z",
      "uploaded_by_name": "Teacher Jane"
    },
    {
      "resource_id": "r5e6s7o8-u9r0-1234-5678-90abcdef1234",
      "school_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
      "title": "Video: The Carbon Cycle",
      "url": "https://youtube.com/watch?v=carbon_cycle",
      "type": "video",
      "created_at": "2023-10-27T11:20:00.000Z",
      "uploaded_by_name": "Teacher Jane"
    }
  ]
}
```

---

## 15. `DELETE /api/resources/:id` (Delete Resource)

**Request Example:** `DELETE /api/resources/r1e2s3o4-u5r6-7890-1234-567890abcdef`

**Successful Response (Status: 200 OK):**
```json
{
  "message": "Resource deleted successfully."
}
```

**Error Response (Forbidden - not owner/admin, Status: 403 Forbidden):**
```json
{
  "error": "Forbidden: You do not have permission to delete this resource."
}
```

---

## 16. `GET /api/achievements` (Get User Achievements)

**Successful Response (Status: 200 OK):**
```json
{
  "achievements": [
    {
      "achievement_id": "a1c2h3i4-e5v6-7890-1234-567890abcdef",
      "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "title": "First Quest Completed",
      "description": "Completed your very first quest!",
      "earned_at": "2023-10-27T11:30:00.000Z"
    },
    {
      "achievement_id": "a5c6h7i8-e9v0-1234-5678-90abcdef1234",
      "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "title": "Level 2 Reached",
      "description": "Reached player level 2.",
      "earned_at": "2023-10-27T11:35:00.000Z"
    }
  ]
}
```

---

## 17. `GET /api/progress` (Get User Progress)

**Successful Response (Status: 200 OK):**
```json
{
  "user_xp": 150,
  "user_level": 2,
  "next_level_xp_threshold": 300,
  "completed_quests": [
    {
      "progress_id": "p1r2o3g4-r5e6-7890-1234-567890abcdef",
      "quest_id": "q5u6e7s8-t9r0-1234-5678-90abcdef1234",
      "quest_title": "Analyze Forest Ecosystem Data",
      "quest_subject": "Environmental Science",
      "xp_earned": 150,
      "completed_at": "2023-11-10T14:00:00.000Z"
    }
  ]
}
