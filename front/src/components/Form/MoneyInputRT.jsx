import { useRef, useState } from "react";

// Só dígitos e uma vírgula (decimais) — nunca ponto. É o usuário quem digita
// os dígitos "crus"; o ponto de milhar é sempre calculado, nunca digitado
// diretamente (isso evitava a ambiguidade que causava "2.000" virar 2,0).
const sanitize = (raw) => {
    const digitsAndComma = raw.replace(/[^0-9,]/g, "").replace(/^,+/, "");
    const firstComma = digitsAndComma.indexOf(",");
    if (firstComma === -1) return digitsAndComma;
    return digitsAndComma.slice(0, firstComma + 1) + digitsAndComma.slice(firstComma + 1).replace(/,/g, "");
};

const groupThousands = (integerDigits) => integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Prefixo "RT$" faz o valor bater no branch de formHandler.js que já remove
// pontos e troca vírgula por ponto antes do parseFloat (usado também por
// FormInputMoney) — a máscara nunca passa pelo parsing "sem vírgula" que
// causava o bug original.
const formatDisplay = (sanitized) => {
    if (!sanitized) return "";
    const [intPart, decPart] = sanitized.split(",");
    const grouped = groupThousands(intPart);
    return decPart !== undefined ? `RT$ ${grouped},${decPart}` : `RT$ ${grouped}`;
};

const toSanitizedInitial = (decimalValue) => {
    if (decimalValue === undefined || decimalValue === null || decimalValue === "") return "";
    return sanitize(String(decimalValue).replace(".", ","));
};

const isContentChar = (char) => /[0-9,]/.test(char);

const MoneyInputRT = ({ name, defaultValue, required }) => {
    const inputRef = useRef(null);
    const [value, setValue] = useState(formatDisplay(toSanitizedInitial(defaultValue)));

    const handleChange = (event) => {
        const input = event.target;
        const cursorBefore = input.selectionStart ?? input.value.length;
        const contentCharsBeforeCursor = input.value.slice(0, cursorBefore).split("").filter(isContentChar).length;

        const sanitized = sanitize(input.value);
        const formatted = formatDisplay(sanitized);
        setValue(formatted);

        requestAnimationFrame(() => {
            if (!inputRef.current) return;
            let seen = 0;
            let pos = formatted.length;
            for (let i = 0; i < formatted.length; i++) {
                if (isContentChar(formatted[i])) {
                    seen++;
                    if (seen === contentCharsBeforeCursor) {
                        pos = i + 1;
                        break;
                    }
                }
            }
            if (contentCharsBeforeCursor === 0) pos = formatted.startsWith("RT$ ") ? 4 : 0;
            inputRef.current.setSelectionRange(pos, pos);
        });
    };

    return (
        <input
            ref={inputRef}
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
