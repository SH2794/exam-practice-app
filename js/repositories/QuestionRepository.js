import { Question } from "../models/Question.js";

export class QuestionRepository {
  constructor(dataUrl = "./data/questions.json") {
    this.dataUrl = dataUrl;
    this.questions = [];
  }

  async load() {
    const response = await fetch(this.dataUrl);

    if (!response.ok) {
      throw new Error("questions.json の読み込みに失敗しました。");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("questions.json の形式が配列ではありません。");
    }

    this.questions = data.map((item) => new Question(item));
    return this.questions;
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

    if (matchedQuestions.length < 5) {
      throw new Error("選択条件に一致する問題が5問未満です。条件を変更してください。");
    }

    const orderedQuestions = mode === "random" ? this.shuffle(matchedQuestions) : matchedQuestions;
    return orderedQuestions.slice(0, 5);
  }

  shuffle(questions) {
    const copiedQuestions = [...questions];

    for (let index = copiedQuestions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copiedQuestions[index], copiedQuestions[randomIndex]] = [copiedQuestions[randomIndex], copiedQuestions[index]];
    }

    return copiedQuestions;
  }
}
