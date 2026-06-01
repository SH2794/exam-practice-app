import { Question } from "../models/Question.js";

export class QuizView {
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
      button.type = "button";
      button.className = "choice-button";
      button.dataset.index = String(index);

      const label = document.createElement("span");
      label.className = "choice-label";
      label.textContent = Question.labels[index];

      const text = document.createElement("span");
      text.className = "choice-text";
      text.textContent = choice;

      button.append(label, text);
      this.choicesContainer.append(button);
    });
  }

  renderSelectedChoice(selectedIndex) {
    this.choicesContainer.querySelectorAll(".choice-button").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.index) === selectedIndex);
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

  showAnswerResult(isCorrect, correctLabel) {
    this.questionMessage.textContent = isCorrect ? "正解です。" : `不正解です。正解は ${correctLabel} です。`;
    this.questionMessage.className = isCorrect ? "message correct" : "message wrong";
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
