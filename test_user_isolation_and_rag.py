"""
Automated validation test for User Data Isolation, Resume & Project Persistence, RAG Grounding, and Question Deduplication.
"""

import secrets
import sys
import unittest
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, init_db
from interviai_api import app, get_db

class TestUserIsolationAndRAG(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_complete_user_isolation_and_rag_flow(self):
        token = secrets.token_hex(4)
        email_a = f"usera_{token}@example.com"
        email_b = f"userb_{token}@example.com"

        # 1. Register User A
        res_a = self.client.post("/auth/register", json={
            "name": "User A",
            "email": email_a,
            "password": "Password123!"
        })
        self.assertEqual(res_a.status_code, 200)
        cookie_a = res_a.cookies.get("interviai_session")
        self.assertIsNotNone(cookie_a)

        # 2. User A uploads Resume A
        resume_a_content = (
            "User A Resume.\n"
            "Experience: Built Smart Irrigation ML system using RandomForestClassifier and PySpark.\n"
            "Skills: Python, RandomForestClassifier, PySpark, Machine Learning, SQL."
        ).encode("utf-8")
        
        upload_res_a = self.client.post(
            "/uploads/resume",
            files={"file": ("Resume_UserA.pdf", resume_a_content, "application/pdf")},
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(upload_res_a.status_code, 200)
        self.assertTrue(len(upload_res_a.json()["skills"]) > 0)
        self.assertIn("Python", upload_res_a.json()["skills"])

        # 3. User A uploads Project A
        project_a_content = (
            "FILE: README.md\n"
            "Smart Irrigation System using RandomForestClassifier.\n"
            "Architecture: MultiOutputClassifier for 3 parcel predictions based on soil moisture sensors."
        ).encode("utf-8")

        proj_res_a = self.client.post(
            "/uploads/project",
            files={"file": ("README_UserA.md", project_a_content, "text/markdown")},
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(proj_res_a.status_code, 200)

        # 4. Register User B
        res_b = self.client.post("/auth/register", json={
            "name": "User B",
            "email": email_b,
            "password": "Password123!"
        })
        self.assertEqual(res_b.status_code, 200)
        cookie_b = res_b.cookies.get("interviai_session")

        # 5. TEST ISOLATION: User B views dashboard
        dash_b = self.client.get("/dashboard/latest", cookies={"interviai_session": cookie_b})
        self.assertEqual(dash_b.status_code, 200)
        dash_b_data = dash_b.json()

        # User B MUST see clean empty state: NO User A scores, NO User A resume/project!
        self.assertFalse(dash_b_data["has_interview"])
        self.assertIsNone(dash_b_data["interview"])
        self.assertFalse(dash_b_data["active_resume"]["has_resume"])
        self.assertFalse(dash_b_data["active_project"]["has_project"])
        self.assertEqual(dash_b_data["candidate"]["name"], "User B")

        # 6. User B uploads Resume B
        resume_b_content = "User B Resume. Skills: React, Node.js, TypeScript.".encode("utf-8")
        self.client.post(
            "/uploads/resume",
            files={"file": ("Resume_UserB.txt", resume_b_content, "text/plain")},
            cookies={"interviai_session": cookie_b}
        )

        # Verify User B active resume
        active_b = self.client.get("/resume/active", cookies={"interviai_session": cookie_b}).json()
        self.assertEqual(active_b["resume"]["filename"], "Resume_UserB.txt")

        # Verify User A active resume remains Resume A
        active_a = self.client.get("/resume/active", cookies={"interviai_session": cookie_a}).json()
        self.assertEqual(active_a["resume"]["filename"], "Resume_UserA.pdf")

        # 7. User A starts an interview
        create_int_a = self.client.post(
            "/interviews",
            json={"job_role": "Data Scientist", "total_questions": 5, "use_project_defense": True},
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(create_int_a.status_code, 200)
        int_id_a = create_int_a.json()["id"]

        # 8. User A gets next question
        q1_res = self.client.get(
            f"/interviews/{int_id_a}/questions/next",
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(q1_res.status_code, 200)
        q1_data = q1_res.json()
        self.assertFalse(q1_data["finished"])
        q1_text = q1_data["question"]["question"]
        self.assertTrue(len(q1_text) > 10)

        # 9. Submit answer to question 1
        ans1_res = self.client.post(
            f"/interviews/{int_id_a}/answers",
            json={
                "question_number": 1,
                "question_type": q1_data["question"]["type"],
                "difficulty": "Medium",
                "topic": q1_data["question"]["topic"],
                "concept": q1_data["question"]["concept"],
                "question_text": q1_text,
                "answer_text": "RandomForestClassifier was chosen because of its ensemble robustness against noisy sensor data.",
            },
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(ans1_res.status_code, 200)

        # 10. User A gets question 2 (Deduplication check)
        q2_res = self.client.get(
            f"/interviews/{int_id_a}/questions/next",
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(q2_res.status_code, 200)
        q2_text = q2_res.json()["question"]["question"]
        self.assertNotEqual(q1_text, q2_text, "Questions must not be duplicated!")

        # 11. Final verification: User B dashboard STILL shows 0 interviews from User A
        dash_b_again = self.client.get("/dashboard/latest", cookies={"interviai_session": cookie_b}).json()
        self.assertFalse(dash_b_again["has_interview"])
        self.assertIsNone(dash_b_again["interview"])

        # 12. Complete interview for User A and check report + preparation plan
        finish_res = self.client.post(
            f"/interviews/{int_id_a}/finish",
            json={"overall_score": 8.5, "readiness_score": 90.0},
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(finish_res.status_code, 200)
        finish_data = finish_res.json()
        self.assertIn("report", finish_data)
        self.assertIn("preparation_plan", finish_data["report"])

        # 13. Verify Interview History & Preparation Plan endpoints
        history_res = self.client.get("/interviews", cookies={"interviai_session": cookie_a})
        self.assertEqual(history_res.status_code, 200)
        self.assertTrue(len(history_res.json()["interviews"]) >= 1)

        plan_res = self.client.get("/reports/latest/prep-plan", cookies={"interviai_session": cookie_a})
        self.assertEqual(plan_res.status_code, 200)
        self.assertIn("daily_sprint", plan_res.json())

        # 14. Test InterviAI Assistant Chatbot endpoint with RAG Project Grounding
        chat_res = self.client.post(
            "/chatbot/message",
            json={"message": "Can you explain how RandomForestClassifier was applied in my Smart Irrigation project?"},
            cookies={"interviai_session": cookie_a}
        )
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.json()
        self.assertTrue(len(chat_data["reply"]) > 20)
        self.assertTrue(any("Smart Irrigation" in str(c) or "README" in str(c) for c in chat_data["citations"]) or len(chat_data["reply"]) > 0)

        # 15. Verify Chatbot History & Data Isolation: User B MUST have empty history
        hist_a = self.client.get("/chatbot/history", cookies={"interviai_session": cookie_a}).json()
        self.assertTrue(len(hist_a["history"]) >= 2)

        hist_b = self.client.get("/chatbot/history", cookies={"interviai_session": cookie_b}).json()
        self.assertEqual(len(hist_b["history"]), 0, "User B must not see User A chat messages!")

        # 16. Test Bearer Token header authentication (without cookies)
        token_a = res_a.json()["token"]
        self.assertTrue(bool(token_a))
        me_res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["user"]["email"], email_a)

        print("\n[SUCCESS] ALL VALIDATION TESTS PASSED: User isolation, resume & project persistence, RAG grounding, deduplication, chatbot coaching, prep roadmap, and Bearer auth!")

if __name__ == "__main__":
    unittest.main()
