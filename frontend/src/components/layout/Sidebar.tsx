import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  RotateCw, 
  HelpCircle, 
  BookOpen, 
  BarChart3, 
  ListVideo,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { PlaylistSummary } from '../../types';
import { playlistsApi } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const location = useLocation();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    const fetchSidebarPlaylists = async () => {
      try {
        const data = await playlistsApi.getAll();
        setPlaylists(data);
      } catch (err) {
        console.error('Failed to load playlists in sidebar', err);
      }
    };
    fetchSidebarPlaylists();
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Revision Queue', path: '/revision', icon: RotateCw, badge: 'Queue' },
    { name: 'Doubts Hub', path: '/doubts', icon: HelpCircle },
    { name: 'Notebook', path: '/notes', icon: BookOpen },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] flex-col border-r border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isOpen ? 'translate-x-0 flex' : '-translate-x-full lg:flex hidden'
        }`}
      >
        {/* Toggle Collapse/Expand Button Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Menu
              </span>
              <button
                type="button"
                onClick={toggleCollapse}
                title="Collapse Sidebar"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={toggleCollapse}
                title="Expand Sidebar"
                className="p-1 rounded-lg text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-[#00e5ff] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
              >
                <PanelLeftOpen className="w-4 h-4 text-cyan-600 dark:text-[#00e5ff]" />
              </button>
            </div>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3.5'} py-3 space-y-6`}>
          {/* Main Navigation */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Navigation
              </div>
            )}
            <nav className="space-y-1 font-mono text-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-50 dark:bg-[#00e5ff]/10 text-cyan-700 dark:text-[#00e5ff] font-bold border border-cyan-300 dark:border-[#00e5ff]/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-600 dark:text-[#00e5ff]' : 'text-slate-400'}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase text-cyan-700 dark:text-[#00e5ff] bg-cyan-100 dark:bg-[#00e5ff]/10 rounded border border-cyan-200 dark:border-[#00e5ff]/20">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User's Playlists */}
          <div>
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Active Courses
                </span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0c1426] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.08]">
                  {playlists.length}
                </span>
              </div>
            )}

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {playlists.length === 0 ? (
                !isCollapsed && (
                  <div className="px-3 py-4 text-xs text-slate-500 italic text-center font-mono">
                    No courses imported.
                  </div>
                )
              ) : (
                playlists.map((pl) => {
                  const isActive = location.pathname === `/playlist/${pl.id}`;
                  return (
                    <NavLink
                      key={pl.id}
                      to={`/playlist/${pl.id}`}
                      onClick={onCloseMobile}
                      title={isCollapsed ? pl.title : undefined}
                      className={`group flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'items-start gap-2.5 px-3 py-2'} rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-50 dark:bg-[#00e5ff]/10 text-slate-900 dark:text-white font-medium border border-cyan-300 dark:border-[#00e5ff]/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <ListVideo className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-600 dark:text-[#00e5ff]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} ${!isCollapsed ? 'mt-0.5' : ''}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold">{pl.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
                            <span>{pl.completed_videos}/{pl.total_videos} done</span>
                            <span>•</span>
                            <span className="text-cyan-600 dark:text-[#00e5ff]">{Math.round(pl.progress_percentage)}%</span>
                          </div>
                        </div>
                      )}
                    </NavLink>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
