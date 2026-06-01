export class QuizSession {
  static totalQuestionCount = 5;

  constructor(questions) {
    if (!Array.isArray(questions) || questions.length !== QuizSession.totalQuestionCount) {
      throw new Error("演習は5問で開始する必要があります。");
    }

    this.questions = questions;
    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.answeredStates = questions.map(() => false);
  }

  get totalQuestions() {
    return this.questions.length;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  getCurrentQuestionNumber() {
    return this.currentQuestionIndex + 1;
  }

  isCurrentQuestionAnswered() {
    return this.answeredStates[this.currentQuestionIndex] === true;
  }

  recordAnswer(selectedIndex) {
    if (this.isCurrentQuestionAnswered()) {
      return {
        accepted: false,
        isCorrect: null
      };
    }

    const question = this.getCurrentQuestion();
    const isCorrect = question.isCorrect(selectedIndex);
    this.answeredStates[this.currentQuestionIndex] = true;

    if (isCorrect) {
      this.correctCount += 1;
    } else {
      this.wrongCount += 1;
    }

    return {
      accepted: true,
      isCorrect
    };
  }

  moveToNextQuestion() {
    if (!this.isCurrentQuestionAnswered()) {
      return false;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex += 1;
      return true;
    }

    this.currentQuestionIndex = this.questions.length;
    return true;
  }

  isFinished() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getAccuracyRate() {
    return Math.round((this.correctCount / this.totalQuestions) * 100);
  }
}
