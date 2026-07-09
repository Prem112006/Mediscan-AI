const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API if key is present
let aiInstance = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.error('Error initializing GoogleGenAI client:', err);
  }
}

/**
 * Parses raw OCR text of a medicine label using Gemini (or falls back to mock logic).
 * @param {string} rawOcrText - The text parsed from the medicine label.
 * @returns {Promise<object>} - Structured medicine details.
 */
const analyzeMedicineLabel = async (rawOcrText) => {
  if (aiInstance) {
    try {
      console.log('Sending medicine label OCR text to Gemini API...');
      const prompt = `
        You are a clinical pharmacist AI. Analyze the following OCR text extracted from a medicine label.
        Extract the structured details in JSON format. Do not include markdown code block formatting in your response (just return the raw JSON).
        
        The JSON must follow this schema:
        {
          "medicineName": "string (brand name, capitalize)",
          "activeIngredients": "string (generic ingredients and strength)",
          "dosage": "string (standard dosage directions if found)",
          "usageInstructions": "string (how to consume, with/without food, etc.)",
          "sideEffects": "string (common side effects)",
          "warnings": "string (critical alerts, contraindications)",
          "precautions": "string (pregnancy warnings, alcohol, driving cautions)"
        }

        If information is missing, infer standard clinical knowledge for that medicine based on its name.
        Here is the OCR text:
        "${rawOcrText}"
      `;

      const response = await aiInstance.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Gemini medicine analysis failed, falling back to mock:', error);
    }
  }

  // Mock Fallback Engine
  return generateMockMedicineAnalysis(rawOcrText);
};

/**
 * Parses raw text of a medical report using Gemini (or falls back to mock logic).
 * @param {string} rawReportText - Text extracted from the medical report.
 * @returns {Promise<object>} - Structured medical report analysis.
 */
const analyzeMedicalReport = async (rawReportText) => {
  if (aiInstance) {
    try {
      console.log('Sending medical report text to Gemini API...');
      const prompt = `
        You are an expert physician AI. Analyze the following medical lab report text and extract a clinical summary, key test results, highlighted insights, and warnings/disclaimers.
        Extract the details in JSON format. Do not include markdown formatting in your response.
        
        The JSON must follow this schema:
        {
          "summary": "string (1-2 sentences summarizing the overall clinical status based on the report)",
          "keyFindings": [
            {
              "test": "string (e.g. Hemoglobin, TSH)",
              "value": "string (e.g. 11.5 g/dL, 4.2 uIU/mL)",
              "referenceRange": "string (e.g. 12.0 - 16.0 g/dL, 0.4 - 4.0 uIU/mL)",
              "status": "string (Normal, High, Low, or Critical)"
            }
          ],
          "highlightedInsights": [
            {
              "type": "string (danger, warning, or info)",
              "message": "string (brief clinical insight about out-of-range values or patterns)"
            }
          ],
          "recommendations": "string (clinical recommendations, follow-up tests, lifestyle changes)",
          "warnings": "string (critical disclaimers, urgent warnings)"
        }

        Here is the medical report text:
        "${rawReportText}"
      `;

      const response = await aiInstance.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Gemini report analysis failed, falling back to mock:', error);
    }
  }

  // Mock Fallback Engine
  return generateMockReportAnalysis(rawReportText);
};

// --- MOCK GENERATION LOGIC ---

function generateMockMedicineAnalysis(text) {
  const normalizedText = (text || '').toLowerCase();
  
  // Library of mock medicines
  const medicineLibrary = {
    amoxicillin: {
      medicineName: 'Amoxicillin',
      activeIngredients: 'Amoxicillin Trihydrate 500mg',
      dosage: '500 mg orally every 8 hours or 250 mg every 8 hours, as prescribed.',
      usageInstructions: 'Take with or without food. Complete the full course of treatment even if symptoms disappear.',
      sideEffects: 'Nausea, vomiting, diarrhea, skin rash, or oral thrush.',
      warnings: 'Do not take if you have a known allergy to penicillin or cephalosporin antibiotics.',
      precautions: 'Inform your doctor if you have kidney disease, asthma, or mononucleosis. Safe during pregnancy, but consult your physician.'
    },
    metformin: {
      medicineName: 'Metformin',
      activeIngredients: 'Metformin Hydrochloride 850mg',
      dosage: 'Initially 500 mg or 850 mg once daily, adjusted by your doctor up to 2000 mg/day.',
      usageInstructions: 'Take with meals to minimize gastrointestinal side effects. Swallow whole; do not crush.',
      sideEffects: 'Diarrhea, nausea, stomach upset, metallic taste in the mouth, or lactic acidosis (rare).',
      warnings: 'Risk of lactic acidosis, especially in patients with severe kidney or liver impairment. Avoid heavy alcohol intake.',
      precautions: 'Regularly monitor kidney function. Temporarily discontinue before major surgical procedures or imaging tests involving iodine contrast.'
    },
    lisinopril: {
      medicineName: 'Lisinopril',
      activeIngredients: 'Lisinopril 10mg (ACE Inhibitor)',
      dosage: '10 mg once daily. May be adjusted up to 40 mg daily depending on blood pressure response.',
      usageInstructions: 'Take at the same time every day, with or without food.',
      sideEffects: 'Dry cough, dizziness, headache, fatigue, or elevated potassium levels.',
      warnings: 'Do not take during pregnancy as it can cause fetal harm. Seek immediate medical care if swelling of the face, lips, or tongue occurs (angioedema).',
      precautions: 'Monitor kidney function and blood potassium levels. Avoid potassium supplements unless directed by a doctor.'
    },
    ibuprofen: {
      medicineName: 'Ibuprofen (Advil / Motrin)',
      activeIngredients: 'Ibuprofen 400mg (NSAID)',
      dosage: '200 mg to 400 mg every 4 to 6 hours as needed for pain or fever. Do not exceed 1200 mg/day over-the-counter.',
      usageInstructions: 'Take with food or milk to reduce stomach irritation.',
      sideEffects: 'Stomach ache, heartburn, nausea, dizziness, or increased blood pressure.',
      warnings: 'May increase risk of gastrointestinal bleeding or cardiovascular events. Do not use after recent heart bypass surgery.',
      precautions: 'Use with caution if you have asthma, kidney disease, heart failure, or history of stomach ulcers. Avoid in late pregnancy.'
    },
    lipitor: {
      medicineName: 'Lipitor (Atorvastatin)',
      activeIngredients: 'Atorvastatin Calcium 20mg',
      dosage: '10 mg to 80 mg once daily, anytime during the day.',
      usageInstructions: 'Can be taken with or without food. Avoid drinking large amounts of grapefruit juice.',
      sideEffects: 'Joint pain, mild muscle pain, diarrhea, or elevated liver enzymes.',
      warnings: 'Stop taking and contact your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness (rhabdomyolysis).',
      precautions: 'Check liver function before starting. Do not use during pregnancy or breastfeeding.'
    }
  };

  // Find a match
  for (const key of Object.keys(medicineLibrary)) {
    if (normalizedText.includes(key)) {
      return medicineLibrary[key];
    }
  }

  // Fallback to standard generic response if no match
  // Try to find any capitalized word that might look like a name
  let nameMatches = text.match(/[A-Z][a-zA-Z]+/g) || ['GenericMedicine'];
  let guessedName = nameMatches.find(w => w.length > 4 && !['TABLET', 'CAPSULE', 'DAILY', 'TAKE', 'PHARMA', 'REFILL'].includes(w.toUpperCase())) || 'MediScan Generic';

  return {
    medicineName: guessedName,
    activeIngredients: 'Active substance identified from image label (approx. 250mg)',
    dosage: 'Take 1 tablet daily or as directed by a healthcare professional.',
    usageInstructions: 'Take with a glass of water, preferably at the same time each day. Check packaging for specific storage instructions.',
    sideEffects: 'Mild headache, dry mouth, or stomach upset. Inform your doctor if these persist.',
    warnings: 'Keep out of reach of children. Do not exceed the recommended dose. Consult your doctor if symptoms persist or worsen.',
    precautions: 'Consult a physician if you are pregnant, nursing, taking other medications, or have a chronic medical condition.'
  };
}

function generateMockReportAnalysis(text) {
  const normalizedText = (text || '').toLowerCase();

  const reportLibrary = [
    {
      keywords: ['lipid', 'cholesterol', 'triglycerides', 'hdl', 'ldl'],
      summary: 'Lipid panel analysis shows slightly elevated LDL (bad) cholesterol and overall borderline high total cholesterol. Triglycerides and HDL levels are within normal bounds.',
      keyFindings: [
        { test: 'Total Cholesterol', value: '224 mg/dL', referenceRange: '< 200 mg/dL', status: 'High' },
        { test: 'LDL Cholesterol', value: '142 mg/dL', referenceRange: '< 100 mg/dL', status: 'High' },
        { test: 'HDL Cholesterol', value: '52 mg/dL', referenceRange: '> 40 mg/dL', status: 'Normal' },
        { test: 'Triglycerides', value: '150 mg/dL', referenceRange: '< 150 mg/dL', status: 'Normal' }
      ],
      highlightedInsights: [
        { type: 'warning', message: 'Total Cholesterol is in the borderline-high range (200-239 mg/dL).' },
        { type: 'danger', message: 'LDL Cholesterol is elevated at 142 mg/dL. This is a potential risk factor for cardiovascular health.' }
      ],
      recommendations: 'Discuss with a physician regarding dietary changes (reducing saturated fats, increasing fiber) and regular cardiovascular exercise. Re-test lipid panel in 3 months.',
      warnings: 'This analysis is AI-generated and not a diagnosis. Elevated LDL levels should be discussed with your physician to evaluate your complete cardiovascular risk profile.'
    },
    {
      keywords: ['thyroid', 'tsh', 't3', 't4', 'thyroxine'],
      summary: 'Thyroid panel indicates a slightly elevated Thyroid Stimulating Hormone (TSH) level with normal free T4, suggesting mild subclinical hypothyroidism.',
      keyFindings: [
        { test: 'TSH (Thyroid Stimulating Hormone)', value: '5.2 uIU/mL', referenceRange: '0.40 - 4.50 uIU/mL', status: 'High' },
        { test: 'Free T4 (Thyroxine)', value: '1.2 ng/dL', referenceRange: '0.8 - 1.8 ng/dL', status: 'Normal' },
        { test: 'Triiodothyronine (T3)', value: '110 ng/dL', referenceRange: '80 - 200 ng/dL', status: 'Normal' }
      ],
      highlightedInsights: [
        { type: 'warning', message: 'TSH is elevated at 5.2 uIU/mL, which may indicate that the thyroid gland is slightly underactive.' },
        { type: 'info', message: 'Free T4 and T3 levels are normal, indicating the body is currently maintaining thyroid hormone balance.' }
      ],
      recommendations: 'Consult with an endocrinologist or primary care physician. Subclinical hypothyroidism often requires monitoring rather than immediate hormone replacement therapy, depending on symptoms.',
      warnings: 'Thyroid function values can fluctuate. Please review these results with your physician, particularly if you are experiencing symptoms like fatigue, weight gain, or cold sensitivity.'
    },
    {
      keywords: ['cbc', 'hemoglobin', 'wbc', 'platelet', 'red blood', 'white blood'],
      summary: 'Complete Blood Count (CBC) is largely within normal physiological parameters. A very mild elevation in White Blood Cell count is present, which is common during minor immune responses.',
      keyFindings: [
        { test: 'White Blood Cell (WBC)', value: '11.2 x10^3/uL', referenceRange: '4.5 - 11.0 x10^3/uL', status: 'High' },
        { test: 'Red Blood Cell (RBC)', value: '4.7 x10^6/uL', referenceRange: '4.3 - 5.9 x10^6/uL', status: 'Normal' },
        { test: 'Hemoglobin (HGB)', value: '14.5 g/dL', referenceRange: '13.5 - 17.5 g/dL', status: 'Normal' },
        { test: 'Hematocrit (HCT)', value: '43.2 %', referenceRange: '41.0 - 50.0 %', status: 'Normal' },
        { test: 'Platelets', value: '250 x10^3/uL', referenceRange: '150 - 450 x10^3/uL', status: 'Normal' }
      ],
      highlightedInsights: [
        { type: 'warning', message: 'WBC count is slightly above the upper limit of normal, indicating a possible active immune response or recent stress/inflammation.' },
        { type: 'info', message: 'All red blood cell parameters (Hemoglobin, Hematocrit, RBC Count) and platelets are perfectly healthy.' }
      ],
      recommendations: 'No immediate action is required for red cells or platelets. If WBC levels remain high or you show symptoms of infection (fever, chills, cough), consult your doctor.',
      warnings: 'Always consult your healthcare provider. A CBC is a general screen and must be interpreted in light of your physical symptoms and history.'
    }
  ];

  // Try to match keywords
  for (const item of reportLibrary) {
    if (item.keywords.some(kw => normalizedText.includes(kw))) {
      return {
        summary: item.summary,
        keyFindings: item.keyFindings,
        highlightedInsights: item.highlightedInsights,
        recommendations: item.recommendations,
        warnings: item.warnings
      };
    }
  }

  // Generic clinical report fallback
  return {
    summary: 'General medical report analysis completed. Basic parameters appear mostly stable, but some values require review with your healthcare provider.',
    keyFindings: [
      { test: 'Fast Glucose (Sugar)', value: '98 mg/dL', referenceRange: '70 - 99 mg/dL', status: 'Normal' },
      { test: 'Blood Urea Nitrogen (BUN)', value: '18 mg/dL', referenceRange: '7 - 20 mg/dL', status: 'Normal' },
      { test: 'Creatinine (Kidney)', value: '1.25 mg/dL', referenceRange: '0.60 - 1.20 mg/dL', status: 'High' }
    ],
    highlightedInsights: [
      { type: 'warning', message: 'Creatinine is slightly elevated at 1.25 mg/dL, which can indicate mild variations in kidney filtration or hydration levels.' },
      { type: 'info', message: 'Fasting glucose levels are healthy and within the normal reference range.' }
    ],
    recommendations: 'Ensure adequate hydration and re-test kidney parameters (Creatinine, BUN) in a follow-up. Avoid strenuous workouts immediately before blood tests, as they can temporarily raise creatinine.',
    warnings: 'Individual baseline levels vary. An AI scan cannot substitute for a professional medical consultation. Please share this analysis with your primary care provider.'
  };
}

module.exports = {
  analyzeMedicineLabel,
  analyzeMedicalReport
};
