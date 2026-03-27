import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF estándar para los módulos.
 * @param {string} title Título del reporte (ej. "Detalle de Venta", "Orden de Compra")
 * @param {Array} metaInfo Arreglo de objetos con label y value, ej [{label: 'ID', value: 'VTA001'}]
 * @param {Array} columns Arreglo de strings para la cabecera de la tabla
 * @param {Array} rows Arreglo de arreglos de strings/números para el body de la tabla
 * @param {number} total Cantidad total (moneda)
 * @param {string} filename Nombre sugerido del archivo
 */
export const generateRecordPDF = (title, metaInfo, columns, rows, total, filename = 'reporte.pdf') => {
  const doc = new jsPDF();
  
  // Colores corporativos basados en Soul
  const PRIMARY_COLOR = [201, 162, 77]; // #C9A24D (Dorado)
  const TEXT_COLOR = [20, 20, 20];
  
  // Configurar inicio
  let startY = 20;

  // Header / Logo "SOUL"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("SOUL", 14, startY);
  
  // Título del documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_COLOR);
  startY += 10;
  doc.text(title, 14, startY);
  
  // Subtítulo: Sneakers Store
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Calidad y estilo en cada paso", 14, startY + 6);

  startY += 18;

  // Escribir los metadatos (Info general del registro)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Información del Registro:", 14, startY);
  startY += 6;

  doc.setFontSize(10);
  metaInfo.forEach(info => {
    doc.setFont("helvetica", "bold");
    doc.text(`${info.label}:`, 14, startY);
    
    doc.setFont("helvetica", "normal");
    // Calcular ancho del label para dibujar el valor al lado
    const textWidth = doc.getTextWidth(`${info.label}: `);
    doc.text(String(info.value), 14 + textWidth, startY);
    
    startY += 6;
  });

  startY += 6;

  // Generar la tabla de productos
  autoTable(doc, {
    startY: startY,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [0, 0, 0], // Texto negro sobre dorado
      fontStyle: 'bold'
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 20 }
  });

  // Pintar el Total General
  const finalY = doc.lastAutoTable.finalY || startY;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);
  
  const textTotal = `Total General: $${Number(total || 0).toLocaleString()}`;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Alinear a la derecha
  doc.text(textTotal, pageWidth - 14, finalY + 12, { align: "right" });

  // Pie de página
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Documento generado automáticamente por el sistema Administrativo SOUL.", pageWidth / 2, pageHeight - 10, { align: "center" });

  // Guardar / Descargar PDF
  doc.save(filename);
};
