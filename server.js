import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

// BCrypt import removed
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000', // Assuming frontend runs on localhost:3000 during development
        'http://127.0.0.1:3000',
        'https://mindbender4-0.onrender.com' // Allow requests from the deployed frontend
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

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
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
    // Check if user already exists
    const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

    if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
    }

    // BCrypt hashing removed
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
          password: password, // Storing plaintext password
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

    // Comparing plaintext password
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    const { password: _, ...userData } = user;
    res.json({ message: "Login successful", data: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Other routes (logout, chat) remain the same...

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
            .select("student_id, email, parent_email") // Select relevant user data
            .eq("id", req.session.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Optionally fetch student info if needed for the frontend
        const { data: studentInfo, error: studentInfoError } = await supabase
            .from("students")
            .select("*")
            .eq("student_id", user.student_id)
            .single();

        if (studentInfoError) {
            console.error("Error fetching student info:", studentInfoError);
            // Continue without studentInfo if there's an error, or return an error
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
            .eq("id", req.session.userId)
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
            .eq("id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const student_id = userSession.student_id;

        const { data: quests, error } = await supabase
            .from("quests")
            .select("*")
            .eq("student_id", student_id)
            .eq("status", "pending"); // Only fetch pending quests

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
            .eq("id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const student_id = userSession.student_id;

        // Get quest details to determine XP
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

        // Update quest status
        const { error: updateQuestError } = await supabase
            .from("quests")
            .update({ status: 'completed' })
            .eq("quest_id", questId)
            .eq("student_id", student_id);

        if (updateQuestError) throw updateQuestError;

        // Update student XP and level
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
        let xpToNextLevel = 100; // Base XP for level 1

        // Recalculate xpToNextLevel based on current level
        for (let i = 1; i < newLevel; i++) {
            xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        }

        if (newXp >= xpToNextLevel) {
            newLevel++;
            newXp -= xpToNextLevel;
            // For simplicity, we're not recalculating xpToNextLevel for the *new* level here,
            // as the frontend will handle that on fetchPlayerStats.
            // If more complex level progression is needed, this logic should be more robust.
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

app.post("/chat", async (req, res) => {
    const { message, subject } = req.body;
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

        // Attempt to parse the JSON array from the Gemini response
        let studyPlan;
        try {
            // Gemini might return markdown code block, so extract JSON
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

        // Fetch student_id from session
        const { data: userSession, error: userSessionError } = await supabase
            .from("users")
            .select("student_id")
            .eq("id", req.session.userId)
            .single();

        if (userSessionError || !userSession) {
            throw new Error("Could not find student_id for the current user.");
        }

        const student_id = userSession.student_id;

        // Insert quests into Supabase
        const questsToInsert = studyPlan.map(planItem => ({
            student_id: student_id,
            title: planItem.title,
            subject: planItem.subject || topic, // Use planItem.subject if available, else use the main topic
            due_date: deadline,
            importance: 'medium', // Default importance
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
