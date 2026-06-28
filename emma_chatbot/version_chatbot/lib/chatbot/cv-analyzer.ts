import { CVAnalysisResult, CourseRecommendation, SkillMatch } from "./types";

const SKILL_DICTIONARY: Record<string, string[]> = {
  "C/C++": ["c", "c\\+\\+", "cpp", "c\\/c\\+\\+"],
  "Python": ["python", "python3"],
  "Rust": ["rust", "rustlang"],
  "Java": ["java", "jvm", "spring"],
  "JavaScript/TypeScript": ["javascript", "js", "typescript", "ts", "node", "nodejs", "react", "nextjs", "vue", "angular"],
  "Embarqué": ["embarqué", "embedded", "microcontrôleur", "microcontroller", "stm32", "esp32", "arduino", "raspberry", "bare-metal"],
  "RTOS": ["rtos", "freertos", "zephyr", "mbed"],
  "Linux": ["linux", "yocto", "buildroot", "posix", "bash", "shell"],
  "IoT": ["iot", "mqtt", "lora", "lorawan", "sigfox", "ble", "bluetooth", "wifi"],
  "Data": ["sql", "mysql", "postgresql", "mongodb", "data", "machine learning", "ia", "ai"],
  "Git": ["git", "github", "gitlab", "bitbucket", "svn"]
};

// Cours CSF et leurs prérequis/compétences cibles
const COURSES = [
  {
    courseName: "Cursus OPTIMUM",
    description: "Le cursus complet pour devenir Ingénieur Systèmes Embarqués depuis zéro ou presque.",
    targetSkills: ["C/C++", "Python", "Linux", "Embarqué"],
    link: "/formation",
    baseScore: 50 // High base score as it's for beginners
  },
  {
    courseName: "Cursus SILVER",
    description: "Spécialisation IoT et systèmes connectés pour profils ayant déjà des bases en dev.",
    targetSkills: ["C/C++", "Python", "IoT", "Linux", "RTOS"],
    link: "/formation",
    baseScore: 30
  },
  {
    courseName: "Cursus GOLD",
    description: "Expertise architecture et lead technique pour profils expérimentés.",
    targetSkills: ["C/C++", "Rust", "Linux", "RTOS", "Architecture", "Embarqué"],
    link: "/formation",
    baseScore: 10
  }
];

export function extractSkills(text: string): SkillMatch[] {
  const extracted: SkillMatch[] = [];
  const normalizedText = text.toLowerCase().replace(/\\n/g, " ");

  for (const [category, keywords] of Object.entries(SKILL_DICTIONARY)) {
    for (const keyword of keywords) {
      // Use word boundaries for exact match, unless it contains special chars like C++
      const escapedKeyword = keyword.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
      // For languages like C, we need strict boundaries
      const regex = keyword === 'c' || keyword === 'js' || keyword === 'ts' 
        ? new RegExp(`\\\\b${keyword}\\\\b`, "i")
        : new RegExp(`\\\\b${keyword}`, "i");

      if (regex.test(normalizedText)) {
        if (!extracted.some(e => e.category === category)) {
          extracted.push({ skill: keyword, category });
        }
        break; // Only add the category once
      }
    }
  }

  return extracted;
}

export function recommendCourse(skills: SkillMatch[]): CourseRecommendation {
  const skillCategories = skills.map(s => s.category);
  
  let bestCourse = COURSES[0];
  let highestScore = -1;
  let finalMatched: string[] = [];
  let finalMissing: string[] = [];

  for (const course of COURSES) {
    let score = course.baseScore;
    const matched: string[] = [];
    const missing: string[] = [];

    for (const target of course.targetSkills) {
      if (skillCategories.includes(target)) {
        score += 20; // Big boost for matching target skill
        matched.push(target);
      } else {
        missing.push(target);
      }
    }

    // Special rules: If they have JS/TS/Java but no C/C++, Optimum is highly recommended
    if (skillCategories.includes("JavaScript/TypeScript") && !skillCategories.includes("C/C++")) {
      if (course.courseName === "Cursus OPTIMUM") score += 30;
    }

    if (score > highestScore) {
      highestScore = score;
      bestCourse = course;
      finalMatched = matched;
      finalMissing = missing;
    }
  }

  return {
    courseName: bestCourse.courseName,
    score: Math.min(100, highestScore),
    matchedSkills: finalMatched,
    missingSkills: finalMissing,
    description: bestCourse.description,
    link: bestCourse.link
  };
}

export async function analyzeCV(text: string): Promise<CVAnalysisResult> {
  try {
    const detectedSkills = extractSkills(text);
    const recommendation = recommendCourse(detectedSkills);

    let advice = "";
    if (detectedSkills.length === 0) {
      advice = "Je n'ai pas pu détecter de compétences techniques spécifiques dans votre CV. Le Cursus OPTIMUM est idéal pour démarrer de zéro !";
    } else {
      advice = `Super ! J'ai détecté ${detectedSkills.length} domaine(s) de compétences clés dans votre CV. Le ${recommendation.courseName} semble parfaitement adapté pour compléter votre profil.`;
    }

    return {
      success: true,
      detectedSkills,
      recommendation,
      advice
    };
  } catch (error) {
    console.error("Error analyzing CV:", error);
    return {
      success: false,
      detectedSkills: [],
      recommendation: COURSES[0] as CourseRecommendation,
      advice: "Désolé, une erreur s'est produite lors de l'analyse de votre CV.",
      error: "Analysis failed"
    };
  }
}
