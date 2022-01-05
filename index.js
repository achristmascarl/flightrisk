const PDFDocument = require('pdf-lib');
const uuid = require('uuid');

const https = require('https');
const fs = require('fs');
// const argv = require('minimist')(process.argv.slice(2));
const link = "https://www.kancharlawar.com/Piyush_Kancharlawar_Resume.pdf";
const id = '0e6e8329-b670-467f-8381-c9f550cffa54';

// ingestPDFLink(link);
checkForPDFUpdate(id);

function readDevState() {
    return JSON.parse(fs.readFileSync('devstate.json'));
}

function writeDevState(data) {
    fs.writeFileSync('devstate.json', JSON.stringify(data));
}

async function ingestPDFLink(link) {
    let state = readDevState();
    const linkID = uuid.v4();
    const file = fs.createWriteStream(`./downloads/${linkID}.pdf`);
    const request = https.get(link, function(response) {
        file.on('finish', async function() {
            file.close(async function() {
                const existingPdfBytes = fs.readFileSync(`./downloads/${linkID}.pdf`);
                const pdfDoc = await PDFDocument.PDFDocument.load(existingPdfBytes, {
                    updateMetadata: false
                });

                state[linkID] = {
                    'link': link,
                    'title': pdfDoc.getTitle(),
                    'lastModified': pdfDoc.getModificationDate(),
                };
                writeDevState(state);
            });
        });
        response.pipe(file);
    });
}

async function checkForPDFUpdate(linkID) {
    let state = readDevState();
    const resume = state[linkID];
    const file = fs.createWriteStream(`./downloads/check-${linkID}.pdf`);
    const request = https.get(resume.link, function(response) {
        response.pipe(file);
        file.on('finish', async function() {
            file.close(async function() {
                const existingPdfBytes = fs.readFileSync(`./downloads/check-${linkID}.pdf`);
                const pdfDoc = await PDFDocument.PDFDocument.load(existingPdfBytes, {
                    updateMetadata: false
                });

                if (!(pdfDoc.getTitle() === resume.title && pdfDoc.getModificationDate() === resume.lastModified)) {
                    console.log(pdfDoc.getTitle());
                    console.log(pdfDoc.getModificationDate());
                    console.log('flight risk!')
                }
            });
        });
    });
}
