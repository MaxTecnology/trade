import jsPDF from 'jspdf'
import { formatDate } from '@/hooks/ListasHook'
import { formatarNumeroParaRT } from '@/utils/functions/formartNumber'
import { compradorLabel, vendedorLabel } from '@/utils/functions/tables/compradorVendedor'

const STATUS_LABEL = {
    concluida: 'Concluída',
    pendente: 'Pendente',
    estornada: 'Estornada',
    falha: 'Falha',
}

// voucher = { codigo, emitidoEm, transacao: {tipo, status, valorRT, criadoEm, comprador, vendedor, contaOrigem, contaDestino, oferta} }
// Mesmo formato retornado por GET /vouchers/:id, /vouchers/:id/pdf e /vouchers/verificar/:codigo.
export const exportVoucherPdf = (voucher) => {
    const t = voucher.transacao
    const doc = new jsPDF({ unit: 'mm', format: 'a5' })

    doc.setFillColor(0, 39, 82)
    doc.rect(0, 0, 148, 30, 'F')
    doc.setTextColor(255)
    doc.setFontSize(18)
    doc.text('Comprovante Rede Trade', 74, 18, { align: 'center' })

    doc.setTextColor(30)
    let y = 42
    const linha = (label, valor) => {
        doc.setFontSize(10)
        doc.setTextColor(120)
        doc.text(label, 14, y)
        doc.setFontSize(13)
        doc.setTextColor(30)
        doc.text(String(valor ?? '-'), 14, y + 6)
        y += 16
    }

    linha('Código do voucher', voucher.codigo)
    linha('Emitido em', formatDate(voucher.emitidoEm))
    linha('Vendedor', vendedorLabel(t))
    linha('Comprador', compradorLabel(t))
    linha('Valor RT$', `RT$ ${formatarNumeroParaRT(t?.valorRT ?? 0)}`)
    linha('Status', STATUS_LABEL[t?.status] ?? t?.status ?? '-')
    if (t?.oferta?.titulo) linha('Oferta', t.oferta.titulo)

    doc.setDrawColor(0, 39, 82)
    doc.line(14, y, 134, y)
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text('Verifique a autenticidade deste comprovante em redetrade.com.br', 74, y + 6, { align: 'center' })

    doc.save(`voucher-${voucher.codigo}.pdf`)
}
