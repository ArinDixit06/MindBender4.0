document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupRoleSelect = document.getElementById('signup-role');
    const studentSpecificFields = document.getElementById('student-specific-fields');

    // Function to toggle student-specific fields based on role selection
    if (signupRoleSelect) {
        signupRoleSelect.addEventListener('change', () => {
            if (signupRoleSelect.value === 'student') {
                studentSpecificFields.style.display = 'block';
                studentSpecificFields.querySelectorAll('input, select').forEach(field => field.required = true);
            } else {
                studentSpecificFields.style.display = 'none';
                studentSpecificFields.querySelectorAll('input, select').forEach(field => field.required = false);
            }
        });
        // Initial check for student-specific fields display
        if (signupRoleSelect.value === 'student') {
            studentSpecificFields.style.display = 'block';
            studentSpecificFields.querySelectorAll('input, select').forEach(field => field.required = true);
        } else {
            studentSpecificFields.style.display = 'none';
            studentSpecificFields.querySelectorAll('input, select').forEach(field => field.required = false);
        }
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = loginForm.elements['login-email'].value;
            const password = loginForm.elements['login-password'].value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Login successful:', data);
                    // Store user and school info in localStorage or session storage
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    if (data.school) {
                        localStorage.setItem('currentSchool', JSON.stringify(data.school));
                    } else {
                        localStorage.removeItem('currentSchool'); // Clear school info if not available (e.g., for new admin)
                    }
                    window.location.href = data.redirect || '/index.html'; // Redirect based on server response
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred during login.');
            }
        });
    }

    // Handle Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = signupForm.elements['signup-name'].value;
            const email = signupForm.elements['signup-email'].value;
            const password = signupForm.elements['signup-password'].value;
            const role = signupForm.elements['signup-role'].value;

            const payload = { name, email, password, role };

            // Add student-specific fields if role is student
            if (role === 'student') {
                payload.rollno = signupForm.elements['rollno'].value;
                payload.grade = signupForm.elements['grade'].value;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Signup successful:', data);
                    alert(data.message || 'Registration successful! Please log in.');
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        window.location.href = '/login.html'; // Default redirect
                    }
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert('An error occurred during registration.');
            }
        });
    }
});
