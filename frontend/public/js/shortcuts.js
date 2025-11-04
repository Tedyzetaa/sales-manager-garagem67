class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            if (e.ctrlKey || e.metaKey) {
                this.handleShortcut(e);
            }

            if (e.key.startsWith('F') && !e.altKey && !e.ctrlKey) {
                this.handleFunctionKey(e);
            }
        });

        console.log('⌨️ Atalhos de teclado ativados');
    }

    handleShortcut(event) {
        switch (event.key.toLowerCase()) {
            case 'n':
                event.preventDefault();
                app.showNewSaleModal();
                break;
            case 'p':
                event.preventDefault();
                app.showProductModal();
                break;
            case 's':
                event.preventDefault();
                this.focusSearch();
                break;
            case 'e':
                event.preventDefault();
                app.generateReport();
                break;
            case '1':
                event.preventDefault();
                app.showPage('dashboard');
                break;
            case '2':
                event.preventDefault();
                app.showPage('sales');
                break;
            case '3':
                event.preventDefault();
                app.showPage('products');
                break;
            case '4':
                event.preventDefault();
                app.showPage('inventory');
                break;
            case '5':
                event.preventDefault();
                app.showPage('customers');
                break;
            case '6':
                event.preventDefault();
                app.showPage('reports');
                break;
            case 'r':
                event.preventDefault();
                app.refreshDashboard();
                break;
        }
    }

    handleFunctionKey(event) {
        switch (event.key) {
            case 'F1':
                event.preventDefault();
                this.showHelp();
                break;
            case 'F5':
                event.preventDefault();
                app.refreshDashboard();
                break;
            case 'F9':
                event.preventDefault();
                app.syncCustomers();
                break;
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    showHelp() {
        const helpContent = `
            <div class="shortcut-help">
                <h3>🎯 Atalhos do Teclado</h3>
                <div class="shortcut-category">
                    <h4>📊 Navegação</h4>
                    <div class="shortcut-item"><kbd>Ctrl + 1</kbd> Dashboard</div>
                    <div class="shortcut-item"><kbd>Ctrl + 2</kbd> Vendas</div>
                    <div class="shortcut-item"><kbd>Ctrl + 3</kbd> Produtos</div>
                    <div class="shortcut-item"><kbd>Ctrl + 4</kbd> Estoque</div>
                    <div class="shortcut-item"><kbd>Ctrl + 5</kbd> Clientes</div>
                    <div class="shortcut-item"><kbd>Ctrl + 6</kbd> Relatórios</div>
                </div>
                <div class="shortcut-category">
                    <h4>⚡ Ações Rápidas</h4>
                    <div class="shortcut-item"><kbd>Ctrl + N</kbd> Nova Venda</div>
                    <div class="shortcut-item"><kbd>Ctrl + P</kbd> Novo Produto</div>
                    <div class="shortcut-item"><kbd>Ctrl + S</kbd> Pesquisar</div>
                    <div class="shortcut-item"><kbd>Ctrl + E</kbd> Exportar</div>
                    <div class="shortcut-item"><kbd>Ctrl + R</kbd> Atualizar</div>
                </div>
            </div>
        `;

        const existingHelp = document.getElementById('shortcut-help-modal');
        if (existingHelp) {
            existingHelp.remove();
        }

        const helpModal = document.createElement('div');
        helpModal.id = 'shortcut-help-modal';
        helpModal.className = 'modal-overlay';
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Atalhos do Teclado</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${helpContent}
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                helpModal.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

window.keyboardShortcuts = new KeyboardShortcuts();