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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());

const sessionSecret = process.env.SESSION_SECRET || "a-temporary-secret-for-testing";
if (sessionSecret === "a-temporary-secret-for-testing") {
    console.warn("WARNING: Using a temporary, insecure session secret. Please set SESSION_SECRET in your environment variables for production.");
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

// ---------- Supabase Init ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Gemini API Key
const geminiApiKey = process.env.GEMINI_API_KEY;

// ---------- Serve Static Files ----------
app.use(express.static("public"));

// ---------- AUTH ROUTES ----------
app.post("/signup", async (req, res) => {
  const { email, parent_email, password, class: studentClass } = req.body;
  try {
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
          // WARNING: Storing plaintext password
          password: password,
        },
      ])
      .select()
      .single();
    if (userError) throw userError;

    res.status(201).json({ message: "Signup successful", user });
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

    // WARNING: Comparing plaintext password
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Save user ID in session
    req.session.userId = user.id;
    const { password: _, ...userData } = user; // Exclude password from response
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

// ---------- CHAT ROUTE USING GEMINI API ----------
app.post("/chat", async (req, res) => {
  const { message, subject } = req.body;
  if (!geminiApiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

  try {
    const response = await fetch(geminiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Subject: ${
                  subject || "General"
                }. Question: ${message}`,
              },
            ],
          },
        ],
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

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
