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
      maxAge: 1000 * 60 * 60 * 24,
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
          password: password,
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

    // THE KEY FIX: save student_id to session
    req.session.userId = user.student_id;
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
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();
        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }
        const student_id = userSession.student_id;
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
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();
        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }
        const student_id = userSession.student_id;
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
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();
        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }
        const student_id = userSession.student_id;
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

        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const student_id = userSession.student_id;

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .insert([{
                student_id,
                title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
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
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const student_id = userSession.student_id;

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

        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        // Verify the session belongs to the user
        const { data: chatSession, error: sessionError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", session_id)
            .eq("student_id", userSession.student_id)
            .single();

        if (sessionError || !chatSession) {
            return res.status(403).json({ error: "Chat session not found or unauthorized" });
        }

        const { data: message, error } = await supabase
            .from("chat_messages")
            .insert([{
                session_id,
                message_type,
                content,
                timestamp: new Date().toISOString()
            }])
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

        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        // Verify the session belongs to the user
        const { data: chatSession, error: sessionError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", sessionId)
            .eq("student_id", userSession.student_id)
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

        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", sessionId)
            .eq("student_id", userSession.student_id)
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

        if (session_id && req.session.userId) {
            try {
                await fetch(`${req.protocol}://${req.get('host')}/api/chat-messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': req.headers.cookie
                    },
                    body: JSON.stringify({
                        session_id,
                        message_type: 'user',
                        content: message
                    })
                });

                await fetch(`${req.protocol}://${req.get('host')}/api/chat-messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': req.headers.cookie
                    },
                    body: JSON.stringify({
                        session_id,
                        message_type: 'bot',
                        content: reply
                    })
                });
            } catch (saveError) {
                console.error("Error saving chat messages:", saveError);
            }
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
            const jsonMatch = geminiReplyText.match(/``````/);
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
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("student_id", req.session.userId)
            .single();
        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }
        const student_id = userSession.student_id;
        const questsToInsert = studyPlan.map(planItem => ({
            student_id: student_id,
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

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
