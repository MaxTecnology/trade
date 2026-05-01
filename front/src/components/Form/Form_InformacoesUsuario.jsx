import FormInput from './formItens/FormInput';
import FormSelect from './formItens/FormSelect';
import FormInputWithMask from './formItens/FormInputWithMask';
import FormSubcategoria from './formItens/FormSubcategoria';
import CategoriesOptions from '../Options/CategoriesOptions';

const Form_InformacoesUsuario = ({ form, type }) => {
    return (
        <>
            <FormInput required form={form} name="razaoSocial" label="Razão Social" placeholder="Razão Social" />
            <FormInput required form={form} name="nomeFantasia" label="Nome Fantasia" placeholder="Nome Fantasia" />
            <FormInput required form={form} name="descricao" label="Descrição" placeholder="Descrição" textarea />
            <FormSelect required form={form} name="status" label="Status" placeholder="Selecionar" items={[
                { label: "Atendendo", value: "true" },
                { label: "Não Atendendo", value: "false" },
            ]} />
            <FormInputWithMask form={form} name="cnpj" label="CNPJ" mask="99.999.999/9999-99" required />
            <FormInput form={form} name="inscEstadual" label="Insc. Estadual" placeholder="Insc. Estadual" />
            <FormInput form={form} name="inscMunicipal" label="Insc. Municipal" placeholder="Insc. Municipal" />
            <FormInput form={form} name="restricao" label="Restrições" placeholder="Restrições.." />
            <FormSelect form={form} name="categoriaId" label="Categoria" placeholder="Selecionar" empty options={<CategoriesOptions />} />
            <FormSubcategoria form={form} name="subcategoriaId" label="Subcategoria" placeholder="Selecione" />
            <FormSelect required form={form} name="mostrarNoSite" label="Mostrar no site" placeholder="Selecionar" items={[
                { label: "Sim", value: "true" },
                { label: "Não", value: "false" },
            ]} />
            <FormSelect required form={form} name="tipo" label="Tipo" placeholder="Selecionar" items={[
                {
                    value: "Associado", label: "Associado",
                }
            ]} />
        </>
    )
};

export default Form_InformacoesUsuario;
