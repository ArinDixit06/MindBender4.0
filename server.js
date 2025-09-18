import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

// Supabase credentials
const SUPABASE_URL = "https://ahakbuublvrvlcxghwrx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYWtidXVibHZydmxjeGdod3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDcxNTEsImV4cCI6MjA3Mzc4MzE1MX0.i2amNZMTmHLT-HQxplk7q-YiIcSX1pBDrFSCbH8EzgU"; 


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Helper: generate unique integer student_id
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
    exists = data.length > 0;
  }
  return student_id;
}

// ✅ Signup user
app.post("/signup", async (req, res) => {
  try {
    const { email, parent_email, password, class: studentClass } = req.body;
    if (!email || !parent_email || !password || !studentClass)
      return res.status(400).json({ error: "All fields are required" });

    const student_id = await generateStudentId();

    // 1️⃣ Insert into students table first
    const { data: studentData, error: studentError } = await supabase.from("students").insert([
      { student_id, class: studentClass, name: "", stream_if_valid: "" }
    ]);

    if (studentError) return res.status(400).json({ error: studentError.message });

    // 2️⃣ Then insert into users
    const { data, error } = await supabase.from("users").insert([
      { student_id, email, parent_email, password }
    ]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "User registered successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) return res.status(400).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add student
app.post("/student", async (req, res) => {
  const { student_id, name, class: studentClass, stream_if_valid } = req.body;

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

// ✅ Add test results
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

// ✅ Get student info with tests
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

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
