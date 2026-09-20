"""Candidate Intelligence Engine for InterviAI."""

from typing import Dict, List


class CandidateIntelligenceEngine:
    def __init__(self, interview_profile: Dict, claim_summary=None, role_readiness: float = 0.0):
        self.interview = interview_profile or {}
        self.claims = claim_summary or {}
        self.role_readiness = max(0.0, min(100.0, float(role_readiness or 0.0)))

    @staticmethod
    def _score(value, default=0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    def get_technical_knowledge(self) -> float:
        return self._score(self.interview.get("overall_score")) * 10.0

    def get_applied_reasoning(self) -> float:
        difficulty = self.interview.get("difficulty_performance", {})
        values = [
            self._score(v) for k, v in difficulty.items()
            if str(k).lower() in {"medium", "hard"}
        ]
        return (sum(values) / len(values) * 10.0) if values else self.get_technical_knowledge()

    def get_project_understanding(self) -> float:
        topics = self.interview.get("topic_performance", {})
        project_scores = [
            self._score(score) for topic, score in topics.items()
            if str(topic).strip().lower() == "project defense"
        ]
        return (sum(project_scores) / len(project_scores) * 10.0) if project_scores else 0.0

    def get_communication(self) -> float:
        formats = self.interview.get("question_type_performance", {})
        descriptive = formats.get("Descriptive")
        return self._score(descriptive) * 10.0 if descriptive is not None else self.get_technical_knowledge()

    def get_resume_evidence_confidence(self) -> float:
        return self._score(self.claims.get("verification_confidence"), 0.0)

    def get_overall_readiness(self) -> float:
        technical = self.get_technical_knowledge()
        reasoning = self.get_applied_reasoning()
        communication = self.get_communication()
        project = self.get_project_understanding()
        evidence = self.get_resume_evidence_confidence()

        if project <= 0.0:
            value = (
                technical * 0.36
                + reasoning * 0.30
                + communication * 0.14
                + evidence * 0.10
                + self.role_readiness * 0.10
            )
        else:
            value = (
                technical * 0.30
                + reasoning * 0.25
                + project * 0.20
                + communication * 0.10
                + evidence * 0.10
                + self.role_readiness * 0.05
            )
        return round(max(0.0, min(100.0, value)), 1)

    @staticmethod
    def _level(score: float) -> str:
        if score >= 85:
            return "Excellent"
        if score >= 70:
            return "Strong"
        if score >= 55:
            return "Moderate"
        if score >= 40:
            return "Needs Improvement"
        return "High Risk"

    def get_component_scores(self) -> Dict[str, float]:
        return {
            "Technical Knowledge": round(self.get_technical_knowledge(), 1),
            "Applied Reasoning": round(self.get_applied_reasoning(), 1),
            "Project Understanding": round(self.get_project_understanding(), 1),
            "Technical Communication": round(self.get_communication(), 1),
            "Resume Evidence Confidence": round(self.get_resume_evidence_confidence(), 1),
            "Role Readiness": round(self.role_readiness, 1),
        }

    def get_risk_signals(self) -> List[str]:
        risks = []
        scores = self.get_component_scores()
        if scores["Applied Reasoning"] < 60:
            risks.append("Struggles with application-oriented technical reasoning.")
        if scores["Technical Communication"] < 60:
            risks.append("Technical explanations need more clarity or depth.")

        if self.claims:
            unverified = int(self.claims.get("unverified", 0) or 0)
            partial = int(self.claims.get("partially_supported", 0) or 0)
            if unverified:
                risks.append(f"{unverified} resume claim(s) were not supported by uploaded evidence.")
            if partial:
                risks.append(f"{partial} resume claim(s) were only partially supported.")

        if self.claims and 0 < scores["Project Understanding"] < 60:
            risks.append("Project-defense performance suggests limited project depth.")

        weakest = self.interview.get("weakest_concepts", [])
        if weakest:
            names = ", ".join(str(item[0]) for item in weakest[:3])
            risks.append(f"Priority knowledge gaps: {names}.")

        return (risks or ["No major risk signals detected in the current assessment."])[:6]

    def get_strengths(self) -> List[str]:
        strengths = []
        scores = self.get_component_scores()
        if scores["Technical Knowledge"] >= 75:
            strengths.append("Strong technical knowledge.")
        if scores["Applied Reasoning"] >= 75:
            strengths.append("Strong applied technical reasoning.")
        if scores["Project Understanding"] >= 75:
            strengths.append("Strong understanding of the defended project.")
        if scores["Technical Communication"] >= 75:
            strengths.append("Clear technical communication.")
        if scores["Resume Evidence Confidence"] >= 80:
            strengths.append("Most resume claims are supported by available evidence.")
        return (strengths or ["Assessment data is available for targeted improvement."])[:5]

    def get_recommended_focus(self) -> List[str]:
        topics = self.interview.get("topic_performance", {})
        ranked_topics = sorted(topics.items(), key=lambda item: self._score(item[1]))
        recommendations = [topic for topic, score in ranked_topics if self._score(score) < 7][:4]
        for concept, _score in self.interview.get("weakest_concepts", [])[:3]:
            if concept not in recommendations:
                recommendations.append(concept)
        return recommendations[:5]

    def get_report(self) -> Dict:
        overall = self.get_overall_readiness()
        return {
            "overall_readiness": overall,
            "performance_level": self._level(overall),
            "components": self.get_component_scores(),
            "strengths": self.get_strengths(),
            "risk_signals": self.get_risk_signals(),
            "recommended_focus": self.get_recommended_focus(),
        }
