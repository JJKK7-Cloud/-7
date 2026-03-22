import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeMenuType, setActiveMenuType] = useState('dispatch');
  const [menus, setMenus] = useState([]);
  const [newFirstMenu, setNewFirstMenu] = useState('');
  const [newSecondMenu, setNewSecondMenu] = useState('');
  const [selectedFirstMenu, setSelectedFirstMenu] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  // 检查登录状态
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  useEffect(() => {
    if (!user.username || user.type !== 'admin' || user.username !== 'HQL') {
      navigate('/');
    } else {
      loadUsers();
    }
  }, [user, navigate]);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      if (res.data.success) {
        setUsers(res.data.data);
        if (res.data.data.length > 0) {
          setActiveUser(res.data.data[0]);
          loadMenus(res.data.data[0].id, activeMenuType);
        }
      }
    } catch (err) {
      alert('加载用户列表失败');
    }
  };

  // 加载用户菜单
  const loadMenus = async (userId, type) => {
    try {
      const res = await axios.get(`/api/menus/${userId}/${type}`);
      if (res.data.success) {
        setMenus(res.data.data);
        setSelectedFirstMenu(null);
      }
    } catch (err) {
      alert('加载菜单失败');
    }
  };

  // 切换用户
  const switchUser = (user) => {
    setActiveUser(user);
    loadMenus(user.id, activeMenuType);
  };

  // 切换菜单类型
  const switchMenuType = (type) => {
    setActiveMenuType(type);
    if (activeUser) loadMenus(activeUser.id, type);
  };

  // 添加一级菜单
  const addFirstMenu = () => {
    if (!newFirstMenu.trim()) return alert('请输入一级菜单内容');
    if (menus.some(m => m.firstMenu === newFirstMenu.trim())) return alert('该菜单已存在');
    
    const newMenu = {
      id: Date.now(), // 临时ID
      firstMenu: newFirstMenu.trim(),
      secondMenus: [],
      completed: 0
    };
    setMenus([...menus, newMenu]);
    setNewFirstMenu('');
  };

  // 选择一级菜单（编辑二级）
  const selectFirstMenu = (menu) => {
    setSelectedFirstMenu(menu);
  };

  // 添加二级菜单
  const addSecondMenu = () => {
    if (!selectedFirstMenu) return alert('请先选择一级菜单');
    if (!newSecondMenu.trim()) return alert('请输入二级菜单内容');
    if (selectedFirstMenu.secondMenus.includes(newSecondMenu.trim())) return alert('该二级菜单已存在');
    
    const updatedMenus = menus.map(menu => 
      menu.id === selectedFirstMenu.id 
        ? { ...menu, secondMenus: [...menu.secondMenus, newSecondMenu.trim()] }
        : menu
    );
    setMenus(updatedMenus);
    setSelectedFirstMenu({
      ...selectedFirstMenu,
      secondMenus: [...selectedFirstMenu.secondMenus, newSecondMenu.trim()]
    });
    setNewSecondMenu('');
  };

  // 保存菜单
  const saveMenus = async () => {
    if (!activeUser) return alert('请选择用户');
    
    try {
      // 批量保存菜单
      for (const menu of menus) {
        await axios.post('/api/save-menu', {
          userId: activeUser.id,
          type: activeMenuType,
          firstMenu: menu.firstMenu,
          secondMenus: menu.secondMenus,
          completed: menu.completed
        });
      }
      alert('保存成功');
      loadMenus(activeUser.id, activeMenuType);
    } catch (err) {
      alert('保存失败');
    }
  };

  // 创建用户
  const createUser = async () => {
    if (!newUsername || !newPassword) return alert('请输入账号和密码');
    
    try {
      const res = await axios.post('/api/create-user', {
        username: newUsername,
        password: newPassword
      });
      alert(res.data.message);
      if (res.data.success) {
        setNewUsername('');
        setNewPassword('');
        loadUsers();
      }
    } catch (err) {
      alert('创建失败');
    }
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* 导航栏 */}
      <nav className="bg-blue-700 text-white py-4 px-6 rounded-lg mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">积压管理系统 - 管理端</h1>
        <button onClick={logout} className="bg-white/20 px-4 py-1 rounded">退出登录</button>
      </nav>

      {/* 创建用户 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="font-bold mb-3">创建用户</h3>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="账号"
            className="px-3 py-2 border border-gray-300 rounded"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="密码"
            className="px-3 py-2 border border-gray-300 rounded"
          />
          <button onClick={createUser} className="btn-primary">创建</button>
        </div>
      </div>

      {/* 用户选项卡 + 菜单编辑 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {/* 用户选项卡 */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">用户列表</h3>
          <div className="flex flex-wrap gap-2">
            {users.length === 0 ? (
              <div className="text-gray-500">暂无用户</div>
            ) : (
              users.map(u => (
                <button
                  key={u.id}
                  onClick={() => switchUser(u)}
                  className={`px-4 py-2 rounded ${activeUser?.id === u.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {u.username}
                </button>
              ))
            )}
          </div>
        </div>

        {activeUser && (
          <div>
            {/* 菜单类型切换 */}
            <div className="mb-6">
              <button
                onClick={() => switchMenuType('dispatch')}
                className={`btn-primary ${activeMenuType !== 'dispatch' && 'bg-gray-600'}`}
              >
                编辑派送积压
              </button>
              <button
                onClick={() => switchMenuType('collect')}
                className={`btn-primary ml-2 ${activeMenuType !== 'collect' && 'bg-gray-600'}`}
              >
                编辑揽收积压
              </button>
            </div>

            {/* 一级菜单编辑 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">一级菜单</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newFirstMenu}
                  onChange={(e) => setNewFirstMenu(e.target.value)}
                  placeholder="输入一级菜单内容"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <button onClick={addFirstMenu} className="btn-primary">添加</button>
              </div>
              <div className="border border-gray-200 rounded p-2 max-h-60 overflow-y-auto">
                {menus.length === 0 ? (
                  <div className="text-gray-500 py-2">暂无一级菜单</div>
                ) : (
                  menus.map(menu => (
                    <div
                      key={menu.id}
                      onClick={() => selectFirstMenu(menu)}
                      className={`p-2 border-b border-gray-100 hover:bg-gray-50 ${selectedFirstMenu?.id === menu.id ? 'bg-blue-50 font-bold' : ''}`}
                    >
                      {menu.firstMenu}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 二级菜单编辑 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                {selectedFirstMenu ? `二级菜单 (${selectedFirstMenu.firstMenu})` : '二级菜单（请选择一级菜单）'}
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSecondMenu}
                  onChange={(e) => setNewSecondMenu(e.target.value)}
                  placeholder="输入二级菜单内容"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  disabled={!selectedFirstMenu}
                />
                <button onClick={addSecondMenu} className="btn-primary" disabled={!selectedFirstMenu}>
                  添加
                </button>
              </div>
              <div className="border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                {!selectedFirstMenu ? (
                  <div className="text-gray-500 py-2">请先选择一级菜单</div>
                ) : selectedFirstMenu.secondMenus.length === 0 ? (
                  <div className="text-gray-500 py-2">暂无二级菜单</div>
                ) : (
                  selectedFirstMenu.secondMenus.map((sub, idx) => (
                    <div key={idx} className="p-2 border-b border-gray-100 hover:bg-gray-50">
                      • {sub}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 保存按钮 */}
            <button onClick={saveMenus} className="btn-primary">保存菜单</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
