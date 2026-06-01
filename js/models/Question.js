export class Question {
  static labels = ["A", "B", "C", "D"];

  constructor(data) {
    if (!data || typeof data !== "object") {
      throw new Error("問題データが不正です。");
    }

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
    return Question.labels[this.answerIndex];
  }
}
