/**
 * Budget.js
 * Manages Budget Planner Logic
 */

window.Budget = {
    chart: null,

    init() {
        console.log("Budget: Init started");
        this.cacheDOM();
        this.bindEvents();
        console.log("Budget: Init completed");
    },

    cacheDOM() {
        console.log("Budget: Caching DOM");
        this.dom = {
            view: document.getElementById('view-budget'),
            balanceDisplay: document.getElementById('budget-balance'),
            incomeDisplay: document.getElementById('budget-income'),
            expenseDisplay: document.getElementById('budget-expense'),
            transactionList: document.getElementById('transaction-list'),
            addBtn: document.getElementById('add-transaction-btn'),

            // New Controls
            exportBtn: document.getElementById('export-csv-btn'),
            categoryFilter: document.getElementById('budget-category-filter'),
            setBudgetBtn: document.getElementById('set-budget-btn'),

            // Budget Goal UI
            budgetGoalText: document.getElementById('budget-goal-text'),
            budgetProgressBar: document.getElementById('budget-progress-bar'),
            budgetSpentText: document.getElementById('budget-spent-text'),
            budgetRemainingText: document.getElementById('budget-remaining-text'),

            // Chart
            chartCanvas: document.getElementById('expenseChart'),

            // Transaction Modal
            modal: document.getElementById('transaction-modal'),
            closeModalBtn: document.getElementById('close-transaction-modal'),
            form: document.getElementById('transaction-form'),
            amountInput: document.getElementById('trans-amount'),
            descInput: document.getElementById('trans-desc'),
            typeInput: document.getElementById('trans-type'),
            categoryInput: document.getElementById('trans-category'),
            dateInput: document.getElementById('trans-date'),

            // Budget Limit Modal
            budgetModal: document.getElementById('budget-modal'),
            closeBudgetModalBtn: document.getElementById('close-budget-modal'),
            budgetForm: document.getElementById('budget-form'),
            budgetLimitInput: document.getElementById('budget-limit-input')
        };
    },

    bindEvents() {
        console.log("Budget: Binding Events");
        // --- Transaction Modal ---
        if (this.dom.addBtn) {
            console.log("Budget: Binding Add Button");
            this.dom.addBtn.addEventListener('click', () => this.openModal());
        } else {
            console.error("Budget: Add Button NOT found");
        }

        if (this.dom.closeModalBtn) this.dom.closeModalBtn.addEventListener('click', () => this.closeModal());
        if (this.dom.modal) {
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) this.closeModal();
            });
        }
        if (this.dom.form) {
            this.dom.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            });
        }

        // --- Budget Limit Modal ---
        if (this.dom.setBudgetBtn) this.dom.setBudgetBtn.addEventListener('click', () => this.openBudgetModal());
        if (this.dom.closeBudgetModalBtn) this.dom.closeBudgetModalBtn.addEventListener('click', () => this.closeBudgetModal());
        if (this.dom.budgetModal) {
            this.dom.budgetModal.addEventListener('click', (e) => {
                if (e.target === this.dom.budgetModal) this.closeBudgetModal();
            });
        }
        if (this.dom.budgetForm) {
            this.dom.budgetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const limit = parseFloat(this.dom.budgetLimitInput.value);
                if (limit > 0) {
                    await Store.saveBudgetLimit(limit);
                    this.closeBudgetModal();
                    this.render(); // Re-render progress
                }
            });
        }

        // --- Filters & Export ---
        if (this.dom.categoryFilter) {
            this.dom.categoryFilter.addEventListener('change', () => {
                this.render();
            });
        }
        if (this.dom.exportBtn) {
            this.dom.exportBtn.addEventListener('click', () => {
                this.exportCSV();
            });
        }
    },

    async handleSubmit() {
        const amount = parseFloat(this.dom.amountInput.value);
        const desc = this.dom.descInput.value.trim();
        const type = this.dom.typeInput.value;
        const category = this.dom.categoryInput.value;
        const date = this.dom.dateInput.value || new Date().toISOString().split('T')[0];

        if (!amount || !desc) {
            alert("Please enter amount and description");
            return;
        }

        const transaction = {
            amount,
            description: desc,
            type,
            category,
            date,
            createdAt: new Date().toISOString()
        };

        if (window.Store) {
            await Store.addTransaction(transaction);
            this.closeModal();
            this.render();
        }
    },

    openModal() {
        console.log("Budget: Opening Modal");
        if (this.dom.modal) {
            this.dom.modal.classList.remove('hidden');
            if (this.dom.dateInput) this.dom.dateInput.value = new Date().toISOString().split('T')[0];
        }
    },

    closeModal() {
        if (this.dom.modal) {
            this.dom.modal.classList.add('hidden');
            if (this.dom.form) this.dom.form.reset();
        }
    },

    openBudgetModal() {
        if (this.dom.budgetModal) {
            this.dom.budgetModal.classList.remove('hidden');
            const currentLimit = Store.getBudgetLimit();
            if (this.dom.budgetLimitInput && currentLimit) this.dom.budgetLimitInput.value = currentLimit;
        }
    },

    closeBudgetModal() {
        if (this.dom.budgetModal) this.dom.budgetModal.classList.add('hidden');
    },

    render() {
        if (!window.Store) return;

        const allTransactions = Store.getTransactions();
        const filterCat = this.dom.categoryFilter ? this.dom.categoryFilter.value : 'all';

        // Filter for List & Totals
        const filteredTransactions = filterCat === 'all'
            ? allTransactions
            : allTransactions.filter(t => t.category === filterCat);

        // Sort desc
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate Overview
        let totalIncome = 0;
        let totalExpense = 0;
        // Use ALL transactions for global balance to be accurate? 
        // Or filtered? Usually context depends. Let's use filtered for "Analysis" mode implies drilled down totals.
        // BUT Balance should typically be "Total Wallet". 
        // Let's keep Balance as GLOBAL, but Income/Expense as FILTERED.

        let globalIncome = 0;
        let globalExpense = 0;
        allTransactions.forEach(t => {
            if (t.type === 'income') globalIncome += t.amount;
            else globalExpense += t.amount;
        });

        filteredTransactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
        });

        const globalBalance = globalIncome - globalExpense;

        // Update Summary
        if (this.dom.balanceDisplay) this.dom.balanceDisplay.textContent = this.formatMoney(globalBalance);
        if (this.dom.incomeDisplay) this.dom.incomeDisplay.textContent = this.formatMoney(totalIncome);
        if (this.dom.expenseDisplay) this.dom.expenseDisplay.textContent = this.formatMoney(totalExpense);

        // Render List
        this.renderList(filteredTransactions);

        // Render Chart (All Time or Filtered? Usually monthly is best for charts, but let's stick to filtered set)
        this.renderChart(filteredTransactions);

        // Render Budget Goal (Current Month Only)
        this.renderBudgetProgress(allTransactions);
    },

    renderList(transactions) {
        if (!this.dom.transactionList) return;

        if (transactions.length === 0) {
            this.dom.transactionList.innerHTML = `
                <div class="empty-state">
                    <p>No transactions found.</p>
                </div>`;
            return;
        }

        this.dom.transactionList.innerHTML = transactions.map(t => {
            const isIncome = t.type === 'income';
            const sign = isIncome ? '+' : '-';
            const color = isIncome ? 'var(--success)' : 'var(--danger)';

            return `
            <div class="habit-item" style="justify-content: space-between;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600;">${t.description}</span>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${t.date} • ${t.category}</span>
                </div>
                <div style="font-weight: 700; color: ${color};">
                    ${sign} ${this.formatMoney(t.amount)}
                    <button class="btn-icon" onclick="Budget.deleteTransaction('${t.id}')" style="margin-left: 0.5rem; color: var(--text-secondary);">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    },

    renderBudgetProgress(allTransactions) {
        // Calculate Expenses for Current Month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthExpenses = allTransactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const limit = Store.getBudgetLimit();

        if (this.dom.budgetGoalText) this.dom.budgetGoalText.textContent = limit > 0 ? this.formatMoney(limit) : "Not Set";
        if (this.dom.budgetSpentText) this.dom.budgetSpentText.textContent = `Spent: ${this.formatMoney(monthExpenses)}`;

        if (this.dom.budgetProgressBar) {
            if (limit > 0) {
                const percentage = Math.min((monthExpenses / limit) * 100, 100);
                this.dom.budgetProgressBar.style.width = `${percentage}%`;

                // Color Logic
                if (percentage < 75) this.dom.budgetProgressBar.style.background = 'var(--success)'; // Green
                else if (percentage < 90) this.dom.budgetProgressBar.style.background = '#facc15'; // Yellow
                else this.dom.budgetProgressBar.style.background = 'var(--danger)'; // Red

                const remaining = Math.max(limit - monthExpenses, 0);
                if (this.dom.budgetRemainingText) this.dom.budgetRemainingText.textContent = `Remaining: ${this.formatMoney(remaining)}`;
            } else {
                this.dom.budgetProgressBar.style.width = '0%';
                if (this.dom.budgetRemainingText) this.dom.budgetRemainingText.textContent = 'Set a limit to track progress';
            }
        }
    },

    renderChart(transactions) {
        if (!this.dom.chartCanvas) return;

        // Group by Category (Expenses Only)
        const categories = {};
        transactions.forEach(t => {
            if (t.type === 'expense') {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            }
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        // Destroy old chart
        if (this.chart) {
            this.chart.destroy();
        }

        if (labels.length === 0) {
            // Don't render empty chart or clear canvas?
            return;
        }

        const ctx = this.dom.chartCanvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6',
                        '#10b981', '#f59e0b', '#3b82f6', '#64748b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#64748b',
                            font: { family: "'Outfit', sans-serif" },
                            boxWidth: 12
                        }
                    }
                }
            }
        });
    },

    exportCSV() {
        const transactions = Store.getTransactions();
        if (!transactions || transactions.length === 0) {
            alert("No data to export");
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Description,Category,Type,Amount\n";

        transactions.forEach(t => {
            const row = `${t.date},"${t.description}",${t.category},${t.type},${t.amount}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `budget_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async deleteTransaction(id) {
        if (confirm("Delete this transaction?")) {
            await Store.deleteTransaction(id);
            this.render();
        }
    },

    formatMoney(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }
};
