import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const geminiApiKey = "AIzaSyAWZI5sD7YqqTqMgh4KsKvktrPTOQe4hHM"; // Hardcoded as per user request
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiProModel = genAI.getGenerativeModel({ model: "gemini-pro" });
const geminiFlashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------- Middleware ----------
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://studyquest-cwbv.onrender.com',
        'https://mindbender4-0.onrender.com',
        'https://scholarli.netlify.app',
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      secure: false, // Explicitly set to false for local development
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'Lax', // Explicitly set to Lax for local development
    },
  })
);

app.get("/favicon.ico", (req, res) => res.status(204).send());

// Explicit routes for admin dashboard pages
app.get("/manage_users.html", requireAdmin, (req, res) => {
  res.sendFile("manage_users.html", { root: "." });
});
app.get("/manage_schools.html", requireAdmin, (req, res) => {
  res.sendFile("manage_schools.html", { root: "." });
});
app.get("/manage_curriculum.html", requireLogin, requireTeacher, (req, res) => {
  res.sendFile("manage_curriculum.html", { root: "." });
});
app.get("/system_settings.html", requireAdmin, (req, res) => {
  res.sendFile("system_settings.html", { root: "." });
});

app.use(express.static(".", {
  etag: false,
  lastModified: false,
  setHeaders: (res, path, stat) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
}));

// ---------- Middleware Functions ----------
function requireLogin(req, res, next) {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireTeacher(req, res, next) {
  if (req.session.role !== 'teacher' && req.session.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || req.session.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admin access required." });
  }
  next();
}

function attachSchoolContext(req, res, next) {
  req.school_id = req.session.school_id;
  next();
}

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


// ---------- SCHOOL MANAGEMENT ROUTES ----------
app.post("/api/schools/register", requireAdmin, async (req, res) => {
  const { school_name, domain_name, admin_email, description, logo_url, subscription_tier } = req.body;
  try {
    const { data: existingSchool, error: existingSchoolError } = await supabase
      .from("schools")
      .select("school_id")
      .eq("domain_name", domain_name)
      .single();

    if (existingSchool) {
      return res.status(409).json({ error: "School with this domain already exists." });
    }
    if (existingSchoolError && existingSchoolError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw existingSchoolError;
    }

    const { data: school, error } = await supabase
      .from("schools")
      .insert([{ school_name, domain_name, admin_email, description, logo_url, subscription_tier }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "School registered successfully", school });
  } catch (err) {
    console.error("School registration error:", err);
    res.status(500).json({ error: err.message || "Failed to register school." });
  }
});

app.get("/api/schools/:domain", async (req, res) => {
  const { domain } = req.params;
  try {
    const { data: school, error } = await supabase
      .from("schools")
      .select("school_id, school_name, domain_name, logo_url, description")
      .eq("domain_name", domain)
      .single();

    if (error || !school) {
      return res.status(404).json({ error: "School not found." });
    }
    res.json({ school });
  } catch (err) {
    console.error("Fetch school by domain error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch school info." });
  }
});

// ---------- AUTH ROUTES ----------
app.post("/register", async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const domain = email.split('@')[1];
    if (!domain) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    let schoolId = null;
    let schoolRegistered = false;

    if (role !== 'admin') { // Only check for school registration if not an admin
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("school_id")
        .eq("domain_name", domain)
        .single();

      if (schoolError || !schoolData) {
        return res.status(400).json({ error: "School not registered for this email domain." });
      }
      schoolId = schoolData.school_id;
      schoolRegistered = true;
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          hashed_password: hashedPassword,
          role,
          school_id: schoolId, // Use the determined schoolId
        },
      ])
      .select("user_id, name, email, role, school_id, xp, level")
      .single();

    if (userError) throw userError;

    req.session.user_id = user.user_id;
    req.session.school_id = user.school_id;
    req.session.role = user.role;

    // Special redirection for admins who just registered and need to create a school
    if (role === 'admin' && !schoolRegistered) {
      return res.status(201).json({ message: "Admin registration successful. Please register your school.", user, redirect: '/admin_register_school.html' });
    }

    res.status(201).json({ message: "Registration successful", user });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Failed to register user." });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, name, email, hashed_password, role, school_id, xp, level")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    let school = null;
    if (user.school_id) {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("school_id, school_name, domain_name, logo_url")
        .eq("school_id", user.school_id)
        .single();

      if (schoolError || !schoolData) {
        console.error("School not found for user:", user.school_id);
        // For admins, this might be expected if they haven't registered a school yet
        if (user.role !== 'admin') {
          return res.status(500).json({ error: "Associated school not found." });
        }
      }
      school = schoolData;
    } else if (user.role !== 'admin') {
        // Non-admin users must have an associated school
        return res.status(500).json({ error: "Associated school not found." });
    }


    req.session.user_id = user.user_id;
    req.session.school_id = user.school_id;
    req.session.role = user.role;

    // Determine redirection based on role and school registration status
    let redirectUrl = '/index.html'; // Default for students and teachers with school
    if (user.role === 'admin') {
      redirectUrl = '/admin_dashboard.html'; // Admin always goes to admin dashboard on login
    } else if (user.role === 'teacher') {
      redirectUrl = '/teacher_dashboard.html'; // Teacher dashboard
    } else { // Student
      redirectUrl = '/student_dashboard.html'; // Student dashboard
    }


    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
      },
      school: school ? {
        school_id: school.school_id,
        school_name: school.school_name,
        domain_name: school.domain_name,
        logo_url: school.logo_url,
      } : null,
      redirect: redirectUrl,
    });
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

app.get("/api/me", requireLogin, attachSchoolContext, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, name, email, role, xp, level, school_id")
      .eq("user_id", req.session.user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    let school = null;
    if (user.school_id) {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("school_id, school_name, domain_name, logo_url")
        .eq("school_id", user.school_id)
        .single();

      if (schoolError && schoolError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching school info for user:", user.school_id, schoolError);
        return res.status(500).json({ message: "Error fetching school info" });
      }
      school = schoolData;
    }

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
      },
        school: school ? {
        school_id: school.school_id,
        school_name: school.school_name,
        domain_name: school.domain_name,
        logo_url: school.logo_url,
      } : null,
    });
  } catch (err) {
    console.error("Error in /api/me:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------- ADMIN DATA ROUTES ----------
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("user_id, name, email, role, xp, level, school_id, created_at");

    if (error) {
      console.error("Supabase error fetching all users:", error); // More specific logging
      throw error;
    }
    res.json({ users });
  } catch (err) {
    console.error("Fetch all users error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users." });
  }
});

app.get("/api/admin/schools", requireAdmin, async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from("schools")
      .select("school_id, school_name, domain_name, admin_email, description, logo_url, subscription_tier, created_at");

    if (error) {
      console.error("Supabase error fetching all schools:", error); // More specific logging
      throw error;
    }
    res.json({ schools });
  } catch (err) {
    console.error("Fetch all schools error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch schools." });
  }
});

app.get("/api/admin/curriculum", requireAdmin, async (req, res) => {
  try {
    const { data: curriculums, error } = await supabase
      .from("curriculums")
      .select(`
        curriculum_id,
        subject_name,
        description,
        created_at,
        schools(school_name)
      `);

    if (error) throw error;

    const formattedCurriculums = curriculums.map(curriculum => ({
      ...curriculum,
      school_name: curriculum.schools ? curriculum.schools.school_name : null,
      schools: undefined,
    }));

    res.json({ curriculums: formattedCurriculums });
  } catch (err) {
    console.error("Fetch all curriculums error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch curriculums." });
  }
});

// ---------- CHAT API ROUTES ----------

// Create a new chat session
app.post("/api/chat-sessions", requireLogin, async (req, res) => {
    const { title } = req.body;
    const user_id = req.session.user_id;

    try {
        const { data: session, error } = await supabase
            .from("chat_sessions")
            .insert([{ user_id, title }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Chat session created", session });
    } catch (err) {
        console.error("Error creating chat session:", err);
        res.status(500).json({ error: err.message || "Failed to create chat session." });
    }
});

// Get all chat sessions for the user
app.get("/api/chat-sessions", requireLogin, async (req, res) => {
    const user_id = req.session.user_id;

    try {
        const { data: sessions, error } = await supabase
            .from("chat_sessions")
            .select("session_id, title, created_at, updated_at")
            .eq("user_id", user_id)
            .order("updated_at", { ascending: false });

        if (error) throw error;
        res.json({ sessions });
    } catch (err) {
        console.error("Error fetching chat sessions:", err);
        res.status(500).json({ error: err.message || "Failed to load chat history." });
    }
});

// Update a chat session (e.g., rename)
app.patch("/api/chat-sessions/:id", requireLogin, async (req, res) => {
    const sessionId = req.params.id;
    const { title } = req.body;
    const user_id = req.session.user_id;

    try {
        const { data: session, error } = await supabase
            .from("chat_sessions")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("session_id", sessionId)
            .eq("user_id", user_id) // Ensure user owns the session
            .select()
            .single();

        if (error) throw error;
        if (!session) return res.status(404).json({ error: "Chat session not found or unauthorized." });

        res.json({ message: "Chat session updated", session });
    } catch (err) {
        console.error("Error updating chat session:", err);
        res.status(500).json({ error: err.message || "Failed to update chat session." });
    }
});

// Delete a chat session
app.delete("/api/chat-sessions/:id", requireLogin, async (req, res) => {
    const sessionId = req.params.id;
    const user_id = req.session.user_id;

    try {
        const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("session_id", sessionId)
            .eq("user_id", user_id); // Ensure user owns the session

        if (error) throw error;
        res.json({ message: "Chat session deleted successfully." });
    } catch (err) {
        console.error("Error deleting chat session:", err);
        res.status(500).json({ error: err.message || "Failed to delete chat session." });
    }
});

// Get messages for a specific chat session
app.get("/api/chat-messages/:session_id", requireLogin, async (req, res) => {
    const sessionId = req.params.session_id;
    const user_id = req.session.user_id;

    try {
        // Verify session belongs to user
        const { data: sessionCheck, error: sessionCheckError } = await supabase
            .from("chat_sessions")
            .select("session_id")
            .eq("session_id", sessionId)
            .eq("user_id", user_id)
            .single();

        if (sessionCheckError || !sessionCheck) {
            return res.status(403).json({ error: "Forbidden: Session not found or not accessible." });
        }

        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("message_id, content, message_type, created_at")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        res.json({ messages });
    } catch (err) {
        console.error("Error fetching chat messages:", err);
        res.status(500).json({ error: err.message || "Failed to load chat messages." });
    }
});


// ---------- AI ROUTES ----------
app.post("/chat", requireLogin, async (req, res) => { // Added requireLogin
    const { message, subject, session_id } = req.body;
    const user_id = req.session.user_id; // Get user_id from session

    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    if (!session_id) {
        return res.status(400).json({ error: "Session ID is required for chat messages." });
    }

    try {
        // Save user message to database
        await supabase.from("chat_messages").insert([
            { session_id, user_id, content: message, message_type: 'user' }
        ]);

        const result = await geminiFlashModel.generateContent(`Subject: ${subject || "General"}. Question: ${message}`);
        const response = await result.response;
        const reply = response.text();

        // Save bot reply to database
        await supabase.from("chat_messages").insert([
            { session_id, user_id, content: reply, message_type: 'bot' }
        ]);

        // Update session's updated_at timestamp
        await supabase.from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("session_id", session_id);

        res.json({ reply });
    } catch (err) {
        console.error("Gemini API or chat message saving error:", err);
        res.status(500).json({ error: "Failed to get response from Gemini API or save chat message." });
    }
});

app.post("/api/generate-plan", requireLogin, async (req, res) => {
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

// ---------- CURRICULUM & KNOWLEDGE MAP ROUTES ----------
app.post("/api/curriculum", requireLogin, requireTeacher, attachSchoolContext, async (req, res) => {
  const { subject_name, description } = req.body;
  const school_id = req.school_id;

  try {
    const { data: curriculum, error } = await supabase
      .from("curriculums")
      .insert([{ school_id, subject_name, description }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Curriculum subject created successfully", curriculum });
  } catch (err) {
    console.error("Create curriculum subject error:", err);
    res.status(500).json({ error: err.message || "Failed to create curriculum subject." });
  }
});

app.get("/api/curriculum", requireLogin, attachSchoolContext, async (req, res) => {
  const school_id = req.school_id;
  try {
    const { data: curriculums, error } = await supabase
      .from("curriculums")
      .select("*")
      .eq("school_id", school_id)
      .order("subject_name", { ascending: true });

    if (error) throw error;
    res.json({ curriculums });
  } catch (err) {
    console.error("Fetch curriculums error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch curriculums." });
  }
});

app.post("/api/knowledge-map", requireLogin, requireTeacher, attachSchoolContext, async (req, res) => {
  const { curriculum_id, topic_name, description, difficulty_level, prerequisite_topic_id } = req.body;
  const school_id = req.school_id;

  try {
    // Verify curriculum belongs to the school
    const { data: curriculumCheck, error: curriculumCheckError } = await supabase
      .from("curriculums")
      .select("curriculum_id")
      .eq("curriculum_id", curriculum_id)
      .eq("school_id", school_id)
      .single();

    if (curriculumCheckError || !curriculumCheck) {
      return res.status(403).json({ error: "Curriculum not found or not accessible by your school." });
    }

    const { data: topic, error } = await supabase
      .from("knowledge_maps")
      .insert([{
        school_id,
        curriculum_id,
        topic_name,
        description,
        difficulty_level,
        prerequisite_topic_id,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Knowledge map topic created successfully", topic });
  } catch (err) {
    console.error("Create knowledge map topic error:", err);
    res.status(500).json({ error: err.message || "Failed to create knowledge map topic." });
  }
});

app.get("/api/knowledge-map", requireLogin, attachSchoolContext, async (req, res) => {
  const school_id = req.school_id;
  try {
    const { data: knowledgeMapNodes, error } = await supabase
      .from("knowledge_maps")
      .select(`
        *,
        curriculums(subject_name)
      `)
      .eq("school_id", school_id)
      .order("topic_name", { ascending: true });

    if (error) throw error;

    const nodes = knowledgeMapNodes.map(node => ({
      ...node,
      subject_name: node.curriculums ? node.curriculums.subject_name : null,
      curriculums: undefined,
    }));

    res.json({ nodes });
  } catch (err) {
    console.error("Fetch knowledge map nodes error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch knowledge map nodes." });
  }
});

// ---------- QUEST ROUTES ----------
app.post("/api/quests", requireLogin, requireTeacher, attachSchoolContext, async (req, res) => {
  const { title, subject, description, due_date, xp_reward, importance, is_published = false } = req.body;
  const school_id = req.school_id;
  const created_by = req.session.user_id;

  try {
    const { data: quest, error } = await supabase
      .from("quests")
      .insert([{
        school_id,
        title,
        subject,
        description,
        due_date,
        xp_reward,
        importance,
        created_by,
        is_published,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Quest created successfully", quest });
  } catch (err) {
    console.error("Create quest error:", err);
    res.status(500).json({ error: err.message || "Failed to create quest." });
  }
});

app.get("/api/quests", requireLogin, attachSchoolContext, async (req, res) => {
  try {
    const { search } = req.query;
    const school_id = req.school_id;
    const user_id = req.session.user_id;

    let query = supabase
      .from('quests')
      .select(`
        quest_id,
        school_id,
        title,
        subject,
        description,
        due_date,
        xp_reward,
        importance,
        is_published,
        created_at,
        users!quests_created_by_fkey(name),
        student_progress(
          progress_id,
          user_id,
          completed_at
        )
      `)
      .eq('school_id', school_id)
      .eq('is_published', true);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data: questsData, error } = await query;

    if (error) throw error;

    const quests = questsData.map(quest => {
      const completedProgress = quest.student_progress.find(
        progress => progress.user_id === user_id
      );
      return {
        ...quest,
        created_by_name: quest.users ? quest.users.name : null,
        is_completed: !!completedProgress,
        completed_at: completedProgress ? completedProgress.completed_at : null,
        student_progress: undefined,
        users: undefined,
      };
    });

    res.json({ quests });
  } catch (err) {
    console.error("Fetch quests error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch quests." });
  }
});

app.patch("/api/quests/:id/complete", requireLogin, attachSchoolContext, async (req, res) => {
  const questId = req.params.id;
  const user_id = req.session.user_id;
  const school_id = req.school_id;

  try {
    const { data: questData, error: questError } = await supabase
      .from("quests")
      .select("xp_reward, school_id")
      .eq("quest_id", questId)
      .eq("school_id", school_id)
      .single();

    if (questError || !questData) {
      return res.status(404).json({ error: "Quest not found or not accessible." });
    }

    const xpAmount = questData.xp_reward;

    const { data: existingProgress, error: progressError } = await supabase
      .from("student_progress")
      .select("progress_id")
      .eq("user_id", user_id)
      .eq("quest_id", questId)
      .single();

    if (existingProgress) {
      return res.status(409).json({ message: "Quest already completed by this user." });
    }
    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError;
    }

    const { error: insertProgressError } = await supabase
      .from("student_progress")
      .insert([{ user_id, quest_id: questId, xp_earned: xpAmount }])
      .single();

    if (insertProgressError) throw insertProgressError;

    const { data: user, error: userFetchError } = await supabase
      .from("users")
      .select("xp, level")
      .eq("user_id", user_id)
      .single();

    if (userFetchError || !user) {
      throw new Error("User not found.");
    }

    let newXp = user.xp + xpAmount;
    let newLevel = user.level;

    const calculateXpForLevel = (level) => {
      return 100 * level;
    };

    let requiredXp = calculateXpForLevel(newLevel);

    while (newXp >= requiredXp) {
      newLevel++;
      newXp -= requiredXp;
      requiredXp = calculateXpForLevel(newLevel);
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ xp: newXp, level: newLevel })
      .eq("user_id", user_id);

    if (updateUserError) throw updateUserError;

    res.json({
      message: "Quest completed, XP and level updated!",
      newXp,
      newLevel,
    });
  } catch (err) {
    console.error("Complete quest error:", err);
    res.status(500).json({ error: err.message || "Failed to complete quest." });
  }
});

// ---------- RESOURCES ROUTES ----------
app.post("/api/resources", requireLogin, requireTeacher, attachSchoolContext, async (req, res) => {
  const { title, url, type } = req.body;
  const school_id = req.school_id;
  const uploaded_by = req.session.user_id;

  try {
    const { data: resource, error } = await supabase
      .from("resources")
      .insert([{ school_id, title, url, type, uploaded_by }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Resource uploaded successfully", resource });
  } catch (err) {
    console.error("Upload resource error:", err);
    res.status(500).json({ error: err.message || "Failed to upload resource." });
  }
});

app.get("/api/resources", requireLogin, attachSchoolContext, async (req, res) => {
  const school_id = req.school_id;
  const { q: searchQuery } = req.query;

  try {
    let query = supabase
      .from("resources")
      .select(`
        resource_id,
        school_id,
        title,
        url,
        type,
        created_at,
        users!resources_uploaded_by_fkey(name)
      `)
      .eq("school_id", school_id);

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const { data: resources, error } = await query;

    if (error) throw error;

    const formattedResources = resources.map(resource => ({
      ...resource,
      uploaded_by_name: resource.users ? resource.users.name : null,
      users: undefined,
    }));

    res.json({ resources: formattedResources });
  } catch (err) {
    console.error("Fetch resources error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch resources." });
  }
});

app.delete("/api/resources/:id", requireLogin, attachSchoolContext, async (req, res) => {
  const resourceId = req.params.id;
  const user_id = req.session.user_id;
  const school_id = req.school_id;
  const user_role = req.session.role;

  try {
    const { data: resource, error: fetchError } = await supabase
      .from("resources")
      .select("uploaded_by, school_id")
      .eq("resource_id", resourceId)
      .single();

    if (fetchError || !resource) {
      return res.status(404).json({ error: "Resource not found." });
    }

    if (resource.school_id !== school_id) {
      return res.status(403).json({ error: "Forbidden: Resource does not belong to your school." });
    }

    // Only owner or admin can delete
    if (resource.uploaded_by !== user_id && user_role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: You do not have permission to delete this resource." });
    }

    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("resource_id", resourceId);

    if (deleteError) throw deleteError;
    res.json({ message: "Resource deleted successfully." });
  } catch (err) {
    console.error("Delete resource error:", err);
    res.status(500).json({ error: err.message || "Failed to delete resource." });
  }
});

// ---------- ACHIEVEMENTS & PROGRESS ROUTES ----------
app.get("/api/achievements", requireLogin, async (req, res) => {
  const user_id = req.session.user_id;
  try {
    const { data: achievements, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user_id)
      .order("earned_at", { ascending: false });

    if (error) throw error;
    res.json({ achievements });
  } catch (err) {
    console.error("Fetch achievements error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch achievements." });
  }
});

app.get("/api/progress", requireLogin, async (req, res) => {
  const user_id = req.session.user_id;
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("xp, level")
      .eq("user_id", user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { data: completedQuests, error: questsError } = await supabase
      .from("student_progress")
      .select(`
        quest_id,
        xp_earned,
        completed_at,
        quests(title, subject, xp_reward)
      `)
      .eq("user_id", user_id)
      .order("completed_at", { ascending: false });

    if (questsError) throw questsError;

    const calculateXpForLevel = (level) => {
      return 100 * level;
    };

    let nextLevelXpThreshold = calculateXpForLevel(user.level + 1);

    res.json({
      user_xp: user.xp,
      user_level: user.level,
      next_level_xp_threshold: nextLevelXpThreshold,
      completed_quests: completedQuests.map(progress => ({
        progress_id: progress.progress_id,
        quest_id: progress.quest_id,
        quest_title: progress.quests ? progress.quests.title : 'Unknown Quest',
        quest_subject: progress.quests ? progress.quests.subject : 'N/A',
        xp_earned: progress.xp_earned,
        completed_at: progress.completed_at,
      })),
    });
  } catch (err) {
    console.error("Fetch progress error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch progress." });
  }
});


// ---------- AI ROUTES ----------
app.post("/chat", requireLogin, async (req, res) => { // Added requireLogin
    const { message, subject, session_id } = req.body;
    const user_id = req.session.user_id; // Get user_id from session

    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    if (!session_id) {
        return res.status(400).json({ error: "Session ID is required for chat messages." });
    }

    try {
        // Save user message to database
        await supabase.from("chat_messages").insert([
            { session_id, user_id, content: message, message_type: 'user' }
        ]);

        const result = await geminiFlashModel.generateContent(`Subject: ${subject || "General"}. Question: ${message}`);
        const response = await result.response;
        const reply = response.text();

        // Save bot reply to database
        await supabase.from("chat_messages").insert([
            { session_id, user_id, content: reply, message_type: 'bot' }
        ]);

        // Update session's updated_at timestamp
        await supabase.from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("session_id", session_id);

        res.json({ reply });
    } catch (err) {
        console.error("Gemini API or chat message saving error:", err);
        res.status(500).json({ error: "Failed to get response from Gemini API or save chat message." });
    }
});

app.post("/api/generate-plan", requireLogin, async (req, res) => {
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

app.get("/api/knowledge-map/chapters", requireLogin, attachSchoolContext, async (req, res) => { // Modified to use new KM tables
    const school_id = req.school_id;
    try {
        const { data: curriculums, error } = await supabase
            .from("curriculums")
            .select("subject_name")
            .eq("school_id", school_id)
            .order("subject_name", { ascending: true });

        if (error) throw error;
        res.json(curriculums.map(c => c.subject_name));
    } catch (err) {
        console.error("Fetch knowledge map chapters error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch knowledge map chapters." });
    }
});

app.get("/api/knowledge-map/topics", requireLogin, attachSchoolContext, async (req, res) => {
    const { subject_name, curriculum_id } = req.query;
    const school_id = req.school_id;

    if (!subject_name && !curriculum_id) {
        return res.status(400).json({ error: "Either subject_name or curriculum_id is required." });
    }

    try {
        let targetCurriculumId = curriculum_id;

        if (subject_name) {
            const { data: curriculum, error: curriculumError } = await supabase
                .from("curriculums")
                .select("curriculum_id")
                .eq("school_id", school_id)
                .eq("subject_name", subject_name)
                .single();

            if (curriculumError || !curriculum) {
                return res.status(404).json({ error: "Curriculum not found for this school and subject." });
            }
            targetCurriculumId = curriculum.curriculum_id;
        }

        if (!targetCurriculumId) {
            return res.status(400).json({ error: "A valid curriculum ID could not be determined." });
        }

        const { data: topics, error } = await supabase
            .from("knowledge_maps")
            .select("map_id, topic_name, description, difficulty_level, prerequisite_topic_id")
            .eq("curriculum_id", targetCurriculumId)
            .order("topic_name", { ascending: true });

        if (error) throw error;
        res.json(topics);
    } catch (err) {
        console.error("Fetch knowledge map topics error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch knowledge map topics." });
    }
});

app.post("/api/knowledge-map/teach-topic", requireLogin, async (req, res) => {
    const { topic, subject, description, difficulty_level } = req.body;
    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }
    if (!topic) {
        return res.status(400).json({ error: "Topic name is required." });
    }

    const prompt = `
    Act as a friendly and engaging tutor for students.
    Explain the following topic in a simple and interesting way.

    **Subject:** ${subject || 'General'}
    **Topic:** "${topic}"
    ${description ? `**Description:** ${description}` : ''}
    ${difficulty_level ? `**Difficulty Level:** ${difficulty_level}` : ''}

    Your explanation MUST include the following sections, formatted in Markdown:
    1.  **### 💡 The Big Idea (Analogy)**: Start with a simple, real-world analogy to make the concept relatable.
    2.  **### 🧠 How It Works**: Provide a clear, step-by-step explanation of the core concept. Use bullet points or numbered lists.
    3.  **### ✏️ Example Problem**: Give one clear, solved example problem. Show the steps clearly.
    4.  **### 🤔 Quick Check**: End with one simple multiple-choice or short-answer question to check for understanding (without giving the answer).
    `;

    try {
        const result = await geminiFlashModel.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        res.json({ content });
    } catch (err) {
        console.error("Teach Topic API error:", err);
        res.status(500).json({ error: "Failed to get explanation from AI.", details: err.message || "Unknown error" });
    }
});


// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});



