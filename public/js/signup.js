if (localStorage.getItem('token')) {
    window.location.href = '/dashboard';
  }
  
  const signupBtn = document.getElementById('signup');
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatar-preview');
  
  signupBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const avatar = avatarInput.files[0];
  
    if (!username || !email || !password) {
      Toastify({
        text: "Please fill all fields.",
        duration: 3000,
        backgroundColor: "#FF6347",
        close: true,
        gravity: "top",
        position: "right",
      }).showToast();
      return;
    }
  
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (avatar) formData.append('avatar', avatar);
  
    axios.post('https://express-backend-sigma.vercel.app/auth/signup', formData)
      .then(res => {
        const { token, user } = res.data;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          Toastify({
            text: "Signup successful! Redirecting...",
            duration: 3000,
            backgroundColor: "#4CAF50", 
            close: true,
            gravity: "top",
            position: "right",
          }).showToast();
          window.location.href = '/dashboard';
        } else {
          Toastify({
            text: "Signup failed.",
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
          text: err.response?.data?.message || 'An error occurred during signup.',
          duration: 3000,
          backgroundColor: "#FF6347", 
          close: true,
          gravity: "top",
          position: "right",
        }).showToast();
      });
  });
  
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarPreview.src = event.target.result;
        avatarPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
  