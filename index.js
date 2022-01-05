'use strict';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

const http = require('http');
const fs = require('fs');

function readDevState() {
    return JSON.parse(fs.readFileSync('devstate.json'));
}

function writeDevState(data) {
    fs.writeFileSync('devstate.json', JSON.stringify(data));
}

function ingestPDFLink(link) {
    let state = readDevState();
    const linkID = uuidv4();
    const file = fs.createWriteStream(`./downloads/${linkID}.pdf`);
    const request = http.get(link, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
          });
    });

    const existingPdfBytes = fs.readFile('./downloads/${linkID}.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes, {
        updateMetadata: false
    });

    state[linkID] = {
        'link': link,
        'title': pdfDoc.getTitle(),
        'lastModified': pdfDoc.getModificationDate(),
    };
    writeDevState(state);
}

function checkForPDFUpdate(linkID) {
    let state = readDevState();
    const resume = state[linkID];
    const file = fs.createWriteStream(`./downloads/check-${linkID}.pdf`);
    const request = http.get(resume.link, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
          });
    });

    const existingPdfBytes = fs.readFile('./downloads/check-${linkID}.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes, {
        updateMetadata: false
    });

    if (!(pdfDoc.getTitle() === resume.title && pdfDoc.getModificationDate() === resume.lastModified)) {
        console.log('flight risk!')
    }
}
