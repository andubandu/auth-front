let currentUserId = null;

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (!token || !userStr) {
  Toastify({
    text: "Not logged in. Redirecting to login.",
    duration: 3000, 
    backgroundColor: "#FF6347", 
    close: true,
    gravity: "top",
    position: "right",
  }).showToast();
  window.location.href = '/login';
}

const user = JSON.parse(userStr);
currentUserId = user.id || user._id;

document.getElementById('info').innerHTML = `
  <p><strong>Username:</strong> ${user.username}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <img src="${user.avatar}" alt="avatar" width="100">
`;

axios.get('https://express-backend-sigma.vercel.app/users/currentProfile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => {
  const freshUser = res.data;
  document.getElementById('info').innerHTML = `
    <p><strong>Username:</strong> ${freshUser.username}</p>
    <p><strong>Email:</strong> ${freshUser.email}</p>
    <img src="${freshUser.avatar}" alt="avatar" width="100">
  `;
  localStorage.setItem('user', JSON.stringify(freshUser));
  currentUserId = freshUser.id || freshUser._id;
})
.catch(err => {
  console.warn('Could not refresh profile:', err);
  Toastify({
    text: "Error fetching profile. Please try again later.",
    duration: 3000,
    backgroundColor: "#FF6347",
    close: true,
    gravity: "top", 
    position: "right",
  }).showToast();
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

async function updateProfile(event) {
  event.preventDefault();

  const formData = new FormData();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const avatar = document.getElementById('avatar').files[0];

  if (!username && !email && !password && !avatar) {
    Toastify({
      text: "Please provide at least one field to update.",
      duration: 3000,
      backgroundColor: "#FF6347",
      close: true,
      gravity: "top", 
      position: "right",
    }).showToast();
    return;
  }

  if (username) formData.append('username', username);
  if (email) formData.append('email', email);
  if (password) formData.append('password', password);
  if (avatar) formData.append('avatar', avatar);

  try {
    const res = await fetch(`https://express-backend-sigma.vercel.app/users/upd/${currentUserId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      Toastify({
        text: errorData.message || 'Error updating profile.',
        duration: 3000,
        backgroundColor: "#FF6347", 
        close: true,
        gravity: "top", 
        position: "right",
      }).showToast();
      return;
    }

    const updatedUser = await res.json();
    localStorage.setItem('user', JSON.stringify(updatedUser));
    Toastify({
      text: "Profile updated successfully!",
      duration: 3000,
      backgroundColor: "#4CAF50", 
      close: true,
      gravity: "top",
      position: "right",
    }).showToast();
    window.location.reload();

  } catch (err) {
    console.error('Error updating profile:', err);
    Toastify({
      text: 'An error occurred while updating your profile.',
      duration: 3000,
      backgroundColor: "#FF6347",
      close: true,
      gravity: "top", 
      position: "right",
    }).showToast();
  }
}

document.getElementById('updateForm').addEventListener('submit', updateProfile);

function createModal({ title, message, confirmText, cancelText, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';

  const box = document.createElement('div');
  box.style.background = 'white';
  box.style.padding = '2rem';
  box.style.borderRadius = '12px';
  box.style.maxWidth = '400px';
  box.style.width = '90%';
  box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  box.style.textAlign = 'center';

  const titleEl = document.createElement('h2');
  titleEl.textContent = title;
  titleEl.style.marginBottom = '1rem';
  titleEl.style.color = '#b91c1c';

  const msgEl = document.createElement('p');
  msgEl.textContent = message;
  msgEl.style.marginBottom = '2rem';

  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.justifyContent = 'space-between';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = cancelText;
  cancelBtn.style.background = '#e2e8f0';
  cancelBtn.style.color = '#334e68';
  cancelBtn.style.padding = '0.5rem 1rem';
  cancelBtn.style.borderRadius = '6px';
  cancelBtn.style.border = 'none';
  cancelBtn.style.cursor = 'pointer';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = confirmText;
  confirmBtn.style.background = '#e02424';
  confirmBtn.style.color = 'white';
  confirmBtn.style.padding = '0.5rem 1rem';
  confirmBtn.style.borderRadius = '6px';
  confirmBtn.style.border = 'none';
  confirmBtn.style.cursor = 'pointer';

  btns.appendChild(cancelBtn);
  btns.appendChild(confirmBtn);
  box.appendChild(titleEl);
  box.appendChild(msgEl);
  box.appendChild(btns);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  cancelBtn.onclick = () => document.body.removeChild(overlay);
  confirmBtn.onclick = () => {
    document.body.removeChild(overlay);
    onConfirm();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  };
}

function confirmDeleteAccount() {
  createModal({
    title: "Confirm Account Deletion",
    message: "Are you sure you want to permanently delete your account? This action CANNOT be undone.",
    confirmText: "DO IT!!",
    cancelText: "Cancel",
    onConfirm: async () => {
      try {
        const res = await fetch(`https://express-backend-sigma.vercel.app/users/del/${currentUserId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorData = await res.json();
          Toastify({
            text: errorData.message || 'Error deleting account.',
            duration: 3000,
            backgroundColor: "#FF6347",
            close: true,
            gravity: "top", 
            position: "right",
          }).showToast();
          return;
        }

        Toastify({
          text: "Your account has been deleted.",
          duration: 3000,
          backgroundColor: "#FF6347", 
          close: true,
          gravity: "top",
          position: "right",
        }).showToast();
        logout();

      } catch (err) {
        console.error('Error deleting account:', err);
        Toastify({
          text: 'An error occurred while deleting your account.',
          duration: 3000,
          backgroundColor: "#FF6347", 
          close: true,
          gravity: "top", 
          position: "right",
        }).showToast();
      }
    }
  });
}
