# Performance Measurement Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add competency assessments, markdown SMART goal upload, and GitHub activity dashboard to Performance Hub.

**Architecture:** Three independent features layered onto the existing Next.js app. Competency catalog stored as JSON, referenced by employee assessments. Goal upload parses markdown on the client side. GitHub sync ported from `utils/prs.js` into a Next.js API route using `child_process` for `gh` CLI calls. All data persisted via the existing JSON file system in `lib/data.js`.

**Tech Stack:** Next.js 15, React 19, Motion (animations), `gh` CLI (GitHub data), CSS custom properties (styling)

---

### Task 1: Create competency catalog data

**Files:**
- Create: `data/competencies.json`
- Create: `data/demo-competencies.json`

This task extracts the competency matrix from the Excel file into the JSON format the app will use.

- [ ] **Step 1: Create `data/competencies.json`**

```json
[
  {
    "id": 1,
    "name": "Testing & Quality",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Possesses foundational knowledge of testing frameworks and test automation practices",
      "Intermediate Engineer": "Demonstrates strong proficiency in testing frameworks and test automation practices",
      "Senior Engineer": "Expert in testing across multiple layers including performance testing; establishes testing guidelines and quality standards within the team",
      "Staff Engineer": "Establishes organizational quality standards and testing frameworks; creates company-wide quality practices, testing infrastructure, and drives quality culture across teams"
    }
  },
  {
    "id": 2,
    "name": "Development Tools & Frameworks",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Uses standard development tools with support; operates development environments, version control, and CI/CD pipelines for basic workflows with guidance",
      "Intermediate Engineer": "Works fluently with development tools; operates development environments, version control, CI/CD pipelines, and monitoring independently with effective troubleshooting",
      "Senior Engineer": "Expert in development tools, CI/CD pipelines, monitoring, debugging, and performance tuning; designs optimized development processes that enhance team development experience",
      "Staff Engineer": "Designs development frameworks and tooling for developers across teams; creates reusable libraries, internal tools, and automation that simplify workflows and improve developer experience organization-wide"
    }
  },
  {
    "id": 3,
    "name": "Code Quality & Design",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Understands team coding conventions and applies them consistently. Follows code and design principles including clear naming, logical structure, and simplicity",
      "Intermediate Engineer": "Produces clean, maintainable, and efficient code. Proactively identifies opportunities for improvement and suggests effective solutions to enhance code quality, performance, and team practices.",
      "Senior Engineer": "Applies deep understanding of design principles and architectural patterns to produce scalable, maintainable code while proactively managing technical debt across large-scale codebases",
      "Staff Engineer": "Establishes coding standards and design principles as a recognized authority; identifies cross-domain patterns to create reusable solutions that drive organizational impact"
    }
  },
  {
    "id": 4,
    "name": "Code Reviews",
    "category": "Technology",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Requests code reviews for own work, reviews peers' code at a basic level, and asks for changes when issues are identified.",
      "Intermediate Engineer": "Reviews code thoroughly to ensure production readiness including tests and coverage, provides constructive feedback to help peers improve.",
      "Senior Engineer": "Ensures team adherence to coding standards and best practices through comprehensive code reviews, mentors developers on quality and design principles",
      "Staff Engineer": "Defines and maintains code review standards across multiple teams, establishes quality gates and review processes, coaches teams on effective review practices."
    }
  },
  {
    "id": 5,
    "name": "Architecture & Platform Expertise",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Understands the high-level architecture of topics team is working on. Possesses basic knowledge of No-Code/Low-Code platforms and their fundamental capabilities.",
      "Intermediate Engineer": "Understands and clearly explains the high-level architecture of team systems and their interconnections. Demonstrates good understanding of No-Code/Low-Code/Pro-Code approaches.",
      "Senior Engineer": "Expert in team's tech stack with comprehensive No-Code/Low-Code/Pro-Code expertise; explains detailed architecture across systems and selects appropriate technologies and processes for each task",
      "Staff Engineer": "Possesses deep expertise across multiple technical domains; defines cutting-edge development processes and identifies major technology shifts to drive organizational transformation"
    }
  },
  {
    "id": 6,
    "name": "Technical Problem Solving",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Identifies basic technical issues and can independently debug, implement, and test isolated changes with appropriate verification.",
      "Intermediate Engineer": "Independently troubleshoots and resolves moderately complex technical problems while designing and implementing reliable, well-tested, and elegant solutions",
      "Senior Engineer": "Solves complex technical problems through expert-level analysis and solutioning; designs comprehensive approaches and guides team through challenging issue resolution",
      "Staff Engineer": "Tackles cross-team technical challenges by analyzing root causes across organizational boundaries and designing comprehensive solutions for interconnected problems"
    }
  },
  {
    "id": 7,
    "name": "Take Feedback",
    "category": "Open-mindedness & Willingness to Learn",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Receptive to feedback and asks clarifying questions. Accepts feedback gracefully.",
      "Intermediate Engineer": "Actively integrates feedback into practice. Provides constructive feedback to peers. Mentors less-experienced members.",
      "Senior Engineer": "Delivers effective feedback to cross-team members. Encourages feedback culture within sphere of influence.",
      "Staff Engineer": "Acts as role model on IT org-level. Fosters organization-wide feedback culture and mentors others on feedback exchange effectively."
    }
  },
  {
    "id": 8,
    "name": "Skill Improvement",
    "category": "Open-mindedness & Willingness to Learn",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Demonstrates curiosity and eagerness to learn new technologies. Resolves problems independently but reaches out for help when needed.",
      "Intermediate Engineer": "Works with leader to grow skills through reading and partnering with senior members. Quickly acquires new skills and applies them. Demonstrates learning agility.",
      "Senior Engineer": "Actively engages in expanding scope beyond current role scope through add-ons and educational initiatives. Identifies learning needs and creates development plans aligned with industry standards.",
      "Staff Engineer": "Elevates capabilities company-wide in their domain. Drives organizational learning and development strategy. Promotes continuous learning across teams."
    }
  },
  {
    "id": 9,
    "name": "Embrace Mistakes",
    "category": "Open-mindedness & Willingness to Learn",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Embraces own mistakes as source of learning. Asks questions despite knowledge gaps. Demonstrates curiosity and growth mindset.",
      "Intermediate Engineer": "Extends learning mindset to team level. Team player who actively learns and observes team dynamics.",
      "Senior Engineer": "Applies learning from team failures to drive innovation. Prepared to experiment and iterate based on lessons learned.",
      "Staff Engineer": "Encourages organizations to be ambitious and prepared to learn from IT orga-level failures. Turns innovative ideas into reality. Proposes improvements and implements key innovations."
    }
  },
  {
    "id": 10,
    "name": "Be Proactive",
    "category": "Commitment",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Speaks up when others break working agreements. Questions team decisions if they disagree. Manages basic conflicts. No initiative management expected.",
      "Intermediate Engineer": "Ensures task completion and actively pushes to meet sprint goals. Thoughtful about processes and proposes changes for team effectiveness. Delivers on commitments. Shows growing confidence in defending ideas with data and reasoning. Navigates team disagreements constructively. Contributes to initiative management. Starts to influence team practices and technical discussions.",
      "Senior Engineer": "Raises issues early when seeing obstacles. Develops solutions beyond individual scope. Resolves cross-team issues proactively. Thinks in long term and balances pragmatism with long-term strategy. Leads initiatives and wants to implement key innovations. Manages conflicts in code reviews and technical discussions.",
      "Staff Engineer": "Takes ownership of working with teams and driving IT org-level priorities. Proactively identifies risks, trade-offs, and mitigates them early. Aligns initiatives with organizational goals and oversees initiative effectiveness. Balances pragmatism with perfection, making trade-offs transparent. Thought leader sharing knowledge inside and outside company."
    }
  },
  {
    "id": 11,
    "name": "Collaboration Model",
    "category": "Commitment",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Positive and constructive in team interactions. Works effectively with other team members on tasks. Shows basic empathy and demonstrates good communication skills.",
      "Intermediate Engineer": "Provides constructive feedback on team collaboration. Contributes to continuous improvement of processes and working model. Understands team dynamics and adapts response accordingly. Mentors less-experienced members within immediate team.",
      "Senior Engineer": "Identifies and helps resolve cross-team dependencies and issues. Applies advanced emotional intelligence across teams. Mentors other members of IT organization.",
      "Staff Engineer": "Fosters positive organizational culture. Facilitates cross-team ideation and establishes processes that turn innovative ideas into reality. Builds strong relationships across teams and drives cultural transformation."
    }
  },
  {
    "id": 12,
    "name": "Positive Attitude",
    "category": "Commitment",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Open-minded and demonstrates positive attitude to work and team. Adaptable and shows resilience. Accepts the way things are done. Engages in open communication and feedback.",
      "Intermediate Engineer": "Maintains consistent positive attitude under normal work pressures. Strong problem-solving mindset. Team-oriented approach. Able to break down ambiguity into clear tasks.",
      "Senior Engineer": "Sustains positive attitude across challenging situations. Recognized as approachable and supportive. Supports team morale.",
      "Staff Engineer": "Inspires others through positive attitude and can-do mentality. Cultivates strong relationships across teams and elevates morale at organizational level. Inspires engineers across squads to adopt new practices and technologies."
    }
  },
  {
    "id": 13,
    "name": "Task Completion & Accountability",
    "category": "Commitment",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Completes tasks in a foreseeable timeframe and consistently delivers on them.",
      "Intermediate Engineer": "Meets deadlines while contributing to milestones and communicates outcomes on time. Drives work tasks to completion and actively pushes to meet sprint goals.",
      "Senior Engineer": "Ensures timely delivery of high-value work, balancing multiple tasks and priorities while optimizing personal time allocation.",
      "Staff Engineer": "Defines and drives cross-team technical initiatives (e.g., SDK evolution, platform migration, scalability, security). Establishes technical vision across multiple teams."
    }
  },
  {
    "id": 14,
    "name": "Technical Scope",
    "category": "Scope & Scale",
    "tag": "SCALE",
    "expectations": {
      "Junior Engineer": "Handles tasks in context of features or bugfixes independently with guidance.",
      "Intermediate Engineer": "Understands the system, can implement tasks, and develop ideas. Manages individual tasks with minimal guidance, owning small to medium features and writing effective tests.",
      "Senior Engineer": "Possesses strong technical skills, developing concepts, evaluating feasibility, and analyzing complex problems while ensuring maintainable, testable designs. Owns significant features and influences team practices.",
      "Staff Engineer": "Leads technical projects, establishes standards, and identifies complex issues while designing innovative solutions to extend business capabilities and ensure sustainability."
    }
  },
  {
    "id": 15,
    "name": "Business Scope",
    "category": "Scope & Scale",
    "tag": "SCALE",
    "expectations": {
      "Junior Engineer": "Possesses a basic understanding of IT and business priorities, as well as project goals.",
      "Intermediate Engineer": "While implementing new features gains in-depth knowledge of technology and business. Prioritizes quality, connects technical decisions to business needs, and supports team members in these contexts.",
      "Senior Engineer": "Collaborates with stakeholders to ensure technical solutions meet business needs while mentoring colleagues and influencing team culture for sustainable growth.",
      "Staff Engineer": "Aligns large-scale technical strategies with business goals, representing IT in prioritization discussions and focusing on long-term organizational initiatives."
    }
  },
  {
    "id": 16,
    "name": "Communication Skills",
    "category": "Interpersonal Skills",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Demonstrates clear written and spoken communication. Practices active listening and asks clarifying questions. Communicates effectively with team members. English proficiency required.",
      "Intermediate Engineer": "Presents technical ideas concisely to technical audiences. Maintains solution-focused communication with team members. Applies effective communication principles.",
      "Senior Engineer": "Presents ideas and insights clearly to various audiences. Adapts communication style according to target audience. Explains complex problems and solutions to people inside and outside their domain of expertise. Presents ideas to larger audiences confidently.",
      "Staff Engineer": "Consistently demonstrates excellent target-group-oriented communication. Acts as a role model for communication on IT org level. Speaks with facts and drives data-based decisions. Mentors others on communication skills."
    }
  },
  {
    "id": 17,
    "name": "Collaboration & Teamwork",
    "category": "Interpersonal Skills",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Works successfully with team members as an active team player. Demonstrates proactive collaboration within the team. Actively gathers information and learns from teammates.",
      "Intermediate Engineer": "Collaborates effectively within and beyond the team (with QA, PO, Designers). Demonstrates proactive cross-team collaboration. Works fluently across team boundaries.",
      "Senior Engineer": "Acts as collaboration facilitator/coordinator within the team. Demonstrates strong collaboration across roles and disciplines (PO, QA, DevOps, Designers, PM). Collaborates closely with product managers, designers, and stakeholders. Manages internal (operations & support) and external (customer) communication.",
      "Staff Engineer": "Leads cross-functional strategic projects and strategic cross-team initiatives. Effectively deals with different personalities and working styles. Has profound knowledge of the company and clearly explains organizational details to others."
    }
  },
  {
    "id": 18,
    "name": "Collaboration & Mentorship",
    "category": "Interpersonal Skills",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Actively engages in understanding requirements and their impact on the team.",
      "Intermediate Engineer": "Supports junior colleagues by providing guidance through pair programming and mentoring. Actively contributes in technical discussions and decisions.",
      "Senior Engineer": "Coaches and mentors juniors and intermediates, shaping the growth of the team and supporting junior developers.",
      "Staff Engineer": "Mentors Senior Engineers, builds and scales the technical leadership pipeline, and supports the growth of less experienced developers through mentorship and sharing knowledge."
    }
  },
  {
    "id": 19,
    "name": "Critical Thinking & Contribution",
    "category": "Team Contribution",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Maintains openness to different ideas while respectfully disagreeing when needed. Questions team decisions constructively and proposes alternatives without being dogmatic. Asks questions proactively to get help and clarification.",
      "Intermediate Engineer": "Considers the impact of code changes on other teams, and informs them proactively. Questions team decisions constructively and proposes alternatives without being dogmatic.",
      "Senior Engineer": "Raises issues early when they see obstacles to achieving a goal (individual, team or department), and works to find solutions",
      "Staff Engineer": "Acts as role model on IT org-level. Fosters organization-wide feedback culture and mentors others on feedback exchange effectively."
    }
  },
  {
    "id": 20,
    "name": "Process - Agile/Scrum",
    "category": "Team Contribution",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Understands Scrum basics; participates reliably in all ceremonies as a team member. Keeps own work DoR/DoD-compliant; updates board daily; raises impediments early. Slices tasks with guidance; limits WIP; contributes at retros with at least one improvement idea. Adopts FAIL-Forward: surfaces mistakes quickly and turns them into learnings.",
      "Intermediate Engineer": "Prepares stories with PO for own scope; writes/clarifies acceptance criteria independently. Proactively manages dependencies with peers; adjusts scope with PO. Proposes and runs small process experiments within the team (e.g., smaller batch). Supports the PO/SM when asked (e.g., time-boxing a stand-up), without owning facilitation as a role.",
      "Senior Engineer": "Models agile engineering practices that enable flow (e.g., CI, feature toggles, trunk-friendly habits). Coaches teammates on slicing, readiness, and definition of done; improves working agreements with the team. Uses lightweight flow data (cycle time, throughput, WIP) to inform trade-offs and mid-sprint replans. Coordinates cross-team dependencies with peers; can co-facilitate a ceremony when the SM is absent. Installs a FAIL-Forward culture: blameless reviews, fast feedback, documented learnings.",
      "Staff Engineer": "Co-designs the team-of-teams operating model with TLs/PMs/POs (cadences, DoR/DoD variants, WIP policies). Standardizes minimal shared metrics, keeping them lightweight. Removes systemic impediments beyond a single team; ensures learnings are captured and reused (FAIL-Forward at scale)"
    }
  },
  {
    "id": 21,
    "name": "Problem Solving & Issue Handling",
    "category": "Team Contribution",
    "tag": "RESPONSIBILITY",
    "expectations": {
      "Junior Engineer": "Takes responsibility for their actions, acknowledges their own mistakes, and speaks up when others break working agreements.",
      "Intermediate Engineer": "When finding an issue in another team, raises the issue skillfully with that team. Considers the impact of code changes on other teams and informs them proactively.",
      "Senior Engineer": "Raises issues early when they see obstacles, drives incident handling in the team, and speaks up on broader issues beyond their own work such as processes, company issues, or large projects.",
      "Staff Engineer": "Acts as a sparring partner for multiple squads and senior engineers, works as the last line of defence after ATB, and explores new technologies through POCs and prototypes."
    }
  }
]
```

- [ ] **Step 2: Copy to demo file**

```bash
cp data/competencies.json data/demo-competencies.json
```

- [ ] **Step 3: Commit**

```bash
git add data/competencies.json data/demo-competencies.json
git commit -m "feat: add competency catalog data from Competence_Matrix.xlsx"
```

---

### Task 2: Add competencies API route and data layer

**Files:**
- Modify: `lib/data.js`
- Create: `app/api/competencies/route.js`

- [ ] **Step 1: Add competency helpers to `lib/data.js`**

Add at the bottom of `lib/data.js`:

```javascript
export async function getCompetencies() {
  return readJSON('competencies.json', 'demo-competencies.json');
}
```

- [ ] **Step 2: Create `app/api/competencies/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getCompetencies } from '@/lib/data';

export async function GET() {
  const competencies = await getCompetencies();
  return NextResponse.json(competencies);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/data.js app/api/competencies/route.js
git commit -m "feat: add competencies API route and data layer"
```

---

### Task 3: Migrate goal model to SMART structure

**Files:**
- Modify: `data/demo-employees.json`

Replace the simple `measurable`/`deadline` goal fields with full SMART fields. Update all 4 demo employees.

- [ ] **Step 1: Update `data/demo-employees.json`**

Replace the entire personal goals and team goals for each employee with SMART structure. Each personal goal gets `why`, `specific`, `measurable`, `achievable`, `relevant`, `timeBound` fields. Team goals keep their existing structure (they are team-level, not individually owned SMART goals).

For employee Laura Müller (id: 1), replace `personalGoals`:

```json
"personalGoals": [
  {
    "id": 1,
    "title": "AWS Solutions Architect Zertifizierung",
    "why": "Cloud-Expertise ist strategisch wichtig für das Team. Laura kann als zertifizierte Architektin fundierte Infrastruktur-Entscheidungen treffen und das Team in Cloud-Themen anleiten.",
    "specific": "AWS Solutions Architect Professional Zertifizierung ablegen und bestehen.",
    "measurable": "Prüfung bestanden mit Score >800",
    "achievable": "Laura arbeitet bereits täglich mit AWS und hat die Associate-Zertifizierung. Die Professional-Prüfung baut auf vorhandenem Wissen auf.",
    "relevant": "Stärkt die Cloud-Kompetenz im Team und ermöglicht fundierte Architekturentscheidungen bei der laufenden Cloud-Migration.",
    "timeBound": "Prüfung bis Ende Juni 2026 ablegen",
    "progress": 85,
    "weight": 25,
    "status": "on-track"
  },
  {
    "id": 2,
    "title": "3 Tech-Talks halten",
    "why": "Wissenstransfer innerhalb der Organisation fördern und Lauras Sichtbarkeit als technische Führungsperson stärken.",
    "specific": "3 interne Tech-Talks zu relevanten Engineering-Themen halten, jeweils mit mindestens 20 Teilnehmern.",
    "measurable": "3 Talks gehalten, mind. 20 Teilnehmer pro Talk",
    "achievable": "Laura hat bereits einen Talk gehalten und positives Feedback erhalten. Die Infrastruktur für interne Talks existiert.",
    "relevant": "Fördert Wissenstransfer und positioniert Laura als technische Ansprechpartnerin über das Team hinaus.",
    "timeBound": "Alle 3 Talks bis Ende September 2026",
    "progress": 66,
    "weight": 15,
    "status": "on-track"
  },
  {
    "id": 3,
    "title": "Mentoring von 2 Junioren",
    "why": "Junior-Entwickler brauchen strukturierte Begleitung, um produktiv zu werden. Laura hat die Erfahrung und das Standing, effektives Mentoring zu leisten.",
    "specific": "Zwei Junior-Entwickler durch strukturiertes Mentoring begleiten, sodass beide ihr Probezeit-Review bestehen.",
    "measurable": "2 Junioren bestehen Probezeit-Review",
    "achievable": "Beide Junioren sind bereits im Team und Laura arbeitet regelmäßig mit ihnen zusammen.",
    "relevant": "Stärkt die Teamstabilität und reduziert den Bus-Faktor bei kritischen Komponenten.",
    "timeBound": "Probezeit-Reviews bis Ende März 2026 abgeschlossen",
    "progress": 100,
    "weight": 20,
    "status": "completed"
  }
]
```

For Thomas Weber (id: 2), replace `personalGoals`:

```json
"personalGoals": [
  {
    "id": 1,
    "title": "Product Analytics Framework aufbauen",
    "why": "Datengetriebene Entscheidungen sind derzeit nicht systematisch möglich. Ein Analytics-Framework gibt dem Produktteam objektive Grundlagen für Priorisierungen.",
    "specific": "Ein Product Analytics Dashboard aufbauen mit 5 Core-Metriken, das wöchentlich vom Produktteam genutzt wird.",
    "measurable": "Dashboard live mit 5 Core-Metriken, wöchentlich genutzt",
    "achievable": "Die Datenquellen existieren bereits, es fehlt die Zusammenführung und Visualisierung. Tools sind evaluiert.",
    "relevant": "Ermöglicht evidenzbasierte Produktentscheidungen statt Bauchgefühl und verbessert die Kommunikation mit Stakeholdern.",
    "timeBound": "Dashboard live und in regelmäßiger Nutzung bis Ende Juni 2026",
    "progress": 60,
    "weight": 30,
    "status": "at-risk"
  },
  {
    "id": 2,
    "title": "Stakeholder-NPS auf 8+ bringen",
    "why": "Die Zusammenarbeit mit Stakeholdern wurde als verbesserungswürdig identifiziert. Ein höherer NPS zeigt bessere Alignment und Zufriedenheit.",
    "specific": "Den internen Stakeholder-NPS durch verbesserte Kommunikation und Erwartungsmanagement auf 8.0 oder höher steigern.",
    "measurable": "NPS-Score >= 8.0 in quartalsweiser Umfrage",
    "achievable": "Aktueller NPS liegt bei 6.5. Durch regelmäßige Stakeholder-Updates und bessere Roadmap-Transparenz ist eine Steigerung realistisch.",
    "relevant": "Bessere Stakeholder-Beziehungen beschleunigen Entscheidungsprozesse und reduzieren Scope-Konflikte.",
    "timeBound": "NPS >= 8.0 in der Q3 2026 Umfrage",
    "progress": 45,
    "weight": 25,
    "status": "behind"
  },
  {
    "id": 3,
    "title": "OKR-Prozess einführen",
    "why": "Dem Team fehlt ein strukturierter Rahmen für Zielsetzung und -verfolgung. OKRs schaffen Transparenz und Alignment.",
    "specific": "Einen vollständigen OKR-Prozess einführen und 3 Zyklen durchführen mit dokumentierter Retrospektive.",
    "measurable": "3 Zyklen durchgeführt, Retro dokumentiert",
    "achievable": "Erste OKR-Schulungen sind erfolgt und das Management unterstützt die Einführung.",
    "relevant": "OKRs schaffen teamübergreifendes Alignment und machen Fortschritt messbar.",
    "timeBound": "3 vollständige OKR-Zyklen bis Ende März 2026",
    "progress": 100,
    "weight": 20,
    "status": "completed"
  }
]
```

For Sarah Koch (id: 3), replace `personalGoals`:

```json
"personalGoals": [
  {
    "id": 1,
    "title": "Design System v2.0 launchen",
    "why": "Das aktuelle Design System ist veraltet und inkonsistent. Ein modernisiertes System beschleunigt die Entwicklung und verbessert die UX-Konsistenz.",
    "specific": "Alle 40 Komponenten auf das neue Design System migrieren und in Storybook dokumentiert bereitstellen.",
    "measurable": "Alle 40 Komponenten migriert, Storybook live",
    "achievable": "35 von 40 Komponenten sind bereits migriert. Die verbleibenden 5 sind identifiziert.",
    "relevant": "Ein aktuelles Design System ist die Grundlage für konsistente UX und effiziente Entwicklung.",
    "timeBound": "Launch bis Ende April 2026",
    "progress": 95,
    "weight": 35,
    "status": "on-track"
  },
  {
    "id": 2,
    "title": "Usability Testing Prozess etablieren",
    "why": "UX-Entscheidungen basieren derzeit auf Annahmen. Strukturiertes Usability Testing liefert Evidenz für Designentscheidungen.",
    "specific": "Einen dokumentierten Usability-Testing-Prozess etablieren und mindestens 3 Tests erfolgreich durchführen.",
    "measurable": "Prozess dokumentiert, 3 Tests durchgeführt",
    "achievable": "Tools sind evaluiert, Budget ist genehmigt. Sarah hat Erfahrung mit Usability Testing aus früheren Rollen.",
    "relevant": "Verbessert die Qualität von Designentscheidungen und reduziert kostspielige Nachbesserungen.",
    "timeBound": "Prozess etabliert und 3 Tests abgeschlossen bis Ende März 2026",
    "progress": 100,
    "weight": 25,
    "status": "completed"
  },
  {
    "id": 3,
    "title": "Figma-to-Code Workflow optimieren",
    "why": "Der aktuelle Handoff dauert 3 Tage und verursacht häufig Missverständnisse zwischen Design und Entwicklung.",
    "specific": "Den Design-to-Code Handoff-Prozess optimieren, sodass die durchschnittliche Handoff-Zeit von 3 Tagen auf 1 Tag sinkt.",
    "measurable": "Handoff-Zeit von 3 Tagen auf 1 Tag reduziert",
    "achievable": "Durch bessere Figma-Struktur und automatisierte Exporte ist eine deutliche Beschleunigung möglich.",
    "relevant": "Schnellerer Handoff beschleunigt die Feature-Entwicklung und reduziert Kommunikationsaufwand.",
    "timeBound": "Neuer Workflow implementiert bis Ende September 2026",
    "progress": 70,
    "weight": 15,
    "status": "on-track"
  }
]
```

For Markus Braun (id: 4), replace `personalGoals`:

```json
"personalGoals": [
  {
    "id": 1,
    "title": "Kubernetes Migration abschließen",
    "why": "Die aktuelle VM-basierte Infrastruktur skaliert schlecht und ist teuer im Betrieb. Kubernetes ermöglicht Auto-Scaling und vereinfacht Deployments.",
    "specific": "Alle 12 Microservices auf Kubernetes migrieren, sowohl in Staging als auch in Production.",
    "measurable": "Alle 12 Services auf K8s, Staging + Prod",
    "achievable": "4 Services sind bereits migriert. Die verbleibenden 8 folgen dem etablierten Migrations-Playbook.",
    "relevant": "Kubernetes ist die strategische Plattform für die nächsten 3 Jahre. Die Migration ist Voraussetzung für weitere Automatisierung.",
    "timeBound": "Alle Services migriert bis Ende Juni 2026",
    "progress": 40,
    "weight": 35,
    "status": "behind"
  },
  {
    "id": 2,
    "title": "Disaster Recovery Plan erstellen",
    "why": "Es gibt keinen dokumentierten DR-Plan. Im Ernstfall wäre die Wiederherstellung chaotisch und zeitintensiv.",
    "specific": "Einen vollständigen Disaster Recovery Plan dokumentieren und mindestens einen DR-Drill erfolgreich durchführen.",
    "measurable": "Plan dokumentiert, 1 DR-Drill erfolgreich durchgeführt",
    "achievable": "Die meisten Recovery-Prozeduren existieren informell. Sie müssen dokumentiert und getestet werden.",
    "relevant": "Business Continuity ist eine Compliance-Anforderung und ein Risiko für das gesamte Unternehmen.",
    "timeBound": "DR-Plan dokumentiert und Drill durchgeführt bis Ende September 2026",
    "progress": 30,
    "weight": 25,
    "status": "at-risk"
  },
  {
    "id": 3,
    "title": "Monitoring-Dashboard aufbauen",
    "why": "Ohne zentrales Monitoring werden Probleme oft erst durch Nutzerbeschwerden erkannt. Proaktives Monitoring verkürzt die Reaktionszeit.",
    "specific": "Ein zentrales Monitoring-Dashboard mit 10 Core-Metriken aufbauen und Alerting für kritische Schwellwerte konfigurieren.",
    "measurable": "Dashboard mit 10 Core-Metriken, Alerting konfiguriert",
    "achievable": "Prometheus und Grafana sind bereits installiert. Es fehlt die Dashboard-Konfiguration und Alert-Rules.",
    "relevant": "Zentrales Monitoring ist Voraussetzung für den 99.9% Uptime-Zielwert des Teams.",
    "timeBound": "Dashboard live und Alerting aktiv bis Ende April 2026",
    "progress": 80,
    "weight": 15,
    "status": "on-track"
  }
]
```

Also add `competencyAssessments`, `githubUsername`, and `githubData` to each employee:

For Laura Müller (id: 1), add after `"lastReview"`:

```json
"githubUsername": "",
"githubData": null,
"competencyAssessments": [
  { "competencyId": 3, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 5, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 6, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 10, "met": false, "isTarget": true, "milestones": [
    { "id": 1, "title": "Cross-Team Initiative leiten", "status": "pending", "dueDate": "2026-09-30" },
    { "id": 2, "title": "Technische Entscheidung in fremdem Team vertreten", "status": "pending", "dueDate": "2026-06-30" }
  ]},
  { "competencyId": 17, "met": true, "isTarget": false, "milestones": [] }
]
```

For Thomas Weber (id: 2):

```json
"githubUsername": "",
"githubData": null,
"competencyAssessments": [
  { "competencyId": 16, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 12, "met": false, "isTarget": true, "milestones": [
    { "id": 1, "title": "Team-Motivation nach gescheitertem Sprint wiederherstellen", "status": "done", "dueDate": "2026-03-31" },
    { "id": 2, "title": "Positive Retrospektive-Kultur etablieren", "status": "pending", "dueDate": "2026-06-30" }
  ]}
]
```

For Sarah Koch (id: 3):

```json
"githubUsername": "",
"githubData": null,
"competencyAssessments": [
  { "competencyId": 17, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 18, "met": true, "isTarget": false, "milestones": [] },
  { "competencyId": 14, "met": false, "isTarget": true, "milestones": [
    { "id": 1, "title": "Eigenständig Design-System-Architektur dokumentieren", "status": "done", "dueDate": "2026-03-31" },
    { "id": 2, "title": "Component-Library Ownership übernehmen", "status": "pending", "dueDate": "2026-09-30" }
  ]}
]
```

For Markus Braun (id: 4):

```json
"githubUsername": "",
"githubData": null,
"competencyAssessments": [
  { "competencyId": 1, "met": false, "isTarget": true, "milestones": [
    { "id": 1, "title": "Integration Tests für alle migrierten Services", "status": "pending", "dueDate": "2026-06-30" },
    { "id": 2, "title": "Testabdeckung auf 70% bringen", "status": "pending", "dueDate": "2026-09-30" }
  ]},
  { "competencyId": 6, "met": true, "isTarget": false, "milestones": [] }
]
```

- [ ] **Step 2: Delete `data/employees.json` if it exists** (so the app falls back to the updated demo data)

```bash
rm -f data/employees.json data/settings.json
```

- [ ] **Step 3: Commit**

```bash
git add data/demo-employees.json
git commit -m "feat: migrate demo goals to SMART structure, add competency assessments and GitHub fields"
```

---

### Task 4: Update settings model with githubOrg

**Files:**
- Modify: `data/demo-settings.json`

- [ ] **Step 1: Update `data/demo-settings.json`**

```json
{
  "budget": 15000,
  "githubOrg": "collaborationFactory"
}
```

- [ ] **Step 2: Commit**

```bash
git add data/demo-settings.json
git commit -m "feat: add githubOrg to settings"
```

---

### Task 5: Update constants with competency categories and tags

**Files:**
- Modify: `utils/constants.js`

- [ ] **Step 1: Add competency constants to `utils/constants.js`**

Add after the existing `categoryLabels`:

```javascript
export const competencyCategories = [
  "Technology",
  "Open-mindedness & Willingness to Learn",
  "Commitment",
  "Scope & Scale",
  "Interpersonal Skills",
  "Team Contribution",
];

export const competencyCategoryLabels = {
  "Technology": "Technologie",
  "Open-mindedness & Willingness to Learn": "Offenheit & Lernbereitschaft",
  "Commitment": "Engagement",
  "Scope & Scale": "Umfang & Wirkungsbereich",
  "Interpersonal Skills": "Zwischenmenschliche Fähigkeiten",
  "Team Contribution": "Teambeitrag",
};

export const competencyTagLabels = {
  "SKILL": "Fähigkeit",
  "RESPONSIBILITY": "Verantwortung",
  "SCALE": "Wirkungsbereich",
};

export const competencyTagColors = {
  "SKILL": "var(--blue)",
  "RESPONSIBILITY": "var(--purple)",
  "SCALE": "var(--warning)",
};
```

- [ ] **Step 2: Commit**

```bash
git add utils/constants.js
git commit -m "feat: add competency category and tag constants"
```

---

### Task 6: Fetch competencies in App.jsx and pass to EmployeeDetail

**Files:**
- Modify: `components/App.jsx`

- [ ] **Step 1: Add competencies state and fetch**

In `App.jsx`, add a `competencies` state alongside existing states (line ~10):

```javascript
const [competencies, setCompetencies] = useState([]);
```

In the `load()` function, fetch competencies alongside other data. Update the `Promise.all` (line ~23):

```javascript
const [empRes, rolesRes, setRes, compRes] = await Promise.all([
  fetch('/api/employees'),
  fetch('/api/roles'),
  fetch('/api/settings'),
  fetch('/api/competencies'),
]);
```

After the existing data parsing (line ~28), add:

```javascript
const compData = await compRes.json();
```

After `setBudget(setData.budget)` (line ~30), add:

```javascript
setCompetencies(compData);
```

- [ ] **Step 2: Pass competencies and settings to EmployeeDetail**

Update the `EmployeeDetail` component call (around line 178) to pass the new props:

```jsx
<EmployeeDetail
  key={selectedEmp.id}
  emp={selectedEmp}
  onBack={() => setSelectedId(null)}
  onUpdate={handleUpdate}
  onDelete={handleDeleteEmployee}
  budget={budget}
  employees={employees}
  competencies={competencies}
  settings={{ budget, githubOrg: 'collaborationFactory' }}
/>
```

Also update the `load()` to store settings and pass `githubOrg`. Replace `setBudget(setData.budget)` with:

```javascript
setBudget(setData.budget);
```

And store settings in a ref or state. Add state:

```javascript
const [settings, setSettings] = useState({ budget: 15000, githubOrg: 'collaborationFactory' });
```

In `load()`, after parsing settings:

```javascript
setSettings(setData);
setBudget(setData.budget);
```

Update the `handleBudgetChange` to also persist githubOrg:

Replace the `body: JSON.stringify({ budget: newBudget })` with:

```javascript
body: JSON.stringify({ ...settings, budget: newBudget }),
```

And update local state:

```javascript
setSettings(prev => ({ ...prev, budget: newBudget }));
```

Update EmployeeDetail props:

```jsx
<EmployeeDetail
  key={selectedEmp.id}
  emp={selectedEmp}
  onBack={() => setSelectedId(null)}
  onUpdate={handleUpdate}
  onDelete={handleDeleteEmployee}
  budget={budget}
  employees={employees}
  competencies={competencies}
  settings={settings}
/>
```

- [ ] **Step 3: Commit**

```bash
git add components/App.jsx
git commit -m "feat: fetch competencies and pass to EmployeeDetail"
```

---

### Task 7: Create CompetencyTab component

**Files:**
- Create: `components/CompetencyTab.jsx`

- [ ] **Step 1: Create `components/CompetencyTab.jsx`**

```jsx
'use client';

import { useState } from 'react';
import Card from './Card';
import { competencyCategoryLabels, competencyTagLabels, competencyTagColors } from '@/utils/constants';

export default function CompetencyTab({ emp, competencies, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newMilestone, setNewMilestone] = useState({});

  const assessments = emp.competencyAssessments || [];

  const getAssessment = (compId) => assessments.find(a => a.competencyId === compId);

  const toggleMet = (compId) => {
    const existing = getAssessment(compId);
    let updated;
    if (existing) {
      updated = assessments.map(a =>
        a.competencyId === compId ? { ...a, met: !a.met } : a
      );
    } else {
      updated = [...assessments, { competencyId: compId, met: true, isTarget: false, milestones: [] }];
    }
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const toggleTarget = (compId) => {
    const existing = getAssessment(compId);
    let updated;
    if (existing) {
      updated = assessments.map(a =>
        a.competencyId === compId ? { ...a, isTarget: !a.isTarget } : a
      );
    } else {
      updated = [...assessments, { competencyId: compId, met: false, isTarget: true, milestones: [] }];
    }
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const addMilestone = (compId) => {
    const text = newMilestone[compId]?.title;
    const date = newMilestone[compId]?.dueDate;
    if (!text?.trim()) return;
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return {
        ...a,
        milestones: [...a.milestones, { id: Date.now(), title: text, status: 'pending', dueDate: date || '' }],
      };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
    setNewMilestone(prev => ({ ...prev, [compId]: { title: '', dueDate: '' } }));
  };

  const toggleMilestone = (compId, msId) => {
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return {
        ...a,
        milestones: a.milestones.map(m =>
          m.id === msId ? { ...m, status: m.status === 'done' ? 'pending' : 'done' } : m
        ),
      };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const deleteMilestone = (compId, msId) => {
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return { ...a, milestones: a.milestones.filter(m => m.id !== msId) };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  // Group competencies by category
  const grouped = {};
  competencies.forEach(comp => {
    if (!grouped[comp.category]) grouped[comp.category] = [];
    grouped[comp.category].push(comp);
  });

  const metCount = assessments.filter(a => a.met).length;
  const totalCount = competencies.length;
  const targetCount = assessments.filter(a => a.isTarget).length;
  const targetDoneCount = assessments
    .filter(a => a.isTarget)
    .reduce((sum, a) => sum + a.milestones.filter(m => m.status === 'done').length, 0);
  const targetTotalCount = assessments
    .filter(a => a.isTarget)
    .reduce((sum, a) => sum + a.milestones.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Card>
          <div className="kpi-label">Erfüllt</div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{metCount}/{totalCount}</div>
          <div className="kpi-sub">Kompetenzen</div>
        </Card>
        <Card>
          <div className="kpi-label">Entwicklungsziele</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{targetCount}</div>
          <div className="kpi-sub">markiert</div>
        </Card>
        <Card>
          <div className="kpi-label">Meilensteine</div>
          <div className="kpi-value" style={{ color: 'var(--blue)' }}>{targetDoneCount}/{targetTotalCount}</div>
          <div className="kpi-sub">erledigt</div>
        </Card>
      </div>

      {Object.entries(grouped).map(([category, comps]) => (
        <div key={category}>
          <h3 className="section-title" style={{ marginTop: 8 }}>
            {competencyCategoryLabels[category] || category}
          </h3>
          {comps.map(comp => {
            const assessment = getAssessment(comp.id);
            const isMet = assessment?.met || false;
            const isTarget = assessment?.isTarget || false;
            const milestones = assessment?.milestones || [];
            const expectation = comp.expectations[emp.role];
            const isExpanded = expandedId === comp.id;
            const ms = newMilestone[comp.id] || { title: '', dueDate: '' };

            return (
              <Card key={comp.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{comp.name}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: `color-mix(in srgb, ${competencyTagColors[comp.tag]} 15%, transparent)`,
                        color: competencyTagColors[comp.tag],
                        letterSpacing: '0.5px',
                      }}>
                        {competencyTagLabels[comp.tag]}
                      </span>
                    </div>
                    {expectation && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                        {expectation}
                      </p>
                    )}
                    {!expectation && (
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '4px 0 0', fontStyle: 'italic' }}>
                        Keine Erwartung für Rolle „{emp.role}" definiert
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 12 }}>
                    <button
                      className="btn btn--ghost"
                      style={{
                        background: isMet ? 'var(--accent-dim)' : 'transparent',
                        color: isMet ? 'var(--accent)' : 'var(--text-dim)',
                        border: isMet ? 'none' : '1px solid var(--border)',
                      }}
                      onClick={() => toggleMet(comp.id)}
                      title={isMet ? 'Erfüllt' : 'Nicht erfüllt'}
                    >
                      {isMet ? '✓ Erfüllt' : '○ Offen'}
                    </button>
                    <button
                      className="btn btn--ghost"
                      style={{
                        background: isTarget ? 'var(--warning-dim)' : 'transparent',
                        color: isTarget ? 'var(--warning)' : 'var(--text-dim)',
                        border: isTarget ? 'none' : '1px solid var(--border)',
                        fontSize: 11,
                      }}
                      onClick={() => toggleTarget(comp.id)}
                      title={isTarget ? 'Als Entwicklungsziel markiert' : 'Als Entwicklungsziel markieren'}
                    >
                      {isTarget ? '★ Ziel' : '☆ Ziel'}
                    </button>
                  </div>
                </div>

                {isTarget && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Meilensteine</span>
                      <button
                        className="btn btn--ghost"
                        style={{ fontSize: 10 }}
                        onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                      >
                        {isExpanded ? '− Zuklappen' : '+ Hinzufügen'}
                      </button>
                    </div>

                    {milestones.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <button
                          style={{
                            width: 18, height: 18, borderRadius: 4, border: `1px solid ${m.status === 'done' ? 'var(--accent)' : 'var(--border-light)'}`,
                            background: m.status === 'done' ? 'var(--accent-dim)' : 'transparent',
                            color: m.status === 'done' ? 'var(--accent)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                          }}
                          onClick={() => toggleMilestone(comp.id, m.id)}
                        >
                          {m.status === 'done' ? '✓' : ''}
                        </button>
                        <span style={{
                          flex: 1, fontSize: 12, color: m.status === 'done' ? 'var(--text-dim)' : 'var(--text)',
                          textDecoration: m.status === 'done' ? 'line-through' : 'none',
                        }}>
                          {m.title}
                        </span>
                        {m.dueDate && (
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {new Date(m.dueDate).toLocaleDateString('de-DE')}
                          </span>
                        )}
                        <button
                          className="btn btn--ghost"
                          style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 10 }}
                          onClick={() => deleteMilestone(comp.id, m.id)}
                        >✕</button>
                      </div>
                    ))}

                    {isExpanded && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          placeholder="Meilenstein beschreiben..."
                          value={ms.title}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, [comp.id]: { ...ms, title: e.target.value } }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') addMilestone(comp.id); }}
                        />
                        <input
                          type="date"
                          className="input"
                          style={{ width: 140 }}
                          value={ms.dueDate}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, [comp.id]: { ...ms, dueDate: e.target.value } }))}
                        />
                        <button className="btn btn--primary" onClick={() => addMilestone(comp.id)}>+</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CompetencyTab.jsx
git commit -m "feat: create CompetencyTab component"
```

---

### Task 8: Create goal parser utility

**Files:**
- Create: `utils/goalParser.js`

- [ ] **Step 1: Create `utils/goalParser.js`**

```javascript
/**
 * Parses a markdown file following the SMART goal template format.
 * Supports both "## Goal N: Title" and "## Title" header formats.
 * Returns an array of parsed goal objects.
 */
export function parseGoalsMarkdown(markdown) {
  const goals = [];
  const lines = markdown.split('\n');

  let currentGoal = null;
  let currentSection = null;
  let sectionBuffer = [];

  const sectionMap = {
    'WHY': 'why',
    'S': 'specific',
    'M': 'measurable',
    'A': 'achievable',
    'R': 'relevant',
    'T': 'timeBound',
  };

  function flushSection() {
    if (currentGoal && currentSection) {
      currentGoal[currentSection] = sectionBuffer.join('\n').trim();
    }
    sectionBuffer = [];
    currentSection = null;
  }

  function flushGoal() {
    flushSection();
    if (currentGoal && currentGoal.title) {
      goals.push({
        id: Date.now() + goals.length,
        title: currentGoal.title,
        why: currentGoal.why || '',
        specific: currentGoal.specific || '',
        measurable: currentGoal.measurable || '',
        achievable: currentGoal.achievable || '',
        relevant: currentGoal.relevant || '',
        timeBound: currentGoal.timeBound || '',
        progress: 0,
        weight: Math.round(100 / Math.max(goals.length + 1, 1)),
        status: 'not-started',
      });
    }
    currentGoal = null;
  }

  for (const line of lines) {
    // Match ## Goal N: Title or ## Title (but not ### subsections)
    const goalMatch = line.match(/^##\s+(?:Goal\s+\d+\s*:\s*)?(.+)/);
    if (goalMatch && !line.startsWith('###')) {
      flushGoal();
      currentGoal = { title: goalMatch[1].trim() };
      continue;
    }

    // Match ### subsections like "### WHY — Purpose" or "### S — Specific"
    const sectionMatch = line.match(/^###\s+(\w+)\s*[—–-]/);
    if (sectionMatch && currentGoal) {
      flushSection();
      const key = sectionMatch[1].toUpperCase();
      currentSection = sectionMap[key] || null;
      continue;
    }

    // Skip top-level # headers and --- separators
    if (line.match(/^#\s+/) || line.match(/^---\s*$/)) {
      continue;
    }

    // Accumulate content for current section
    if (currentSection) {
      sectionBuffer.push(line);
    }
  }

  // Flush the last goal
  flushGoal();

  // Recalculate weights evenly
  if (goals.length > 0) {
    const evenWeight = Math.round(100 / goals.length);
    goals.forEach((g, i) => {
      g.weight = i === goals.length - 1 ? 100 - evenWeight * (goals.length - 1) : evenWeight;
    });
  }

  return goals;
}
```

- [ ] **Step 2: Verify parser works with the template**

Create a quick test by running:

```bash
node -e "
const fs = require('fs');
const md = fs.readFileSync('data/personal_goal_template.md', 'utf-8');

// Inline the parser for testing (same logic as goalParser.js)
function parseGoalsMarkdown(markdown) {
  const goals = [];
  const lines = markdown.split('\n');
  let currentGoal = null;
  let currentSection = null;
  let sectionBuffer = [];
  const sectionMap = { 'WHY': 'why', 'S': 'specific', 'M': 'measurable', 'A': 'achievable', 'R': 'relevant', 'T': 'timeBound' };

  function flushSection() {
    if (currentGoal && currentSection) {
      currentGoal[currentSection] = sectionBuffer.join('\n').trim();
    }
    sectionBuffer = [];
    currentSection = null;
  }
  function flushGoal() {
    flushSection();
    if (currentGoal && currentGoal.title) {
      goals.push({ id: Date.now() + goals.length, title: currentGoal.title, why: currentGoal.why || '', specific: currentGoal.specific || '', measurable: currentGoal.measurable || '', achievable: currentGoal.achievable || '', relevant: currentGoal.relevant || '', timeBound: currentGoal.timeBound || '', progress: 0, weight: 0, status: 'not-started' });
    }
    currentGoal = null;
  }
  for (const line of lines) {
    const goalMatch = line.match(/^##\s+(?:Goal\s+\d+\s*:\s*)?(.+)/);
    if (goalMatch && !line.startsWith('###')) { flushGoal(); currentGoal = { title: goalMatch[1].trim() }; continue; }
    const sectionMatch = line.match(/^###\s+(\w+)\s*[—–-]/);
    if (sectionMatch && currentGoal) { flushSection(); const key = sectionMatch[1].toUpperCase(); currentSection = sectionMap[key] || null; continue; }
    if (line.match(/^#\s+/) || line.match(/^---\s*$/)) continue;
    if (currentSection) sectionBuffer.push(line);
  }
  flushGoal();
  if (goals.length > 0) { const w = Math.round(100 / goals.length); goals.forEach((g,i) => { g.weight = i === goals.length - 1 ? 100 - w * (goals.length - 1) : w; }); }
  return goals;
}

const result = parseGoalsMarkdown(md);
console.log('Parsed', result.length, 'goals:');
result.forEach(g => console.log('-', g.title, '| why:', g.why.substring(0,50) + '...', '| sections filled:', ['why','specific','measurable','achievable','relevant','timeBound'].filter(k => g[k]).length, '/6'));
"
```

Expected: `Parsed 2 goals:` with both "Team Enablement and Stability" and "OKR Ownership & Management Visibility" having 6/6 sections filled.

- [ ] **Step 3: Commit**

```bash
git add utils/goalParser.js
git commit -m "feat: add markdown SMART goal parser"
```

---

### Task 9: Create GoalUploadModal component

**Files:**
- Create: `components/GoalUploadModal.jsx`

- [ ] **Step 1: Create `components/GoalUploadModal.jsx`**

```jsx
'use client';

import { useState, useRef } from 'react';
import { parseGoalsMarkdown } from '@/utils/goalParser';
import Card from './Card';

export default function GoalUploadModal({ onImport, onClose }) {
  const [parsedGoals, setParsedGoals] = useState(null);
  const [error, setError] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const goals = parseGoalsMarkdown(text);
      if (goals.length === 0) {
        setError('Keine Ziele im Markdown gefunden. Bitte Format prüfen.');
        setParsedGoals(null);
      } else {
        setParsedGoals(goals);
        setError(null);
      }
    } catch (err) {
      setError('Fehler beim Lesen der Datei: ' + err.message);
      setParsedGoals(null);
    }
  };

  const handleConfirm = () => {
    if (parsedGoals) {
      onImport(parsedGoals);
      onClose();
    }
  };

  const smartSections = [
    { key: 'why', label: 'WHY — Zweck' },
    { key: 'specific', label: 'S — Spezifisch' },
    { key: 'measurable', label: 'M — Messbar' },
    { key: 'achievable', label: 'A — Erreichbar' },
    { key: 'relevant', label: 'R — Relevant' },
    { key: 'timeBound', label: 'T — Terminiert' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 24, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Ziele aus Markdown importieren
          </h3>
          <button className="btn btn--ghost" onClick={onClose} style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <button className="btn btn--primary" onClick={() => fileRef.current?.click()}>
            Markdown-Datei auswählen
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 12 }}>
            .md Datei im SMART-Format
          </span>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {parsedGoals && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {parsedGoals.length} Ziel{parsedGoals.length !== 1 ? 'e' : ''} erkannt — Vorschau:
            </div>

            {parsedGoals.map((goal, i) => (
              <Card key={i} style={{ marginBottom: 8 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedGoal(expandedGoal === i ? null : i)}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
                      Gewicht: {goal.weight}%
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {smartSections.filter(s => goal[s.key]).length}/6 Felder · {expandedGoal === i ? '▲' : '▼'}
                  </span>
                </div>

                {expandedGoal === i && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    {smartSections.map(s => (
                      <div key={s.key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: goal[s.key] ? 'var(--blue)' : 'var(--text-dim)', marginBottom: 2 }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {goal[s.key] || '(nicht ausgefüllt)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
              <button className="btn btn--primary" onClick={handleConfirm}>
                {parsedGoals.length} Ziel{parsedGoals.length !== 1 ? 'e' : ''} importieren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/GoalUploadModal.jsx
git commit -m "feat: create GoalUploadModal component with preview"
```

---

### Task 10: Create GitHub sync API route

**Files:**
- Create: `app/api/employees/[id]/github-sync/route.js`

- [ ] **Step 1: Create `app/api/employees/[id]/github-sync/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees, getSettings } from '@/lib/data';
import { execSync } from 'child_process';

function searchPRs(githubOrg, username, startDate, endDate, option) {
  try {
    const searchQuery = `is:merged is:pr user:${githubOrg} merged:${startDate}..${endDate} ${option}:${username}`;
    const result = execSync(`gh search prs --limit 500 --json repository,url "${searchQuery}"`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return result ? JSON.parse(result) : [];
  } catch {
    return [];
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { endDate, startDate: requestedStartDate } = body;

  if (!endDate) {
    return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
  }

  const employees = await getEmployees();
  const index = employees.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const emp = employees[index];
  if (!emp.githubUsername) {
    return NextResponse.json({ error: 'Employee has no githubUsername set' }, { status: 400 });
  }

  const settings = await getSettings();
  const githubOrg = settings.githubOrg || 'collaborationFactory';

  // Determine startDate
  const githubData = emp.githubData || { lastSyncedEnd: null, periods: [] };
  let startDate = requestedStartDate;
  if (!startDate && githubData.lastSyncedEnd) {
    startDate = githubData.lastSyncedEnd;
  }
  if (!startDate) {
    return NextResponse.json({ error: 'startDate is required for initial sync' }, { status: 400 });
  }

  // Fetch PR data
  const assignedPRs = searchPRs(githubOrg, emp.githubUsername, startDate, endDate, 'assignee');
  const reviewedPRs = searchPRs(githubOrg, emp.githubUsername, startDate, endDate, 'reviewed-by');

  const repositories = [...new Set(assignedPRs.map(pr => pr.repository.name))];

  const newPeriod = {
    timePeriod: `${startDate}-to-${endDate}`,
    startDate,
    endDate,
    pullRequestsCount: assignedPRs.length,
    reviewsCount: reviewedPRs.length,
    repositoriesCount: repositories.length,
    repositories,
    pullRequests: assignedPRs.map(pr => pr.url),
    reviewedPullRequests: reviewedPRs.map(pr => pr.url),
  };

  githubData.periods.push(newPeriod);
  githubData.periods.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  githubData.lastSyncedEnd = endDate;

  emp.githubData = githubData;
  employees[index] = emp;
  await saveEmployees(employees);

  return NextResponse.json(githubData);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/employees/[id]/github-sync/route.js
git commit -m "feat: add GitHub sync API route"
```

---

### Task 11: Create GitHubActivityTab component

**Files:**
- Create: `components/GitHubActivityTab.jsx`

- [ ] **Step 1: Create `components/GitHubActivityTab.jsx`**

```jsx
'use client';

import { useState, useMemo } from 'react';
import Card from './Card';

export default function GitHubActivityTab({ emp, onUpdate }) {
  const githubData = emp.githubData || { periods: [], lastSyncedEnd: null };
  const hasPreviousData = githubData.periods.length > 0;

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const body = { endDate };
      if (!hasPreviousData && startDate) {
        body.startDate = startDate;
      }
      const res = await fetch(`/api/employees/${emp.id}/github-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Sync fehlgeschlagen');
      }
      const newGithubData = await res.json();
      onUpdate({ ...emp, githubData: newGithubData });
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Filter periods
  const filteredPeriods = useMemo(() => {
    return githubData.periods.filter(p => {
      if (filterFrom && p.endDate < filterFrom) return false;
      if (filterTo && p.startDate > filterTo) return false;
      return true;
    });
  }, [githubData.periods, filterFrom, filterTo]);

  // Calculate summary from filtered data
  const summary = useMemo(() => {
    const totalPRs = filteredPeriods.reduce((s, p) => s + p.pullRequestsCount, 0);
    const totalReviews = filteredPeriods.reduce((s, p) => s + p.reviewsCount, 0);
    const allRepos = new Set(filteredPeriods.flatMap(p => p.repositories || []));
    return { totalPRs, totalReviews, totalRepos: allRepos.size };
  }, [filteredPeriods]);

  // Chart dimensions
  const chartHeight = 160;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

  const maxValue = Math.max(
    ...filteredPeriods.map(p => Math.max(p.pullRequestsCount, p.reviewsCount)),
    1
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* GitHub Username */}
      {!emp.githubUsername && (
        <Card style={{ background: 'var(--warning-dim)', borderColor: 'rgba(251,191,36,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--warning)' }}>
            Kein GitHub-Benutzername hinterlegt. Bitte im Mitarbeiterprofil setzen.
          </div>
        </Card>
      )}

      {/* Sync controls */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          GitHub Daten synchronisieren
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!hasPreviousData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Von:</span>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}
          {hasPreviousData && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Letzter Sync bis: {githubData.lastSyncedEnd}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Bis:</span>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            onClick={handleSync}
            disabled={syncing || !emp.githubUsername || (!hasPreviousData && !startDate)}
          >
            {syncing ? 'Synchronisiere...' : 'Sync starten'}
          </button>
        </div>
        {syncError && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>
            {syncError}
          </div>
        )}
      </Card>

      {hasPreviousData && (
        <>
          {/* Filter */}
          <Card>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Von:</span>
                <input type="date" className="input" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Bis:</span>
                <input type="date" className="input" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
              {(filterFrom || filterTo) && (
                <button className="btn btn--ghost" onClick={() => { setFilterFrom(''); setFilterTo(''); }}>
                  Zurücksetzen
                </button>
              )}
            </div>
          </Card>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Card>
              <div className="kpi-label">Pull Requests</div>
              <div className="kpi-value" style={{ color: 'var(--accent)' }}>{summary.totalPRs}</div>
              <div className="kpi-sub">erstellt</div>
            </Card>
            <Card>
              <div className="kpi-label">Reviews</div>
              <div className="kpi-value" style={{ color: 'var(--blue)' }}>{summary.totalReviews}</div>
              <div className="kpi-sub">durchgeführt</div>
            </Card>
            <Card>
              <div className="kpi-label">Repositories</div>
              <div className="kpi-value" style={{ color: 'var(--purple)' }}>{summary.totalRepos}</div>
              <div className="kpi-sub">beigetragen</div>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
              Aktivität über Zeit
            </div>
            {filteredPeriods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 12 }}>
                Keine Daten im gewählten Zeitraum
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${filteredPeriods.length * 80 + chartPadding.left + chartPadding.right} ${chartHeight + chartPadding.top + chartPadding.bottom}`}
                style={{ width: '100%', height: chartHeight + chartPadding.top + chartPadding.bottom }}
              >
                {/* Y-axis labels */}
                {[0, Math.round(maxValue / 2), maxValue].map((val, i) => {
                  const y = chartPadding.top + chartHeight - (val / maxValue) * chartHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={chartPadding.left}
                        x2={chartPadding.left + filteredPeriods.length * 80}
                        y1={y} y2={y}
                        stroke="var(--border)" strokeWidth="1"
                      />
                      <text x={chartPadding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-dim)" fontSize="10">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {filteredPeriods.map((period, i) => {
                  const x = chartPadding.left + i * 80;
                  const prHeight = (period.pullRequestsCount / maxValue) * chartHeight;
                  const reviewHeight = (period.reviewsCount / maxValue) * chartHeight;
                  const barWidth = 24;

                  return (
                    <g key={i}>
                      {/* PR bar */}
                      <rect
                        x={x + 10}
                        y={chartPadding.top + chartHeight - prHeight}
                        width={barWidth}
                        height={prHeight}
                        rx={4}
                        fill="var(--accent)"
                        opacity="0.8"
                      />
                      {/* Review bar */}
                      <rect
                        x={x + 10 + barWidth + 4}
                        y={chartPadding.top + chartHeight - reviewHeight}
                        width={barWidth}
                        height={reviewHeight}
                        rx={4}
                        fill="var(--blue)"
                        opacity="0.8"
                      />
                      {/* X label */}
                      <text
                        x={x + 10 + barWidth}
                        y={chartPadding.top + chartHeight + 16}
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        fontSize="10"
                      >
                        {period.startDate.substring(0, 7)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--accent)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PRs erstellt</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--blue)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reviews</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/GitHubActivityTab.jsx
git commit -m "feat: create GitHubActivityTab component with chart and sync"
```

---

### Task 12: Update EmployeeDetail with new tabs and goal upload

**Files:**
- Modify: `components/EmployeeDetail.jsx`

This is the integration task — wire CompetencyTab, GoalUploadModal, GitHubActivityTab, and the updated SMART goal display into the existing EmployeeDetail.

- [ ] **Step 1: Add imports**

At the top of `components/EmployeeDetail.jsx`, add after existing imports:

```javascript
import CompetencyTab from './CompetencyTab';
import GitHubActivityTab from './GitHubActivityTab';
import GoalUploadModal from './GoalUploadModal';
```

- [ ] **Step 2: Update tab definitions**

Replace the `tabs` constant (line 29-33):

```javascript
const tabs = [
  { key: 'goals', label: 'Ziele' },
  { key: 'competencies', label: 'Kompetenzen' },
  { key: 'extras', label: 'Extra-Leistungen' },
  { key: 'github', label: 'GitHub' },
  { key: 'salary', label: 'Gehalt & Empfehlung' },
];
```

- [ ] **Step 3: Update component signature**

Update the function signature (line 47) to accept new props:

```javascript
export default function EmployeeDetail({ emp, onBack, onUpdate, onDelete, budget, employees, competencies, settings }) {
```

- [ ] **Step 4: Add goal upload state**

After the existing state declarations (around line 57), add:

```javascript
const [showGoalUpload, setShowGoalUpload] = useState(false);
```

- [ ] **Step 5: Add goal import handler**

After the `deleteTeamGoal` function (around line 174), add:

```javascript
const importGoals = (goals) => {
  const maxId = emp.personalGoals.reduce((max, g) => Math.max(max, g.id), 0);
  const newGoals = goals.map((g, i) => ({ ...g, id: maxId + i + 1 }));
  onUpdate({
    ...emp,
    personalGoals: [...emp.personalGoals, ...newGoals],
  });
};
```

- [ ] **Step 6: Update the goals tab to show SMART fields and import button**

In the goals tab section, add an "Import" button next to the "Persönliche Ziele" section title. Replace line 259:

```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3 className="section-title" style={{ margin: 0 }}>Persönliche Ziele</h3>
  <button className="btn btn--ghost" onClick={() => setShowGoalUpload(true)}>
    ↑ Aus Markdown importieren
  </button>
</div>
```

- [ ] **Step 7: Update goal card display to show SMART fields**

In the goal card display (the non-editing view, around line 284-312), update to show SMART fields when they exist. Replace the content inside the `<>...</>` fragment:

```jsx
<>
  <div className="goal-header">
    <div style={{ flex: 1 }}>
      <div className="goal-title-row">
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
        <StatusBadge status={goal.status} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        <span className="goal-weight">Gewichtung: {goal.weight}%</span>
        {goal.measurable && (
          <span style={{ fontSize: 11, color: 'var(--blue)' }}>Messbar: {goal.measurable.substring(0, 80)}{goal.measurable.length > 80 ? '...' : ''}</span>
        )}
        {goal.timeBound && (
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>Zeitraum: {goal.timeBound.substring(0, 60)}{goal.timeBound.length > 60 ? '...' : ''}</span>
        )}
        {!goal.timeBound && goal.deadline && (
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>Frist: {new Date(goal.deadline).toLocaleDateString('de-DE')}</span>
        )}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="btn btn--ghost" onClick={() => startEditGoal(goal)}>Bearbeiten</button>
      <button className="btn btn--ghost" style={{ color: 'var(--danger)' }} onClick={() => deletePersonalGoal(goal.id)}>✕</button>
    </div>
  </div>
  {goal.why && (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
      <strong style={{ color: 'var(--text-dim)', fontSize: 11 }}>WHY:</strong> {goal.why.substring(0, 200)}{goal.why.length > 200 ? '...' : ''}
    </div>
  )}
  <div className="goal-progress-row">
    <div style={{ flex: 1 }}>
      <ProgressBar value={goal.progress} color={goalStatusColor[goal.status] || 'var(--blue)'} />
    </div>
    <span className="goal-percent">{goal.progress}%</span>
  </div>
</>
```

- [ ] **Step 8: Add competencies tab content**

After the goals tab `</motion.div>` and before the extras tab, add:

```jsx
{activeTab === 'competencies' && (
  <motion.div key="competencies" {...tabContent}>
    <CompetencyTab emp={emp} competencies={competencies || []} onUpdate={onUpdate} />
  </motion.div>
)}
```

- [ ] **Step 9: Add GitHub tab content**

After the extras tab and before the salary tab, add:

```jsx
{activeTab === 'github' && (
  <motion.div key="github" {...tabContent}>
    <GitHubActivityTab emp={emp} onUpdate={onUpdate} />
  </motion.div>
)}
```

- [ ] **Step 10: Add GitHub username display in the header**

In the employee header card (around line 209), after the role/department paragraph, add:

```jsx
{emp.githubUsername && (
  <p style={{ color: 'var(--text-dim)', fontSize: 11, margin: '2px 0 0' }}>
    GitHub: @{emp.githubUsername}
  </p>
)}
```

- [ ] **Step 11: Add GoalUploadModal render**

At the very end of the return statement, just before the closing `</motion.div>`, add:

```jsx
{showGoalUpload && (
  <GoalUploadModal
    onImport={importGoals}
    onClose={() => setShowGoalUpload(false)}
  />
)}
```

- [ ] **Step 12: Commit**

```bash
git add components/EmployeeDetail.jsx
git commit -m "feat: integrate competencies, GitHub activity, and goal upload into employee detail"
```

---

### Task 13: Add githubOrg to settings UI in DashboardView

**Files:**
- Modify: `components/App.jsx`
- Modify: `components/DashboardView.jsx`

- [ ] **Step 1: Pass settings and update handler to DashboardView**

In `App.jsx`, add a settings update handler after `handleBudgetChange`:

```javascript
const handleSettingsChange = useCallback((newSettings) => {
  setSettings(newSettings);
  setBudget(newSettings.budget);

  if (budgetTimeoutRef.current) clearTimeout(budgetTimeoutRef.current);
  budgetTimeoutRef.current = setTimeout(() => {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch((err) => console.error('Failed to save settings:', err));
  }, 300);
}, []);
```

Update the DashboardView props:

```jsx
<DashboardView
  key="dashboard"
  employees={employees}
  roles={roles}
  onSelect={(emp) => setSelectedId(emp.id)}
  onAddEmployee={handleAddEmployee}
  onDeleteEmployee={handleDeleteEmployee}
  onAddRole={handleAddRole}
  onUpdateRole={handleUpdateRole}
  onDeleteRole={handleDeleteRole}
  budget={budget}
  onBudgetChange={handleBudgetChange}
  settings={settings}
  onSettingsChange={handleSettingsChange}
/>
```

- [ ] **Step 2: Add githubOrg field in DashboardView**

In `DashboardView.jsx`, update the function signature to accept `settings` and `onSettingsChange`:

```javascript
export default function DashboardView({ employees, roles, onSelect, onAddEmployee, onDeleteEmployee, onAddRole, onUpdateRole, onDeleteRole, budget, onBudgetChange, settings, onSettingsChange }) {
```

Add a GitHub org section after the budget card and before the role management section. Add this inside the `motion.div` with variants:

```jsx
<motion.div variants={fadeUp}>
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div className="kpi-label">GitHub Organisation</div>
        <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>
          {settings?.githubOrg || 'collaborationFactory'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="input"
          style={{ width: 200 }}
          placeholder="GitHub Org..."
          defaultValue={settings?.githubOrg || 'collaborationFactory'}
          onBlur={(e) => {
            if (e.target.value !== settings?.githubOrg) {
              onSettingsChange({ ...settings, githubOrg: e.target.value });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSettingsChange({ ...settings, githubOrg: e.target.value });
              e.target.blur();
            }
          }}
        />
      </div>
    </div>
  </Card>
</motion.div>
```

- [ ] **Step 3: Commit**

```bash
git add components/App.jsx components/DashboardView.jsx
git commit -m "feat: add GitHub org setting to dashboard"
```

---

### Task 14: Update salary recommendation algorithm

**Files:**
- Modify: `utils/calculations.js`

- [ ] **Step 1: Update `calcSalaryRecommendation` to include competencies**

Replace the `calcSalaryRecommendation` function in `utils/calculations.js`:

```javascript
export function calcSalaryRecommendation(emp) {
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const teamAvg =
    emp.teamGoals.reduce((s, g) => s + g.progress, 0) / (emp.teamGoals.length || 1);
  const extrasBonus = Math.min(emp.extras.length * 0.4, 2.0);
  const highlightsBonus = Math.min(emp.highlights.length * 0.25, 1.5);

  // Competency score: percentage of met competencies + milestone bonus for targets
  const assessments = emp.competencyAssessments || [];
  let competencyScore = 0;
  if (assessments.length > 0) {
    const metCount = assessments.filter(a => a.met).length;
    const baseScore = metCount / assessments.length;

    // Milestone bonus: for target competencies, completed milestones add up to 20% bonus
    const targetAssessments = assessments.filter(a => a.isTarget && a.milestones.length > 0);
    let milestoneBonus = 0;
    if (targetAssessments.length > 0) {
      const totalMilestones = targetAssessments.reduce((s, a) => s + a.milestones.length, 0);
      const doneMilestones = targetAssessments.reduce((s, a) => s + a.milestones.filter(m => m.status === 'done').length, 0);
      milestoneBonus = (doneMilestones / totalMilestones) * 0.2;
    }

    competencyScore = Math.min(baseScore + milestoneBonus, 1.0);
  }

  const performanceMultiplier =
    (goalScore / 100) * 0.25 +
    (teamAvg / 100) * 0.2 +
    (emp.performanceScore / 5) * 0.2 +
    competencyScore * 0.2 +
    (extrasBonus / 2) * 0.1 +
    (highlightsBonus / 1.5) * 0.05;

  const marketGap = ((emp.marketRate - emp.currentSalary) / emp.currentSalary) * 100;
  const bandPosition =
    ((emp.currentSalary - emp.salaryBand.min) /
      (emp.salaryBand.max - emp.salaryBand.min)) *
    100;

  let baseIncrease = emp.inflation;
  baseIncrease += performanceMultiplier * 6;
  if (marketGap > 5) baseIncrease += Math.min(marketGap * 0.3, 3);
  if (bandPosition < 30) baseIncrease += 1.5;
  else if (bandPosition > 80) baseIncrease *= 0.7;

  const finalIncrease =
    Math.round(Math.max(0, Math.min(baseIncrease, 15)) * 10) / 10;
  const newSalary = Math.round(emp.currentSalary * (1 + finalIncrease / 100));

  return {
    percentage: finalIncrease,
    newSalary,
    increaseAbsolute: newSalary - emp.currentSalary,
    marketGap: Math.round(marketGap * 10) / 10,
    bandPosition: Math.round(bandPosition),
    performanceMultiplier: Math.round(performanceMultiplier * 100),
    competencyScore: Math.round(competencyScore * 100),
  };
}
```

- [ ] **Step 2: Update the salary factors display in EmployeeDetail**

In `components/EmployeeDetail.jsx`, in the salary tab's factors list (around line 578), add a competency factor row. Insert after the "Highlights & Auffälligkeiten" entry:

```javascript
{ label: 'Kompetenz-Erfüllung', value: `${rec.competencyScore || 0}%`, detail: `${(emp.competencyAssessments || []).filter(a => a.met).length} von ${(emp.competencyAssessments || []).length} erfüllt`, color: 'var(--blue)' },
```

- [ ] **Step 3: Commit**

```bash
git add utils/calculations.js components/EmployeeDetail.jsx
git commit -m "feat: update salary algorithm with competency scoring (new weights)"
```

---

### Task 15: Verify the app runs

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open browser and verify**

Navigate to `http://localhost:3000`. Verify:
- Dashboard loads with employees
- Click into an employee — 5 tabs visible (Ziele, Kompetenzen, Extra-Leistungen, GitHub, Gehalt & Empfehlung)
- Competencies tab shows grouped competencies with met/target toggles
- Goals tab shows SMART fields (WHY section visible)
- "Aus Markdown importieren" button opens upload modal
- GitHub tab shows sync controls
- Salary tab shows updated factors including competency score

- [ ] **Step 3: Test goal upload**

Click "Aus Markdown importieren", select `data/personal_goal_template.md`. Verify:
- 2 goals are parsed
- Preview shows title and collapsible SMART sections
- Import appends goals to the employee

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: any remaining adjustments from manual testing"
```

(Only if changes were needed.)
