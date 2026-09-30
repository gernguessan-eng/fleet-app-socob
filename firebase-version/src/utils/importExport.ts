// Alias attendus par le module Sinistres : les fonctions existent déjà dans excelIO.ts,
// on les réexporte sous les noms utilisés par ce module (aucune duplication de code).
export { getCell, parseAmount, exportRowsToExcel, readTabularFile as parseSpreadsheetFile } from './excelIO';
