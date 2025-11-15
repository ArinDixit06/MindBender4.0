document.addEventListener('DOMContentLoaded', async () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    console.log(data.message);
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentSchool');
                    window.location.href = '/login.html';
                } else {
                    alert(data.message || 'Logout failed.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    const userListDiv = document.getElementById('user-list');

    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
            if (response.status === 403) {
                userListDiv.innerHTML = '<p>Access Denied: You do not have administrative privileges.</p>';
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return;
        }
        const { users } = await response.json();

        if (users.length === 0) {
            userListDiv.innerHTML = '<p>No users found.</p>';
            return;
        }

        // All styling is now in style.css
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>XP</th>
                    <th>Level</th>
                    <th>School ID</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');

        users.forEach(user => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.xp}</td>
                <td>${user.level}</td>
                <td>${user.school_id || 'N/A'}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
            `;
        });
        userListDiv.innerHTML = '';
        userListDiv.appendChild(table);

    } catch (error) {
        console.error('Error fetching users:', error);
        userListDiv.innerHTML = `<p>Error loading users: ${error.message}</p>`;
    }
});