document.addEventListener('DOMContentLoaded', () => {
    const addEntryForm = document.getElementById('add-entry-form');
    const bankNameInput = document.getElementById('bank-name');
    const investmentTypeInput = document.getElementById('investment-type');
    const transactionDateInput = document.getElementById('transaction-date');
    const valueInput = document.getElementById('value');
    const formMessage = document.getElementById('form-message');
    const totalBalanceEl = document.getElementById('total-balance');
    const tableBody = document.querySelector('#data-table tbody');
    const logoutBtn = document.getElementById('logout-btn');
    const chartDateFilter = document.getElementById('chart-date-filter');
    const tableDateFilter = document.getElementById('table-date-filter');

    let chartInstance = null;
    let evolutionChartInstance = null;
    let allData = []; // Store all data globally for filtering

    // --- Tabs Switching ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const dateFilterContainer = document.querySelector('.date-filter-container'); // To hide/show in Evolution tab

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Handle specific visibility (like Date Filter)
            if (tabId === 'tab-evolution') {
                if(dateFilterContainer) dateFilterContainer.style.display = 'none';
                updateEvolutionChart(allData); // Render chart when tab is opened
            } else {
                if(dateFilterContainer) dateFilterContainer.style.display = 'block';
            }
        });
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });

    // --- Filter Chart ---
    chartDateFilter.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        updateChart(allData, selectedDate);
    });

    // --- Filter Table ---
    if (tableDateFilter) {
        tableDateFilter.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            renderTable(allData, selectedDate);
        });
    }

    // --- Load Data ---
    loadData();

    async function loadData() {
        try {
            const response = await fetch('/api/bank-data');
            if (response.status === 401) {
                window.location.href = '/';
                return;
            }
            const data = await response.json();
            allData = data; // Save to global variable
            updateUI(data);
            populateDateFilter(data); // Populate filter options
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    // --- Add Entry ---
    addEntryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            bank_name: bankNameInput.value,
            investment_type: investmentTypeInput.value,
            transaction_date: transactionDateInput.value,
            value: valueInput.value
        };

        try {
            const response = await fetch('/api/bank-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Clear form
                bankNameInput.value = '';
                investmentTypeInput.value = '';
                transactionDateInput.value = '';
                valueInput.value = '';
                formMessage.textContent = 'Adicionado com sucesso!';
                formMessage.className = 'message success';
                setTimeout(() => { formMessage.textContent = ''; }, 3000);
                
                loadData(); // Reload all data
            } else {
                const err = await response.json();
                formMessage.textContent = err.error || 'Erro ao adicionar.';
                formMessage.className = 'message error';
            }
        } catch (error) {
            console.error('Error adding entry:', error);
            formMessage.textContent = 'Erro de conexão.';
            formMessage.className = 'message error';
        }
    });

    // --- Delete Entry ---
    window.deleteEntry = async (id) => {
        if (!confirm('Tem certeza que deseja remover este registro?')) return;

        try {
            const response = await fetch(`/api/bank-data/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadData();
            } else {
                alert('Erro ao remover registro.');
            }
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    // --- Edit Entry ---
    window.editEntry = async (id, currentValue) => {
        const newValueStr = prompt('Digite o novo valor:', currentValue);
        if (newValueStr === null) return; // Cancelado pelo usuário

        const newValue = parseFloat(newValueStr);
        if (isNaN(newValue)) {
            alert('Valor inválido! Por favor, insira um número.');
            return;
        }

        try {
            const response = await fetch(`/api/bank-data/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: newValue })
            });

            if (response.ok) {
                loadData();
            } else {
                const err = await response.json();
                alert(err.error || 'Erro ao atualizar registro.');
            }
        } catch (error) {
            console.error('Error updating:', error);
            alert('Erro de conexão.');
        }
    };

    // --- Duplicate Entry (New Action) ---
    window.duplicateEntry = (bankName, investmentType) => {
        // Pre-fill form with existing data
        bankNameInput.value = bankName;
        investmentTypeInput.value = investmentType;
        
        // Clear date and value for new entry
        transactionDateInput.value = '';
        valueInput.value = '';
        
        // Scroll to form
        document.querySelector('.left-col').scrollIntoView({ behavior: 'smooth' });
        
        // Focus on date input after scroll
        setTimeout(() => {
            transactionDateInput.focus();
            
            // Show helper message
            formMessage.textContent = 'Dados copiados! Informe a nova data e valor.';
            formMessage.className = 'message'; // Neutral/Info style if defined, or just default
            // If no neutral style, use success but maybe adding a specific class would be better. 
            // Reuse success for visibility for now or just text.
            formMessage.style.color = '#3498db'; // Blue for info
            
            setTimeout(() => { 
                formMessage.textContent = ''; 
                formMessage.style.color = '';
            }, 5000);
        }, 500);
    };

    // --- Update UI (Table, Total, Chart) ---
    function updateUI(data) {
        // 1. Update Table
        const currentTableFilter = tableDateFilter ? tableDateFilter.value : 'all';
        renderTable(data, currentTableFilter);

        // 2. Update Total (Most Recent Day Only)
        let total = 0;
        
        // Find most recent date from all data
        const dates = data
            .map(e => e.transaction_date || (e.created_at ? e.created_at.split('T')[0] : null))
            .filter(d => d)
            .sort()
            .reverse();

        if (dates.length > 0) {
            const mostRecentDate = dates[0];
            // Sum only entries from that date
            data.forEach(entry => {
                const entryDate = entry.transaction_date || (entry.created_at ? entry.created_at.split('T')[0] : null);
                if (entryDate === mostRecentDate) {
                    total += entry.value;
                }
            });
        }

        totalBalanceEl.textContent = formatCurrency(total);

        // 3. Update Chart
        // Use current filter value if any, or 'all'
        const currentFilter = chartDateFilter ? chartDateFilter.value : 'all';
        updateChart(data, currentFilter);
        
        // Update Evolution Chart if visible (or just prep data)
        // We only render it if the tab is active to save resources, or we can update it always.
        // Let's check if the tab is active.
        const evolutionTab = document.getElementById('tab-evolution');
        if (evolutionTab.classList.contains('active')) {
            updateEvolutionChart(data);
        }
    }

    function renderTable(data, filterDate = 'all') {
        tableBody.innerHTML = '';
        
        let filteredData = data;
        if (filterDate !== 'all') {
            filteredData = data.filter(entry => {
                const entryDate = entry.transaction_date || (entry.created_at ? entry.created_at.split('T')[0] : '');
                return entryDate === filterDate;
            });
        }

        // Sort by newest first (using transaction_date)
        const sortedData = [...filteredData].sort((a, b) => {
            const dateA = new Date(a.transaction_date || a.created_at);
            const dateB = new Date(b.transaction_date || b.created_at);
            return dateB - dateA;
        });

        if (sortedData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum registro encontrado para esta data.</td></tr>';
            return;
        }

        sortedData.forEach(entry => {
            // Escape single quotes for inline JS to prevent syntax errors
            const safeBank = String(entry.bank_name).replace(/'/g, "\\'");
            const safeType = String(entry.investment_type).replace(/'/g, "\\'");

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(entry.transaction_date)}</td>
                <td>${entry.bank_name}</td>
                <td>${entry.investment_type}</td>
                <td>${formatCurrency(entry.value)}</td>
                <td>
                    <button class="btn btn-new" style="padding: 5px 10px; font-size: 0.8rem;" onclick="duplicateEntry('${safeBank}', '${safeType}')">Novo</button>
                    <button class="btn btn-edit" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editEntry('${entry.id}', ${entry.value})">Editar</button>
                    <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteEntry('${entry.id}')">Excluir</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function populateDateFilter(data) {
        const dates = new Set();
        data.forEach(entry => {
            const date = entry.transaction_date || (entry.created_at ? entry.created_at.split('T')[0] : null);
            if (date) {
                dates.add(date);
            }
        });

        // Convert to array and sort descending (newest first)
        const sortedDates = Array.from(dates).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB - dateA;
        });

        // Helper to populate a select element
        const populateSelect = (selectElement) => {
            if (!selectElement) return;
            
            // Save current selection to restore it if possible
            const currentSelection = selectElement.value;

            // Reset options
            selectElement.innerHTML = '';

            sortedDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = formatDate(date);
                selectElement.appendChild(option);
            });

            // Restore selection if it still exists
            if (sortedDates.includes(currentSelection)) {
                selectElement.value = currentSelection;
            } else if (sortedDates.length > 0) {
                // Default to newest date if 'all' or invalid was selected
                selectElement.value = sortedDates[0];
            }
        };

        populateSelect(chartDateFilter);
        populateSelect(tableDateFilter);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';

        // Check for YYYY-MM-DD format (standard ISO date part)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }

        // Try parsing other formats (e.g., GMT strings)
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            // Use UTC to avoid timezone shifts since the input likely has time info or is GMT
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
        }

        return dateString;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function updateChart(data, filterDate = 'all') {
        const ctx = document.getElementById('investmentsChart').getContext('2d');
        
        // Filter data if a specific date is selected
        let filteredData = data;
        if (filterDate !== 'all') {
            filteredData = data.filter(entry => {
                const entryDate = entry.transaction_date || (entry.created_at ? entry.created_at.split('T')[0] : '');
                return entryDate === filterDate;
            });
        }

        // Group by Investment Type
        const totalsByType = {};
        filteredData.forEach(entry => {
            if (!totalsByType[entry.investment_type]) {
                totalsByType[entry.investment_type] = 0;
            }
            totalsByType[entry.investment_type] += entry.value;
        });

        const labels = Object.keys(totalsByType);
        const values = Object.values(totalsByType);

        // Destroy previous chart if exists
        if (chartInstance) {
            chartInstance.destroy();
        }

        // If no data for this filter, show empty chart or keep destroyed
        if (labels.length === 0) {
            // Optional: Draw an empty chart or message
            return; 
        }

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
                        '#1abc9c', '#34495e', '#e67e22', '#7f8c8d', '#c0392b'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function updateEvolutionChart(data) {
        const ctx = document.getElementById('evolutionChart').getContext('2d');
        
        // 1. Get all unique dates (sorted ascending for X-axis)
        const datesSet = new Set();
        data.forEach(entry => {
            const date = entry.transaction_date || (entry.created_at ? entry.created_at.split('T')[0] : null);
            if (date) datesSet.add(date);
        });
        const dates = Array.from(datesSet).sort(); // Oldest to newest

        if (dates.length === 0) return;

        // 2. Get all unique investment types
        const typesSet = new Set();
        data.forEach(entry => typesSet.add(entry.investment_type));
        const types = Array.from(typesSet);

        // 3. Build Datasets
        // We need one dataset per type.
        // For each type, we need an array of values corresponding to the 'dates' array.
        
        // Color palette helper
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#7f8c8d', '#c0392b'
        ];

        const datasets = types.map((type, index) => {
            const dataPoints = dates.map(date => {
                // Sum values for this type on this specific date
                const entries = data.filter(e => {
                    const eDate = e.transaction_date || (e.created_at ? e.created_at.split('T')[0] : null);
                    return eDate === date && e.investment_type === type;
                });
                
                return entries.reduce((sum, e) => sum + e.value, 0);
            });

            return {
                label: type,
                data: dataPoints,
                backgroundColor: colors[index % colors.length],
                stack: 'Stack 0'
            };
        });

        // Destroy previous chart
        if (evolutionChartInstance) {
            evolutionChartInstance.destroy();
        }

        evolutionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(formatDate), // Format dates for display
                datasets: datasets
            },
            plugins: [{
                id: 'displayTotals',
                afterDatasetsDraw: (chart) => {
                    const { ctx, scales: { x, y } } = chart;
                    
                    ctx.save();
                    ctx.font = 'bold 11px "Segoe UI", sans-serif';
                    ctx.fillStyle = '#2c3e50';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    if (chart.data.datasets.length === 0) return;
                    const count = chart.data.datasets[0].data.length;

                    for (let i = 0; i < count; i++) {
                        let sum = 0;
                        chart.data.datasets.forEach(dataset => {
                            sum += dataset.data[i] || 0;
                        });

                        if (sum > 0) {
                            const xPos = x.getPixelForValue(i);
                            const yPos = y.getPixelForValue(sum);
                            
                            const text = new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(sum);

                            ctx.fillText(text, xPos, yPos - 5);
                        }
                    }
                    ctx.restore();
                }
            }],
            options: {
                layout: {
                    padding: {
                        top: 25
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)'
                        }
                    }
                }
            }
        });
    }
});
