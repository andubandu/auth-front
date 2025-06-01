require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const axios = require('axios');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
// app.use(express.static('public'));
app.use(cookieParser());

async function getCurrentUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;

    const response = await fetch('https://express-backend-sigma.vercel.app/users/currentProfile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Failed to fetch current user:', err);
    return null;
  }
}

function checkAdminOrModerator(req, res, next) {
  getCurrentUser(req).then(user => {
    if (user && user.roles && (user.roles[0] === 'admin' || user.roles[0] === 'moderator')) {
      next();
    } else {
      res.status(403).render('error', { message: 'Access denied' });
    }
  }).catch(() => {
    res.status(403).render('error', { message: 'Access denied' });
  });
}


app.get('/support', async (req, res) => {
    res.status(200).render('support', { discordwh: process.env.DISCORD_WEBHOOK });
});



app.get('/', async (req, res) => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.redirect('/login');
  }

  if (user.status === 'active' || user.status === 'verified') {
    return res.status(200).render('index', { user });
  }

  return res.redirect('/not-approved');
});

app.get('/not-approved', async (req, res) => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.redirect('/login');
  }

  if (user.status === 'active' || user.status === 'verified') {
    return res.redirect('/dashboard');
  }

  const messages = {
    permaban: "Your account has been permanently banned.",
    tempban: "Your account has been temporarily banned. You will be able to access your account after 1 week.",
    restricted: "Your account is restricted. You can view posts and comments, but cannot create new ones.",
  };

  const message = messages[user.status] || "Your account has been moderated or is awaiting approval.";

  res.status(403).render('not-approved', { message });
});

app.get('/admin-panel', checkAdminOrModerator, async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(403).render('error', { message: 'Access denied' });

    const usersResponse = await fetch('https://express-backend-sigma.vercel.app/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Failed fetching users:', errorText);
      return res.status(usersResponse.status).render('error', { message: 'Failed to load users' });
    }

    const users = await usersResponse.json();

    const profileResponse = await fetch('https://express-backend-sigma.vercel.app/users/currentProfile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Failed fetching current user:', errorText);
      return res.status(profileResponse.status).render('error', { message: 'Failed to load current user' });
    }

    const currentUser = await profileResponse.json();

    res.render('adminpanel', { users, currentUser });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading admin panel' });
  }
});




app.get('/profile/:username', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || (user.status !== 'active' && user.status !== 'verified')) {
    return res.redirect('/not-approved');
  }

  try {
    const profileRes = await fetch(`https://express-backend-sigma.vercel.app/users/by-user/${req.params.username}`);
    const profile = await profileRes.json();

    const postsRes = await fetch(`https://express-backend-sigma.vercel.app/posts`);
    const postsJson = await postsRes.json();

    const filteredPosts = postsJson.filter(post => post.author && post.author.username === req.params.username);

    if (profile && profile.username) {
      res.status(200).render('profile', { profile, posts: filteredPosts });
    } else {
      res.status(404).render('error', { message: 'Profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading profile' });
  }
});

app.get('/posts/:id', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || (user.status !== 'active' && user.status !== 'verified')) {
    return res.redirect('/not-approved');
  }

  const postId = req.params.id;
  try {
    const postRes = await fetch(`https://express-backend-sigma.vercel.app/posts/${postId}`);
    const post = await postRes.json();

    const commentsRes = await fetch(`https://express-backend-sigma.vercel.app/comments/${postId}`);
    const comments = await commentsRes.json();

    const likesRes = await fetch(`https://express-backend-sigma.vercel.app/likes?postId=${postId}&number=true`);
    const likesData = await likesRes.json();
    const likeCount = likesData.count || 0;

    res.status(200).render('post', { post, comments, likeCount });
  } catch (err) {
    console.error('Failed to fetch post, comments, or likes:', err);
    res.status(500).render('error', { message: 'Error loading post' });
  }
});

app.get('/login', async (req, res) => {
  const user = await getCurrentUser(req);
  if (req.cookies?.token) {
    return res.redirect('/dashboard');
  }
  if (user && (user.status === 'active' || user.status === 'verified')) {
    return res.redirect('/dashboard');
  }
  res.status(200).render('login');
});

app.get('/signup', async (req, res) => {
  if (req.cookies?.token) {
    return res.redirect('/dashboard');
  }
  const user = await getCurrentUser(req);
  if (user && (user.status === 'active' || user.status === 'verified')) {
    return res.redirect('/dashboard');
  }
  res.status(200).render('signup');
});

app.get('/dashboard', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || (user.status !== 'active' && user.status !== 'verified')) {
    return res.redirect('/not-approved');
  }
  res.status(200).render('dashboard', { user });
});

app.get('/create', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || (user.status !== 'active' && user.status !== 'verified')) {
    return res.redirect('/not-approved');
  }
  res.status(200).render('create-post', { user });
});

app.get('*', (req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
