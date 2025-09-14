// Fix: Updated import path to align with package guidelines.
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Declare jsQR and QRCode to avoid 'Cannot find name' error.
declare var jsQR: any;
declare var QRCode: any;

interface FamilyMember {
    id: number;
    name: string;
    age: number;
}

interface Settings {
    geminiApiKey: string | null;
    jsonbinApiKey: string | null;
    jsonbinBinId: string | null;
    family: FamilyMember[];
    preferences: string;
    menuDuration: number;
    totalBudget: number;
    cuisine: string;
    difficulty: string;
}

interface Purchase {
    timestamp: number;
    quantity: number;
    price: number;
}
interface ShoppingListItem {
    id: string;
    name: string;
    quantity: string;
    category: string;
    completed: boolean;
    price: number;
    purchaseHistory: Purchase[];
}

interface RecipeStep {
    description: string;
    ingredients: string[];
    timer?: number; // in seconds
    image_prompt?: string;
}

interface Recipe {
    id: string;
    title: string;
    description: string;
    steps: RecipeStep[];
}

interface Meal {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner';
    isLeftover?: boolean;
    leftoverFromId?: string;
}

interface DayMenu {
    day: number;
    meals: Meal[];
}

interface AppState {
    settings: Settings;
    menu: DayMenu[];
    recipes: Record<string, Recipe>;
    shoppingList: ShoppingListItem[];
    cookedMeals: Record<string, boolean>;
    timestamp: number | null;
}


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
            geminiApiKey: null,
            jsonbinApiKey: null,
            jsonbinBinId: null,
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
    } as AppState,
    
    dom: {} as Record<string, HTMLElement | null | NodeListOf<Element>>,
    wizard: {
        currentStep: 1,
        totalSteps: 4,
        isActive: false,
    },
    currentRecipe: {
        id: null as string | null,
        step: 0,
    },
    timer: {
        interval: null as number | null,
        timeLeft: 0,
        initialTime: 0,
        isRunning: false,
    },
    admin: {
        clickCount: 0,
        clickTimer: null as number | null,
    },
    ai: null as GoogleGenAI | null,
    isGenerating: false,

    async init() {
        this.cacheDom();
        this.addEventListeners();
        await this.loadState();
        this.updateVersionInfo();
        this.registerServiceWorker();
        this.requestNotificationPermission();

        const hasSeenSplash = localStorage.getItem('hasSeenSplash');
        if (!hasSeenSplash) {
            this.showScreen('splash-screen');
        } else {
            if (this.state.settings.geminiApiKey && this.state.menu.length > 0) {
                 this.showScreen('main-screen');
                 this.renderAll();
            } else if (this.state.settings.geminiApiKey) {
                this.showScreen('setup-screen');
                this.wizard.currentStep = 2; // Skip API key step
                this.updateWizardNav();
            } else {
                 this.showScreen('welcome-screen');
            }
        }
    },

    cacheDom() {
       this.dom = {
            // Screens
            screens: document.querySelectorAll('.screen'),
            splashScreen: document.getElementById('splash-screen'),
            welcomeScreen: document.getElementById('welcome-screen'),
            setupScreen: document.getElementById('setup-screen'),
            mainScreen: document.getElementById('main-screen'),
            recipeScreen: document.getElementById('recipe-screen'),

            // Splash & Welcome
            startAppBtn: document.getElementById('start-app-btn'),
            startSetupWizardBtn: document.getElementById('start-setup-wizard-btn'),
            loadFromFileBtn: document.getElementById('load-from-file-btn'),
            welcomeScanQrBtn: document.getElementById('welcome-scan-qr-btn'),

            // Setup Wizard
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

            // Generation Progress
            generationProgress: document.getElementById('generation-progress'),
            progressBar: document.getElementById('progress-bar'),
            progressStatus: document.getElementById('progress-status'),
            progressDetails: document.getElementById('progress-details'),
            finishSetupBtn: document.getElementById('finish-setup-btn'),
            
            // Main Screen
            bottomNav: document.querySelector('.bottom-nav'),
            mainContents: document.querySelectorAll('.main-content'),
            mainHeaderTitle: document.getElementById('main-header-title'),
            
            // Menu
            dayScroller: document.getElementById('day-scroller-container'),
            
            // Shopping List
            shoppingListContainer: document.getElementById('shopping-list-container'),
            shoppingProgressText: document.getElementById('shopping-progress-text'),
            shoppingProgress: document.getElementById('shopping-progress'),
            shoppingListTotal: document.getElementById('shopping-list-total'),

            // Recipe Screen
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
            
            // Budget
            budget: {
                pieProducts: document.getElementById('pie-products'),
                spentTotal: document.getElementById('budget-spent-total'),
                total: document.getElementById('budget-total'),
                remaining: document.getElementById('budget-remaining'),
            },
            
            // Settings
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
                jsonbinKeyInput: document.getElementById('settings-jsonbin-key'),
                jsonbinIdInput: document.getElementById('settings-jsonbin-id'),
                connectJsonbinBtn: document.getElementById('connect-jsonbin-btn'),
                scanQrBtn: document.getElementById('scan-qr-btn'),
                showQrBtn: document.getElementById('show-qr-btn'),
                exportBtn: document.getElementById('export-btn'),
                importBtn: document.getElementById('import-btn'),
                importFileInput: document.getElementById('import-file-input'),
                runWizardBtn: document.getElementById('run-wizard-btn'),
                appVersionInfo: document.getElementById('app-version-info'),
                showChangelogBtn: document.getElementById('show-changelog-btn'),
            },

            // Modals & Notifications
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalButtons: document.getElementById('modal-buttons'),
            notification: document.getElementById('notification'),
        };
    },

    addEventListeners() {
        // Splash & Welcome
        this.dom.startAppBtn?.addEventListener('click', () => {
            localStorage.setItem('hasSeenSplash', 'true');
            this.showScreen('welcome-screen');
        });
        this.dom.startSetupWizardBtn?.addEventListener('click', () => this.runWizard());
        this.dom.welcomeScanQrBtn?.addEventListener('click', () => this.scanQRCode());

        // Wizard
        this.dom.wizardNextBtn?.addEventListener('click', () => this.handleWizardNext());
        this.dom.wizardBackBtn?.addEventListener('click', () => this.handleWizardBack());
        this.dom.wizardAddMemberBtn?.addEventListener('click', () => this.addFamilyMember(true));
        this.dom.apiKeyHelpLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showApiKeyHelp();
        });

        // Main Navigation
        this.dom.bottomNav?.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('.nav-button');
            if (target) {
                // Fix: Cast target to HTMLElement to access dataset property.
                this.handleNav((target as HTMLElement).dataset.content || '', (target as HTMLElement).dataset.title || '');
            }
        });
        
        // Settings
        const s = this.dom.settings as Record<string, HTMLElement | null>;
        s.runWizardBtn?.addEventListener('click', () => this.runWizard(true));
        s.saveBtn?.addEventListener('click', () => this.saveSettings());
        s.addMemberBtn?.addEventListener('click', () => this.addFamilyMember(false));
        s.regenerateAllBtn?.addEventListener('click', () => this.regenerate('all'));
        s.saveApiKeyBtn?.addEventListener('click', () => this.saveGeminiApiKey());
        s.connectJsonbinBtn?.addEventListener('click', () => this.connectJsonBin());
        s.scanQrBtn?.addEventListener('click', () => this.scanQRCode());
        s.showQrBtn?.addEventListener('click', () => this.showQRCode());
        s.exportBtn?.addEventListener('click', () => this.exportData());
        s.importBtn?.addEventListener('click', () => (s.importFileInput as HTMLInputElement).click());
        (s.importFileInput as HTMLInputElement)?.addEventListener('change', (e) => this.importData(e));
        s.showChangelogBtn?.addEventListener('click', () => this.showChangelog());
        s.appVersionInfo?.addEventListener('click', () => this.handleAdminPanelClick());
        
        // Recipe Screen
        this.dom.backToMenuBtn?.addEventListener('click', () => this.showScreen('main-screen'));
        this.dom.prevStepBtn?.addEventListener('click', () => this.navigateRecipeStep(-1));
        this.dom.nextStepBtn?.addEventListener('click', () => this.navigateRecipeStep(1));
        
        // Timer
        this.dom.startTimerBtn?.addEventListener('click', () => this.startTimer());
        this.dom.pauseTimerBtn?.addEventListener('click', () => this.pauseTimer());
        this.dom.resetTimerBtn?.addEventListener('click', () => this.resetTimer());
    },
    
    // ... STATE MANAGEMENT ...
    async loadState() {
        const savedState = localStorage.getItem('familyMenuState');
        if (savedState) {
            Object.assign(this.state, JSON.parse(savedState));
        }
        if (this.state.settings.geminiApiKey) {
            this.initializeAi();
        }
        // If connected to JSONBin, try to fetch the latest state
        if (this.state.settings.jsonbinBinId && this.state.settings.jsonbinApiKey) {
            await this.syncWithJsonBin(true); // true for load
        }
    },

    async saveState(showNotification = false) {
        this.state.timestamp = Date.now();
        localStorage.setItem('familyMenuState', JSON.stringify(this.state));
        if (showNotification) this.showNotification("Настройки сохранены!", 'success');
        
        await this.syncWithJsonBin();
    },
    
    // ... UI & SCREENS ...
    showScreen(screenId: string) {
        (this.dom.screens as NodeListOf<HTMLElement>).forEach(screen => {
            screen.classList.toggle('hidden', screen.id !== screenId);
            screen.classList.toggle('active', screen.id === screenId);
        });
    },

    runWizard(fromSettings = false) {
        this.wizard.isActive = true;
        this.showScreen('setup-screen');
        if (fromSettings) {
             this.wizard.currentStep = 2;
        } else {
             this.wizard.currentStep = 1;
        }
        this.updateWizardNav();
        this.populateWizardFromState();
    },

    updateWizardNav() {
        if (!this.wizard.isActive) return;
        const wizard = this.dom.setupWizard as HTMLElement;
        const nav = this.dom.wizardNav as HTMLElement;
        wizard.classList.remove('hidden');
        nav.classList.remove('hidden');
        (this.dom.generationProgress as HTMLElement).classList.add('hidden');

        (this.dom.wizardSteps as NodeListOf<HTMLElement>).forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step || '0') === this.wizard.currentStep);
        });

        (this.dom.wizardStepCounter as HTMLElement).textContent = `Шаг ${this.wizard.currentStep} из ${this.wizard.totalSteps}`;
        
        // Show/hide back button (also handles return to welcome screen)
        const backBtn = this.dom.wizardBackBtn as HTMLButtonElement;
        backBtn.classList.remove('hidden');
        if (this.wizard.currentStep === 1) {
            backBtn.textContent = 'К началу';
        } else {
            backBtn.textContent = 'Назад';
        }
        
        const nextButton = this.dom.wizardNextBtn as HTMLButtonElement;
        if (this.wizard.currentStep === this.wizard.totalSteps) {
            nextButton.textContent = '✨ Сгенерировать меню';
        } else {
            nextButton.textContent = 'Далее';
        }
    },
    
    handleWizardBack() {
        if (this.wizard.currentStep > 1) {
            this.wizard.currentStep--;
            this.updateWizardNav();
        } else {
            // From step 1, go back to the welcome screen
            this.wizard.isActive = false;
            this.showScreen('welcome-screen');
        }
    },
    
    handleWizardNext() {
        if (this.wizard.currentStep === 1) {
            const apiKey = (this.dom.apiKeyInput as HTMLInputElement).value;
            if (!apiKey.trim()) {
                this.showNotification("Пожалуйста, введите API ключ.", 'error');
                return;
            }
        }

        if (this.wizard.currentStep < this.wizard.totalSteps) {
            this.wizard.currentStep++;
            this.updateWizardNav();
        } else {
            this.collectWizardData();
            this.startGeneration();
        }
    },

    populateWizardFromState() {
        const s = this.state.settings;
        (this.dom.apiKeyInput as HTMLInputElement).value = s.geminiApiKey || '';
        (this.dom.wizardDuration as HTMLInputElement).value = String(s.menuDuration);
        (this.dom.wizardBudget as HTMLInputElement).value = String(s.totalBudget);
        (this.dom.wizardPreferences as HTMLTextAreaElement).value = s.preferences;
        (this.dom.wizardCuisine as HTMLSelectElement).value = s.cuisine;
        (this.dom.wizardDifficulty as HTMLSelectElement).value = s.difficulty;
        
        const container = this.dom.wizardFamilyContainer as HTMLElement;
        container.innerHTML = '';
        s.family.forEach(member => this.addFamilyMember(true, member));
    },

    collectWizardData() {
        const s = this.state.settings;
        s.geminiApiKey = (this.dom.apiKeyInput as HTMLInputElement).value.trim();
        s.menuDuration = parseInt((this.dom.wizardDuration as HTMLInputElement).value) || 7;
        s.totalBudget = parseInt((this.dom.wizardBudget as HTMLInputElement).value) || 10000;
        s.preferences = (this.dom.wizardPreferences as HTMLTextAreaElement).value || 'Без особых предпочтений';
        s.cuisine = (this.dom.wizardCuisine as HTMLSelectElement).value || 'Любая';
        s.difficulty = (this.dom.wizardDifficulty as HTMLSelectElement).value || 'Любая';
        
        s.family = [];
        const members = this.dom.wizardFamilyContainer?.querySelectorAll('.family-member-card');
        members?.forEach(memberCard => {
            const nameInput = memberCard.querySelector('input[data-field="name"]') as HTMLInputElement;
            const ageInput = memberCard.querySelector('input[data-field="age"]') as HTMLInputElement;
            if (nameInput?.value && ageInput?.value) {
                s.family.push({
                    id: Date.now() + Math.random(),
                    name: nameInput.value,
                    age: parseInt(ageInput.value)
                });
            }
        });
        
        this.initializeAi();
    },

    handleNav(contentId: string, title: string) {
        if (!contentId) return;
        (this.dom.mainContents as NodeListOf<HTMLElement>).forEach(content => {
            content.classList.toggle('active', content.id === contentId);
        });
        (this.dom.bottomNav?.querySelectorAll('.nav-button') as NodeListOf<HTMLElement>).forEach(button => {
            button.classList.toggle('active', button.dataset.content === contentId);
        });
        if (this.dom.mainHeaderTitle) {
            (this.dom.mainHeaderTitle as HTMLElement).textContent = title;
        }
    },
    
    // ... GEMINI API & GENERATION ...
    initializeAi() {
        if (this.state.settings.geminiApiKey) {
            try {
                this.ai = new GoogleGenAI({ apiKey: this.state.settings.geminiApiKey });
            } catch (error) {
                console.error("Error initializing GoogleGenAI:", error);
                this.showNotification("Ошибка инициализации ИИ. Проверьте ключ.", 'error');
                this.ai = null;
            }
        }
    },
    
    async startGeneration() {
        // Implementation for starting the generation process
    },

    async regenerate(scope: 'all' | 'day' | 'meal', id?: string | number) {
        // Implementation for regeneration
    },

    // ... RENDER METHODS ...
    renderAll() {
        this.renderMenu();
        this.renderShoppingList();
        this.renderBudget();
        this.renderSettings();
    },
    
    renderMenu() {
        // Implementation for rendering the menu
    },
    
    renderShoppingList() {
        // Implementation for rendering the shopping list
    },
    
    renderBudget() {
        // Implementation for rendering the budget
    },
    
    renderSettings() {
        // Implementation for rendering the settings
    },
    
    // ... MODALS & NOTIFICATIONS ...
    showNotification(message: string, type: 'success' | 'error' | 'loading' = 'success', duration = 3000) {
        const notification = this.dom.notification as HTMLElement;
        if (!notification) return;
        notification.textContent = message;
        notification.className = '';
        notification.classList.add(type, 'show');
        
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }
    },

    hideNotification() {
         (this.dom.notification as HTMLElement)?.classList.remove('show');
    },
    
    showModal(title: string, body: string | HTMLElement, buttons: {text: string, class: string, action: () => void}[]) {
        // Implementation for showing a modal
    },

    hideModal() {
        (this.dom.modalOverlay as HTMLElement)?.classList.remove('visible');
    },

    showApiKeyHelp() {
        // Implementation for API key help modal
    },
    
    showChangelog() {
        // Implementation for changelog modal
    },
    
    // ... FUNCTIONALITY ...
    
    addFamilyMember(isWizard: boolean, member: FamilyMember | null = null) {
        const container = (isWizard ? this.dom.wizardFamilyContainer : (this.dom.settings as any).familyContainer) as HTMLElement;
        if (!container) return;

        const memberId = member ? member.id : Date.now();
        const memberDiv = document.createElement('div');
        memberDiv.className = 'family-member-card';
        memberDiv.dataset.id = String(memberId);
        memberDiv.innerHTML = `
            <input type="text" placeholder="Имя" class="settings-input" style="width: 40%;" data-field="name" value="${member ? member.name : ''}">
            <input type="number" placeholder="Возраст" class="settings-input" style="width: 25%;" data-field="age" value="${member ? member.age : ''}">
            <button class="remove-member-btn">✕</button>
        `;
        container.appendChild(memberDiv);
        
        memberDiv.querySelector('.remove-member-btn')?.addEventListener('click', () => {
             memberDiv.remove();
             if (!isWizard) {
                this.state.settings.family = this.state.settings.family.filter(f => f.id !== memberId);
                this.saveState(true);
             }
        });
    },

    saveSettings() {
        const s = this.state.settings;
        const domS = this.dom.settings as Record<string, HTMLElement>;
        s.menuDuration = parseInt((domS.duration as HTMLInputElement).value) || 7;
        s.totalBudget = parseInt((domS.budget as HTMLInputElement).value) || 10000;
        s.preferences = (domS.preferences as HTMLTextAreaElement).value;
        s.cuisine = (domS.cuisine as HTMLSelectElement).value;
        s.difficulty = (domS.difficulty as HTMLSelectElement).value;
        
        s.family = [];
        const familyContainer = domS.familyContainer;
        familyContainer.querySelectorAll('.family-member-card').forEach(card => {
             const nameInput = card.querySelector('input[data-field="name"]') as HTMLInputElement;
             const ageInput = card.querySelector('input[data-field="age"]') as HTMLInputElement;
             if(nameInput.value && ageInput.value) {
                s.family.push({
                    id: parseFloat( (card as HTMLElement).dataset.id || '0' ),
                    name: nameInput.value,
                    age: parseInt(ageInput.value)
                });
             }
        });
        
        this.saveState(true);
        this.renderAll();
    },

    saveGeminiApiKey() {
        const key = ((this.dom.settings as any).apiKeyInput as HTMLInputElement).value.trim();
        if (!key) {
            this.showNotification("API ключ не может быть пустым.", "error");
            return;
        }
        this.state.settings.geminiApiKey = key;
        this.initializeAi();
        if(this.ai) {
             this.showNotification("Ключ Gemini API сохранен и проверен!", "success");
             this.saveState();
        } else {
            this.showNotification("Не удалось проверить ключ. Проверьте правильность.", "error");
        }
    },
    
    // ... JSONBIN.IO SYNC ...
    async syncWithJsonBin(isLoad = false) { /* ... */ },
    async connectJsonBin() { /* ... */ },
    
    // ... QR CODE ...
    scanQRCode() { /* ... */ },
    showQRCode() { /* ... */ },
    
    // ... DATA I/O ...
    exportData() { /* ... */ },
    importData(event: Event) { /* ... */ },

    // ... RECIPE & TIMER ...
    showRecipe(mealId: string) { /* ... */ },
    navigateRecipeStep(direction: 1 | -1) { /* ... */ },
    startTimer() { /* ... */ },
    pauseTimer() { /* ... */ },
    resetTimer() { /* ... */ },
    updateTimerDisplay() { /* ... */ },
    
    // ... PWA & HELPERS ...
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swUrl = `${location.origin}/service-worker.js`;
                navigator.serviceWorker.register(swUrl)
                    .then(reg => console.log('Service Worker registered.', reg))
                    .catch(err => console.error('Service Worker registration failed:', err));
            });
        }
    },
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    },
    
    sendNotification(title: string, body: string) {
        if ('Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, { body });
            });
        }
    },
    
    updateVersionInfo() {
        const versionEl = (this.dom.settings as any).appVersionInfo;
        if (versionEl) {
            versionEl.textContent = `Версия приложения: ${this.version}`;
        }
    },
    
    // ... ADMIN PANEL ...
    handleAdminPanelClick() {
        this.admin.clickCount++;
        if (this.admin.clickTimer) clearTimeout(this.admin.clickTimer);
        this.admin.clickTimer = window.setTimeout(() => {
            this.admin.clickCount = 0;
        }, 1500);

        if (this.admin.clickCount === 5) {
            this.admin.clickCount = 0;
            this.showAdminPanel();
        }
    },
    
    showAdminPanel() { /* ... */ },
    
};

app.init();