"""
quiz_engine.py
──────────────
Adaptive Medical Quiz Engine powered by the trained ML difficulty classifier.

Features:
  • Uses the ML model to verify / predict question difficulty
  • Adaptive difficulty: promotes/demotes based on running performance
  • Filters by topic if desired
  • Full score report at the end
  • Can run fully offline (no API required)

Usage:
  python quiz_engine.py                   # full interactive quiz
  python quiz_engine.py --topic Anatomy   # filter by topic
  python quiz_engine.py --level hard      # start at hard
  python quiz_engine.py --questions 10    # custom question count
  python quiz_engine.py --no-adaptive     # fixed difficulty
"""

import argparse
import random
import sys
import os
import joblib
import numpy as np
import time

from question_bank import QUESTION_BANK
from feature_extractor import extract_features

MODEL_DIR = "models"

LEVELS = ["beginner", "intermediate", "hard"]
LEVEL_COLORS = {
    "beginner":     "\033[92m",   # green
    "intermediate": "\033[93m",   # yellow
    "hard":         "\033[91m",   # red
}
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[96m"
GRAY = "\033[90m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"


def color(text, code): return f"{code}{text}{RESET}"
def bold(text): return f"{BOLD}{text}{RESET}"


def load_model():
    clf_path = os.path.join(MODEL_DIR, "difficulty_classifier.joblib")
    if not os.path.exists(clf_path):
        print(color("  Model not found. Running training first...\n", YELLOW))
        from train_model import train
        train()
    return joblib.load(clf_path)


def predict_difficulty(model, question_dict: dict) -> str:
    """Use the ML model to predict the difficulty of any question dict."""
    features = extract_features(question_dict).reshape(1, -1)
    label_idx = model.predict(features)[0]
    proba = model.predict_proba(features)[0]
    labels = ["beginner", "intermediate", "hard"]
    return labels[label_idx], {labels[i]: round(float(proba[i]), 3) for i in range(3)}


def get_questions(topic=None, level=None):
    pool = QUESTION_BANK
    if topic:
        pool = [q for q in pool if q["topic"].lower() == topic.lower()]
    if level:
        pool = [q for q in pool if q["difficulty"] == level]
    return pool


def shuffle_options(q: dict):
    """Return a copy of the question with shuffled options; correct index updated."""
    options = q["options"].copy()
    correct_answer = options[0]          # index 0 is always correct in our bank
    random.shuffle(options)
    correct_idx = options.index(correct_answer)
    return {**q, "options": options, "correct": correct_idx}


def print_header():
    print("\n" + "═" * 62)
    print(bold(color("  🩺  MEDICAL QUIZ — ADAPTIVE ML ENGINE", CYAN)))
    print("═" * 62)


def print_question(q: dict, q_num: int, total: int, level: str, ml_pred: str, ml_proba: dict):
    level_col = LEVEL_COLORS.get(level, "")
    pred_col = LEVEL_COLORS.get(ml_pred, "")

    print(f"\n  {GRAY}Question {q_num}/{total}{RESET}  "
          f"Difficulty: {color(level.upper(), level_col)}  "
          f"Topic: {color(q['topic'], CYAN)}")

    print(f"  {GRAY}ML prediction: {color(ml_pred, pred_col)} "
          f"(B:{ml_proba['beginner']:.2f}  I:{ml_proba['intermediate']:.2f}  H:{ml_proba['hard']:.2f}){RESET}")

    print("\n  " + "─" * 58)
    print(f"\n  {bold(q['question'])}\n")

    for i, opt in enumerate(q["options"]):
        label = chr(ord("A") + i)
        print(f"    {label}. {opt}")
    print()


def get_answer(n_options: int) -> int:
    valid = [chr(ord("A") + i) for i in range(n_options)]
    while True:
        ans = input(f"  Your answer ({'/'.join(valid)}): ").strip().upper()
        if ans in valid:
            return ord(ans) - ord("A")
        print(f"  {color('Please enter one of: ' + ', '.join(valid), YELLOW)}")


def print_feedback(correct: bool, correct_idx: int, options: list, explanation: str):
    correct_label = chr(ord("A") + correct_idx)
    if correct:
        print(f"\n  {color('✔  Correct!', GREEN)}")
    else:
        print(f"\n  {color('✘  Incorrect.', RED)} "
              f"Correct answer: {bold(correct_label + '. ' + options[correct_idx])}")
    print(f"\n  {GRAY}{explanation}{RESET}")
    print("\n  " + "─" * 58)


def adapt_level(current_level: str, recent: list) -> str:
    """
    Simple adaptive logic:
      - Last 2 correct → promote
      - Last 2 wrong   → demote
      - Otherwise stay
    """
    if len(recent) < 2:
        return current_level
    idx = LEVELS.index(current_level)
    if all(recent[-2:]):            # 2 in a row correct
        idx = min(idx + 1, len(LEVELS) - 1)
    elif not any(recent[-2:]):      # 2 in a row wrong
        idx = max(idx - 1, 0)
    return LEVELS[idx]


def print_final_report(history: list, total_time: float):
    print("\n" + "═" * 62)
    print(bold(color("  📊  QUIZ COMPLETE — RESULTS", CYAN)))
    print("═" * 62)

    correct = sum(1 for h in history if h["correct"])
    total = len(history)
    pct = correct / total * 100

    print(f"\n  Score: {bold(f'{correct}/{total}')}  ({pct:.0f}%)   Time: {total_time:.0f}s\n")

    # Per-level breakdown
    for lvl in LEVELS:
        lvl_h = [h for h in history if h["level"] == lvl]
        if not lvl_h:
            continue
        lvl_correct = sum(1 for h in lvl_h if h["correct"])
        col = LEVEL_COLORS[lvl]
        print(f"  {color(lvl.capitalize():<14, col)} {lvl_correct}/{len(lvl_h)}")

    # Per-topic breakdown
    topics_seen = sorted(set(h["topic"] for h in history))
    print()
    for topic in topics_seen:
        t_h = [h for h in history if h["topic"] == topic]
        t_correct = sum(1 for h in t_h if h["correct"])
        bar = "█" * t_correct + "░" * (len(t_h) - t_correct)
        print(f"  {topic:<20} {bar}  {t_correct}/{len(t_h)}")

    # Performance message
    print()
    if pct == 100:
        msg = color("  🏆  Perfect score! Outstanding medical knowledge!", GREEN)
    elif pct >= 80:
        msg = color("  🎯  Excellent! You have strong medical foundations.", GREEN)
    elif pct >= 60:
        msg = color("  📚  Good effort. Review the incorrect answers.", YELLOW)
    elif pct >= 40:
        msg = color("  🔄  Keep studying — revisit the topics you missed.", YELLOW)
    else:
        msg = color("  💪  More practice needed. Start with beginner level.", RED)
    print(msg)
    print("\n" + "═" * 62 + "\n")


def run_quiz(args):
    print_header()

    # Load model
    print(f"\n  {GRAY}Loading ML difficulty classifier...{RESET}")
    model = load_model()
    print(f"  {GREEN}Model ready.{RESET}\n")

    # Build question pool
    all_questions = get_questions(topic=args.topic)
    if not all_questions:
        print(color(f"  No questions found for topic '{args.topic}'. Exiting.", RED))
        sys.exit(1)

    # Show menu if no level given
    if args.level:
        current_level = args.level
    else:
        print("  Select starting difficulty:")
        for i, lvl in enumerate(LEVELS, 1):
            col = LEVEL_COLORS[lvl]
            descs = {"beginner": "Core concepts, definitions",
                     "intermediate": "Clinical reasoning, mechanisms",
                     "hard": "USMLE Step 2/3, complex pathophysiology"}
            print(f"    {i}. {color(lvl.capitalize(), col)} — {descs[lvl]}")
        while True:
            choice = input("\n  Enter 1/2/3: ").strip()
            if choice in ("1", "2", "3"):
                current_level = LEVELS[int(choice) - 1]
                break

    if args.topic:
        print(f"\n  Topic filter: {color(args.topic, CYAN)}")
    print(f"  Starting level: {color(current_level.upper(), LEVEL_COLORS[current_level])}")
    print(f"  Questions: {args.questions}  |  Adaptive: {'ON' if not args.no_adaptive else 'OFF'}")
    print(f"\n  Press Enter to begin...")
    input()

    history = []
    recent_results = []
    used_questions = set()
    start_time = time.time()
    n = min(args.questions, len(all_questions))

    for q_num in range(1, n + 1):
        # Pick a question at this level
        pool = [q for q in all_questions
                if q["difficulty"] == current_level
                and id(q) not in used_questions]

        if not pool:
            # Fall back to any unused question
            pool = [q for q in all_questions if id(q) not in used_questions]
        if not pool:
            print(color("  No more questions available.", YELLOW))
            break

        raw_q = random.choice(pool)
        used_questions.add(id(raw_q))

        # ML predict difficulty of this question
        ml_pred, ml_proba = predict_difficulty(model, raw_q)

        # Shuffle options
        q = shuffle_options(raw_q)

        print_question(q, q_num, n, current_level, ml_pred, ml_proba)

        t0 = time.time()
        chosen = get_answer(len(q["options"]))
        elapsed = time.time() - t0

        is_correct = (chosen == q["correct"])
        print_feedback(is_correct, q["correct"], q["options"], q["explanation"])

        history.append({
            "q_num": q_num,
            "topic": q["topic"],
            "level": current_level,
            "ml_predicted": ml_pred,
            "correct": is_correct,
            "time_s": round(elapsed, 1),
        })

        recent_results.append(is_correct)
        if len(recent_results) > 3:
            recent_results.pop(0)

        # Adaptive level change
        if not args.no_adaptive and q_num < n:
            new_level = adapt_level(current_level, recent_results)
            if new_level != current_level:
                direction = "▲ Promoting" if LEVELS.index(new_level) > LEVELS.index(current_level) else "▼ Demoting"
                col = GREEN if "▲" in direction else YELLOW
                print(f"  {color(direction + ' to ' + new_level.upper(), col)}\n")
                current_level = new_level

        if q_num < n:
            input(f"  {GRAY}Press Enter for next question...{RESET}")

    total_time = time.time() - start_time
    print_final_report(history, total_time)


def main():
    parser = argparse.ArgumentParser(
        description="Adaptive Medical Quiz powered by ML difficulty classifier"
    )
    parser.add_argument("--topic", type=str, default=None,
                        help="Filter questions by topic (e.g., Anatomy, Pharmacology)")
    parser.add_argument("--level", type=str, choices=LEVELS, default=None,
                        help="Starting difficulty level")
    parser.add_argument("--questions", type=int, default=8,
                        help="Number of questions per session (default: 8)")
    parser.add_argument("--no-adaptive", action="store_true",
                        help="Disable adaptive difficulty (stay at fixed level)")
    args = parser.parse_args()
    run_quiz(args)


if __name__ == "__main__":
    main()
