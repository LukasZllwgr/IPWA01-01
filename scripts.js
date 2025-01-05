document.addEventListener('DOMContentLoaded', () => {
    const userLanguage = navigator.language || navigator.userLanguage;
    const htmlElement = document.documentElement;

    // Dynamische Anpassung der Schriftkultur basierend auf der Benutzer-Sprache
    if (userLanguage.startsWith('ar') || userLanguage.startsWith('he')) {
        htmlElement.dir = 'rtl';  // Rechts-nach-links Schriftkultur (z.B. Arabisch, Hebräisch)
    } else {
        htmlElement.dir = 'ltr';  // Links-nach-rechts Schriftkultur (z.B. Deutsch, Englisch)
    }

    // Navigation ein- und ausklappen
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('expanded');
    });

    // Funktion zur Eingabesicherung
    function sanitizeInput(input) {
        const element = document.createElement('div');
        element.innerText = input;
        return element.innerHTML;
    }

    // Filterfunktion für Tabellen
    window.filterTable = (tableId, colIndex) => {
        const table = document.getElementById(tableId);
        const input = document.querySelector(`#${tableId} input`);
        const filter = sanitizeInput(input ? input.value.toUpperCase() : '');
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const cell = rows[i].getElementsByTagName('td')[colIndex];
            if (cell) {
                const cellText = cell.textContent || cell.innerText;
                rows[i].style.display = cellText.toUpperCase().includes(filter) ? '' : 'none';
            }
        }
    };

    // Sortierfunktion für Tabellen
    window.sortTable = (tableId, columnIndex, type) => {
        const table = document.getElementById(tableId);
        const arrows = table.querySelectorAll('.sort-arrow');
        let switching = true;
        let shouldSwitch;
        let direction = 'asc'; 
        let switchCount = 0;
        const headerArrow = table.querySelector(`thead th:nth-child(${columnIndex + 1}) .sort-arrow`);
        
        // Bestimmen der aktuellen Sortierrichtung und umschalten
        if (headerArrow.innerHTML === '▲') {
            direction = 'desc';
        } else {
            direction = 'asc';
        }
        
        while (switching) {
            switching = false;
            const rows = table.rows;
            
            for (let i = 1; i < rows.length - 1; i++) {
                shouldSwitch = false;
                const x = rows[i].getElementsByTagName('TD')[columnIndex];
                const y = rows[i + 1].getElementsByTagName('TD')[columnIndex];
                
                if (direction === 'asc') {
                    if (type === 'number') {
                        if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
                            shouldSwitch = true;
                            break;
                        }
                    } else {
                        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                            shouldSwitch = true;
                            break;
                        }
                    }
                } else if (direction === 'desc') {
                    if (type === 'number') {
                        if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
                            shouldSwitch = true;
                            break;
                        }
                    } else {
                        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                            shouldSwitch = true;
                            break;
                        }
                    }
                }
            }
            
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                switchCount++;
            } else {
                if (switchCount === 0 && direction === 'asc') {
                    direction = 'desc';
                    switching = true;
                }
            }
        }
        
        // Sortierpfeil aktualisieren
        arrows.forEach(arrow => arrow.innerHTML = '▼');
        if (direction === 'asc') {
            headerArrow.innerHTML = '▲';
        } else {
            headerArrow.innerHTML = '▼';
        }
    };

    // Funktion zum Laden der Excel-Datei
    async function loadExcelData() {
        try {
            console.log('Versuche, die Excel-Datei zu laden...');
            // Laden der Excel-Datei
            const response = await fetch('Daten_Website.xlsx'); // Pfad zur Excel-Datei
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

            // Aktualisieren der Tabellen
            updateTable('countryTable', countryData);
            updateTable('companyTable', companyData);

            // Anzeige der Infobox mit dem Dateistempel
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