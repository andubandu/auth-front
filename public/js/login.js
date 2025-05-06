if (localStorage.getItem('token')) {
    window.location.href = '/';
  }
  
  const loginBtn = document.getElementById('login');
  
  loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    if (!username || !password) {
      Toastify({
        text: "Please fill in both fields.",
        duration: 3000,
        backgroundColor: "#FF6347", 
        close: true,
        gravity: "top",
        position: "right",
      }).showToast();
      return;
    }
  
    axios.post('https://express-backend-sigma.vercel.app/auth/login', { username, password })
      .then(res => {
        const { token, user } = res.data;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          Toastify({
            text: "Login successful! Redirecting...",
            duration: 3000,
            backgroundColor: "#4CAF50",
            close: true,
            gravity: "top",
            position: "right",
          }).showToast();
          window.location.href = '/dashboard';
        } else {
          Toastify({
            text: "Login failed.",
            duration: 3000,
            backgroundColor: "#FF6347",
            close: true,
            gravity: "top",
            position: "right",
          }).showToast();
        }
      })
      .catch(err => {
        Toastify({
          text: err.response?.data?.message || 'An error occurred during login.',
          duration: 3000,
          backgroundColor: "#FF6347", 
          close: true,
          gravity: "top",
          position: "right",
        }).showToast();
      });
  });
  