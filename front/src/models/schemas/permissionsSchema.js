import { z } from "zod"

// Nome mantido (permissionSchema) pra não quebrar o import em
// UsuariosCadastrar.jsx — o formulário de permissões que dava nome a esse
// arquivo foi removido (era decorativo: nada disso existia no banco nem era
// enviado/checado pela API).
export const permissionSchema = z.object({
    email: z.string().email().min(1, "Preenchimento obrigatório"),
    imagem: z.any().refine((files) => {
        return files?.[0];
    }, `Selecione uma imagem.`),
    cpf: z.string().min(1, "Preenchimento obrigatório"),
    senha: z.string().min(3, "Preenchimento obrigatório"),
    nome: z.string().min(3, "Preenchimento obrigatório"),
})
