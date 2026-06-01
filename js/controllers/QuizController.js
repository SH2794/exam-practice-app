import { QuizSession } from "../models/QuizSession.js";

export class QuizController {
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

    this.view.showAnswerResult(result.isCorrect, question.getCorrectLabel());
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
