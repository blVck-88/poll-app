// Initialize data storage in memory (localStorage not available in this environment)
        let pollData = [];
        let selectedCandidate = null;

        function showTab(tab) {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tab + '-section').classList.add('active');
            
            if (tab === 'dashboard') {
                updateDashboard();
            }
        }

        function selectCandidate(candidate) {
            document.querySelectorAll('.candidate-option').forEach(opt => opt.classList.remove('selected'));
            event.target.closest('.candidate-option').classList.add('selected');
            selectedCandidate = candidate;
            document.getElementById('candidate').value = candidate;
        }

        document.getElementById('pollForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!selectedCandidate) {
                alert('Please select a candidate');
                return;
            }

            const formData = new FormData(this);
            const pollEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                location: formData.get('location'),
                event: formData.get('event'),
                interviewer: formData.get('interviewer'),
                age: formData.get('age'),
                gender: formData.get('gender'),
                candidate: formData.get('candidate'),
                notes: formData.get('notes')
            };

            pollData.push(pollEntry);
            
            document.getElementById('success-alert').style.display = 'block';
            this.reset();
            selectedCandidate = null;
            document.querySelectorAll('.candidate-option').forEach(opt => opt.classList.remove('selected'));
            
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

            // Update stats
            document.getElementById('total-polls').textContent = pollData.length;
            
            const uniqueLocations = [...new Set(pollData.map(p => p.location))];
            document.getElementById('locations-count').textContent = uniqueLocations.length;

            // Calculate leading candidate
            const candidateCounts = pollData.reduce((acc, poll) => {
                acc[poll.candidate] = (acc[poll.candidate] || 0) + 1;
                return acc;
            }, {});
            
            const leadingCandidate = Object.keys(candidateCounts).reduce((a, b) => 
                candidateCounts[a] > candidateCounts[b] ? a : b
            );
            document.getElementById('leading-candidate').textContent = `Candidate ${leadingCandidate}`;

            // Update charts
            updateCandidateChart(candidateCounts);
            updateAgeChart();
            updateLocationChart();
        }

        function updateCandidateChart(candidateCounts) {
            const ctx = document.getElementById('candidateChart').getContext('2d');
            
            if (window.candidateChart) {
                window.candidateChart.destroy();
            }
            
            window.candidateChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(candidateCounts).map(c => `Candidate ${c}`),
                    datasets: [{
                        data: Object.values(candidateCounts),
                        backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
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

        function updateAgeChart() {
            const ageCounts = pollData.reduce((acc, poll) => {
                acc[poll.age] = (acc[poll.age] || 0) + 1;
                return acc;
            }, {});

            const ctx = document.getElementById('ageChart').getContext('2d');
            
            if (window.ageChart) {
                window.ageChart.destroy();
            }
            
            window.ageChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(ageCounts),
                    datasets: [{
                        label: 'Respondents',
                        data: Object.values(ageCounts),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
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

            const headers = ['ID', 'Timestamp', 'Location', 'Event', 'Interviewer', 'Age', 'Gender', 'Candidate', 'Notes'];
            const csvContent = [
                headers.join(','),
                ...pollData.map(poll => [
                    poll.id,
                    poll.timestamp,
                    `"${poll.location}"`,
                    `"${poll.event}"`,
                    `"${poll.interviewer}"`,
                    poll.age,
                    poll.gender,
                    poll.candidate,
                    `"${poll.notes || ''}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `election_poll_data_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }

        function clearAllData() {
            if (confirm('Are you sure you want to clear all poll data? This cannot be undone.')) {
                pollData = [];
                updateDashboard();
                alert('All data cleared successfully');
            }
        }

        // Initialize dashboard on load
        updateDashboard();