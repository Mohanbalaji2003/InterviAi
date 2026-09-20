class CandidateProfile:
    """
    Builds an intelligence profile of the candidate
    from interview performance.
    """

    def __init__(self):

        self.topic_scores = {}

        self.concept_scores = {}

        self.question_type_scores = {
            "MCQ": [],
            "Descriptive": []
        }

        self.difficulty_scores = {
            "Easy": [],
            "Medium": [],
            "Hard": []
        }

        self.all_scores = []

        self.missing_concepts = []


    # ==================================================
    # ADD RESULT
    # ==================================================

    def add_result(
        self,
        score,
        topic,
        concept,
        question_type,
        difficulty,
        missing_concepts=None
    ):

        score = float(score)


        if missing_concepts is None:

            missing_concepts = []


        # Overall
        self.all_scores.append(score)


        # Topic
        if topic not in self.topic_scores:

            self.topic_scores[topic] = []


        self.topic_scores[topic].append(score)


        # Concept
        if concept:

            if concept not in self.concept_scores:

                self.concept_scores[concept] = []


            self.concept_scores[concept].append(
                score
            )


        # Question type
        if question_type not in (
            self.question_type_scores
        ):

            self.question_type_scores[
                question_type
            ] = []


        self.question_type_scores[
            question_type
        ].append(score)


        # Difficulty
        if difficulty not in (
            self.difficulty_scores
        ):

            self.difficulty_scores[
                difficulty
            ] = []


        self.difficulty_scores[
            difficulty
        ].append(score)


        # Missing concepts
        for missing_concept in missing_concepts:

            if (
                missing_concept
                not in self.missing_concepts
            ):

                self.missing_concepts.append(
                    missing_concept
                )


    # ==================================================
    # AVERAGE
    # ==================================================

    @staticmethod
    def _average(scores):

        if not scores:

            return 0.0


        return (
            sum(scores)
            /
            len(scores)
        )


    # ==================================================
    # OVERALL
    # ==================================================

    def get_overall_score(self):

        return self._average(
            self.all_scores
        )


    # ==================================================
    # TOPIC PERFORMANCE
    # ==================================================

    def get_topic_performance(self):

        performance = {}


        for topic, scores in (
            self.topic_scores.items()
        ):

            performance[topic] = round(
                self._average(scores),
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

            performance[concept] = round(
                self._average(scores),
                2
            )


        return performance


    # ==================================================
    # QUESTION TYPE PERFORMANCE
    # ==================================================

    def get_question_type_performance(self):

        performance = {}


        for question_type, scores in (
            self.question_type_scores.items()
        ):

            if scores:

                performance[question_type] = round(
                    self._average(scores),
                    2
                )


        return performance


    # ==================================================
    # DIFFICULTY PERFORMANCE
    # ==================================================

    def get_difficulty_performance(self):

        performance = {}


        for difficulty, scores in (
            self.difficulty_scores.items()
        ):

            if scores:

                performance[difficulty] = round(
                    self._average(scores),
                    2
                )


        return performance


    # ==================================================
    # STRONGEST TOPICS
    # ==================================================

    def get_strongest_topics(self, limit=3):

        performance = (
            self.get_topic_performance()
        )


        sorted_topics = sorted(
            performance.items(),
            key=lambda item: item[1],
            reverse=True
        )


        return sorted_topics[:limit]


    # ==================================================
    # WEAKEST TOPICS
    # ==================================================

    def get_weakest_topics(self, limit=3):

        performance = (
            self.get_topic_performance()
        )


        sorted_topics = sorted(
            performance.items(),
            key=lambda item: item[1]
        )


        return sorted_topics[:limit]


    # ==================================================
    # STRONGEST CONCEPTS
    # ==================================================

    def get_strongest_concepts(self, limit=5):

        performance = (
            self.get_concept_performance()
        )


        sorted_concepts = sorted(
            performance.items(),
            key=lambda item: item[1],
            reverse=True
        )


        return sorted_concepts[:limit]


    # ==================================================
    # WEAKEST CONCEPTS
    # ==================================================

    def get_weakest_concepts(self, limit=5):

        performance = (
            self.get_concept_performance()
        )


        sorted_concepts = sorted(
            performance.items(),
            key=lambda item: item[1]
        )


        return sorted_concepts[:limit]


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
    # BEST QUESTION TYPE
    # ==================================================

    def get_best_question_type(self):

        performance = (
            self.get_question_type_performance()
        )


        if not performance:

            return None


        return max(
            performance,
            key=performance.get
        )


    # ==================================================
    # WEAKEST QUESTION TYPE
    # ==================================================

    def get_weak_question_type(self):

        performance = (
            self.get_question_type_performance()
        )


        if not performance:

            return None


        return min(
            performance,
            key=performance.get
        )


    # ==================================================
    # MISSING CONCEPTS
    # ==================================================

    def get_missing_concepts(self):

        return self.missing_concepts


    # ==================================================
    # COMPLETE PROFILE
    # ==================================================

    def get_profile(self):

        return {

            "overall_score": round(
                self.get_overall_score(),
                2
            ),

            "performance_level": (
                self.get_performance_level()
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
            ),

            "strongest_topics": (
                self.get_strongest_topics()
            ),

            "weakest_topics": (
                self.get_weakest_topics()
            ),

            "strongest_concepts": (
                self.get_strongest_concepts()
            ),

            "weakest_concepts": (
                self.get_weakest_concepts()
            ),

            "best_question_type": (
                self.get_best_question_type()
            ),

            "weak_question_type": (
                self.get_weak_question_type()
            ),

            "missing_concepts": (
                self.get_missing_concepts()
            )
        }