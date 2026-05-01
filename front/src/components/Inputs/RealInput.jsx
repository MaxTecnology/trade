import { useState, useEffect } from 'react';

const RealInput = ({ reference, name, defaultValue, required }) => {
    const [value, setValue] = useState('');

    const formatValue = (inputValue) => {
        // Converte para número removendo caracteres não numéricos
        const numericValue = Number(inputValue.replace(/[^0-9]/g, ''));

        // Formatação com base na propriedade reference
        if (reference) {
            return (numericValue / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            });
        } else {
            // Usar toFixed para limitar as casas decimais a 2
            return (numericValue / 100).toFixed(2).replace(',', '.');
        }
    };

    useEffect(() => {
        formatValue(value)
    }, [reference])

    const handleChange = (event) => {
        const inputValue = event.target.value;
        setValue(formatValue(inputValue));
    };

    useEffect(() => {
        // Quando a propriedade reference mudar, reformatar o valor
        setValue(formatValue(value));
    }, [reference]);

    return (
        <input
            type="text"
            value={value}
            onChange={handleChange}
            name={name}
            required={required}
            defaultValue={defaultValue}
            placeholder={reference ? 'R$ 0,00' : '0.00'}
        />
    );
};

export default RealInput;
