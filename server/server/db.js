const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'backlog.db');

// 初始化数据库
const initDB = () => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB connection error:', err.message);
    else console.log('Connected to SQLite DB');
  });

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('admin', 'user'))
    )
  `);

  // 创建菜单表
  db.run(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('dispatch', 'collect')),
      first_menu TEXT NOT NULL,
      second_menus TEXT,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 初始化管理员账号 HQL/12345678
  db.get(`SELECT * FROM users WHERE username = ?`, ['HQL'], (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO users (username, password, type)
        VALUES (?, ?, ?)
      `, ['HQL', '12345678', 'admin']);
    }
  });

  return db;
};

const db = initDB();

// 导出数据库操作方法
module.exports = {
  // 登录验证
  login: (username, password, callback) => {
    db.get(`
      SELECT id, username, type FROM users 
      WHERE username = ? AND password = ?
    `, [username, password], callback);
  },

  // 创建用户
  createUser: (username, password, callback) => {
    db.run(`
      INSERT INTO users (username, password, type)
      VALUES (?, ?, 'user')
    `, [username, password], function(err) {
      callback(err, this.lastID);
    });
  },

  // 获取所有普通用户
  getUsers: (callback) => {
    db.all(`SELECT id, username FROM users WHERE type = 'user'`, callback);
  },

  // 保存菜单
  saveMenu: (userId, type, firstMenu, secondMenus, completed, callback) => {
    db.run(`
      INSERT OR REPLACE INTO menus (user_id, type, first_menu, second_menus, completed)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, type, firstMenu, JSON.stringify(secondMenus), completed], callback);
  },

  // 获取用户菜单
  getMenus: (userId, type, callback) => {
    db.all(`
      SELECT id, first_menu, second_menus, completed FROM menus 
      WHERE user_id = ? AND type = ?
    `, [userId, type], (err, rows) => {
      if (err) callback(err);
      else {
        const menus = rows.map(row => ({
          id: row.id,
          firstMenu: row.first_menu,
          secondMenus: JSON.parse(row.second_menus || '[]'),
          completed: row.completed
        }));
        callback(null, menus);
      }
    });
  },

  // 更新妥投状态
  updateCompleted: (menuId, completed, callback) => {
    db.run(`
      UPDATE menus SET completed = ? WHERE id = ?
    `, [completed, menuId], callback);
  },

  // 检查用户是否存在
  checkUserExists: (username, callback) => {
    db.get(`SELECT id FROM users WHERE username = ?`, [username], callback);
  }
};
