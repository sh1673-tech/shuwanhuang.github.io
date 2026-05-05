let allQuestions = [];
let filteredQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;

let score = 0;
let xp = 0;
let correctCount = 0;
let answeredCount = 0;
let currentStreak = 0;
let badges = [];
let mistakes = [];

const startBtn = document.getElementById("startBtn");
const reviewBtn = document.getElementById("reviewBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const contentFilter = document.getElementById("contentFilter");
const difficultyFilter = document.getElementById("difficultyFilter");

const xpDisplay = document.getElementById("xpDisplay");
const accuracyDisplay = document.getElementById("accuracyDisplay");
const streakDisplay = document.getElementById("streakDisplay");
const badgeDisplay = document.getElementById("badgeDisplay");

const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const progressFill = document.getElementById("progressFill");

const questionNumber = document.getElementById("questionNumber");
const questionType = document.getElementById("questionType");
const questionDifficulty = document.getElementById("questionDifficulty");
const questionEmoji = document.getElementById("questionEmoji");
const contentAreaLabel = document.getElementById("contentAreaLabel");
const topicLabel = document.getElementById("topicLabel");
const questionText = document.getElementById("questionText");
const choicesContainer = document.getElementById("choicesContainer");

const feedbackBox = document.getElementById("feedbackBox");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackExplanation = document.getElementById("feedbackExplanation");
const whyWrongBox = document.getElementById("whyWrongBox");

const resultCard = document.getElementById("resultCard");
const finalScoreText = document.getElementById("finalScoreText");
const finalAccuracyText = document.getElementById("finalAccuracyText");
const finalMessage = document.getElementById("finalMessage");
const badgeUnlocked = document.getElementById("badgeUnlocked");

const reviewSection = document.getElementById("reviewSection");
const mistakesContainer = document.getElementById("mistakesContainer");

const confettiLayer = document.getElementById("confettiLayer");

async function loadQuestions() {
    try {
        const response = await fetch("questions.json");

        if (!response.ok) {
            throw new Error("Could not load questions.json");
        }

        const data = await response.json();
        allQuestions = data.questions || [];
        filteredQuestions = [...allQuestions];

        updateDashboard();
        updateProgress();

        questionText.textContent = "Click Start Practice to begin your ISC study quest.";
    } catch (error) {
        questionText.textContent = "Unable to load questions. Please check that questions.json is in the same folder as index.html.";
        console.error(error);
    }
}

function applyFilters() {
    const selectedContentArea = contentFilter.value;
    const selectedDifficulty = difficultyFilter.value;

    filteredQuestions = allQuestions.filter((question) => {
        const matchesContentArea =
            selectedContentArea === "all" || question.contentArea === selectedContentArea;

        const matchesDifficulty =
            selectedDifficulty === "all" || question.difficulty === selectedDifficulty;

        return matchesContentArea && matchesDifficulty;
    });
}

function startPractice() {
    applyFilters();

    if (filteredQuestions.length === 0) {
        questionText.textContent = "No questions match your selected filters. Try another content area or difficulty level.";
        choicesContainer.innerHTML = "";
        return;
    }

    currentQuestionIndex = 0;
    selectedAnswer = null;
    score = 0;
    xp = 0;
    correctCount = 0;
    answeredCount = 0;
    currentStreak = 0;
    badges = [];
    mistakes = [];

    resultCard.classList.add("hidden");
    reviewSection.classList.add("hidden");

    showQuestion();
    updateDashboard();
    updateProgress();
}

function showQuestion() {
    const question = filteredQuestions[currentQuestionIndex];

    selectedAnswer = null;
    submitBtn.disabled = true;
    submitBtn.classList.remove("hidden");
    nextBtn.classList.add("hidden");

    feedbackBox.className = "feedback-box hidden";
    feedbackTitle.textContent = "";
    feedbackExplanation.textContent = "";
    whyWrongBox.innerHTML = "";

    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${filteredQuestions.length}`;
    questionType.textContent = question.questionType;
    questionDifficulty.textContent = question.difficulty;
    questionEmoji.textContent = question.emoji || "📚";
    contentAreaLabel.textContent = question.contentArea;
    topicLabel.textContent = `${question.topic} | ${question.subtopic}`;
    questionText.textContent = question.question;

    choicesContainer.innerHTML = "";

    question.choices.forEach((choice) => {
        const button = document.createElement("button");
        button.className = "choice-btn";
        button.textContent = `${choice.id}. ${choice.text}`;
        button.dataset.answer = choice.id;

        button.addEventListener("click", () => {
            selectAnswer(choice.id, button);
        });

        choicesContainer.appendChild(button);
    });

    updateProgress();
}

function selectAnswer(answerId, buttonElement) {
    selectedAnswer = answerId;

    const allChoiceButtons = document.querySelectorAll(".choice-btn");
    allChoiceButtons.forEach((button) => {
        button.classList.remove("selected");
    });

    buttonElement.classList.add("selected");
    submitBtn.disabled = false;
}

function submitAnswer() {
    if (!selectedAnswer) return;

    const question = filteredQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    answeredCount += 1;

    const allChoiceButtons = document.querySelectorAll(".choice-btn");
    allChoiceButtons.forEach((button) => {
        const answer = button.dataset.answer;
        button.disabled = true;

        if (answer === question.correctAnswer) {
            button.classList.add("correct");
        }

        if (answer === selectedAnswer && !isCorrect) {
            button.classList.add("incorrect");
        }
    });

    if (isCorrect) {
        correctCount += 1;
        currentStreak += 1;

        let earnedXP = question.xp || 10;

        if (currentStreak >= 3) {
            earnedXP += 5;
        }

        xp += earnedXP;
        score += earnedXP;

        feedbackBox.classList.remove("hidden");
        feedbackBox.classList.add("correct-feedback");
        feedbackTitle.textContent = `✨ Correct! +${earnedXP} XP`;
        feedbackExplanation.textContent = question.explanation;

        if (currentStreak === 3 && !badges.includes("✨ 3-Question Streak")) {
            badges.push("✨ 3-Question Streak");
            showMiniBadge("✨ 3-Question Streak Badge Unlocked!");
            launchConfetti();
        }
    } else {
        currentStreak = 0;

        mistakes.push({
            id: question.id,
            question: question.question,
            selectedAnswer: selectedAnswer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            topic: question.topic,
            contentArea: question.contentArea
        });

        feedbackBox.classList.remove("hidden");
        feedbackBox.classList.add("incorrect-feedback");
        feedbackTitle.textContent = "📜 Not quite. Added to Scroll Review.";
        feedbackExplanation.textContent = question.explanation;

        const wrongReason = question.whyWrong && question.whyWrong[selectedAnswer];

        if (wrongReason) {
            whyWrongBox.innerHTML = `<strong>Why your answer was not the best choice:</strong><br>${wrongReason}`;
        }
    }

    submitBtn.classList.add("hidden");

    if (currentQuestionIndex < filteredQuestions.length - 1) {
        nextBtn.classList.remove("hidden");
    } else {
        nextBtn.textContent = "Finish Quiz";
        nextBtn.classList.remove("hidden");
    }

    updateDashboard();
    updateProgress();
}

function nextQuestion() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex += 1;
        showQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);

    resultCard.classList.remove("hidden");

    finalScoreText.textContent = `⭐ Final Score: ${score} XP`;
    finalAccuracyText.textContent = `🎯 Accuracy: ${accuracy}% (${correctCount} out of ${answeredCount})`;

    if (accuracy >= 90) {
        finalMessage.textContent = "Outstanding work, CPA Wizard. You mastered this quest.";
        unlockBadge("🏆 Accuracy Master");
        launchConfetti();
    } else if (accuracy >= 75) {
        finalMessage.textContent = "Great job. You passed this study quest and built strong ISC momentum.";
        unlockBadge("🛡️ Control Defender");
        launchConfetti();
    } else {
        finalMessage.textContent = "Good effort. Review your mistakes and try the quest again.";
    }

    renderMistakes();

    resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateDashboard() {
    const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);

    xpDisplay.textContent = xp;
    accuracyDisplay.textContent = `${accuracy}%`;
    streakDisplay.textContent = currentStreak;
    badgeDisplay.textContent = badges.length;
}

function updateProgress() {
    const total = filteredQuestions.length || 0;
    const current = total === 0 ? 0 : Math.min(currentQuestionIndex + 1, total);
    const percent = total === 0 ? 0 : Math.round((answeredCount / total) * 100);

    progressText.textContent = `Progress: ${answeredCount} / ${total}`;
    scoreText.textContent = `Score: ${score}`;
    progressFill.style.width = `${percent}%`;
}

function unlockBadge(badgeName) {
    if (!badges.includes(badgeName)) {
        badges.push(badgeName);
    }

    badgeUnlocked.textContent = `🏆 New Badge Unlocked: ${badgeName}`;
    badgeUnlocked.classList.remove("hidden");
    updateDashboard();
}

function showMiniBadge(message) {
    badgeUnlocked.textContent = message;
    badgeUnlocked.classList.remove("hidden");
}

function renderMistakes() {
    mistakesContainer.innerHTML = "";

    if (mistakes.length === 0) {
        mistakesContainer.innerHTML = `
            <div class="mistake-card">
                <strong>✨ No mistakes yet.</strong>
                <p>You completed this quest without adding anything to Scroll Review.</p>
            </div>
        `;
        return;
    }

    mistakes.forEach((mistake) => {
        const card = document.createElement("div");
        card.className = "mistake-card";

        card.innerHTML = `
            <strong>${mistake.topic}</strong>
            <p>${mistake.question}</p>
            <p><strong>Your answer:</strong> ${mistake.selectedAnswer}</p>
            <p><strong>Correct answer:</strong> ${mistake.correctAnswer}</p>
            <p><strong>Explanation:</strong> ${mistake.explanation}</p>
        `;

        mistakesContainer.appendChild(card);
    });
}

function showReviewSection() {
    renderMistakes();
    reviewSection.classList.remove("hidden");
    reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function restartPractice() {
    startPractice();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function launchConfetti() {
    const colors = ["#c6a96b", "#d7c7ee", "#1f3349", "#3f7d5b", "#ffffff"];

    for (let i = 0; i < 80; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";

        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 0.35}s`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;

        confettiLayer.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 2200);
    }
}

startBtn.addEventListener("click", startPractice);
reviewBtn.addEventListener("click", showReviewSection);
submitBtn.addEventListener("click", submitAnswer);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartPractice);

contentFilter.addEventListener("change", () => {
    applyFilters();
    updateProgress();
});

difficultyFilter.addEventListener("change", () => {
    applyFilters();
    updateProgress();
});

loadQuestions();