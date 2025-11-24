// ============================================
// GERENCIADOR DE SINCRONIZAÇÃO OFFLINE-FIRST
// ============================================

// APPS_SCRIPT_URL e USER_DATA_KEY estão declarados em script.js

// Chaves de armazenamento
const SYNC_QUEUE_KEY = 'territorio_sync_queue';
const LAST_SYNC_KEY = 'territorio_last_sync';

// ============================================
// CLASSE DE SINCRONIZAÇÃO
// ============================================
class SyncManager {
    constructor() {
        this.queue = this.carregarFila();
        this.sincronizando = false;
        this.tentativasMaximas = 3;
        this.iniciarMonitoramento();
    }

    carregarFila() {
        const data = localStorage.getItem(SYNC_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    }

    salvarFila() {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
        this.atualizarIndicadorPendencias();
    }

    adicionar(acao, dados) {
        const item = {
            id: Date.now() + Math.random(),
            acao: acao,
            dados: dados,
            timestamp: new Date().toISOString(),
            tentativas: 0,
            status: 'pendente'
        };

        this.queue.push(item);
        this.salvarFila();
        
        console.log('📥 Adicionado à fila:', item);
        
        this.sincronizar();
        
        return item.id;
    }

    async sincronizar() {
        if (this.sincronizando) {
            console.log('⏳ Sincronização já em andamento...');
            return;
        }

        if (this.queue.length === 0) {
            this.atualizarStatus('synced', 'Tudo sincronizado');
            return;
        }

        if (!navigator.onLine) {
            this.atualizarStatus('offline', 'Sem conexão');
            return;
        }

        this.sincronizando = true;
        this.atualizarStatus('syncing', 'Sincronizando...');

        const itensParaSincronizar = this.queue.filter(item => 
            item.status === 'pendente' && item.tentativas < this.tentativasMaximas
        );

        console.log(`🔄 Sincronizando ${itensParaSincronizar.length} item(ns)...`);

        for (const item of itensParaSincronizar) {
            try {
                await this.enviarItem(item);
                this.removerDaFila(item.id);
                console.log('✅ Item sincronizado:', item.id);
            } catch (erro) {
                item.tentativas++;
                item.ultimoErro = erro.message;
                
                if (item.tentativas >= this.tentativasMaximas) {
                    item.status = 'falhou';
                    console.error('❌ Falha após múltiplas tentativas:', item.id);
                } else {
                    console.warn(`⚠️ Tentativa ${item.tentativas} falhou`);
                }
            }
        }

        this.salvarFila();
        this.sincronizando = false;

        if (this.queue.length === 0) {
            this.atualizarStatus('synced', 'Tudo sincronizado');
        } else {
            const pendentes = this.queue.filter(i => i.status === 'pendente').length;
            if (pendentes > 0) {
                this.atualizarStatus('pending', `${pendentes} pendente(s)`);
            } else {
                this.atualizarStatus('error', 'Erro na sincronização');
            }
        }
    }

    async enviarItem(item) {
        const url = `${APPS_SCRIPT_URL}?action=${item.acao}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.dados),
            mode: 'no-cors'
        });

        console.log('📤 Item enviado ao servidor');
        
        return true;
    }

    removerDaFila(id) {
        this.queue = this.queue.filter(item => item.id !== id);
        this.salvarFila();
    }

    atualizarStatus(tipo, texto) {
        const statusEl = document.getElementById('sync-status');
        const textEl = document.getElementById('sync-text');
        
        if (!statusEl || !textEl) return;

        const configs = {
            'synced': { cor: '#4caf50', icon: '●', texto: texto },
            'syncing': { cor: '#2196f3', icon: '●', texto: texto },
            'pending': { cor: '#ff9800', icon: '●', texto: texto },
            'offline': { cor: '#9e9e9e', icon: '●', texto: texto },
            'error': { cor: '#f44336', icon: '●', texto: texto }
        };

        const config = configs[tipo] || configs['offline'];
        
        statusEl.style.color = config.cor;
        statusEl.textContent = config.icon;
        textEl.textContent = config.texto;
        textEl.style.color = config.cor;
    }

    atualizarIndicadorPendencias() {
        const alertEl = document.getElementById('alert-pendencias');
        const numEl = document.getElementById('num-pendencias');
        
        if (!alertEl || !numEl) return;

        const pendentes = this.queue.filter(i => i.status === 'pendente').length;
        
        if (pendentes > 0) {
            numEl.textContent = pendentes;
            alertEl.classList.remove('hidden');
        } else {
            alertEl.classList.add('hidden');
        }
    }

    iniciarMonitoramento() {
        setInterval(() => {
            if (navigator.onLine && this.queue.length > 0) {
                this.sincronizar();
            }
        }, 30000);

        window.addEventListener('online', () => {
            console.log('🌐 Conexão restabelecida');
            this.atualizarStatus('syncing', 'Reconectando...');
            setTimeout(() => this.sincronizar(), 1000);
        });

        window.addEventListener('offline', () => {
            console.log('📡 Sem conexão');
            this.atualizarStatus('offline', 'Modo offline');
        });
    }

    getStats() {
        return {
            total: this.queue.length,
            pendentes: this.queue.filter(i => i.status === 'pendente').length,
            falhas: this.queue.filter(i => i.status === 'falhou').length,
            online: navigator.onLine
        };
    }
}

// ============================================
// FUNÇÕES DE API
// ============================================

async function fazerLoginAPI(codigo) {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=login&codigo=${codigo}`, {
            method: 'GET',
            redirect: 'follow'
        });

        const data = await response.json();
        
        if (data.sucesso) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.dados));
            return data.dados;
        } else {
            throw new Error(data.mensagem || 'Código não encontrado');
        }
    } catch (erro) {
        console.error('Erro no login:', erro);
        throw erro;
    }
}

async function carregarTerritorioAPI(territorioId) {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=carregar&territorio=${territorioId}`, {
            method: 'GET',
            redirect: 'follow'
        });

        const data = await response.json();
        
        console.log('📥 Resposta do servidor:', data);
        
        if (data.sucesso) {
            return data.dados;
        } else {
            throw new Error(data.mensagem || 'Erro ao carregar território');
        }
    } catch (erro) {
        console.error('Erro ao carregar território:', erro);
        throw erro;
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
const syncManager = new SyncManager();

console.log('🚀 Sistema de sincronização iniciado');
console.log('📊 Stats:', syncManager.getStats());
