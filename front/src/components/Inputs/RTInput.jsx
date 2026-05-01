import { useEffect, useState } from 'react';

const RTInput = ({ name, required, defaultValue }) => {
    const [value, setValue] = useState("");

    const formatValue = (inputValue) => {
        const numericValue = parseFloat(inputValue.replace(/[^\d]/g, '')) || 0;

        const formattedValue = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(numericValue / 100);

        // Substitui "R$" por "RT$" e vírgula por ponto
        const modifiedValue = formattedValue.replace("R$", "RT$")

        return modifiedValue;
    };

    const handleChange = (event) => {
        const inputValue = event.target.value;
        setValue(formatValue(inputValue));
    };

    useEffect(() => {
        if (defaultValue) {
            setValue(formatValue(defaultValue))
        }
    }, [defaultValue]);

    return (
        <input
            type="text"
            value={value}
            onChange={handleChange}
            name={name}
            required={required}
            placeholder='Valor RT$'
        />
    );
};

export default RTInput;
