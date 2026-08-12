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

const formatDisplay = (sanitized) => {
    if (!sanitized) return "";
    const [rawIntPart, decPart] = sanitized.split(",");
    const intPart = rawIntPart.replace(/^0+(?=\d)/, "");
    const grouped = groupThousands(intPart);
    return decPart !== undefined ? `${grouped},${decPart}` : grouped;
};

// O input visível nunca mostra prefixo de moeda (fica só no label). O valor
// de fato submetido no FormData vem de um input hidden com prefixo "RT$" —
// isso faz bater no branch de formHandler.js que já remove pontos e troca
// vírgula por ponto antes do parseFloat (mesmo usado por FormInputMoney),
// então a máscara nunca passa pelo parsing "sem vírgula" que causava o bug
// original. O prefixo em si não chega na API (formHandler descarta), então
// não importa se o campo é RT ou R$ de verdade.
const toSubmitValue = (sanitized) => (sanitized ? `RT$ ${formatDisplay(sanitized)}` : "");

const toSanitizedInitial = (decimalValue) => {
    if (decimalValue === undefined || decimalValue === null || decimalValue === "") return "";
    return sanitize(String(decimalValue).replace(".", ","));
};

const isContentChar = (char) => /[0-9,]/.test(char);

const MoneyInputRT = ({ name, defaultValue, required }) => {
    const inputRef = useRef(null);
    const [sanitized, setSanitized] = useState(toSanitizedInitial(defaultValue));

    const handleChange = (event) => {
        const input = event.target;
        const cursorBefore = input.selectionStart ?? input.value.length;
        const contentCharsBeforeCursor = input.value.slice(0, cursorBefore).split("").filter(isContentChar).length;

        const nextSanitized = sanitize(input.value);
        setSanitized(nextSanitized);

        requestAnimationFrame(() => {
            if (!inputRef.current) return;
            const formatted = formatDisplay(nextSanitized);
            let pos = formatted.length;
            let seen = 0;
            for (let i = 0; i < formatted.length; i++) {
                if (isContentChar(formatted[i])) {
                    seen++;
                    if (seen === contentCharsBeforeCursor) {
                        pos = i + 1;
                        break;
                    }
                }
            }
            if (contentCharsBeforeCursor === 0) pos = 0;
            inputRef.current.setSelectionRange(pos, pos);
        });
    };

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={formatDisplay(sanitized)}
                onChange={handleChange}
                onFocus={(event) => event.target.select()}
                required={required}
            />
            <input type="hidden" name={name} value={toSubmitValue(sanitized)} />
        </>
    );
};

export default MoneyInputRT;
