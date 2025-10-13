// Wine Tasting App - JavaScript Logic

class WineTastingApp {
    constructor() {
        this.currentScreen = 'main-menu';
        this.currentQuestionIndex = 0;
        this.bottleCount = 1;
        this.customNames = false;
        this.answers = [];
        this.tastingHistory = this.loadHistory();
        this.settings = this.loadSettings();
        
        this.questions = [
            {
                id: 'visual',
                icon: '👁️',
                title: 'Aspect visuel',
                subtitle: 'Observez la couleur, la limpidité et l\'intensité du vin',
                type: 'rating',
                weight: 4.0
            },
            {
                id: 'first-nose',
                icon: '👃',
                title: 'Premier nez',
                subtitle: 'Sentez le vin sans l\'agiter. Quelles sont vos premières impressions ?',
                type: 'choice',
                weight: 4.0,
                options: [
                    { title: 'Fermé', desc: 'Peu d\'arômes perceptibles', value: 1 },
                    { title: 'Discret', desc: 'Arômes légers mais présents', value: 2 },
                    { title: 'Ouvert', desc: 'Arômes bien présents et identifiables', value: 3 },
                    { title: 'Expressif', desc: 'Arômes intenses et variés', value: 4 },
                    { title: 'Puissant', desc: 'Arômes très intenses et complexes', value: 5 }
                ]
            },
            {
                id: 'second-nose',
                icon: '🌪️',
                title: 'Deuxième nez',
                subtitle: 'Agitez délicatement le verre et sentez à nouveau',
                type: 'choice',
                weight: 4.0,
                options: [
                    { title: 'Inchangé', desc: 'Aucune évolution notable', value: 2 },
                    { title: 'Légèrement ouvert', desc: 'Quelques nouveaux arômes', value: 3 },
                    { title: 'Bien ouvert', desc: 'Nette amélioration des arômes', value: 4 },
                    { title: 'Très expressif', desc: 'Explosion d\'arômes complexes', value: 5 }
                ]
            },
            {
                id: 'mouthfeel',
                icon: '👅',
                title: 'Attaque en bouche',
                subtitle: 'Prenez une première gorgée. Comment le vin attaque-t-il vos papilles ?',
                type: 'rating',
                weight: 4.0
            },
            {
                id: 'finish',
                icon: '⏱️',
                title: 'Finale',
                subtitle: 'Après avoir avalé, quelle est la persistance des arômes ?',
                type: 'rating',
                weight: 4.0
            }
        ];
        
        this.init();
    }
    
    init() {
        this.updateStats();
        this.loadSettingsState();
        this.showScreen('main-menu');
    }
    
    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Update progress bar based on screen
            this.updateProgressBar(screenId);
        }
    }
    
    updateProgressBar(screenId) {
        const progressBar = document.querySelector('.progress-fill');
        if (!progressBar) return;
        
        let progress = 0;
        switch (screenId) {
            case 'bottle-setup':
                progress = 20;
                break;
            case 'tasting-questions':
                progress = 20 + (this.currentQuestionIndex / this.questions.length) * 60;
                break;
            case 'results':
                progress = 100;
                break;
            default:
                progress = 0;
        }
        
        progressBar.style.width = `${progress}%`;
    }
    
    // Navigation Functions
    goToMain() {
        this.showScreen('main-menu');
        this.resetTasting();
    }
    
    startTasting() {
        this.showScreen('bottle-setup');
    }
    
    newTasting() {
        this.resetTasting();
        this.showScreen('bottle-setup');
    }
    
    viewHistory() {
        this.updateHistoryDisplay();
        this.showScreen('history');
    }
    
    openSettings() {
        this.showScreen('settings');
    }
    
    // Bottle Setup Functions
    changeBottleCount(delta) {
        const newCount = Math.max(1, Math.min(10, this.bottleCount + delta));
        this.bottleCount = newCount;
        document.getElementById('bottle-count').textContent = newCount;
        
        // Update buttons
        const decreaseBtn = document.querySelector('.number-btn:first-child');
        const increaseBtn = document.querySelector('.number-btn:last-child');
        decreaseBtn.disabled = newCount <= 1;
        increaseBtn.disabled = newCount >= 10;
    }
    
    startTastingQuestions() {
        this.customNames = document.getElementById('custom-names').checked;
        this.resetAnswers();
        this.currentQuestionIndex = 0;
        this.showScreen('tasting-questions');
        this.displayCurrentQuestion();
    }
    
    // Question Functions
    displayCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const questionNumber = document.getElementById('current-question');
        const questionTitle = document.getElementById('question-title');
        const questionSubtitle = document.getElementById('question-subtitle');
        const answerContainer = document.getElementById('answer-container');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        // Update question info
        questionNumber.textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;
        questionTitle.textContent = `${question.icon} ${question.title}`;
        questionSubtitle.textContent = question.subtitle;
        
        // Show/hide previous button
        prevBtn.style.display = this.currentQuestionIndex > 0 ? 'inline-flex' : 'none';
        
        // Update next button text
        nextBtn.textContent = this.currentQuestionIndex === this.questions.length - 1 ? 'Terminer' : 'Suivant';
        nextBtn.disabled = !this.answers[this.currentQuestionIndex];
        
        // Load answer interface
        this.loadAnswerInterface(question, answerContainer);
        
        // Update progress
        this.updateProgressBar('tasting-questions');
    }
    
    loadAnswerInterface(question, container) {
        container.innerHTML = '';
        
        if (question.type === 'rating') {
            this.createRatingScale(container);
        } else if (question.type === 'choice') {
            this.createChoiceOptions(container, question.options);
        }
        
        // Restore previous answer if exists
        const previousAnswer = this.answers[this.currentQuestionIndex];
        if (previousAnswer) {
            if (question.type === 'rating') {
                this.selectRating(previousAnswer.value);
            } else {
                this.selectChoice(previousAnswer.option);
            }
        }
    }
    
    createRatingScale(container) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'rating-scale';
        
        for (let i = 1; i <= 5; i++) {
            const button = document.createElement('button');
            button.className = 'rating-btn';
            button.textContent = i;
            button.onclick = () => this.selectRating(i);
            ratingDiv.appendChild(button);
        }
        
        container.appendChild(ratingDiv);
    }
    
    createChoiceOptions(container, options) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choice-options';
        
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'choice-option';
            optionDiv.onclick = () => this.selectChoice(option);
            
            optionDiv.innerHTML = `
                <div class="choice-title">${option.title}</div>
                <div class="choice-desc">${option.desc}</div>
            `;
            
            choicesDiv.appendChild(optionDiv);
        });
        
        container.appendChild(choicesDiv);
    }
    
    selectRating(rating) {
        // Update visual selection
        document.querySelectorAll('.rating-btn').forEach((btn, index) => {
            btn.classList.toggle('selected', index + 1 === rating);
        });
        
        // Save answer
        this.answers[this.currentQuestionIndex] = {
            type: 'rating',
            value: rating
        };
        
        // Enable next button
        document.getElementById('next-btn').disabled = false;
        
        // Auto-advance after delay
        setTimeout(() => {
            if (!document.getElementById('next-btn').disabled) {
                this.nextQuestion();
            }
        }, 800);
    }
    
    selectChoice(option) {
        // Update visual selection
        document.querySelectorAll('.choice-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        // Save answer
        this.answers[this.currentQuestionIndex] = {
            type: 'choice',
            option: option,
            value: option.value
        };
        
        // Enable next button
        document.getElementById('next-btn').disabled = false;
        
        // Auto-advance after delay
        setTimeout(() => {
            if (!document.getElementById('next-btn').disabled) {
                this.nextQuestion();
            }
        }, 800);
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
        } else {
            this.finishTasting();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
        }
    }
    
    skipQuestion() {
        this.answers[this.currentQuestionIndex] = null;
        this.nextQuestion();
    }
    
    // Results Functions
    finishTasting() {
        const finalScore = this.calculateFinalScore();
        const answeredQuestions = this.answers.filter(a => a !== null && a !== undefined).length;
        
        // Save to history
        this.saveTastingResult(finalScore, answeredQuestions);
        
        // Display results
        this.displayResults(finalScore, answeredQuestions);
        this.showScreen('results');
    }
    
    calculateFinalScore() {
        let totalScore = 0;
        let answeredQuestions = 0;
        
        this.answers.forEach((answer, index) => {
            if (answer && answer.value) {
                // Convert from /5 scale to /4 scale (max 20 points total)
                totalScore += (answer.value / 5.0) * 4.0;
                answeredQuestions++;
            }
        });
        
        return answeredQuestions > 0 ? totalScore : 0;
    }
    
    displayResults(finalScore, answeredQuestions) {
        const finalScoreEl = document.getElementById('final-score');
        const scoreDescEl = document.getElementById('score-description');
        const answeredQuestionsEl = document.getElementById('answered-questions');
        const tastingDateEl = document.getElementById('tasting-date');
        
        finalScoreEl.textContent = `${finalScore.toFixed(1)}/20`;
        scoreDescEl.textContent = this.getScoreDescription(finalScore);
        answeredQuestionsEl.textContent = `${answeredQuestions}/${this.questions.length}`;
        tastingDateEl.textContent = new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getScoreDescription(score) {
        if (score >= 18) return 'Vin exceptionnel ! 🌟';
        if (score >= 16) return 'Très bon vin ! 🍷';
        if (score >= 14) return 'Bon vin ✨';
        if (score >= 12) return 'Vin correct 👍';
        if (score >= 10) return 'Vin moyen 😐';
        return 'Vin décevant 😞';
    }
    
    // History Functions
    saveTastingResult(score, answeredQuestions) {
        const tasting = {
            id: Date.now(),
            score: score,
            answeredQuestions: answeredQuestions,
            totalQuestions: this.questions.length,
            date: new Date().toISOString(),
            bottleCount: this.bottleCount
        };
        
        this.tastingHistory.push(tasting);
        this.saveHistory();
        this.updateStats();
    }
    
    updateHistoryDisplay() {
        const historyStats = document.getElementById('history-stats');
        const historyList = document.getElementById('history-list');
        
        if (this.tastingHistory.length === 0) {
            historyStats.textContent = '0 dégustations • Note moyenne: --';
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍷</div>
                    <h3>Aucune dégustation enregistrée</h3>
                    <p>Participez à une session de dégustation pour voir vos résultats ici</p>
                </div>
            `;
            return;
        }
        
        // Calculate average
        const totalScore = this.tastingHistory.reduce((sum, t) => sum + t.score, 0);
        const averageScore = totalScore / this.tastingHistory.length;
        const plural = this.tastingHistory.length > 1 ? 's' : '';
        
        historyStats.textContent = `${this.tastingHistory.length} dégustation${plural} • Note moyenne: ${averageScore.toFixed(1)}/20`;
        
        // Display history items
        historyList.innerHTML = '';
        const sortedHistory = [...this.tastingHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedHistory.forEach(tasting => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const date = new Date(tasting.date);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const bottleId = tasting.bottleIdentifier ? `${tasting.bottleIdentifier} • ` : '';
            const wineName = tasting.wine?.name || 'Vin non spécifié';
            const wineDetails = [];
            if (tasting.wine?.vintage) wineDetails.push(tasting.wine.vintage);
            if (tasting.wine?.region) wineDetails.push(tasting.wine.region);
            if (tasting.wine?.type) wineDetails.push(tasting.wine.type);
            const wineInfo = wineDetails.length > 0 ? ` • ${wineDetails.join(' • ')}` : '';
            
            item.innerHTML = `
                <div class="history-header">
                    <div class="history-score">${(tasting.finalScore || tasting.score).toFixed(1)}/20</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
                <div class="wine-name">🍷 ${bottleId}${wineName}${wineInfo}</div>
                <div class="history-description">${this.getScoreDescription(tasting.finalScore || tasting.score)}</div>
            `;
            
            historyList.appendChild(item);
        });
    }
    
    // Settings Functions
    loadSettingsState() {
        document.getElementById('notifications-toggle').checked = this.settings.notifications;
        document.getElementById('autosave-toggle').checked = this.settings.autosave;
        document.getElementById('darkmode-toggle').checked = this.settings.darkMode;
        
        // Add event listeners
        document.getElementById('notifications-toggle').onchange = (e) => {
            this.settings.notifications = e.target.checked;
            this.saveSettings();
        };
        
        document.getElementById('autosave-toggle').onchange = (e) => {
            this.settings.autosave = e.target.checked;
            this.saveSettings();
        };
        
        document.getElementById('darkmode-toggle').onchange = (e) => {
            this.settings.darkMode = e.target.checked;
            this.saveSettings();
            this.applyDarkMode(e.target.checked);
        };
        
        // Apply dark mode if enabled
        this.applyDarkMode(this.settings.darkMode);
    }
    
    applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    resetData() {
        // Première confirmation détaillée
        if (confirm('⚠️ ATTENTION - SUPPRESSION DÉFINITIVE ⚠️\n\nÊtes-vous sûr de vouloir effacer toutes les données locales ?\n\nCette action supprimera DÉFINITIVEMENT :\n• Tout l\'historique des dégustations\n• Tous les paramètres personnalisés\n• Toutes les statistiques locales\n\n⚠️ CETTE ACTION EST IRRÉVERSIBLE ⚠️\n\nContinuer ?')) {
            
            // Seconde confirmation de sécurité
            if (confirm('🚨 DERNIÈRE CONFIRMATION 🚨\n\nVous êtes sur le point de SUPPRIMER DÉFINITIVEMENT toutes les données locales de l\'application.\n\nIl sera IMPOSSIBLE de récupérer ces données après cette action.\n\nConfirmez-vous vraiment cette suppression complète ?')) {
                this.tastingHistory = [];
                this.settings = this.getDefaultSettings();
                this.saveHistory();
                this.saveSettings();
                this.updateStats();
                this.loadSettingsState();
                alert('🗑️ Toutes les données locales ont été effacées avec succès.');
            }
        }
    }
    
    // Utility Functions
    resetTasting() {
        this.currentQuestionIndex = 0;
        this.bottleCount = 1;
        this.customNames = false;
        this.resetAnswers();
        
        // Reset bottle count display
        const bottleCountEl = document.getElementById('bottle-count');
        if (bottleCountEl) {
            bottleCountEl.textContent = '1';
        }
        
        // Reset custom names checkbox
        const customNamesEl = document.getElementById('custom-names');
        if (customNamesEl) {
            customNamesEl.checked = false;
        }
    }
    
    resetAnswers() {
        this.answers = new Array(this.questions.length).fill(null);
    }
    
    updateStats() {
        const statsEl = document.getElementById('stats-text');
        if (!statsEl) return;
        
        if (this.tastingHistory.length === 0) {
            statsEl.textContent = '📈 0 dégustations • ⭐ Note moyenne: --';
            return;
        }
        
        const totalScore = this.tastingHistory.reduce((sum, t) => sum + t.score, 0);
        const averageScore = totalScore / this.tastingHistory.length;
        const plural = this.tastingHistory.length > 1 ? 's' : '';
        
        statsEl.textContent = `📈 ${this.tastingHistory.length} dégustation${plural} • ⭐ Note moyenne: ${averageScore.toFixed(1)}/20`;
    }
    
    // Storage Functions
    loadHistory() {
        try {
            const saved = localStorage.getItem('wine-tasting-history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('wine-tasting-history', JSON.stringify(this.tastingHistory));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('wine-tasting-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (e) {
            console.error('Error loading settings:', e);
            return this.getDefaultSettings();
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('wine-tasting-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }
    
    getDefaultSettings() {
        return {
            notifications: true,
            autosave: true,
            darkMode: false
        };
    }
}

// Global functions for HTML onclick handlers
let app;

function startTasting() {
    app.startTasting();
}

function viewHistory() {
    app.viewHistory();
}

function openSettings() {
    app.openSettings();
}

function goToMain() {
    app.goToMain();
}

function changeBottleCount(delta) {
    app.changeBottleCount(delta);
}

function startTastingQuestions() {
    app.startTastingQuestions();
}

function nextQuestion() {
    app.nextQuestion();
}

function previousQuestion() {
    app.previousQuestion();
}

function skipQuestion() {
    app.skipQuestion();
}

function newTasting() {
    app.newTasting();
}

function resetData() {
    app.resetData();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new WineTastingApp();
});

// Add dark mode CSS
const darkModeCSS = `
.dark-mode {
    --bg-primary: #1a1a1a;
    --bg-card: #2d2d2d;
    --bg-overlay: #333333;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --text-hint: #999999;
}

.dark-mode body {
    background: linear-gradient(135deg, var(--bg-primary) 0%, #222222 100%);
}

.dark-mode .card {
    border-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .choice-option, .dark-mode .rating-btn {
    border-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .checkbox-option {
    background: var(--bg-card);
    border-color: transparent;
}

.dark-mode .checkbox-option:hover {
    background: rgba(218, 165, 32, 0.1);
    border-color: var(--wine-accent);
}
`;

// Inject dark mode CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = darkModeCSS;
document.head.appendChild(styleSheet);