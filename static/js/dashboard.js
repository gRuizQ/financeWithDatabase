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
    let allData = []; // Store all data globally for filtering

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

    // --- Update UI (Table, Total, Chart) ---
    function updateUI(data) {
        // 1. Update Table
        const currentTableFilter = tableDateFilter ? tableDateFilter.value : 'all';
        renderTable(data, currentTableFilter);

        // 2. Update Total (Global)
        let total = 0;
        data.forEach(entry => total += entry.value);
        totalBalanceEl.textContent = formatCurrency(total);

        // 3. Update Chart
        // Use current filter value if any, or 'all'
        const currentFilter = chartDateFilter ? chartDateFilter.value : 'all';
        updateChart(data, currentFilter);
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
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(entry.transaction_date)}</td>
                <td>${entry.bank_name}</td>
                <td>${entry.investment_type}</td>
                <td>${formatCurrency(entry.value)}</td>
                <td>
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
        const sortedDates = Array.from(dates).sort().reverse();

        // Helper to populate a select element
        const populateSelect = (selectElement) => {
            if (!selectElement) return;
            
            // Save current selection to restore it if possible
            const currentSelection = selectElement.value;

            // Reset options
            selectElement.innerHTML = '<option value="all">Todos os Dias</option>';

            sortedDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = formatDate(date);
                selectElement.appendChild(option);
            });

            // Restore selection if it still exists
            if (sortedDates.includes(currentSelection)) {
                selectElement.value = currentSelection;
            }
        };

        populateSelect(chartDateFilter);
        populateSelect(tableDateFilter);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
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
});
