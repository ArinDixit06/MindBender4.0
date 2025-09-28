// supabase.js

// Import Supabase client (UMD build)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase project details
const SUPABASE_URL = "https://ahakbuublvrvlcxghwrx.supabase.co";
const SUPABASE_ANON_KEY = "postgresql://postgres:Yookbye@1@db.ahakbuublvrvlcxghwrx.supabase.co:5432/postgres"; // <-- Replace with your real anon key

// Create client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Random student_id generator
function generateStudentId() {
  return Math.floor(Math.random() * 1000000);
}

// Handle signup
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const parentEmail = document.getElementById("signup-parent-email").value;

  const student_id = generateStudentId();

  const { error } = await supabase.from("users").insert([
    { student_id, email, parent_email: parentEmail, password }
  ]);

  if (error) {
    alert("Signup failed: " + error.message);
  } else {
    alert("Signup successful! Please login.");
    document.getElementById("flip").checked = false;
  }
});

// Handle login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("Invalid email or password");
  } else {
    localStorage.setItem("loggedInUser", JSON.stringify(data));
    window.location.href = "index.html";
  }
});
