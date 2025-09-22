import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors({
  origin: "*", // allow all for now (change later to your frontend URL)
  credentials: true
}));
app.use(bodyParser.json());
app.use(
  session({
    secret: "supersecret", // change in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // true if HTTPS
  })
);

// ---------- Supabase Init ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------- AUTH ROUTES ----------

// Signup (store plain password)
app.post("/signup", async (req, res) => {
  const { email, parent_email, password, class: studentClass } = req.body;

  try {
    // create student first
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert([{ name: email.split("@")[0], class: studentClass }])
      .select()
      .single();

    if (studentError) throw studentError;

    // create user with plain password
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{ student_id: student.student_id, email, parent_email, password }])
      .select()
      .single();

    if (userError) throw userError;

    res.json({ message: "Signup successful", user });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Login (compare plain password)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "User not found" });
    }

    // plain text comparison
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    req.session.userId = user.id;
    res.json({ message: "Login successful", data: user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// Check session
app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ userId: req.session.userId });
});

// ---------- STUDENTS + TESTS ----------

app.get("/students", async (req, res) => {
  const { data, error } = await supabase.from("students").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/tests", async (req, res) => {
  const { student_id, subject, score } = req.body;
  const { data, error } = await supabase
    .from("tests")
    .insert([{ student_id, subject, score }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
