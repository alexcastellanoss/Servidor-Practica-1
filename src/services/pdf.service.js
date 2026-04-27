import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

class PDFService {
    async generateDeliveryNotePDF(deliveryNote, company, client, project) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];
                const stream = new PassThrough();

                stream.on('data', (chunk) => buffers.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(buffers)));
                stream.on('error', reject);

                doc.pipe(stream);

                doc.fontSize(20).text('ALBARÁN', { align: 'center' });
                doc.moveDown();

                doc.fontSize(12).text(`Nº: ${deliveryNote._id}`);
                doc.text(`Fecha de trabajo: ${deliveryNote.workDate.toLocaleDateString('es-ES')}`);
                doc.text(`Fecha de creación: ${deliveryNote.createdAt.toLocaleDateString('es-ES')}`);
                doc.moveDown();

                doc.fontSize(14).text('Datos de la empresa', { underline: true });
                doc.fontSize(10);
                doc.text(`Empresa: ${company.name}`);
                doc.text(`CIF: ${company.cif}`);
                if (company.address) {
                    doc.text(`Dirección: ${company.address.street || ''} ${company.address.number || ''}`);
                    doc.text(`${company.address.postal || ''} ${company.address.city || ''}, ${company.address.province || ''}`);
                }
                doc.moveDown();

                doc.fontSize(14).text('Datos del cliente', { underline: true });
                doc.fontSize(10);
                doc.text(`Cliente: ${client.name}`);
                doc.text(`CIF: ${client.cif}`);
                if (client.address) {
                    doc.text(`Dirección: ${client.address.street || ''} ${client.address.number || ''}`);
                    doc.text(`${client.address.postal || ''} ${client.address.city || ''}, ${client.address.province || ''}`);
                }
                doc.moveDown();

                doc.fontSize(14).text('Datos del proyecto', { underline: true });
                doc.fontSize(10);
                doc.text(`Proyecto: ${project.name}`);
                doc.text(`Código: ${project.projectCode}`);
                if (project.address) {
                    doc.text(`Dirección: ${project.address.street || ''} ${project.address.number || ''}`);
                    doc.text(`${project.address.postal || ''} ${project.address.city || ''}, ${project.address.province || ''}`);
                }
                doc.moveDown();

                doc.fontSize(14).text('Detalles del albarán', { underline: true });
                doc.fontSize(10);
                doc.text(`Tipo: ${deliveryNote.format === 'material' ? 'Material' : 'Horas'}`);
                doc.text(`Descripción: ${deliveryNote.description}`);
                doc.moveDown();

                if (deliveryNote.format === 'material') {
                    doc.text(`Material: ${deliveryNote.material}`);
                    doc.text(`Cantidad: ${deliveryNote.quantity} ${deliveryNote.unit}`);
                } else {
                    if (deliveryNote.hours) {
                        doc.text(`Horas totales: ${deliveryNote.hours}`);
                    }
                    if (deliveryNote.workers && deliveryNote.workers.length > 0) {
                        doc.moveDown();
                        doc.text('Trabajadores:');
                        deliveryNote.workers.forEach(worker => {
                            doc.text(`  - ${worker.name}: ${worker.hours} horas`);
                        });
                    }
                }

                doc.moveDown(2);

                if (deliveryNote.signed && deliveryNote.signatureUrl) {
                    doc.fontSize(12).text('Firmado digitalmente', { align: 'center' });
                    doc.fontSize(10).text(`Fecha de firma: ${deliveryNote.signedAt.toLocaleDateString('es-ES')}`, { align: 'center' });
                } else {
                    doc.moveDown(3);
                    doc.fontSize(10).text('_________________________', { align: 'right' });
                    doc.text('Firma del cliente', { align: 'right' });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new PDFService();