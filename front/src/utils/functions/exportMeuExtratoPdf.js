import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/hooks/ListasHook'
import { formatarNumeroParaRT } from '@/utils/functions/formartNumber'

const STATUS_LABEL = {
    pendente: 'Pendente',
    concluida: 'Concluída',
    estornada: 'Estornada',
    falha: 'Falha',
}

export const exportMeuExtratoPdf = (rows) => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.text('Meu Extrato', 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${rows.length} movimentação(ões)`, 14, 21)

    autoTable(doc, {
        startY: 26,
        head: [['Código', 'Data', 'Tipo', 'Operação', 'Valor RT$', 'Saldo Após', 'Descrição', 'Status']],
        body: rows.map((r) => [
            r.id?.slice(0, 8) ?? '-',
            r.criadoEm ? formatDate(r.criadoEm) : '-',
            r.transacao?.tipo ?? '-',
            r.tipo === 'credito' ? 'Crédito' : 'Débito',
            `RT$ ${formatarNumeroParaRT(r.valor ?? 0)}`,
            `RT$ ${formatarNumeroParaRT(r.saldoApos ?? 0)}`,
            r.descricao || '-',
            STATUS_LABEL[r.transacao?.status] ?? r.transacao?.status ?? '-',
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 102, 0], textColor: 255 },
    })

    doc.save(`meu-extrato-${new Date().toISOString().slice(0, 10)}.pdf`)
}
