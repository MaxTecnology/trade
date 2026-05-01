import InputMask from 'react-input-mask';
import FormInput from './formItens/FormInput';
import FormInputWithMask from './formItens/FormInputWithMask';
const Form_Contato = ({ form, type }) => {
    const className = "f2"
    return (<>
        <FormInput required form={form} name="nomeContato" label="Nome" placeholder="Nome" divClassName={className} />
        <FormInputWithMask form={form} name="telefone" label="Telefone" mask="(99)9999-9999" divClassName={className} />
        <FormInputWithMask form={form} name="celular" label="Celular" mask="(99)99999-9999" required divClassName={className} />
        <FormInput required form={form} name="emailContato" label="E-mail" placeholder="E-mail" type={"email"} divClassName={className} />
        <FormInput form={form} name="emailSecundario" label="E-mail secundário" placeholder="E-mail" type={"email"} divClassName={className} />
        <FormInput form={form} name="site" label="Site" placeholder="Site" divClassName={className} />
    </>)
};

export default Form_Contato;
