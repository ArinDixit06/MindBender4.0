document.addEventListener('DOMContentLoaded', () => {
    const registerSchoolForm = document.getElementById('register-school-form');
    const messageDiv = document.getElementById('message');

    if (registerSchoolForm) {
        registerSchoolForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const school_name = registerSchoolForm.elements['school-name'].value;
            const domain_name = registerSchoolForm.elements['domain-name'].value;
            const admin_email = registerSchoolForm.elements['admin-email'].value;
            const description = registerSchoolForm.elements['description'].value;
            const logo_url = registerSchoolForm.elements['logo-url'].value;
            const subscription_tier = registerSchoolForm.elements['subscription-tier'].value;

            const payload = {
                school_name,
                domain_name,
                admin_email,
                description,
                logo_url,
                subscription_tier
            };

            try {
                const response = await fetch('/api/schools/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('School registered successfully! Redirecting to admin dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = '/admin_dashboard.html'; // Redirect to admin dashboard
                    }, 2000);
                } else {
                    showMessage(data.error || 'School registration failed.', 'error');
                }
            } catch (error) {
                console.error('Error during school registration:', error);
                showMessage('An error occurred during school registration.', 'error');
            }
        });
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
});
