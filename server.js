import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://mindbender4-0.onrender.com'
      ];
      const isAllowed = !origin || allowedOrigins.includes(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.json());

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    console.error("FATAL ERROR: SESSION_SECRET is not set. Please set it in your .env file.");
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: isProduction ? 'None' : 'Lax',
    },
  })
);

// ---------- Supabase & API Init ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const geminiApiKey = process.env.GEMINI_API_KEY;

// ---------- AUTH ROUTES ----------
app.post("/signup", async (req, res) => {
  const { email, parent_email, password, class: studentClass } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

    if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert([{ name: email.split("@")[0], class: studentClass }])
      .select()
      .single();
    if (studentError) throw studentError;

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([
        {
          student_id: student.student_id,
          email,
          parent_email,
          password: password, // Storing plaintext password as requested
        },
      ])
      .select()
      .single();
    if (userError) throw userError;

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.student_id; // Using integer student_id for the session
    const { password: _, ...userData } = user;
    res.json({ message: "Login successful", data: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Could not log out." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
    });
});

app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("student_id, email, parent_email")
            .eq("student_id", req.session.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { data: studentInfo, error: studentInfoError } = await supabase
            .from("students")
            .select("*")
            .eq("student_id", user.student_id)
            .single();

        if (studentInfoError) {
            console.error("Error fetching student info:", studentInfoError);
            return res.status(500).json({ message: "Error fetching student info", user });
        }

        res.json({ user, studentInfo });
    } catch (err) {
        console.error("Error in /api/me:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ---------- QUEST ROUTES ----------
app.post("/api/quests", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { title, due_date, subject, importance } = req.body;
    try {
        const student_id = req.session.userId;
        const { data: quest, error } = await supabase
            .from("quests")
            .insert([{ student_id, title, due_date, subject, importance, status: 'pending' }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({ message: "Quest added successfully", quest });
    } catch (err) {
        console.error("Add quest error:", err);
        res.status(500).json({ error: err.message || "Failed to add quest." });
    }
});

app.get("/api/quests", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const student_id = req.session.userId;
        const { data: quests, error } = await supabase
            .from("quests")
            .select("*")
            .eq("student_id", student_id)
            .eq("status", "pending");
        if (error) throw error;
        res.json({ quests });
    } catch (err) {
        console.error("Fetch quests error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch quests." });
    }
});

app.patch("/api/quests/:id/complete", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const questId = req.params.id;
    try {
        const student_id = req.session.userId;
        const { data: quest, error: questError } = await supabase
            .from("quests")
            .select("importance")
            .eq("quest_id", questId)
            .eq("student_id", student_id)
            .single();

        if (questError || !quest) {
            throw new Error("Quest not found or not authorized.");
        }

        let xpAmount = 0;
        switch (quest.importance) {
            case 'low': xpAmount = 10; break;
            case 'medium': xpAmount = 25; break;
            case 'high': xpAmount = 50; break;
            default: xpAmount = 25;
        }

        const { error: updateQuestError } = await supabase
            .from("quests")
            .update({ status: 'completed' })
            .eq("quest_id", questId)
            .eq("student_id", student_id);
        if (updateQuestError) throw updateQuestError;

        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("xp, level")
            .eq("student_id", student_id)
            .single();
        if (studentError || !student) {
            throw new Error("Student not found.");
        }

        let newXp = student.xp + xpAmount;
        let newLevel = student.level;
        let xpToNextLevel = 100;
        for (let i = 1; i < newLevel; i++) {
            xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        }
        if (newXp >= xpToNextLevel) {
            newLevel++;
            newXp -= xpToNextLevel;
        }
        const { error: updateStudentError } = await supabase
            .from("students")
            .update({ xp: newXp, level: newLevel })
            .eq("student_id", student_id);

        if (updateStudentError) throw updateStudentError;

        res.json({ message: "Quest completed, XP and level updated!" });
    } catch (err) {
        console.error("Complete quest error:", err);
        res.status(500).json({ error: err.message || "Failed to complete quest." });
    }
});

// ---------- CHAT HISTORY ROUTES ----------
// Create a new chat session
app.post("/api/chat-sessions", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { title = "New Chat" } = req.body;
        // ✅ FIX: Directly use the student ID from the session. No need for another DB query.
        const student_id = req.session.userId;

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .insert([{ student_id, title }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ session });
    } catch (err) {
        console.error("Create chat session error:", err);
        res.status(500).json({ error: err.message || "Failed to create chat session." });
    }
});

// Get all chat sessions for a user
app.get("/api/chat-sessions", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const { data: sessions, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("student_id", student_id)
            .order("updated_at", { ascending: false });

        if (error) throw error;

        res.json({ sessions });
    } catch (err) {
        console.error("Fetch chat sessions error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch chat sessions." });
    }
});

// Save a message to a chat session
app.post("/api/chat-messages", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { session_id, message_type, content } = req.body;
        if (!session_id || !message_type || !content) {
            return res.status(400).json({ error: "session_id, message_type, and content are required" });
        }
        
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        // Verify the session belongs to the user
        const { data: chatSession, error: sessionError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", session_id)
            .eq("student_id", student_id) // Use the direct student_id from session
            .single();

        if (sessionError || !chatSession) {
            return res.status(403).json({ error: "Chat session not found or unauthorized" });
        }

        const { data: message, error } = await supabase
            .from("chat_messages")
            .insert([{ session_id, message_type, content }])
            .select()
            .single();

        if (error) throw error;

        // Update the session's updated_at timestamp
        await supabase
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", session_id);

        res.status(201).json({ message });
    } catch (err) {
        console.error("Save chat message error:", err);
        res.status(500).json({ error: err.message || "Failed to save chat message." });
    }
});

// Get all messages for a chat session
app.get("/api/chat-messages/:sessionId", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { sessionId } = req.params;
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        // Verify the session belongs to the user
        const { data: chatSession, error: sessionError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", sessionId)
            .eq("student_id", student_id)
            .single();

        if (sessionError || !chatSession) {
            return res.status(403).json({ error: "Chat session not found or unauthorized" });
        }

        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("session_id", sessionId)
            .order("timestamp", { ascending: true });

        if (error) throw error;

        res.json({ messages });
    } catch (err) {
        console.error("Fetch chat messages error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch chat messages." });
    }
});


// Update chat session title
app.patch("/api/chat-sessions/:sessionId", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { sessionId } = req.params;
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }
        
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", sessionId)
            .eq("student_id", student_id)
            .select()
            .single();

        if (error) throw error;
        if (!session) {
            return res.status(404).json({ error: "Chat session not found" });
        }

        res.json({ session });
    } catch (err) {
        console.error("Update chat session error:", err);
        res.status(500).json({ error: err.message || "Failed to update chat session." });
    }
});


// ---------- NOTE MANAGEMENT ROUTES ----------
// Create a new note
app.post("/api/notes", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { title, tags, priority, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
    }
    try {
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const { data: note, error: insertError } = await supabase
            .from("notes")
            .insert([{
                student_id,
                title,
                tags,
                priority: priority || "normal",
                content,
            }])
            .select()
            .single();
        if (insertError) throw insertError;
        res.status(201).json({ message: "Note saved", note });
    } catch (err) {
        console.error("Add note error:", err);
        res.status(500).json({ error: err.message || "Failed to save note." });
    }
});

// Get all notes for logged in student
app.get("/api/notes", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const { data: notes, error: notesError } = await supabase
            .from("notes")
            .select("*")
            .eq("student_id", student_id)
            .order("updated_at", { ascending: false });
        if (notesError) throw notesError;
        res.json({ notes });
    } catch (err) {
        console.error("Fetch notes error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch notes." });
    }
});

// Update a note
app.patch("/api/notes/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const noteId = req.params.id;
    const { title, tags, priority, content } = req.body;
    try {
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const update = {
            updated_at: new Date().toISOString()
        };
        if (title !== undefined) update.title = title;
        if (tags !== undefined) update.tags = tags;
        if (priority !== undefined) update.priority = priority;
        if (content !== undefined) update.content = content;

        const { error: updateError } = await supabase
            .from("notes")
            .update(update)
            .eq("id", noteId)
            .eq("student_id", student_id);
        if (updateError) throw updateError;
        res.json({ message: "Note updated" });
    } catch (err) {
        console.error("Update note error:", err);
        res.status(500).json({ error: err.message || "Failed to update note." });
    }
});

// Delete a note
app.delete("/api/notes/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const noteId = req.params.id;
    try {
        // ✅ FIX: Directly use the student ID from the session.
        const student_id = req.session.userId;

        const { error: delError } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteId)
            .eq("student_id", student_id);
        if (delError) throw delError;
        res.json({ message: "Note deleted" });
    } catch (err) {
        console.error("Delete note error:", err);
        res.status(500).json({ error: err.message || "Failed to delete note." });
    }
});


// ---------- AI ROUTES ----------
app.post("/chat", async (req, res) => {
    const { message, subject, session_id } = req.body;
    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    try {
        const response = await fetch(geminiApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Subject: ${subject || "General"}. Question: ${message}` }] }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts[0]?.text || "Sorry, I could not generate a response.";

        // Save messages to DB if session_id is provided
        if (session_id && req.session.userId) {
            const saveMessage = async (type, content) => {
                 try {
                     await fetch(`${req.protocol}://${req.get('host')}/api/chat-messages`, {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Cookie': req.headers.cookie // Forward the cookie for authentication
                         },
                         body: JSON.stringify({
                             session_id,
                             message_type: type,
                             content
                         })
                     });
                 } catch (saveError) {
                      console.error("Error saving chat message:", saveError);
                 }
            };
            await saveMessage('user', message);
            await saveMessage('bot', reply);
        }

        res.json({ reply });
    } catch (err) {
        console.error("Gemini API error:", err);
        res.status(500).json({ error: "Failed to get response from Gemini API" });
    }
});

app.post("/api/generate-plan", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { topic, deadline, studentClass } = req.body;
    if (!topic || !deadline || !studentClass) {
        return res.status(400).json({ error: "Topic, deadline, and student class are required." });
    }
    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const prompt = `You are an expert academic planner for a student in class ${studentClass}. 
    The student needs a study plan for the topic '${topic}' with a deadline of ${deadline}. 
    Generate a step-by-step study plan as a JSON array. Each item in the array should be an object with 'title' (a specific task) and 'subject' properties. 
    Make the tasks clear and actionable. For example: 'Review chapter on linear equations', 'Complete 10 practice problems', 'Watch a video on quadratic formulas'.`;

    try {
        const response = await fetch(geminiApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        const geminiReplyText = data.candidates?.[0]?.content?.parts[0]?.text;

        if (!geminiReplyText) {
            throw new Error("Gemini API did not return a valid plan.");
        }

        let studyPlan;
        try {
            const jsonMatch = geminiReplyText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                studyPlan = JSON.parse(jsonMatch[1]);
            } else {
                studyPlan = JSON.parse(geminiReplyText);
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", parseError);
            console.log("Raw Gemini response:", geminiReplyText);
            throw new Error("Failed to parse study plan from AI response.");
        }

        if (!Array.isArray(studyPlan)) {
            throw new Error("AI response is not a JSON array.");
        }

        const student_id = req.session.userId;
        const questsToInsert = studyPlan.map(planItem => ({
            student_id,
            title: planItem.title,
            subject: planItem.subject || topic,
            due_date: deadline,
            importance: 'medium',
            status: 'pending'
        }));

        const { data: insertedQuests, error: insertError } = await supabase
            .from("quests")
            .insert(questsToInsert)
            .select();

        if (insertError) {
            throw insertError;
        }

        res.json({ message: "Study plan generated and quests added!", quests: insertedQuests });

    } catch (err) {
        console.error("Generate plan API error:", err);
        res.status(500).json({ error: err.message || "Failed to generate study plan." });
    }
});

// ============= KNOWLEDGE MAP API ROUTES =============

// Get all subjects available for knowledge mapping
app.get("/api/knowledge/subjects", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get student info to filter by board and class
    const { data: student } = await supabase
      .from("students")
      .select("board, class, stream")
      .eq("student_id", req.session.studentId)
      .single();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get subjects for this student's board and class
    const { data: subjects, error } = await supabase
      .from("knowledge_subjects")
      .select("*")
      .eq("board", student.board)
      .eq("class_level", student.class);

    if (error) {
      console.error("Error fetching knowledge subjects:", error);
      return res.status(500).json({ error: "Failed to fetch subjects" });
    }

    res.json(subjects);
  } catch (err) {
    console.error("Knowledge subjects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get concepts and prerequisites for a subject
app.get("/api/knowledge/subject/:subjectId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { subjectId } = req.params;

    // Get concepts for this subject
    const { data: concepts, error: conceptsError } = await supabase
      .from("knowledge_concepts")
      .select("*")
      .eq("subject_id", subjectId)
      .order("position_x", { ascending: true });

    if (conceptsError) {
      console.error("Error fetching concepts:", conceptsError);
      return res.status(500).json({ error: "Failed to fetch concepts" });
    }

    // Get prerequisites for these concepts
    const conceptIds = concepts.map(c => c.concept_id);
    const { data: prerequisites, error: prereqError } = await supabase
      .from("knowledge_prerequisites")
      .select("*")
      .in("concept_id", conceptIds);

    if (prereqError) {
      console.error("Error fetching prerequisites:", prereqError);
      return res.status(500).json({ error: "Failed to fetch prerequisites" });
    }

    // Get student progress for these concepts
    const { data: progress, error: progressError } = await supabase
      .from("knowledge_progress")
      .select("*")
      .eq("student_id", req.session.studentId)
      .in("concept_id", conceptIds);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
    }

    // Initialize progress for concepts that don't have progress records
    const existingProgressIds = progress ? progress.map(p => p.concept_id) : [];
    const missingProgressConcepts = concepts.filter(c => !existingProgressIds.includes(c.concept_id));
    
    if (missingProgressConcepts.length > 0) {
      // Initialize with locked status
      const newProgressRecords = missingProgressConcepts.map(concept => ({
        student_id: req.session.studentId,
        concept_id: concept.concept_id,
        status: 'locked'
      }));

      const { data: insertedProgress } = await supabase
        .from("knowledge_progress")
        .insert(newProgressRecords)
        .select("*");

      // Add inserted records to progress array
      if (insertedProgress) {
        progress.push(...insertedProgress);
      }
    }

    // Unlock concepts with no prerequisites
    const conceptsWithoutPrereqs = concepts.filter(concept => 
      !prerequisites.some(p => p.concept_id === concept.concept_id)
    );

    if (conceptsWithoutPrereqs.length > 0) {
      const { error: unlockError } = await supabase
        .from("knowledge_progress")
        .update({ status: 'unlocked' })
        .eq("student_id", req.session.studentId)
        .in("concept_id", conceptsWithoutPrereqs.map(c => c.concept_id))
        .eq("status", "locked");

      if (unlockError) {
        console.error("Error unlocking initial concepts:", unlockError);
      }
    }

    // Fetch updated progress
    const { data: updatedProgress } = await supabase
      .from("knowledge_progress")
      .select("*")
      .eq("student_id", req.session.studentId)
      .in("concept_id", conceptIds);

    res.json({
      concepts,
      prerequisites,
      progress: updatedProgress || []
    });
  } catch (err) {
    console.error("Knowledge subject data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start learning a concept
app.post("/api/knowledge/start-learning/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;

    // Check if concept is unlocked
    const { data: progress } = await supabase
      .from("knowledge_progress")
      .select("status")
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId)
      .single();

    if (!progress || progress.status === 'locked') {
      return res.status(400).json({ error: "Concept is not available" });
    }

    // Update status to in_progress
    const { error } = await supabase
      .from("knowledge_progress")
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      })
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (error) {
      console.error("Error starting learning:", error);
      return res.status(500).json({ error: "Failed to start learning" });
    }

    res.json({ message: "Learning started successfully" });
  } catch (err) {
    console.error("Start learning error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get quiz for a concept
app.get("/api/knowledge/quiz/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;

    // Get quiz questions for this concept
    const { data: questions, error } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, question_text, options, difficulty")
      .eq("concept_id", conceptId)
      .order("difficulty", { ascending: true });

    if (error) {
      console.error("Error fetching quiz questions:", error);
      return res.status(500).json({ error: "Failed to fetch quiz" });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: "No quiz available for this concept" });
    }

    // Return questions without correct answers
    res.json({
      concept_id: conceptId,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        difficulty: q.difficulty
      }))
    });
  } catch (err) {
    console.error("Quiz fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit quiz answers
app.post("/api/knowledge/quiz/:conceptId/submit", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;
    const { answers, timeSpent } = req.body; // answers is array of {questionId, selectedAnswer}

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Get the correct answers
    const questionIds = answers.map(a => a.questionId);
    const { data: questions, error: questionsError } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, correct_answer, explanation")
      .in("id", questionIds);

    if (questionsError) {
      console.error("Error fetching correct answers:", questionsError);
      return res.status(500).json({ error: "Failed to grade quiz" });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedResults = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const isCorrect = question && answer.selectedAnswer === question.correct_answer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question ? question.correct_answer : null,
        isCorrect,
        explanation: question ? question.explanation : null
      };
    });

    const score = Math.round((correctAnswers / answers.length) * 100);
    const passed = score >= 70;

    // Record the quiz attempt
    const { error: attemptError } = await supabase
      .from("knowledge_quiz_attempts")
      .insert({
        student_id: req.session.studentId,
        concept_id: conceptId,
        score,
        total_questions: answers.length,
        correct_answers: correctAnswers,
        time_taken_seconds: timeSpent || 0,
        answers: JSON.stringify(answers)
      });

    if (attemptError) {
      console.error("Error recording quiz attempt:", attemptError);
    }

    // Update progress
    const newStatus = passed ? 'completed' : 'in_progress';
    const updateData = {
      status: newStatus,
      quiz_score: score,
      attempts: supabase.raw('attempts + 1'),
      last_accessed: new Date().toISOString()
    };

    if (passed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: progressError } = await supabase
      .from("knowledge_progress")
      .update(updateData)
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (progressError) {
      console.error("Error updating progress:", progressError);
      return res.status(500).json({ error: "Failed to update progress" });
    }

    // If concept was completed, check for unlocking dependent concepts
    if (passed) {
      await unlockDependentConcepts(req.session.studentId, conceptId);
    }

    res.json({
      score,
      passed,
      correctAnswers,
      totalQuestions: answers.length,
      results: detailedResults,
      message: passed ? "Congratulations! You've mastered this concept!" : "Keep practicing! You can retake the quiz when ready."
    });
  } catch (err) {
    console.error("Quiz submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to unlock dependent concepts
async function unlockDependentConcepts(studentId, completedConceptId) {
  try {
    // Find concepts that depend on the completed concept
    const { data: dependentConcepts, error: depError } = await supabase
      .from("knowledge_prerequisites")
      .select("concept_id")
      .eq("prerequisite_concept_id", completedConceptId);

    if (depError) {
      console.error("Error finding dependent concepts:", depError);
      return;
    }

    if (!dependentConcepts || dependentConcepts.length === 0) {
      return; // No dependent concepts
    }

    // For each dependent concept, check if all prerequisites are now met
    for (const dep of dependentConcepts) {
      const conceptId = dep.concept_id;
      
      // Get all prerequisites for this concept
      const { data: allPrereqs, error: prereqError } = await supabase
        .from("knowledge_prerequisites")
        .select("prerequisite_concept_id")
        .eq("concept_id", conceptId);

      if (prereqError) {
        console.error("Error getting prerequisites:", prereqError);
        continue;
      }

      // Check if all prerequisites are completed
      const prereqIds = allPrereqs.map(p => p.prerequisite_concept_id);
      const { data: prereqProgress, error: progError } = await supabase
        .from("knowledge_progress")
        .select("concept_id, status")
        .eq("student_id", studentId)
        .in("concept_id", prereqIds);

      if (progError) {
        console.error("Error checking prerequisite progress:", progError);
        continue;
      }

      // Check if all prerequisites are completed
      const allCompleted = prereqIds.every(prereqId => {
        const progress = prereqProgress.find(p => p.concept_id === prereqId);
        return progress && progress.status === 'completed';
      });

      if (allCompleted) {
        // Unlock this concept
        const { error: unlockError } = await supabase
          .from("knowledge_progress")
          .update({ 
            status: 'unlocked',
            last_accessed: new Date().toISOString()
          })
          .eq("student_id", studentId)
          .eq("concept_id", conceptId)
          .eq("status", "locked");

        if (unlockError) {
          console.error("Error unlocking concept:", unlockError);
        }
      }
    }
  } catch (err) {
    console.error("Error in unlockDependentConcepts:", err);
  }
}

// Get student progress summary
app.get("/api/knowledge/progress/summary", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: summary, error } = await supabase
      .from("student_progress_summary")
      .select("*")
      .eq("student_id", req.session.studentId);

    if (error) {
      console.error("Error fetching progress summary:", error);
      return res.status(500).json({ error: "Failed to fetch progress summary" });
    }

    res.json(summary || []);
  } catch (err) {
    console.error("Progress summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get recommended next concepts
app.get("/api/knowledge/recommendations", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get all unlocked concepts for the student
    const { data: unlockedConcepts, error } = await supabase
      .from("knowledge_progress")
      .select(`
        concept_id,
        knowledge_concepts!inner(
          concept_name,
          description,
          difficulty_level,
          estimated_time_minutes,
          knowledge_subjects!inner(subject_name)
        )
      `)
      .eq("student_id", req.session.studentId)
      .eq("status", "unlocked")
      .order("knowledge_concepts.difficulty_level", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return res.status(500).json({ error: "Failed to fetch recommendations" });
    }

    res.json(unlockedConcepts || []);
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update concept progress (for tracking time spent, etc.)
app.put("/api/knowledge/progress/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;
    const { timeSpent, status } = req.body;

    const updateData = {
      last_accessed: new Date().toISOString()
    };

    if (timeSpent) {
      updateData.time_spent_minutes = supabase.raw(`time_spent_minutes + ${parseInt(timeSpent)}`);
    }

    if (status && ['unlocked', 'in_progress', 'completed'].includes(status)) {
      updateData.status = status;
    }

    const { error } = await supabase
      .from("knowledge_progress")
      .update(updateData)
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (error) {
      console.error("Error updating progress:", error);
      return res.status(500).json({ error: "Failed to update progress" });
    }

    res.json({ message: "Progress updated successfully" });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get learning analytics for a student
app.get("/api/knowledge/analytics", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get overall progress stats
    const { data: progressStats, error: progressError } = await supabase
      .from("student_progress_summary")
      .select("*")
      .eq("student_id", req.session.studentId);

    // Get recent quiz attempts
    const { data: recentQuizzes, error: quizError } = await supabase
      .from("knowledge_quiz_attempts")
      .select(`
        concept_id,
        score,
        attempt_date,
        knowledge_concepts!inner(concept_name, knowledge_subjects!inner(subject_name))
      `)
      .eq("student_id", req.session.studentId)
      .order("attempt_date", { ascending: false })
      .limit(10);

    // Get time spent by subject
    const { data: timeStats, error: timeError } = await supabase
      .from("knowledge_progress")
      .select(`
        time_spent_minutes,
        knowledge_concepts!inner(
          knowledge_subjects!inner(subject_name)
        )
      `)
      .eq("student_id", req.session.studentId)
      .gt("time_spent_minutes", 0);

    if (progressError || quizError || timeError) {
      console.error("Error fetching analytics:", { progressError, quizError, timeError });
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }

    // Process time stats by subject
    const timeBySubject = {};
    if (timeStats) {
      timeStats.forEach(stat => {
        const subjectName = stat.knowledge_concepts.knowledge_subjects.subject_name;
        timeBySubject[subjectName] = (timeBySubject[subjectName] || 0) + stat.time_spent_minutes;
      });
    }

    res.json({
      progressStats: progressStats || [],
      recentQuizzes: recentQuizzes || [],
      timeBySubject
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
