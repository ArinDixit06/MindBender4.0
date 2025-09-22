import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import session from "express-session";

dotenv.config();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();

// Middleware
app.use(cors({ 
  origin: ["http://localhost:3000", "http://127.0.0.1:5500"],
  credentials: true 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 's3YwO7sf6y',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Indian Education Boards and Classes
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

// Check DB connection
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

// ============= AUTH ROUTES =============

// Signup with password hashing
app.post("/signup", async (req, res) => {
  try {
    const { email, parent_email, password, studentClass, board, stream } = req.body;
    
    if (!email || !parent_email || !password || !studentClass || !board) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate student ID
    const student_id = Math.floor(Math.random() * 900000) + 100000;

    // Insert into students table
    const { error: studentError } = await supabase.from("students").insert([
      { 
        student_id, 
        class: studentClass, 
        board,
        stream: stream || null,
        name: email.split('@')[0], // Use email prefix as initial name
        created_at: new Date().toISOString()
      }
    ]);

    if (studentError) {
      return res.status(400).json({ error: studentError.message });
    }
    
    // Insert into users table
    const { data, error } = await supabase.from("users").insert([
      { 
        student_id, 
        email, 
        parent_email, 
        password: hashedPassword,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      // Rollback student creation if user creation fails
      await supabase.from("students").delete().eq("student_id", student_id);
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: "User registered successfully", 
      student_id,
      board: INDIAN_BOARDS[board]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login with password verification
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Get user with student info
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        *,
        students (
          class,
          board,
          stream,
          name
        )
      `)
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create session
    req.session.userId = user.id;
    req.session.studentId = user.student_id;
    req.session.userEmail = user.email;
    req.session.studentInfo = user.students;

    // Don't send password to client
    delete user.password;

    res.json({ 
      message: "Login successful", 
      data: user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// ============= GET CURRENT USER =============
app.get("/api/me", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Fetch fresh user and student data
    const { data: user, error } = await supabase
      .from("users")
      .select(`*, students (*)`)
      .eq("student_id", req.session.studentId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't send the password hash
    delete user.password;
    
    // Send all necessary info to the frontend
    res.json({
        loggedInUser: user,
        studentInfo: user.students
    });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
  }
});

// ============= QUEST/TASK ROUTES =============

// Get user's quests
app.get("/quests", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .eq("student_id", req.session.studentId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create quest
app.post("/quests", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { title, subject, dueDate, importance, chapter, topic } = req.body;

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
        xp_value: importance === 'high' ? 50 : importance === 'medium' ? 25 : 10,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Quest created successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Complete quest
app.put("/quests/:id/complete", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Get quest to verify ownership and get XP value
    const { data: quest, error: fetchError } = await supabase
      .from("quests")
      .select("*")
      .eq("id", id)
      .eq("student_id", req.session.studentId)
      .single();

    if (fetchError || !quest) {
      return res.status(404).json({ error: "Quest not found" });
    }

    if (quest.completed) {
      return res.status(400).json({ error: "Quest already completed" });
    }

    // Mark quest as completed
    const { error: updateError } = await supabase
      .from("quests")
      .update({ 
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Update user's XP
    const { data: student } = await supabase
      .from("students")
      .select("total_xp, level")
      .eq("student_id", req.session.studentId)
      .single();

    const newXp = (student?.total_xp || 0) + quest.xp_value;
    const newLevel = Math.floor(newXp / 100) + 1;

    await supabase
      .from("students")
      .update({ 
        total_xp: newXp,
        level: newLevel
      })
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

// deleting chat history
app.delete("/api/chat/history", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("student_id", req.session.studentId);

    if (error) {
      return res.status(500).json({ error: "Could not delete chat history." });
    }

    res.json({ message: "Chat history cleared successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============= AI CHAT ROUTES =============

// Enhanced AI chat with curriculum context
app.post("/api/chat", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { message, subject } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get student's curriculum info
    const studentInfo = req.session.studentInfo || {};
    const contextPrompt = `You are Scholarly, an AI study buddy helping a ${studentInfo.board || 'Indian'} board Class ${studentInfo.class || ''} student. 
    ${studentInfo.stream ? `They are in the ${studentInfo.stream} stream.` : ''}
    ${subject ? `The question is about ${subject}.` : ''}
    Keep your answers relevant to their curriculum level and use terminology from Indian textbooks (especially NCERT when applicable).
    Be encouraging, helpful, and concise.`;

    // Initialize Gemini model
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

    // Store chat history
    await supabase.from("chat_history").insert([
      {
        student_id: req.session.studentId,
        message: message,
        response: text,
        subject: subject || null,
        created_at: new Date().toISOString()
      }
    ]);

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to get a response from AI" });
  }
});

// ============= REFERENCE DATA ROUTES =============

// Get boards list
app.get("/api/boards", (req, res) => {
  res.json(Object.keys(INDIAN_BOARDS).map(key => ({
    code: key,
    name: INDIAN_BOARDS[key]
  })));
});

// Get classes list
app.get("/api/classes", (req, res) => {
  res.json(CLASSES);
});

// Get subjects for a class/stream
app.get("/api/subjects/:class/:stream?", (req, res) => {
  const { class: studentClass, stream } = req.params;
  
  let subjects = [];
  if (["6", "7", "8"].includes(studentClass)) {
    subjects = SUBJECTS_BY_CLASS["6-8"];
  } else if (["9", "10"].includes(studentClass)) {
    subjects = SUBJECTS_BY_CLASS["9-10"];
  } else if (["11", "12"].includes(studentClass) && stream) {
    subjects = SUBJECTS_BY_CLASS[`11-12-${stream}`] || [];
  }
  
  res.json(subjects);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 Scholarly - Gamified Learning Platform`);
  console.log(`🎮 Ready to make studying fun!`);
});