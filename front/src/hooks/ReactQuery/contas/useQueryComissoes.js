import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { isMatriz } from '@/hooks/getId';

// Comissão da plataforma consolidada mensalmente (ver
// gerarCobrancasComissaoMensal no backend) — Matriz é quem gera o boleto
// pro cliente e dá baixa quando ele paga, por isso essa tela é dela.
export const useQueryComissoes = () => {
    return useQuery({
        queryKey: ['cobrancasComissoes'],
        queryFn: async () => getApiData('cobrancas?tipo=comissao&page=1&limit=100'),
        enabled: isMatriz(),
    });
};
