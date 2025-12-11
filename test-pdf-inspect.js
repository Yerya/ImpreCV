
import pdfParse from 'pdf-parse';
const pdfModule = pdfParse;
console.log('Module keys:', Object.keys(pdfModule));

try {
    const { PDFParse } = pdfModule;
    console.log('PDFParse type:', typeof PDFParse);
    if (typeof PDFParse === 'function') {
        console.log('PDFParse prototype keys:', Object.getOwnPropertyNames(PDFParse.prototype || {}));
    }
} catch (e) {
    console.error(e);
}
