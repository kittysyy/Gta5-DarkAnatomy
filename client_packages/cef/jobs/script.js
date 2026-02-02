let jobsData = null;

function loadJobsData(dataJson) {
    try {
        jobsData = JSON.parse(dataJson);
        renderJobs();
    } catch (err) {
        console.error('Ошибка:', err);
    }
}

function renderJobs() {
    const container = document.getElementById('jobsList');
    container.innerHTML = '';
    
    if (!jobsData?.jobs) return;
    
    jobsData.jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.onclick = () => openJob(job.id);
        
        card.innerHTML = `
            <div class="job-header">
                <div class="job-icon">${job.icon}</div>
                <div class="job-title">
                    <h3>${job.name}</h3>
                    <div class="rank">${job.bonus?.description || 'Новичок'}</div>
                </div>
                <div class="job-level">Ур. ${job.level}</div>
            </div>
            <div class="job-progress">
                <div class="job-progress-fill" style="width: ${job.expProgress}%"></div>
            </div>
            <div class="job-stats">
                <span>Выполнено: ${job.totalCompleted}</span>
                <span>Заработано: $${job.totalEarned.toLocaleString()}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function openJob(jobId) {
    mp.trigger('cef:openJobDetails', jobId);
}

function closeMenu() {
    mp.trigger('cef:closeJobsMenu');
}

document.addEventListener('DOMContentLoaded', () => {
    mp.trigger('cef:jobsReady');
});