// Aguarda todo o conteúdo da página ser carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // ============================
    // SEÇÃO 1: SELEÇÃO DE ELEMENTOS
    // ============================

    // Seleciona o input do valor total da compra
    const totalCompraInput = document.getElementById('total-compra');
    // Seleciona o input do valor pago pelo cliente
    const valorPagoInput = document.getElementById('valor-pago');
    // Seleciona o botão que dispara o cálculo do troco
    const calcularBtn = document.getElementById('calcular');
    // Seleciona o container onde o resultado do troco será exibido
    const resultadoDiv = document.getElementById('resultado');

    // Seleciona o botão para abrir/fechar a seção de estoque de cédulas/moedas
    const toggleBtn = document.getElementById('toggle-estoque');
    // Seleciona o container que contém os inputs de estoque
    const estoqueContent = document.getElementById('estoque-content');


    // ============================
    // SEÇÃO 2: MAPA DE VALORES E ESTOQUE
    // ============================

    // Mapeia os valores (em centavos) para os IDs dos inputs correspondentes
    const mapaValoresParaIDs = {
        20000: 'qnt_200',   // R$ 200,00
        10000: 'qnt_100',   // R$ 100,00
        5000:  'qnt_50',    // R$ 50,00
        2000:  'qnt_20',    // R$ 20,00
        1000:  'qnt_10',    // R$ 10,00
        500:   'qnt_5',     // R$ 5,00
        200:   'qnt_2',     // R$ 2,00
        100:   'qnt_1',     // R$ 1,00
        50:    'qnt_0_50',  // R$ 0,50
        25:    'qnt_0_25',  // R$ 0,25
        10:    'qnt_0_10',  // R$ 0,10
        5:     'qnt_0_05'   // R$ 0,05
    };
    
    // Cria um array de valores em centavos, do maior para o menor
    const cedulasEMoedasEmCentavos = Object.keys(mapaValoresParaIDs)
        .map(Number) // converte de string para número
        .sort((a, b) => b - a); // ordena do maior para o menor
    
    // ============================
    // SEÇÃO 3: FUNÇÃO DE CÁLCULO DE TROCO (COM ESTOQUE)
    // ============================

    // Função que calcula o troco considerando o estoque de cédulas/moedas
    function calcularTrocoPorCedulas(troco) {
        let resultadoTexto = '<ul>'; // Inicia a lista de resultados
        let trocoRestante = Math.round(troco * 100); // Converte troco para centavos

        // --- 1. LÊ O ESTOQUE ATUAL DEFINIDO PELO USUÁRIO ---
        const estoqueAtual = {}; // Objeto que guarda a quantidade de cada cédula disponível
        for (const [valorEmCentavos, id] of Object.entries(mapaValoresParaIDs)) {
            const inputElement = document.getElementById(id); // Seleciona o input correspondente
            estoqueAtual[Number(valorEmCentavos)] = parseInt(inputElement.value) || 0; // Converte o valor do input para inteiro ou 0
        }

        let trocoCalculado = {}; // Objeto que armazenará a quantidade de cada cédula usada
        let trocoConseguiuDar = true; // Flag que indica se foi possível dar todo o troco

        // --- 2. CALCULA O TROCO USANDO O ESTOQUE DISPONÍVEL ---
        for (const valorEmCentavos of cedulasEMoedasEmCentavos) {
            let limiteDeUso = estoqueAtual[valorEmCentavos] || 0; // Quantidade máxima disponível no estoque
            let quantidadeIdeal = Math.floor(trocoRestante / valorEmCentavos); // Quantidade necessária sem restrição de estoque
            let quantidadeUsada = Math.min(quantidadeIdeal, limiteDeUso); // Usa apenas o que está disponível
            
            if (quantidadeUsada > 0) {
                trocoCalculado[valorEmCentavos] = quantidadeUsada; // Armazena a quantidade usada
                trocoRestante -= quantidadeUsada * valorEmCentavos; // Atualiza o troco restante
            }
        }
        
        // --- 3. MONTA O RESULTADO VISUAL ---
        for (const valor of cedulasEMoedasEmCentavos) {
            if (trocoCalculado[valor]) {
                const quantidade = trocoCalculado[valor]; // Quantidade usada dessa cédula
                const valorReal = valor / 100; // Converte centavos para reais
                const tipo = valorReal >= 2 ? 'nota' : 'moeda'; // Determina se é nota ou moeda
                const plural = quantidade > 1 ? 's' : ''; // Define plural
                const valorFormatado = valorReal.toFixed(2).replace('.', ','); // Formata valor
                
                resultadoTexto += `<li>${quantidade} ${tipo}${plural} de R$ ${valorFormatado}</li>`; // Adiciona à lista
            }
        }

        // Se ainda sobrou troco e não há cédulas suficientes
        if (trocoRestante > 0) {
            trocoConseguiuDar = false; // Flag indica que não foi possível completar o troco
            resultadoTexto += `<li style="color: red; font-weight: 700;">[ATENÇÃO] Troco indisponível! Faltam R$ ${(trocoRestante / 100).toFixed(2).replace('.', ',')}</li>`;
        }
        
        resultadoTexto += '</ul>'; // Fecha a lista
        return {html: resultadoTexto, sucesso: trocoConseguiuDar}; // Retorna HTML e flag de sucesso
    }
    
    // ============================
    // SEÇÃO 4: LÓGICA DE TOGGLE (ESCONDER/MOSTRAR ESTOQUE)
    // ============================
    
    estoqueContent.classList.add('hidden'); // Começa escondido
    toggleBtn.setAttribute('aria-expanded', 'false'); // Define atributo ARIA para acessibilidade

    // Clique no botão de toggle
    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true'; // Verifica se já está expandido
        
        if (isExpanded) {
            estoqueContent.classList.add('hidden'); // Esconde conteúdo
            toggleBtn.setAttribute('aria-expanded', 'false'); // Atualiza ARIA
        } else {
            estoqueContent.classList.remove('hidden'); // Mostra conteúdo
            toggleBtn.setAttribute('aria-expanded', 'true'); // Atualiza ARIA
        }
    });

    // ============================
    // SEÇÃO 5: EVENTO PRINCIPAL DE CÁLCULO
    // ============================

    calcularBtn.addEventListener('click', () => {
        resultadoDiv.classList.add('hidden-result'); // Esconde resultado anterior para animação
        
        // Função auxiliar para tratar valores com vírgula ou ponto
        function processarValor(valor) {
            if (valor.indexOf(',') !== -1) {
                return parseFloat(valor.replace(',', '.')); // Substitui vírgula por ponto
            }
            return parseFloat(valor); // Caso já seja ponto
        }

        const totalCompra = processarValor(totalCompraInput.value); // Valor total da compra
        const valorPago = processarValor(valorPagoInput.value); // Valor pago pelo cliente
        
        let htmlContent = ''; // Armazena HTML do resultado
        let borderColor = ''; // Cor da borda do resultado
        let bgColor = ''; // Cor do fundo do resultado
        let shouldAnimate = false; // Controla animação de exibição

        // Validação de entrada
        if (isNaN(totalCompra) || isNaN(valorPago) || totalCompra <= 0) {
            htmlContent = '<p style="color: red;">Por favor, insira valores válidos para a compra.</p>';
            borderColor = '#e57373'; // Vermelho claro
            bgColor = '#ffebee'; // Fundo vermelho claro
            shouldAnimate = true;
        } 
        else if (valorPago < totalCompra) { // Valor insuficiente
            const faltando = (totalCompra - valorPago).toFixed(2).replace('.', ',');
            htmlContent = `<p style="color: red;">Valor pago insuficiente. Faltam: R$ ${faltando}</p>`;
            borderColor = '#e57373';
            bgColor = '#ffebee';
            shouldAnimate = true;
        } 
        else { // Cálculo válido
            const troco = valorPago - totalCompra; // Calcula o troco
            
            const resultadoTroco = calcularTrocoPorCedulas(troco); // Chama função de cálculo
            
            if (resultadoTroco.sucesso) { // Troco completo
                htmlContent = `<p style="color: green;">Troco total: R$ ${troco.toFixed(2).replace('.', ',')}</p>`;
                htmlContent += '<h3>Detalhes do Troco:</h3>';
                htmlContent += resultadoTroco.html;
                borderColor = '#81c784';
                bgColor = '#e8f5e9';
            } else { // Troco insuficiente
                htmlContent = `<p style="color: red;">Troco total: R$ ${troco.toFixed(2).replace('.', ',')}</p>`;
                htmlContent += '<h3>Detalhes do Troco:</h3>';
                htmlContent += resultadoTroco.html;
                borderColor = '#e57373';
                bgColor = '#ffebee';
            }
            
            shouldAnimate = true; // Habilita animação
        }

        // Aplica conteúdo e estilos no container de resultado
        resultadoDiv.innerHTML = htmlContent;
        resultadoDiv.style.borderColor = borderColor;
        resultadoDiv.style.backgroundColor = bgColor;

        // Inicia animação CSS removendo a classe que esconde
        if (shouldAnimate) {
            setTimeout(() => {
                resultadoDiv.classList.remove('hidden-result'); // Remove classe de ocultamento
            }, 10); // Pequeno delay para reiniciar animação
        }
    });
});
