// ====================================
// GERADOR DE PDF - VERSÃO FINAL BONITA
// ====================================

// Cores do sistema
const PDF_COLORS = {
    roxo: [107, 76, 154],
    azul: [74, 144, 226],
    amarelo: [247, 181, 0],
    verde: [122, 184, 66],
    azulClaro: [232, 240, 245],
    roxoClaro: [240, 237, 255],
    tesouros: [30, 90, 125],
    ministerio: [212, 160, 35],
    vida: [139, 21, 56]
};

function getBrotherName(brotherId) {
    if (!brotherId) return '';
    const brother = APP_DATA.brothers.find(b => b.id == brotherId);
    return brother ? brother.name : '';
}

// ====================================
// QUINTA - REUNIÃO DO MEIO DE SEMANA
// ====================================

async function gerarPDFQuinta() {
    const weekId = document.getElementById('quintaWeekSelect').value;
    const weeks = generateWeeks();
    const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (currentWeekIndex === -1) {
        alert('Selecione uma semana válida');
        return;
    }
    
    const selectedWeeks = weeks.slice(currentWeekIndex, currentWeekIndex + 2);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 0; i < selectedWeeks.length; i++) {
        const week = selectedWeeks[i];
        const data = APP_DATA.designations[week.id]?.quinta || {};
        
        if (i > 0) pdf.addPage();
        
        let y = 10;
        
        // Título principal
        pdf.setFillColor(...PDF_COLORS.roxo);
        pdf.rect(0, y, 210, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('REUNIÃO DO MEIO DE SEMANA', 105, y + 10, { align: 'center' });
        y = 30;
        
        // Data da reunião
        pdf.setFillColor(...PDF_COLORS.azulClaro);
        pdf.rect(10, y, 190, 10, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(week.label, 105, y + 6.5, { align: 'center' });
        y += 15;
        
        // Leitura semanal + Início
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        if (data.leitura_semanal) {
            pdf.text(data.leitura_semanal, 10, y);
            y += 5;
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Cântico ${data.cantico_inicial || ''} e oração`, 10, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Presidente: ${getBrotherName(data.presidente)}`, 140, y);
        y += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Comentários iniciais (1 min)', 10, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Oração Inicial: ${getBrotherName(data.oracao_inicial)}`, 140, y);
        y += 7;
        
        // TESOUROS
        pdf.setFillColor(...PDF_COLORS.tesouros);
        pdf.rect(10, y, 190, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TESOUROS DA PALAVRA DE DEUS', 105, y + 4.5, { align: 'center' });
        y += 9;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(`1. ${data.parte1_tema || 'Discurso'} (10 min)`, 12, y);
        pdf.text(getBrotherName(data.parte1_discurso), 150, y);
        y += 4;
        pdf.text('2. Joias espirituais (10 min)', 12, y);
        pdf.text(getBrotherName(data.parte2_joias), 150, y);
        y += 4;
        pdf.text(`3. Leitura da Bíblia (4 min) ${data.parte3_trecho || ''}`, 12, y);
        pdf.text(data.parte3_estudante || '', 150, y);
        if (data.parte3_estudante_b) {
            y += 4;
            pdf.setFont('helvetica', 'italic');
            pdf.text(`Sala B: ${data.parte3_estudante_b}`, 160, y);
            pdf.setFont('helvetica', 'normal');
        }
        y += 7;
        
        // MINISTÉRIO
        pdf.setFillColor(...PDF_COLORS.ministerio);
        pdf.rect(10, y, 190, 7, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FACA SEU MELHOR NO MINISTERIO', 105, y + 4.5, { align: 'center' });
        y += 9;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        [4, 5, 6].forEach(num => {
            const tema = data[`parte${num}_tema`];
            const est = data[`parte${num}_estudante`];
            const ajud = data[`parte${num}_ajudante`];
            const estB = data[`parte${num}_estudante_b`];
            
            if (tema || est) {
                pdf.text(`${num}. ${tema || ''}`, 12, y);
                pdf.text(`${est || ''}${ajud ? ' - ' + ajud : ''}`, 100, y);
                if (estB) {
                    pdf.setFont('helvetica', 'italic');
                    pdf.text(estB, 160, y);
                    pdf.setFont('helvetica', 'normal');
                }
                y += 4;
            }
        });
        
        y += 3;
        
        // VIDA CRISTÃ
        pdf.setFillColor(...PDF_COLORS.vida);
        pdf.rect(10, y, 190, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('NOSSA VIDA CRISTA', 105, y + 4.5, { align: 'center' });
        y += 9;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(`Cântico ${data.cantico_meio || ''}`, 12, y);
        y += 5;
        
        const partes = data.partes_vida || [];
        partes.forEach(parte => {
            if (parte.numero || parte.tema) {
                pdf.text(`${parte.numero}. ${parte.tema || ''}`, 12, y);
                pdf.text(getBrotherName(parte.irmao), 150, y);
                y += 4;
            }
        });
        
        y += 2;
        pdf.text('Estudo bíblico de congregação (30 min)', 12, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Dirigente/Leitor: ${getBrotherName(data.estudo_biblico)} / ${getBrotherName(data.leitor)}`, 100, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Comentários finais (1 min)', 12, y);
        y += 4;
        pdf.text(`Cântico ${data.cantico_final || ''} e oração final`, 12, y);
        pdf.text(getBrotherName(data.oracao_final), 150, y);
    }
    
    pdf.save(`Quinta-${selectedWeeks[0].label}.pdf`);
    alert('PDF gerado com sucesso!');
}

// ====================================
// SÁBADO - DISCURSO PÚBLICO
// ====================================

async function gerarPDFSabado() {
    const weekId = document.getElementById('sabadoWeekSelect').value;
    const weeks = generateWeeks();
    const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (currentWeekIndex === -1) {
        alert('Selecione uma semana válida');
        return;
    }
    
    const selectedWeeks = weeks.slice(currentWeekIndex, currentWeekIndex + 4);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let y = 10;
    
    // Título
    pdf.setFillColor(...PDF_COLORS.roxo);
    pdf.rect(0, y, 210, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DISCURSO PÚBLICO', 105, y + 10, { align: 'center' });
    y = 30;
    
    pdf.setFontSize(9);
    
    selectedWeeks.forEach((week, index) => {
        const data = APP_DATA.designations[week.id]?.sabado || {};
        
        // Cabeçalho da semana
        pdf.setFillColor(...PDF_COLORS.roxoClaro);
        pdf.rect(10, y, 190, 6, 'F');
        pdf.setTextColor(...PDF_COLORS.roxo);
        pdf.setFont('helvetica', 'bold');
        pdf.text(week.label, 105, y + 4, { align: 'center' });
        y += 8;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        // Dados
        pdf.setFont('helvetica', 'bold');
        pdf.text('Presidente:', 15, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getBrotherName(data.presidente) || '', 45, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Oração Inicial:', 110, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getBrotherName(data.oracao_inicial) || '', 145, y);
        y += 5;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Orador:', 15, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.orador || '', 45, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Leitor Sentinela:', 110, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getBrotherName(data.leitor_sentinela) || '', 145, y);
        y += 5;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Oração Final:', 15, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getBrotherName(data.oracao_final) || '', 45, y);
        y += 10;
    });
    
    pdf.save(`Sabado-${selectedWeeks[0].label}.pdf`);
    alert('PDF gerado com sucesso!');
}

// ====================================
// MECÂNICAS - RETRATO
// ====================================

async function gerarPDFMecanicas() {
    const weekId = document.getElementById('mecanicasWeekSelect').value;
    const weeks = generateWeeks();
    const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (currentWeekIndex === -1) {
        alert('Selecione uma semana válida');
        return;
    }
    
    const selectedWeeks = weeks.slice(currentWeekIndex, currentWeekIndex + 4);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4'); // RETRATO
    
    let y = 10;
    
    // Título
    pdf.setFillColor(...PDF_COLORS.roxo);
    pdf.rect(0, y, 210, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SOM / VÍDEO / INDICADOR', 105, y + 10, { align: 'center' });
    y = 30;
    
    pdf.setFontSize(8);
    
    selectedWeeks.forEach(week => {
        const quinta = APP_DATA.designations[week.id]?.mecanicas_quinta || {};
        const sabado = APP_DATA.designations[week.id]?.mecanicas_sabado || {};
        
        // Cabeçalho semana
        pdf.setFillColor(...PDF_COLORS.roxoClaro);
        pdf.rect(10, y, 190, 5, 'F');
        pdf.setTextColor(...PDF_COLORS.roxo);
        pdf.setFont('helvetica', 'bold');
        pdf.text(week.label, 105, y + 3.5, { align: 'center' });
        y += 7;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        // QUINTA
        pdf.setFillColor(...PDF_COLORS.amarelo);
        pdf.rect(10, y, 30, 5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text('QUINTA', 25, y + 3.5, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        y += 7;
        
        const funcoesQ = [
            ['Som/Vídeo:', getBrotherName(quinta.som_midias)],
            ['Palco:', getBrotherName(quinta.palco)],
            ['Mic. Vol. 1:', getBrotherName(quinta.volante_1)],
            ['Mic. Vol. 2:', getBrotherName(quinta.volante_2)],
            ['Ind. Entrada:', getBrotherName(quinta.indicador_entrada)],
            ['Ind. Auditório:', getBrotherName(quinta.indicador_auditorio)]
        ];
        
        funcoesQ.forEach(([label, nome]) => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(label, 15, y);
            pdf.setFont('helvetica', 'normal');
            pdf.text(nome || '', 50, y);
            y += 4;
        });
        
        y += 2;
        
        // SÁBADO
        pdf.setFillColor(...PDF_COLORS.verde);
        pdf.rect(10, y, 30, 5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text('SÁBADO', 25, y + 3.5, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        y += 7;
        
        const funcoesS = [
            ['Som/Vídeo:', getBrotherName(sabado.som_midias)],
            ['Palco:', getBrotherName(sabado.palco)],
            ['Mic. Vol. 1:', getBrotherName(sabado.volante_1)],
            ['Mic. Vol. 2:', getBrotherName(sabado.volante_2)],
            ['Ind. Entrada:', getBrotherName(sabado.indicador_entrada)],
            ['Ind. Auditório:', getBrotherName(sabado.indicador_auditorio)]
        ];
        
        funcoesS.forEach(([label, nome]) => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(label, 15, y);
            pdf.setFont('helvetica', 'normal');
            pdf.text(nome || '', 50, y);
            y += 4;
        });
        
        y += 5;
    });
    
    pdf.save(`Mecanicas-${selectedWeeks[0].label}.pdf`);
    alert('PDF gerado com sucesso!');
}

// ====================================
// DIRIGENTES
// ====================================

async function gerarPDFDirigentes() {
    const weekId = document.getElementById('dirigentesWeekSelect').value;
    const weeks = generateWeeks();
    const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (currentWeekIndex === -1) {
        alert('Selecione uma semana válida');
        return;
    }
    
    const selectedWeeks = weeks.slice(currentWeekIndex, currentWeekIndex + 4); // 4 semanas
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let y = 10;
    
    // Título
    pdf.setFillColor(...PDF_COLORS.roxo);
    pdf.rect(0, y, 210, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SAÍDA DE CAMPO', 105, y + 10, { align: 'center' });
    y = 30;
    
    pdf.setFontSize(9);
    
    selectedWeeks.forEach(week => {
        const data = APP_DATA.designations[week.id]?.dirigentes || {};
        
        // Cabeçalho
        pdf.setFillColor(...PDF_COLORS.roxoClaro);
        pdf.rect(10, y, 190, 7, 'F');
        pdf.setTextColor(...PDF_COLORS.roxo);
        pdf.setFont('helvetica', 'bold');
        pdf.text(week.label, 105, y + 4.5, { align: 'center' });
        y += 10;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const labels = ['Segunda:', 'Terça:', 'Quarta:', 'Quinta:', 'Sexta:', 'Sábado:'];
        
        dias.forEach((dia, i) => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(labels[i], 15, y);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${data[dia + '_horario'] || ''} - ${data[dia + '_local'] || ''}`, 40, y);
            pdf.text(getBrotherName(data[dia + '_dirigente']) || '', 130, y);
            y += 5;
        });
        
        y += 8; // Mais espaço entre semanas
    });
    
    pdf.save(`Dirigentes-${selectedWeeks[0].label}.pdf`);
    alert('PDF gerado com sucesso!');
}

// ====================================
// LIMPEZA
// ====================================

async function gerarPDFLimpeza() {
    const weekId = document.getElementById('limpezaWeekSelect').value;
    const weeks = generateWeeks();
    const currentWeekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (currentWeekIndex === -1) {
        alert('Selecione uma semana válida');
        return;
    }
    
    const selectedWeeks = weeks.slice(currentWeekIndex, currentWeekIndex + 4);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let y = 10;
    
    // Título com barras coloridas
    pdf.setFillColor(...PDF_COLORS.roxo);
    pdf.rect(0, y, 210, 15, 'F');
    
    // Barra amarela esquerda
    pdf.setFillColor(...PDF_COLORS.amarelo);
    pdf.rect(0, y, 8, 15, 'F');
    
    // Barra verde direita
    pdf.setFillColor(...PDF_COLORS.verde);
    pdf.rect(202, y, 8, 15, 'F');
    
    // Barra azul inferior
    pdf.setFillColor(...PDF_COLORS.azul);
    pdf.rect(0, y + 15, 210, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LIMPEZA', 105, y + 10, { align: 'center' });
    y = 30;
    
    pdf.setFontSize(11);
    
    selectedWeeks.forEach((week, index) => {
        const data = APP_DATA.designations[week.id]?.limpeza || {};
        
        // Fundo suave alternado
        if (index % 2 === 0) {
            pdf.setFillColor(248, 248, 252);
            pdf.roundedRect(15, y - 2, 180, 12, 3, 3, 'F');
        }
        
        // Barra lateral colorida
        const cor = index % 3 === 0 ? PDF_COLORS.amarelo : (index % 3 === 1 ? PDF_COLORS.verde : PDF_COLORS.azul);
        pdf.setFillColor(...cor);
        pdf.roundedRect(15, y - 2, 4, 12, 2, 2, 'F');
        
        // Data
        pdf.setTextColor(...PDF_COLORS.roxo);
        pdf.setFont('helvetica', 'bold');
        pdf.text(week.label, 25, y + 4);
        
        // Grupo
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.grupo || 'Sem designação', 130, y + 4);
        
        y += 16;
    });
    
    pdf.save(`Limpeza-${selectedWeeks[0].label}.pdf`);
    alert('PDF gerado com sucesso!');
}

console.log('PDF Generator FINAL carregado!');
