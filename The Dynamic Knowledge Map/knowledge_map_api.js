// Add these routes to your existing hello.js (server file)
// Insert after your existing routes, before the server start

// ============= KNOWLEDGE MAP API ROUTES =============

// Get all subjects available for knowledge mapping
app.get("/api/knowledge/subjects", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get student info to filter by board and class
    const { data: student } = await supabase
      .from("students")
      .select("board, class, stream")
      .eq("student_id", req.session.studentId)
      .single();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get subjects for this student's board and class
    const { data: subjects, error } = await supabase
      .from("knowledge_subjects")
      .select("*")
      .eq("board", student.board)
      .eq("class_level", student.class);

    if (error) {
      console.error("Error fetching knowledge subjects:", error);
      return res.status(500).json({ error: "Failed to fetch subjects" });
    }

    res.json(subjects);
  } catch (err) {
    console.error("Knowledge subjects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get concepts and prerequisites for a subject
app.get("/api/knowledge/subject/:subjectId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { subjectId } = req.params;

    // Get concepts for this subject
    const { data: concepts, error: conceptsError } = await supabase
      .from("knowledge_concepts")
      .select("*")
      .eq("subject_id", subjectId)
      .order("position_x", { ascending: true });

    if (conceptsError) {
      console.error("Error fetching concepts:", conceptsError);
      return res.status(500).json({ error: "Failed to fetch concepts" });
    }

    // Get prerequisites for these concepts
    const conceptIds = concepts.map(c => c.concept_id);
    const { data: prerequisites, error: prereqError } = await supabase
      .from("knowledge_prerequisites")
      .select("*")
      .in("concept_id", conceptIds);

    if (prereqError) {
      console.error("Error fetching prerequisites:", prereqError);
      return res.status(500).json({ error: "Failed to fetch prerequisites" });
    }

    // Get student progress for these concepts
    const { data: progress, error: progressError } = await supabase
      .from("knowledge_progress")
      .select("*")
      .eq("student_id", req.session.studentId)
      .in("concept_id", conceptIds);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
    }

    // Initialize progress for concepts that don't have progress records
    const existingProgressIds = progress ? progress.map(p => p.concept_id) : [];
    const missingProgressConcepts = concepts.filter(c => !existingProgressIds.includes(c.concept_id));
    
    if (missingProgressConcepts.length > 0) {
      // Initialize with locked status
      const newProgressRecords = missingProgressConcepts.map(concept => ({
        student_id: req.session.studentId,
        concept_id: concept.concept_id,
        status: 'locked'
      }));

      const { data: insertedProgress } = await supabase
        .from("knowledge_progress")
        .insert(newProgressRecords)
        .select("*");

      // Add inserted records to progress array
      if (insertedProgress) {
        progress.push(...insertedProgress);
      }
    }

    // Unlock concepts with no prerequisites
    const conceptsWithoutPrereqs = concepts.filter(concept => 
      !prerequisites.some(p => p.concept_id === concept.concept_id)
    );

    if (conceptsWithoutPrereqs.length > 0) {
      const { error: unlockError } = await supabase
        .from("knowledge_progress")
        .update({ status: 'unlocked' })
        .eq("student_id", req.session.studentId)
        .in("concept_id", conceptsWithoutPrereqs.map(c => c.concept_id))
        .eq("status", "locked");

      if (unlockError) {
        console.error("Error unlocking initial concepts:", unlockError);
      }
    }

    // Fetch updated progress
    const { data: updatedProgress } = await supabase
      .from("knowledge_progress")
      .select("*")
      .eq("student_id", req.session.studentId)
      .in("concept_id", conceptIds);

    res.json({
      concepts,
      prerequisites,
      progress: updatedProgress || []
    });
  } catch (err) {
    console.error("Knowledge subject data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start learning a concept
app.post("/api/knowledge/start-learning/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;

    // Check if concept is unlocked
    const { data: progress } = await supabase
      .from("knowledge_progress")
      .select("status")
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId)
      .single();

    if (!progress || progress.status === 'locked') {
      return res.status(400).json({ error: "Concept is not available" });
    }

    // Update status to in_progress
    const { error } = await supabase
      .from("knowledge_progress")
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      })
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (error) {
      console.error("Error starting learning:", error);
      return res.status(500).json({ error: "Failed to start learning" });
    }

    res.json({ message: "Learning started successfully" });
  } catch (err) {
    console.error("Start learning error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get quiz for a concept
app.get("/api/knowledge/quiz/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;

    // Get quiz questions for this concept
    const { data: questions, error } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, question_text, options, difficulty")
      .eq("concept_id", conceptId)
      .order("difficulty", { ascending: true });

    if (error) {
      console.error("Error fetching quiz questions:", error);
      return res.status(500).json({ error: "Failed to fetch quiz" });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: "No quiz available for this concept" });
    }

    // Return questions without correct answers
    res.json({
      concept_id: conceptId,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        difficulty: q.difficulty
      }))
    });
  } catch (err) {
    console.error("Quiz fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit quiz answers
app.post("/api/knowledge/quiz/:conceptId/submit", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;
    const { answers, timeSpent } = req.body; // answers is array of {questionId, selectedAnswer}

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Get the correct answers
    const questionIds = answers.map(a => a.questionId);
    const { data: questions, error: questionsError } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, correct_answer, explanation")
      .in("id", questionIds);

    if (questionsError) {
      console.error("Error fetching correct answers:", questionsError);
      return res.status(500).json({ error: "Failed to grade quiz" });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedResults = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const isCorrect = question && answer.selectedAnswer === question.correct_answer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question ? question.correct_answer : null,
        isCorrect,
        explanation: question ? question.explanation : null
      };
    });

    const score = Math.round((correctAnswers / answers.length) * 100);
    const passed = score >= 70;

    // Record the quiz attempt
    const { error: attemptError } = await supabase
      .from("knowledge_quiz_attempts")
      .insert({
        student_id: req.session.studentId,
        concept_id: conceptId,
        score,
        total_questions: answers.length,
        correct_answers: correctAnswers,
        time_taken_seconds: timeSpent || 0,
        answers: JSON.stringify(answers)
      });

    if (attemptError) {
      console.error("Error recording quiz attempt:", attemptError);
    }

    // Update progress
    const newStatus = passed ? 'completed' : 'in_progress';
    const updateData = {
      status: newStatus,
      quiz_score: score,
      attempts: supabase.raw('attempts + 1'),
      last_accessed: new Date().toISOString()
    };

    if (passed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: progressError } = await supabase
      .from("knowledge_progress")
      .update(updateData)
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (progressError) {
      console.error("Error updating progress:", progressError);
      return res.status(500).json({ error: "Failed to update progress" });
    }

    // If concept was completed, check for unlocking dependent concepts
    if (passed) {
      await unlockDependentConcepts(req.session.studentId, conceptId);
    }

    res.json({
      score,
      passed,
      correctAnswers,
      totalQuestions: answers.length,
      results: detailedResults,
      message: passed ? "Congratulations! You've mastered this concept!" : "Keep practicing! You can retake the quiz when ready."
    });
  } catch (err) {
    console.error("Quiz submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to unlock dependent concepts
async function unlockDependentConcepts(studentId, completedConceptId) {
  try {
    // Find concepts that depend on the completed concept
    const { data: dependentConcepts, error: depError } = await supabase
      .from("knowledge_prerequisites")
      .select("concept_id")
      .eq("prerequisite_concept_id", completedConceptId);

    if (depError) {
      console.error("Error finding dependent concepts:", depError);
      return;
    }

    if (!dependentConcepts || dependentConcepts.length === 0) {
      return; // No dependent concepts
    }

    // For each dependent concept, check if all prerequisites are now met
    for (const dep of dependentConcepts) {
      const conceptId = dep.concept_id;
      
      // Get all prerequisites for this concept
      const { data: allPrereqs, error: prereqError } = await supabase
        .from("knowledge_prerequisites")
        .select("prerequisite_concept_id")
        .eq("concept_id", conceptId);

      if (prereqError) {
        console.error("Error getting prerequisites:", prereqError);
        continue;
      }

      // Check if all prerequisites are completed
      const prereqIds = allPrereqs.map(p => p.prerequisite_concept_id);
      const { data: prereqProgress, error: progError } = await supabase
        .from("knowledge_progress")
        .select("concept_id, status")
        .eq("student_id", studentId)
        .in("concept_id", prereqIds);

      if (progError) {
        console.error("Error checking prerequisite progress:", progError);
        continue;
      }

      // Check if all prerequisites are completed
      const allCompleted = prereqIds.every(prereqId => {
        const progress = prereqProgress.find(p => p.concept_id === prereqId);
        return progress && progress.status === 'completed';
      });

      if (allCompleted) {
        // Unlock this concept
        const { error: unlockError } = await supabase
          .from("knowledge_progress")
          .update({ 
            status: 'unlocked',
            last_accessed: new Date().toISOString()
          })
          .eq("student_id", studentId)
          .eq("concept_id", conceptId)
          .eq("status", "locked");

        if (unlockError) {
          console.error("Error unlocking concept:", unlockError);
        }
      }
    }
  } catch (err) {
    console.error("Error in unlockDependentConcepts:", err);
  }
}

// Get student progress summary
app.get("/api/knowledge/progress/summary", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: summary, error } = await supabase
      .from("student_progress_summary")
      .select("*")
      .eq("student_id", req.session.studentId);

    if (error) {
      console.error("Error fetching progress summary:", error);
      return res.status(500).json({ error: "Failed to fetch progress summary" });
    }

    res.json(summary || []);
  } catch (err) {
    console.error("Progress summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get recommended next concepts
app.get("/api/knowledge/recommendations", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get all unlocked concepts for the student
    const { data: unlockedConcepts, error } = await supabase
      .from("knowledge_progress")
      .select(`
        concept_id,
        knowledge_concepts!inner(
          concept_name,
          description,
          difficulty_level,
          estimated_time_minutes,
          knowledge_subjects!inner(subject_name)
        )
      `)
      .eq("student_id", req.session.studentId)
      .eq("status", "unlocked")
      .order("knowledge_concepts.difficulty_level", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return res.status(500).json({ error: "Failed to fetch recommendations" });
    }

    res.json(unlockedConcepts || []);
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update concept progress (for tracking time spent, etc.)
app.put("/api/knowledge/progress/:conceptId", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { conceptId } = req.params;
    const { timeSpent, status } = req.body;

    const updateData = {
      last_accessed: new Date().toISOString()
    };

    if (timeSpent) {
      updateData.time_spent_minutes = supabase.raw(`time_spent_minutes + ${parseInt(timeSpent)}`);
    }

    if (status && ['unlocked', 'in_progress', 'completed'].includes(status)) {
      updateData.status = status;
    }

    const { error } = await supabase
      .from("knowledge_progress")
      .update(updateData)
      .eq("student_id", req.session.studentId)
      .eq("concept_id", conceptId);

    if (error) {
      console.error("Error updating progress:", error);
      return res.status(500).json({ error: "Failed to update progress" });
    }

    res.json({ message: "Progress updated successfully" });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get learning analytics for a student
app.get("/api/knowledge/analytics", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get overall progress stats
    const { data: progressStats, error: progressError } = await supabase
      .from("student_progress_summary")
      .select("*")
      .eq("student_id", req.session.studentId);

    // Get recent quiz attempts
    const { data: recentQuizzes, error: quizError } = await supabase
      .from("knowledge_quiz_attempts")
      .select(`
        concept_id,
        score,
        attempt_date,
        knowledge_concepts!inner(concept_name, knowledge_subjects!inner(subject_name))
      `)
      .eq("student_id", req.session.studentId)
      .order("attempt_date", { ascending: false })
      .limit(10);

    // Get time spent by subject
    const { data: timeStats, error: timeError } = await supabase
      .from("knowledge_progress")
      .select(`
        time_spent_minutes,
        knowledge_concepts!inner(
          knowledge_subjects!inner(subject_name)
        )
      `)
      .eq("student_id", req.session.studentId)
      .gt("time_spent_minutes", 0);

    if (progressError || quizError || timeError) {
      console.error("Error fetching analytics:", { progressError, quizError, timeError });
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }

    // Process time stats by subject
    const timeBySubject = {};
    if (timeStats) {
      timeStats.forEach(stat => {
        const subjectName = stat.knowledge_concepts.knowledge_subjects.subject_name;
        timeBySubject[subjectName] = (timeBySubject[subjectName] || 0) + stat.time_spent_minutes;
      });
    }

    res.json({
      progressStats: progressStats || [],
      recentQuizzes: recentQuizzes || [],
      timeBySubject
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});