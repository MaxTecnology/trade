const aplicarMascara = (campo, mascara) => {
    if (!campo) return;

    const aplicarMascaraAoValor = (valor) => {
        let valorMascarado = '';
        let valorIdx = 0;

        for (let i = 0; i < mascara.length; i++) {
            if (valorIdx >= valor.length) break;

            if (mascara[i] === 'X') {
                valorMascarado += valor[valorIdx];
                valorIdx++;
            } else {
                valorMascarado += mascara[i];
            }
        }

        return valorMascarado;
    };

    campo.addEventListener('input', () => {
        const valorFormatado = campo.value.replace(/\D/g, '');
        const valorMascarado = aplicarMascaraAoValor(valorFormatado);
        campo.value = valorMascarado;
    });

    // Verifica se há um valor no campo ao iniciar e aplica a máscara
    if (campo.value) {
        const valorFormatado = campo.value.replace(/\D/g, '');
        const valorMascarado = aplicarMascaraAoValor(valorFormatado);
        campo.value = valorMascarado;
    }
};

const MascaraCNPJ = (cnpj) => {
    const element = document.getElementById(cnpj);
    aplicarMascara(element, 'XX.XXX.XXX/XXXX-XX');
};

const MascaraTelefone = (telefone) => {
    const element = document.getElementById(telefone);
    aplicarMascara(element, '(XX) XXXX-XXXX');
};

const MascaraCelular = (celular) => {
    const element = document.getElementById(celular);
    aplicarMascara(element, '(XX) XXXXX-XXXX');
};

const MascaraCEP = (cep) => {
    const element = document.getElementById(cep);
    aplicarMascara(element, 'XXXXX-XXX');
};

const MascaraCPF = (cpf) => {
    const element = document.getElementById(cpf);
    aplicarMascara(element, 'XXX.XXX.XXX-XX');
};

const MascaraValor = (valor) => {
    const element = document.getElementById(valor);
    aplicarMascara(element, 'X.XX.XX.XX,XX');
};

const Mascaras = () => {
    MascaraCEP("cep")
    MascaraCNPJ("cnpj")
    MascaraCelular("celular")
    MascaraTelefone("telefone")
    MascaraCPF("cpf")
    MascaraValor('valor')
}

function formatarParaReal(valor) {
    // Remove tudo o que não é dígito
    valor = valor.replace(/\D/g, '');

    // Converte para float e divide por 100 para trazer a representação correta dos centavos
    const valorFloat = parseFloat(valor) / 100;

    // Formata o valor para o formato de moeda brasileira substituindo a vírgula por ponto
    const formato = (valor === '') ? '' : valorFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace(',', '.');

    return formato;
}




export const formateValue = () => {
    const inputElement = document.getElementById("valor");  // Substitua 'seu-input' pelo ID do seu input
    const inputElement2 = document.getElementById("valor2");  // Substitua 'seu-input' pelo ID do seu input
    if (inputElement) {
        inputElement.addEventListener('input', function () {
            const valor = inputElement.value;
            const formato = formatarParaReal(valor);
            inputElement.value = formato;
        })
    }


    if (inputElement2) {
        inputElement2.addEventListener('input', function () {
            const valor2 = inputElement2.value;
            const formato2 = formatarParaReal(valor2);
            inputElement2.value = formato2;
        });
    }


}



export default Mascaras