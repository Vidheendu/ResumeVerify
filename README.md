📄ResumeVerify — Smart ATS Resume Checker
## ✨ Features

| Feature | Description |
|---------|-------------|
| 📤 **PDF Upload** | Drag & drop or browse to upload your resume (PDF format, up to 10MB) |
| 📊 **ATS Score (0–100)** | Animated score ring with a detailed breakdown across 4 categories |
| 🔍 **Issue Detection** | Identifies missing contact info, weak phrases, clichés, length problems, and more |
| ✅ **Fix Suggestions** | Actionable recommendations with before/after examples |
| 🏷️ **Keyword Analysis** | Highlights found and missing action verbs & technical keywords |
| 📋 **Section Analysis** | Checks for 10 standard resume sections (Experience, Education, Skills, etc.) |
| 💡 **ATS Pro Tips** | Built-in best practices guide for writing ATS-friendly resumes |
| 🔒 **100% Private** | Everything runs locally in your browser — no data is sent to any server |

---

## 🎬
### How to Use

1. Open the app in your browser
2. Upload a PDF resume (drag & drop or click to browse)
3. Click **"Analyze Resume"**
4. View your ATS score, detected issues, and improvement suggestions

---

🧠 How It Works

PDF Upload → Text Extraction → Analysis Pipeline → Score & Feedback


### Analysis Pipeline
---

## 📊 Scoring System

The ATS score is calculated out of **100 points** across 4 categories:

| Category | Max Points | What It Checks |
|----------|-----------|----------------|
| 📋 Resume Sections | 30 | Presence of essential sections (Contact, Experience, Education, Skills, Summary) |
| 🏷️ Keywords & Action Verbs | 25 | Use of strong action verbs and relevant technical keywords |
| ✍️ Content Quality | 25 | Contact info, weak phrases, quantified achievements, clichés, length |
| 📐 Formatting & Contact | 20 | Resume length, email, phone number presence |

### Score Ranges

| Score | Rating | Meaning |
|-------|--------|---------|
| 80–100 | 🟢 Excellent | Highly ATS-compatible, minor tweaks only |
| 60–79 | 🟡 Good | Solid foundation, needs some improvements |
| 40–59 | 🟠 Needs Work | Several issues found, follow suggestions |
| 0–39 | 🔴 Critical | Major issues, likely won't pass ATS filters |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Dark theme, glassmorphism, animations, responsive layout |
| **Vanilla JavaScript** | Analysis engine, DOM manipulation, score calculation |

---

## 🔍 What Gets Checked

### Issues Detected
- ❌ Missing email address or phone number
- ❌ No LinkedIn profile link
- ❌ Resume too short (< 150 words) or too long (> 1200 words)
- ❌ Weak phrases ("responsible for", "duties included", "worked on")
- ❌ No quantified achievements (numbers, percentages, metrics)
- ❌ Clichés ("team player", "hard worker", "self-starter")
- ❌ Outdated "Objective" statement instead of "Professional Summary."
- ❌ "References available upon request" (wastes space)
- ❌ Low GPA listed (below 3.0)
- ❌ Missing employment/education dates

### Sections Scanned
Contact Info • Professional Summary • Work Experience • Education • Skills • Projects • Certifications • Achievements • Languages • Interests

### Keywords Tracked
**Action Verbs:** achieved, improved, managed, developed, led, created, designed, implemented, optimized, streamlined, and 20+ more

**Technical Keywords:** Python, JavaScript, React, SQL, AWS, Docker, Git, Machine Learning, Agile, and 30+ more


