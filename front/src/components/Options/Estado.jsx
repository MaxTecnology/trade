const estados = [
    { abreviacao: '', nome: 'Selecionar' },
    { abreviacao: 'AC', nome: 'Acre' },
    { abreviacao: 'AL', nome: 'Alagoas' },
    { abreviacao: 'AP', nome: 'Amapá' },
    { abreviacao: 'AM', nome: 'Amazonas' },
    { abreviacao: 'BA', nome: 'Bahia' },
    { abreviacao: 'CE', nome: 'Ceará' },
    { abreviacao: 'DF', nome: 'Distrito Federal' },
    { abreviacao: 'ES', nome: 'Espírito Santo' },
    { abreviacao: 'GO', nome: 'Goiás' },
    { abreviacao: 'MA', nome: 'Maranhão' },
    { abreviacao: 'MT', nome: 'Mato Grosso' },
    { abreviacao: 'MS', nome: 'Mato Grosso do Sul' },
    { abreviacao: 'MG', nome: 'Minas Gerais' },
    { abreviacao: 'PA', nome: 'Pará' },
    { abreviacao: 'PB', nome: 'Paraíba' },
    { abreviacao: 'PR', nome: 'Paraná' },
    { abreviacao: 'PE', nome: 'Pernambuco' },
    { abreviacao: 'PI', nome: 'Piauí' },
    { abreviacao: 'RJ', nome: 'Rio de Janeiro' },
    { abreviacao: 'RN', nome: 'Rio Grande do Norte' },
    { abreviacao: 'RS', nome: 'Rio Grande do Sul' },
    { abreviacao: 'RO', nome: 'Rondônia' },
    { abreviacao: 'RR', nome: 'Roraima' },
    { abreviacao: 'SC', nome: 'Santa Catarina' },
    { abreviacao: 'SP', nome: 'São Paulo' },
    { abreviacao: 'SE', nome: 'Sergipe' },
    { abreviacao: 'TO', nome: 'Tocantins' }
];

const EstadoSelect = () => {
    return (
        <>
            {estados.map((estado, index) => (
                <option
                    key={index}
                    value={estado.abreviacao}
                    disabled={estado.abreviacao === ''}
                >
                    {estado.abreviacao}
                </option>
            ))}
        </>
    );
};

export default EstadoSelect;
