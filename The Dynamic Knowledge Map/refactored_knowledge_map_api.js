// Enhanced Knowledge Map API Routes - Production Ready
// Add these routes to your existing hello.js server file

// ============= MIDDLEWARE =============

// Authentication middleware to eliminate repetition
const requireAuth = (req, res, next) => {
  if (!req.session.studentId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Error handling middleware
const handleDatabaseError = (error, res, operation) => {
  console.error(`Database error in ${operation}:`, error);
  return res.status(500).json({ 
    error: "Database operation failed",
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// ============= KNOWLEDGE MAP API ROUTES =============

// Get subjects available for student's board and class
app.get("/api/knowledge/subjects", requireAuth, async (req, res) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("board, class, stream")
      .eq("student_id", req.session.studentId)
      .single();

    if (studentError) {
      return handleDatabaseError(studentError, res, "fetch student info");
    }

    const { data: subjects, error: subjectsError } = await supabase
      .from("knowledge_subjects")
      .select("id, subject_name, description")
      .eq("board", student.board)
      .eq("class_level", student.class)
      .order("subject_name");

    if (subjectsError) {
      return handleDatabaseError(subjectsError, res, "fetch subjects");
    }

    res.json(subjects || []);
  } catch (err) {
    return handleDatabaseError(err, res, "get subjects");
  }
});

// Get complete knowledge map for a subject
app.get("/api/knowledge/subject/:subjectId/map", requireAuth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.session.studentId;

    // Use a single query with joins to get all necessary data
    const { data: mapData, error: mapError } = await supabase
      .from("knowledge_concepts")
      .select(`
        *,
        prerequisites:knowledge_prerequisites!concept_id(*),
        student_progress:knowledge_progress!concept_id(
          status,
          quiz_score,
          attempts,
          time_spent_minutes,
          completed_at
        )
      `)
      .eq("subject_id", subjectId)
      .eq("student_progress.student_id", studentId)
      .order("position_x");

    if (mapError) {
      return handleDatabaseError(mapError, res, "fetch knowledge map");
    }

    // Initialize progress for concepts without existing records
    const conceptsWithoutProgress = mapData.filter(concept => 
      !concept.student_progress || concept.student_progress.length === 0
    );

    if (conceptsWithoutProgress.length > 0) {
      const initialProgressRecords = conceptsWithoutProgress.map(concept => ({
        student_id: studentId,
        concept_id: concept.concept_id,
        status: 'locked'
      }));

      const { data: newProgress } = await supabase
        .from("knowledge_progress")
        .insert(initialProgressRecords)
        .select("concept_id, status, quiz_score, attempts, time_spent_minutes, completed_at");

      // Merge new progress with existing data
      conceptsWithoutProgress.forEach(concept => {
        const progress = newProgress?.find(p => p.concept_id === concept.concept_id);
        concept.student_progress = progress ? [progress] : [];
      });
    }

    // Auto-unlock concepts with no prerequisites
    await unlockInitialConcepts(studentId, subjectId);

    res.json({
      concepts: mapData,
      message: "Knowledge map loaded successfully"
    });
  } catch (err) {
    return handleDatabaseError(err, res, "get knowledge map");
  }
});

// Helper function to unlock concepts with no prerequisites
async function unlockInitialConcepts(studentId, subjectId) {
  try {
    // Find concepts with no prerequisites that are currently locked
    const { data: conceptsToUnlock } = await supabase
      .from("knowledge_concepts")
      .select("concept_id")
      .eq("subject_id", subjectId)
      .not("concept_id", "in", 
        supabase
          .from("knowledge_prerequisites")
          .select("concept_id")
      );

    if (conceptsToUnlock && conceptsToUnlock.length > 0) {
      const conceptIds = conceptsToUnlock.map(c => c.concept_id);
      
      await supabase
        .from("knowledge_progress")
        .update({ status: 'unlocked' })
        .eq("student_id", studentId)
        .in("concept_id", conceptIds)
        .eq("status", "locked");
    }
  } catch (error) {
    console.error("Error unlocking initial concepts:", error);
  }
}

// Start learning a concept
app.post("/api/knowledge/concepts/:conceptId/start", requireAuth, async (req, res) => {
  try {
    const { conceptId } = req.params;
    const studentId = req.session.studentId;

    // Verify concept is available to learn
    const { data: progress, error: progressError } = await supabase
      .from("knowledge_progress")
      .select("status")
      .eq("student_id", studentId)
      .eq("concept_id", conceptId)
      .single();

    if (progressError || !progress) {
      return res.status(404).json({ error: "Concept not found" });
    }

    if (progress.status === 'locked') {
      return res.status(403).json({ error: "Prerequisites not completed" });
    }

    // Update to learning status
    const { error: updateError } = await supabase
      .from("knowledge_progress")
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      })
      .eq("student_id", studentId)
      .eq("concept_id", conceptId);

    if (updateError) {
      return handleDatabaseError(updateError, res, "start learning");
    }

    res.json({ 
      success: true,
      message: "Learning session started" 
    });
  } catch (err) {
    return handleDatabaseError(err, res, "start learning concept");
  }
});

// Get quiz questions for a concept
app.get("/api/knowledge/concepts/:conceptId/quiz", requireAuth, async (req, res) => {
  try {
    const { conceptId } = req.params;

    const { data: questions, error: questionsError } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, question_text, options, difficulty")
      .eq("concept_id", conceptId)
      .order("difficulty");

    if (questionsError) {
      return handleDatabaseError(questionsError, res, "fetch quiz questions");
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: "No quiz available for this concept" });
    }

    res.json({
      concept_id: conceptId,
      questions: questions,
      time_limit: 900 // 15 minutes
    });
  } catch (err) {
    return handleDatabaseError(err, res, "get quiz");
  }
});

// Submit quiz with transaction support
app.post("/api/knowledge/concepts/:conceptId/quiz/submit", requireAuth, async (req, res) => {
  try {
    const { conceptId } = req.params;
    const { answers, timeSpent = 0 } = req.body;
    const studentId = req.session.studentId;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Get correct answers and calculate score
    const questionIds = answers.map(a => a.questionId);
    const { data: questions, error: questionsError } = await supabase
      .from("knowledge_quiz_questions")
      .select("id, correct_answer, explanation")
      .in("id", questionIds);

    if (questionsError) {
      return handleDatabaseError(questionsError, res, "fetch correct answers");
    }

    // Calculate results
    let correctCount = 0;
    const detailedResults = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const isCorrect = question && answer.selectedAnswer === question.correct_answer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question?.correct_answer,
        isCorrect,
        explanation: question?.explanation
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= 80;

    // Database transaction for quiz submission
    const { data, error } = await supabase.rpc('submit_quiz_transaction', {
      p_student_id: studentId,
      p_concept_id: conceptId,
      p_score: score,
      p_total_questions: answers.length,
      p_correct_answers: correctCount,
      p_time_taken: timeSpent,
      p_answers: JSON.stringify(answers),
      p_passed: passed
    });

    if (error) {
      return handleDatabaseError(error, res, "submit quiz");
    }

    // If passed, unlock dependent concepts efficiently
    if (passed) {
      await unlockDependentConceptsOptimized(studentId, conceptId);
    }

    res.json({
      success: true,
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions: answers.length,
      results: detailedResults,
      message: passed ? 
        "Congratulations! You've mastered this concept!" : 
        "Keep practicing! You need 80% to master this concept."
    });
  } catch (err) {
    return handleDatabaseError(err, res, "submit quiz");
  }
});

// Optimized function to unlock dependent concepts
async function unlockDependentConceptsOptimized(studentId, completedConceptId) {
  try {
    // Single query to unlock all eligible concepts
    const { error } = await supabase.rpc('unlock_dependent_concepts', {
      p_student_id: studentId,
      p_completed_concept_id: completedConceptId
    });

    if (error) {
      console.error("Error unlocking dependent concepts:", error);
    }
  } catch (error) {
    console.error("Error in unlockDependentConceptsOptimized:", error);
  }
}

// Get student's learning analytics
app.get("/api/knowledge/analytics", requireAuth, async (req, res) => {
  try {
    const studentId = req.session.studentId;

    // Get comprehensive analytics in a single query
    const { data: analytics, error: analyticsError } = await supabase
      .from("student_progress_summary")
      .select(`
        *,
        recent_attempts:knowledge_quiz_attempts(
          concept_id,
          score,
          attempt_date,
          knowledge_concepts!inner(
            concept_name,
            knowledge_subjects!inner(subject_name)
          )
        )
      `)
      .eq("student_id", studentId)
      .eq("recent_attempts.student_id", studentId)
      .order("recent_attempts.attempt_date", { ascending: false })
      .limit(10, { foreignTable: "recent_attempts" });

    if (analyticsError) {
      return handleDatabaseError(analyticsError, res, "fetch analytics");
    }

    // Get study streak
    const studyStreak = await calculateStudyStreak(studentId);

    res.json({
      progressSummary: analytics || [],
      studyStreak,
      message: "Analytics loaded successfully"
    });
  } catch (err) {
    return handleDatabaseError(err, res, "get analytics");
  }
});

// Helper function to calculate study streak
async function calculateStudyStreak(studentId) {
  try {
    const { data: recentActivity } = await supabase
      .from("knowledge_quiz_attempts")
      .select("attempt_date")
      .eq("student_id", studentId)
      .order("attempt_date", { ascending: false })
      .limit(30);

    if (!recentActivity || recentActivity.length === 0) {
      return 0;
    }

    // Calculate consecutive days
    let streak = 0;
    const today = new Date();
    const dates = recentActivity.map(a => new Date(a.attempt_date).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (uniqueDates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Error calculating study streak:", error);
    return 0;
  }
}

// Get recommendations for next concepts to study
app.get("/api/knowledge/recommendations", requireAuth, async (req, res) => {
  try {
    const studentId = req.session.studentId;

    // Get available concepts sorted by difficulty and relevance
    const { data: recommendations, error: recError } = await supabase
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
      .eq("student_id", studentId)
      .eq("status", "unlocked")
      .order("knowledge_concepts.difficulty_level")
      .limit(5);

    if (recError) {
      return handleDatabaseError(recError, res, "fetch recommendations");
    }

    res.json({
      recommendations: recommendations || [],
      message: "Recommendations loaded successfully"
    });
  } catch (err) {
    return handleDatabaseError(err, res, "get recommendations");
  }
});

// Update concept progress (for time tracking)
app.put("/api/knowledge/concepts/:conceptId/progress", requireAuth, async (req, res) => {
  try {
    const { conceptId } = req.params;
    const { timeSpent } = req.body;
    const studentId = req.session.studentId;

    if (!timeSpent || timeSpent < 0) {
      return res.status(400).json({ error: "Invalid time spent value" });
    }

    const { error: updateError } = await supabase
      .from("knowledge_progress")
      .update({
        time_spent_minutes: supabase.raw(`time_spent_minutes + ${parseInt(timeSpent)}`),
        last_accessed: new Date().toISOString()
      })
      .eq("student_id", studentId)
      .eq("concept_id", conceptId);

    if (updateError) {
      return handleDatabaseError(updateError, res, "update progress");
    }

    res.json({ 
      success: true,
      message: "Progress updated successfully" 
    });
  } catch (err) {
    return handleDatabaseError(err, res, "update concept progress");
  }
});

// ============= DATABASE FUNCTIONS =============
// These functions should be created in your Supabase database

/*
-- Function to handle quiz submission as a transaction
CREATE OR REPLACE FUNCTION submit_quiz_transaction(
    p_student_id INTEGER,
    p_concept_id VARCHAR,
    p_score INTEGER,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_time_taken INTEGER,
    p_answers JSONB,
    p_passed BOOLEAN
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Record quiz attempt
    INSERT INTO knowledge_quiz_attempts (
        student_id, concept_id, score, total_questions, 
        correct_answers, time_taken_seconds, answers
    ) VALUES (
        p_student_id, p_concept_id, p_score, p_total_questions,
        p_correct_answers, p_time_taken, p_answers
    );

    -- Update progress
    UPDATE knowledge_progress 
    SET 
        status = CASE WHEN p_passed THEN 'completed' ELSE status END,
        quiz_score = p_score,
        attempts = attempts + 1,
        completed_at = CASE WHEN p_passed THEN CURRENT_TIMESTAMP ELSE completed_at END,
        last_accessed = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id AND concept_id = p_concept_id;

    result := jsonb_build_object(
        'success', true,
        'passed', p_passed,
        'score', p_score
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock dependent concepts efficiently
CREATE OR REPLACE FUNCTION unlock_dependent_concepts(
    p_student_id INTEGER,
    p_completed_concept_id VARCHAR
) RETURNS VOID AS $$
BEGIN
    -- Update concepts that can now be unlocked
    UPDATE knowledge_progress 
    SET 
        status = 'unlocked',
        last_accessed = CURRENT_TIMESTAMP
    WHERE 
        student_id = p_student_id 
        AND concept_id IN (
            -- Find concepts that depend on the completed concept
            SELECT DISTINCT kp.concept_id 
            FROM knowledge_prerequisites kp
            WHERE kp.prerequisite_concept_id = p_completed_concept_id
            AND NOT EXISTS (
                -- Ensure ALL prerequisites are completed
                SELECT 1 
                FROM knowledge_prerequisites kp2
                JOIN knowledge_progress prog ON kp2.prerequisite_concept_id = prog.concept_id
                WHERE kp2.concept_id = kp.concept_id 
                AND prog.student_id = p_student_id
                AND prog.status != 'completed'
            )
        )
        AND status = 'locked';
END;
$$ LANGUAGE plpgsql;
*/