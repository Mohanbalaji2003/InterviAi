"""Fast local interview bank for InterviAI MVP.

The live interview should not wait on an LLM. Questions are pre-authored locally,
while the adaptive engine selects among them instantly. Gemini can be reintroduced
for RAG/project-defense and final intelligence generation later.
"""

from copy import deepcopy


def _mcq(topic, concept, difficulty, question, options, correct_answer, explanation, keywords=None):
    return {
        "type": "MCQ",
        "topic": topic,
        "concept": concept,
        "difficulty": difficulty,
        "question": question,
        "options": options,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "keywords": keywords or [concept],
    }


def _desc(topic, concept, difficulty, question, keywords=None):
    return {
        "type": "Descriptive",
        "topic": topic,
        "concept": concept,
        "difficulty": difficulty,
        "question": question,
        "keywords": keywords or [concept],
    }


COMMON = [
    _mcq("Python", "Data Types", "Easy", "Which Python object is immutable?",
         ["list", "dict", "set", "tuple"], "tuple", "Tuples are immutable sequences.", ["immutable", "tuple"]),
    _mcq("Python", "Functions", "Medium", "What does a Python function return when it reaches the end without a return statement?",
         ["0", "False", "None", "Empty string"], "None", "Python returns None when no explicit return value is provided.", ["return", "none"]),
    _desc("Python", "Object-Oriented Programming", "Medium", "Explain encapsulation and inheritance in Python with a practical example.", ["class", "object", "inheritance", "encapsulation"]),
    _desc("Python", "Exception Handling", "Easy", "Explain how try, except, else and finally work in Python.", ["try", "except", "finally"]),

    _mcq("SQL", "JOINs", "Easy", "Which JOIN returns only rows having matching values in both tables?",
         ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"], "INNER JOIN", "INNER JOIN returns rows with matches in both tables.", ["inner join", "join"]),
    _mcq("SQL", "GROUP BY", "Medium", "Which SQL clause is used to filter groups after aggregation?",
         ["WHERE", "HAVING", "ORDER BY", "DISTINCT"], "HAVING", "HAVING filters grouped results after aggregation.", ["having", "group by"]),
    _desc("SQL", "Query Optimization", "Hard", "A query joining two large tables has become slow. Explain how you would diagnose and optimize it.", ["execution plan", "index", "join", "query optimization"]),
    _desc("SQL", "Window Functions", "Hard", "Explain a window function and give a practical use case such as ranking or running totals.", ["over", "partition", "window", "rank"]),

    _mcq("Machine Learning", "Overfitting", "Easy", "Which technique is commonly used to reduce overfitting?",
         ["Increasing model complexity", "Regularization", "Removing validation data", "Training forever"], "Regularization", "Regularization constrains model complexity and can improve generalization.", ["regularization", "overfitting"]),
    _mcq("Machine Learning", "Class Imbalance", "Medium", "Which metric is generally more informative than accuracy for a highly imbalanced binary classification problem?",
         ["F1-score", "R-squared", "MSE", "MAPE"], "F1-score", "F1 balances precision and recall and is useful for imbalanced classification.", ["f1", "precision", "recall", "imbalance"]),
    _desc("Machine Learning", "Model Evaluation", "Medium", "How would you evaluate a classification model beyond accuracy? Explain which metrics you would choose and why.", ["precision", "recall", "f1", "confusion matrix"]),
    _desc("Machine Learning", "Feature Engineering", "Hard", "Describe how you would approach feature engineering for a tabular prediction problem and how you would avoid data leakage.", ["feature", "encoding", "scaling", "leakage"]),

    _mcq("Deep Learning", "CNN", "Easy", "Why are convolutional neural networks effective for image data?",
         ["They ignore spatial structure", "They exploit local spatial patterns", "They only work on text", "They require no training"], "They exploit local spatial patterns", "Convolutions capture local spatial features while sharing weights.", ["convolution", "spatial", "feature"]),
    _desc("Deep Learning", "Transfer Learning", "Medium", "Explain transfer learning and when you would use it for an image classification problem.", ["pretrained", "fine-tune", "transfer learning"]),

    _mcq("Generative AI", "RAG", "Medium", "What is the main purpose of Retrieval-Augmented Generation?",
         ["Reduce storage", "Ground model responses using retrieved context", "Replace embeddings", "Train without data"], "Ground model responses using retrieved context", "RAG retrieves relevant information and supplies it as context to the generator.", ["retrieval", "context", "rag"]),
    _desc("Generative AI", "Embeddings", "Medium", "What are embeddings and why are they useful for semantic search?", ["vector", "embedding", "semantic", "similarity"]),
]

ROLE_SPECIFIC = {
    "Data Scientist": [
        _mcq("Statistics", "Hypothesis Testing", "Medium", "What does a p-value help quantify in hypothesis testing?",
             ["Probability the null hypothesis is true", "Evidence against the null under the chosen model", "The model's accuracy", "The sample mean"],
             "Evidence against the null under the chosen model", "A p-value measures how surprising the observed result would be under the null hypothesis.", ["p-value", "null", "hypothesis"]),
        _desc("Statistics", "Correlation", "Easy", "Explain correlation and why correlation does not by itself establish causation.", ["correlation", "association", "causation"]),
        _desc("Machine Learning", "Cross Validation", "Medium", "Explain k-fold cross-validation and how it helps estimate generalization performance.", ["fold", "validation", "generalization"]),
        _desc("Machine Learning", "Hyperparameter Tuning", "Hard", "How would you systematically tune hyperparameters while avoiding leakage from the test set?", ["validation", "search", "test set"]),
    ],
    "Data Analyst": [
        _mcq("SQL", "Aggregation", "Easy", "Which aggregate function calculates the arithmetic mean?",
             ["COUNT", "SUM", "AVG", "MAX"], "AVG", "AVG calculates the arithmetic mean.", ["avg", "aggregate"]),
        _desc("SQL", "CTEs", "Medium", "What is a common table expression and when would you use one in analytics work?", ["with", "cte", "query"]),
        _desc("Data Analysis", "Python for Data Analysis", "Medium", "Describe how you would clean and validate a messy dataset before building a dashboard.", ["missing", "duplicate", "outlier", "validate"]),
    ],
    "Machine Learning Engineer": [
        _mcq("MLOps", "Model Deployment", "Medium", "Which component is commonly used to expose a trained model through an HTTP API?",
             ["FastAPI", "NumPy", "Matplotlib", "Jupyter"], "FastAPI", "FastAPI can expose model inference through web endpoints.", ["api", "fastapi", "deployment"]),
        _desc("MLOps", "Docker", "Medium", "Why would you containerize a machine learning inference service?", ["container", "environment", "reproducible"]),
        _desc("MLOps", "Model Monitoring", "Hard", "What would you monitor after deploying a machine learning model and why?", ["latency", "drift", "accuracy", "monitoring"]),
    ],
    "AI Engineer": [
        _desc("Generative AI", "Prompt Engineering", "Easy", "What makes a good prompt for a technical AI assistant? Explain with an example.", ["context", "instruction", "output format"]),
        _desc("Generative AI", "Hallucination", "Medium", "Why do LLM hallucinations happen and what engineering techniques can reduce them?", ["hallucination", "grounding", "retrieval", "verification"]),
        _desc("NLP", "Transformers", "Hard", "Explain at a high level how self-attention helps a transformer model understand relationships between tokens.", ["attention", "token", "query", "key", "value"]),
    ],
    "Software Engineer": [
        _mcq("Data Structures", "Time Complexity", "Easy", "What is the average-case lookup complexity of a hash table?",
             ["O(1)", "O(log n)", "O(n)", "O(n log n)"], "O(1)", "Average hash table lookup is O(1) under typical assumptions.", ["hash", "o(1)", "lookup"]),
        _desc("Data Structures", "Arrays", "Easy", "Compare arrays and linked lists in terms of access, insertion and memory.", ["array", "linked list", "access", "insertion"]),
        _desc("Software Engineering", "System Design", "Hard", "Design a simple scalable URL shortener and discuss key trade-offs.", ["api", "database", "cache", "scale"]),
    ],
}

# Add a small catch-all topic for data-analysis role questions without modifying
# the main taxonomy module used by the rest of the project.
ROLE_SPECIFIC.setdefault("Data Analyst", []).append(
    _desc("Power BI", "DAX", "Medium", "Explain the difference between a calculated column and a measure in Power BI.", ["measure", "calculated column", "filter context"])
)


def get_fast_question_bank(job_role: str):
    """Return a fresh local question bank tailored to the role."""
    bank = deepcopy(COMMON)
    bank.extend(ROLE_SPECIFIC.get(job_role, []))
    return bank
