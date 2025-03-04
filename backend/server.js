const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const SURVEY_FILE = "./survey.json";
const ANSWERS_FILE = "./answers.json";

// Read JSON file function
const readJsonFile = (file) => {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file);
  return JSON.parse(data);
};

// Write JSON file function
const writeJsonFile = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`✅ Data successfully written to ${file}`);
  } catch (err) {
    console.error("❌ Error writing to file:", err);
  }
};

// Fetch survey by ID
const getSurveyById = (surveyId) => {
  const surveys = readJsonFile(SURVEY_FILE);
  return surveys.find((survey) => survey.id === surveyId);
};

// Save responses to file
const saveResponsesToDB = (responseData) => {
  const allResponses = readJsonFile(ANSWERS_FILE);
  const existingIndex = allResponses.findIndex(
    (r) =>
      r.surveyId === responseData.surveyId &&
      r.username === responseData.username
  );

  if (existingIndex !== -1) {
    allResponses[existingIndex] = { ...responseData, updatedAt: new Date() };
  } else {
    allResponses.push({ ...responseData, submittedAt: new Date() });
  }

  writeJsonFile(ANSWERS_FILE, allResponses);
  console.log("✅ Responses saved:", responseData);
};

// Create Survey
app.post("/create-survey", (req, res) => {
  const { surveyTitle, auditName, auditDate, evaluators, questions } = req.body;
  const surveyId = uuidv4();
  const newSurvey = {
    id: surveyId,
    surveyTitle,
    auditName,
    auditDate,
    evaluators,
    questions,
  };

  const surveys = readJsonFile(SURVEY_FILE);
  surveys.push(newSurvey);
  writeJsonFile(SURVEY_FILE, surveys);

  res.json({ success: true, surveyId });
});

// Fetch Survey for a specific user
app.get("/survey/:surveyId/:username", (req, res) => {
  const { surveyId, username } = req.params;
  const survey = getSurveyById(surveyId);

  if (!survey) return res.status(404).json({ error: "Survey not found" });

  res.json(survey);
});

// Submit response and calculate final score
app.post("/submit-response", (req, res) => {
  const { surveyId, username, responses } = req.body;
  const survey = getSurveyById(surveyId);

  if (!survey) return res.status(404).json({ error: "Survey not found" });

  let totalScore = 0;
  survey.questions.forEach((section, index) => {
    const sectionScores = section.items.map((_, i) =>
      parseInt(responses[index]?.[i] || 0)
    );
    const avg =
      sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length || 0;
    totalScore += avg * section.weight;
  });

  saveResponsesToDB({
    surveyId,
    username,
    responses,
    totalScore: totalScore.toFixed(2),
  });

  res.json({
    success: true,
    message: "Response submitted successfully",
    totalScore: totalScore.toFixed(2),
  });
});

// Fetch all responses
app.get("/responses", (req, res) => {
  res.json(readJsonFile(ANSWERS_FILE));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const { v4: uuidv4 } = require("uuid");
// require("dotenv").config();

// const app = express();
// const PORT = 3002;

// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const mongoURI =
//   "mongodb://hr:Z)g(K2e63(eIzr@test-mongodb-srv1.abb-bank.az:27017/abb-hr-test";
// mongoose
//   .connect(mongoURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ Connected to MongoDB"))
//   .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// // Define Schemas
// const SurveySchema = new mongoose.Schema({
//   id: String,
//   surveyTitle: String,
//   auditName: String,
//   auditDate: String,
//   evaluators: Array,
//   questions: Array,
// });

// const ResponseSchema = new mongoose.Schema({
//   surveyId: String,
//   username: String,
//   responses: Array,
//   submittedAt: Date,
//   updatedAt: Date,
// });

// // Define Models
// const Survey = mongoose.model("Survey", SurveySchema);
// const Response = mongoose.model("Response", ResponseSchema);

// // 📝 Create a new survey
// app.post("/create-survey", async (req, res) => {
//   try {
//     const { surveyTitle, auditName, auditDate, evaluators, questions } =
//       req.body;
//     const newSurvey = new Survey({
//       id: uuidv4(),
//       surveyTitle,
//       auditName,
//       auditDate,
//       evaluators,
//       questions,
//     });
//     await newSurvey.save();
//     console.log("✅ Survey created:", newSurvey);
//     res.json({ success: true, surveyId: newSurvey.id });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 📌 Get a specific survey by ID
// app.get("/survey/:id", async (req, res) => {
//   try {
//     const survey = await Survey.findOne({ id: req.params.id });
//     if (!survey) return res.status(404).json({ error: "Survey not found" });
//     console.log("📋 Survey fetched:", survey);
//     res.json(survey);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ Submit survey response
// app.post("/submit-response", async (req, res) => {
//   try {
//     const { surveyId, username, responses } = req.body;
//     console.log("📩 Received response:", req.body);

//     const existingResponse = await Response.findOne({ surveyId, username });
//     if (existingResponse) {
//       existingResponse.responses = responses;
//       existingResponse.updatedAt = new Date();
//       await existingResponse.save();
//     } else {
//       const newResponse = new Response({
//         surveyId,
//         username,
//         responses,
//         submittedAt: new Date(),
//       });
//       await newResponse.save();
//     }
//     console.log("✅ Responses saved");
//     res.json({ success: true, message: "Response submitted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 📊 Get all responses
// app.get("/responses", async (req, res) => {
//   try {
//     const responses = await Response.find();
//     console.log("📤 Returning all responses:", responses);
//     res.json(responses);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 📋 Get all surveys
// app.get("/surveys", async (req, res) => {
//   try {
//     const surveys = await Survey.find();
//     if (surveys.length === 0)
//       return res.status(404).json({ error: "Heç bir sorğu tapılmadı." });
//     res.json(surveys);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 🔍 Get survey by ID for dashboard
// app.get("/dashboard/:id", async (req, res) => {
//   try {
//     console.log(`🔍 Sorğu ID ilə axtarış: ${req.params.id}`);
//     const survey = await Survey.findOne({ id: req.params.id });
//     if (!survey) {
//       console.log(`❌ Sorğu tapılmadı: ${req.params.id}`);
//       return res.status(404).json({ error: "Sorğu tapılmadı." });
//     }
//     console.log(`✅ Sorğu tapıldı: ${survey.surveyTitle}`);
//     res.json(survey);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 🚀 Start server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
