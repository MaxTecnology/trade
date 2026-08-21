import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/hooks/ListasHook'
import { formatarNumeroParaRT } from '@/utils/functions/formartNumber'

const STATUS_LABEL = {
    em_analise: 'Em análise',
    encaminhado: 'Encaminhado',
    aprovado: 'Aprovado',
    negado: 'Negado',
}

const agenciaNome = (r) =>
    r.transacao?.comprador?.agencia?.nome
    ?? r.transacao?.vendedor?.agencia?.nome
    ?? r.transacao?.contaOrigem?.agencia?.nome
    ?? r.transacao?.contaDestino?.agencia?.nome
    ?? '-'

export const exportEstornosPdf = (rows) => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.text('Relatório de Solicitações de Estorno', 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${rows.length} solicitação(ões)`, 14, 21)

    autoTable(doc, {
        startY: 26,
        head: [['Código', 'Data', 'Solicitante', 'Tipo', 'Valor RT$', 'Comprador', 'Vendedor', 'Agência', 'Motivo', 'Status']],
        body: rows.map((r) => [
            r.id?.slice(0, 8) ?? '-',
            r.criadoEm ? formatDate(r.criadoEm) : '-',
            r.solicitante?.nome ?? '-',
            r.transacao?.tipo ?? '-',
            `RT$ ${formatarNumeroParaRT(r.transacao?.valorRT ?? 0)}`,
            r.transacao?.comprador?.nome ?? '-',
            r.transacao?.vendedor?.nome ?? '-',
            agenciaNome(r),
            r.motivo || 'Sem motivo informado',
            STATUS_LABEL[r.status] ?? r.status,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 102, 0], textColor: 255 },
        columnStyles: { 8: { cellWidth: 55 } },
    })

    doc.save(`estornos-${new Date().toISOString().slice(0, 10)}.pdf`)
}
