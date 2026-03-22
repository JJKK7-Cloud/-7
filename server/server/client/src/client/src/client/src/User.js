import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const User = () => {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  // 检查登录状态
  useEffect(() => {
    if (!user.username || user.type !== 'user') {
      navigate('/');
    } else {
      loadMenus(activeTab);
    }
  }, [activeTab, user, navigate]);

  // 加载菜单数据
  const loadMenus = async (type) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/menus/${user.id}/${type}`);
      if (res.data.success) {
        setMenus(res.data.data);
      }
    } catch (err) {
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换选项卡
  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // 标记妥投
  const markCompleted = async (menuId) => {
    try {
      await axios.post('/api/update-completed', {
        menuId,
        completed: 1
      });
      // 更新本地状态
      setMenus(menus.map(menu => 
        menu.id === menuId ? { ...menu, completed: 1 } : menu
      ));
    } catch (err) {
      alert('标记失败');
    }
  };

  // 复制内容
  const copyContent = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('复制成功'))
      .catch(() => alert('复制失败，请手动复制'));
  };

  // 切换二级菜单显示
  const [expandedMenu, setExpandedMenu] = useState(null);
  const toggleSubmenu = (menuId) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-blue-600 text-white py-4 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">积压管理系统</h1>
          <button onClick={logout} className="bg-white/20 px-3 py-1 rounded">退出</button>
        </div>
      </nav>

      {/* 选项卡 */}
      <div className="bg-white shadow-sm">
        <div className="flex">
          <button
            onClick={() => switchTab('dispatch')}
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'dispatch' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            派送积压
          </button>
          <button
            onClick={() => switchTab('collect')}
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'collect' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            揽收积压
          </button>
        </div>
      </div>

      {/* 菜单内容 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          menus.map(menu => (
            <div key={menu.id}>
              {/* 一级菜单 */}
              <div 
                className={`menu-item ${menu.completed ? 'completed' : ''}`}
                onClick={() => toggleSubmenu(menu.id)}
              >
                <span className="font-medium">{menu.firstMenu}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markCompleted(menu.id);
                    }}
                    className="btn-danger text-sm px-2 py-1"
                    disabled={menu.completed}
                  >
                    妥投
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyContent(menu.firstMenu);
                    }}
                    className="btn-secondary text-sm px-2 py-1"
                  >
                    复制
                  </button>
                </div>
              </div>

              {/* 二级菜单 */}
              {expandedMenu === menu.id && menu.secondMenus.length > 0 && (
                <div className="submenu">
                  {menu.secondMenus.map((sub, idx) => (
                    <div key={idx} className="py-1 text-gray-700">• {sub}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default User;
