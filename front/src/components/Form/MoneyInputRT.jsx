import { useState } from "react";

// Convenção de digitação direta já usada no resto do app (ver formHandler.js):
// sem separador de milhar, vírgula opcional pra decimais (ex: "2000" = 2000,
// "2000,50" = 2000.5). O ponto nunca é válido nesse formato — permitir digitá-lo
// é o que causava "2.000" virar 2,0 (parseFloat interpretando o ponto como
// separador decimal). Filtra na digitação em vez de tentar adivinhar a intenção
// depois.
const sanitize = (raw) => {
    const digitsAndComma = raw.replace(/[^0-9,]/g, "").replace(/^,+/, "");
    const firstComma = digitsAndComma.indexOf(",");
    if (firstComma === -1) return digitsAndComma;
    return digitsAndComma.slice(0, firstComma + 1) + digitsAndComma.slice(firstComma + 1).replace(/,/g, "");
};

const toDisplayValue = (decimalValue) => {
    if (decimalValue === undefined || decimalValue === null || decimalValue === "") return "";
    return String(decimalValue).replace(".", ",");
};

const MoneyInputRT = ({ name, defaultValue, required }) => {
    const [value, setValue] = useState(toDisplayValue(defaultValue));

    const handleChange = (event) => {
        setValue(sanitize(event.target.value));
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            name={name}
            value={value}
            onChange={handleChange}
            required={required}
        />
    );
};

export default MoneyInputRT;
