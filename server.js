import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import session from "express-session";

dotenv.config();

// Supabase credentials (kept as provided)
const SUPABASE_URL = "https://ahakbuublvrvlcxghwrx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYWtidXVibHZydmxjeGdod3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDcxNTEsImV4cCI6MjA3Mzc4MzE1MX0.i2amNZMTmHLT-HQxplk7q-YiIcSX1pBDrFSCbH8EzgU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Gemini AI if key present (it's safe if undefined; we'll guard usage)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const app = express();

// Allow both localhost:3000 and 127.0.0.1:5500 as in your original server
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:5500"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "s3YwO7sf6y",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Indian Education Boards and Classes (kept from original)
const INDIAN_BOARDS = {
  CBSE: "Central Board of Secondary Education",
  ICSE: "Indian School Certificate Examinations",
  MAHARASHTRA: "Maharashtra State Board",
  UP: "Uttar Pradesh Board",
  KARNATAKA: "Karnataka Board",
  TAMIL_NADU: "Tamil Nadu Board",
  WEST_BENGAL: "West Bengal Board"
};

const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];

const SUBJECTS_BY_CLASS = {
  "6-8": ["Mathematics", "Science", "Social Studies", "English", "Hindi", "Sanskrit"],
  "9-10": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit", "Computer Science"],
  "11-12-Science": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
  "11-12-Commerce": ["Accountancy", "Economics", "Business Studies", "Mathematics", "English"],
  "11-12-Arts": ["History", "Political Science", "Geography", "Psychology", "Sociology", "English"]
};

// ✅ Check DB connection on startup
async function checkDbConnection() {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) console.error("❌ Supabase connection failed:", error.message);
    else console.log("✅ Supabase connection successful");
  } catch (err) {
    console.error("❌ Error checking DB connection:", err.message);
  }
}
checkDbConnection();

// Helper: generate unique integer student_id (kept from your second file)
async function generateStudentId() {
  let student_id;
  let exists = true;
  while (exists) {
    student_id = Math.floor(Math.random() * 90000) + 10000; // 5-digit integer
    const { data } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", student_id)
      .limit(1);
    exists = Array.isArray(data) && data.length > 0;
  }
  return student_id;
}

// -------------------- EXISTING: Signup (kept behavior, plain-text passwords) --------------------
app.post("/signup", async (req, res) => {
  try {
    // Accept either `class` or `studentClass` for compatibility
    const { email, parent_email, password } = req.body;
    const studentClass = req.body.class || req.body.studentClass;

    if (!email || !parent_email || !password || !studentClass)
      return res.status(400).json({ error: "All fields are required" });

    // generate unique student id
    const student_id = await generateStudentId();

    // Insert into students table first
    const { data: studentData, error: studentError } = await supabase.from("students").insert([
      { student_id, class: studentClass, name: "", stream_if_valid: "" }
    ]);

    if (studentError) return res.status(400).json({ error: studentError.message });

    // Then insert into users (plain-text password as requested)
    const { data, error } = await supabase.from("users").insert([
      { student_id, email, parent_email, password }
    ]);

    if (error) {
      // rollback student if user insert fails
      await supabase.from("students").delete().eq("student_id", student_id);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "User registered successfully", data, student_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- EXISTING: Login (kept plain-text matching) --------------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // find user by email and plain-text password
    const { data, error } = await supabase
      .from("users")
      .select(`*, students (
        class,
        board,
        stream_if_valid,
        name,
        total_xp,
        level
      )`)
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) return res.status(400).json({ error: "Invalid credentials" });

    // set session (store minimal identifiers)
    req.session.userId = data.id || null; // if users table has `id`
    req.session.studentId = data.student_id;
    req.session.userEmail = data.email;
    req.session.studentInfo = data.students || null;

    // don't send password back
    if (data.password) delete data.password;

    res.json({ message: "Login successful", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Logout --------------------
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// -------------------- Get current authenticated user --------------------
app.get("/api/me", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(`*, students (*)`)
      .eq("student_id", req.session.studentId)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    if (user.password) delete user.password;
    res.json({
      loggedInUser: user,
      studentInfo: user.students
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- QUESTS (create, list, complete) --------------------
app.get("/quests", async (req, res) => {
  try {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .eq("student_id", req.session.studentId)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/quests", async (req, res) => {
  try {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const { title, subject, dueDate, importance, chapter, topic } = req.body;

    const xp_value = importance === "high" ? 50 : importance === "medium" ? 25 : 10;

    const { data, error } = await supabase.from("quests").insert([
      {
        student_id: req.session.studentId,
        title,
        subject,
        due_date: dueDate,
        importance,
        chapter,
        topic,
        completed: false,
        xp_value,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Quest created successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/quests/:id/complete", async (req, res) => {
  try {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const { id } = req.params;

    // fetch quest
    const { data: quest, error: fetchError } = await supabase
      .from("quests")
      .select("*")
      .eq("id", id)
      .eq("student_id", req.session.studentId)
      .single();

    if (fetchError || !quest) return res.status(404).json({ error: "Quest not found" });
    if (quest.completed) return res.status(400).json({ error: "Quest already completed" });

    // mark completed
    const { error: updateError } = await supabase
      .from("quests")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) return res.status(400).json({ error: updateError.message });

    // update student's XP and level
    const { data: student } = await supabase
      .from("students")
      .select("total_xp, level")
      .eq("student_id", req.session.studentId)
      .single();

    const newXp = (student?.total_xp || 0) + (quest.xp_value || 0);
    const newLevel = Math.floor(newXp / 100) + 1;

    await supabase
      .from("students")
      .update({ total_xp: newXp, level: newLevel })
      .eq("student_id", req.session.studentId);

    res.json({
      message: "Quest completed!",
      xp_earned: quest.xp_value,
      total_xp: newXp,
      level: newLevel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Chat history deletion --------------------
app.delete("/api/chat/history", async (req, res) => {
  try {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("student_id", req.session.studentId);

    if (error) return res.status(500).json({ error: "Could not delete chat history." });

    res.json({ message: "Chat history cleared successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- AI CHAT (Gemini) --------------------
app.post("/api/chat", async (req, res) => {
  try {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const { message, subject } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!genAI) {
      return res.status(500).json({ error: "Gemini API not configured. Set GEMINI_API_KEY in .env" });
    }

    // Fetch student info from session or DB
    let studentInfo = req.session.studentInfo || {};
    if (!studentInfo) {
      const { data: sData } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", req.session.studentId)
        .single();
      studentInfo = sData || {};
      req.session.studentInfo = studentInfo;
    }

    const contextPrompt = `You are Scholarly, an AI study buddy helping a ${studentInfo.board || 'Indian'} board Class ${studentInfo.class || ''} student. 
${studentInfo.stream_if_valid ? `They are in the ${studentInfo.stream_if_valid} stream.` : ''}
${subject ? `The question is about ${subject}.` : ''}
Keep your answers relevant to their curriculum level and use terminology from Indian textbooks (especially NCERT when applicable).
Be encouraging, helpful, and concise.`;

    // Initialize Gemini model (model name as in first server)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: contextPrompt }] },
        { role: "model", parts: [{ text: "Understood! I'm Scholarly, ready to help you with your studies! 📚" }] },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    // Store into chat_history
    await supabase.from("chat_history").insert([
      {
        student_id: req.session.studentId,
        message,
        response: text,
        subject: subject || null,
        created_at: new Date().toISOString()
      }
    ]);

    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini/API Error:", error);
    res.status(500).json({ error: "Failed to get a response from AI" });
  }
});

// -------------------- Reference data routes --------------------
app.get("/api/boards", (req, res) => {
  res.json(Object.keys(INDIAN_BOARDS).map(key => ({ code: key, name: INDIAN_BOARDS[key] })));
});

app.get("/api/classes", (req, res) => {
  res.json(CLASSES);
});

app.get("/api/subjects/:class/:stream?", (req, res) => {
  const studentClass = req.params.class;
  const stream = req.params.stream;

  let subjects = [];
  if (["6", "7", "8"].includes(studentClass)) subjects = SUBJECTS_BY_CLASS["6-8"];
  else if (["9", "10"].includes(studentClass)) subjects = SUBJECTS_BY_CLASS["9-10"];
  else if (["11", "12"].includes(studentClass) && stream) subjects = SUBJECTS_BY_CLASS[`11-12-${stream}`] || [];

  res.json(subjects);
});

// -------------------- EXISTING: Add student (kept) --------------------
app.post("/student", async (req, res) => {
  const { student_id, name } = req.body;
  // allow both `class` and `studentClass`
  const studentClass = req.body.class || req.body.studentClass;
  const stream_if_valid = req.body.stream_if_valid || req.body.stream;

  try {
    const { data, error } = await supabase.from("students").insert([
      { student_id, name, class: studentClass, stream_if_valid }
    ]);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Student added", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- EXISTING: Add test results (kept) --------------------
app.post("/test", async (req, res) => {
  const { student_id, subject1_test, subject2_test, subject3_test, subject4_test } = req.body;

  try {
    const { data, error } = await supabase.from("tests").insert([
      { student_id, subject1_test, subject2_test, subject3_test, subject4_test }
    ]);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Test results added", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- EXISTING: Get student info with tests (kept) --------------------
app.get("/student/:id", async (req, res) => {
  const student_id = req.params.id;

  try {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", student_id)
      .single();

    const { data: tests, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("student_id", student_id);

    if (studentError) return res.status(400).json({ error: studentError.message });
    if (testError) return res.status(400).json({ error: testError.message });

    res.json({ student, tests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Start server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
