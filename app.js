const QUESTION_COUNT = 5;
const CHOICE_LABELS = ["A", "B", "C", "D"];
const ERROR_NOT_ENOUGH_QUESTIONS = "選択条件に一致する問題が5問未満です。条件を変更してください。";

class Question {
  constructor(data) {
    this.id = data.id;
    this.exam = data.exam;
    this.field = data.field;
    this.category = data.category;
    this.difficulty = data.difficulty;
    this.question = data.question;
    this.choices = Array.isArray(data.choices) ? [...data.choices] : [];
    this.answerIndex = data.answerIndex;
    this.explanation = data.explanation;
    this.validate();
  }

  validate() {
    if (!this.id || !this.field || !this.category || !this.difficulty || !this.question) {
      throw new Error("問題データの必須項目が不足しています。");
    }

    if (this.choices.length !== 4) {
      throw new Error(`問題 ${this.id} の選択肢数が4件ではありません。`);
    }

    if (!Number.isInteger(this.answerIndex) || this.answerIndex < 0 || this.answerIndex > 3) {
      throw new Error(`問題 ${this.id} のanswerIndexが不正です。`);
    }
  }

  isCorrect(selectedIndex) {
    return selectedIndex === this.answerIndex;
  }

  getCorrectChoice() {
    return this.choices[this.answerIndex];
  }

  getCorrectLabel() {
    return CHOICE_LABELS[this.answerIndex];
  }
}

class QuizSession {
  constructor(questions) {
    if (!Array.isArray(questions) || questions.length !== QUESTION_COUNT) {
      throw new Error("演習は5問で開始する必要があります。");
    }

    this.questions = questions;
    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.currentQuestionAnswered = false;
  }

  get totalQuestions() {
    return this.questions.length;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  getCurrentQuestionNumber() {
    return this.currentQuestionIndex + 1;
  }

  isCurrentQuestionAnswered() {
    return this.currentQuestionAnswered;
  }

  recordAnswer(selectedIndex) {
    if (this.currentQuestionAnswered) {
      return {
        accepted: false,
        correct: null
      };
    }

    const question = this.getCurrentQuestion();
    const correct = question.isCorrect(selectedIndex);
    this.currentQuestionAnswered = true;

    if (correct) {
      this.correctCount += 1;
    } else {
      this.wrongCount += 1;
    }

    return {
      accepted: true,
      correct
    };
  }

  moveToNextQuestion() {
    if (!this.currentQuestionAnswered) {
      return false;
    }

    this.currentQuestionIndex += 1;
    this.currentQuestionAnswered = false;
    return true;
  }

  isFinished() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getAccuracyRate() {
    return Math.round((this.correctCount / this.totalQuestions) * 100);
  }
}

class QuestionRepository {
  constructor(dataUrl = "./question.json") {
    this.dataUrl = dataUrl;
    this.questions = [];
  }

  async load() {
    const response = await fetch(this.dataUrl);

    if (!response.ok) {
      throw new Error("question.json の読み込みに失敗しました。");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("question.json の形式が配列ではありません。");
    }

    this.questions = data.map((item) => new Question(item));
  }

  findByCondition(field, difficulty) {
    return this.questions.filter((question) => {
      const matchesField = field === "all" || question.field === field;
      const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty;
      return matchesField && matchesDifficulty;
    });
  }

  createQuestionSet(field, difficulty, mode) {
    const matchedQuestions = this.findByCondition(field, difficulty);

    if (matchedQuestions.length < QUESTION_COUNT) {
      throw new Error(ERROR_NOT_ENOUGH_QUESTIONS);
    }

    const orderedQuestions = mode === "random" ? this.shuffle(matchedQuestions) : matchedQuestions;
    return orderedQuestions.slice(0, QUESTION_COUNT);
  }

  shuffle(questions) {
    const shuffledQuestions = [...questions];

    for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledQuestions[index], shuffledQuestions[randomIndex]] = [shuffledQuestions[randomIndex], shuffledQuestions[index]];
    }

    return shuffledQuestions;
  }
}

class QuizView {
  constructor() {
    this.homeSection = document.querySelector("#home-section");
    this.quizSection = document.querySelector("#quiz-section");
    this.resultSection = document.querySelector("#result-section");
    this.fieldSelect = document.querySelector("#field-select");
    this.difficultySelect = document.querySelector("#difficulty-select");
    this.modeSelect = document.querySelector("#mode-select");
    this.startButton = document.querySelector("#start-button");
    this.homeError = document.querySelector("#home-error");
    this.questionCounter = document.querySelector("#question-counter");
    this.quizMetaField = document.querySelector("#quiz-meta-field");
    this.quizMetaDifficulty = document.querySelector("#quiz-meta-difficulty");
    this.quizMetaCategory = document.querySelector("#quiz-meta-category");
    this.questionText = document.querySelector("#question-text");
    this.choicesContainer = document.querySelector("#choices-container");
    this.submitAnswerButton = document.querySelector("#submit-answer-button");
    this.nextQuestionButton = document.querySelector("#next-question-button");
    this.questionMessage = document.querySelector("#question-message");
    this.explanationArea = document.querySelector("#explanation-area");
    this.resultTotal = document.querySelector("#result-total");
    this.resultCorrect = document.querySelector("#result-correct");
    this.resultWrong = document.querySelector("#result-wrong");
    this.resultAccuracy = document.querySelector("#result-accuracy");
    this.homeButton = document.querySelector("#home-button");
  }

  showHome() {
    this.homeSection.classList.remove("hidden");
    this.quizSection.classList.add("hidden");
    this.resultSection.classList.add("hidden");
    this.clearHomeError();
    this.clearQuestionState();
  }

  showQuiz() {
    this.homeSection.classList.add("hidden");
    this.quizSection.classList.remove("hidden");
    this.resultSection.classList.add("hidden");
  }

  showResult() {
    this.homeSection.classList.add("hidden");
    this.quizSection.classList.add("hidden");
    this.resultSection.classList.remove("hidden");
  }

  getSelectedConditions() {
    return {
      field: this.fieldSelect.value,
      difficulty: this.difficultySelect.value,
      mode: this.modeSelect.value
    };
  }

  renderQuestion(question, questionNumber, totalQuestions) {
    this.clearQuestionState();
    this.questionCounter.textContent = `第 ${questionNumber} / ${totalQuestions} 問`;
    this.quizMetaField.textContent = question.field;
    this.quizMetaDifficulty.textContent = question.difficulty;
    this.quizMetaCategory.textContent = question.category;
    this.questionText.textContent = question.question;
    this.choicesContainer.innerHTML = "";

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
      this.choicesContainer.append(button);
    });
  }

  renderSelectedChoice(selectedChoiceIndex) {
    this.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.index) === selectedChoiceIndex);
    });
  }

  showHomeError(message) {
    this.homeError.textContent = message;
  }

  clearHomeError() {
    this.homeError.textContent = "";
  }

  showQuestionError(message) {
    this.questionMessage.textContent = message;
    this.questionMessage.className = "message error";
  }

  showAnswerResult(correct, correctLabel) {
    this.questionMessage.textContent = correct ? "正解です。" : `不正解です。正解は ${correctLabel} です。`;
    this.questionMessage.className = correct ? "message correct" : "message wrong";
  }

  showExplanation(explanation) {
    this.explanationArea.textContent = explanation;
    this.explanationArea.classList.remove("hidden");
  }

  clearQuestionState() {
    this.questionMessage.textContent = "";
    this.questionMessage.className = "message";
    this.explanationArea.textContent = "";
    this.explanationArea.classList.add("hidden");
    this.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
      button.classList.remove("selected");
    });
  }

  renderFinalResult(session) {
    this.resultTotal.textContent = `${session.totalQuestions}問`;
    this.resultCorrect.textContent = `${session.correctCount}問`;
    this.resultWrong.textContent = `${session.wrongCount}問`;
    this.resultAccuracy.textContent = `${session.getAccuracyRate()}%`;
  }
}

class QuizController {
  constructor(repository, view) {
    this.repository = repository;
    this.view = view;
    this.session = null;
    this.selectedChoiceIndex = null;
  }

  initialize() {
    this.view.showHome();
    this.view.startButton.addEventListener("click", () => this.startQuiz());
    this.view.choicesContainer.addEventListener("click", (event) => this.selectChoice(event));
    this.view.submitAnswerButton.addEventListener("click", () => this.submitAnswer());
    this.view.nextQuestionButton.addEventListener("click", () => this.goToNextQuestion());
    this.view.homeButton.addEventListener("click", () => this.returnHome());
  }

  async startQuiz() {
    this.view.clearHomeError();

    try {
      if (this.repository.questions.length === 0) {
        await this.repository.load();
      }

      const { field, difficulty, mode } = this.view.getSelectedConditions();
      const questionSet = this.repository.createQuestionSet(field, difficulty, mode);
      this.session = new QuizSession(questionSet);
      this.selectedChoiceIndex = null;
      this.view.showQuiz();
      this.renderCurrentQuestion();
    } catch (error) {
      this.session = null;
      this.view.showHomeError(error.message || "問題データの読み込み中にエラーが発生しました。");
    }
  }

  renderCurrentQuestion() {
    const question = this.session.getCurrentQuestion();
    this.selectedChoiceIndex = null;
    this.view.renderQuestion(question, this.session.getCurrentQuestionNumber(), this.session.totalQuestions);
  }

  selectChoice(event) {
    const choiceButton = event.target.closest(".choice-button");

    if (!choiceButton || !this.session || this.session.isCurrentQuestionAnswered()) {
      return;
    }

    this.selectedChoiceIndex = Number(choiceButton.dataset.index);
    this.view.renderSelectedChoice(this.selectedChoiceIndex);
  }

  submitAnswer() {
    if (!this.session) {
      return;
    }

    if (this.session.isCurrentQuestionAnswered()) {
      this.view.showQuestionError("この問題はすでに解答済みです。次の問題へ進んでください。");
      return;
    }

    if (this.selectedChoiceIndex === null) {
      this.view.showQuestionError("選択肢を選んでください。");
      return;
    }

    const question = this.session.getCurrentQuestion();
    const result = this.session.recordAnswer(this.selectedChoiceIndex);

    if (!result.accepted) {
      this.view.showQuestionError("この問題はすでに解答済みです。次の問題へ進んでください。");
      return;
    }

    this.view.showAnswerResult(result.correct, question.getCorrectLabel());
    this.view.showExplanation(question.explanation);
  }

  goToNextQuestion() {
    if (!this.session) {
      return;
    }

    if (!this.session.isCurrentQuestionAnswered()) {
      this.view.showQuestionError("先に解答してください。");
      return;
    }

    this.session.moveToNextQuestion();

    if (this.session.isFinished()) {
      this.view.renderFinalResult(this.session);
      this.view.showResult();
      return;
    }

    this.renderCurrentQuestion();
  }

  returnHome() {
    this.session = null;
    this.selectedChoiceIndex = null;
    this.view.showHome();
  }
}

const repository = new QuestionRepository();
const view = new QuizView();
const controller = new QuizController(repository, view);

controller.initialize();
