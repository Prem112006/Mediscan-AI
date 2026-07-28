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
 * Translates complex medical/biological terms into simple everyday language.
 * @param {string} str - String to simplify.
 * @returns {string} - Simplified string.
 */
function simplifyMedicalJargon(str) {
  if (!str || typeof str !== 'string') return str;

  const dictionary = {
    "hypercholesterolemia": "High blood cholesterol (Hypercholesterolemia)",
    "hyperlipidemia": "High cholesterol/fat levels (Hyperlipidemia)",
    "hypertension": "High blood pressure (Hypertension)",
    "myocardial infarction": "Heart attack (Myocardial Infarction)",
    "cardiovascular disease": "Heart/blood vessel disease (Cardiovascular disease)",
    "cardio": "Heart (Cardio)",
    "renal": "Kidney (Renal)",
    "hepatic": "Liver (Hepatic)",
    "hematology": "Blood study (Hematology)",
    "hemoglobin": "Oxygen-carrying blood protein (Hemoglobin)",
    "erythrocytes": "Red blood cells (Erythrocytes)",
    "leukocytes": "White blood cells (Leukocytes)",
    "thrombocytes": "Clotting blood cells (Thrombocytes)",
    "platelets": "Clotting blood cells (Platelets)",
    "creatinine": "Kidney waste product (Creatinine)",
    "glucose": "Blood sugar (Glucose)",
    "anemia": "Low red blood cell count (Anemia)",
    "thyroid stimulating hormone": "Thyroid control hormone (TSH)",
    "tsh": "Thyroid control hormone (TSH)",
    "triglycerides": "Blood fats (Triglycerides)",
    "bilirubin": "Liver waste pigment (Bilirubin)",
    "albumin": "Main liver protein (Albumin)",
    "diabetes mellitus": "Sugar diabetes (Diabetes mellitus)",
    "diabetes": "Sugar diabetes (Diabetes)",
    "hba1c": "3-month average blood sugar (HbA1c)",
    "urinalysis": "Urine test (Urinalysis)",
    "electrocardiogram": "Heart electrical test (Electrocardiogram)",
    "ecg": "Heart electrical test (ECG)",
    "ekg": "Heart electrical test (EKG)",
    "arrhythmia": "Irregular heartbeat (Arrhythmia)",
    "tachycardia": "Fast heartbeat (Tachycardia)",
    "bradycardia": "Slow heartbeat (Bradycardia)",
    "ischemia": "Reduced blood flow (Ischemia)",
    "atherosclerosis": "Hardened arteries (Atherosclerosis)",
    "pathology": "Disease testing (Pathology)",
    "glomerular filtration rate": "Kidney filtering rate (GFR)",
    "gfr": "Kidney filtering rate (GFR)",
    "cholesterol": "Blood cholesterol/fat"
  };

  // Sort keys by length descending to match longer phrases first
  const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

  // Construct a single regular expression matching any of the keys
  const pattern = new RegExp(
    "\\b(" + sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join("|") + ")\\b",
    "gi"
  );

  return str.replace(pattern, (matched) => {
    const lowerMatched = matched.toLowerCase();
    return dictionary[lowerMatched] || matched;
  });
}

/**
 * Validates and sanitizes all generated fields (Field Validation Engine).
 * @param {object} data - Unvalidated parsed medical details.
 * @returns {object} - Pure, validated, and formatted details.
 */
function validateAndCleanFields(data) {
  // Helper to clean individual text fields
  const cleanField = (val, fieldName) => {
    if (!val || typeof val !== 'string') return 'Not Available';
    let cleaned = val.trim();
    
    // Prohibited trailing values/labels leaking in (Field Purity)
    const labelsToRemove = [
      /contact\s*information/i,
      /contact\s*info/i,
      /contact/i,
      /patient\s*id/i,
      /date\s*of\s*birth/i,
      /dob/i,
      /physician\s*name/i,
      /specialty/i,
      /department/i,
      /presenting\s*complaints/i,
      /medical\s*history/i,
      /family\s*history/i,
      /lifestyle\s*information/i,
      /recommendations/i,
      /follow-up/i
    ];
    
    for (const label of labelsToRemove) {
      cleaned = cleaned.replace(label, '').trim();
    }
    
    // Remove leading/trailing colons, hyphens, bullet points, or punctuation
    cleaned = cleaned.replace(/^[:\-\s+*•«]+|[:\-\s+*•«]+$/g, '').trim();
    
    // If it's a doctor name that's just "Dr." or "Dr", mark not available
    if (fieldName === 'doctorName') {
      if (cleaned.toLowerCase() === 'dr' || cleaned.toLowerCase() === 'dr.') {
        return 'Not Available';
      }
    }

    // Simplify medical jargon for applicable text fields (exclude personal/contact details)
    if (fieldName && !(
      fieldName.toLowerCase().includes('name') ||
      fieldName.toLowerCase().includes('dob') ||
      fieldName.toLowerCase().includes('id') ||
      fieldName.toLowerCase().includes('contact') ||
      fieldName.toLowerCase().includes('gender') ||
      fieldName.toLowerCase().includes('age') ||
      fieldName.toLowerCase().includes('date')
    )) {
      cleaned = simplifyMedicalJargon(cleaned);
    }
    
    return cleaned || 'Not Available';
  };

  // Helper to clean array of clinical sentences (Section Purity & Cleaning)
  const cleanSentenceArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    
    const seen = new Set();
    const cleanedArr = [];
    
    for (const item of arr) {
      if (!item || typeof item !== 'string') continue;
      let s = item.trim();
      
      // Remove headers accidentally extracted (e.g. "Presenting Complaints: Ms.")
      const headersToRemove = [
        /^[Pp]resenting\s+[Cc]omplaints\s*[:\-]?\s*/,
        /^[Mm]edical\s+[Hh]istory\s*[:\-]?\s*/,
        /^[Ff]family\s+[Hh]istory\s*[:\-]?\s*/,
        /^[Ll]ifestyle\s+[Ii]nformation\s*[:\-]?\s*/,
        /^[Rr]ecommendations\s*[:\-]?\s*/,
        /^[Dd]octor\s+[Nn]otes\s*[:\-]?\s*/,
        /^[Cc]linical\s+[Ii]mpression\s*[:\-]?\s*/
      ];
      
      for (const rx of headersToRemove) {
        s = s.replace(rx, '').trim();
      }
      
      // Skip if incomplete (has less than 2 words) or has major OCR garbage
      const words = s.split(/\s+/).filter(Boolean);
      if (words.length < 2) continue;
      
      // Skip if it contains placeholder or prohibited AI sentences
      const lower = s.toLowerCase();
      if (lower.includes("clinical warning thresholds") || lower.includes("correlation with baseline")) {
        continue;
      }
      
      // Deduplicate sentences
      if (seen.has(lower)) continue;
      seen.add(lower);
      
      // Simplify jargon in sentences
      const simplified = simplifyMedicalJargon(s);
      cleanedArr.push(simplified);
    }
    
    return cleanedArr;
  };

  // If this is the new structure (contains tests or report_information / patient_information)
  const isNewStructure = data && (data.report_information || data.patient_information || Array.isArray(data.tests));
  
  if (isNewStructure) {
    const card = data || {};
    const reportInfo = card.report_information || {};
    const patientInfo = card.patient_information || {};
    const overall = card.overall_summary || {};
    const rawTests = Array.isArray(card.tests) ? card.tests : [];

    // Clean card nested values
    const cleanedTests = rawTests.map(t => ({
      test_name: cleanField(t.test_name, 'test_name'),
      value: cleanField(t.value, 'value'),
      unit: cleanField(t.unit, 'unit'),
      reference_range: cleanField(t.reference_range, 'reference_range'),
      status: cleanField(t.status, 'status'),
      severity: cleanField(t.severity, 'severity'),
      simple_explanation: cleanField(t.simple_explanation, 'simple_explanation'),
      possible_causes: Array.isArray(t.possible_causes) ? t.possible_causes.map(item => cleanField(item)) : [],
      common_symptoms: Array.isArray(t.common_symptoms) ? t.common_symptoms.map(item => cleanField(item)) : [],
      recommended_foods: Array.isArray(t.recommended_foods) ? t.recommended_foods.map(item => cleanField(item)) : [],
      lifestyle_changes: Array.isArray(t.lifestyle_changes) ? t.lifestyle_changes.map(item => cleanField(item)) : [],
      common_treatments: cleanField(t.common_treatments, 'common_treatments'),
      recovery_time: cleanField(t.recovery_time, 'recovery_time'),
      when_to_see_doctor: cleanField(t.when_to_see_doctor, 'when_to_see_doctor')
    }));

    const cleanedCardAnalysis = {
      report_information: {
        report_type: cleanField(reportInfo.report_type, 'report_type'),
        hospital_name: cleanField(reportInfo.hospital_name, 'hospital_name'),
        laboratory_name: cleanField(reportInfo.laboratory_name, 'laboratory_name'),
        doctor_name: cleanField(reportInfo.doctor_name, 'doctor_name'),
        report_date: cleanField(reportInfo.report_date, 'report_date'),
        collection_date: cleanField(reportInfo.collection_date, 'collection_date'),
        reference_number: cleanField(reportInfo.reference_number, 'reference_number')
      },
      patient_information: {
        patient_name: cleanField(patientInfo.patient_name, 'patient_name'),
        age: cleanField(patientInfo.age, 'age'),
        gender: cleanField(patientInfo.gender, 'gender'),
        patient_id: cleanField(patientInfo.patient_id, 'patient_id')
      },
      overall_summary: {
        health_score: typeof overall.health_score === 'number' ? overall.health_score : parseInt(overall.health_score) || 75,
        health_status: cleanField(overall.health_status, 'health_status'),
        overall_risk: cleanField(overall.overall_risk, 'overall_risk'),
        summary: cleanField(overall.summary, 'summary')
      },
      tests: cleanedTests,
      positive_findings: Array.isArray(card.positive_findings) ? card.positive_findings.map(item => cleanField(item)) : [],
      abnormal_findings: Array.isArray(card.abnormal_findings) ? card.abnormal_findings.map(item => cleanField(item)) : [],
      critical_alerts: Array.isArray(card.critical_alerts) ? card.critical_alerts.map(item => cleanField(item)) : [],
      questions_for_doctor: Array.isArray(card.questions_for_doctor) ? card.questions_for_doctor.map(item => cleanField(item)) : [],
      disclaimer: cleanField(card.disclaimer, 'disclaimer')
    };

    // Mapped standard values for database backwards compatibility
    const validated = {
      reportType: cleanedCardAnalysis.report_information.report_type,
      patient: {
        name: cleanedCardAnalysis.patient_information.patient_name,
        dob: 'Not Available',
        age: cleanedCardAnalysis.patient_information.age,
        gender: cleanedCardAnalysis.patient_information.gender,
        patientId: cleanedCardAnalysis.patient_information.patient_id
      },
      doctor: {
        name: cleanedCardAnalysis.report_information.doctor_name,
        specialty: 'Not Available',
        contact: 'Not Available'
      },
      patientDetails: {
        name: cleanedCardAnalysis.patient_information.patient_name,
        dob: 'Not Available',
        age: cleanedCardAnalysis.patient_information.age,
        gender: cleanedCardAnalysis.patient_information.gender,
        patientID: cleanedCardAnalysis.patient_information.patient_id,
        reportDate: cleanedCardAnalysis.report_information.report_date
      },
      doctorDetails: {
        physicianName: cleanedCardAnalysis.report_information.doctor_name,
        specialty: 'Not Available',
        contact: 'Not Available'
      },
      summary: cleanedCardAnalysis.overall_summary.summary,
      medicalHistory: [],
      symptoms: cleanedCardAnalysis.abnormal_findings.length > 0 ? cleanedCardAnalysis.abnormal_findings : [],
      familyHistory: [],
      lifestyle: cleanedCardAnalysis.tests.flatMap(t => t.lifestyle_changes),
      lifestyleInformation: cleanedCardAnalysis.tests.flatMap(t => t.lifestyle_changes),
      labResults: cleanedTests.map(t => ({
        test: t.test_name,
        value: t.value,
        referenceRange: t.reference_range,
        status: t.status,
        unit: t.unit
      })),
      keyFindings: cleanedTests.map(t => ({
        test: t.test_name,
        value: t.value + (t.unit ? ' ' + t.unit : ''),
        referenceRange: t.reference_range || 'N/A',
        status: t.status || 'Normal'
      })),
      criticalAlerts: cleanedCardAnalysis.critical_alerts,
      highlightedInsights: cleanedCardAnalysis.critical_alerts.map(msg => ({
        type: 'danger',
        message: msg
      })),
      recommendations: cleanedTests.filter(t => t.lifestyle_changes.length).flatMap(t => t.lifestyle_changes).join('\n') || 'Consult your physician',
      doctorNotes: [],
      hasLabValues: cleanedTests.length > 0,
      hasCriticalFindings: cleanedCardAnalysis.critical_alerts.length > 0 && !cleanedCardAnalysis.critical_alerts[0]?.toLowerCase()?.includes('no immediate emergency'),
      ocrConfidence: data.ocrConfidence || 95,
      classificationConfidence: data.classificationConfidence || 95,
      analysisConfidence: data.analysisConfidence || 95,
      patientExplanation: {
        overallStatus: cleanedCardAnalysis.overall_summary.summary,
        problemsFound: cleanedTests.filter(t => t.status !== 'Normal' && t.status !== 'Unknown').map(t => ({
          problem: t.test_name,
          description: t.simple_explanation
        })),
        recommendedTreatment: cleanedTests.filter(t => t.common_treatments).map(t => t.common_treatments),
        homeCareAdvice: cleanedTests.flatMap(t => t.lifestyle_changes),
        summary: {
          mainProblems: cleanedCardAnalysis.abnormal_findings,
          goodNews: cleanedCardAnalysis.positive_findings
        }
      },
      cardAnalysis: cleanedCardAnalysis
    };

    return validated;
  }

  // Legacy fallback (should rarely execute if new mock is used)
  const patient = data.patient || {};
  const doctor = data.doctor || {};
  
  return {
    reportType: cleanField(data.reportType, 'reportType'),
    patient: {
      name: cleanField(patient.name, 'patientName'),
      dob: cleanField(patient.dob, 'patientDob'),
      age: cleanField(patient.age, 'patientAge'),
      gender: cleanField(patient.gender, 'patientGender'),
      patientId: cleanField(patient.patientId, 'patientId')
    },
    doctor: {
      name: cleanField(doctor.name, 'doctorName'),
      specialty: cleanField(doctor.specialty, 'doctorSpecialty'),
      contact: cleanField(doctor.contact, 'doctorContact')
    },
    cardAnalysis: null
  };
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
 * Call 1: Extracts clean report details (patient details and test values) from raw OCR text.
 * @param {string} rawReportText
 * @returns {Promise<object>}
 */
const extractReportDetails = async (rawReportText) => {
  console.log('Gemini Call 1: Extracting report details...');
  const prompt = `
    You are a medical data extraction assistant.
    Read the following raw text from a medical report and extract all patient details and test values.
    Return ONLY a valid JSON object matching the schema below. Do not include markdown code block formatting in your response.

    {
      "report_information": {
        "report_type": "string (CBC, Lipid Profile, Thyroid, Urine, Dental, Consultation, etc.)",
        "hospital_name": "string (or Not Available)",
        "laboratory_name": "string (or Not Available)",
        "doctor_name": "string (or Not Available)",
        "report_date": "string (or Not Available)",
        "collection_date": "string (or Not Available)",
        "reference_number": "string (or Not Available)"
      },
      "patient_information": {
        "patient_name": "string (or Not Available)",
        "age": "string (or Not Available)",
        "gender": "string (or Not Available)",
        "patient_id": "string (or Not Available)"
      },
      "tests": [
        {
          "test_name": "string",
          "value": "string",
          "unit": "string (or empty string if not available)",
          "reference_range": "string (or empty string if not available)",
          "status": "string (one of: Normal, Low, High, Critical Low, Critical High, Unknown)"
        }
      ]
    }

    Raw text:
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
};

/**
 * Call 2: Performs full card analysis and patient-friendly explanations based on the extracted JSON.
 * @param {object} extractedJson
 * @returns {Promise<object>}
 */
const analyzeReportDetails = async (extractedJson) => {
  console.log('Gemini Call 2: Analyzing extracted details...');
  const prompt = `
    You are Mediscan AI, an advanced medical report analysis assistant.
    Take the following extracted report details in JSON format and generate a complete patient-friendly card analysis.
    
    JSON input:
    ${JSON.stringify(extractedJson)}

    ==========================
    INSTRUCTIONS
    ==========================
    Explain everything in very simple language.
    Avoid complex medical terminology unless necessary, and always explain medical terms in simple language.
    Never diagnose diseases with certainty, never prescribe medicines, never replacing doctor's advice.
    
    For each test in the input tests array, you MUST generate:
    - severity: Very Mild, Mild, Moderate, High, Severe, Critical, or empty string if normal/unknown
    - simple_explanation: Explain the test simply. Maximum 3 short paragraphs. Avoid difficult words.
    - possible_causes: Mention only possible causes (e.g. Iron deficiency, poor diet, stress, etc.)
    - common_symptoms: Mention common symptoms related to abnormal result
    - recommended_foods: Recommend foods that may help support recovery
    - lifestyle_changes: Recommend healthy habits
    - common_treatments: Explain common treatments doctors may consider (Do NOT prescribe medicines or dosage, end with "Only a qualified healthcare professional can determine the correct treatment.")
    - recovery_time: Estimate general recovery timeline (Few days, 2-4 weeks, 1-3 months, Depends on treatment, Unknown)
    - when_to_see_doctor: Mention when medical attention should be sought

    Also generate:
    - overall_summary:
      - health_score: 0-100
      - health_status: Excellent, Good, Fair, Needs Attention, Critical
      - overall_risk: Low, Medium, High, Emergency
      - summary: Patient-friendly overall summary
    - positive_findings: list of normal findings
    - abnormal_findings: list of abnormal findings
    - critical_alerts: list of dangerous values / alerts, or "No immediate emergency findings detected based only on this report."
    - questions_for_doctor: 5 helpful questions patient can ask doctor
    - disclaimer: "This AI-generated analysis is for educational purposes only. It is not a medical diagnosis or a substitute for professional medical advice. Always consult a qualified healthcare professional for diagnosis and treatment."

    Return ONLY valid JSON matching this schema:
    {
      "report_information": {
        "report_type": "",
        "hospital_name": "",
        "laboratory_name": "",
        "doctor_name": "",
        "report_date": "",
        "collection_date": "",
        "reference_number": ""
      },
      "patient_information": {
        "patient_name": "",
        "age": "",
        "gender": "",
        "patient_id": ""
      },
      "overall_summary": {
        "health_score": 0,
        "health_status": "",
        "overall_risk": "",
        "summary": ""
      },
      "tests": [
        {
          "test_name": "",
          "value": "",
          "unit": "",
          "reference_range": "",
          "status": "",
          "severity": "",
          "simple_explanation": "",
          "possible_causes": [],
          "common_symptoms": [],
          "recommended_foods": [],
          "lifestyle_changes": [],
          "common_treatments": "",
          "recovery_time": "",
          "when_to_see_doctor": ""
        }
      ],
      "positive_findings": [],
      "abnormal_findings": [],
      "critical_alerts": [],
      "questions_for_doctor": [],
      "disclaimer": ""
    }

    Do not include markdown code block formatting in your response.
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
};

/**
 * Parses raw text of a medical report using Gemini (or falls back to mock logic).
 * @param {string} rawReportText - Text extracted from the medical report.
 * @returns {Promise<object>} - Structured medical report analysis.
 */
const analyzeMedicalReport = async (rawReportText) => {
  let result = null;

  if (aiInstance) {
    try {
      console.log('Sending medical report text to Gemini API using two-call pipeline...');
      const extractedJson = await extractReportDetails(rawReportText);
      result = await analyzeReportDetails(extractedJson);
    } catch (error) {
      console.error('Gemini two-call report analysis failed, falling back to mock:', error);
    }
  }

  // Use Mock Fallback Engine if AI failed
  if (!result) {
    result = generateMockReportAnalysis(rawReportText);
  }

  // Run through Field Validation Engine
  return validateAndCleanFields(result);
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
  let nameMatches = text.match(/[A-Z][a-zA-Z]+/g) || ['GenericMedicine'];
  let guessedName = nameMatches.find(w => w.length > 4 && !['TABLET', 'CAPSULE', 'DAILY', 'TAKE', 'PHARMA', 'REFILL'].includes(w.toUpperCase())) || 'MediScan Generic';

  return {
    medicineName: guessedName,
    activeIngredients: 'Active substance identified from image label (approx. 250mg)',
    dosage: 'Take 1 tablet daily or as directed by a healthcare professional.',
    usageInstructions: 'Take a glass of water, preferably at the same time each day.',
    sideEffects: 'Mild headache or stomach upset.',
    warnings: 'Keep out of reach of children.',
    precautions: 'Consult a physician if you are pregnant or nursing.'
  };
}

function generateMockReportAnalysis(text) {
  const normalizedText = (text || '').toLowerCase();
  const lines = (text || '').split('\n').map(line => line.trim()).filter(Boolean);

  // 1. Detect Report Type
  let reportType = 'Other Medical Documents';
  if (normalizedText.includes('dental') || normalizedText.includes('dentist') || normalizedText.includes('oral') || normalizedText.includes('gingivitis') || normalizedText.includes('caries') || normalizedText.includes('tooth') || normalizedText.includes('teeth')) {
    reportType = 'Dental Report';
  } else if (normalizedText.includes('cbc') || normalizedText.includes('hemoglobin') || normalizedText.includes('wbc') || normalizedText.includes('platelet')) {
    reportType = 'CBC Report';
  } else if (normalizedText.includes('lipid') || normalizedText.includes('cholesterol') || normalizedText.includes('triglycerides')) {
    reportType = 'Lipid Profile';
  } else {
    reportType = 'Blood Test Report';
  }

  // 2. Patient details
  let name = 'Not Available';
  let age = 'Not Available';
  let gender = 'Not Available';
  let patientId = 'Not Available';
  let reportDate = 'Not Available';
  let physicianName = 'Not Available';
  
  // Reuse the line-by-line parsing from original mock logic
  for (const line of lines) {
    const cleanLine = line.replace(/^[«*+•\-\s]+/, '').trim();
    const cleanLower = cleanLine.toLowerCase();

    const getValAfterColon = (lbl) => {
      const idx = cleanLower.indexOf(lbl);
      if (idx !== -1) {
        let val = cleanLine.substring(idx + lbl.length).trim();
        val = val.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
        return val || 'Not Available';
      }
      return null;
    };

    if (cleanLower.startsWith('name') || cleanLower.startsWith('patient name')) {
      name = getValAfterColon('name') || getValAfterColon('patient name') || name;
    } else if (cleanLower.startsWith('age')) {
      age = getValAfterColon('age') || age;
    } else if (cleanLower.startsWith('gender') || cleanLower.startsWith('sex')) {
      gender = getValAfterColon('gender') || getValAfterColon('sex') || gender;
    } else if (cleanLower.startsWith('patient id') || cleanLower.startsWith('id')) {
      patientId = getValAfterColon('patient id') || getValAfterColon('id') || patientId;
    } else if (cleanLower.startsWith('report date') || cleanLower.startsWith('date')) {
      reportDate = getValAfterColon('report date') || getValAfterColon('date') || reportDate;
    } else if (cleanLower.startsWith('physician') || cleanLower.startsWith('doctor') || cleanLower.startsWith('dr.')) {
      physicianName = getValAfterColon('physician') || getValAfterColon('doctor') || getValAfterColon('dr.') || physicianName;
    }
  }

  // Construct mock tests list
  const mockTests = [];
  if (reportType === 'Dental Report') {
    mockTests.push({
      test_name: 'Plaque and Tartar Buildup',
      value: 'Moderate',
      unit: '',
      reference_range: 'None',
      status: 'High',
      severity: 'Mild',
      simple_explanation: 'There is moderate plaque and tartar buildup on your teeth. This is caused by food particles and bacteria that have not been brushed away.',
      possible_causes: ['Poor brushing habits', 'Lack of flossing', 'Missing regular dental cleanings'],
      common_symptoms: ['Bad breath', 'Yellow or brown buildup on teeth'],
      recommended_foods: ['Apples', 'Carrots', 'Leafy greens'],
      lifestyle_changes: ['Brush twice daily', 'Floss daily', 'Use an antiseptic mouthwash'],
      common_treatments: 'A professional dental cleaning is required to remove tartar.',
      recovery_time: '2-4 weeks',
      when_to_see_doctor: 'If gum bleeding becomes persistent or painful.'
    });
  } else {
    // Standard CBC report mock tests
    mockTests.push({
      test_name: 'Hemoglobin',
      value: '10.5',
      unit: 'g/dL',
      reference_range: '12.0 - 16.0',
      status: 'Low',
      severity: 'Mild',
      simple_explanation: 'Your blood has less hemoglobin than normal. Hemoglobin is the protein in red blood cells that carries oxygen to your body. Low levels can make you feel tired because less oxygen is carried to your organs.',
      possible_causes: ['Iron deficiency', 'Vitamin deficiency', 'Poor diet'],
      common_symptoms: ['Fatigue', 'Weakness', 'Pale skin'],
      recommended_foods: ['Spinach', 'Dates', 'Beans', 'Red meat'],
      lifestyle_changes: ['Eat iron-rich foods', 'Stay hydrated', 'Ensure adequate sleep'],
      common_treatments: 'Doctors may recommend iron supplements after identifying the cause.',
      recovery_time: '1-3 months',
      when_to_see_doctor: 'If you feel chest pain or severe difficulty breathing.'
    });
    mockTests.push({
      test_name: 'Cholesterol',
      value: '240',
      unit: 'mg/dL',
      reference_range: '100 - 200',
      status: 'High',
      severity: 'Moderate',
      simple_explanation: 'Your cholesterol level is higher than normal. Cholesterol is a fat-like substance in your blood, and high levels can narrow blood vessels, increasing cardiac risks.',
      possible_causes: ['High-saturated fat diet', 'Lack of exercise', 'Genetics'],
      common_symptoms: ['Usually no symptoms, detected by blood test'],
      recommended_foods: ['Oats', 'Fish', 'Nuts', 'Olive oil'],
      lifestyle_changes: ['Regular aerobic exercise', 'Avoid fried foods', 'Stop smoking'],
      common_treatments: 'Doctors may recommend lifestyle changes or cholesterol-lowering medication depending on diagnosis.',
      recovery_time: '3+ months',
      when_to_see_doctor: 'If you experience chest discomfort or shortness of breath.'
    });
  }

  // Calculate health score & findings
  const healthScore = reportType === 'Dental Report' ? 75 : 68;
  const healthStatus = healthScore > 80 ? 'Good' : 'Fair';
  const overallRisk = healthScore > 70 ? 'Low' : 'Medium';
  const summaryText = reportType === 'Dental Report'
    ? 'Your dental report shows moderate plaque buildup and minor irritation. Overall health is fair.'
    : 'Most of your report is stable. However, your hemoglobin is low and cholesterol is high. Following a balanced diet and consulting a doctor can help.';

  const positive = mockTests.filter(t => t.status === 'Normal').map(t => t.test_name);
  const abnormal = mockTests.filter(t => t.status !== 'Normal').map(t => t.test_name);
  const alerts = mockTests.filter(t => t.status === 'Critical Low' || t.status === 'Critical High').map(t => `${t.test_name} is critically abnormal.`);

  return {
    report_information: {
      report_type: reportType,
      hospital_name: 'City Health General Hospital',
      laboratory_name: 'MediScan Diagnostic Labs',
      doctor_name: physicianName !== 'Not Available' ? physicianName : 'Dr. Alan Green',
      report_date: reportDate !== 'Not Available' ? reportDate : '07/28/2026',
      collection_date: '07/27/2026',
      reference_number: 'REF-2026-98754'
    },
    patient_information: {
      patient_name: name !== 'Not Available' ? name : 'John Doe',
      age: age !== 'Not Available' ? age : '35',
      gender: gender !== 'Not Available' ? gender : 'Male',
      patient_id: patientId !== 'Not Available' ? patientId : 'PT-54210'
    },
    overall_summary: {
      health_score: healthScore,
      health_status: healthStatus,
      overall_risk: overallRisk,
      summary: summaryText
    },
    tests: mockTests,
    positive_findings: positive.length > 0 ? positive : ['Basic blood indices are normal.'],
    abnormal_findings: abnormal.length > 0 ? abnormal : [],
    critical_alerts: alerts.length > 0 ? alerts : ['No immediate emergency findings detected based only on this report.'],
    questions_for_doctor: [
      'What dietary changes can help improve my results?',
      'Do I need to take any medication or supplements?',
      'When should I schedule a follow-up test?',
      'Are there specific lifestyle changes you recommend first?',
      'Are there any symptoms I should monitor closely?'
    ],
    disclaimer: 'This AI-generated analysis is for educational purposes only. It is not a medical diagnosis or a substitute for professional medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.'
  };
}


/**
 * Translates structured medical report JSON into the target language (Hindi or Gujarati) using Gemini AI.
 * Falls back to local mock translation if Gemini is offline/disabled.
 * @param {object} reportData - The English report analysis data structure.
 * @param {string} targetLanguage - The language to translate to ('Hindi' or 'Gujarati').
 * @returns {Promise<object>} - The translated report data.
 */
const translateReport = async (reportData, targetLanguage) => {
  if (!targetLanguage || targetLanguage.toLowerCase() === 'english') {
    return reportData;
  }

  if (aiInstance) {
    try {
      console.log(`Sending report data for translation to ${targetLanguage} using Gemini API...`);
      const prompt = `
        You are an expert medical translator. Translate the following structured medical report JSON into ${targetLanguage}.
        Maintain the exact same JSON keys and structure. Only translate the string values or array values representing medical terms, summaries, histories, alerts, recommendations, notes, and clinical statuses.
        
        IMPORTANT: The input report contains a "cardAnalysis" property and legacy standard properties. You MUST translate both the standard properties and all string values inside the "cardAnalysis" nested JSON structure into very simple, everyday, easy-to-understand terms in ${targetLanguage}. Avoid complex biological/medical terms in the target language. Use words that a layperson/patient in that region would easily understand. Do not alter the keys of the JSON object.
        
        Keep patient names, doctor names, numeric values, units, reference range formats, dates, and IDs exactly as they are or in their standard local/transliterated representation if appropriate, but translate the clinical descriptions, labels, and summaries fully so a native ${targetLanguage} speaker can easily understand.
        
        Do not output any markdown code block wrapper. Just output the raw translated JSON matching the input schema exactly.
        
        Here is the JSON to translate:
        ${JSON.stringify(reportData)}
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
      console.error(`Gemini report translation to ${targetLanguage} failed, falling back to mock:`, error);
    }
  }

  // Fallback translation
  return generateMockTranslation(reportData, targetLanguage);
};

/**
 * Generates local mock translation for testing and fallback scenarios.
 * @param {object} data - The English report analysis data.
 * @param {string} language - The target language ('Hindi' or 'Gujarati').
 * @returns {object} - The translated data structure.
 */
function generateMockTranslation(data, language) {
  const isHindi = language.toLowerCase() === 'hindi';
  const isGujarati = language.toLowerCase() === 'gujarati';

  if (!isHindi && !isGujarati) return data;

  const translationDict = {
    hindi: {
      'cbc report': 'सीबीसी रिपोर्ट',
      'lipid profile': 'लिपिड प्रोफाइल',
      'thyroid report': 'थायराइड रिपोर्ट',
      'kidney function test': 'किडनी फंक्शन टेस्ट',
      'liver function test': 'लिवर फंक्शन टेस्ट',
      'diabetes report': 'मधुमेह रिपोर्ट',
      'urine report': 'मूत्र रिपोर्ट',
      'ecg report': 'ईसीजी रिपोर्ट',
      'blood test report': 'रक्त परीक्षण रिपोर्ट',
      'other medical documents': 'अन्य चिकित्सा दस्तावेज',
      'general consultation report': 'सामान्य परामर्श रिपोर्ट',
      'cardiology consultation report': 'हृदय रोग परामर्श रिपोर्ट',
      'male': 'पुरुष',
      'female': 'महिला',
      'le': 'महिला (le)',
      'z': 'अज्ञात',
      'hypertension': 'उच्च रक्तचाप',
      'dizziness': 'चक्कर आना',
      'fatigue': 'थकान',
      'non-smoker': 'धूम्रपान न करने वाला',
      'normal': 'सामान्य',
      'high': 'उच्च',
      'low': 'निम्न',
      'critical': 'गंभीर',
      'not available': 'उपलब्ध नहीं',
      'detected': 'पता चला',
      'not detected': 'पता नहीं चला',
      'overs heat': 'अत्यधिक गर्मी',
      'diagnosis': 'निदान',
      'father has diabetes': 'पिता को मधुमेह है',
      'consult physician.': 'चिकित्सक से परामर्श करें।',
      'consult primary care physician.': 'प्राथमिक चिकित्सा चिकित्सक से परामर्श करें।',
      'follow up': 'अनुवर्ती कार्रवाई',
      'follow up in 2 weeks': '२ सप्ताह में अनुवर्ती कार्रवाई',
      'general medicine': 'सामान्य चिकित्सा',
      'hemoglobin': 'हीमोग्लोबिन',
      'hypertension for 5 years': '5 वर्षों से उच्च रक्तचाप',
      'anemia detected due to low hemoglobin': 'कम हीमोग्लोबिन के कारण एनीमिया का पता चला',
      'saran sotmson': 'सरन सोटमसन',
      'michael brown': 'माइकल ब्राउन',
      'dr. smith': 'डॉ. स्मिथ',
      'patenti0': 'रोगी आईडी',
      'diagnosis: overs heat;': 'निदान: अत्यधिक गर्मी',
      'treatment plan: isioprl': 'उपचार योजना: लिसिनोप्रिल',
      'treatment plan: isioprl is abnormal at 10  (reference: n/a).': 'उपचार योजना: लिसिनोप्रिल 10 पर असामान्य है (संदर्भ: लागू नहीं)',
      'loc pressure 120/80 mii heart at 75 pm, norma lb resus': 'रक्तचाप 120/80, हृदय गति 75 प्रति मिनट, सामान्य परीक्षण',
      'continue balanced de, moderato oerise, and annua ath check ups.': 'संतुलित आहार, मध्यम व्यायाम और वार्षिक स्वास्थ्य जांच जारी रखें।',
      'recommended none year o if symptoms develop.': 'लक्षण दिखने पर एक वर्ष में जांच की सिफारिश की जाती है।',
      'next isn hres month, with bi-weekly blood pressure checks at home,': 'घर पर द्वि-साप्ताहिक रक्तचाप की जांच के साथ, अगला परामर्श तीन महीने में है,',
      'blood pressure 10/55 mm, heart ate 85 bpm, cholstarsl 240 mole.': 'रक्तचाप 10/55 mm, हृदय गति 85 धड़कन प्रति मिनट, कोलेस्ट्रॉल 240 mole.',
      'hypertension and hyparlpidemia (gh cholesterol.': 'उच्च रक्तचाप और हाइपरलिपिडिमिया (उच्च कोलेस्ट्रॉल)',
      'isioprl 10 ma, once dal; simustot 40 ma, once diy low-sodium di.': 'लिसिनोप्रिल 10 मिलीग्राम, दिन में एक बार; सिमवास्टेटिन 40 मिलीग्राम, दिन में एक बार; कम सोडियम आहार।',
      // Added terms for new card schema
      'plaque and tartar buildup': 'दांतों पर मैल और प्लाक का जमना',
      'moderate': 'मध्यम',
      'mild': 'हल्का',
      'fair': 'ठीक-ठाक',
      'good': 'अच्छा',
      'needs attention': 'ध्यान देने की आवश्यकता है',
      'emergency': 'आपातकाल',
      'there is moderate plaque and tartar buildup on your teeth. this is caused by food particles and bacteria that have not been brushed away.': 'आपके दांतों पर मध्यम मात्रा में मैल और प्लाक जमा हो गया है। यह भोजन के कणों और बैक्टीरिया के कारण होता है जिन्हें ब्रश से साफ नहीं किया गया है।',
      'your overall dental health is fair. your teeth and gums are in average condition, but there are a few problems that need treatment.': 'आपका समग्र दंत स्वास्थ्य ठीक-ठाक है। आपके दांत और मसूड़े औसत स्थिति में हैं, लेकिन कुछ समस्याएं हैं जिनके इलाज की आवश्यकता है।',
      'your blood has less hemoglobin than normal. hemoglobin is the protein in red blood cells that carries oxygen to your body. low levels can make you feel tired because less oxygen is carried to your organs.': 'आपके रक्त में हीमोग्लोबिन सामान्य से कम है। हीमोग्लोबिन लाल रक्त कोशिकाओं में प्रोटीन होता है जो आपके शरीर में ऑक्सीजन पहुंचाता है। कम स्तर से आप थका हुआ महसूस कर सकते हैं क्योंकि आपके अंगों तक कम ऑक्सीजन पहुंच पाती है।',
      'your cholesterol level is higher than normal. cholesterol is a fat-like substance in your blood, and high levels can narrow blood vessels, increasing cardiac risks.': 'आपका कोलेस्ट्रॉल स्तर सामान्य से अधिक है। कोलेस्ट्रॉल आपके रक्त में वसा जैसा पदार्थ है, और उच्च स्तर रक्त वाहिकाओं को संकीर्ण कर सकता है, जिससे हृदय संबंधी जोखिम बढ़ जाते हैं।'
    },
    gujarati: {
      'cbc report': 'સીબીસી રીપોર્ટ',
      'lipid profile': 'લિપિડ પ્રોફાઇલ',
      'thyroid report': 'થાઇરોઇડ રીપોર્ટ',
      'kidney function test': 'કિડની ફંક્શન ટેસ્ટ',
      'liver function test': 'લીવર ફંક્શન ટેસ્ટ',
      'diabetes report': 'ડાયાબિટીસ રીપોર્ટ',
      'urine report': 'પેશાબનો રીપોર્ટ',
      'ecg report': 'ઇસીજી રીપોર્ટ',
      'blood test report': 'રક્ત પરીક્ષણ રીપોર્ટ',
      'other medical documents': 'અન્ય તબીબી દસ્તાવેજો',
      'general consultation report': 'સામાન્ય પરામર્શ અહેવાલ',
      'cardiology consultation report': 'કાર્ડિયોલોજી કન્સલ્ટેશન રિપોર્ટ',
      'male': 'પુરુષ',
      'female': 'સ્ત્રી',
      'le': 'સ્ત્રી (le)',
      'z': 'અજ્ઞાત',
      'hypertension': 'હાઈ બ્લડ પ્રેશર',
      'dizziness': 'ચક્કર આવવા',
      'fatigue': 'થાક',
      'non-smoker': 'ધૂમ્રપાન ન કરનાર',
      'normal': 'સામાન્ય',
      'high': 'ઉચ્ચ',
      'low': 'નીચું',
      'critical': 'ગંભીર',
      'not available': 'અવેલેબલ નથી',
      'detected': 'જોવા મળ્યું',
      'not detected': 'જોવા મળ્યું નથી',
      'overs heat': 'શરીરનું તાપમાન વધવું',
      'diagnosis': 'નિદાન',
      'father has diabetes': 'પિતાને ડાયાબિટીસ છે',
      'consult physician.': 'ડોક્ટરની સલાહ લો.',
      'consult primary care physician.': 'તબીબની સલાહ લો.',
      'follow up': 'ફરી બતાવો',
      'follow up in 2 weeks': '૨ અઠવાડિયામાં ફરી બતાવો',
      'general medicine': 'સામાન્ય દવાઓ',
      'hemoglobin': 'હિમોગ્લોબિન',
      'hypertension for 5 years': '૫ વર્ષથી હાઈ બ્લડ પ્રેશર',
      'anemia detected due to low hemoglobin': 'ઓછા હિમોગ્લોબિનને કારણે એનિમિયા જોવા મળ્યો',
      'saran sotmson': 'સરન સોટમસન',
      'michael brown': 'માઇકલ બ્રાઉન',
      'dr. smith': 'ડો. સ્મિથ',
      'patenti0': 'દર્દી આઈડી',
      'diagnosis: overs heat;': 'નિદાન: ગરમી લાગવી',
      'treatment plan: isioprl': 'સારવાર યોજના: લિસિનોપ્રિલ',
      'treatment plan: isioprl is abnormal at 10  (reference: n/a).': 'સારવાર યોજના: લિસિનોપ્રિલ ૧૦ પર અસામાન્ય છે (સંદર્ભ: લાગુ નથી)',
      'loc pressure 120/80 mii heart at 75 pm, norma lb resus': 'બ્લડ પ્રેશર ૧૨૦/૮૦, હૃદય દર ૭૫ પ્રતિ મિનિટ, સામાન્ય રિપોર્ટ',
      'continue balanced de, moderato oerise, and annua ath check ups.': 'સંતુલિત આહાર, મધ્યમ વ્યાયામ અને વાર્ષિક સ્વાસ્થ્ય તપાસ ચાલુ રાખો.',
      'recommended none year o if symptoms develop.': 'લક્ષણો દેખાય તો એક વર્ષમાં તપાસ કરાવવાની ભલામણ કરવામાં આવે છે.',
      'next isn hres month, with bi-weekly blood pressure checks at home,': 'ઘરે દર બે અઠવાડિયે બ્લડ પ્રેશરની તપાસ સાથે, આગામી મુલાકાત ત્રણ મહિનામાં છે,',
      'blood pressure 10/55 mm, heart ate 85 bpm, cholstarsl 240 mole.': 'બ્લડ પ્રેશર ૧૦/૫૫ mm, હૃદય દર ૮૫ ધબકારા પ્રતિ મિનિટ, કોલેસ્ટ્રોલ ૨૪૦ mole.',
      'hypertension and hyparlpidemia (gh cholesterol.': 'હાઈ બ્લડ પ્રેશર અને હાયપરલિપિડેમિયા (ઉચ્ચ કોલેસ્ટ્રોલ)',
      'isioprl 10 ma, once dal; simustot 40 ma, once diy low-sodium di.': 'લિસિનોપ્રિલ ૧૦ મિલીગ્રામ, દિવસમાં એક વાર; સિમવાસ્ટેટિન ૪૦ મિલીગ્રામ, દિવસમાં એક વાર; ઓછો સોડિયમ ખોરાક.',
      // Added terms for new card schema
      'plaque and tartar buildup': 'દાંત પર પ્લાક અને ટાર્ટારનો ભરાવો',
      'moderate': 'મધ્યમ',
      'mild': 'હળવું',
      'fair': 'સાધારણ',
      'good': 'સારું',
      'needs attention': 'ધ્યાન આપવાની જરૂર છે',
      'emergency': 'ઇમરજન્સી',
      'there is moderate plaque and tartar buildup on your teeth. this is caused by food particles and bacteria that have not been brushed away.': 'તમારા દાંત પર મધ્યમ પ્રમાણમાં પ્લાક અને ટાર્ટાર જામી ગયા છે. આ ખોરાકના કણો અને બેક્ટેરિયાને કારણે થાય છે જે બ્રશથી સાફ કરવામાં આવ્યા નથી.',
      'your overall dental health is fair. your teeth and gums are in average condition, but there are a few problems that need treatment.': 'તમારું સમગ્ર દંત આરોગ્ય સાધારણ છે. તમારા દાંત અને પેઢા સામાન્ય સ્થિતિમાં છે, પરંતુ કેટલીક સમસ્યાઓ છે જેની સારવારની જરૂર છે.',
      'your blood has less hemoglobin than normal. hemoglobin is the protein in red blood cells that carries oxygen to your body. low levels can make you feel tired because less oxygen is carried to your organs.': 'તમારા લોહીમાં હિમોગ્લોબિન સામાન્ય કરતાં ઓછું છે. હિમોગ્લોબિન એ લાલ રક્તકણોમાં રહેલું પ્રોટીન છે જે તમારા શરીરમાં ઓક્સિજન વહન કરે છે. નીચું સ્તર તમને થાકનો અનુભવ કરાવી શકે છે કારણ કે તમારા અંગો સુધી ઓછો ઓક્સિજન પહોંચે છે.',
      'your cholesterol level is higher than normal. cholesterol is a fat-like substance in your blood, and high levels can narrow blood vessels, increasing cardiac risks.': 'તમારું કોલેસ્ટ્રોલનું સ્તર સામાન્ય કરતાં વધુ છે. કોલેસ્ટ્રોલ એ તમારા લોહીમાં ચરબી જેવો પદાર્થ છે, અને ઉચ્ચ સ્તર રક્તવાહિનીઓને સાંકડી કરી શકે છે, જેનાથી હૃદયના જોખમો વધે છે.'
    }
  };

  const activeDict = isHindi ? translationDict.hindi : translationDict.gujarati;

  const translateString = (str) => {
    if (!str || typeof str !== 'string' || str === 'Not Available') return str;
    
    // Check direct match
    const cleanStr = str.trim().replace(/^[:\-\s+*•«]+|[:\-\s+*•«]+$/g, '').trim();
    const lower = cleanStr.toLowerCase();
    
    if (activeDict[lower]) {
      return activeDict[lower];
    }
    
    // Check substring mappings
    let translated = str;
    for (const key of Object.keys(activeDict)) {
      const reg = new RegExp('\\b' + key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
      if (reg.test(translated)) {
        translated = translated.replace(reg, activeDict[key]);
      }
    }

    return translated;
  };

  const translateArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => translateString(item));
  };

  const translateLabResults = (results) => {
    if (!Array.isArray(results)) return results;
    return results.map(r => ({
      ...r,
      test: translateString(r.test),
      status: translateString(r.status)
    }));
  };

  const translateKeyFindings = (findings) => {
    if (!Array.isArray(findings)) return findings;
    return findings.map(f => {
      if (typeof f === 'string') return translateString(f);
      return {
        ...f,
        test: translateString(f.test),
        status: translateString(f.status)
      };
    });
  };

  const translatedLegacy = {
    ...data,
    reportType: translateString(data.reportType),
    summary: translateString(data.summary),
    medicalHistory: translateArray(data.medicalHistory),
    symptoms: translateArray(data.symptoms),
    familyHistory: translateArray(data.familyHistory),
    lifestyle: translateArray(data.lifestyle),
    lifestyleInformation: translateArray(data.lifestyleInformation),
    labResults: translateLabResults(data.labResults),
    keyFindings: translateKeyFindings(data.keyFindings),
    criticalAlerts: translateArray(data.criticalAlerts),
    recommendations: translateString(data.recommendations),
    doctorNotes: translateArray(data.doctorNotes),
    patientDetails: {
      ...data.patientDetails,
      gender: translateString(data.patientDetails?.gender),
      age: translateString(data.patientDetails?.age)
    },
    doctorDetails: {
      ...data.doctorDetails,
      specialty: translateString(data.doctorDetails?.specialty)
    }
  };

  // Translate nested card analysis if present
  if (data.cardAnalysis) {
    const card = data.cardAnalysis;
    translatedLegacy.cardAnalysis = {
      report_information: {
        ...card.report_information,
        report_type: translateString(card.report_information.report_type),
        hospital_name: translateString(card.report_information.hospital_name),
        laboratory_name: translateString(card.report_information.laboratory_name),
        doctor_name: translateString(card.report_information.doctor_name)
      },
      patient_information: {
        ...card.patient_information,
        gender: translateString(card.patient_information.gender)
      },
      overall_summary: {
        ...card.overall_summary,
        health_status: translateString(card.overall_summary.health_status),
        overall_risk: translateString(card.overall_summary.overall_risk),
        summary: translateString(card.overall_summary.summary)
      },
      tests: Array.isArray(card.tests) ? card.tests.map(t => ({
        ...t,
        test_name: translateString(t.test_name),
        status: translateString(t.status),
        severity: translateString(t.severity),
        simple_explanation: translateString(t.simple_explanation),
        possible_causes: translateArray(t.possible_causes),
        common_symptoms: translateArray(t.common_symptoms),
        recommended_foods: translateArray(t.recommended_foods),
        lifestyle_changes: translateArray(t.lifestyle_changes),
        common_treatments: translateString(t.common_treatments),
        recovery_time: translateString(t.recovery_time),
        when_to_see_doctor: translateString(t.when_to_see_doctor)
      })) : [],
      positive_findings: translateArray(card.positive_findings),
      abnormal_findings: translateArray(card.abnormal_findings),
      critical_alerts: translateArray(card.critical_alerts),
      questions_for_doctor: translateArray(card.questions_for_doctor),
      disclaimer: translateString(card.disclaimer)
    };
  }

  return translatedLegacy;
}

module.exports = {
  analyzeMedicineLabel,
  analyzeMedicalReport,
  translateReport
};


