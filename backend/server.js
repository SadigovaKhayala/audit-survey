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
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// 📝 **1. Create a new survey (Updated)**
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

  console.log("✅ Survey created:", newSurvey);
  res.json({ success: true, surveyId });
});

// 📌 **2. Get a specific survey by ID (Updated)**
app.get("/survey/:id", (req, res) => {
  const { id } = req.params;
  const surveys = readJsonFile(SURVEY_FILE);
  const survey = surveys.find((s) => s.id === id);

  if (!survey) {
    return res.status(404).json({ error: "Survey not found" });
  }
  console.log("📋 Survey fetched:", survey);
  res.json(survey);
});

// ✅ **3. Submit survey response with username**
app.post("/submit-response", (req, res) => {
  const { surveyId, username, responses } = req.body;
  console.log("📩 Received response:", req.body);

  const allResponses = readJsonFile(ANSWERS_FILE);

  const existingIndex = allResponses.findIndex(
    (r) => r.surveyId === surveyId && r.username === username
  );

  if (existingIndex !== -1) {
    allResponses[existingIndex] = {
      surveyId,
      username,
      responses,
      updatedAt: new Date(),
    };
  } else {
    allResponses.push({
      surveyId,
      username,
      responses,
      submittedAt: new Date(),
    });
  }

  writeJsonFile(ANSWERS_FILE, allResponses);
  console.log("✅ Responses saved:", allResponses);
  res.json({ success: true, message: "Response submitted successfully" });
});

// 📊 **4. Get all responses (NEW ENDPOINT)**
app.get("/responses", (req, res) => {
  const responses = readJsonFile(ANSWERS_FILE);
  console.log("📤 Returning all responses:", responses);
  res.json(responses);
});
// 📋 **Get all surveys (for Dashboard)**
app.get("/surveys", (req, res) => {
  const surveys = readJsonFile(SURVEY_FILE);
  if (!surveys || surveys.length === 0) {
    return res.status(404).json({ error: "Heç bir sorğu tapılmadı." });
  }
  res.json(surveys);
});
app.get("/dashboard/:id", (req, res) => {
  console.log(`🔍 Sorğu ID ilə axtarış: ${req.params.id}`); // Added log
  const { id } = req.params;
  const surveys = readJsonFile(SURVEY_FILE);
  const survey = surveys.find((s) => s.id === id);

  if (!survey) {
    console.log(`❌ Sorğu tapılmadı: ${id}`); // Added log
    return res.status(404).json({ error: "Sorğu tapılmadı." });
  }

  console.log(`✅ Sorğu tapıldı: ${survey.surveyTitle}`); // Added log
  res.json(survey);
});

// 🚀 **Start server**
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
