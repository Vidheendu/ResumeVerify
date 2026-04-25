/* ===== ResumeAI — ATS Resume Checker Engine ===== */

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ===== DOM Elements =====
const uploadArea = document.getElementById('uploadArea');
const uploadContent = document.getElementById('uploadContent');
const filePreview = document.getElementById('filePreview');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const loadingBar = document.getElementById('loadingBar');
const resultsSection = document.getElementById('resultsSection');
const tryAgainBtn = document.getElementById('tryAgainBtn');

let selectedFile = null;

// ===== File Upload Handling =====
browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
uploadArea.addEventListener('click', (e) => {
    if (!selectedFile) fileInput.click();
});
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault(); uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') handleFile(file);
});

function handleFile(file) {
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File size must be under 10MB.'); return; }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    uploadContent.style.display = 'none';
    filePreview.style.display = 'block';
    uploadArea.style.cursor = 'default';
}

removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null; fileInput.value = '';
    uploadContent.style.display = 'block';
    filePreview.style.display = 'none';
    uploadArea.style.cursor = 'pointer';
});

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ===== Analyze Button =====
analyzeBtn.addEventListener('click', (e) => { e.stopPropagation(); if (selectedFile) startAnalysis(); });
tryAgainBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    document.getElementById('upload').scrollIntoView({ behavior: 'smooth' });
    removeBtn.click();
});

// ===== PDF Text Extraction =====
async function extractText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
}

// ===== Analysis Pipeline =====
async function startAnalysis() {
    loadingOverlay.style.display = 'flex';
    loadingBar.style.width = '0%';

    try {
        // Step 1: Extract
        updateLoading('Extracting text from PDF...', 15);
        await delay(400);
        const text = await extractText(selectedFile);
        if (!text || text.trim().length < 30) {
            throw new Error('Could not extract enough text. The PDF may be image-based or empty.');
        }

        // Step 2: Analyze
        updateLoading('Analyzing resume structure...', 35);
        await delay(500);
        const sections = analyzeSections(text);

        updateLoading('Checking for ATS keywords...', 55);
        await delay(400);
        const keywords = analyzeKeywords(text);

        updateLoading('Evaluating content quality...', 75);
        await delay(400);
        const content = analyzeContent(text);

        updateLoading('Calculating ATS score...', 90);
        await delay(500);
        const results = calculateScore(text, sections, keywords, content);

        updateLoading('Done!', 100);
        await delay(400);

        loadingOverlay.style.display = 'none';
        displayResults(results);
    } catch (err) {
        loadingOverlay.style.display = 'none';
        alert('Error: ' + err.message);
    }
}

function updateLoading(msg, pct) {
    loadingText.textContent = msg;
    loadingBar.style.width = pct + '%';
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== Section Analysis =====
function analyzeSections(text) {
    const lower = text.toLowerCase();
    const sectionDefs = [
        { name: 'Contact Information', patterns: ['email', 'phone', '@', 'linkedin', 'github', 'address', 'contact'], weight: 15 },
        { name: 'Professional Summary', patterns: ['summary', 'objective', 'profile', 'about me', 'career objective', 'professional summary'], weight: 10 },
        { name: 'Work Experience', patterns: ['experience', 'work history', 'employment', 'professional experience', 'work experience'], weight: 20 },
        { name: 'Education', patterns: ['education', 'academic', 'university', 'college', 'degree', 'bachelor', 'master', 'b.tech', 'b.e', 'm.tech', 'bca', 'mca', 'bsc', 'msc'], weight: 15 },
        { name: 'Skills', patterns: ['skills', 'technical skills', 'core competencies', 'technologies', 'proficiencies', 'tools'], weight: 15 },
        { name: 'Projects', patterns: ['project', 'projects', 'personal project', 'academic project'], weight: 8 },
        { name: 'Certifications', patterns: ['certification', 'certifications', 'certified', 'certificate', 'licenses'], weight: 7 },
        { name: 'Achievements', patterns: ['achievement', 'achievements', 'awards', 'honors', 'accomplishments'], weight: 5 },
        { name: 'Languages', patterns: ['languages', 'language proficiency'], weight: 3 },
        { name: 'Interests / Hobbies', patterns: ['interests', 'hobbies', 'extracurricular'], weight: 2 },
    ];

    return sectionDefs.map(sec => {
        const found = sec.patterns.some(p => lower.includes(p));
        return { ...sec, found };
    });
}

// ===== Keyword Analysis =====
function analyzeKeywords(text) {
    const lower = text.toLowerCase();

    const actionVerbs = [
        'achieved', 'improved', 'managed', 'developed', 'led', 'created', 'designed',
        'implemented', 'increased', 'reduced', 'delivered', 'coordinated', 'built',
        'launched', 'optimized', 'streamlined', 'analyzed', 'resolved', 'trained',
        'mentored', 'negotiated', 'supervised', 'spearheaded', 'orchestrated',
        'established', 'transformed', 'collaborated', 'executed', 'initiated', 'generated'
    ];

    const techKeywords = [
        'python', 'javascript', 'java', 'c++', 'react', 'node.js', 'sql', 'html', 'css',
        'git', 'docker', 'aws', 'azure', 'linux', 'typescript', 'mongodb', 'rest api',
        'machine learning', 'data analysis', 'agile', 'scrum', 'ci/cd', 'kubernetes',
        'tensorflow', 'flutter', 'django', 'express', 'angular', 'vue', 'firebase',
        'postgresql', 'mysql', 'redis', 'graphql', 'figma', 'tableau', 'power bi',
        'excel', 'word', 'communication', 'leadership', 'teamwork', 'problem solving'
    ];

    const foundVerbs = actionVerbs.filter(v => lower.includes(v));
    const missingVerbs = actionVerbs.filter(v => !lower.includes(v)).slice(0, 8);
    const foundTech = techKeywords.filter(k => lower.includes(k));
    const missingTech = techKeywords.filter(k => !lower.includes(k)).slice(0, 10);

    return { foundVerbs, missingVerbs, foundTech, missingTech };
}

// ===== Content Analysis =====
function analyzeContent(text) {
    const issues = [];
    const suggestions = [];
    const lower = text.toLowerCase();
    const lines = text.split('\n').filter(l => l.trim());
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Contact info checks
    const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(text);
    const hasPhone = /[\+]?[\d\s\-\(\)]{7,15}/.test(text);
    const hasLinkedIn = lower.includes('linkedin');

    if (!hasEmail) {
        issues.push({ severity: 'critical', title: 'Missing Email Address', desc: 'No email address detected. Recruiters need your email to contact you.' });
        suggestions.push({ title: 'Add Your Email', desc: 'Include a professional email at the top of your resume.', example: 'e.g. firstname.lastname@gmail.com' });
    }
    if (!hasPhone) {
        issues.push({ severity: 'critical', title: 'Missing Phone Number', desc: 'No phone number detected. This is essential contact information.' });
        suggestions.push({ title: 'Add Phone Number', desc: 'Include your phone number with country code.', example: 'e.g. +91 98765 43210' });
    }
    if (!hasLinkedIn) {
        issues.push({ severity: 'warning', title: 'No LinkedIn Profile', desc: 'LinkedIn URL not found. Most recruiters check LinkedIn profiles.' });
        suggestions.push({ title: 'Add LinkedIn URL', desc: 'Include your LinkedIn profile link in the header section.', example: 'e.g. linkedin.com/in/yourname' });
    }

    // Length checks
    if (wordCount < 150) {
        issues.push({ severity: 'critical', title: 'Resume Too Short', desc: `Only ~${wordCount} words detected. A good resume should have 300-700 words.` });
        suggestions.push({ title: 'Add More Content', desc: 'Expand your experience descriptions with specific achievements and responsibilities.', example: 'Aim for 3-5 bullet points per role with quantified results.' });
    } else if (wordCount > 1200) {
        issues.push({ severity: 'warning', title: 'Resume Too Long', desc: `~${wordCount} words detected. Keep it concise — ideally 1-2 pages.` });
        suggestions.push({ title: 'Trim Content', desc: 'Focus on the most relevant experiences. Remove outdated or less impactful information.' });
    }

    // Action verbs check
    const weakPhrases = ['responsible for', 'duties included', 'worked on', 'helped with', 'assisted in', 'was responsible'];
    weakPhrases.forEach(phrase => {
        if (lower.includes(phrase)) {
            issues.push({ severity: 'warning', title: `Weak Phrase: "${phrase}"`, desc: 'Passive language weakens your resume. Use strong action verbs instead.' });
        }
    });
    if (weakPhrases.some(p => lower.includes(p))) {
        suggestions.push({ title: 'Replace Weak Phrases with Action Verbs', desc: 'Start each bullet point with a strong verb.', example: '❌ "Responsible for managing team"\n✅ "Led a cross-functional team of 8 members"' });
    }

    // Quantification check
    const hasNumbers = /\d+%|\d+\+|\$[\d,]+|\d+ (people|members|projects|clients|users)/.test(text);
    if (!hasNumbers) {
        issues.push({ severity: 'warning', title: 'No Quantified Achievements', desc: 'No measurable results found. Numbers make your impact concrete.' });
        suggestions.push({ title: 'Add Numbers & Metrics', desc: 'Quantify your achievements wherever possible.', example: '❌ "Improved website performance"\n✅ "Improved website load time by 40%, serving 10K+ daily users"' });
    }

    // Buzzwords / clichés
    const cliches = ['team player', 'hard worker', 'go-getter', 'self-starter', 'synergy', 'think outside the box', 'detail oriented'];
    cliches.forEach(c => {
        if (lower.includes(c)) {
            issues.push({ severity: 'info', title: `Cliché Detected: "${c}"`, desc: 'Overused buzzwords that ATS and recruiters tend to ignore.' });
        }
    });
    if (cliches.some(c => lower.includes(c))) {
        suggestions.push({ title: 'Replace Clichés with Specific Examples', desc: 'Instead of saying "team player", describe a collaboration achievement.', example: '❌ "Team player with great communication"\n✅ "Collaborated with 3 departments to deliver a $50K project 2 weeks early"' });
    }

    // Date format consistency
    const datePatterns = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*[\d]{2,4}/gi) || [];
    if (datePatterns.length === 0 && wordCount > 200) {
        issues.push({ severity: 'info', title: 'No Dates Found', desc: 'Employment and education dates help recruiters understand your timeline.' });
        suggestions.push({ title: 'Add Dates to Experience & Education', desc: 'Include start and end dates for each role and degree.', example: 'e.g. "Software Engineer | Jan 2022 – Present"' });
    }

    // Objective statement check
    if (lower.includes('objective') && !lower.includes('career objective')) {
        issues.push({ severity: 'info', title: 'Uses "Objective" Statement', desc: '"Objective" sections are outdated. Use a "Professional Summary" instead.' });
        suggestions.push({ title: 'Replace Objective with Professional Summary', desc: 'Write a 2-3 sentence summary highlighting your key strengths and career goals.' });
    }

    // GPA check
    if (/gpa|cgpa|percentage/i.test(text)) {
        const gpaMatch = text.match(/(?:gpa|cgpa)[:\s]*(\d+\.?\d*)/i);
        if (gpaMatch && parseFloat(gpaMatch[1]) < 3.0 && parseFloat(gpaMatch[1]) > 0) {
            issues.push({ severity: 'info', title: 'Low GPA Listed', desc: 'Consider removing GPA if below 3.0/4.0 unless the employer requires it.' });
        }
    }

    // References check
    if (lower.includes('references available')) {
        issues.push({ severity: 'info', title: '"References Available Upon Request"', desc: 'This phrase wastes space. It is assumed — no need to include it.' });
        suggestions.push({ title: 'Remove References Line', desc: 'Delete "References available upon request" — it\'s implied and takes up valuable space.' });
    }

    return { issues, suggestions, wordCount, hasEmail, hasPhone, hasLinkedIn };
}

// ===== Score Calculation =====
function calculateScore(text, sections, keywords, content) {
    let score = 0;
    const breakdown = {};

    // Section score (30 points max)
    const essentialSections = sections.filter(s => s.weight >= 10);
    const essentialFound = essentialSections.filter(s => s.found).length;
    const sectionScore = Math.round((essentialFound / essentialSections.length) * 30);
    score += sectionScore;
    breakdown['Resume Sections'] = { score: sectionScore, max: 30 };

    // Keywords score (25 points max)
    const verbScore = Math.min(keywords.foundVerbs.length * 2.5, 12);
    const techScore = Math.min(keywords.foundTech.length * 1.5, 13);
    const keywordScore = Math.round(verbScore + techScore);
    score += keywordScore;
    breakdown['Keywords & Action Verbs'] = { score: keywordScore, max: 25 };

    // Content quality (25 points max)
    let contentScore = 25;
    content.issues.forEach(issue => {
        if (issue.severity === 'critical') contentScore -= 6;
        else if (issue.severity === 'warning') contentScore -= 3;
        else contentScore -= 1;
    });
    contentScore = Math.max(0, contentScore);
    score += contentScore;
    breakdown['Content Quality'] = { score: contentScore, max: 25 };

    // Formatting (20 points max)
    let formatScore = 20;
    if (content.wordCount < 150) formatScore -= 8;
    else if (content.wordCount > 1200) formatScore -= 4;
    if (!content.hasEmail) formatScore -= 4;
    if (!content.hasPhone) formatScore -= 4;
    formatScore = Math.max(0, formatScore);
    score += formatScore;
    breakdown['Formatting & Contact'] = { score: formatScore, max: 20 };

    score = Math.min(100, Math.max(0, score));

    return { score, breakdown, sections, keywords, issues: content.issues, suggestions: content.suggestions };
}

// ===== Display Results =====
function displayResults(results) {
    resultsSection.style.display = 'block';
    document.querySelector('.upload-section').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.tips-section').style.display = 'none';

    // Add SVG gradient for score ring
    let defs = document.querySelector('.score-ring defs');
    if (!defs) {
        const svg = document.querySelector('.score-ring');
        const ns = 'http://www.w3.org/2000/svg';
        defs = document.createElementNS(ns, 'defs');
        const grad = document.createElementNS(ns, 'linearGradient');
        grad.setAttribute('id', 'scoreGradient');
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
        const stop1 = document.createElementNS(ns, 'stop');
        stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#6366f1');
        const stop2 = document.createElementNS(ns, 'stop');
        stop2.setAttribute('offset', '50%'); stop2.setAttribute('stop-color', '#a855f7');
        const stop3 = document.createElementNS(ns, 'stop');
        stop3.setAttribute('offset', '100%'); stop3.setAttribute('stop-color', '#ec4899');
        grad.appendChild(stop1); grad.appendChild(stop2); grad.appendChild(stop3);
        defs.appendChild(grad); svg.prepend(defs);
    }

    // Animate score ring
    const ring = document.getElementById('scoreRing');
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (results.score / 100) * circumference;
    ring.style.stroke = 'url(#scoreGradient)';
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

    // Animate score number
    animateNumber('scoreNumber', results.score);

    // Score message
    const msgEl = document.getElementById('scoreMessage');
    if (results.score >= 80) {
        msgEl.innerHTML = '🎉 <strong>Excellent!</strong> Your resume is highly ATS-compatible. Minor tweaks can push it even further.';
        msgEl.style.borderLeft = '3px solid #10b981';
    } else if (results.score >= 60) {
        msgEl.innerHTML = '👍 <strong>Good Foundation!</strong> Your resume has solid elements but needs improvements in key areas.';
        msgEl.style.borderLeft = '3px solid #f59e0b';
    } else if (results.score >= 40) {
        msgEl.innerHTML = '⚠️ <strong>Needs Work.</strong> Several critical issues found. Follow the suggestions below to improve significantly.';
        msgEl.style.borderLeft = '3px solid #f59e0b';
    } else {
        msgEl.innerHTML = '🚨 <strong>Major Issues Found.</strong> Your resume may not pass ATS filters. Review all issues and suggestions carefully.';
        msgEl.style.borderLeft = '3px solid #ef4444';
    }

    // Breakdown
    const breakdownEl = document.getElementById('breakdownItems');
    breakdownEl.innerHTML = '';
    const colors = { 'Resume Sections': '#6366f1', 'Keywords & Action Verbs': '#a855f7', 'Content Quality': '#10b981', 'Formatting & Contact': '#f59e0b' };
    Object.entries(results.breakdown).forEach(([name, data]) => {
        const pct = Math.round((data.score / data.max) * 100);
        const div = document.createElement('div');
        div.className = 'breakdown-item';
        div.innerHTML = `
            <div class="breakdown-label"><span>${name}</span><span>${data.score}/${data.max}</span></div>
            <div class="breakdown-bar"><div class="breakdown-bar-fill" style="background:${colors[name] || '#6366f1'}" data-width="${pct}%"></div></div>`;
        breakdownEl.appendChild(div);
    });
    setTimeout(() => {
        document.querySelectorAll('.breakdown-bar-fill').forEach(bar => { bar.style.width = bar.dataset.width; });
    }, 200);

    // Issues
    const issuesList = document.getElementById('issuesList');
    issuesList.innerHTML = '';
    document.getElementById('issueCount').textContent = results.issues.length + ' issues';
    if (results.issues.length === 0) {
        issuesList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">🎉 No major issues found!</p>';
    } else {
        results.issues.forEach(issue => {
            const div = document.createElement('div');
            div.className = `issue-item ${issue.severity}`;
            div.innerHTML = `
                <span class="issue-badge ${issue.severity}">${issue.severity}</span>
                <div class="issue-content"><h4>${issue.title}</h4><p>${issue.desc}</p></div>`;
            issuesList.appendChild(div);
        });
    }

    // Suggestions
    const sugList = document.getElementById('suggestionsList');
    sugList.innerHTML = '';
    if (results.suggestions.length === 0) {
        sugList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">✅ Your resume looks great! No changes needed.</p>';
    } else {
        results.suggestions.forEach((sug, i) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="suggestion-icon">${i + 1}</div>
                <div class="suggestion-content">
                    <h4>${sug.title}</h4>
                    <p>${sug.desc}</p>
                    ${sug.example ? `<div class="example">${sug.example.replace(/\n/g, '<br>')}</div>` : ''}
                </div>`;
            sugList.appendChild(div);
        });
    }

    // Keywords
    const kwList = document.getElementById('keywordsList');
    kwList.innerHTML = '';

    const makeGroup = (title, found, missing) => {
        const g = document.createElement('div');
        g.className = 'keyword-group';
        let html = `<div class="keyword-group-title">${title}</div><div class="keyword-tags">`;
        found.forEach(k => { html += `<span class="keyword-tag found">✓ ${k}</span>`; });
        missing.forEach(k => { html += `<span class="keyword-tag missing">✗ ${k}</span>`; });
        html += '</div>';
        g.innerHTML = html;
        return g;
    };
    kwList.appendChild(makeGroup('Action Verbs', results.keywords.foundVerbs, results.keywords.missingVerbs));
    kwList.appendChild(makeGroup('Technical / Skill Keywords', results.keywords.foundTech, results.keywords.missingTech));

    // Sections
    const secList = document.getElementById('sectionsList');
    secList.innerHTML = '';
    results.sections.forEach(sec => {
        const div = document.createElement('div');
        div.className = 'section-item';
        const icon = sec.found ? '✓' : '✗';
        const cls = sec.found ? 'found' : 'missing';
        const label = sec.found ? 'Found' : 'Missing';
        div.innerHTML = `
            <div class="section-item-left">
                <div class="section-status ${cls}">${icon}</div>
                <span class="section-item-name">${sec.name}</span>
            </div>
            <span class="section-item-label ${cls}">${label}</span>`;
        secList.appendChild(div);
    });

    // Scroll to results
    setTimeout(() => { resultsSection.scrollIntoView({ behavior: 'smooth' }); }, 200);
}

// Try again: reset view
tryAgainBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    document.querySelector('.upload-section').style.display = '';
    document.querySelector('.features').style.display = '';
    document.querySelector('.tips-section').style.display = '';
    selectedFile = null; fileInput.value = '';
    uploadContent.style.display = 'block';
    filePreview.style.display = 'none';
    uploadArea.style.cursor = 'pointer';
    document.getElementById('upload').scrollIntoView({ behavior: 'smooth' });
});

// Number animation
function animateNumber(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current;
    }, 25);
}

// Smooth scroll for nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
