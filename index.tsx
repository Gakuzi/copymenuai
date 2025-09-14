
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
    
    dom: {},
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
                scanQrBtn: document.getElementById('scan-qr-btn'),
            },
            exportBtn: document.getElementById('export-btn'),
            importBtn: document.getElementById('import-btn'),
            importFileInput: document.getElementById('import-file-input'),

            devConsole: document.getElementById('dev-console'),
            logOutput: document.getElementById('log-output'),
            commandInput: document.getElementById('command-input'),

            notification: document.getElementById('notification'),
            notificationSound: document.getElementById('notification-sound'),

            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalButtons: document.getElementById('modal-buttons'),
        };
    },
    
    addEventListeners() {
        this.dom.startAppBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenSplash', 'true');
            this.showScreen('welcome-screen');
        });
        
        this.dom.startSetupWizardBtn.addEventListener('click', () => this.handleStartSetup());
        this.dom.loadFromFileBtn.addEventListener('click', () => this.dom.importFileInput.click());

        this.dom.wizardNextBtn.addEventListener('click', () => this.navigateWizard(1));
        this.dom.wizardBackBtn.addEventListener('click', () => this.navigateWizard(-1));
        this.dom.apiKeyHelpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showApiKeyHelpModal();
        });

        this.dom.finishSetupBtn.addEventListener('click', () => {
            document.getElementById('generation-progress').classList.add('hidden');
            document.getElementById('finish-setup-btn').classList.add('hidden');
            this.showScreen('main-screen');
            this.renderAll();
        });
        this.dom.bottomNav.addEventListener('click', (e) => this.handleNav(e));
        this.dom.backToMenuBtn.addEventListener('click', () => this.showScreen('main-screen'));
        
        this.dom.prevStepBtn.addEventListener('click', () => this.navigateRecipeStep(-1));
        this.dom.nextStepBtn.addEventListener('click', () => this.navigateRecipeStep(1));

        this.dom.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.dom.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        this.dom.resetTimerBtn.addEventListener('click', () => this.resetTimer());

        // Settings Listeners
        this.dom.settings.saveBtn.addEventListener('click', () => this.saveSettings());
        this.dom.settings.addMemberBtn.addEventListener('click', () => this.openFamilyMemberModal());
        this.dom.settings.regenerateAllBtn.addEventListener('click', () => this.confirmRegenerateAll());
        this.dom.settings.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.dom.wizardAddMemberBtn.addEventListener('click', () => this.openFamilyMemberModal(true));
        this.dom.settings.runWizardBtn.addEventListener('click', () => this.showWizard());
        this.dom.settings.showChangelogBtn.addEventListener('click', () => this.showChangelogModal());
        this.dom.settings.appVersionInfo.addEventListener('click', () => this.handleAdminClick());
        this.dom.settings.scanQrBtn.addEventListener('click', () => this.showQrScanner());

        this.dom.exportBtn.addEventListener('click', () => this.exportData());
        this.dom.importBtn.addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.importFileInput.addEventListener('change', (e) => this.importData(e));

        let longPressTimer;
        document.body.addEventListener('touchstart', e => {
            if (e.touches.length === 3) {
                longPressTimer = setTimeout(() => this.toggleDevConsole(), 1000);
            }
        });
        document.body.addEventListener('touchend', () => clearTimeout(longPressTimer));
        this.dom.commandInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.executeCommand((e.target as HTMLInputElement).value);
        });

        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) {
                this.hideModal();
            }
        });
    },

    async handleStartSetup() {
        if (this.state.settings.apiKey) {
            this.showNotification('Проверка API ключа...', 'loading');
            try {
                this.ai = new GoogleGenAI({ apiKey: this.state.settings.apiKey });
                await this.ai.models.generateContent({model:'gemini-2.5-flash', contents: 'test'});
                this.hideNotification();
                if (this.state.menu && this.state.menu.length > 0) {
                     this.showScreen('main-screen');
                     this.renderAll();
                } else {
                    this.showWizard();
                    this.wizard.currentStep = 2; 
                    this.renderWizard();
                }
            } catch (e) {
                this.showNotification('API ключ недействителен. Введите новый.', 'error');
                this.state.settings.apiKey = null; 
                this.saveState();
                this.showWizard();
            }
        } else {
            this.showWizard();
        }
    },

    saveState() {
        try {
            localStorage.setItem('familyMenuState', JSON.stringify(this.state));
        } catch (e) {
            console.error("Failed to save state:", e);
        }
    },
    
    loadState() {
        const savedState = localStorage.getItem('familyMenuState');
        if (savedState) {
            try {
                const loadedData = JSON.parse(savedState);
                if (loadedData.settings && loadedData.menu) {
                     this.state = loadedData;
                     // Ensure new properties exist for backward compatibility
                     if (!this.state.settings.family) this.state.settings.family = [];
                     if (!this.state.settings.menuDuration) this.state.settings.menuDuration = 7;
                     if (!this.state.cookedMeals) this.state.cookedMeals = {};
                     if (!this.state.settings.cuisine) this.state.settings.cuisine = "Любая";
                     if (!this.state.settings.difficulty) this.state.settings.difficulty = "Любая";

                     this.state.shoppingList.forEach(cat => {
                        (cat.items || []).forEach(item => {
                            if (item.purchases === undefined) item.purchases = item.completed ? [{ qty: item.shoppingSuggestion?.qty || 1, price: item.price }] : [];
                        });
                     });
                } else {
                    this.resetState();
                }
            } catch (e) {
                this.resetState();
            }
        }
    },

    resetState() {
        localStorage.removeItem('familyMenuState');
        localStorage.removeItem('hasSeenSplash');
        window.location.reload();
    },
    
    showScreen(screenId) {
        this.dom.screens.forEach(screen => {
            const isTarget = screen.id === screenId;
            screen.classList.toggle('hidden', !isTarget);
            if (screen.id === 'recipe-screen' || screen.id === 'splash-screen') {
                screen.classList.toggle('active', isTarget);
            }
        });
        if (screenId === 'main-screen') {
            document.getElementById('main-screen').classList.remove('hidden');
            this.renderAll();
        } else if (screenId === 'setup-screen' || screenId === 'welcome-screen') {
             document.getElementById(screenId).classList.remove('hidden');
        }
    },

    showWizard() {
        this.showScreen('setup-screen');
        this.wizard.currentStep = 1;
        this.renderWizard();
    },

    renderWizard() {
        const { currentStep, totalSteps } = this.wizard;
        
        // Populate inputs from state
        (this.dom.apiKeyInput as HTMLInputElement).value = this.state.settings.apiKey || '';
        (this.dom.wizardDuration as HTMLInputElement).value = this.state.settings.menuDuration;
        (this.dom.wizardBudget as HTMLInputElement).value = this.state.settings.totalBudget;
        (this.dom.wizardPreferences as HTMLTextAreaElement).value = this.state.settings.preferences;
        (this.dom.wizardCuisine as HTMLSelectElement).value = this.state.settings.cuisine;
        (this.dom.wizardDifficulty as HTMLSelectElement).value = this.state.settings.difficulty;
        
        this.dom.wizardNav.classList.remove('hidden');
        this.dom.generationProgress.classList.add('hidden');
        this.dom.setupWizard.classList.remove('hidden');
        this.dom.wizardStepCounter.classList.remove('hidden');

        this.dom.wizardStepCounter.textContent = `Шаг ${currentStep} из ${totalSteps}`;

        this.dom.wizardSteps.forEach(step => {
            step.classList.toggle('active', parseInt((step as HTMLElement).dataset.step) === currentStep);
        });

        this.dom.wizardBackBtn.classList.toggle('hidden', false);
        this.dom.wizardBackBtn.textContent = currentStep === 1 ? 'К выбору' : 'Назад';
        this.dom.wizardNextBtn.textContent = currentStep === totalSteps ? 'Начать генерацию' : 'Далее';
        
        if (currentStep === 2) {
            this.renderFamilyMembers(true);
        }
    },

    async navigateWizard(direction) {
        const { currentStep, totalSteps } = this.wizard;

        if (direction < 0 && currentStep === 1) {
            this.showScreen('welcome-screen');
            return;
        }

        // Validation & State saving for current step before navigating
        if (direction > 0) {
            if (currentStep === 1) {
                const apiKey = (this.dom.apiKeyInput as HTMLInputElement).value.trim();
                if (!apiKey) {
                    this.showNotification('Пожалуйста, введите API ключ.', 'error');
                    return;
                }
                this.state.settings.apiKey = apiKey;
            } else if (currentStep === 2) {
                if (this.state.settings.family.length === 0) {
                    this.showNotification('Пожалуйста, добавьте хотя бы одного члена семьи.', 'error');
                    return;
                }
            } else if (currentStep === 3) {
                this.state.settings.menuDuration = parseInt((this.dom.wizardDuration as HTMLInputElement).value) || 7;
                this.state.settings.totalBudget = parseInt((this.dom.wizardBudget as HTMLInputElement).value) || 10000;
                this.state.settings.preferences = (this.dom.wizardPreferences as HTMLTextAreaElement).value;
                this.state.settings.cuisine = (this.dom.wizardCuisine as HTMLSelectElement).value;
                this.state.settings.difficulty = (this.dom.wizardDifficulty as HTMLSelectElement).value;
            } else if (currentStep === totalSteps) {
                this.saveState();
                await this.startGenerationProcess();
                return;
            }
        }
        
        this.wizard.currentStep += direction;
        this.renderWizard();
    },

    async startGenerationProcess(isRegenerating = false, purchasedItems = '') {
        if (!this.state.settings.apiKey) {
            alert('API ключ не найден.');
            this.showWizard();
            return;
        }
        
        this.dom.setupWizard.classList.add('hidden');
        this.dom.wizardNav.classList.add('hidden');
        this.dom.wizardStepCounter.classList.add('hidden');
        this.dom.generationProgress.classList.remove('hidden');
        if (isRegenerating) this.showScreen('setup-screen');
        
        try {
            this.ai = new GoogleGenAI({ apiKey: this.state.settings.apiKey });
            await this.updateProgress(1, 5, "Подключение к Google Gemini…", "Проверка ключа...");
            await this.ai.models.generateContent({model:'gemini-2.5-flash', contents: 'test'});
            this.logToConsole('✅ API KEY VALIDATED');
            this.dom.progressDetails.innerHTML += '<br>✅ Ключ активен. Доступ к Gemini получен.';
            
            await this.generateMenu(purchasedItems);
            if (!this.state.menu || this.state.menu.length === 0) {
                throw new Error("Menu generation failed or returned empty data. Please check your prompt and settings.");
            }
            await this.generateRecipes();
            await this.generateShoppingList();
            
            await this.updateProgress(5, 5, "Готово!", "Добро пожаловать в 'СЕМЕЙНОЕ МЕНЮ'.");
            this.dom.finishSetupBtn.classList.remove('hidden');
            this.dom.finishSetupBtn.classList.add('reveal');
            
            this.state.timestamp = new Date().toISOString();
            this.saveState();

        } catch (error) {
            console.error("Generation failed:", error);
            this.updateProgress(0, 5, "Ошибка!", `Не удалось сгенерировать меню. ${error.message}`);
            this.dom.finishSetupBtn.textContent = 'Назад к настройкам';
            this.dom.finishSetupBtn.classList.remove('hidden');
            this.dom.finishSetupBtn.onclick = () => window.location.reload();
            if(!isRegenerating) {
                this.state.settings.apiKey = null;
                this.saveState();
            }
        }
    },
    
    async updateProgress(step, totalSteps, status, details) {
        return new Promise(resolve => {
            const percent = (step / totalSteps) * 100;
            this.dom.progressBar.style.width = `${percent}%`;
            this.dom.progressStatus.textContent = `Шаг ${step}/${totalSteps}: ${status}`;
            this.dom.progressDetails.innerHTML = details;
            setTimeout(resolve, 300);
        });
    },

    async makeGeminiRequest(prompt, jsonSchema) {
        this.logToConsole(`🟡 REQUEST: ${prompt.substring(0, 50)}...`);
        let retries = 3;
        while (retries > 0) {
            try {
                const result = await this.ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: [{ parts: [{ text: prompt }] }],
                  config: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema
                  }
                });
                const jsonText = result.text.trim();
                const data = JSON.parse(jsonText);
                this.logToConsole(`✅ RESPONSE RECEIVED`);
                return data;
            } catch (error) {
                retries--;
                this.logToConsole(`🔴 ERROR: ${error}. Retrying... (${retries} left)`);
                if (retries === 0) throw error;
                await new Promise(res => setTimeout(res, 1000));
            }
        }
    },

    async generateMenu(purchasedItems = '') {
        const { family, menuDuration, preferences, cuisine, difficulty } = this.state.settings;
        await this.updateProgress(2, 5, "Генерация меню...", `Для вашей семьи на ${menuDuration} дней.`);
        const familyDescription = family.map(p => `${p.gender === 'male' ? 'Мужчина' : 'Женщина'}, ${p.age} лет, активность: ${p.activity}`).join('; ');
        
        let prompt = `Сгенерируй разнообразное и сбалансированное меню на ${menuDuration} дней (с воскресенья по субботу) для семьи: ${familyDescription}. 
        Учти их потребности в калориях.
        Общие предпочтения: ${preferences}.
        Предпочитаемая кухня: ${cuisine}.
        Желаемая сложность блюд: ${difficulty}.
        Каждый день должен включать: Завтрак, Перекус, Обед, Полдник, Ужин. Иногда используй остатки от ужина на обед следующего дня (помечай их как "Название блюда (остатки)").`;
        
        if (purchasedItems) {
            prompt += `\nВАЖНО: При составлении меню отдай приоритет блюдам, в которых используются уже купленные продукты. Список купленных продуктов: ${purchasedItems}.`;
        }

        const schema = {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {day: {type: Type.STRING}, meals: {type: Type.OBJECT, properties: {breakfast: {type: Type.STRING}, snack1: {type: Type.STRING}, lunch: {type: Type.STRING}, snack2: {type: Type.STRING}, dinner: {type: Type.STRING}}, required: ["breakfast", "snack1", "lunch", "snack2", "dinner"]}}, required: ["day", "meals"]}};
        this.state.menu = await this.makeGeminiRequest(prompt, schema);
        this.dom.progressDetails.innerHTML += `<br>✅ Сгенерировано меню.`;
    },
    
    async generateRecipes() {
        await this.updateProgress(3, 5, "Генерация рецептов…", "Создаём пошаговые инструкции...");
        const uniqueMeals = [...new Set(this.state.menu.flatMap(d => Object.values(d.meals)))].filter(name => name && !name.includes("(остатки)"));
        if (uniqueMeals.length === 0) {
             this.dom.progressDetails.innerHTML += `<br>⚠️ Не найдено новых блюд для генерации рецептов.`;
             return;
        }
        const familySize = this.state.settings.family.length;
        const schema = {type: Type.OBJECT, properties: {id: {type: Type.STRING}, name: {type: Type.STRING}, ingredients: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {name: {type: Type.STRING}, quantity: {type: Type.STRING}}, required: ["name", "quantity"]}}, steps: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {description: {type: Type.STRING}, time: {type: Type.NUMBER, description: "Время в минутах. 0 если таймер не нужен."}, ingredients: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: { name: {type: Type.STRING}, quantity: {type: Type.STRING, description: "Количество и единица измерения, например '200 г' или '1 шт'"} }, required: ["name", "quantity"] }}}, required: ["description", "time", "ingredients"]}}}, required: ["id", "name", "ingredients", "steps"]};
        
        this.state.recipes = {};
        for (const mealName of uniqueMeals) {
            this.dom.progressDetails.textContent = `Обрабатывается: "${mealName}"...`;
            const prompt = `Создай детальный рецепт для блюда "${mealName}" для семьи из ${familySize} человек (${this.state.settings.family.length} порции). В каждом шаге укажи конкретное количество ингредиентов, используемых на этом шаге.`;
            const recipeData = await this.makeGeminiRequest(prompt, schema);
            this.state.recipes[recipeData.id] = recipeData;
        }
        this.dom.progressDetails.innerHTML += `<br>✅ Все ${uniqueMeals.length} рецептов сгенерированы.`;
    },

    async generateShoppingList() {
        await this.updateProgress(4, 5, "Формирование списка покупок…", "Собираем все ингредиенты...");
        if (Object.keys(this.state.recipes).length === 0) {
            this.dom.progressDetails.innerHTML += `<br>⚠️ Нет рецептов для создания списка покупок.`;
            this.state.shoppingList = [];
            return;
        }
        const allIngredients = Object.values(this.state.recipes).flatMap((r: any) => r.ingredients);
        const prompt = `Сгруппируй и суммируй этот список ингредиентов. Категории: "Мясо и птица", "Молочные и яйца", "Овощи и зелень", "Фрукты и орехи", "Бакалея", "Хлеб и выпечка", "Напитки", "Прочее". Для каждого ингредиента верни общее необходимое количество (totalNeeded). Затем предложи разумное количество для покупки в магазине (shoppingSuggestion), округляя в большую сторону до стандартной упаковки (например, для 750г муки предложи купить 1кг). Укажи примерную цену в рублях за предложенное количество для покупки. Ингредиенты: ${JSON.stringify(allIngredients)}`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, totalNeeded: { type: Type.OBJECT, properties: { qty: { type: Type.NUMBER }, unit: { type: Type.STRING }}}, shoppingSuggestion: { type: Type.OBJECT, properties: { qty: { type: Type.NUMBER }, unit: { type: Type.STRING }}}, price: { type: Type.NUMBER } }, required: ["name", "totalNeeded", "shoppingSuggestion", "price"] } } }, required: ["category", "items"] } };
        const shoppingListData = await this.makeGeminiRequest(prompt, schema);
        
        shoppingListData.forEach(category => {
            category.items.forEach(item => {
                item.purchases = []; // New property for partial purchases
            });
        });
        
        this.state.shoppingList = shoppingListData;
        const totalCost = shoppingListData.flatMap(c => c.items).reduce((sum, item) => sum + item.price, 0);
        this.dom.progressDetails.innerHTML += `<br>✅ Список из ${shoppingListData.flatMap(c => c.items).length} продуктов сгруппирован. Итого: ${totalCost} ₽`;
    },
    
    renderAll() {
        this.renderSettings();
        this.renderMenu();
        this.renderShoppingList();
        this.renderBudget();
    },

    renderMenu() {
        if (!this.state.menu || this.state.menu.length === 0) return;
        this.dom.dayScroller.innerHTML = '';
        const daysOrder = ["ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"];
        
        const validMenuData = this.state.menu.filter(day => day && day.day && day.meals);
        
        const sortedMenu = [...validMenuData].sort((a, b) => {
            return daysOrder.indexOf(a.day.toUpperCase()) - daysOrder.indexOf(b.day.toUpperCase());
        });
        
        sortedMenu.forEach((dayData) => {
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            const mealHtml = (icon, mealName, mealKey, dayName) => {
                const cleanName = (mealName || 'Не указано').replace(/\s*\(остатки\)/i, '');
                // Fix: Cast mealName to string to use .includes()
                const isLeftover = ((mealName as string) || '').includes('(остатки)');
                const hasContent = mealName && mealName.trim() !== '' && mealName.trim() !== 'Не указано';
                const hasRecipe = !isLeftover && hasContent;
                const isCooked = this.state.cookedMeals[dayName] && this.state.cookedMeals[dayName].includes(mealKey);
                
                return `
                <div class="meal ${hasRecipe ? 'clickable' : ''} ${isCooked ? 'cooked' : ''}" data-meal-name="${mealName || ''}" data-meal-key="${mealKey}" data-day-name="${dayName}">
                    <button class="cooked-toggle" data-day-name="${dayName}" data-meal-key="${mealKey}" aria-label="Отметить как приготовленное">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </button>
                    <span class="meal-icon">${icon}</span>
                    <span class="meal-name">${cleanName}</span>
                    ${isLeftover ? '<span class="leftover-icon">🔄</span>' : ''}
                    ${hasContent ? `<button class="regenerate-btn" title="Перегенерировать блюдо">🔄</button>` : ''}
                </div>`;
            };

            dayCard.innerHTML = `
                <div class="day-title-container">
                    <h3 class="day-title">${dayData.day}</h3>
                    <button class="regenerate-btn" data-day-name="${dayData.day}" title="Перегенерировать день">🔄</button>
                </div>
                ${mealHtml('☀️', dayData.meals.breakfast, 'breakfast', dayData.day)}
                ${mealHtml('🍎', dayData.meals.snack1, 'snack1', dayData.day)}
                ${mealHtml('🍲', dayData.meals.lunch, 'lunch', dayData.day)}
                ${mealHtml('🥛', dayData.meals.snack2, 'snack2', dayData.day)}
                ${mealHtml('🌙', dayData.meals.dinner, 'dinner', dayData.day)}
            `;
            
            dayCard.querySelectorAll('.meal.clickable').forEach(el => {
                el.addEventListener('click', (e) => {
                    // Fix: Cast e.target to HTMLElement to use .closest()
                    const target = e.target as HTMLElement;
                    if (target.closest('.regenerate-btn') || target.closest('.cooked-toggle')) return;
                    // Fix: Cast e.currentTarget to HTMLElement to access dataset
                    const mealName = (e.currentTarget as HTMLElement).dataset.mealName.replace(/\s*\(остатки\)/i, '').trim();
                    // Fix: Cast recipe to `any` to access properties like `name` and `id`.
                    const recipe: any = Object.values(this.state.recipes).find((r: any) => r.name === mealName);
                    if (recipe) {
                        this.checkIngredientsForRecipe(recipe.id);
                    } else if (mealName) {
                        this.showNotification(`Рецепт для "${mealName}" не найден.`, 'error');
                    }
                });
            });

            dayCard.querySelectorAll('.cooked-toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent opening recipe view
                    // Fix: Cast e.currentTarget to HTMLElement to access dataset
                    const { dayName, mealKey } = (e.currentTarget as HTMLElement).dataset;
                    this.toggleCookedStatus(dayName, mealKey);
                });
            });

            dayCard.querySelectorAll('.regenerate-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Fix: Cast e.currentTarget to HTMLElement to use dataset and closest
                    const el = e.currentTarget as HTMLElement;
                    const dayName = el.dataset.dayName || el.closest('.meal')?.dataset.dayName;
                    const mealKey = el.closest('.meal')?.dataset.mealKey;
                    if (mealKey) {
                        this.openRegenerateModal('meal', { dayName, mealKey });
                    } else {
                        this.openRegenerateModal('day', { dayName });
                    }
                });
            });
            this.dom.dayScroller.appendChild(dayCard);
        });
    },

    toggleCookedStatus(dayName, mealKey) {
        if (!this.state.cookedMeals[dayName]) {
            this.state.cookedMeals[dayName] = [];
        }
        const mealIndex = this.state.cookedMeals[dayName].indexOf(mealKey);
        if (mealIndex > -1) {
            this.state.cookedMeals[dayName].splice(mealIndex, 1);
        } else {
            this.state.cookedMeals[dayName].push(mealKey);
        }
        this.saveState();
        this.renderMenu(); // Re-render to update the view
    },

    renderShoppingList() {
        if (!this.state.shoppingList) return;
        this.dom.shoppingListContainer.innerHTML = '';
        
        this.state.shoppingList.forEach((category, catIndex) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-group';
            
            const itemsHtml = (category.items || [])
                .slice()
                .sort((a, b) => {
                    const aPurchased = a.purchases?.reduce((sum, p) => sum + p.qty, 0) || 0;
                    const bPurchased = b.purchases?.reduce((sum, p) => sum + p.qty, 0) || 0;
                    const aCompleted = aPurchased >= a.shoppingSuggestion.qty;
                    const bCompleted = bPurchased >= b.shoppingSuggestion.qty;
                    // Fix: Convert booleans to numbers for arithmetic operation
                    return Number(aCompleted) - Number(bCompleted);
                })
                .map((item, itemIndex) => {
                const totalPurchased = item.purchases.reduce((sum, p) => sum + p.qty, 0);
                const isCompleted = totalPurchased >= item.shoppingSuggestion.qty;
                const progressPercent = Math.min((totalPurchased / item.shoppingSuggestion.qty) * 100, 100);

                const radius = 10;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (progressPercent / 100) * circumference;

                return `
                <li class="shopping-item ${isCompleted ? 'completed' : ''}" data-cat-index="${catIndex}" data-item-name="${item.name}">
                    <div class="item-checkbox-progress">
                        <svg viewBox="0 0 24 24">
                          <circle class="bg" cx="12" cy="12" r="${radius}"></circle>
                          <circle class="progress" cx="12" cy="12" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                        </svg>
                        <span class="checkmark">✔</span>
                    </div>
                    <div class="item-details">
                        <span class="item-name">${item.name}</span>
                        <div class="item-quantity">Купить: ${item.shoppingSuggestion.qty.toLocaleString()} ${item.shoppingSuggestion.unit}</div>
                    </div>
                    <span class="item-price">${item.price} ₽</span>
                </li>
            `}).join('');
            
            categoryElement.innerHTML = `
                <button class="category-toggle">${category.category} ▼</button>
                <ul class="category-items">${itemsHtml}</ul>
            `;
            this.dom.shoppingListContainer.appendChild(categoryElement);
        });
        
        this.dom.shoppingListContainer.querySelectorAll('.shopping-item').forEach(itemEl => {
            itemEl.addEventListener('click', (e) => {
                const { catIndex, itemName } = (e.currentTarget as HTMLElement).dataset;
                const itemIndex = this.state.shoppingList[catIndex].items.findIndex(i => i.name === itemName);
                if (itemIndex > -1) {
                    this.openPurchaseModal(parseInt(catIndex), itemIndex);
                }
            });
        });
        
        this.dom.shoppingListContainer.querySelectorAll('.category-toggle').forEach(button => {
            button.addEventListener('click', e => {
                const list = (e.target as HTMLElement).nextElementSibling;
                list.classList.toggle('collapsed');
                (e.target as HTMLElement).innerHTML = list.classList.contains('collapsed') ? (e.target as HTMLElement).innerHTML.replace('▼', '▶') : (e.target as HTMLElement).innerHTML.replace('▶', '▼');
            });
        });

        this.updateShoppingProgress();
        const estimatedCost = this.state.shoppingList.flatMap(c => c.items).reduce((sum, item) => sum + (item.price || 0), 0);
        this.dom.shoppingListTotal.innerHTML = `<span>Примерная сумма:</span> ${estimatedCost.toLocaleString('ru-RU')} ₽`;
    },

    updateShoppingProgress() {
        if (!this.state.shoppingList) return;
        const allItems = this.state.shoppingList.flatMap(c => c.items || []);
        if (allItems.length === 0) return;
        const totalItems = allItems.length;
        const completedItems = allItems.filter(i => {
            const totalPurchased = i.purchases.reduce((sum, p) => sum + p.qty, 0);
            return totalPurchased >= i.shoppingSuggestion.qty;
        }).length;
        const percent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        this.dom.shoppingProgress.style.width = `${percent}%`;
        this.dom.shoppingProgressText.textContent = `${completedItems}/${totalItems} куплено`;
    },

    renderBudget() {
        const totalBudget = this.state.settings.totalBudget;
        const spentOnProducts = this.state.shoppingList
            .flatMap(c => c.items || [])
            .flatMap(item => item.purchases)
            .reduce((sum, purchase) => sum + purchase.price, 0);

        const remaining = totalBudget - spentOnProducts;
        const spentPercent = totalBudget > 0 ? (spentOnProducts / totalBudget) * 100 : 0;
        
        this.dom.budget.pieProducts.style.strokeDasharray = `${spentPercent} 100`;
        this.dom.budget.spentTotal.innerHTML = `${spentOnProducts.toLocaleString('ru-RU')} ₽ <span>потрачено</span>`;
        this.dom.budget.total.textContent = `${totalBudget.toLocaleString('ru-RU')} ₽`;
        this.dom.budget.remaining.textContent = `${remaining.toLocaleString('ru-RU')} ₽`;
        this.dom.budget.remaining.className = `amount ${remaining >= 0 ? 'ok' : 'warning'}`;
    },
    
    checkIngredientsForRecipe(recipeId) {
        // Fix: Cast recipe to `any` to access its properties.
        const recipe: any = this.state.recipes[recipeId];
        if (!recipe || !recipe.ingredients) {
            this.showRecipe(recipeId);
            return;
        }

        const flatShoppingList = this.state.shoppingList.flatMap(c => c.items);
        const missingIngredients = [];

        recipe.ingredients.forEach((ing: any) => {
            const shopItem = flatShoppingList.find(item => item.name.toLowerCase() === ing.name.toLowerCase());
            if (shopItem) {
                 const totalPurchased = shopItem.purchases.reduce((sum, p) => sum + p.qty, 0);
                 if (totalPurchased < shopItem.totalNeeded.qty) {
                     missingIngredients.push(shopItem);
                 }
            } else {
                missingIngredients.push({name: ing.name, shoppingSuggestion: {qty: 1, unit: 'шт'}});
            }
        });

        if (missingIngredients.length > 0) {
            this.showMissingIngredientsWarning(missingIngredients, recipeId);
        } else {
            this.showRecipe(recipeId);
        }
    },
    
    showRecipe(recipeId) {
        this.currentRecipe.id = recipeId;
        this.currentRecipe.step = 0;
        const recipe = this.state.recipes[recipeId];
        if (!recipe) {
            this.showNotification(`Не удалось найти рецепт с ID: ${recipeId}.`, 'error');
            return;
        }
        this.showScreen('recipe-screen');
        this.renderRecipeStep();
    },

    renderRecipeStep() {
        const { id, step } = this.currentRecipe;
        const recipe = this.state.recipes[id];
        if (!recipe || !recipe.steps || !recipe.steps[step]) {
            console.error('Invalid recipe or step:', id, step);
            this.showNotification('Ошибка при загрузке рецепта.', 'error');
            this.showScreen('main-screen');
            return;
        }

        const stepData = recipe.steps[step];

        this.dom.recipeTitle.textContent = recipe.name;
        this.dom.stepIndicator.textContent = `Шаг ${step + 1}/${recipe.steps.length}`;
        this.dom.stepDescription.textContent = stepData.description;

        (this.dom.stepImage as HTMLImageElement).style.opacity = '0.5';
        if (stepData.imageUrl) {
            (this.dom.stepImage as HTMLImageElement).src = stepData.imageUrl;
            (this.dom.stepImage as HTMLImageElement).alt = stepData.description;
            (this.dom.stepImage as HTMLImageElement).style.opacity = '1';
        } else {
            (this.dom.stepImage as HTMLImageElement).src = ''; 
            (this.dom.stepImage as HTMLImageElement).alt = 'Генерация изображения...';
            this.generateStepImage(id, step);
        }

        this.stopTimer();
        if (stepData.time && stepData.time > 0) {
            this.timer.initialTime = stepData.time * 60;
            this.resetTimer();
            this.dom.timerSection.classList.remove('hidden');
        } else {
            this.dom.timerSection.classList.add('hidden');
        }

        this.dom.stepIngredientsList.innerHTML = '';
        if (stepData.ingredients && stepData.ingredients.length > 0) {
            this.dom.stepIngredientsTitle.classList.remove('hidden');
            const flatShoppingList = this.state.shoppingList.flatMap(c => c.items);
            stepData.ingredients.forEach((ing: any) => {
                const li = document.createElement('li');
                const shopItem = flatShoppingList.find(item => item.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(item.name.toLowerCase()));
                let statusClass = 'unknown';
                let statusIcon = '❔';
                if (shopItem) {
                    const totalPurchased = shopItem.purchases.reduce((sum, p) => sum + p.qty, 0);
                    if (totalPurchased >= shopItem.totalNeeded.qty) {
                        statusClass = 'completed';
                        statusIcon = '✅';
                    } else {
                        statusClass = 'missing';
                        statusIcon = '⚠️';
                    }
                }
                li.innerHTML = `<span><span class="ingredient-status ${statusClass}">${statusIcon}</span> ${ing.name}</span> <span class="ingredient-quantity">${ing.quantity}</span>`;
                this.dom.stepIngredientsList.appendChild(li);
            });
        } else {
            this.dom.stepIngredientsTitle.classList.add('hidden');
        }

        (this.dom.prevStepBtn as HTMLButtonElement).disabled = step === 0;
        this.dom.nextStepBtn.textContent = (step === recipe.steps.length - 1) ? 'Завершить ✅' : 'Далее →';
    },

    async generateStepImage(recipeId, stepIndex) {
        if (!this.ai) return;
        try {
            const recipe = this.state.recipes[recipeId];
            const stepDescription = recipe.steps[stepIndex].description;
            const prompt = `Food photography, realistic, high-detail photo of a cooking step: "${stepDescription}"`;
            
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '4:3',
                },
            });

            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

            if (this.currentRecipe.id === recipeId && this.currentRecipe.step === stepIndex) {
                (this.dom.stepImage as HTMLImageElement).src = imageUrl;
                (this.dom.stepImage as HTMLImageElement).style.opacity = '1';
            }
            this.state.recipes[recipeId].steps[stepIndex].imageUrl = imageUrl;
            this.saveState();
        } catch (error) {
            console.error("Image generation failed:", error);
            if (this.currentRecipe.id === recipeId && this.currentRecipe.step === stepIndex) {
               (this.dom.stepImage as HTMLImageElement).alt = 'Не удалось загрузить изображение';
            }
        }
    },

    navigateRecipeStep(direction) {
        const { id, step } = this.currentRecipe;
        const recipe = this.state.recipes[id];
        
        if (direction > 0 && step === recipe.steps.length - 1) {
            this.finishCooking();
            return;
        }
        
        const newStep = step + direction;
        if (newStep >= 0 && newStep < recipe.steps.length) {
            this.currentRecipe.step = newStep;
            this.renderRecipeStep();
        }
    },

    finishCooking() {
        const { id } = this.currentRecipe;
        const recipe = this.state.recipes[id];

        let mealInfo = null;
        for (const day of this.state.menu) {
            for (const mealKey in day.meals) {
                const mealName = (day.meals[mealKey] || '').replace(/\s*\(остатки\)/i, '').trim();
                if (mealName === recipe.name) {
                    mealInfo = { dayName: day.day, mealKey: mealKey };
                    break;
                }
            }
            if (mealInfo) break;
        }

        if (mealInfo) {
            const { dayName, mealKey } = mealInfo;
            if (!this.state.cookedMeals[dayName]) {
                this.state.cookedMeals[dayName] = [];
            }
            if (!this.state.cookedMeals[dayName].includes(mealKey)) {
                this.state.cookedMeals[dayName].push(mealKey);
                this.saveState();
            }
        }
        
        this.showNotification(`"${recipe.name}" приготовлено!`, 'success');
        this.showScreen('main-screen');
    },

    startTimer() {
        if (this.timer.isRunning || this.timer.timeLeft <= 0) return;
        this.timer.isRunning = true;
        this.timer.interval = setInterval(() => {
            this.timer.timeLeft--;
            this.updateTimerDisplay();
            if (this.timer.timeLeft <= 0) {
                this.stopTimer(true); // finished
            }
        }, 1000);
    },

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
    },
    
    stopTimer(finished = false) {
        this.pauseTimer();
        if (finished) {
            this.dom.timerDisplay.textContent = "Готово!";
            this.showNotification("Таймер завершен!", "success");
            (this.dom.notificationSound as HTMLAudioElement).play().catch(e => console.log("Audio play failed", e));
        }
    },

    resetTimer() {
        this.stopTimer();
        this.timer.timeLeft = this.timer.initialTime;
        this.updateTimerDisplay();
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.timeLeft / 60);
        const seconds = this.timer.timeLeft % 60;
        this.dom.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    
    handleNav(e) {
        const button = (e.target as HTMLElement).closest('.nav-button');
        if (!button) return;
        
        this.dom.bottomNav.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const contentId = button.dataset.content;
        this.dom.mainHeaderTitle.textContent = button.dataset.title;
        this.dom.mainContents.forEach(content => {
            content.classList.toggle('active', content.id === contentId);
        });
        if (contentId === 'settings-content') this.renderSettings();
    },

    showNotification(message, type = 'success') {
        this.dom.notification.textContent = message;
        this.dom.notification.className = type; // success, loading, error
        this.dom.notification.classList.add('show');

        if (type !== 'loading') {
            setTimeout(() => {
                this.dom.notification.classList.remove('show');
            }, 3000);
        }
    },

    hideNotification() {
        this.dom.notification.classList.remove('show');
    },

    showModal(title, bodyHtml, buttons) {
        this.dom.modalTitle.textContent = title;
        this.dom.modalBody.innerHTML = bodyHtml;
        this.dom.modalButtons.innerHTML = '';
        buttons.forEach(btn => {
            const buttonEl = document.createElement('button');
            buttonEl.textContent = btn.text;
            buttonEl.className = `modal-button ${btn.class}`;
            buttonEl.addEventListener('click', () => {
                btn.action();
                if (btn.closes !== false) this.hideModal();
            });
            this.dom.modalButtons.appendChild(buttonEl);
        });
        this.dom.modalOverlay.classList.add('visible');
    },

    hideModal() {
        this.dom.modalOverlay.classList.remove('visible');
    },

    showApiKeyHelpModal() {
        const bodyHtml = `
            <style>
                .help-step { margin-bottom: 20px; }
                .help-step h5 { font-family: var(--font-nunito); font-weight: 700; color: var(--accent-color); margin: 0 0 8px 0; font-size: 18px; }
                .help-step p { margin: 0 0 10px 0; line-height: 1.5; font-size: 15px; }
                .help-step a { color: var(--accent-color); font-weight: 600; }
                .connection-check { background-color: var(--card-accent-bg); padding: 15px; border-radius: 12px; text-align: center; }
                #connection-status { font-weight: 600; margin-top: 10px; min-height: 20px; }
            </style>
            <div class="help-step">
                <h5>Шаг 1: Получение ключа</h5>
                <p>Для работы приложения нужен ваш персональный бесплатный ключ (API Key) от Google Gemini.</p>
                <p>1. Перейдите на сайт <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.</p>
                <p>2. Нажмите на кнопку <strong>"Create API key in new project"</strong>.</p>
                <p>3. Скопируйте сгенерированный ключ и вставьте его в поле на предыдущем экране.</p>
            </div>
            <div class="help-step">
                <h5>Шаг 2: Проверка доступа</h5>
                <p>Иногда сервисы Google могут быть недоступны в некоторых регионах. Давайте проверим ваш доступ.</p>
                <div class="connection-check">
                    <button class="secondary-button" id="check-connection-btn" style="height: 45px; font-size: 16px;">Проверить доступ</button>
                    <div id="connection-status"></div>
                </div>
            </div>
            <div class="help-step" id="troubleshooting-step" style="display: none;">
                <h5>Что делать, если доступа нет?</h5>
                <p>Если вы видите ошибку или сайт из Шага 1 не открывается, это значит, что сервисы Google AI ограничены в вашем регионе.</p>
                <p><strong>Решение:</strong> Для доступа к таким сервисам можно использовать VPN. VPN изменяет ваше виртуальное местоположение.</p>
                <p>1. Включите любой VPN-сервис и выберите страну, где Gemini доступен (например, США, Великобритания).</p>
                <p>2. Повторите <strong>Шаг 1</strong> и <strong>Шаг 2</strong> с включенным VPN.</p>
                <p>После получения ключа, VPN можно будет отключить для работы с приложением.</p>
            </div>
        `;

        this.showModal(
            'Как получить API ключ?',
            bodyHtml,
            [{ text: 'Понятно', class: 'primary', action: () => {} }]
        );

        document.getElementById('check-connection-btn').addEventListener('click', async (e) => {
            // Fix: Cast e.target to HTMLButtonElement to access `disabled` property.
            const btn = e.target as HTMLButtonElement;
            const statusDiv = document.getElementById('connection-status');
            const troubleshootingDiv = document.getElementById('troubleshooting-step');
            
            btn.disabled = true;
            statusDiv.textContent = 'Проверяем...';
            statusDiv.style.color = 'var(--soft-text)';

            try {
                await fetch('https://generativelanguage.googleapis.com/$rpc/google.ai.generativelanguage.v1beta.ModelService/ListModels', {
                    method: 'GET',
                    mode: 'cors'
                });
                statusDiv.textContent = '✅ Отлично! Доступ есть.';
                statusDiv.style.color = 'var(--success-color)';
                troubleshootingDiv.style.display = 'none';
            } catch (error) {
                console.error('Connection check failed:', error);
                statusDiv.textContent = '⚠️ Ошибка! Доступ, скорее всего, ограничен.';
                statusDiv.style.color = 'var(--danger-color)';
                troubleshootingDiv.style.display = 'block';
            } finally {
                btn.disabled = false;
            }
        });
    },

    openPurchaseModal(catIndex, itemIndex) {
        const item = this.state.shoppingList[catIndex].items[itemIndex];
        const totalPurchased = item.purchases.reduce((sum, p) => sum + p.qty, 0);
        const remainingQty = item.shoppingSuggestion.qty - totalPurchased;

        const bodyHtml = `
            <p>Нужно купить: ${item.shoppingSuggestion.qty} ${item.shoppingSuggestion.unit}. Осталось: ${remainingQty > 0 ? remainingQty.toLocaleString() : 0} ${item.shoppingSuggestion.unit}</p>
            <div class="modal-form-group">
                <label for="purchase-qty">Сколько купили (${item.shoppingSuggestion.unit})</label>
                <input type="number" id="purchase-qty" class="modal-input" value="${remainingQty > 0 ? remainingQty : ''}" placeholder="0">
            </div>
            <div class="modal-form-group">
                <label for="purchase-price">Цена за эту покупку (₽)</label>
                <input type="number" id="purchase-price" class="modal-input" placeholder="0">
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <h5 style="font-family: var(--font-nunito); font-weight: 700; color: var(--accent-color); margin-bottom: 10px;">История покупок</h5>
            <div id="past-purchases">
                ${item.purchases.length === 0 ? '<p style="color: var(--soft-text); font-size: 14px;">Покупок еще не было.</p>' :
                item.purchases.map((p, i) => `
                    <div class="past-purchase-item">
                        <span>${p.qty.toLocaleString()} ${item.shoppingSuggestion.unit} за ${p.price.toLocaleString()} ₽</span>
                        <button class="danger-button-small" data-purchase-index="${i}">Удалить</button>
                    </div>
                `).join('')
                }
            </div>
        `;

        const buttons = [
            { text: 'Отмена', class: 'secondary', action: () => {} },
            { text: 'Сохранить', class: 'primary', action: () => {
                // Fix: Cast elements to HTMLInputElement to access `value` property.
                const qty = parseFloat((document.getElementById('purchase-qty') as HTMLInputElement).value) || 0;
                const price = parseFloat((document.getElementById('purchase-price') as HTMLInputElement).value) || 0;
                if (qty > 0) {
                    item.purchases.push({ qty, price });
                    this.saveState();
                    this.renderShoppingList();
                    this.renderBudget();
                }
            }},
        ];
        this.showModal(`Покупка: ${item.name}`, bodyHtml, buttons);

        document.querySelectorAll('.past-purchase-item .danger-button-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Fix: Cast e.target to HTMLElement to access dataset.
                const purchaseIndex = parseInt((e.target as HTMLElement).dataset.purchaseIndex);
                item.purchases.splice(purchaseIndex, 1);
                this.saveState();
                this.hideModal();
                this.renderShoppingList();
                this.renderBudget();
                this.showNotification('Покупка удалена');
            });
        });
    },

    async shareMissingItems(missingItems) {
        const text = "Привет! Пожалуйста, купи для ужина:\n" + 
                     missingItems.map(item => `- ${item.name} (${item.shoppingSuggestion.qty} ${item.shoppingSuggestion.unit})`).join('\n');
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Список покупок',
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                this.showNotification("Список скопирован в буфер обмена!");
            }
        } catch (err) {
            console.error('Share/Copy failed:', err);
            this.showNotification("Не удалось поделиться/скопировать.", 'error');
        }
    },

    showMissingIngredientsWarning(missingItems, recipeId) {
        const bodyHtml = `
            <p>Для приготовления этого блюда вам не хватает следующих продуктов:</p>
            <ul>${missingItems.map(item => `<li>${item.name}</li>`).join('')}</ul>
            <p>Хотите все равно продолжить или попросить кого-то сходить в магазин?</p>
        `;
        const buttons = [
             { text: 'Все равно готовить', class: 'primary', action: () => this.showRecipe(recipeId) },
             { text: '🛒 Попросить купить', class: 'secondary', action: () => this.shareMissingItems(missingItems) },
             { text: 'Назад к меню', class: 'secondary', action: () => {} },
        ];
        this.showModal("Не хватает ингредиентов", bodyHtml, buttons);
    },

    // SETTINGS LOGIC
    renderSettings() {
        const s = this.state.settings;
        (this.dom.settings.duration as HTMLInputElement).value = s.menuDuration;
        (this.dom.settings.budget as HTMLInputElement).value = s.totalBudget;
        (this.dom.settings.preferences as HTMLTextAreaElement).value = s.preferences;
        (this.dom.settings.cuisine as HTMLSelectElement).value = s.cuisine;
        (this.dom.settings.difficulty as HTMLSelectElement).value = s.difficulty;
        (this.dom.settings.apiKeyInput as HTMLInputElement).value = s.apiKey || '';
        this.dom.settings.appVersionInfo.textContent = `Версия приложения: ${this.version}`;
        this.renderFamilyMembers();
    },
    saveSettings() {
        const s = this.state.settings;
        s.menuDuration = parseInt((this.dom.settings.duration as HTMLInputElement).value) || 7;
        s.totalBudget = parseInt((this.dom.settings.budget as HTMLInputElement).value) || 10000;
        s.preferences = (this.dom.settings.preferences as HTMLTextAreaElement).value;
        s.cuisine = (this.dom.settings.cuisine as HTMLSelectElement).value;
        s.difficulty = (this.dom.settings.difficulty as HTMLSelectElement).value;
        this.saveState();
        this.renderBudget(); 
        this.showNotification("Настройки сохранены. Чтобы они применились, перегенерируйте меню.");
    },
    async saveApiKey() {
        const newApiKey = (this.dom.settings.apiKeyInput as HTMLInputElement).value.trim();
        if (!newApiKey) {
            this.showNotification('API ключ не может быть пустым', 'error');
            return;
        }
        this.showNotification('Проверка ключа...', 'loading');
        try {
            const testAI = new GoogleGenAI({ apiKey: newApiKey });
            await testAI.models.generateContent({model:'gemini-2.5-flash', contents: 'test'});
            
            this.state.settings.apiKey = newApiKey;
            this.ai = testAI; 
            this.saveState();
            this.showNotification('API ключ успешно сохранен и проверен!');
        } catch (error) {
            console.error("API Key validation failed:", error);
            this.showNotification('Неверный API ключ. Проверьте его и попробуйте снова.', 'error');
        }
    },
    renderFamilyMembers(isWizard = false) {
        const container = isWizard ? this.dom.wizardFamilyContainer : this.dom.settings.familyContainer;
        container.innerHTML = '';
        if (this.state.settings.family.length === 0) {
            container.innerHTML = '<p style="font-size:14px; color: var(--soft-text);">Добавьте членов семьи для расчета рациона.</p>';
        }
        this.state.settings.family.forEach((person, index) => {
            const card = document.createElement('div');
            card.className = 'family-member-card';
            const genderText = person.gender === 'male' ? 'муж.' : 'жен.';
            const activityMap = { sedentary: 'сидячий', light: 'легкая', moderate: 'умеренная', high: 'высокая' };
            card.innerHTML = `
                <span>${person.age} лет, ${genderText}, ${activityMap[person.activity] || person.activity}</span>
                <button data-index="${index}" class="delete-member-btn">✖</button>
            `;
            container.appendChild(card);
        });
        container.querySelectorAll('.delete-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.settings.family.splice((e.target as HTMLElement).dataset.index, 1);
                this.saveState();
                this.renderFamilyMembers(isWizard);
                if (!isWizard) this.renderFamilyMembers(false);
            });
        });
    },
    openFamilyMemberModal(isWizard = false) {
        const bodyHtml = `
            <div class="modal-form-group">
                <label for="member-age">Возраст</label>
                <input type="number" id="member-age" class="modal-input" placeholder="30">
            </div>
            <div class="modal-form-group">
                <label for="member-gender">Пол</label>
                <select id="member-gender" class="settings-select" style="height: 45px;">
                    <option value="female">Женский</option>
                    <option value="male">Мужской</option>
                </select>
            </div>
            <div class="modal-form-group">
                <label for="member-activity">Уровень активности</label>
                <select id="member-activity" class="settings-select" style="height: 45px;">
                    <option value="sedentary">Сидячий</option>
                    <option value="light">Легкая</option>
                    <option value="moderate">Умеренная</option>
                    <option value="high">Высокая</option>
                </select>
            </div>
        `;
        const buttons = [
            { text: 'Отмена', class: 'secondary', action: () => {} },
            { text: 'Добавить', class: 'primary', action: () => {
                const newMember = {
                    // Fix: Cast elements to access `value` property.
                    age: parseInt((document.getElementById('member-age') as HTMLInputElement).value) || 30,
                    gender: (document.getElementById('member-gender') as HTMLSelectElement).value,
                    activity: (document.getElementById('member-activity') as HTMLSelectElement).value,
                };
                this.state.settings.family.push(newMember);
                this.saveState();
                this.renderFamilyMembers(isWizard);
                if (!isWizard) this.renderFamilyMembers(false);
            }},
        ];
        this.showModal("Новый член семьи", bodyHtml, buttons);
    },
    confirmRegenerateAll() {
        this.showModal(
            "Подтверждение",
            "<p>Вы уверены, что хотите полностью перегенерировать меню? Все текущие данные будут удалены, но ИИ постарается использовать уже купленные продукты.</p>",
            [
                { text: 'Отмена', class: 'secondary', action: () => {} },
                { text: 'Да, перегенерировать', class: 'primary', action: () => {
                    const purchasedItems = this.state.shoppingList
                        .flatMap(c => c.items || [])
                        .filter(item => (item.purchases || []).length > 0)
                        .map(item => `${item.name} (${item.purchases.reduce((sum, p) => sum + p.qty, 0)} ${item.shoppingSuggestion.unit})`)
                        .join(', ');

                    this.state.menu = [];
                    this.state.recipes = {};
                    this.state.shoppingList = [];
                    this.startGenerationProcess(true, purchasedItems);
                }}
            ]
        );
    },
    showChangelogModal() {
        const versions = Object.keys(this.changelog).sort((a,b) => b.localeCompare(a, undefined, {numeric: true}));
        const bodyHtml = versions.map(version => `
            <h4>Версия ${version}</h4>
            <ul>
                ${this.changelog[version].map(change => `<li>${change}</li>`).join('')}
            </ul>
        `).join('');
        this.showModal('История изменений', bodyHtml, [{text: 'Закрыть', class: 'primary', action: () => {}}]);
    },
    
    // REGENERATION
    openRegenerateModal(type, data) {
        const title = type === 'meal' ? "Перегенерировать блюдо" : "Перегенерировать день";
        const bodyHtml = `
            <p>Вы можете указать дополнительные пожелания для этого обновления.</p>
            <div class="modal-form-group">
                <label for="regen-prompt">Пожелания (необязательно)</label>
                <textarea id="regen-prompt" class="modal-textarea" rows="2" placeholder="Например: что-то более легкое"></textarea>
            </div>
        `;
        const buttons = [
            { text: 'Отмена', class: 'secondary', action: () => {} },
            { text: 'Перегенерировать', class: 'primary', closes: false, action: () => this.handleRegeneration(type, data) }
        ];
        this.showModal(title, bodyHtml, buttons);
    },

    async handleRegeneration(type, data) {
        this.hideModal();
        this.showNotification("Обновляем меню...", 'loading');
        
        try {
            const { family, preferences, cuisine, difficulty } = this.state.settings;
            const familyDescription = family.map(p => `${p.gender === 'male' ? 'Мужчина' : 'Женщина'}, ${p.age} лет, активность: ${p.activity}`).join('; ');
            // Fix: Cast element to HTMLTextAreaElement to access `value` property.
            const customPrompt = (document.getElementById('regen-prompt') as HTMLTextAreaElement)?.value || '';

            if (type === 'meal') {
                const { dayName, mealKey } = data;
                const originalDayIndex = this.state.menu.findIndex(d => d && d.day === dayName);
                if (originalDayIndex === -1) throw new Error("Day not found");

                const oldMealName = this.state.menu[originalDayIndex].meals[mealKey];
                const prompt = `Замени одно блюдо: ${mealKey} в ${dayName}. Старое блюдо: "${oldMealName}". Сгенерируй новое, учитывая общие предпочтения: "${preferences}" и пожелание: "${customPrompt}". Рассчитай на семью: ${familyDescription}. Верни только название нового блюда.`;
                const schema = {type: Type.OBJECT, properties: { newMealName: {type: Type.STRING}}};
                const result = await this.makeGeminiRequest(prompt, schema);
                
                this.state.menu[originalDayIndex].meals[mealKey] = result.newMealName;

            } else if (type === 'day') {
                const { dayName } = data;
                const originalDayIndex = this.state.menu.findIndex(d => d && d.day === dayName);
                if (originalDayIndex === -1) throw new Error("Day not found");
                
                const dayToRegen = this.state.menu[originalDayIndex];
                const prompt = `Сгенерируй новое меню на один день, ${dayName}, для семьи: ${familyDescription}.
                Текущее меню на этот день: Завтрак - ${dayToRegen.meals.breakfast}, Обед - ${dayToRegen.meals.lunch}, Ужин - ${dayToRegen.meals.dinner}.
                Общие предпочтения: ${preferences}, Кухня: ${cuisine}, Сложность: ${difficulty}.
                Особое пожелание для этого дня: "${customPrompt}".
                Верни JSON объект с полями breakfast, snack1, lunch, snack2, dinner для этого дня.`;
                
                const schema = {type: Type.OBJECT, properties: {breakfast: {type: Type.STRING}, snack1: {type: Type.STRING}, lunch: {type: Type.STRING}, snack2: {type: Type.STRING}, dinner: {type: Type.STRING}}, required: ["breakfast", "snack1", "lunch", "snack2", "dinner"]};
                const newMeals = await this.makeGeminiRequest(prompt, schema);
                this.state.menu[originalDayIndex].meals = newMeals;
            }
            
            await this.generateRecipes();
            await this.generateShoppingList();

            this.saveState();
            this.renderAll();
            this.showNotification("Меню успешно обновлено!");

        } catch(e) {
            this.showNotification("Ошибка при обновлении.", 'error');
            console.error(e);
        }
    },


    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `family_menu_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        this.showNotification("Данные экспортированы!");
    },
    importData(event) {
        const file = (event.target as HTMLInputElement).files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Fix: Cast e.target.result to string for JSON.parse.
                const importedState = JSON.parse(e.target.result as string);
                if (importedState.settings && importedState.menu && importedState.recipes) {
                    this.state = importedState;
                    this.saveState();
                    this.showNotification("Данные успешно импортированы!");
                    this.showScreen('main-screen');
                    this.renderAll();
                } else {
                    throw new Error("Invalid file format");
                }
            } catch (error) {
                this.showNotification("Ошибка импорта: неверный формат файла.", 'error');
            }
        };
        reader.readAsText(file);
        (event.target as HTMLInputElement).value = '';
    },
    
    // PWA Service Worker
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

    // QR Code Sync (Placeholder)
    showQrScanner() {
        const bodyHtml = `
            <div id="qr-scanner-container">
                <video id="qr-video" playsinline></video>
                <div id="qr-result"></div>
            </div>
        `;
        const buttons = [{ text: 'Закрыть', class: 'secondary', action: () => this.stopQrScanner() }];
        this.showModal("Сканировать QR-код", bodyHtml, buttons);
        this.startQrScanner();
    },

    startQrScanner() {
        // Fix: Cast element to HTMLVideoElement to access video properties and methods.
        const video = document.getElementById('qr-video') as HTMLVideoElement;
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                video.srcObject = stream;
                // Fix: Set playsInline property directly.
                video.playsInline = true; // required to tell iOS safari we don't want fullscreen
                video.play();
                requestAnimationFrame(tick);
            });

        const tick = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const canvasElement = document.createElement('canvas');
                const canvas = canvasElement.getContext('2d');
                canvasElement.height = video.videoHeight;
                canvasElement.width = video.videoWidth;
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    this.showNotification(`QR-код отсканирован: ${code.data}`, 'success');
                    // TODO: Implement logic with the scanned data
                    this.stopQrScanner();
                    this.hideModal();
                    return;
                }
            }
            if (this.dom.modalOverlay.classList.contains('visible')) {
                requestAnimationFrame(tick);
            }
        }
    },
    
    stopQrScanner() {
        // Fix: Cast element to HTMLVideoElement to access video properties.
        const video = document.getElementById('qr-video') as HTMLVideoElement;
        if (video && video.srcObject) {
            (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    },
    
    // Admin Panel
    handleAdminClick() {
        clearTimeout(this.admin.clickTimer);
        this.admin.clickCount++;
        if (this.admin.clickCount >= 5) {
            this.showAdminPanel();
            this.admin.clickCount = 0;
        }
        this.admin.clickTimer = setTimeout(() => {
            this.admin.clickCount = 0;
        }, 500);
    },

    showAdminPanel() {
        this.showNotification('Панель администратора разблокирована!', 'success');
        const bodyHtml = `
            <p><strong>Осторожно!</strong> Эти действия могут привести к потере данных.</p>
            <div class="modal-form-group">
                <label for="admin-bin-id">Bin ID (JSONBin.io)</label>
                <input type="text" id="admin-bin-id" class="modal-input" placeholder="Bin ID">
            </div>
        `;
        const buttons = [
            { text: 'Отмена', class: 'secondary', action: () => {} },
            { text: 'Удалить Bin', class: 'danger', action: () => {
                // Fix: Cast element to HTMLInputElement to access value.
                const binId = (document.getElementById('admin-bin-id') as HTMLInputElement).value;
                this.showNotification(`(Симуляция) Удаление Bin ID: ${binId}`, 'error');
            }},
            { text: 'Загрузить из Bin', class: 'primary', action: () => {
                // Fix: Cast element to HTMLInputElement to access value.
                const binId = (document.getElementById('admin-bin-id') as HTMLInputElement).value;
                this.showNotification(`(Симуляция) Загрузка из Bin ID: ${binId}`, 'loading');
            }},
        ];
        this.showModal('Панель администратора', bodyHtml, buttons);
    },

    toggleDevConsole() {
        this.dom.devConsole.classList.toggle('visible');
    },
    logToConsole(message) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.dom.logOutput.appendChild(p);
        this.dom.logOutput.scrollTop = this.dom.logOutput.scrollHeight;
    },
    executeCommand(commandStr) {
        this.logToConsole(`> ${commandStr}`);
        try {
            switch(commandStr.toLowerCase()) {
                case 'clear':
                    this.dom.logOutput.innerHTML = '';
                    break;
                case 'state':
                    console.log(this.state);
                    this.logToConsole('State logged to browser console.');
                    break;
                case 'reset':
                    this.resetState();
                    break;
                default:
                    this.logToConsole('Unknown command. Available: clear, state, reset');
            }
        } catch (e) {
            this.logToConsole(`Error: ${e.message}`);
        }
        (this.dom.commandInput as HTMLInputElement).value = '';
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());