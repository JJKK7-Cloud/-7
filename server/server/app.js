const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../client/build')));

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.login(username, password, (err, user) => {
    if (err) res.status(500).json({ success: false, message: '服务器错误' });
    else if (!user) res.status(401).json({ success: false, message: '账号或密码错误' });
    else res.json({ success: true, data: user });
  });
});

// 创建用户接口
app.post('/api/create-user', (req, res) => {
  const { username, password } = req.body;
  db.checkUserExists(username, (err, row) => {
    if (err) res.status(500).json({ success: false, message: '服务器错误' });
    else if (row) res.status(400).json({ success: false, message: '账号已存在' });
    else {
      db.createUser(username, password, (err) => {
        if (err) res.status(500).json({ success: false, message: '创建失败' });
        else res.json({ success: true, message: '用户创建成功' });
      });
    }
  });
});

// 获取用户列表
app.get('/api/users', (req, res) => {
  db.getUsers((err, users) => {
    if (err) res.status(500).json({ success: false, message: '服务器错误' });
    else res.json({ success: true, data: users });
  });
});

// 保存菜单
app.post('/api/save-menu', (req, res) => {
  const { userId, type, firstMenu, secondMenus, completed } = req.body;
  db.saveMenu(userId, type, firstMenu, secondMenus, completed, (err) => {
    if (err) res.status(500).json({ success: false, message: '保存失败' });
    else res.json({ success: true, message: '保存成功' });
  });
});

// 获取菜单
app.get('/api/menus/:userId/:type', (req, res) => {
  const { userId, type } = req.params;
  db.getMenus(userId, type, (err, menus) => {
    if (err) res.status(500).json({ success: false, message: '获取失败' });
    else res.json({ success: true, data: menus });
  });
});

// 更新妥投状态
app.post('/api/update-completed', (req, res) => {
  const { menuId, completed } = req.body;
  db.updateCompleted(menuId, completed, (err) => {
    if (err) res.status(500).json({ success: false, message: '更新失败' });
    else res.json({ success: true, message: '更新成功' });
  });
});

// 前端路由 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
