async function fetchPosts() {
    const postsContainer = document.getElementById('posts');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    try {
        const response = await fetch('https://express-backend-sigma.vercel.app/posts');
        const posts = await response.json();

        const validPosts = posts.filter(post =>
            post.author && post.author.username && post.author.username.trim() !== ''
        );

        if (validPosts.length === 0) {
            postsContainer.innerHTML = '<h3>No posts available</h3>';
            return;
        }

        const postsWithLikes = await Promise.all(validPosts.map(async (post) => {
            let likeCount = 0;
            let isLikedByUser = false;

            try {
                const likesCountRes = await fetch(`https://express-backend-sigma.vercel.app/likes?postId=${post._id}&number=true`);
                const likesCountData = await likesCountRes.json();
                likeCount = typeof likesCountData.count === 'number' ? likesCountData.count : 0;

                if (currentUser) {
                    const likesListRes = await fetch(`https://express-backend-sigma.vercel.app/likes?postId=${post._id}`);
                    const likesListData = await likesListRes.json();
                    isLikedByUser = likesListData.likes.some(like => like.userId === currentUser.id || like.userId === currentUser._id);
                }
            } catch (err) {
                console.error(`Failed to fetch likes for post ${post._id}`, err);
            }

            return { ...post, likeCount, isLikedByUser };
        }));

        postsContainer.innerHTML = postsWithLikes.map(post => {
            let mediaHTML = '';

            if (post.media && post.media.url && post.media.type) {
                if (post.media.type === 'video') {
                    mediaHTML = `
                        <video controls style="max-width: 100%; height: auto;">
                            <source src="${post.media.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
                } else if (post.media.type === 'image') {
                    mediaHTML = `
                        <img src="${post.media.url}" alt="Post Media" style="max-width: 100%; height: auto;" />
                    `;
                }
            }
            

            const likeBtnClass = post.isLikedByUser ? 'like-button liked' : 'like-button';

            return `
                <div class="post" id="${post._id}">
                    <a href="/posts/${post._id}"><h1>${post.title}</h1></a>
                    <p>${post.content}</p>

                    <div class="author-info">
                        <img src="${post.author.avatar}" alt="Avatar of ${post.author.username}" />
                        <a href="/profile/${post.author.username}"><span>${post.author.username}</span></a>
                    </div>

                    <p>${new Date(post.createdAt).toLocaleDateString()}</p>

                    <div class="media">${mediaHTML}</div>

                    <button class="${likeBtnClass}" data-id="${post._id}">👍 ${post.likeCount}</button>
                </div>
            `;
        }).join('');

        attachLikeButtonHandlers();

    } catch (error) {
        console.error('Error fetching posts:', error);
        postsContainer.innerHTML = '<h3>Failed to load posts</h3>';
    }
}

function attachLikeButtonHandlers() {
    const buttons = document.querySelectorAll('.like-button');
    const token = localStorage.getItem('token');

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.dataset.id;
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;

            if (!token || !currentUser) {
                showToast('You need to be logged in to like a post', '#ff6b6b');
                return;
            }

            button.disabled = true; 

            try {
                const response = await fetch(`https://express-backend-sigma.vercel.app/likes/${postId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const [countRes, listRes] = await Promise.all([
                        fetch(`https://express-backend-sigma.vercel.app/likes?postId=${postId}&number=true`),
                        fetch(`https://express-backend-sigma.vercel.app/likes?postId=${postId}`)
                    ]);

                    const countData = await countRes.json();
                    const listData = await listRes.json();

                    const updatedCount = typeof countData.count === 'number' ? countData.count : 0;
                    const isLikedByUser = listData.likes.some(like => like.userId === currentUser.id || like.userId === currentUser._id);

                    button.textContent = `👍 ${updatedCount}`;
                    button.classList.toggle('liked', isLikedByUser);

                    showToast(isLikedByUser ? 'Post liked' : 'Disliked post', isLikedByUser ? '#28a745' : '#ff6b6b');
                } else {
                    showToast('Failed to like/dislike post', '#ff6b6b');
                }

            } catch (error) {
                console.error('Error liking/unliking post:', error);
                showToast('An error occurred', '#ff6b6b');
            } finally {
                button.disabled = false;
            }
        });
    });
}

function showToast(message, bgColor = "#333") {
    Toastify({
        text: message,
        duration: 2000,
        gravity: "top",
        position: "right",
        backgroundColor: bgColor
    }).showToast();
}


function getState() {
    const btns = document.getElementById('btns');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    if (!token || !userData) {
        btns.innerHTML = `
            <a href="/login">Login</a>
            <a href="/signup">Signup</a>
        `;
    } else {
        btns.innerHTML = `
        <a href="/create">Create Post</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/profile/${userData.username}">Your Profile</a>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getState();
    fetchPosts();
});
