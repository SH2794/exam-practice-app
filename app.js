const QUESTION_COUNT = 5;
const CHOICE_LABELS = ["A", "B", "C", "D"];
const ERROR_NOT_ENOUGH_QUESTIONS = "選択条件に一致する問題が5問未満です。条件を変更してください。";

const state = {
  questions: [],
  quizQuestions: [],
  currentIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  selectedChoiceIndex: null,
  answered: false
};

const elements = {
  homeSection: document.querySelector("#home-section"),
  quizSection: document.querySelector("#quiz-section"),
  resultSection: document.querySelector("#result-section"),
  fieldSelect: document.querySelector("#field-select"),
  difficultySelect: document.querySelector("#difficulty-select"),
  modeSelect: document.querySelector("#mode-select"),
  startButton: document.querySelector("#start-button"),
  homeError: document.querySelector("#home-error"),
  questionCounter: document.querySelector("#question-counter"),
  quizMetaField: document.querySelector("#quiz-meta-field"),
  quizMetaDifficulty: document.querySelector("#quiz-meta-difficulty"),
  quizMetaCategory: document.querySelector("#quiz-meta-category"),
  questionText: document.querySelector("#question-text"),
  choicesContainer: document.querySelector("#choices-container"),
  submitAnswerButton: document.querySelector("#submit-answer-button"),
  nextQuestionButton: document.querySelector("#next-question-button"),
  questionMessage: document.querySelector("#question-message"),
  explanationArea: document.querySelector("#explanation-area"),
  resultTotal: document.querySelector("#result-total"),
  resultCorrect: document.querySelector("#result-correct"),
  resultWrong: document.querySelector("#result-wrong"),
  resultAccuracy: document.querySelector("#result-accuracy"),
  homeButton: document.querySelector("#home-button")
};

function initialize() {
  showHome();
  elements.startButton.addEventListener("click", startQuiz);
  elements.choicesContainer.addEventListener("click", selectChoice);
  elements.submitAnswerButton.addEventListener("click", submitAnswer);
  elements.nextQuestionButton.addEventListener("click", goToNextQuestion);
  elements.homeButton.addEventListener("click", returnHome);
}

async function loadQuestions() {
  const response = await fetch("./question.json");

  if (!response.ok) {
    throw new Error("question.json の読み込みに失敗しました。");
  }

  const questions = await response.json();

  if (!Array.isArray(questions)) {
    throw new Error("question.json の形式が配列ではありません。");
  }

  questions.forEach(validateQuestion);
  state.questions = questions;
}

function validateQuestion(question) {
  if (!question || typeof question !== "object") {
    throw new Error("問題データが不正です。");
  }

  if (!question.id || !question.field || !question.category || !question.difficulty || !question.question) {
    throw new Error("問題データの必須項目が不足しています。");
  }

  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    throw new Error(`問題 ${question.id} の選択肢数が4件ではありません。`);
  }

  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
    throw new Error(`問題 ${question.id} のanswerIndexが不正です。`);
  }
}

async function startQuiz() {
  clearHomeError();

  try {
    if (state.questions.length === 0) {
      await loadQuestions();
    }

    const field = elements.fieldSelect.value;
    const difficulty = elements.difficultySelect.value;
    const mode = elements.modeSelect.value;
    const questionSet = createQuestionSet(field, difficulty, mode);

    resetQuizState(questionSet);
    showQuiz();
    renderQuestion();
  } catch (error) {
    showHomeError(error.message || "問題データの読み込み中にエラーが発生しました。");
  }
}

function createQuestionSet(field, difficulty, mode) {
  const matchedQuestions = state.questions.filter((question) => {
    const matchesField = field === "all" || question.field === field;
    const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty;
    return matchesField && matchesDifficulty;
  });

  if (matchedQuestions.length < QUESTION_COUNT) {
    throw new Error(ERROR_NOT_ENOUGH_QUESTIONS);
  }

  const orderedQuestions = mode === "random" ? shuffleQuestions(matchedQuestions) : matchedQuestions;
  return orderedQuestions.slice(0, QUESTION_COUNT);
}

function shuffleQuestions(questions) {
  const shuffledQuestions = [...questions];

  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQuestions[index], shuffledQuestions[randomIndex]] = [shuffledQuestions[randomIndex], shuffledQuestions[index]];
  }

  return shuffledQuestions;
}

function resetQuizState(questionSet) {
  state.quizQuestions = questionSet;
  state.currentIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.selectedChoiceIndex = null;
  state.answered = false;
}

function getCurrentQuestion() {
  return state.quizQuestions[state.currentIndex];
}

function renderQuestion() {
  const question = getCurrentQuestion();
  clearQuestionState();
  elements.questionCounter.textContent = `第 ${state.currentIndex + 1} / ${QUESTION_COUNT} 問`;
  elements.quizMetaField.textContent = question.field;
  elements.quizMetaDifficulty.textContent = question.difficulty;
  elements.quizMetaCategory.textContent = question.category;
  elements.questionText.textContent = question.question;
  elements.choicesContainer.innerHTML = "";

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const text = document.createElement("span");

    button.type = "button";
    button.className = "choice-button";
    button.dataset.index = String(index);
    label.className = "choice-label";
    label.textContent = CHOICE_LABELS[index];
    text.className = "choice-text";
    text.textContent = choice;

    button.append(label, text);
    elements.choicesContainer.append(button);
  });
}

function selectChoice(event) {
  const choiceButton = event.target.closest(".choice-button");

  if (!choiceButton || state.answered) {
    return;
  }

  state.selectedChoiceIndex = Number(choiceButton.dataset.index);
  renderSelectedChoice();
}

function renderSelectedChoice() {
  elements.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.index) === state.selectedChoiceIndex);
  });
}

function submitAnswer() {
  if (state.answered) {
    showQuestionError("この問題はすでに解答済みです。次の問題へ進んでください。");
    return;
  }

  if (state.selectedChoiceIndex === null) {
    showQuestionError("選択肢を選んでください。");
    return;
  }

  const question = getCurrentQuestion();
  const correct = isCorrect(question, state.selectedChoiceIndex);
  state.answered = true;

  if (correct) {
    state.correctCount += 1;
  } else {
    state.wrongCount += 1;
  }

  showAnswerResult(correct, getCorrectLabel(question));
  showExplanation(question.explanation);
}

function isCorrect(question, selectedIndex) {
  return selectedIndex === question.answerIndex;
}

function getCorrectLabel(question) {
  return CHOICE_LABELS[question.answerIndex];
}

function goToNextQuestion() {
  if (!state.answered) {
    showQuestionError("先に解答してください。");
    return;
  }

  state.currentIndex += 1;

  if (state.currentIndex >= QUESTION_COUNT) {
    renderFinalResult();
    showResult();
    return;
  }

  state.selectedChoiceIndex = null;
  state.answered = false;
  renderQuestion();
}

function renderFinalResult() {
  const accuracyRate = Math.round((state.correctCount / QUESTION_COUNT) * 100);
  elements.resultTotal.textContent = `${QUESTION_COUNT}問`;
  elements.resultCorrect.textContent = `${state.correctCount}問`;
  elements.resultWrong.textContent = `${state.wrongCount}問`;
  elements.resultAccuracy.textContent = `${accuracyRate}%`;
}

function returnHome() {
  state.quizQuestions = [];
  state.currentIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.selectedChoiceIndex = null;
  state.answered = false;
  showHome();
}

function showHome() {
  elements.homeSection.classList.remove("hidden");
  elements.quizSection.classList.add("hidden");
  elements.resultSection.classList.add("hidden");
  clearHomeError();
  clearQuestionState();
}

function showQuiz() {
  elements.homeSection.classList.add("hidden");
  elements.quizSection.classList.remove("hidden");
  elements.resultSection.classList.add("hidden");
}

function showResult() {
  elements.homeSection.classList.add("hidden");
  elements.quizSection.classList.add("hidden");
  elements.resultSection.classList.remove("hidden");
}

function showHomeError(message) {
  elements.homeError.textContent = message;
}

function clearHomeError() {
  elements.homeError.textContent = "";
}

function showQuestionError(message) {
  elements.questionMessage.textContent = message;
  elements.questionMessage.className = "message error";
}

function showAnswerResult(correct, correctLabel) {
  elements.questionMessage.textContent = correct ? "正解です。" : `不正解です。正解は ${correctLabel} です。`;
  elements.questionMessage.className = correct ? "message correct" : "message wrong";
}

function showExplanation(explanation) {
  elements.explanationArea.textContent = explanation;
  elements.explanationArea.classList.remove("hidden");
}

function clearQuestionState() {
  elements.questionMessage.textContent = "";
  elements.questionMessage.className = "message";
  elements.explanationArea.textContent = "";
  elements.explanationArea.classList.add("hidden");
  elements.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
    button.classList.remove("selected");
  });
}

initialize();
