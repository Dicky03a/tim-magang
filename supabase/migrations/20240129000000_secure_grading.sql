-- Function to securely submit assignment and calculate score
-- This prevents client-side manipulation of scores and hides correct answers
CREATE OR REPLACE FUNCTION public.submit_assignment(
  p_assignment_id UUID,
  p_student_id UUID,
  p_answers JSONB -- Array of objects: { question_id: UUID, selected_option_id: UUID }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (admin)
AS $$
DECLARE
  v_total_questions INTEGER;
  v_correct_count INTEGER := 0;
  v_score NUMERIC;
  v_submission_id UUID;
  v_answer RECORD;
  v_question_correct_option UUID;
  v_result_details JSONB := '[]'::JSONB;
BEGIN
  -- 1. Check if assignment exists and get total questions
  SELECT COUNT(*) INTO v_total_questions
  FROM questions
  WHERE assignment_id = p_assignment_id;

  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'Assignment has no questions';
  END IF;

  -- 2. Create submission record first
  INSERT INTO public.submissions (assignment_id, student_id, score)
  VALUES (p_assignment_id, p_student_id, 0) -- Temporary score 0
  RETURNING id INTO v_submission_id;

  -- 3. Process each answer
  -- Iterate through the JSON input logic
  FOR v_answer IN SELECT * FROM jsonb_to_recordset(p_answers) AS x(question_id UUID, selected_option_id UUID)
  LOOP
    -- Get correct option for this question
    SELECT correct_option_id INTO v_question_correct_option
    FROM questions
    WHERE id = v_answer.question_id;

    -- Verify correctness
    IF v_question_correct_option IS NOT NULL AND v_question_correct_option = v_answer.selected_option_id THEN
      v_correct_count := v_correct_count + 1;
    END IF;

    -- Store student's answer
    INSERT INTO public.student_answers (submission_id, question_id, selected_option_id)
    VALUES (v_submission_id, v_answer.question_id, v_answer.selected_option_id);
    
  END LOOP;

  -- 4. Calculate final score
  -- Using rounding to nearest integer like in the frontend logic
  v_score := ROUND((v_correct_count::NUMERIC / v_total_questions::NUMERIC) * 100);

  -- 5. Update submission with final score
  UPDATE public.submissions
  SET score = v_score
  WHERE id = v_submission_id;

  -- 6. Return result
  RETURN jsonb_build_object(
    'submission_id', v_submission_id,
    'score', v_score,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions
  );
END;
$$;
