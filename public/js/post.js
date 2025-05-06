document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('token');
    let currentUserId = null;
  
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.id;
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  
    const commentElements = document.querySelectorAll('[id^="commentActions-"]');
    commentElements.forEach(el => {
      const commentId = el.id.split('-')[1];
      const authorId = document.getElementById(`commentAuthor-${commentId}`).dataset.authorId;
      if (currentUserId && currentUserId === authorId) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  
    const postAuthorId = "<%= post.author._id %>";
    if (!(currentUserId && currentUserId === postAuthorId)) {
      document.getElementById('postActions').style.display = 'none';
    }
  
    const likeButton = document.getElementById('likeButton');
    const likeCountElement = document.getElementById('likeCount');
    const postId = "<%= post._id %>";
  
    likeButton.addEventListener('click', async () => {
      if (!token) {
        alert('You need to be logged in to like a post');
        return;
      }
      try {
        const likeResponse = await fetch(`https://express-backend-sigma.vercel.app/likes/${postId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        if (likeResponse.ok) {
          const countRes = await fetch(`https://express-backend-sigma.vercel.app/likes?postId=${postId}&number=true`);
          const data = await countRes.json();
          likeCountElement.textContent = data.count;
        } else {
          alert('Failed to like the post');
        }
      } catch (err) {
        console.error(err);
        alert('Error liking post');
      }
    });
  
    const commentSection = document.getElementById('comment-section');
    if (token) {
      commentSection.innerHTML = `
        <h3>Add a Comment</h3>
        <textarea id="commentContent" rows="3" placeholder="Write your comment here..."></textarea><br>
        <button id="submitComment" class="btn btn-primary">Post Comment</button>
        <p id="commentMsg" style="color:red; margin-top:5px;"></p>
      `;
  
      document.getElementById('submitComment').addEventListener('click', async () => {
        const content = document.getElementById('commentContent').value.trim();
        const commentMsg = document.getElementById('commentMsg');
        if (!content) {
          commentMsg.textContent = 'Comment cannot be empty.';
          return;
        }
  
        try {
          const res = await fetch(`https://express-backend-sigma.vercel.app/comments/${postId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
          });
  
          if (res.ok) {
            location.reload();
          } else {
            const err = await res.json();
            commentMsg.textContent = err.error || 'Failed to post comment.';
          }
        } catch (err) {
          console.error(err);
          commentMsg.textContent = 'Error posting comment.';
        }
      });
    }
  });
  
  function openEditModal() {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editMsg').textContent = '';
  }
  function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
  }
  async function submitEditPost() {
    const token = localStorage.getItem('token');
    const postId = "<%= post._id %>";
    const title = document.getElementById('editTitle').value.trim();
    const content = document.getElementById('editContent').value.trim();
    const mediaFile = document.getElementById('editMedia').files[0];
    const msg = document.getElementById('editMsg');
  
    if (!title && !content && !mediaFile) {
      msg.textContent = 'At least one field must be updated.';
      return;
    }
  
    if (!token) {
      msg.textContent = 'You must be logged in to edit the post.';
      return;
    }
  
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (content) formData.append('content', content);
    if (mediaFile) formData.append('media', mediaFile);
  
    try {
      const res = await fetch(`https://express-backend-sigma.vercel.app/posts/upd/${postId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
  
      if (res.ok) {
        location.reload();
      } else {
        const err = await res.json();
        msg.textContent = err.error || 'Failed to update post.';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = 'Error updating post.';
    }
  }
  
  function openDeleteModal() {
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteMsg').textContent = '';
  }
  function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
  }
  async function confirmDeletePost() {
    const token = localStorage.getItem('token');
    const postId = "<%= post._id %>";
    const msg = document.getElementById('deleteMsg');
  
    if (!token) {
      msg.textContent = 'You must be logged in to delete the post.';
      return;
    }
  
    try {
      const res = await fetch(`https://express-backend-sigma.vercel.app/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (res.ok) {
        window.location.href = '/';
      } else {
        const err = await res.json();
        msg.textContent = err.error || 'Failed to delete post.';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = 'Error deleting post.';
    }
  }
  
  async function startEdit(commentId) {
    const element = document.getElementById(`commentAuthor-${commentId}`).closest('.comment-card');
    const contentPara = element.querySelector('p');
    const oldContent = contentPara.textContent;
    const newContent = prompt('Edit your comment:', oldContent);
    const token = localStorage.getItem('token');
    const postId = "<%= post._id %>";
  
    if (newContent !== null && token) {
      try {
        const res = await fetch(`https://express-backend-sigma.vercel.app/comments/${postId}/${commentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: newContent })
        });
  
        if (res.ok) {
          contentPara.textContent = newContent;
        } else {
          alert('Failed to update comment');
        }
      } catch (err) {
        console.error(err);
        alert('Error updating comment');
      }
    }
  }
  
  async function deleteComment(postId, commentId) {
    const confirmDelete = confirm('Are you sure you want to delete this comment?');
    const token = localStorage.getItem('token');
  
    if (confirmDelete && token) {
      try {
        const res = await fetch(`https://express-backend-sigma.vercel.app/comments/${postId}/${commentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        if (res.ok) {
          document.getElementById(`commentAuthor-${commentId}`).closest('.comment-card').remove();
        } else {
          alert('Failed to delete comment');
        }
      } catch (err) {
        console.error(err);
        alert('Error deleting comment');
      }
    }
  }