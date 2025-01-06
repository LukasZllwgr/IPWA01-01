// EventListener: "Dynamisiert" Seite
document.addEventListener('DOMContentLoaded', () => {
    const userLanguage = navigator.language || navigator.userLanguage;
    const htmlElement = document.documentElement;

    //Auslesen der beiden Filter-Werte
    const countryFilter = document.getElementById('countryFilter');
    const companyFilter = document.getElementById('companyFilter');

    // Event-Listener für die Filter-Eingabefelder
    countryFilter.addEventListener('input', () => {
        filterTable('countryTable', 0, sanitizeInput(countryFilter.value.toUpperCase()));
    });

    companyFilter.addEventListener('input', () => {
        filterTable('companyTable', 0, sanitizeInput(companyFilter.value.toUpperCase()));
    });

    // Event-Listener für alle Tabellen mit der Klasse 'sortable'
    document.querySelectorAll('.sortable').forEach(headerCell => {
        headerCell.addEventListener('click', () => {
        const table = headerCell.closest('table');
        const columnIndex = headerCell.dataset.columnIndex;
        const type = headerCell.dataset.type;
    
        sortTable(table.id, columnIndex, type);
        });
    });

    // Dynamische Anpassung der Schriftkultur basierend auf der Benutzer-Sprache
    // Liste kann erweitert werden
    if (userLanguage.startsWith('ar') || userLanguage.startsWith('he')) {
        htmlElement.dir = 'rtl';  // Rechts-nach-links Schriftkultur (z.B. Arabisch, Hebräisch)
    } else {
        htmlElement.dir = 'ltr';  // Links-nach-rechts Schriftkultur (westl. Sprachen)
    }

    // Navigation ein- und ausklappen
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('expanded');
    });

    // Funktion zur Eingabesicherung (Code-Injection)
    function sanitizeInput(input) {
        const element = document.createElement('div');
        element.innerText = input;
        return element.innerHTML;
    }

    // Filterfunktion für Tabellen
    window.filterTable = (tableId, colIndex, filter) => {
        // Prüfen, ob ein Filterwert übergeben wurde.
        if (filter === undefined){
            // Warnmeldung nur für Testzwecke. --> auskommentieren
            //console.log("Filterwert ist undefined")
        } else {
            const debouncedFilter = debounce(filterTable, 300); // 300ms Wartezeit
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`Tabelle mit der ID "${tableId}" nicht gefunden.`);
            return;
        }

        // Überprüfen, ob der Filterwert nur aus Leerzeichen besteht
        if (filter.trim() === '') {
            // Keine Filterung durchführen
            return;
        }
    
        const rows = table.getElementsByTagName('tr');

        try {
            const regex = new RegExp(filter.trim(), 'i');
            for (let i = 1; i < rows.length; i++) {
                const cell = rows[i].getElementsByTagName('td')[colIndex];
                if (cell) {
                    const cellText = cell.textContent || cell.innerText;
                    rows[i].style.display = regex.test(cellText) ? '' : 'none';
                }
            }
        }catch (error){
            console.error("Fehler beim Erstellen des regulären Ausdrucks:", error)
        }
        }
    };

    // Funktion zum Laden der Excel-Datei
    // try Catch: Abfangen von Problem bei Laden der Inputfile
    // Da Inputfile fehleranfällig ist, sind Dummy-Werte hinterlegt.
    // Vorgang wird im Log dokumentiert
    async function loadExcelData() {
        try {
            console.log('Versuche, die Excel-Datei zu laden...');
            // Laden der Excel-Datei
            const response = await fetch(Daten_Website.xlsx); // Pfad zur Excel-Datei
            console.log('Antwortstatus:', response.status);
            if (!response.ok) throw new Error('Netzwerkantwort war nicht ok');
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });

            // Auslesen der Daten aus den Arbeitsblättern "Country" und "Company"
            const countrySheet = workbook.Sheets['Country'];
            const companySheet = workbook.Sheets['Company'];
            const countryData = XLSX.utils.sheet_to_json(countrySheet);
            const companyData = XLSX.utils.sheet_to_json(companySheet);

            console.log('Country-Daten:', countryData);
            console.log('Company-Daten:', companyData);

            // Aktualisieren der Tabellen mit Daten aus Inputfile
            updateTable('countryTable', countryData);
            updateTable('companyTable', companyData);

            // Anzeige der Infobox mit dem Datum/Uhrzeit der letzten Dateispeicherung Inputfile
            const fileDate = new Date(response.headers.get('Last-Modified'));
            const infobox = document.getElementById('infobox');
            infobox.textContent = `Daten aktualisiert. Stand: ${fileDate.toLocaleString('de-DE')}`;
            infobox.style.display = 'block';
        } catch (error) {
            console.error('Fehler beim Laden der Excel-Datei:', error);
            // Anzeige der Infobox bei Fehler
            const infobox = document.getElementById('infobox');
            infobox.textContent = 'Aktualisierung der Daten nicht möglich. Verwende statische Daten.';
            infobox.style.display = 'block';
        }
    }

    // Funktion zum Aktualisieren der Tabellen
    function updateTable(tableId, data) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = ''; // Entfernen der aktuellen Zeilen

        data.forEach(item => {
            const row = table.insertRow();
            Object.values(item).forEach(text => {
                const cell = row.insertCell();
                cell.textContent = text;
            });
        });
    }

    // Laden der Excel-Daten beim Laden der Seite
    loadExcelData();
});

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Sortierfunktion für Tabellen
function sortTable(tableId, columnIndex, type) {
    const table = document.getElementById(tableId);

    if (!table) {
        console.error(`Tabelle mit der ID '${tableId}' nicht gefunden.`);
        return;
    }else{
        console.log(table);
    }

    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);
    const arrows = table.querySelectorAll('.sort-arrow');
    
    // Überprüfen, ob columnIndex innerhalb des gültigen Bereichs liegt
    const sortableColumns = table.querySelectorAll('.sortable');
    if (columnIndex >= sortableColumns.length) {
        console.error(`Ungültiger Spaltenindex: ${columnIndex}`);
        return; // Beenden der Funktion, wenn der Index ungültig ist
    }

    // Prüfe, ob Sortierung möglich ist
    if (table.querySelectorAll('.sortable')[columnIndex]===undefined){
        //console.log("Fehler");
        return;
    }
    const headerArrow = table.querySelectorAll('.sortable')[columnIndex].querySelector('.sort-arrow');
    let direction = headerArrow.innerHTML === '▲' ? 'desc' : 'asc';

    // Sortieren
    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();

        const numA = Number(cellA);
        const numB = Number(cellB);

        if (type === 'number' && !isNaN(numA) && !isNaN(numB)) {
            return direction === 'asc' ? numA - numB : numB - numA;
        } else {
            return direction === 'asc' 
                ? cellA.localeCompare(cellB) 
                : cellB.localeCompare(cellA); 
        }
    });

    console.log("Sortierung registriert.", columnIndex, direction)

    // Aktualisiere die Tabelle
    tbody.innerHTML = '';
    tbody.append(...rows);

    // Aktualisiere Sortierpfeile
    arrows.forEach(arrow => arrow.innerHTML = '▼');
    headerArrow.innerHTML = direction === 'asc' ? '▲' : '▼';
}
