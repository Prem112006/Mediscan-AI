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
      
      cleanedArr.push(s);
    }
    
    return cleanedArr;
  };

  const patient = data.patient || {};
  const doctor = data.doctor || {};
  
  const validated = {
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
    medicalHistory: cleanSentenceArray(data.medicalHistory),
    symptoms: cleanSentenceArray(data.symptoms),
    familyHistory: cleanSentenceArray(data.familyHistory),
    lifestyleInformation: cleanSentenceArray(data.lifestyleInformation || data.lifestyle),
    labResults: Array.isArray(data.labResults) ? data.labResults : [],
    criticalAlerts: cleanSentenceArray(data.criticalAlerts),
    doctorNotes: cleanSentenceArray(data.doctorNotes),
    hasLabValues: !!data.hasLabValues,
    hasCriticalFindings: !!data.hasCriticalFindings,
    ocrConfidence: data.ocrConfidence || 95,
    classificationConfidence: data.classificationConfidence || 95,
    analysisConfidence: data.analysisConfidence || 95
  };

  // Map to legacy fields
  validated.patientDetails = {
    name: validated.patient.name,
    dob: validated.patient.dob,
    age: validated.patient.age,
    gender: validated.patient.gender,
    patientID: validated.patient.patientId,
    reportDate: cleanField(data.patientDetails?.reportDate || data.reportDate || data.patient?.reportDate, 'reportDate')
  };
  validated.doctorDetails = {
    physicianName: validated.doctor.name,
    specialty: validated.doctor.specialty,
    contact: validated.doctor.contact
  };
  validated.lifestyle = validated.lifestyleInformation;

  // Clean Recommendations
  let recsArr = cleanSentenceArray(
    Array.isArray(data.recommendations) 
      ? data.recommendations 
      : (typeof data.recommendations === 'string' ? data.recommendations.split('\n') : [])
  );
  
  if (recsArr.length === 0 || recsArr.some(r => r.toLowerCase().includes('no physician recommendations') || r.toLowerCase().includes('no clinical recommendations') || r.toLowerCase().includes('no recommendations'))) {
    validated.recommendations = "No physician recommendations are present in the uploaded report.";
  } else {
    validated.recommendations = recsArr.join('\n');
  }

  // --- KEY FINDINGS GENERATION RULE ---
  // Generate Key Findings by combining all clinical history, symptoms, family history, and lifestyle information
  const dynamicKeyFindings = [];
  validated.medicalHistory.forEach(item => {
    dynamicKeyFindings.push({ test: item, value: 'Detected', status: 'Normal', referenceRange: 'N/A' });
  });
  validated.symptoms.forEach(item => {
    dynamicKeyFindings.push({ test: item, value: 'Detected', status: 'Normal', referenceRange: 'N/A' });
  });
  validated.familyHistory.forEach(item => {
    dynamicKeyFindings.push({ test: item, value: 'Detected', status: 'Normal', referenceRange: 'N/A' });
  });
  validated.lifestyleInformation.forEach(item => {
    dynamicKeyFindings.push({ test: item, value: 'Detected', status: 'Normal', referenceRange: 'N/A' });
  });

  if (validated.hasLabValues && validated.labResults.length > 0) {
    validated.keyFindings = validated.labResults.map(r => ({
      test: r.test,
      value: r.value + (r.unit ? ' ' + r.unit : ''),
      referenceRange: r.referenceRange || 'N/A',
      status: r.status || 'Normal'
    }));
  } else {
    validated.keyFindings = dynamicKeyFindings.length > 0 ? dynamicKeyFindings : [{
      test: 'No specific findings were detected in the uploaded report.',
      value: 'N/A',
      referenceRange: 'N/A',
      status: 'Normal'
    }];
  }

  // Highlighted insights
  if (validated.criticalAlerts.length > 0 && !validated.criticalAlerts[0]?.toLowerCase()?.includes('no critical alerts')) {
    validated.highlightedInsights = validated.criticalAlerts.map(alert => ({
      type: 'danger',
      message: alert
    }));
  } else {
    validated.highlightedInsights = [{ type: 'info', message: 'No critical alerts detected.' }];
  }

  // Build Executive Summary
  let summary = `Document classification: ${validated.reportType}.`;
  if (validated.patient.name !== 'Not Available') {
    summary += ` The record pertains to patient ${validated.patient.name}.`;
  }
  if (validated.patient.age !== 'Not Available') {
    summary += ` Age: ${validated.patient.age}.`;
  }
  if (validated.hasLabValues) {
    summary += ` Laboratory parameters present: ${validated.labResults.map(r => `${r.test} (${r.value} ${r.unit || ''})`).join(', ')}.`;
  } else {
    summary += ` No laboratory test values are present in this document.`;
  }
  if (validated.doctorNotes.length > 0) {
    summary += ` Extracted physician remarks: ${validated.doctorNotes.join(' ')}`;
  }
  validated.summary = summary;

  return validated;
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
  let result = null;

  if (aiInstance) {
    try {
      console.log('Sending medical report text to Gemini API...');
      const prompt = `
        You are an AI Medical Report Analyzer for MediScan AI.

        Your job is to act strictly as an INFORMATION EXTRACTION SYSTEM. You are NOT a diagnostic AI, a treatment recommendation system, or a symptom interpretation system.

        ==================================================
        OCR PROCESSING & RECONSTRUCTION (STAGE 2)
        ==================================================
        Never use OCR line breaks to determine section boundaries. Always reconstruct the text into complete sentences before performing analysis. Semantic understanding must take priority over OCR formatting.
        Extract Patient Name (ONLY the name), Date of Birth (ONLY the date, e.g. 01/15/1989), and Doctor Name (ONLY the full name, e.g. Dr. Alan Green).

        ==================================================
        SECTION MAPPING ENGINE
        ==================================================
        Understand the semantic meaning of each complete sentence and assign it to the correct section.
        Do NOT split a single sentence across multiple sections.

        ==================================================
        CRITICAL RULE: NO GENERIC MEDICAL LANGUAGE
        ==================================================
        NEVER generate professional-sounding generic medical statements unless they are explicitly present in the uploaded report.
        Prohibited outputs include but are not limited to:
        - "No critical clinical warning thresholds were exceeded."
        - "Further correlation with baseline symptoms is advised."
        - "Management plan recommended based on our findings."
        - "Clinical parameters are stable."
        - "Additional monitoring is recommended."
        - "Laboratory values are within normal limits."

        If a statement is not explicitly written in the report, it MUST NOT appear in the output.

        ==================================================
        GOLDEN RULE: EXTRACTION OVER INTERPRETATION
        ==================================================
        DO NOT interpret. DO NOT assume. Only extract, classify, and organize the content of the uploaded report.

        ==================================================
        EXECUTIVE SUMMARY RULES
        ==================================================
        The Executive Summary MUST NOT contain generic medical advice, generic clinical conclusions, generic recommendations, or AI-generated medical interpretations.
        It may ONLY contain report type, patient info, factually present info, availability of lab findings, and notes explicitly written by the physician.

        ==================================================
        KEY FINDINGS Engine
        ==================================================
        - Cardiology: Clinical history, chest pain, palpitations, shortness of breath, family history, and lifestyle factors.
        - Blood: Biomarkers, reference ranges, and abnormal findings.
        - Prescription: Medicines, dosage, and frequency.
        - Radiology: Impression and findings.
        DO NOT copy Medical History and Symptoms into Key Findings. Key Findings should be AI-organized bullet points.
        For consultation reports, DO NOT display: "Detected", "Normal", "High", "Low", "Positive", "Negative". Use clean descriptive bullet-point sentences.

        ==================================================
        CLINICAL RECOMMENDATION ENGINE
        ==================================================
        Introductory statements like "The purpose of this report is to document the patient's cardiac health status and outline the management plan recommended based on our findings." are NOT recommendations. Do NOT include them under recommendations.
        Extract recommendations ONLY if they are explicitly written in the report (follow-up instructions, physician recommendations, or treatment instructions exist).
        If recommendations do not exist, return an empty array [].

        -------------------------------------------------
        JSON OUTPUT SCHEMA (STAGE 3)
        -------------------------------------------------
        Return ONLY valid JSON matching this schema:
        {
          "reportType": "string",
          "patient": {
            "name": "string",
            "dob": "string",
            "age": "string",
            "gender": "string",
            "patientId": "string"
          },
          "doctor": {
            "name": "string",
            "specialty": "string",
            "contact": "string"
          },
          "summary": "string",
          "medicalHistory": ["string"],
          "symptoms": ["string"],
          "familyHistory": ["string"],
          "lifestyleInformation": ["string"],
          "labResults": [
            {
              "test": "string",
              "value": "string",
              "referenceRange": "string",
              "status": "string",
              "unit": "string"
            }
          ],
          "keyFindings": ["string"],
          "criticalAlerts": ["string"],
          "recommendations": ["string"],
          "doctorNotes": ["string"],
          "hasLabValues": boolean,
          "hasCriticalFindings": boolean,
          "ocrConfidence": number,
          "classificationConfidence": number,
          "analysisConfidence": number
        }

        Here is the medical report text to analyze:
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
      
      console.log('--- STAGE 2: RAW GEMINI AI RESPONSE ---');
      console.log(responseText);
      console.log('---------------------------------------');

      result = JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Gemini report analysis failed, falling back to mock:', error);
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
  if (normalizedText.includes('dental')) {
    reportType = 'Dental Report';
  } else {
    const isConsultation = 
      normalizedText.includes('referring physician') ||
      normalizedText.includes('medical history') ||
      normalizedText.includes('presenting complaints') ||
      normalizedText.includes('chief complaint') ||
      normalizedText.includes('specialty') ||
      normalizedText.includes('consultation notes') ||
      normalizedText.includes('past history');

    if (isConsultation) {
      if (normalizedText.includes('cardio') || normalizedText.includes('heart') || normalizedText.includes('ecg') || normalizedText.includes('ekg')) {
        reportType = 'Cardiology Consultation Report';
      } else {
        reportType = 'General Consultation Report';
      }
    } else {
      const matchesKey = (kw) => {
        const regex = new RegExp('\\b' + kw + '\\b', 'i');
        return regex.test(normalizedText);
      };

      if (matchesKey('cbc') || matchesKey('hemoglobin') || matchesKey('wbc') || matchesKey('platelet') || matchesKey('hgb')) {
        reportType = 'CBC Report';
      } else if (matchesKey('lipid') || matchesKey('cholesterol') || matchesKey('triglycerides') || matchesKey('hdl') || matchesKey('ldl')) {
        reportType = 'Lipid Profile';
      } else if (matchesKey('thyroid') || matchesKey('tsh') || matchesKey('t3') || matchesKey('t4')) {
        reportType = 'Thyroid Report';
      } else if (matchesKey('creatinine') || matchesKey('bun') || matchesKey('urea') || matchesKey('kidney')) {
        reportType = 'Kidney Function Test';
      } else if (matchesKey('liver') || matchesKey('bilirubin') || matchesKey('albumin') || matchesKey('alt') || matchesKey('ast') || matchesKey('alp')) {
        reportType = 'Liver Function Test';
      } else if (matchesKey('diabetes') || matchesKey('glucose') || matchesKey('hba1c') || matchesKey('sugar')) {
        reportType = 'Diabetes Report';
      } else if (matchesKey('urine') || matchesKey('urinalysis')) {
        reportType = 'Urine Report';
      } else if (matchesKey('ecg') || matchesKey('ekg') || matchesKey('electrocardiogram')) {
        reportType = 'ECG Report';
      } else if (matchesKey('blood')) {
        reportType = 'Blood Test Report';
      }
    }
  }
  
  // Confidences (Separate metrics)
  let ocrConfidence = 95;
  let classificationConfidence = 95;
  let analysisConfidence = 95;

  if (lines.length < 5) {
    ocrConfidence = 80;
    analysisConfidence = 78;
  } else if (lines.length < 10) {
    ocrConfidence = 90;
    analysisConfidence = 88;
  } else {
    ocrConfidence = 96;
    analysisConfidence = 95;
  }

  // 2. Line-by-line helper to extract patient details safely
  let name = 'Not Available';
  let dob = 'Not Available';
  let age = 'Not Available';
  let gender = 'Not Available';
  let patientId = 'Not Available';
  let reportDate = 'Not Available';
  
  let physicianName = 'Not Available';
  let specialty = 'Not Available';
  let contact = 'Not Available';

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
      const val = getValAfterColon('name') || getValAfterColon('patient name');
      if (val && name === 'Not Available') name = val;
    } else if (cleanLower.startsWith('date of birth') || cleanLower.startsWith('dob') || cleanLower.startsWith('birth date')) {
      const val = getValAfterColon('date of birth') || getValAfterColon('dob') || getValAfterColon('birth date');
      if (val && dob === 'Not Available') dob = val;
    } else if (cleanLower.startsWith('age') || cleanLower.startsWith('age value')) {
      const val = getValAfterColon('age') || getValAfterColon('age value');
      if (val && age === 'Not Available') age = val;
    } else if (cleanLower.startsWith('gender') || cleanLower.startsWith('gander') || cleanLower.startsWith('sex')) {
      const val = getValAfterColon('gender') || getValAfterColon('gander') || getValAfterColon('sex');
      if (val && gender === 'Not Available') gender = val;
    } else if (cleanLower.startsWith('patient id') || cleanLower.startsWith('id') || cleanLower.startsWith('patient 0') || cleanLower.startsWith('patient0') || cleanLower.startsWith('patient  0')) {
      const val = getValAfterColon('patient id') || getValAfterColon('id') || getValAfterColon('patient 0') || getValAfterColon('patient0') || getValAfterColon('patient  0');
      if (val && patientId === 'Not Available') patientId = val;
    } else if (cleanLower.startsWith('date of report') || cleanLower.startsWith('report date') || cleanLower.startsWith('date')) {
      if (!cleanLower.includes('birth')) {
        const val = getValAfterColon('date of report') || getValAfterColon('report date') || getValAfterColon('date');
        if (val && reportDate === 'Not Available') reportDate = val;
      }
    } else if (cleanLower.startsWith('physician') || cleanLower.startsWith('doctor') || cleanLower.startsWith('dentist') || cleanLower.startsWith('dr.') || cleanLower.startsWith('dr ')) {
      const val = getValAfterColon('physician name') || getValAfterColon('doctor name') || getValAfterColon('physician') || getValAfterColon('doctor') || getValAfterColon('dentist') || getValAfterColon('dr.') || getValAfterColon('dr');
      if (val && physicianName === 'Not Available') {
        physicianName = val.startsWith('Dr.') || val.startsWith('Dr ') ? val : 'Dr. ' + val;
      }
    } else if (cleanLower.startsWith('specialty') || cleanLower.startsWith('department')) {
      const val = getValAfterColon('specialty') || getValAfterColon('department');
      if (val && specialty === 'Not Available') specialty = val;
    } else if (cleanLower.startsWith('contact') || cleanLower.startsWith('phone') || cleanLower.startsWith('email')) {
      const val = getValAfterColon('contact') || getValAfterColon('phone') || getValAfterColon('email');
      if (val && contact === 'Not Available') contact = val;
    }
  }

  // 3. Extract Lab Results dynamically (Stage 3 fallback)
  const isLabReport = 
    reportType.includes('CBC') ||
    reportType.includes('Lipid') ||
    reportType.includes('Thyroid') ||
    reportType.includes('Kidney') ||
    reportType.includes('Liver') ||
    reportType.includes('Diabetes') ||
    reportType.includes('Urine') ||
    reportType.includes('Blood') ||
    normalizedText.includes('cholesterol') ||
    normalizedText.includes('glucose') ||
    normalizedText.includes('hba1c') ||
    normalizedText.includes('bilirubin') ||
    normalizedText.includes('creatinine') ||
    normalizedText.includes('hemoglobin') ||
    normalizedText.includes('wbc') ||
    normalizedText.includes('platelet') ||
    normalizedText.includes('pathology') ||
    normalizedText.includes('clinical chemistry') ||
    normalizedText.includes('hematology') ||
    normalizedText.includes('serology');

  const labResults = [];
  const commonUnits = ['g/dl', 'mg/dl', 'ug/dl', 'ng/ml', 'uiuml', 'miu/l', 'mmol/l', 'umol/l', 'u/l', '%', 'fl', 'pg', '/ul', 'x10^3', 'x10^6', 'mql/l', 'g/l', 'mg/l'];

  if (isLabReport) {
    for (const line of lines) {
      const cleanLine = line.replace(/^[«*+•\-\s]+/, '').trim();
      const lowerLine = cleanLine.toLowerCase();

      if (lowerLine.includes('patient') || lowerLine.includes('physician') || lowerLine.includes('doctor') || lowerLine.includes('date') || lowerLine.includes('report') || lowerLine.includes('page') || lowerLine.includes('reference range') || lowerLine.includes('result') || lowerLine.includes('test name')) {
        continue;
      }

      // Look for a numeric value
      const valueMatch = cleanLine.match(/(?:^|\s)((?:<|>|<=|>=)?\s*\d+(?:\.\d+)?)(?:\s|$)/);
      if (!valueMatch) continue;

      const valueStr = valueMatch[1].replace(/\s+/g, '');
      const valueIndex = valueMatch.index;

      let testName = cleanLine.substring(0, valueIndex).trim();
      testName = testName.replace(/[:\-,\s]+$/, '').trim();

      if (testName.length < 2 || testName.split(/\s+/).length > 5) {
        continue;
      }

      const remaining = cleanLine.substring(valueIndex + valueMatch[0].length).trim();
      const lowerRemaining = remaining.toLowerCase();

      let referenceRange = 'N/A';
      const refRangeMatch = remaining.match(/(?:\(|^|\s)(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?|<\s*\d+(?:\.\d+)?|>\s*\d+(?:\.\d+)?)(?:\)|$|\s)/);
      if (refRangeMatch) {
        referenceRange = refRangeMatch[1].trim();
      }

      let unit = '';
      for (const u of commonUnits) {
        const unitRegex = new RegExp('\\b' + u.replace('/', '\\/').replace('^', '\\^') + '\\b', 'i');
        if (unitRegex.test(lowerRemaining)) {
          unit = u;
          break;
        }
      }

      let status = 'Normal';
      if (/\b(?:high|h|abnormal)\b/i.test(remaining)) {
        status = 'High';
      } else if (/\b(?:low|l)\b/i.test(remaining)) {
        status = 'Low';
      } else if (refRangeMatch && referenceRange.includes('-')) {
        const parts = referenceRange.split(/[-–]/).map(p => parseFloat(p.trim()));
        const numVal = parseFloat(valueStr.replace(/[^\d.]/g, ''));
        if (!isNaN(numVal) && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (numVal < parts[0]) status = 'Low';
          else if (numVal > parts[1]) status = 'High';
        }
      }

      if (!labResults.some(r => r.test.toLowerCase() === testName.toLowerCase())) {
        labResults.push({
          test: testName,
          value: valueStr,
          referenceRange,
          status,
          unit
        });
      }
    }
  }

  // 4. Section-based context parsing with Prefix override protection (Section Purity Engine)
  const medicalHistory = [];
  const symptoms = [];
  const familyHistory = [];
  const lifestyleInformation = [];
  const doctorNotes = [];
  const recommendations = [];
  const criticalAlerts = [];

  let currentSection = 'general';

  for (const line of lines) {
    let cleanS = line.replace(/^[«*+•\-\s]+/, '').trim();
    const lowerS = cleanS.toLowerCase();
    
    // Skip general document titles
    if (lowerS === 'medical report samples' || lowerS.includes('sample 1') || lowerS.includes('sample 2') || lowerS === 'patient information') {
      continue;
    }

    // Heuristically skip metadata line keys to avoid leakage in clinical lists
    const isMetaLine = 
      lowerS.includes('name') ||
      lowerS.includes('date of birth') ||
      lowerS.includes('dob') ||
      lowerS.includes('birth') ||
      lowerS.includes('age') ||
      lowerS.includes('gender') ||
      lowerS.includes('gander') ||
      lowerS.includes('sex') ||
      lowerS.includes('patient id') ||
      lowerS.includes('patientid') ||
      lowerS.includes('patient 0') ||
      lowerS.includes('patient0') ||
      lowerS.includes('patent') ||
      lowerS.includes('physician') ||
      lowerS.includes('doctor') ||
      lowerS.includes('dentist') ||
      lowerS.includes('specialty') ||
      lowerS.includes('contact');

    if (isMetaLine) {
      if (lowerS.includes(':') || lowerS.includes('-') || lowerS.startsWith('patient') || lowerS.startsWith('physician') || lowerS.startsWith('doctor') || lowerS.startsWith('dentist') || lowerS.startsWith('name') || lowerS.startsWith('age') || lowerS.startsWith('gender') || lowerS.startsWith('gander') || lowerS.startsWith('sex') || lowerS.startsWith('dob') || lowerS.startsWith('date of birth') || lowerS.startsWith('patent')) {
        continue;
      }
    }

    // Check line prefixes to override currentSection dynamically for this line
    if (lowerS.startsWith('diagnosis') || lowerS.startsWith('via signs') || lowerS.startsWith('vital signs') || lowerS.startsWith('symptoms') || lowerS.startsWith('presenting complaints') || lowerS.startsWith('complaints')) {
      currentSection = 'symptoms';
      cleanS = cleanS.replace(/^(?:diagnosis|via signs|vital signs|symptoms|presenting complaints|complaints)\s*[:\-]?\s*/i, '');
    } else if (lowerS.startsWith('treatment plan') || lowerS.startsWith('treatment') || lowerS.startsWith('prescription') || lowerS.startsWith('recommendations') || lowerS.startsWith('follow-up') || lowerS.startsWith('advice')) {
      currentSection = 'recommendations';
      cleanS = cleanS.replace(/^(?:treatment plan|treatment|prescription|recommendations|follow-up|advice)\s*[:\-]?\s*/i, '');
    } else if (lowerS.startsWith('medical history') || lowerS.startsWith('history') || lowerS.startsWith('past history')) {
      currentSection = 'history';
      cleanS = cleanS.replace(/^(?:medical history|history|past history)\s*[:\-]?\s*/i, '');
    } else if (lowerS.startsWith('family history') || lowerS.startsWith('family')) {
      currentSection = 'family';
      cleanS = cleanS.replace(/^(?:family history|family)\s*[:\-]?\s*/i, '');
    } else if (lowerS.startsWith('lifestyle information') || lowerS.startsWith('lifestyle') || lowerS.startsWith('hygiene')) {
      currentSection = 'lifestyle';
      cleanS = cleanS.replace(/^(?:lifestyle information|lifestyle|hygiene)\s*[:\-]?\s*/i, '');
    } else if (lowerS.startsWith('notes') || lowerS.startsWith('remarks') || lowerS.startsWith('impression')) {
      currentSection = 'notes';
      cleanS = cleanS.replace(/^(?:notes|remarks|impression)\s*[:\-]?\s*/i, '');
    }

    cleanS = cleanS.trim();
    if (cleanS.length < 3) continue;

    if (currentSection === 'history') {
      if (!medicalHistory.includes(cleanS)) medicalHistory.push(cleanS);
    } else if (currentSection === 'symptoms') {
      if (!symptoms.includes(cleanS)) symptoms.push(cleanS);
    } else if (currentSection === 'family') {
      if (!familyHistory.includes(cleanS)) familyHistory.push(cleanS);
    } else if (currentSection === 'lifestyle') {
      if (!lifestyleInformation.includes(cleanS)) lifestyleInformation.push(cleanS);
    } else if (currentSection === 'recommendations') {
      if (!recommendations.includes(cleanS)) recommendations.push(cleanS);
    } else if (currentSection === 'notes') {
      if (!doctorNotes.includes(cleanS)) doctorNotes.push(cleanS);
    } else {
      // General section fall-through findings (e.g. for non-lab, non-labeled documents)
      if (!isLabReport) {
        if (!symptoms.includes(cleanS)) symptoms.push(cleanS);
      }
    }
  }

  // Add lab-result critical alerts
  for (const result of labResults) {
    if (result.status !== 'Normal') {
      criticalAlerts.push(`${result.test} is abnormal at ${result.value} ${result.unit} (Reference: ${result.referenceRange}).`);
    }
  }

  const hasLabValues = labResults.length > 0;
  const hasCriticalFindings = criticalAlerts.length > 0;

  return {
    reportType,
    patient: { name, dob, age, gender, patientId },
    doctor: { name: physicianName, specialty, contact },
    lifestyleInformation,
    summary: '',
    medicalHistory,
    symptoms,
    familyHistory,
    labResults,
    criticalAlerts: criticalAlerts.length > 0 ? criticalAlerts : ['No critical alerts detected.'],
    doctorNotes,
    hasLabValues,
    hasCriticalFindings,
    ocrConfidence,
    classificationConfidence,
    analysisConfidence,
    recommendations: recommendations.join('\n')
  };
}

module.exports = {
  analyzeMedicineLabel,
  analyzeMedicalReport
};
