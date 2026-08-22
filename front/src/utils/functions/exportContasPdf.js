import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/hooks/ListasHook'
import { TIPO_LABEL, nomeEntidade, valorCobranca } from '@/pages/contas/constantsContas'

export const exportContasPdf = (rows, titulo) => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.text(`Relatório de ${titulo}`, 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${rows.length} cobrança(s)`, 14, 21)

    autoTable(doc, {
        startY: 26,
        head: [['Nº Conta', 'Nome', 'Tipo', 'Valor', 'Vencimento', 'Status', 'Descrição']],
        body: rows.map((r) => [
            r.conta?.numero ?? '-',
            nomeEntidade(r),
            TIPO_LABEL[r.tipo] ?? r.tipo,
            valorCobranca(r),
            r.vencimento ? formatDate(r.vencimento) : '-',
            r.pago ? 'Paga' : 'Pendente',
            r.descricao || '-',
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 102, 0], textColor: 255 },
        columnStyles: { 6: { cellWidth: 60 } },
    })

    doc.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
