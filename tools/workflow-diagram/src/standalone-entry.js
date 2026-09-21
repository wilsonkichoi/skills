import { mountStandalone } from './standalone.js';
const data = JSON.parse(document.getElementById('diagram-data').textContent);
mountStandalone(document.getElementById('diagram'), data);
