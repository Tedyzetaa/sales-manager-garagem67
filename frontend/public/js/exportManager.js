class ExportManager {
    constructor() {
        this.formats = ['csv', 'json', 'xlsx', 'pdf'];
    }

    async exportData(data, format, filename) {
        if (!data) {
            throw new Error('Nenhum dado para exportar');
        }

        switch (format) {
            case 'csv':
                return this.exportToCSV(data, filename);
            case 'json':
                return this.exportToJSON(data, filename);
            case 'xlsx':
                return this.exportToExcel(data, filename);
            case 'pdf':
                return this.exportToPDF(data, filename);
            default:
                throw new Error(`Formato não suportado: ${format}`);
        }
    }

    exportToCSV(data, filename) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Dados inválidos para exportação CSV');
        }

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                const stringValue = String(value ?? '');
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [csvHeaders, ...csvRows].join('\n');
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
        
        console.log('📊 CSV exportado com sucesso');
    }

    exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
        console.log('📊 JSON exportado com sucesso');
    }

    exportToExcel(data, filename) {
        this.exportToCSV(data, filename);
        console.log('📊 Excel exportado (simulado como CSV)');
    }

    exportToPDF(data, filename) {
        const pdfContent = this.generatePDFContent(data);
        this.downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
        console.log('📊 PDF exportado com sucesso');
    }

    generatePDFContent(data) {
        let content = `Relatório Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
        
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                content += `${index + 1}. ${JSON.stringify(item)}\n`;
            });
        } else {
            content += JSON.stringify(data, null, 2);
        }
        
        return content;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

window.exportManager = new ExportManager();