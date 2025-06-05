// Initialize in-memory storage
let pollData = JSON.parse(localStorage.getItem('pollData') || '[]'); // Load from localStorage
let selectedCandidate = null;

// Switch between tabs (e.g., form vs dashboard)
function showTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-section`).classList.add('active');

    if (tab === 'dashboard') updateDashboard();
}

// Handle candidate selection
function selectCandidate(candidate) {
    document.querySelectorAll('.candidate-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.candidate-option').classList.add('selected');

    selectedCandidate = candidate;
    document.getElementById('candidate').value = candidate;
}

// Handle form submission
document.getElementById('pollForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Ensure a candidate is selected (if applicable)
    const candidateInput = document.getElementById('candidate');
    if (candidateInput && !candidateInput.value) {
        alert('Please select a candidate.');
        return;
    }

    const formData = new FormData(this);
    const pollEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        location: formData.get('location'),
        event: formData.get('event'),
        interviewer: formData.get('interviewer'),
        age_group: formData.get('age_group'),
        gender: formData.get('gender'),
        vote_today: formData.get('vote_today'),
        vote_confidence: formData.get('vote_confidence'),
        likely_winner: formData.get('likely_winner'),
        most_visible: formData.get('most_visible'),
        understand_agenda: formData.get('understand_agenda'),
        most_likely_help: formData.get('most_likely_help'),
        attended: formData.getAll('attended[]'),
        received_comms: formData.getAll('received_comms[]'),
        registered: formData.get('registered'),
        top_issue: formData.get('top_issue'),
        other_issue: formData.get('other_issue'),
        notes: formData.get('notes'),
        candidate: formData.get('vote_today') // <-- Added for analytics
    };

    pollData.push(pollEntry);
    // Persist to localStorage
    localStorage.setItem('pollData', JSON.stringify(pollData));

    // Show success alert
    document.getElementById('success-alert').style.display = 'block';

    // Update dashboard immediately after new data is added
    updateDashboard();  

    // Reset form
    this.reset();
    selectedCandidate = null;
    document.querySelectorAll('.candidate-option').forEach(opt => opt.classList.remove('selected'));

    // Hide alert after 3 seconds
    setTimeout(() => {
        document.getElementById('success-alert').style.display = 'none';
    }, 3000);
});


function updateDashboard() {
    if (pollData.length === 0) {
        document.getElementById('total-polls').textContent = '0';
        document.getElementById('locations-count').textContent = '0';
        document.getElementById('leading-candidate').textContent = '-';
        return;
    }

    // Total responses
    document.getElementById('total-polls').textContent = pollData.length;

    // Unique locations count
    const uniqueLocations = [...new Set(pollData.map(p => p.location))];
    document.getElementById('locations-count').textContent = uniqueLocations.length;

    // Leading candidate logic
    const candidateCounts = pollData.reduce((acc, poll) => {
        if (!poll.candidate) return acc;
        acc[poll.candidate] = (acc[poll.candidate] || 0) + 1;
        return acc;
    }, {});

    const leadingCandidate = Object.entries(candidateCounts).reduce((a, b) => a[1] > b[1] ? a : b, [null, 0])[0];
    document.getElementById('leading-candidate').textContent = leadingCandidate || '-';

    updateCandidateChart(candidateCounts);
    updateAgeChart();
    updateTopIssueChart();
    updateLocationChart(); // Added call to update location chart
}

function updateCandidateChart(candidateCounts) {
    const canvas = document.getElementById('candidateChart');
    if (!canvas) { 
        console.error('[updateCandidateChart] canvas element "candidateChart" not found'); 
        return; 
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) { 
        console.error('[updateCandidateChart] canvas context for "candidateChart" not found'); 
        return; 
    }

    const chart = window.candidateChart;
    console.log('[updateCandidateChart] Function start. Current window.candidateChart:', chart, '- typeof destroy:', chart ? typeof chart.destroy : 'N/A');

    // Check if it's a potentially valid chart object that can be destroyed
    if (chart && typeof chart.destroy === 'function' && chart.ctx && chart.ctx.canvas) {
        console.log('[updateCandidateChart] Valid chart instance found. Attempting destroy...');
        try {
            chart.destroy();
            console.log('[updateCandidateChart] Chart destroyed successfully.');
            window.candidateChart = null; // Explicitly nullify after successful destruction
        } catch (e) {
            console.error('[updateCandidateChart] Error during chart.destroy():', e);
            console.error('[updateCandidateChart] Chart instance at time of error:', chart);
            window.candidateChart = null; // Nullify on error to prevent repeated issues with a bad object
        }
    } else if (chart) {
        // Log if chart exists but doesn't meet all conditions for safe destruction
        console.warn('[updateCandidateChart] Existing chart object found but will not be destroyed. Reasons:');
        console.warn('  - typeof chart.destroy:', typeof chart.destroy, '(should be function)');
        console.warn('  - chart.ctx && chart.ctx.canvas:', !!(chart.ctx && chart.ctx.canvas), '(should be true)');
        // If it's not a function, it's definitely not a chart we can destroy, so nullify it.
        if (typeof chart.destroy !== 'function') {
            console.warn('[updateCandidateChart] window.candidateChart.destroy was not a function. Clearing window.candidateChart.');
            window.candidateChart = null;
        }
    } else {
        console.log('[updateCandidateChart] No existing chart (window.candidateChart is falsy).');
    }

    console.log('[updateCandidateChart] Creating new chart...');
    try {
        window.candidateChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(candidateCounts),
                datasets: [{
                    data: Object.values(candidateCounts),
                    backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
        console.log('[updateCandidateChart] New chart created successfully:', window.candidateChart);
    } catch (e) {
        console.error('[updateCandidateChart] Error creating new chart:', e);
    }
}


function updateAgeChart() {
    const ageCounts = pollData.reduce((acc, poll) => {
        acc[poll.age_group] = (acc[poll.age_group] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('ageChart').getContext('2d');

    if (window.ageChart && typeof window.ageChart.destroy === 'function') {
        window.ageChart.destroy();
    }

    window.ageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageCounts),
            datasets: [{
                label: 'Respondents by Age Group',
                data: Object.values(ageCounts),
                backgroundColor: 'rgba(102, 126, 234, 0.8)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


function updateLocationChart() {
    const locationCounts = pollData.reduce((acc, poll) => {
        if (poll.location) { // Ensure location exists
            acc[poll.location] = (acc[poll.location] || 0) + 1;
        }
        return acc;
    }, {});

    const ctx = document.getElementById('locationChart').getContext('2d');

    if (window.locationChart && typeof window.locationChart.destroy === 'function') {
        window.locationChart.destroy();
    }

    window.locationChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(locationCounts),
            datasets: [{
                data: Object.values(locationCounts),
                backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56', '#36A2EB', '#9966FF', '#FF9F40'] // Example colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateTopIssueChart() {
    const issueCounts = pollData.reduce((acc, poll) => {
        let key = poll.top_issue === 'Other' ? (poll.other_issue || 'Other') : poll.top_issue;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('issueChart').getContext('2d');

    if (window.issueChart && typeof window.issueChart.destroy === 'function') {
        window.issueChart.destroy();
    }

    window.issueChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(issueCounts),
            datasets: [{
                data: Object.values(issueCounts),
                backgroundColor: ['#FFA07A', '#FFD700', '#90EE90', '#87CEFA', '#DDA0DD', '#A9A9A9']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}


function updateLocationChart() {
    const locationCounts = pollData.reduce((acc, poll) => {
        acc[poll.location] = (acc[poll.location] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('locationChart').getContext('2d');

    if (window.locationChart) {
        window.locationChart.destroy();
    }

    window.locationChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(locationCounts),
            datasets: [{
                data: Object.values(locationCounts),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function exportData() {
    if (pollData.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = [
        'ID', 'Timestamp', 'Location', 'Event', 'Interviewer',
        'Age Group', 'Gender', 'Candidate',
        'Top Issue', 'Other Issue', 'Notes'
    ];

    const csvContent = [
        headers.join(','),
        ...pollData.map(poll => [
            poll.id,
            poll.timestamp,
            `"${poll.location}"`,
            `"${poll.event}"`,
            `"${poll.interviewer}"`,
            `"${poll.age_group}"`,
            poll.gender,
            poll.candidate,
            `"${poll.top_issue || ''}"`,
            `"${poll.other_issue || ''}"`,
            `"${poll.notes || ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathioya_poll_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all poll data? This cannot be undone.')) {
        pollData = [];
        localStorage.setItem('pollData', JSON.stringify(pollData)); // Also clear localStorage
        updateDashboard();
        alert('All data cleared successfully');
    }
}

// Initialize dashboard on load
// Call updateDashboard after the DOM is fully loaded to ensure chart canvases are available
document.addEventListener('DOMContentLoaded', (event) => {
    updateDashboard();
});

// Note: pollData is already loaded from localStorage at the top of the script.
// The line `localStorage.setItem('pollData', JSON.stringify(pollData));` was removed from here
// as it's now handled within poll submission and data clearing.
