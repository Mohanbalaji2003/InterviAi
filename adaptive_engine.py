def get_next_difficulty(current_difficulty, score):
    """
    Decide the next question difficulty based on performance.
    """

    difficulties = ["Easy", "Medium", "Hard"]

    current_index = difficulties.index(current_difficulty)

    # Strong performance → increase difficulty
    if score >= 8:

        if current_index < len(difficulties) - 1:
            return difficulties[current_index + 1]

        return "Hard"

    # Average performance → maintain difficulty
    elif score >= 5:

        return current_difficulty

    # Weak performance → decrease difficulty
    else:

        if current_index > 0:
            return difficulties[current_index - 1]

        return "Easy"


def get_next_question_type(score, question_history):
    """
    Automatically decide MCQ or Descriptive.
    """

    # Weak performance → test fundamentals with MCQ
    if score < 5:
        return "MCQ"

    # Strong performance → test deeper understanding
    if score >= 8:
        return "Descriptive"

    # Average performance → alternate formats
    if not question_history:
        return "MCQ"

    last_type = question_history[-1]["type"]

    if last_type == "MCQ":
        return "Descriptive"

    return "MCQ"


def get_next_focus(missing_concepts):
    """
    Select a weak concept for the next question.
    """

    if missing_concepts:
        return missing_concepts[0]

    return None