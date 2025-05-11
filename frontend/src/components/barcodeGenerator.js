// barcodeGenerator.js
import JsBarcode from 'jsbarcode';

export const generateBarcode = (data, options = {}) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, data, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 16,
            margin: 10,
            ...options
        });
        resolve(canvas.toDataURL('image/png'));
    });
};