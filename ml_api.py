"""
ml_api.py
Flask API that wraps the medical_quiz_ml.py model.
Exposes REST endpoints consumed by the MedLearn frontend.

Run: python ml_api.py
API runs on http://localhost:5001
"""

import sys, json, random
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Import the ML core from medical_quiz_ml.py ──────────────────────────────
sys.path.insert(0, ".")
from medical_quiz_ml import (
    QUESTION_BANK, TOPICS, LEVELS,
    train_model, predict_difficulty, shuffle_options, adapt_level
)

app = Flask(__name__)
CORS(app)

# ── Train once at startup ────────────────────────────────────────────────────
print("Training ML difficulty classifier...", flush=True)
MODEL, MODEL_META = train_model(verbose=False)
print(f"Model ready — {MODEL_META['selected_model']} | CV F1: {MODEL_META['cv_f1_macro']}", flush=True)


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINT: GET /api/ml/status
# Returns model info
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ml/status", methods=["GET"])
def status():
    return jsonify({
        "status": "online",
        "model": MODEL_META["selected_model"],
        "cv_f1_macro": MODEL_META["cv_f1_macro"],
        "topics": TOPICS,
        "levels": LEVELS,
        "question_count": MODEL_META["n_original_questions"]
    })


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINT: POST /api/ml/quiz/start
# Body: { level, topic (opt), n_questions }
# Returns: first question
# ────────────────────────────────────────────────────────────────────────────
sessions = {}  # in-memory: session_id -> state

@app.route("/api/ml/quiz/start", methods=["POST"])
def quiz_start():
    body     = request.json or {}
    level    = body.get("level", "beginner")
    topic    = body.get("topic", None)
    n        = int(body.get("n_questions", 7))
    adaptive = body.get("adaptive", True)

    pool = [q for q in QUESTION_BANK if (topic is None or q["topic"] == topic)]
    if not pool:
        return jsonify({"error": f"No questions for topic '{topic}'"}), 400

    session_id = str(random.randint(100000, 999999))
    sessions[session_id] = {
        "pool":          pool,
        "n":             n,
        "adaptive":      adaptive,
        "current_level": level,
        "start_level":   level,
        "topic":         topic,
        "used":          [],
        "history":       [],
        "recent":        [],
        "q_num":         0
    }

    q_data = _next_question(session_id)
    return jsonify({"session_id": session_id, "question": q_data})


def _next_question(sid):
    s      = sessions[sid]
    pool   = s["pool"]
    used   = s["used"]
    level  = s["current_level"]

    candidates = [q for q in pool if q["difficulty"] == level and q not in used]
    if not candidates:
        candidates = [q for q in pool if q not in used]
    if not candidates:
        return None

    raw_q = random.choice(candidates)
    s["used"].append(raw_q)
    s["q_num"] += 1

    q_display = shuffle_options(raw_q)
    ml_pred   = predict_difficulty(MODEL, raw_q)

    return {
        "q_num":         s["q_num"],
        "total":         s["n"],
        "topic":         raw_q["topic"],
        "question":      q_display["question"],
        "options":       q_display["options"],
        "difficulty":    level,
        "ml_predicted":  ml_pred["predicted_difficulty"],
        "ml_confidence": ml_pred["confidence"],
        "ml_proba":      ml_pred["probabilities"],
        "_correct_index": q_display["correct_index"],   # sent to client for instant feedback
        "_explanation":   raw_q["explanation"]
    }


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINT: POST /api/ml/quiz/answer
# Body: { session_id, answer_index }
# Returns: result for this Q + next question (or final summary)
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ml/quiz/answer", methods=["POST"])
def quiz_answer():
    body       = request.json or {}
    sid        = body.get("session_id")
    ans_idx    = int(body.get("answer_index", -1))

    if sid not in sessions:
        return jsonify({"error": "Invalid or expired session"}), 404

    s = sessions[sid]
    last_q = s["used"][-1]
    correct_idx = shuffle_options(last_q)["correct_index"]   # recalculate consistent shuffle

    # ── re-derive correct_index from the stored question ──────────────────
    opts    = last_q["options"].copy()
    correct = opts[0]
    random.seed(id(last_q))   # same seed = same shuffle
    random.shuffle(opts)
    correct_idx = opts.index(correct)
    is_correct  = (ans_idx == correct_idx)

    s["history"].append({
        "q_num":            s["q_num"],
        "topic":            last_q["topic"],
        "difficulty":       s["current_level"],
        "question":         last_q["question"],
        "correct_option":   correct,
        "user_answer_idx":  ans_idx,
        "user_answer":      opts[ans_idx] if 0 <= ans_idx < len(opts) else "—",
        "is_correct":       is_correct,
        "explanation":      last_q["explanation"]
    })

    s["recent"].append(is_correct)
    if len(s["recent"]) > 3:
        s["recent"].pop(0)

    # Adapt level
    if s["adaptive"] and s["q_num"] < s["n"]:
        s["current_level"] = adapt_level(s["current_level"], s["recent"])

    result = {
        "is_correct":   is_correct,
        "explanation":  last_q["explanation"],
        "correct_text": correct,
        "level_changed": s["current_level"]
    }

    # Next question or summary
    if s["q_num"] < s["n"]:
        next_q = _next_question(sid)
        result["next_question"] = next_q
    else:
        result["summary"] = _build_summary(sid)

    return jsonify(result)


def _build_summary(sid):
    s       = sessions[sid]
    history = s["history"]
    correct = sum(1 for h in history if h["is_correct"])
    total   = len(history)
    pct     = round(correct / total * 100, 1) if total else 0

    if pct == 100:   verdict = "Perfect!"
    elif pct >= 80:  verdict = "Excellent"
    elif pct >= 60:  verdict = "Good"
    elif pct >= 40:  verdict = "Needs improvement"
    else:            verdict = "Requires more study"

    per_topic = {}
    for h in history:
        t = h["topic"]
        per_topic.setdefault(t, {"correct": 0, "total": 0})
        per_topic[t]["total"] += 1
        if h["is_correct"]: per_topic[t]["correct"] += 1

    topic_scores = {
        t: round(v["correct"] / v["total"] * 100)
        for t, v in per_topic.items()
    }

    weaknesses = [t for t, sc in topic_scores.items() if sc < 50]
    strengths  = [t for t, sc in topic_scores.items() if sc >= 75]

    return {
        "score":        f"{correct}/{total}",
        "percentage":   pct,
        "verdict":      verdict,
        "topic_scores": topic_scores,
        "weaknesses":   weaknesses,
        "strengths":    strengths,
        "history":      history,
        "model_info":   {
            "name":    MODEL_META["selected_model"],
            "cv_f1":   MODEL_META["cv_f1_macro"]
        }
    }


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINT: POST /api/ml/assess
# Body: { answers: [{topic, question, is_correct, difficulty}] }
# Returns: per-topic proficiency scores + roadmap statuses
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ml/assess", methods=["POST"])
def assess():
    body    = request.json or {}
    answers = body.get("answers", [])

    topic_scores = {}
    for a in answers:
        t = a.get("topic", "General")
        topic_scores.setdefault(t, {"correct": 0, "total": 0, "weighted": 0, "max": 0})
        w = {"beginner": 1, "intermediate": 2, "hard": 3}.get(a.get("difficulty", "beginner"), 1)
        topic_scores[t]["total"]   += 1
        topic_scores[t]["max"]     += w
        if a.get("is_correct"):
            topic_scores[t]["correct"]  += 1
            topic_scores[t]["weighted"] += w

    proficiency = {}
    roadmap     = []
    for t, v in topic_scores.items():
        pct = round(v["weighted"] / v["max"] * 100) if v["max"] else 0
        proficiency[t] = pct
        status = "skip" if pct >= 75 else ("light" if pct >= 40 else "deep")
        roadmap.append({"topic": t, "score": pct, "status": status})

    return jsonify({"proficiency": proficiency, "roadmap": roadmap})


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINT: GET /api/ml/questions
# ?topic=Anatomy&level=beginner&n=5
# Returns n random questions (for the Learning tab lesson quizzes)
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ml/questions", methods=["GET"])
def get_questions():
    topic = request.args.get("topic", None)
    level = request.args.get("level", None)
    n     = int(request.args.get("n", 5))

    pool = QUESTION_BANK
    if topic: pool = [q for q in pool if q["topic"] == topic]
    if level: pool = [q for q in pool if q["difficulty"] == level]

    chosen = random.sample(pool, min(n, len(pool)))
    out = []
    for raw in chosen:
        q_disp = shuffle_options(raw)
        ml     = predict_difficulty(MODEL, raw)
        out.append({
            "topic":         raw["topic"],
            "difficulty":    raw["difficulty"],
            "question":      q_disp["question"],
            "options":       q_disp["options"],
            "correct_index": q_disp["correct_index"],
            "explanation":   raw["explanation"],
            "ml_predicted":  ml["predicted_difficulty"],
            "ml_confidence": ml["confidence"]
        })
    return jsonify({"questions": out})


# ────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("ML API starting on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
