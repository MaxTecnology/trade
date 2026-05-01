export const formHandler = (item) => {
    var object = {};
    item.forEach((value, key) => {
        if (value === "true") {
            object[key] = true;
            return;
        }
        if (value === "false") {
            object[key] = false;
            return;
        }
        if (value === "null") {
            object[key] = null;
            return;
        }
        if (key === "complemento" || key === "senha" || key === "inscEstadual" || key === "inscMunicipal") {
            object[key] = value;
            return;
        }

        // Verifica se o valor começa com "RT$" ou "R$"
        const match = /^(RT\$|R\$)\s*([\d.,]+)$/.exec(value);

        if (match) {
            // Extrai o valor numérico da correspondência e substitui vírgula por ponto
            const numericValue = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
            return object[key] = numericValue;
        }

        const numericValue = /^[0-9.]+(?:,[0-9]+)?$/.test(value) ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;



        // Atribui o valor ao objeto
        object[key] = numericValue;
    });
    return object;
};

export const imageReferenceHandler = async (event, setImageReference, setImagem) => {
    const arquivo = event.target.files[0];

    if (arquivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageReference(e.target.result)
        };
        reader.readAsDataURL(arquivo);
    }

    if (setImagem) {
        setImagem(arquivo)
    }
};

export const formatForm = (form) => {
    console.log("the form", form);
    var object = {};

    // Use Object.keys() to get an array of keys from the object
    Object.keys(form).forEach((key) => {
        const value = form[key];

        if (typeof value !== 'string') {
            // If value is not a string, directly assign it to the object
            object[key] = value;
            return;
        }

        if (value === "true") {
            object[key] = true;
            return;
        }
        if (value === "false") {
            object[key] = false;
            return;
        }
        if (value === "null") {
            object[key] = null;
            return;
        }
        if (key === "complemento" || key === "senha" || key === "inscEstadual" || key === "inscMunicipal") {
            object[key] = value;
            return;
        }

        // Verifica se o valor começa com "RT$" ou "R$"
        const match = /^(RT\$|R\$)\s*([\d.,]+)$/.exec(value);

        if (match) {
            // Extrai o valor numérico da correspondência e substitui vírgula por ponto
            const numericValue = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
            return object[key] = numericValue;
        }

        const numericValue = /^[0-9.]+(?:,[0-9]+)?$/.test(value) ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;

        // Atribui o valor ao objeto
        object[key] = numericValue;
    });
    return object;
}
