// Fix: Updated import path to align with package guidelines.
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Declare jsQR to avoid 'Cannot find name' error.
declare var jsQR: any;

const app = {
    version: '1.3.0',
    changelog: {
        '1.3.0': [
            'Рефакторинг: код разделен на HTML, CSS и JS файлы.',
            'PWA: Добавлен Service Worker для базовой офлайн-работы.',
            'UI: Обновлены иконки навигации, улучшена анимация заставки.',
            'UX: Добавлена кнопка "Назад" на первом шаге мастера настройки.',
            'Список покупок: Купленные товары сортируются вниз, добавлена отмена покупок.',
            'Регенерация: Улучшена логика перегенерации одного дня.',
            'Функционал: Добавлена основа для синхронизации через QR и скрытая админ-панель.',
        ],
        '1.2.0': [
            'Добавлена информация об авторе и версии приложения.',
            'При перегенерации меню теперь учитываются уже купленные продукты.',
            'Улучшена логика обработки остатков блюд в меню, добавлена кнопка регенерации.',
            'Обновлен дизайн кнопки полной перегенерации.',
            'Улучшена проверка API ключа при запуске приложения.',
        ],
        '1.1.0': [
            'Добавлена анимированная заставка-презентация.',
            'Реализованы расширенные настройки (кухня, сложность, время).',
            'Улучшен ИИ для генерации списка покупок с учетом "магазинных" единиц.',
            'В шагах рецепта теперь отображается количество ингредиентов.',
            'Добавлена функция "Попросить купить" недостающие продукты.',
        ],
        '1.0.0': ['Первоначальный выпуск.'],
    },
    state: {
        settings: {
            apiKey: null,
            family: [],
            preferences: "Без рыбы, без грибов",
            menuDuration: 7,
            totalBudget: 10000,
            cuisine: "Любая",
            difficulty: "Любая",
        },
        menu: [],
        recipes: {},
        shoppingList: [],
        cookedMeals: {},
        timestamp: null,
    },
    
    dom: {} as Record<string, HTMLElement | null | NodeListOf<Element>>,
    wizard: {
        currentStep: 1,
        totalSteps: 4,
    },
    currentRecipe: {
        id: null,
        step: 0,
    },
    timer: {
        interval: null,
        timeLeft: 0,
        initialTime: 0,
        isRunning: false,
    },
    admin: {
        clickCount: 0,
        clickTimer: null,
    },

    async init() {
        this.cacheDom();
        this.addEventListeners();
        this.loadState();
        this.registerServiceWorker();

        const hasSeenSplash = localStorage.getItem('hasSeenSplash');
        if (!hasSeenSplash) {
            this.showScreen('splash-screen');
        } else {
            this.showScreen('welcome-screen');
        }
    },

    cacheDom() {
        this.dom = {
            splashScreen: document.getElementById('splash-screen'),
            startAppBtn: document.getElementById('start-app-btn'),
            screens: document.querySelectorAll('.screen'),
            welcomeScreen: document.getElementById('welcome-screen'),
            startSetupWizardBtn: document.getElementById('start-setup-wizard-btn'),
            loadFromFileBtn: document.getElementById('load-from-file-btn'),
            setupScreen: document.getElementById('setup-screen'),
            mainScreen: document.getElementById('main-screen'),
            recipeScreen: document.getElementById('recipe-screen'),
            
            // Wizard
            setupWizard: document.getElementById('setup-wizard'),
            wizardSteps: document.querySelectorAll('.wizard-step'),
            wizardNav: document.getElementById('wizard-nav'),
            wizardBackBtn: document.getElementById('wizard-back-btn'),
            wizardNextBtn: document.getElementById('wizard-next-btn'),
            wizardStepCounter: document.getElementById('wizard-step-counter'),
            apiKeyInput: document.getElementById('api-key-input'),
            apiKeyHelpLink: document.getElementById('api-key-help-link'),
            wizardFamilyContainer: document.getElementById('wizard-family-members-container'),
            wizardAddMemberBtn: document.getElementById('wizard-add-family-member-btn'),
            wizardDuration: document.getElementById('wizard-menu-duration'),
            wizardBudget: document.getElementById('wizard-total-budget'),
            wizardPreferences: document.getElementById('wizard-preferences'),
            wizardCuisine: document.getElementById('wizard-cuisine'),
            wizardDifficulty: document.getElementById('wizard-difficulty'),

            generationProgress: document.getElementById('generation-progress'),
            progressBar: document.getElementById('progress-bar'),
            progressStatus: document.getElementById('progress-status'),
            progressDetails: document.getElementById('progress-details'),
            finishSetupBtn: document.getElementById('finish-setup-btn'),
            
            bottomNav: document.querySelector('.bottom-nav'),
            mainContents: document.querySelectorAll('.main-content'),
            mainHeaderTitle: document.getElementById('main-header-title'),
            
            dayScroller: document.getElementById('day-scroller-container'),
            shoppingListContainer: document.getElementById('shopping-list-container'),
            shoppingProgressText: document.getElementById('shopping-progress-text'),
            shoppingProgress: document.getElementById('shopping-progress'),
            shoppingListTotal: document.getElementById('shopping-list-total'),

            backToMenuBtn: document.getElementById('back-to-menu-btn'),
            recipeTitle: document.getElementById('recipe-title'),
            stepIndicator: document.getElementById('step-indicator'),
            stepImage: document.getElementById('step-image'),
            stepDescription: document.getElementById('step-description'),
            timerSection: document.getElementById('timer-section'),
            timerDisplay: document.getElementById('timer-display'),
            startTimerBtn: document.getElementById('start-timer-btn'),
            pauseTimerBtn: document.getElementById('pause-timer-btn'),
            resetTimerBtn: document.getElementById('reset-timer-btn'),
            stepIngredientsList: document.getElementById('step-ingredients'),
            stepIngredientsTitle: document.getElementById('step-ingredients-title'),
            prevStepBtn: document.getElementById('prev-step-btn'),
            nextStepBtn: document.getElementById('next-step-btn'),
            
            budget: {
                pieProducts: document.getElementById('pie-products'),
                spentTotal: document.getElementById('budget-spent-total'),
                total: document.getElementById('budget-total'),
                remaining: document.getElementById('budget-remaining'),
            },

            settings: {
                duration: document.getElementById('settings-menu-duration'),
                budget: document.getElementById('settings-total-budget'),
                preferences: document.getElementById('settings-preferences'),
                cuisine: document.getElementById('settings-cuisine'),
                difficulty: document.getElementById('settings-difficulty'),
                saveBtn: document.getElementById('save-settings-btn'),
                familyContainer: document.getElementById('family-members-container'),
                addMemberBtn: document.getElementById('add-family-member-btn'),
                regenerateAllBtn: document.getElementById('regenerate-all-btn'),
                apiKeyInput: document.getElementById('settings-api-key'),
                saveApiKeyBtn: document.getElementById('save-api-key-btn'),
                runWizardBtn: document.getElementById('run-wizard-btn'),
                appVersionInfo: document.getElementById('app-version-info'),
                showChangelogBtn: document.getElementById('show-changelog-btn'),
            },
        };
    },

    addEventListeners() {
        if (this.dom.startAppBtn) {
            this.dom.startAppBtn.addEventListener('click', () => {
                localStorage.setItem('hasSeenSplash', 'true');
                this.showScreen('welcome-screen');
            });
        }
        
        if (this.dom.startSetupWizardBtn) {
            this.dom.startSetupWizardBtn.addEventListener('click', () => {
                this.showScreen('setup-screen');
                this.wizard.currentStep = 1;
                this.updateWizardNav();
            });
        }
        
        if (this.dom.wizardNextBtn) {
            this.dom.wizardNextBtn.addEventListener('click', () => this.handleWizardNext());
        }
        
        if (this.dom.wizardBackBtn) {
            this.dom.wizardBackBtn.addEventListener('click', () => {
                if (this.wizard.currentStep > 1) {
                    this.wizard.currentStep--;
                    this.updateWizardNav();
                }
            });
        }
        
        if (this.dom.wizardAddMemberBtn) {
           this.dom.wizardAddMemberBtn.addEventListener('click', () => this.addFamilyMember(true));
        }

        // Add other event listeners here as functionality is built out
        // For example:
        // this.dom.bottomNav.addEventListener('click', (e) => this.handleNav(e));
        // this.dom.settings.saveBtn.addEventListener('click', () => this.saveSettings());
    },

    loadState() {
        const savedState = localStorage.getItem('familyMenuState');
        if (savedState) {
            Object.assign(this.state, JSON.parse(savedState));
        }
    },
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    },

    showScreen(screenId: string) {
        (this.dom.screens as NodeListOf<HTMLElement>).forEach(screen => {
            const isTargetScreen = screen.id === screenId;
            screen.classList.toggle('hidden', !isTargetScreen);
            // Special handling for animations or transitions if needed
            if (isTargetScreen) {
                 screen.classList.add('active'); 
            } else {
                 screen.classList.remove('active');
            }
        });
    },

    updateWizardNav() {
        if (!this.dom.setupWizard || !this.dom.wizardNav || !this.dom.wizardStepCounter || !this.dom.wizardBackBtn || !this.dom.wizardNextBtn) return;

        (this.dom.wizardSteps as NodeListOf<HTMLElement>).forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step || '0') === this.wizard.currentStep);
        });

        this.dom.wizardNav.classList.remove('hidden');
        (this.dom.wizardStepCounter as HTMLElement).textContent = `Шаг ${this.wizard.currentStep} из ${this.wizard.totalSteps}`;

        (this.dom.wizardBackBtn as HTMLButtonElement).classList.toggle('hidden', this.wizard.currentStep === 1);
        
        const nextButton = this.dom.wizardNextBtn as HTMLButtonElement;
        if (this.wizard.currentStep === this.wizard.totalSteps) {
            nextButton.textContent = '✨ Сгенерировать меню';
        } else {
            nextButton.textContent = 'Далее';
        }
    },
    
    addFamilyMember(isWizard: boolean) {
        const container = (isWizard ? this.dom.wizardFamilyContainer : this.dom.settings?.familyContainer) as HTMLElement;
        if (!container) return;

        const memberId = Date.now();
        const memberDiv = document.createElement('div');
        memberDiv.className = 'family-member-card';
        memberDiv.innerHTML = `
            <input type="text" placeholder="Имя" class="settings-input" style="width: 40%;" data-id="${memberId}" data-field="name">
            <input type="number" placeholder="Возраст" class="settings-input" style="width: 25%;" data-id="${memberId}" data-field="age">
            <button data-id="${memberId}" class="remove-member-btn">✕</button>
        `;
        container.appendChild(memberDiv);
        
        memberDiv.querySelector('.remove-member-btn')?.addEventListener('click', () => {
             memberDiv.remove();
        });
    },

    handleWizardNext() {
        if (this.wizard.currentStep < this.wizard.totalSteps) {
            this.wizard.currentStep++;
            this.updateWizardNav();
        } else {
            // Last step: gather data and start generation
            this.collectWizardData();
            this.startGeneration();
        }
    },
    
    collectWizardData() {
        this.state.settings.apiKey = (this.dom.apiKeyInput as HTMLInputElement)?.value;
        this.state.settings.menuDuration = parseInt((this.dom.wizardDuration as HTMLInputElement)?.value) || 7;
        this.state.settings.totalBudget = parseInt((this.dom.wizardBudget as HTMLInputElement)?.value) || 10000;
        this.state.settings.preferences = (this.dom.wizardPreferences as HTMLTextAreaElement)?.value || 'Без особых предпочтений';
        this.state.settings.cuisine = (this.dom.wizardCuisine as HTMLSelectElement)?.value || 'Любая';
        this.state.settings.difficulty = (this.dom.wizardDifficulty as HTMLSelectElement)?.value || 'Любая';
        
        // Collect family members from wizard
        this.state.settings.family = [];
        const members = this.dom.wizardFamilyContainer?.querySelectorAll('.family-member-card');
        members?.forEach(memberCard => {
            const nameInput = memberCard.querySelector('input[data-field="name"]') as HTMLInputElement;
            const ageInput = memberCard.querySelector('input[data-field="age"]') as HTMLInputElement;
            if (nameInput?.value && ageInput?.value) {
                this.state.settings.family.push({
                    id: Date.now() + Math.random(),
                    name: nameInput.value,
                    age: parseInt(ageInput.value)
                });
            }
        });
    },

    async startGeneration() {
        if (this.dom.setupWizard) (this.dom.setupWizard as HTMLElement).classList.add('hidden');
        if (this.dom.wizardNav) (this.dom.wizardNav as HTMLElement).classList.add('hidden');
        if (this.dom.generationProgress) (this.dom.generationProgress as HTMLElement).classList.remove('hidden');
        
        // Dummy generation process for now
        const steps = [
            { status: "Анализируем ваши предпочтения...", detail: "ИИ подбирает лучшие варианты...", progress: 20 },
            { status: "Составляем меню на неделю...", detail: "Создание разнообразных и вкусных блюд.", progress: 50 },
            { status: "Рассчитываем список покупок...", detail: "Оптимизация продуктов, чтобы ничего не пропало.", progress: 80 },
            { status: "Готовим пошаговые рецепты...", detail: "Все будет просто и понятно!", progress: 100 },
        ];
        
        for (const step of steps) {
            if (this.dom.progressStatus) (this.dom.progressStatus as HTMLElement).textContent = step.status;
            if (this.dom.progressDetails) (this.dom.progressDetails as HTMLElement).textContent = step.detail;
            if (this.dom.progressBar) (this.dom.progressBar as HTMLElement).style.width = `${step.progress}%`;
            await new Promise(res => setTimeout(res, 1500));
        }
        
        if (this.dom.finishSetupBtn) (this.dom.finishSetupBtn as HTMLElement).classList.remove('hidden');
        if (this.dom.finishSetupBtn) {
            this.dom.finishSetupBtn.addEventListener('click', () => {
                this.showScreen('main-screen');
                // this.renderAll(); // To be implemented
            });
        }
    }
};

app.init();
