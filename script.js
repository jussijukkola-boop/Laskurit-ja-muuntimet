function loadCalculator() {
    const calculatorSelect = document.getElementById('calculator-select').value;
    const calculatorContent = document.getElementById('calculator-content');
    calculatorContent.innerHTML = '<p>Ladataan...</p>';

    switch (calculatorSelect) {
        case 'dn-converter':
            calculatorContent.innerHTML = `
                <h2>DN-muunnin</h2>
                <label for="input-select">Valitse arvo:</label>
                <select id="input-select" onchange="updateResults()">
                    <option value="">-- Valitse arvo --</option>
                </select>
                <div id="result">
                    <h3>Tulokset:</h3>
                    <p id="result-output">Tulos: -</p>
                </div>
                <script>
                    let dnData = [];
                    function loadDNCSV() {
                        Papa.parse('data.csv', {
                            download: true,
                            header: true,
                            delimiter: ';',
                            complete: function(results) {
                                dnData = results.data;
                                populateDropdowns();
                            }
                        });
                    }
                    function populateDropdowns() {
                        const inputSelect = document.getElementById('input-select');
                        inputSelect.innerHTML = '<option value="">-- Valitse arvo --</option>';
                        dnData.forEach(row => {
                            const option = document.createElement('option');
                            option.value = row.Input;
                            option.textContent = row.Input;
                            inputSelect.appendChild(option);
                        });
                    }
                    function updateResults() {
                        const inputSelect = document.getElementById('input-select').value;
                        let selectedRow = dnData.find(row => row.Input === inputSelect);
                        document.getElementById('result-output').textContent = selectedRow ? \`Tulos: \${selectedRow.Output}\` : 'Tulos: -';
                    }
                    window.onload = loadDNCSV;
                </script>
            `;
            break;

        case 'margin-calculator':
            calculatorContent.innerHTML = `
                <h2>Kate-laskuri</h2>
                <label for="input-prices">Liitä ostohinnat (yksi hinta per rivi, esim.:<pre>345\n3456\n34367</pre>)</label>
                <textarea id="input-prices" rows="6" cols="50" placeholder="Liitä hinnat Excelistä"></textarea><br>
                <label for="margin-input">Syötä kateprosentti (esim. 20,5):</label>
                <input type="number" id="margin-input" step="0.1" min="0" placeholder="Syötä kate %"><br>
                <button onclick="calculatePrices()">Laske myyntihinnat</button>
                <div id="result">
                    <h3>Tulokset:</h3>
                    <table id="price-table">
                        <thead>
                            <tr><th>Ostohinta (€)</th><th>Myyntihinta (€)</th></tr>
                        </thead>
                        <tbody id="price-table-body"></tbody>
                    </table>
                    <label for="output-prices">Myyntihinnat (kopioi Exceliin):</label>
                    <textarea id="output-prices" rows="6" cols="50" readonly></textarea><br>
                    <button onclick="copyToClipboard()">Kopioi myyntihinnat</button>
                    <p id="total-margin">Kokonaiskate: - €</p>
                </div>
                <script>
                    function calculatePrices() {
                        const inputPrices = document.getElementById('input-prices').value.trim();
                        const marginPercent = parseFloat(document.getElementById('margin-input').value);
                        const outputPrices = document.getElementById('output-prices');
                        const totalMargin = document.getElementById('total-margin');
                        const priceTableBody = document.getElementById('price-table-body');

                        if (!inputPrices || isNaN(marginPercent) || marginPercent < 0) {
                            outputPrices.value = '';
                            totalMargin.textContent = 'Kokonaiskate: - €';
                            priceTableBody.innerHTML = '';
                            return;
                        }

                        const prices = inputPrices.split('\n').map(price => parseFloat(price.replace(',', '.'))).filter(price => !isNaN(price));
                        if (prices.length === 0) {
                            outputPrices.value = '';
                            totalMargin.textContent = 'Kokonaiskate: - €';
                            priceTableBody.innerHTML = '';
                            return;
                        }

                        const marginMultiplier = 1 + (marginPercent / 100);
                        const outputPricesArray = prices.map(price => (price * marginMultiplier).toFixed(2).replace('.', ','));
                        const totalMarginValue = prices.reduce((sum, price) => sum + (price * (marginPercent / 100)), 0);

                        priceTableBody.innerHTML = '';
                        prices.forEach((price, index) => {
                            const row = document.createElement('tr');
                            row.innerHTML = \`<td>\${price.toFixed(2).replace('.', ',')}</td><td>\${outputPricesArray[index]}</td>\`;
                            priceTableBody.appendChild(row);
                        });

                        outputPrices.value = outputPricesArray.join('\n');
                        totalMargin.textContent = \`Kokonaiskate: \${totalMarginValue.toFixed(2).replace('.', ',')} €\`;
                    }

                    function copyToClipboard() {
                        const outputPrices = document.getElementById('output-prices');
                        outputPrices.select();
                        document.execCommand('copy');
                        alert('Myyntihinnat kopioitu leikepöydälle!');
                    }
                </script>
            `;
            break;

        case 'flange-compatibility':
            calculatorContent.innerHTML = `
                <h2>Laippa-yhteensopivuuslaskuri</h2>
                <label for="dn-select">Valitse DN-koko:</label>
                <select id="dn-select" onchange="updatePNOptions()">
                    <option value="">-- Valitse DN --</option>
                </select><br>
                <label for="pn1-select">Valitse ensimmäinen PN-luokka:</label>
                <select id="pn1-select" onchange="checkCompatibility()">
                    <option value="">-- Valitse PN --</option>
                </select><br>
                <label for="pn2-select">Valitse toinen PN-luokka:</label>
                <select id="pn2-select" onchange="checkCompatibility()">
                    <option value="">-- Valitse PN --</option>
                </select><br>
                <div id="result">
                    <h3>Tulos:</h3>
                    <p id="compatibility-result">Yhteensopivuus: -</p>
                    <table id="flange-table">
                        <thead>
                            <tr>
                                <th>Laippa</th><th>DN</th><th>PN</th><th>Laipan halkaisija (mm)</th><th>PCD (mm)</th><th>Reikien määrä</th><th>Pultinreiän halkaisija (mm)</th>
                            </tr>
                        </thead>
                        <tbody id="flange-table-body"></tbody>
                    </table>
                </div>
                <script>
                    let flangeData = [];
                    function loadFlangeCSV() {
                        Papa.parse('flange_data.csv', {
                            download: true,
                            header: true,
                            delimiter: ';',
                            complete: function(results) {
                                flangeData = results.data;
                                populateDNOptions();
                            }
                        });
                    }
                    function populateDNOptions() {
                        const dnSelect = document.getElementById('dn-select');
                        const dnValues = [...new Set(flangeData.map(row => row.DN))].sort((a, b) => parseInt(a) - parseInt(b));
                        dnSelect.innerHTML = '<option value="">-- Valitse DN --</option>';
                        dnValues.forEach(dn => {
                            const option = document.createElement('option');
                            option.value = dn;
                            option.textContent = dn;
                            dnSelect.appendChild(option);
                        });
                    }
                    function updatePNOptions() {
                        const dnSelect = document.getElementById('dn-select').value;
                        const pn1Select = document.getElementById('pn1-select');
                        const pn2Select = document.getElementById('pn2-select');
                        pn1Select.innerHTML = '<option value="">-- Valitse PN --</option>';
                        pn2Select.innerHTML = '<option value="">-- Valitse PN --</option>';
                        if (dnSelect) {
                            const pnValues = flangeData.filter(row => row.DN === dnSelect).map(row => row.PN).sort();
                            pnValues.forEach(pn => {
                                const option1 = document.createElement('option');
                                option1.value = pn;
                                option1.textContent = pn;
                                pn1Select.appendChild(option1);
                                const option2 = document.createElement('option');
                                option2.value = pn;
                                option2.textContent = pn;
                                pn2Select.appendChild(option2);
                            });
                        }
                        checkCompatibility();
                    }
                    function checkCompatibility() {
                        const dnSelect = document.getElementById('dn-select').value;
                        const pn1Select = document.getElementById('pn1-select').value;
                        const pn2Select = document.getElementById('pn2-select').value;
                        const compatibilityResult = document.getElementById('compatibility-result');
                        const flangeTableBody = document.getElementById('flange-table-body');
                        flangeTableBody.innerHTML = '';
                        compatibilityResult.textContent = 'Yhteensopivuus: -';
                        if (!dnSelect || !pn1Select || !pn2Select) return;
                        const flange1 = flangeData.find(row => row.DN === dnSelect && row.PN === pn1Select);
                        const flange2 = flangeData.find(row => row.DN === dnSelect && row.PN === pn2Select);
                        if (!flange1 || !flange2) {
                            compatibilityResult.textContent = 'Yhteensopivuus: Tietoja ei löydy';
                            return;
                        }
                        const row1 = document.createElement('tr');
                        row1.innerHTML = \`<td>Laippa 1</td><td>\${flange1.DN}</td><td>\${flange1.PN}</td><td>\${flange1.Flange_Diameter}</td><td>\${flange1.PCD}</td><td>\${flange1.Holes}</td><td>\${flange1.Hole_Diameter}</td>\`;
                        const row2 = document.createElement('tr');
                        row2.innerHTML = \`<td>Laippa 2</td><td>\${flange2.DN}</td><td>\${flange2.PN}</td><td>\${flange2.Flange_Diameter}</td><td>\${flange2.PCD}</td><td>\${flange2.Holes}</td><td>\${flange2.Hole_Diameter}</td>\`;
                        flangeTableBody.appendChild(row1);
                        flangeTableBody.appendChild(row2);
                        let compatibilityIssues = [];
                        if (flange1.PCD !== flange2.PCD) compatibilityIssues.push(\`PCD eroaa (\${flange1.PCD} mm vs. \${flange2.PCD} mm)\`);
                        if (flange1.Holes !== flange2.Holes) compatibilityIssues.push(\`Reikien määrä eroaa (\${flange1.Holes} vs. \${flange2.Holes})\`);
                        if (flange1.Hole_Diameter !== flange2.Hole_Diameter) compatibilityIssues.push(\`Pultinreiän halkaisija eroaa (\${flange1.Hole_Diameter} mm vs. \${flange2.Hole_Diameter} mm)\`);
                        if (flange1.Flange_Diameter !== flange2.Flange_Diameter) compatibilityIssues.push(\`Laipan halkaisija eroaa (\${flange1.Flange_Diameter} mm vs. \${flange2.Flange_Diameter} mm)\`);
                        if (compatibilityIssues.length === 0) {
                            compatibilityResult.textContent = \`Yhteensopivuus: Laipat (\${flange1.DN} \${flange1.PN} ja \${flange2.DN} \${flange2.PN}) ovat yhteensopivia\`;
                        } else {
                            compatibilityResult.textContent = \`Yhteensopivuus: Laipat eivät ole yhteensopivia, koska: \${compatibilityIssues.join(', ')}\`;
                        }
                    }
                    window.onload = loadFlangeCSV;
                </script>
            `;
            break;

        default:
            calculatorContent.innerHTML = '<p>Valitse laskuri alasvetovalikosta.</p>';
            break;
    }
}

window.onload = loadCalculator;
