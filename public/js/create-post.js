document.getElementById('createPostForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const media = document.getElementById('media').files[0];

  const messageElement = document.getElementById('msg');

  messageElement.textContent = '';

  if (!title || !content) {
    messageElement.textContent = "Title and content are required.";
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  if (media) formData.append('media', media);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to create a post.");
      return;
    }

    const response = await axios.post('https://express-backend-sigma.vercel.app/posts/new', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Post creation response:', response);

    if (response && response.data && response.data.post && response.data.post._id) {
      const postId = response.data.post._id;
      window.location.href = `/posts/${postId}`;
    } else {
      messageElement.textContent = 'Unexpected response format. Post not created.';
    }

  } catch (error) {
    console.error('Error creating post:', error);
    messageElement.textContent = error.response?.data?.message || 'An error occurred while creating the post.';
  }
});
