document.addEventListener('DOMContentLoaded', async () => {
    // Function to check session and redirect if unauthorized
    async function checkSession() {
        try {
            const res = await fetch('/api/me', {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });

            if (!res.ok) {
                // If session is not valid, redirect to login page
                window.location.href = "login.html";
                return null;
            }
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Session check failed:", error);
            window.location.href = "login.html"; // Redirect on network error
            return null;
        }
    }

    const sessionData = await checkSession();
    if (!sessionData) return;

    const { user, school } = sessionData;

    // Update header with user and school info if elements exist
    const schoolNameElement = document.getElementById('school-name');
    const schoolLogoElement = document.getElementById('school-logo');
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const profileUserNameElement = document.getElementById('profile-user-name');
    const profileUserRoleElement = document.getElementById('profile-user-role');

    if (school) {
        if (schoolNameElement) schoolNameElement.textContent = school.school_name;
        if (schoolLogoElement && school.logo_url) {
            schoolLogoElement.src = school.logo_url;
            schoolLogoElement.style.display = 'inline-block';
        }
    } else {
        if (schoolNameElement) schoolNameElement.textContent = 'Individual Learner';
    }

    if (userNameElement) userNameElement.textContent = user.name;
    if (userRoleElement) userRoleElement.textContent = user.role;
    if (profileUserNameElement) profileUserNameElement.textContent = user.name;
    if (profileUserRoleElement) profileUserRoleElement.textContent = user.role;

    // Logout functionality
    document.querySelectorAll('.logout-link').forEach(el => el.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/logout', {
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

    // Role-based redirection if user lands on index.html (moved from script.js)
    if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        if (user.role === 'teacher') {
            window.location.href = 'teacher_dashboard.html';
            return;
        } else if (user.role === 'admin') {
            window.location.href = 'admin_dashboard.html';
            return;
        } else if (user.role === 'student') {
            window.location.href = 'student_dashboard.html';
            return;
        }
    }
});
