import FormInput from './formItens/FormInput';
import FormInputWithMask from './formItens/FormInputWithMask';

const Form_Endereço = ({ form, type }) => {
    return (
        <>
            <FormInput required form={form} name="logradouro" label="Logradouro" placeholder="Logradouro" divClassName={""} />
            <FormInput required type="number" form={form} name="numero" label="Numero" placeholder="Numero" divClassName={""} />
            <FormInputWithMask required form={form} name="cep" label="CEP" mask="99999-999" divClassName={""} />
            <FormInput form={form} name="complemento" label="Complemento" placeholder="Complemento" divClassName={""} />
            <FormInput required form={form} name="bairro" label="Bairro" placeholder="Bairro" divClassName={""} />
            <FormInput required form={form} name="cidade" label="Cidade" placeholder="Cidade" divClassName={""} />
            <FormInput required form={form} name="estado" label="Estado" placeholder="Estado" divClassName={""} />
            <FormInput form={form} name="regiao" label="Região" placeholder="Região" divClassName={""} />
        </>
    )
};

export default Form_Endereço;
