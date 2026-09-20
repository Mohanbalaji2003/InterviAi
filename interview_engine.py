class InterviewSession:
    """
    Manages a complete InterviAI interview session.
    """

    def __init__(self, total_questions=10):

        self.total_questions = total_questions

        # Completed question results
        self.question_history = []

        # Score history
        self.score_history = []

        # Topic -> scores
        self.topic_scores = {}

        # Concept -> scores
        self.concept_scores = {}

        # Question type counts
        self.question_type_counts = {
            "MCQ": 0,
            "Descriptive": 0
        }

        # Current question
        self.current_question = None
        self.current_question_type = None
        self.current_difficulty = None


    # ==================================================
    # SET CURRENT QUESTION
    # ==================================================

    def set_current_question(
        self,
        question_data,
        difficulty
    ):

        self.current_question = question_data

        self.current_question_type = (
            question_data["type"]
        )

        self.current_difficulty = difficulty


    # ==================================================
    # RECORD RESULT
    # ==================================================

    def record_result(
        self,
        score,
        topic,
        concept=None,
        missing_concepts=None
    ):

        if missing_concepts is None:
            missing_concepts = []


        result = {
            "question_number": (
                len(self.question_history) + 1
            ),

            "question": (
                self.current_question["question"]
            ),

            "type": (
                self.current_question_type
            ),

            "difficulty": (
                self.current_difficulty
            ),

            "score": float(score),

            "topic": topic,

            "concept": concept,

            "missing_concepts": (
                missing_concepts
            )
        }


        # Store result
        self.question_history.append(result)

        # Store score
        self.score_history.append(float(score))


        # Count question type
        if self.current_question_type not in (
            self.question_type_counts
        ):

            self.question_type_counts[
                self.current_question_type
            ] = 0


        self.question_type_counts[
            self.current_question_type
        ] += 1


        # Store topic score
        if topic not in self.topic_scores:

            self.topic_scores[topic] = []


        self.topic_scores[topic].append(
            float(score)
        )


        # Store concept score
        if concept:

            if concept not in self.concept_scores:

                self.concept_scores[concept] = []


            self.concept_scores[concept].append(
                float(score)
            )


    # ==================================================
    # QUESTION NUMBER
    # ==================================================

    def get_question_number(self):

        return (
            len(self.question_history) + 1
        )


    # ==================================================
    # FINISHED?
    # ==================================================

    def is_finished(self):

        return (
            len(self.question_history)
            >= self.total_questions
        )


    # ==================================================
    # OVERALL SCORE
    # ==================================================

    def get_overall_score(self):

        if not self.score_history:

            return 0.0


        return (
            sum(self.score_history)
            /
            len(self.score_history)
        )


    # ==================================================
    # TOPIC PERFORMANCE
    # ==================================================

    def get_topic_performance(self):

        performance = {}


        for topic, scores in (
            self.topic_scores.items()
        ):

            if scores:

                performance[topic] = round(
                    sum(scores)
                    /
                    len(scores),
                    2
                )


        return performance


    # ==================================================
    # CONCEPT PERFORMANCE
    # ==================================================

    def get_concept_performance(self):

        performance = {}


        for concept, scores in (
            self.concept_scores.items()
        ):

            if scores:

                performance[concept] = round(
                    sum(scores)
                    /
                    len(scores),
                    2
                )


        return performance


    # ==================================================
    # STRONGEST TOPIC
    # ==================================================

    def get_strongest_topic(self):

        performance = (
            self.get_topic_performance()
        )


        if not performance:

            return None


        return max(
            performance,
            key=performance.get
        )


    # ==================================================
    # WEAKEST TOPIC
    # ==================================================

    def get_weakest_topic(self):

        performance = (
            self.get_topic_performance()
        )


        if not performance:

            return None


        return min(
            performance,
            key=performance.get
        )


    # ==================================================
    # STRONGEST CONCEPT
    # ==================================================

    def get_strongest_concept(self):

        performance = (
            self.get_concept_performance()
        )


        if not performance:

            return None


        return max(
            performance,
            key=performance.get
        )


    # ==================================================
    # WEAKEST CONCEPT
    # ==================================================

    def get_weakest_concept(self):

        performance = (
            self.get_concept_performance()
        )


        if not performance:

            return None


        return min(
            performance,
            key=performance.get
        )


    # ==================================================
    # PERFORMANCE LEVEL
    # ==================================================

    def get_performance_level(self):

        score = self.get_overall_score()


        if score >= 8.5:

            return "Excellent"

        elif score >= 7:

            return "Strong"

        elif score >= 5:

            return "Moderate"

        elif score >= 3:

            return "Needs Improvement"

        else:

            return "Weak"


    # ==================================================
    # QUESTION TYPE PERFORMANCE
    # ==================================================

    def get_question_type_performance(self):

        performance = {}

        type_scores = {}


        for result in self.question_history:

            question_type = result["type"]


            if question_type not in type_scores:

                type_scores[
                    question_type
                ] = []


            type_scores[
                question_type
            ].append(
                result["score"]
            )


        for question_type, scores in (
            type_scores.items()
        ):

            performance[question_type] = round(
                sum(scores)
                /
                len(scores),
                2
            )


        return performance


    # ==================================================
    # DIFFICULTY PERFORMANCE
    # ==================================================

    def get_difficulty_performance(self):

        performance = {}

        difficulty_scores = {}


        for result in self.question_history:

            difficulty = result["difficulty"]


            if difficulty not in difficulty_scores:

                difficulty_scores[
                    difficulty
                ] = []


            difficulty_scores[
                difficulty
            ].append(
                result["score"]
            )


        for difficulty, scores in (
            difficulty_scores.items()
        ):

            performance[difficulty] = round(
                sum(scores)
                /
                len(scores),
                2
            )


        return performance


    # ==================================================
    # SUMMARY
    # ==================================================

    def get_summary(self):

        return {

            "total_questions": (
                len(self.question_history)
            ),

            "overall_score": (
                self.get_overall_score()
            ),

            "performance_level": (
                self.get_performance_level()
            ),

            "strongest_topic": (
                self.get_strongest_topic()
            ),

            "weakest_topic": (
                self.get_weakest_topic()
            ),

            "strongest_concept": (
                self.get_strongest_concept()
            ),

            "weakest_concept": (
                self.get_weakest_concept()
            ),

            "question_type_counts": (
                self.question_type_counts
            ),

            "topic_performance": (
                self.get_topic_performance()
            ),

            "concept_performance": (
                self.get_concept_performance()
            ),

            "question_type_performance": (
                self.get_question_type_performance()
            ),

            "difficulty_performance": (
                self.get_difficulty_performance()
            )
        }