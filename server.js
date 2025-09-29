import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import the SDK

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const geminiApiKey = "AIzaSyAWZI5sD7YqqTqMgh4KsKvktrPTOQe4hHM"; // Hardcoded as per user request
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiProModel = genAI.getGenerativeModel({ model: "gemini-pro" });
const geminiFlashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using a stable model identifier for Flash

// ---------- Middleware ----------
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://mindbender4-0.onrender.com',
        'https://scholarli.netlify.app',
        // Add your frontend URL here if it's different
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

// Serve static files from the current directory
app.use(express.static('.'));

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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Supabase URL or Key is not set.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);


// ---------- KNOWLEDGE MAP DATA (NEW) ----------
const cbseClass10MathsSyllabus = {
  "Real Numbers": [
    { name: "Euclid's Division Lemma", description: "Learn to find the HCF of two positive integers." },
    { name: "The Fundamental Theorem of Arithmetic", description: "Understand prime factorization and its applications in finding HCF and LCM." },
    { name: "Revisiting Irrational Numbers", description: "Prove the irrationality of numbers like √2, √3, and √5." },
    { name: "Decimal Expansions of Rational Numbers", description: "Determine if a rational number has a terminating or non-terminating decimal expansion." }
  ],
  "Polynomials": [
    { name: "Geometrical Meaning of the Zeroes", description: "Visualize the zeroes of linear, quadratic, and cubic polynomials." },
    { name: "Relationship between Zeroes and Coefficients", description: "Find the relationship between zeroes and coefficients of a polynomial." },
    { name: "Division Algorithm for Polynomials", description: "Learn to divide one polynomial by another." }
  ],
  "Pair of Linear Equations in Two Variables": [
    { name: "Graphical Method of Solution", description: "Solve a system of linear equations by graphing." },
    { name: "Algebraic Methods of Solving", description: "Learn substitution, elimination, and cross-multiplication methods." },
    { name: "Equations Reducible to Linear Form", description: "Solve pairs of equations that can be reduced to linear form." }
  ],
  "Quadratic Equations": [
    { name: "Introduction to Quadratic Equations", description: "Identify quadratic equations (ax² + bx + c = 0)." },
    { name: "Solution by Factorisation", description: "Find roots by splitting the middle term." },
    { name: "Solution by Completing the Square", description: "A method to convert the quadratic into a perfect square." },
    { name: "Solution by Quadratic Formula", description: "Use the formula x = [-b ± sqrt(b²-4ac)] / 2a to find roots." },
    { name: "Nature of Roots", description: "Understand the discriminant (b²-4ac) to determine the nature of the roots." }
  ],
  "Introduction to Trigonometry": [
    { name: "Trigonometric Ratios", description: "Define sin, cos, tan, cosec, sec, cot for an acute angle." },
    { name: "Trigonometric Ratios of Specific Angles", description: "Learn the values for 0°, 30°, 45°, 60°, and 90°." },
    { name: "Trigonometric Ratios of Complementary Angles", description: "Understand relations like sin(90°-A) = cos(A)." },
    { name: "Trigonometric Identities", description: "Learn and apply fundamental identities like sin²A + cos²A = 1." }
  ]
};


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
app.get("/api/quests", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const student_id = req.session.userId;
        const { search, status } = req.query; // Add search and status query parameters

        let query = supabase
            .from("quests")
            .select("*")
            .eq("student_id", student_id);

        if (status) {
            query = query.eq("status", status);
        } else {
            query = query.eq("status", "pending"); // Default to pending if no status is provided
        }

        if (search) {
            query = query.ilike("title", `%${search}%`); // Case-insensitive search by title
        }

        const { data: quests, error } = await query;

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
        // Base XP to next level, with a slight variation based on student_id
        let base_xp_to_next_level = 100 + (student_id % 10); // Adds a unique factor per student
        let xpToNextLevel = base_xp_to_next_level;

        // Scale XP requirement for higher levels
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
app.post("/api/chat-sessions", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { title = "New Chat" } = req.body;
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

app.get("/api/chat-sessions", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
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

app.post("/api/chat-messages", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { session_id, message_type, content } = req.body;
        if (!session_id || !message_type || !content) {
            return res.status(400).json({ error: "session_id, message_type, and content are required" });
        }
        const student_id = req.session.userId;
        const { data: chatSession, error: sessionError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", session_id)
            .eq("student_id", student_id)
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

app.get("/api/chat-messages/:sessionId", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { sessionId } = req.params;
        const student_id = req.session.userId;
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
app.post("/api/notes", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { title, tags, priority, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
    }
    try {
        const student_id = req.session.userId;
        const { data: note, error: insertError } = await supabase
            .from("notes")
            .insert([{ student_id, title, tags, priority: priority || "normal", content }])
            .select()
            .single();
        if (insertError) throw insertError;
        res.status(201).json({ message: "Note saved", note });
    } catch (err) {
        console.error("Add note error:", err);
        res.status(500).json({ error: err.message || "Failed to save note." });
    }
});

app.get("/api/notes", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
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

app.get("/api/notes/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const noteId = req.params.id;
    try {
        const student_id = req.session.userId;
        const { data: note, error: noteError } = await supabase
            .from("notes")
            .select("*")
            .eq("id", noteId)
            .eq("student_id", student_id)
            .single();
        if (noteError) throw noteError;
        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }
        res.json(note);
    } catch (err) {
        console.error("Fetch single note error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch note." });
    }
});

app.patch("/api/notes/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const noteId = req.params.id;
    const { title, tags, priority, content } = req.body;
    try {
        const student_id = req.session.userId;
        const update = { updated_at: new Date().toISOString() };
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

app.delete("/api/notes/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const noteId = req.params.id;
    try {
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
    try {
        const result = await geminiFlashModel.generateContent(`Subject: ${subject || "General"}. Question: ${message}`);
        const response = await result.response;
        const reply = response.text();
        if (session_id && req.session.userId) {
            // Function to save message to database
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
        return res.status(400).json({ error: "Topic, deadline, and class are required." });
    }
    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    try {
        const prompt = `Generate a study plan for the topic "${topic}" for a Class ${studentClass} student, with a deadline of ${deadline}.`;
        const result = await geminiFlashModel.generateContent(prompt);
        const response = await result.response;
        const plan = response.text();
        res.json({ plan });
    } catch (err) {
        console.error("Generate plan API error:", err);
        res.status(500).json({ error: "Failed to generate study plan from AI." });
    }
});

// ---------- KNOWLEDGE MAP ROUTES (NEW) ----------

app.get("/api/knowledge-map/chapters", (req, res) => {
    const { subject, class: studentClass } = req.query;
    if (subject === "Maths" && studentClass === "10") {
        res.json(Object.keys(cbseClass10MathsSyllabus));
    } else {
        res.json([]);
    }
});

app.get("/api/knowledge-map/topics", (req, res) => {
    const { subject, class: studentClass, chapter } = req.query;
    if (subject === "Maths" && studentClass === "10" && cbseClass10MathsSyllabus[chapter]) {
        res.json(cbseClass10MathsSyllabus[chapter]);
    } else {
        res.status(404).json([]);
    }
});

app.post("/api/knowledge-map/teach-topic", async (req, res) => {
    const { topic, chapter } = req.body;
    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    if (!topic || !chapter) {
        return res.status(400).json({ error: "Topic and chapter are required." });
    }

    const prompt = `
    Act as a friendly and engaging tutor for a Class 10 student.
    Explain the following topic in a simple and interesting way.

    **Chapter:** "${chapter}"
    **Topic:** "${topic}"

    Your explanation MUST include the following sections, formatted in Markdown:
    1.  **### 💡 The Big Idea (Analogy)**: Start with a simple, real-world analogy to make the concept relatable.
    2.  **### 🧠 How It Works**: Provide a clear, step-by-step explanation of the core concept. Use bullet points or numbered lists.
    3.  **### ✏️ Example Problem**: Give one clear, solved example problem. Show the steps clearly.
    4.  **### 🤔 Quick Check**: End with one simple multiple-choice or short-answer question to check for understanding (without giving the answer).
    `;

    try {
        const result = await geminiFlashModel.generateContent(prompt); // Using geminiFlashModel as requested
        const response = await result.response;
        const content = response.text();

        res.json({ content });
    } catch (err) {
        console.error("Teach Topic API error:", err); // Log the full error object
        res.status(500).json({ error: "Failed to get explanation from AI.", details: err.message || "Unknown error" });
    }
});


// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
