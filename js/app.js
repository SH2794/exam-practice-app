import { QuestionRepository } from "./repositories/QuestionRepository.js";
import { QuizController } from "./controllers/QuizController.js";
import { QuizView } from "./views/QuizView.js";

const repository = new QuestionRepository();
const view = new QuizView();
const controller = new QuizController(repository, view);

controller.initialize();
