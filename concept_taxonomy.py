CONCEPT_TAXONOMY = {

    "Python": [
        "Python Fundamentals",
        "Data Types",
        "Control Flow",
        "Functions",
        "Object-Oriented Programming",
        "Exception Handling",
        "File Handling",
        "Modules and Packages",
        "List and Dictionary Operations",
        "Python for Data Analysis"
    ],

    "SQL": [
        "SQL Fundamentals",
        "SELECT Queries",
        "Filtering",
        "Aggregation",
        "GROUP BY",
        "HAVING",
        "JOINs",
        "Subqueries",
        "CTEs",
        "Window Functions",
        "Indexes",
        "Query Optimization"
    ],

    "Statistics": [
        "Descriptive Statistics",
        "Probability",
        "Probability Distributions",
        "Mean Median Mode",
        "Variance and Standard Deviation",
        "Correlation",
        "Regression",
        "Hypothesis Testing",
        "Confidence Intervals",
        "Statistical Significance"
    ],

    "Machine Learning": [
        "Machine Learning Fundamentals",
        "Supervised Learning",
        "Unsupervised Learning",
        "Classification",
        "Regression",
        "Clustering",
        "Feature Engineering",
        "Feature Selection",
        "Model Evaluation",
        "Cross Validation",
        "Overfitting",
        "Underfitting",
        "Regularization",
        "Hyperparameter Tuning",
        "Class Imbalance"
    ],

    "Deep Learning": [
        "Neural Networks",
        "Activation Functions",
        "Loss Functions",
        "Backpropagation",
        "Optimization",
        "CNN",
        "RNN",
        "LSTM",
        "Transfer Learning",
        "Dropout",
        "Batch Normalization"
    ],

    "NLP": [
        "Text Preprocessing",
        "Tokenization",
        "Stop Words",
        "Stemming",
        "Lemmatization",
        "TF-IDF",
        "Word Embeddings",
        "Transformers",
        "Attention",
        "BERT",
        "Text Classification"
    ],

    "Computer Vision": [
        "Image Processing",
        "Image Classification",
        "Object Detection",
        "CNN",
        "Image Augmentation",
        "OpenCV",
        "YOLO",
        "OCR",
        "Image Segmentation"
    ],

    "MLOps": [
        "Model Deployment",
        "Model Serving",
        "FastAPI",
        "Docker",
        "Model Versioning",
        "Data Versioning",
        "CI/CD",
        "Model Monitoring",
        "Drift Detection"
    ],

    "Data Structures": [
        "Arrays",
        "Strings",
        "Linked Lists",
        "Stacks",
        "Queues",
        "Hash Tables",
        "Trees",
        "Graphs",
        "Sorting",
        "Searching",
        "Dynamic Programming",
        "Time Complexity",
        "Space Complexity"
    ],

    "Generative AI": [
        "LLMs",
        "Prompt Engineering",
        "Embeddings",
        "Vector Databases",
        "RAG",
        "Chunking",
        "Semantic Search",
        "Context Windows",
        "Hallucination",
        "AI Evaluation",
        "Prompt Injection"
    ]
}


def get_concepts_for_topic(topic):
    """
    Return concepts belonging to a topic.
    """

    return CONCEPT_TAXONOMY.get(topic, [])


def get_all_topics():
    """
    Return all controlled topics.
    """

    return list(CONCEPT_TAXONOMY.keys())