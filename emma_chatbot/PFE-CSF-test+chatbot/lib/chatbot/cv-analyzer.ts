import type { CVAnalysisResult, CourseRecommendation, SkillMatch } from "./types"
import { CURSUS, RECONVERSION_TRACKS } from "./knowledge-base"

interface SkillDefinition {
  name: string
  aliases: string[]
  domain: string
  pattern: RegExp
}

const SKILL_DICTIONARY: SkillDefinition[] = [
  // Embarqué / C
  { name: "C", aliases: ["langage c", "embedded c", "ansi c"], domain: "Embarqué", pattern: /\b(c\/c\+\+|embedded\s*c|langage\s*c|\bc\s+programming)\b/i },
  { name: "C++", aliases: ["cpp", "c plus plus"], domain: "Embarqué", pattern: /\b(c\+\+|cpp|c\s*plus\s*plus)\b/i },
  { name: "STM32", aliases: ["stm32f4", "hal stm32"], domain: "Embarqué", pattern: /\b(stm32|stm32f\d+|stm32l\d+)\b/i },
  { name: "ARM Cortex-M", aliases: ["cortex m", "arm m"], domain: "Embarqué", pattern: /\b(cortex[\s-]?m\d*|arm\s*cortex)\b/i },
  { name: "GPIO", aliases: ["general purpose io"], domain: "Embarqué", pattern: /\bgpio\b/i },
  { name: "UART", aliases: ["serial", "usart"], domain: "Embarqué", pattern: /\b(uart|usart|serial\s*communication)\b/i },
  { name: "SPI", aliases: [], domain: "Embarqué", pattern: /\bspi\b/i },
  { name: "I2C", aliases: ["i²c", "iic"], domain: "Embarqué", pattern: /\b(i2c|i²c|iic)\b/i },
  { name: "RTOS", aliases: ["real time os"], domain: "Embarqué", pattern: /\b(rtos|real[\s-]?time\s*(os|operating\s*system))\b/i },
  { name: "FreeRTOS", aliases: [], domain: "Embarqué", pattern: /\bfreertos\b/i },
  { name: "µC/OS", aliases: ["ucos", "micrium"], domain: "Embarqué", pattern: /\b(µc\/os|ucos|micrium)\b/i },
  { name: "Bare-metal", aliases: ["bare metal"], domain: "Embarqué", pattern: /\bbare[\s-]?metal\b/i },
  { name: "HAL", aliases: ["hardware abstraction"], domain: "Embarqué", pattern: /\b(hal|hardware\s*abstraction\s*layer)\b/i },
  { name: "Bootloader", aliases: [], domain: "Embarqué", pattern: /\bbootloader\b/i },
  { name: "Firmware", aliases: [], domain: "Embarqué", pattern: /\bfirmware\b/i },
  { name: "Microcontrôleur", aliases: ["microcontroller", "mcu"], domain: "Embarqué", pattern: /\b(microcontr[oô]leur|microcontroller|mcu)\b/i },
  { name: "Arduino", aliases: [], domain: "Embarqué", pattern: /\barduino\b/i },
  { name: "Raspberry Pi", aliases: ["rpi"], domain: "Embarqué", pattern: /\b(raspberry\s*pi|rpi)\b/i },
  { name: "ESP32", aliases: ["esp8266"], domain: "Embarqué", pattern: /\b(esp32|esp8266)\b/i },
  { name: "Assembleur", aliases: ["assembly", "asm"], domain: "Embarqué", pattern: /\b(assembleur|assembly|asm)\b/i },
  { name: "Qt", aliases: ["qt framework"], domain: "Embarqué", pattern: /\bqt\b/i },
  { name: "CAN Bus", aliases: ["can protocol"], domain: "Embarqué", pattern: /\b(can\s*bus|can\s*protocol|\bcan\b)\b/i },
  { name: "Modbus", aliases: [], domain: "Embarqué", pattern: /\bmodbus\b/i },
  { name: "Debugging embarqué", aliases: ["jtag", "swd"], domain: "Embarqué", pattern: /\b(jtag|swd|openocd|gdb)\b/i },

  // Linux / Système
  { name: "Linux", aliases: ["gnu linux"], domain: "Linux & Système", pattern: /\b(linux|gnu\/linux)\b/i },
  { name: "Shell/Bash", aliases: ["bash", "shell scripting"], domain: "Linux & Système", pattern: /\b(bash|shell\s*script|sh\s*script)\b/i },
  { name: "Drivers Kernel", aliases: ["kernel driver", "linux driver"], domain: "Linux & Système", pattern: /\b(kernel\s*driver|linux\s*driver|device\s*driver|driver\s*kernel)\b/i },
  { name: "Yocto", aliases: ["yocto project"], domain: "Linux & Système", pattern: /\byocto\b/i },
  { name: "Buildroot", aliases: [], domain: "Linux & Système", pattern: /\bbuildroot\b/i },
  { name: "Docker", aliases: ["containerization"], domain: "Linux & Système", pattern: /\bdocker\b/i },
  { name: "Kubernetes", aliases: ["k8s"], domain: "Linux & Système", pattern: /\b(kubernetes|k8s)\b/i },

  // IoT & Réseau
  { name: "IoT", aliases: ["internet of things", "internet des objets"], domain: "IoT", pattern: /\b(iot|internet\s*(of\s*things|des\s*objets))\b/i },
  { name: "MQTT", aliases: [], domain: "IoT", pattern: /\bmqtt\b/i },
  { name: "CoAP", aliases: [], domain: "IoT", pattern: /\bcoap\b/i },
  { name: "BLE", aliases: ["bluetooth low energy"], domain: "IoT", pattern: /\b(ble|bluetooth\s*low\s*energy)\b/i },
  { name: "WiFi", aliases: ["wireless"], domain: "IoT", pattern: /\b(wifi|wi-fi|wireless\s*networking)\b/i },
  { name: "Zigbee", aliases: [], domain: "IoT", pattern: /\bzigbee\b/i },
  { name: "Edge Computing", aliases: ["edge ai"], domain: "IoT", pattern: /\b(edge\s*(computing|ai)|edge\s*processing)\b/i },
  { name: "Azure IoT", aliases: ["azure iot hub"], domain: "IoT", pattern: /\b(azure\s*iot|iot\s*hub)\b/i },
  { name: "AWS IoT", aliases: [], domain: "IoT", pattern: /\baws\s*iot\b/i },

  // Web / Full Stack
  { name: "JavaScript", aliases: ["js", "ecmascript"], domain: "Web", pattern: /\b(javascript|ecmascript|\bjs\b)\b/i },
  { name: "TypeScript", aliases: ["ts"], domain: "Web", pattern: /\b(typescript|\bts\b)\b/i },
  { name: "React", aliases: ["reactjs", "react.js"], domain: "Web", pattern: /\b(react\.?js|reactjs|\breact\b)\b/i },
  { name: "Next.js", aliases: ["nextjs"], domain: "Web", pattern: /\b(next\.?js|nextjs)\b/i },
  { name: "Node.js", aliases: ["nodejs"], domain: "Web", pattern: /\b(node\.?js|nodejs)\b/i },
  { name: "HTML/CSS", aliases: ["html5", "css3"], domain: "Web", pattern: /\b(html5?|css3?|html\/css)\b/i },
  { name: "Tailwind CSS", aliases: ["tailwind"], domain: "Web", pattern: /\b(tailwind\s*css|tailwind)\b/i },
  { name: "Vue.js", aliases: ["vuejs"], domain: "Web", pattern: /\b(vue\.?js|vuejs)\b/i },
  { name: "Angular", aliases: [], domain: "Web", pattern: /\bangular\b/i },
  { name: "REST API", aliases: ["restful"], domain: "Web", pattern: /\b(rest\s*api|restful|api\s*rest)\b/i },
  { name: "GraphQL", aliases: [], domain: "Web", pattern: /\bgraphql\b/i },

  // Base de données
  { name: "SQL", aliases: ["structured query language"], domain: "Data", pattern: /\b(sql|structured\s*query)\b/i },
  { name: "PostgreSQL", aliases: ["postgres"], domain: "Data", pattern: /\b(postgresql|postgres)\b/i },
  { name: "MySQL", aliases: [], domain: "Data", pattern: /\bmysql\b/i },
  { name: "MongoDB", aliases: ["nosql"], domain: "Data", pattern: /\b(mongodb|nosql)\b/i },
  { name: "Redis", aliases: [], domain: "Data", pattern: /\bredis\b/i },

  // Data / AI
  { name: "Python", aliases: ["py"], domain: "Data & AI", pattern: /\b(python|\bpy\b)\b/i },
  { name: "Machine Learning", aliases: ["ml", "deep learning"], domain: "Data & AI", pattern: /\b(machine\s*learning|deep\s*learning|\bml\b|neural\s*network)\b/i },
  { name: "TensorFlow", aliases: [], domain: "Data & AI", pattern: /\btensorflow\b/i },
  { name: "PyTorch", aliases: [], domain: "Data & AI", pattern: /\bpytorch\b/i },
  { name: "Pandas", aliases: [], domain: "Data & AI", pattern: /\bpandas\b/i },
  { name: "Data Analysis", aliases: ["data analytics"], domain: "Data & AI", pattern: /\b(data\s*(analysis|analytics|science)|analyse\s*de\s*données)\b/i },

  // DevOps / Outils
  { name: "Git", aliases: ["github", "gitlab"], domain: "DevOps", pattern: /\b(git|github|gitlab|bitbucket)\b/i },
  { name: "CI/CD", aliases: ["continuous integration"], domain: "DevOps", pattern: /\b(ci\/cd|continuous\s*(integration|deployment)|jenkins|github\s*actions)\b/i },
  { name: "Agile/Scrum", aliases: ["scrum", "kanban"], domain: "DevOps", pattern: /\b(agile|scrum|kanban|sprint)\b/i },

  // Test / QA
  { name: "Test Logiciel", aliases: ["software testing", "qa"], domain: "Test & QA", pattern: /\b(test\s*(logiciel|software)|qa|quality\s*assurance)\b/i },
  { name: "ISTQB", aliases: [], domain: "Test & QA", pattern: /\bistqb\b/i },
  { name: "Selenium", aliases: [], domain: "Test & QA", pattern: /\bselenium\b/i },
  { name: "JUnit", aliases: [], domain: "Test & QA", pattern: /\bjunit\b/i },
  { name: "Cypress", aliases: [], domain: "Test & QA", pattern: /\bcypress\b/i },
  { name: "TDD", aliases: ["test driven development"], domain: "Test & QA", pattern: /\b(tdd|test[\s-]driven)\b/i },

  // Sécurité
  { name: "Cybersécurité", aliases: ["cybersecurity", "sécurité informatique"], domain: "Sécurité", pattern: /\b(cyber\s*sécurité|cybersecurity|sécurité\s*informatique)\b/i },
  { name: "Cryptographie", aliases: ["encryption"], domain: "Sécurité", pattern: /\b(cryptograph|encryption|chiffrement|ssl|tls)\b/i },

  // Électronique
  { name: "Électronique", aliases: ["electronics"], domain: "Électronique", pattern: /\b(électronique|electronique|electronics)\b/i },
  { name: "PCB Design", aliases: ["altium", "kicad"], domain: "Électronique", pattern: /\b(pcb|altium|kicad|circuit\s*design)\b/i },
  { name: "FPGA", aliases: ["vhdl", "verilog"], domain: "Électronique", pattern: /\b(fpga|vhdl|verilog)\b/i },

  // Langages généralistes
  { name: "Java", aliases: [], domain: "Programmation", pattern: /\bjava\b/i },
  { name: "C#", aliases: ["csharp", ".net"], domain: "Programmation", pattern: /\b(c#|csharp|\.net)\b/i },
  { name: "PHP", aliases: ["laravel"], domain: "Programmation", pattern: /\b(php|laravel|symfony)\b/i },
  { name: "Go", aliases: ["golang"], domain: "Programmation", pattern: /\b(golang|\bgo\b\s+lang)\b/i },
  { name: "Rust", aliases: [], domain: "Programmation", pattern: /\brust\b/i },

  // Soft Skills
  { name: "Gestion de projet", aliases: ["project management"], domain: "Management", pattern: /\b(gestion\s*de\s*projet|project\s*management|chef\s*de\s*projet)\b/i },
  { name: "Leadership", aliases: [], domain: "Management", pattern: /\bleadership\b/i },
  { name: "Communication", aliases: [], domain: "Management", pattern: /\bcommunication\b/i },
]

interface CourseProfile {
  id: string
  name: string
  title: string
  link: string
  requiredSkills: string[]
  preferredSkills: string[]
  domains: string[]
}

const COURSE_PROFILES: CourseProfile[] = [
  {
    id: "optimum",
    name: "OPTIMUM",
    title: "CSF-RCP - Développement en Système Embarqué",
    link: "/formation/reconversion/systeme-embarque",
    requiredSkills: ["C", "Électronique"],
    preferredSkills: ["Microcontrôleur", "GPIO", "ARM Cortex-M", "Arduino"],
    domains: ["Embarqué", "Électronique"],
  },
  {
    id: "silver",
    name: "SILVER",
    title: "RTOS & Protocoles - Systèmes Temps Réel",
    link: "/formation/reconversion/systeme-embarque",
    requiredSkills: ["C", "RTOS", "Microcontrôleur"],
    preferredSkills: ["FreeRTOS", "CAN Bus", "Modbus", "MQTT", "STM32"],
    domains: ["Embarqué"],
  },
  {
    id: "gold",
    name: "GOLD",
    title: "IoT Avancé & Cloud - Écosystème Connecté",
    link: "/formation/reconversion/systeme-embarque",
    requiredSkills: ["C", "Linux", "IoT"],
    preferredSkills: ["MQTT", "Azure IoT", "AWS IoT", "Edge Computing", "Cybersécurité"],
    domains: ["IoT", "Embarqué", "Linux & Système"],
  },
  {
    id: "full-stack",
    name: "Full-Stack",
    title: "CSF-RCP – Développement Full-Stack",
    link: "/formation/reconversion/full-stack",
    requiredSkills: ["JavaScript", "HTML/CSS"],
    preferredSkills: ["React", "Node.js", "TypeScript", "SQL", "Docker"],
    domains: ["Web", "DevOps"],
  },
  {
    id: "testeur",
    name: "Testeur Logiciel",
    title: "CSF-RCP – Académie en Testeur Logiciel",
    link: "/formation/reconversion/testeur-logiciel",
    requiredSkills: ["Test Logiciel"],
    preferredSkills: ["ISTQB", "Selenium", "Java", "Agile/Scrum", "TDD"],
    domains: ["Test & QA"],
  },
]

export function analyzeCVText(text: string, fileName?: string): CVAnalysisResult {
  const normalizedText = text.toLowerCase()
  const skills = extractSkills(normalizedText)
  const recommendations = scoreCourses(skills)
  const advice = generateAdvice(skills, recommendations)

  return {
    success: true,
    fileName,
    extractedTextLength: text.length,
    skills,
    recommendations,
    primaryRecommendation: recommendations[0],
    advice,
  }
}

function extractSkills(text: string): SkillMatch[] {
  const found: SkillMatch[] = []
  const seen = new Set<string>()

  for (const skill of SKILL_DICTIONARY) {
    if (skill.pattern.test(text) || skill.aliases.some((alias) => text.includes(alias.toLowerCase()))) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name)
        const occurrences = countOccurrences(text, skill)
        found.push({
          skill: skill.name,
          domain: skill.domain,
          confidence: Math.min(0.5 + occurrences * 0.15, 1),
        })
      }
    }
  }

  return found.sort((a, b) => b.confidence - a.confidence)
}

function countOccurrences(text: string, skill: SkillDefinition): number {
  const matches = text.match(new RegExp(skill.pattern.source, "gi"))
  return matches?.length ?? 0
}

function scoreCourses(skills: SkillMatch[]): CourseRecommendation[] {
  const skillNames = new Set(skills.map((s) => s.skill))
  const skillDomains = new Set(skills.map((s) => s.domain))

  const recommendations: CourseRecommendation[] = []

  for (const course of COURSE_PROFILES) {
    const requiredMatches = course.requiredSkills.filter((s) => skillNames.has(s)).length
    const preferredMatches = course.preferredSkills.filter((s) => skillNames.has(s)).length
    const domainMatches = course.domains.filter((d) => skillDomains.has(d)).length

    const requiredScore = course.requiredSkills.length > 0
      ? (requiredMatches / course.requiredSkills.length) * 40
      : 0
    const preferredScore = course.preferredSkills.length > 0
      ? (preferredMatches / course.preferredSkills.length) * 40
      : 0
    const domainScore = course.domains.length > 0
      ? (domainMatches / course.domains.length) * 20
      : 0

    const totalScore = requiredScore + preferredScore + domainScore
    const matchPercentage = Math.round(Math.min(totalScore, 100))

    if (matchPercentage > 0 || skills.length === 0) {
      recommendations.push({
        id: course.id,
        name: course.name,
        title: course.title,
        score: totalScore,
        matchPercentage: skills.length === 0 ? 50 : matchPercentage,
        reason: buildReason(course, skillNames, requiredMatches, preferredMatches),
        link: course.link,
      })
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "optimum",
      name: "OPTIMUM",
      title: CURSUS[0].title,
      score: 50,
      matchPercentage: 50,
      reason: "Parcours fondamental recommandé pour débuter en systèmes embarqués.",
      link: RECONVERSION_TRACKS[0].link,
    })
  }

  return recommendations.sort((a, b) => b.score - a.score)
}

function buildReason(
  course: CourseProfile,
  skillNames: Set<string>,
  requiredMatches: number,
  preferredMatches: number,
): string {
  const matched = [...skillNames].filter(
    (s) => course.requiredSkills.includes(s) || course.preferredSkills.includes(s),
  )

  if (matched.length > 0) {
    return `Vos compétences en ${matched.slice(0, 4).join(", ")} correspondent bien à ce parcours. ${requiredMatches > 0 ? "Prérequis partiellement couverts." : "Compétences complémentaires à acquérir."}`
  }

  if (course.id === "optimum") {
    return "Parcours idéal pour débuter ou consolider vos bases en développement embarqué."
  }

  return `Parcours adapté pour approfondir vos compétences en ${course.domains.join(" et ")}.`
}

function generateAdvice(skills: SkillMatch[], recommendations: CourseRecommendation[]): string[] {
  const advice: string[] = []
  const domains = new Set(skills.map((s) => s.domain))

  if (skills.length === 0) {
    advice.push("Votre CV ne contient pas assez de mots-clés techniques détectables. Envisagez d'ajouter vos compétences explicitement.")
    advice.push("Le cursus OPTIMUM est recommandé comme point de départ pour la reconversion en systèmes embarqués.")
    return advice
  }

  if (domains.has("Embarqué") && !domains.has("IoT")) {
    advice.push("Votre profil embarqué est solide. Le cursus SILVER (RTOS) ou GOLD (IoT) pourrait être votre prochaine étape.")
  }

  if (domains.has("Web") && domains.has("DevOps")) {
    advice.push("Votre profil web/devops est prometteur pour le parcours Full-Stack CSF-RCP.")
  }

  if (domains.has("Test & QA")) {
    advice.push("Votre expérience en test logiciel correspond bien à l'Académie Testeur Logiciel et la certification ISTQB.")
  }

  if (skills.length < 5) {
    advice.push("Enrichissez votre CV avec plus de détails techniques pour une analyse plus précise.")
  }

  const topRec = recommendations[0]
  if (topRec && topRec.matchPercentage >= 60) {
    advice.push(`Contactez CSF à contact@csf.tn pour finaliser votre inscription au parcours ${topRec.name}.`)
  } else {
    advice.push("Un entretien avec nos conseillers permettra d'affiner la recommandation selon vos objectifs.")
  }

  return advice
}
