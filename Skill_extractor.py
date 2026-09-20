# List of skills our system knows
SKILLS = [
    "Python",
    "Java",
    "C++",
    "SQL",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "Power BI",
    "Excel",
    "AWS",
    "Docker",
    "Git",
    "GitHub",
    "FastAPI",
    "Django",
    "OpenCV",
    "NLP",
    "Computer Vision"
]


def extract_skills(resume_text):

    found_skills = []

    # Convert resume text to lowercase
    resume_text = resume_text.lower()

    # Check every skill
    for skill in SKILLS:

        if skill.lower() in resume_text:
            found_skills.append(skill)

    return found_skills