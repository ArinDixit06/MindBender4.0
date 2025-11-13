// Use relative URLs for session management - cookies will be sent automatically
const API_URL = ""; // Use empty string for relative URLs

document.addEventListener('DOMContentLoaded', async () => {
    const resourceUploadSection = document.getElementById('resource-upload-section');
    const resourceUploadForm = document.getElementById('resource-upload-form');
    const resourceListDiv = document.getElementById('resource-list');
    const resourceSearchInput = document.getElementById('resource-search-input');
    const searchResourcesBtn = document.getElementById('search-resources-btn');

    // Header elements for user and school info
    const schoolNameElement = document.getElementById('school-name');
    const schoolLogoElement = document.getElementById('school-logo');
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');

    let currentUser = null;
    let currentSchool = null;

    // Function to check session and redirect if unauthorized
    async function checkSession() {
        try {
            const res = await fetch('/api/me', {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });

            if (!res.ok) {
                window.location.href = "login.html";
                return null;
            }
            const data = await res.json();
            currentUser = data.user;
            currentSchool = data.school;
            return data;
        } catch (error) {
            console.error("Session check failed:", error);
            window.location.href = "login.html";
            return null;
        }
    }

    const sessionData = await checkSession();
    if (!sessionData) return;

    // Update header with user and school info
    if (currentSchool) {
        schoolNameElement.textContent = currentSchool.school_name;
        if (currentSchool.logo_url) {
            schoolLogoElement.src = currentSchool.logo_url;
            schoolLogoElement.style.display = 'inline-block';
        }
    } else {
        schoolNameElement.textContent = 'Individual Learner';
    }

    userNameElement.textContent = currentUser.name;
    userRoleElement.textContent = currentUser.role;

    // Show/hide upload section based on user role
    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        resourceUploadSection.style.display = 'block';
    } else {
        resourceUploadSection.style.display = 'none';
    }

    // Fetch and render resources
    async function fetchAndRenderResources(searchQuery = '') {
        resourceListDiv.innerHTML = '<p>Loading resources...</p>';
        try {
            const url = searchQuery ? `${API_URL}/api/resources?q=${encodeURIComponent(searchQuery)}` : `${API_URL}/api/resources`;
            const res = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const { resources } = await res.json();
            renderResources(resources);
        } catch (error) {
            console.error("Error fetching resources:", error);
            resourceListDiv.innerHTML = '<p>Failed to load resources. Please try again.</p>';
        }
    }

    function renderResources(resources) {
        resourceListDiv.innerHTML = '';
        if (resources.length === 0) {
            resourceListDiv.innerHTML = '<p>No resources found for your school.</p>';
            return;
        }
        resources.forEach(resource => {
            const resourceCard = document.createElement('div');
            resourceCard.classList.add('resource-card');
            resourceCard.innerHTML = `
                <h3>${resource.title}</h3>
                <p>Type: ${resource.type}</p>
                <p>Uploaded by: ${resource.uploaded_by_name || 'N/A'}</p>
                <a href="${resource.url}" target="_blank" class="resource-btn">View Resource</a>
                ${(currentUser.user_id === resource.uploaded_by || currentUser.role === 'admin') ?
                    `<button class="delete-resource-btn" data-id="${resource.resource_id}">Delete</button>` : ''}
            `;
            resourceListDiv.appendChild(resourceCard);
        });

        document.querySelectorAll('.delete-resource-btn').forEach(button => {
            button.addEventListener('click', event => {
                const resourceId = event.target.dataset.id;
                deleteResource(resourceId);
            });
        });
    }

    // Handle resource upload form submission
    if (resourceUploadForm) {
        resourceUploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = resourceUploadForm.elements['resource-title'].value;
            const url = resourceUploadForm.elements['resource-url'].value;
            const type = resourceUploadForm.elements['resource-type'].value;

            try {
                const response = await fetch(`${API_URL}/api/resources`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ title, url, type }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Resource uploaded successfully!');
                    resourceUploadForm.reset();
                    fetchAndRenderResources(); // Refresh the list
                } else {
                    alert(data.error || 'Failed to upload resource.');
                }
            } catch (error) {
                console.error('Error uploading resource:', error);
                alert('An error occurred during resource upload.');
            }
        });
    }

    // Handle resource deletion
    async function deleteResource(resourceId) {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/resources/${resourceId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                alert('Resource deleted successfully!');
                fetchAndRenderResources(); // Refresh the list
            } else {
                alert(data.error || 'Failed to delete resource.');
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
            alert('An error occurred during resource deletion.');
        }
    }

    // Handle resource search
    if (searchResourcesBtn) {
        searchResourcesBtn.addEventListener('click', () => {
            const searchQuery = resourceSearchInput.value.trim();
            fetchAndRenderResources(searchQuery);
        });
    }

    // Logout functionality
    document.querySelectorAll('.logout-link').forEach(el => el.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });

            if (res.ok) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentSchool');
                window.location.href = "login.html";
            } else {
                const data = await res.json();
                alert("Logout failed: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout error: " + error.message);
        }
    }));

    // Initial fetch of resources
    fetchAndRenderResources();
});
