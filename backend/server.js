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

// 📝 **1. Create a new survey**
app.post("/create-survey", (req, res) => {
  const { title, questions } = req.body;
  const surveyId = uuidv4();
  const newSurvey = { id: surveyId, title, questions };

  const surveys = readJsonFile(SURVEY_FILE);
  surveys.push(newSurvey);
  writeJsonFile(SURVEY_FILE, surveys);

  res.json({ success: true, surveyId });
});

// 📋 **2. Get all surveys**
app.get("/surveys", (req, res) => {
  const surveys = readJsonFile(SURVEY_FILE);
  res.json(surveys);
});

// 📌 **3. Get a specific survey by ID**
app.get("/survey/:id", (req, res) => {
  const { id } = req.params;
  const surveys = readJsonFile(SURVEY_FILE);
  const survey = surveys.find((s) => s.id === id);

  if (!survey) {
    return res.status(404).json({ error: "Survey not found" });
  }

  res.json(survey);
});

// 🔄 **4. Get all responses for a specific survey (with usernames for all users)**
app.get("/survey-responses/:id", (req, res) => {
  const { id } = req.params;
  const responses = readJsonFile(ANSWERS_FILE);
  const filteredResponses = responses.filter((r) => r.surveyId === id);

  const formattedResponses = {};

  filteredResponses.forEach((resp) => {
    formattedResponses[resp.username] = resp.responses;
  });

  res.json(formattedResponses);
});

// ✅ **5. Submit survey response with username**
app.post("/submit-response", (req, res) => {
  const { surveyId, username, responses, finalScore } = req.body;
  const allResponses = readJsonFile(ANSWERS_FILE);

  // Check if user already submitted
  const existingIndex = allResponses.findIndex(
    (r) => r.surveyId === surveyId && r.username === username
  );

  if (existingIndex !== -1) {
    // Update existing response
    allResponses[existingIndex] = {
      surveyId,
      username,
      responses,
      finalScore,
      updatedAt: new Date(),
    };
  } else {
    // Add new response
    allResponses.push({
      surveyId,
      username,
      responses,
      finalScore,
      submittedAt: new Date(),
    });
  }

  writeJsonFile(ANSWERS_FILE, allResponses);
  res.json({ success: true, message: "Response submitted successfully" });
});

// 📊 **6. Get all responses (admin)**
app.get("/responses", (req, res) => {
  const responses = readJsonFile(ANSWERS_FILE);
  res.json(responses);
});

// 🚀 **Start server**
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
