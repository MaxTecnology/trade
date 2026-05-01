import { useQueryUsuarios } from '@/hooks/ReactQuery/useQueryUsuarios';
const UsuariosOptions = ({ voucher }) => {
    const { data } = useQueryUsuarios();
    const user = data ? data.data : []
    function filter(data) {
        if (voucher) {
            const filteredUsers = data.filter(user => user.aceitaVoucher === true);
            return filteredUsers
        }
        return data
    }

    return (
        <>
            {user && user.length > 0 ? filter(user).length > 0 ?
                data.data.map((item, index) => (
                    <option
                        value={JSON.stringify(item)}
                        id={item.nomeFantasia}
                        key={item.idUsuario + index}
                    >
                        {item.nomeFantasia}
                    </option>
                ))
                : <option disabled>{voucher ? 'Nenhum Usuário que aceita voucher' : 'Nenhum Usuário Disponivel'}</option>
                : null}
        </>
    )
};

export default UsuariosOptions;
