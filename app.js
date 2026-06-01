class Question {
  constructor(dataUrl = "./question.json") {
    this.dataUrl = dataUrl;
    this.questionCount = 5;
    this.choiceLabels = ["A", "B", "C", "D"];
    this.notEnoughQuestionsMessage = "選択条件に一致する問題が5問未満です。条件を変更してください。";
    this.allQuestions = [];
    this.quizQuestions = [];
    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.selectedChoiceIndex = null;
    this.currentQuestionAnswered = false;
    this.elements = {
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
  }

  initialize() {
    this.showHome();
    this.elements.startButton.addEventListener("click", () => this.startQuiz());
    this.elements.choicesContainer.addEventListener("click", (event) => this.selectChoice(event));
    this.elements.submitAnswerButton.addEventListener("click", () => this.submitAnswer());
    this.elements.nextQuestionButton.addEventListener("click", () => this.goToNextQuestion());
    this.elements.homeButton.addEventListener("click", () => this.returnHome());
  }

  async loadQuestions() {
    const response = await fetch(this.dataUrl);

    if (!response.ok) {
      throw new Error("question.json の読み込みに失敗しました。");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("question.json の形式が配列ではありません。");
    }

    this.allQuestions = data.map((item) => this.createQuestion(item));
  }

  createQuestion(data) {
    if (!data || typeof data !== "object") {
      throw new Error("問題データが不正です。");
    }

    const question = {
      id: data.id,
      exam: data.exam,
      field: data.field,
      category: data.category,
      difficulty: data.difficulty,
      question: data.question,
      choices: Array.isArray(data.choices) ? [...data.choices] : [],
      answerIndex: data.answerIndex,
      explanation: data.explanation
    };

    this.validateQuestion(question);
    return question;
  }

  validateQuestion(question) {
    if (!question.id || !question.field || !question.category || !question.difficulty || !question.question) {
      throw new Error("問題データの必須項目が不足しています。");
    }

    if (question.choices.length !== 4) {
      throw new Error(`問題 ${question.id} の選択肢数が4件ではありません。`);
    }

    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
      throw new Error(`問題 ${question.id} のanswerIndexが不正です。`);
    }
  }

  async startQuiz() {
    this.clearHomeError();

    try {
      if (this.allQuestions.length === 0) {
        await this.loadQuestions();
      }

      const { field, difficulty, mode } = this.getSelectedConditions();
      const questionSet = this.createQuestionSet(field, difficulty, mode);
      this.resetQuizState(questionSet);
      this.showQuiz();
      this.renderCurrentQuestion();
    } catch (error) {
      this.resetQuizState([]);
      this.showHomeError(error.message || "問題データの読み込み中にエラーが発生しました。");
    }
  }

  getSelectedConditions() {
    return {
      field: this.elements.fieldSelect.value,
      difficulty: this.elements.difficultySelect.value,
      mode: this.elements.modeSelect.value
    };
  }

  createQuestionSet(field, difficulty, mode) {
    const matchedQuestions = this.findByCondition(field, difficulty);

    if (matchedQuestions.length < this.questionCount) {
      throw new Error(this.notEnoughQuestionsMessage);
    }

    const orderedQuestions = mode === "random" ? this.shuffleQuestions(matchedQuestions) : matchedQuestions;
    return orderedQuestions.slice(0, this.questionCount);
  }

  findByCondition(field, difficulty) {
    return this.allQuestions.filter((question) => {
      const matchesField = field === "all" || question.field === field;
      const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty;
      return matchesField && matchesDifficulty;
    });
  }

  shuffleQuestions(questions) {
    const shuffledQuestions = [...questions];

    for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledQuestions[index], shuffledQuestions[randomIndex]] = [shuffledQuestions[randomIndex], shuffledQuestions[index]];
    }

    return shuffledQuestions;
  }

  resetQuizState(questionSet) {
    this.quizQuestions = questionSet;
    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.selectedChoiceIndex = null;
    this.currentQuestionAnswered = false;
  }

  getCurrentQuestion() {
    return this.quizQuestions[this.currentQuestionIndex];
  }

  renderCurrentQuestion() {
    const question = this.getCurrentQuestion();
    this.selectedChoiceIndex = null;
    this.currentQuestionAnswered = false;
    this.renderQuestion(question, this.currentQuestionIndex + 1, this.questionCount);
  }

  renderQuestion(question, questionNumber, totalQuestions) {
    this.clearQuestionState();
    this.elements.questionCounter.textContent = `第 ${questionNumber} / ${totalQuestions} 問`;
    this.elements.quizMetaField.textContent = question.field;
    this.elements.quizMetaDifficulty.textContent = question.difficulty;
    this.elements.quizMetaCategory.textContent = question.category;
    this.elements.questionText.textContent = question.question;
    this.elements.choicesContainer.innerHTML = "";

    question.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      const label = document.createElement("span");
      const text = document.createElement("span");

      button.type = "button";
      button.className = "choice-button";
      button.dataset.index = String(index);
      label.className = "choice-label";
      label.textContent = this.choiceLabels[index];
      text.className = "choice-text";
      text.textContent = choice;

      button.append(label, text);
      this.elements.choicesContainer.append(button);
    });
  }

  selectChoice(event) {
    const choiceButton = event.target.closest(".choice-button");

    if (!choiceButton || this.currentQuestionAnswered) {
      return;
    }

    this.selectedChoiceIndex = Number(choiceButton.dataset.index);
    this.renderSelectedChoice();
  }

  renderSelectedChoice() {
    this.elements.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.index) === this.selectedChoiceIndex);
    });
  }

  submitAnswer() {
    if (this.quizQuestions.length === 0) {
      return;
    }

    if (this.currentQuestionAnswered) {
      this.showQuestionError("この問題はすでに解答済みです。次の問題へ進んでください。");
      return;
    }

    if (this.selectedChoiceIndex === null) {
      this.showQuestionError("選択肢を選んでください。");
      return;
    }

    const question = this.getCurrentQuestion();
    const correct = this.isCorrect(question, this.selectedChoiceIndex);
    this.currentQuestionAnswered = true;

    if (correct) {
      this.correctCount += 1;
    } else {
      this.wrongCount += 1;
    }

    this.showAnswerResult(correct, this.getCorrectLabel(question));
    this.showExplanation(question.explanation);
  }

  isCorrect(question, selectedIndex) {
    return selectedIndex === question.answerIndex;
  }

  getCorrectChoice(question) {
    return question.choices[question.answerIndex];
  }

  getCorrectLabel(question) {
    return this.choiceLabels[question.answerIndex];
  }

  goToNextQuestion() {
    if (this.quizQuestions.length === 0) {
      return;
    }

    if (!this.currentQuestionAnswered) {
      this.showQuestionError("先に解答してください。");
      return;
    }

    this.currentQuestionIndex += 1;

    if (this.isFinished()) {
      this.renderFinalResult();
      this.showResult();
      return;
    }

    this.renderCurrentQuestion();
  }

  isFinished() {
    return this.currentQuestionIndex >= this.quizQuestions.length;
  }

  getAccuracyRate() {
    return Math.round((this.correctCount / this.questionCount) * 100);
  }

  renderFinalResult() {
    this.elements.resultTotal.textContent = `${this.questionCount}問`;
    this.elements.resultCorrect.textContent = `${this.correctCount}問`;
    this.elements.resultWrong.textContent = `${this.wrongCount}問`;
    this.elements.resultAccuracy.textContent = `${this.getAccuracyRate()}%`;
  }

  returnHome() {
    this.resetQuizState([]);
    this.showHome();
  }

  showHome() {
    this.elements.homeSection.classList.remove("hidden");
    this.elements.quizSection.classList.add("hidden");
    this.elements.resultSection.classList.add("hidden");
    this.clearHomeError();
    this.clearQuestionState();
  }

  showQuiz() {
    this.elements.homeSection.classList.add("hidden");
    this.elements.quizSection.classList.remove("hidden");
    this.elements.resultSection.classList.add("hidden");
  }

  showResult() {
    this.elements.homeSection.classList.add("hidden");
    this.elements.quizSection.classList.add("hidden");
    this.elements.resultSection.classList.remove("hidden");
  }

  showHomeError(message) {
    this.elements.homeError.textContent = message;
  }

  clearHomeError() {
    this.elements.homeError.textContent = "";
  }

  showQuestionError(message) {
    this.elements.questionMessage.textContent = message;
    this.elements.questionMessage.className = "message error";
  }

  showAnswerResult(correct, correctLabel) {
    this.elements.questionMessage.textContent = correct ? "正解です。" : `不正解です。正解は ${correctLabel} です。`;
    this.elements.questionMessage.className = correct ? "message correct" : "message wrong";
  }

  showExplanation(explanation) {
    this.elements.explanationArea.textContent = explanation;
    this.elements.explanationArea.classList.remove("hidden");
  }

  clearQuestionState() {
    this.elements.questionMessage.textContent = "";
    this.elements.questionMessage.className = "message";
    this.elements.explanationArea.textContent = "";
    this.elements.explanationArea.classList.add("hidden");
    this.elements.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
      button.classList.remove("selected");
    });
  }
}

const ques = new Question();

ques.initialize();
