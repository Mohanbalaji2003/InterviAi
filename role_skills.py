ROLE_SKILLS = {

    "Data Scientist": [
        "Python",
        "SQL",
        "Machine Learning",
        "Deep Learning",
        "Pandas",
        "NumPy",
        "Statistics",
        "Power BI"
    ],

    "Data Analyst": [
        "Python",
        "SQL",
        "Excel",
        "Power BI",
        "Pandas",
        "NumPy",
        "Statistics"
    ],

    "Machine Learning Engineer": [
        "Python",
        "SQL",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "Docker",
        "FastAPI",
        "Git"
    ],

    "AI Engineer": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "NLP",
        "Computer Vision",
        "Docker",
        "FastAPI"
    ],

    "Software Engineer": [
        "Python",
        "SQL",
        "Git",
        "Django",
        "FastAPI",
        "Docker"
    ]
}


def get_required_skills(role):

    return ROLE_SKILLS.get(role, [])