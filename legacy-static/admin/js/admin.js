document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Initialization & State
    // ----------------------------------------------------------------------
    const ds = typeof ESBDataStore !== 'undefined' ? ESBDataStore : null;
    if (!ds) {
        console.error('ESBDataStore is not loaded!');
        alert('Critical Error: Data Store not found.');
        return;
    }

    const state = {
        currentUser: null,
        currentSection: 'dashboard'
    };

    // DOM Elements
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const pageTitle = document.getElementById('page-title');
    const sections = document.querySelectorAll('.admin-section');
    const navItems = document.querySelectorAll('.nav-item');
    const toastContainer = document.getElementById('toast-container');
    const modalContainer = document.getElementById('modal-container');

    // ----------------------------------------------------------------------
    // 2. Authentication
    // ----------------------------------------------------------------------
    function checkAuth() {
        const session = ds.Users.getSession();
        if (session) {
            const user = ds.Users.getById(session.userId);
            if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
                state.currentUser = user;
                showApp();
                return;
            }
        }
        showLogin();
    }

    function showLogin() {
        loginView.classList.add('active');
        appView.classList.remove('active');
        window.location.hash = '';
    }

    
    // ----------------------------------------------------------------------
    // Global Components: Command Palette, Notifications, Quota
    // ----------------------------------------------------------------------
    
    // Command Palette
    const cmdPaletteModal = document.getElementById('command-palette-modal');
    const cmdInput = document.getElementById('command-input');
    const cmdResults = document.getElementById('command-results');
    
    let cmdItems = [];
    
    function initCommandPalette() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape' && !cmdPaletteModal.classList.contains('hidden')) {
                toggleCommandPalette();
            }
        });
        
        cmdInput.addEventListener('input', (e) => {
            renderCommandResults(e.target.value);
        });
        
        cmdPaletteModal.addEventListener('click', (e) => {
            if (e.target === cmdPaletteModal) toggleCommandPalette();
        });
    }
    
    function toggleCommandPalette() {
        if (cmdPaletteModal.classList.contains('hidden')) {
            cmdPaletteModal.classList.remove('hidden'); cmdPaletteModal.classList.add('open');
            cmdInput.value = '';
            cmdInput.focus();
            populateCommandItems();
            renderCommandResults('');
        } else {
            cmdPaletteModal.classList.add('hidden'); cmdPaletteModal.classList.remove('open');
        }
    }
    
    function populateCommandItems() {
        cmdItems = [
            { title: 'Go to Dashboard', icon: 'layout-dashboard', action: () => window.location.hash = 'dashboard' },
            { title: 'Manage Articles', icon: 'file-text', action: () => window.location.hash = 'articles' },
            { title: 'Manage Users', icon: 'users', action: () => window.location.hash = 'users' },
            { title: 'Site Settings', icon: 'settings', action: () => window.location.hash = 'settings' },
            { title: 'Backup Database', icon: 'database', action: () => window.location.hash = 'backup' }
        ];
        
        const articles = ds.Articles.getAll();
        articles.forEach(a => {
            cmdItems.push({
                title: `Edit Article: ${a.title}`,
                icon: 'edit',
                action: () => { window.location.hash = 'articles'; setTimeout(() => showToast(`Editing ${a.title}`, 'info'), 500); }
            });
        });
        
        const users = ds.Users.getAll();
        users.forEach(u => {
            cmdItems.push({
                title: `User: ${u.name} (${u.email})`,
                icon: 'user',
                action: () => { window.location.hash = 'users'; }
            });
        });
    }
    
    function renderCommandResults(query) {
        cmdResults.innerHTML = '';
        const q = query.toLowerCase();
        const filtered = cmdItems.filter(item => item.title.toLowerCase().includes(q)).slice(0, 10);
        
        if (filtered.length === 0) {
            cmdResults.innerHTML = '<div class="p-4 text-center text-muted">No results found</div>';
            return;
        }
        
        filtered.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `command-item ${index === 0 ? 'selected' : ''}`;
            div.innerHTML = `<i data-lucide="${item.icon}" class="w-4 h-4"></i><span>${item.title}</span>`;
            div.addEventListener('click', () => {
                toggleCommandPalette();
                item.action();
            });
            cmdResults.appendChild(div);
        });
        if(window.lucide) window.lucide.createIcons({root: cmdResults});
    }
    
    // Notifications
    function initNotifications() {
        const notifBtn = document.getElementById('notifications-btn');
        const notifDropdown = document.getElementById('notifications-dropdown');
        const notifBadge = document.getElementById('notification-badge');
        const notifList = document.getElementById('notifications-list');
        const markReadBtn = document.getElementById('mark-all-read-btn');
        
        if(!notifBtn) return;
        
        // Mock notifications
        const notifications = [
            { id: 1, text: 'New comment from User on "Power Sector..."', time: '5m ago', read: false },
            { id: 2, text: 'New user registered: john@example.com', time: '1h ago', read: false },
            { id: 3, text: 'Database backup completed successfully', time: '2h ago', read: true }
        ];
        
        function renderNotifs() {
            const unread = notifications.filter(n => !n.read).length;
            if(unread > 0) {
                notifBadge.classList.remove('hidden');
            } else {
                notifBadge.classList.add('hidden');
            }
            
            notifList.innerHTML = notifications.map(n => `
                <div class="notification-item ${!n.read ? 'unread' : ''}" data-id="${n.id}">
                    <div class="text-sm">${n.text}</div>
                    <div class="text-xs text-muted mt-1">${n.time}</div>
                </div>
            `).join('');
        }
        
        renderNotifs();
        
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if(!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.classList.add('hidden');
            }
        });
        
        markReadBtn.addEventListener('click', () => {
            notifications.forEach(n => n.read = true);
            renderNotifs();
        });
    }

    // Storage Quota
    function updateQuota() {
        const quotaText = document.getElementById('quota-text');
        const quotaBar = document.getElementById('quota-bar');
        if(!quotaText || !quotaBar) return;
        
        let totalBytes = 0;
        for(let key in localStorage) {
            if(localStorage.hasOwnProperty(key)) {
                totalBytes += ((localStorage[key].length + key.length) * 2);
            }
        }
        // Assuming 5MB quota
        const limit = 5 * 1024 * 1024;
        let percentage = (totalBytes / limit) * 100;
        if(percentage > 100) percentage = 100;
        
        quotaText.textContent = `${percentage.toFixed(1)}%`;
        quotaBar.style.width = `${percentage}%`;
        if(percentage > 90) {
            quotaBar.style.background = 'var(--danger)';
        } else if(percentage > 70) {
            quotaBar.style.background = 'var(--warning)';
        }
    }

    function showApp() {
        loginView.classList.remove('active');
        appView.classList.add('active');
        
        // Update user info in sidebar
        document.getElementById('current-user-name').textContent = state.currentUser.name;
        document.getElementById('current-user-role').textContent = state.currentUser.role.replace('_', ' ');
        document.getElementById('user-initials').textContent = state.currentUser.name.substring(0, 2).toUpperCase();
        
        // Init Router
        handleRoute();

        initCommandPalette();
        initNotifications();
        updateQuota();
        setInterval(updateQuota, 30000); // refresh every 30s

    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const result = ds.Users.authenticate(email, password);
        if (result.success) {
            if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN') {
                state.currentUser = result.user;
                showApp();
                showToast('Welcome back, ' + result.user.name, 'success');
            } else {
                loginError.textContent = 'Access denied. Admins only.';
                loginError.classList.remove('hidden');
            }
        } else {
            loginError.textContent = result.error;
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        ds.Users.logout();
        state.currentUser = null;
        showLogin();
        showToast('Logged out successfully', 'info');
    });

    // ----------------------------------------------------------------------
    // 3. Routing & Navigation
    // ----------------------------------------------------------------------
    window.addEventListener('hashchange', handleRoute);

    function handleRoute() {
        if (!state.currentUser) return;
        
        let hash = window.location.hash.substring(1) || 'dashboard';
        state.currentSection = hash;

        // Update Nav
        navItems.forEach(item => {
            if (item.dataset.section === hash) item.classList.add('active');
            else item.classList.remove('active');
        });

        // Update Title
        const activeNav = document.querySelector(`.nav-item[data-section="${hash}"]`);
        if (activeNav) {
            pageTitle.textContent = activeNav.querySelector('span').textContent;
        }

        // Show Section
        sections.forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(`section-${hash}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Show skeleton loading state
            targetSection.innerHTML = `
                <div class="card glass-panel fade-in">
                    <div class="flex justify-between mb-6">
                        <div class="skeleton" style="height: 2rem; width: 30%; border-radius: var(--border-radius-sm);"></div>
                        <div class="skeleton" style="height: 2rem; width: 100px; border-radius: var(--border-radius-sm);"></div>
                    </div>
                    <div class="grid grid-cols-4 gap-6 mb-6">
                        <div class="skeleton" style="height: 6rem; border-radius: var(--border-radius);"></div>
                        <div class="skeleton" style="height: 6rem; border-radius: var(--border-radius);"></div>
                        <div class="skeleton" style="height: 6rem; border-radius: var(--border-radius);"></div>
                        <div class="skeleton" style="height: 6rem; border-radius: var(--border-radius);"></div>
                    </div>
                    <div class="skeleton" style="height: 300px; width: 100%; border-radius: var(--border-radius);"></div>
                </div>
            `;
            
            // Delay rendering to show micro-animations and skeletons
            setTimeout(() => {
                renderSection(hash, targetSection);
            }, 300);
        }

        // Re-init lucide icons
        if (window.lucide) lucide.createIcons();
    }

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // ----------------------------------------------------------------------
    // 4. Section Renderers
    // ----------------------------------------------------------------------
    function renderSection(sectionName, container) {
        container.innerHTML = ''; // Clear
        
        switch(sectionName) {
            case 'dashboard': renderDashboard(container); break;
            case 'articles': renderArticles(container); break;
            case 'users': renderUsers(container); break;
            case 'categories': renderCategories(container); break;
            case 'comments': renderComments(container); break;
            case 'media': renderMedia(container); break;
            case 'analytics': renderAnalytics(container); break;
            case 'settings': renderSettings(container); break;
            case 'ads': renderAds(container); break;
            case 'pages': renderPages(container); break;
            case 'activity': renderActivity(container); break;
            case 'newsletter': renderNewsletter(container); break;
            case 'backup': renderBackup(container); break;
            default: container.innerHTML = '<p class="p-6">Section not implemented yet.</p>';
        }
        
        if (window.lucide) lucide.createIcons();
    }

    // ── Dashboard ───────────────────────────────────────
    function renderDashboard(container) {
        const articles = ds.Articles.getAll();
        const users = ds.Users.getAll();
        const comments = ds.Comments ? ds.Comments.getAll() : [];
        const views = articles.reduce((sum, a) => sum + (a.views || 0), 0);
        
        container.innerHTML = `
            <div class="grid grid-cols-4 mb-6">
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${articles.length}</div>
                            <div class="stat-label">Total Articles</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="file-text" class="text-primary"></i></div>
                    </div>
                    <canvas id="spark-articles" class="sparkline-container"></canvas>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${views.toLocaleString()}</div>
                            <div class="stat-label">Total Views</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="eye" class="text-success"></i></div>
                    </div>
                    <canvas id="spark-views" class="sparkline-container"></canvas>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${users.length}</div>
                            <div class="stat-label">Registered Users</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="users" class="text-info"></i></div>
                    </div>
                    <canvas id="spark-users" class="sparkline-container"></canvas>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${comments.length}</div>
                            <div class="stat-label">Total Comments</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="message-square" class="text-warning"></i></div>
                    </div>
                    <canvas id="spark-comments" class="sparkline-container"></canvas>
                </div>
            </div>
            
            <div class="grid grid-cols-3">
                <div class="card" style="grid-column: span 2;">
                    <h3>Traffic Overview</h3>
                    <canvas id="main-chart" style="width:100%; height:300px;"></canvas>
                </div>
                <div class="card">
                    <h3>Recent Activity</h3>
                    <div class="mt-4 flex flex-col gap-3">
                        ${(ds.Logs ? ds.Logs.getAll().slice(0, 6) : []).map(log => `
                            <div class="flex gap-3 text-sm pb-3" style="border-bottom: 1px solid var(--border-color)">
                                <i data-lucide="activity" class="text-primary" style="width:16px;"></i>
                                <div>
                                    <div class="text-main">${log.message}</div>
                                    <div class="text-muted text-xs">${new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            drawSparkline('spark-articles', [10, 15, 8, 20, 25, 30, 40], '#3B82F6');
            drawSparkline('spark-views', [100, 250, 200, 400, 350, 600, 800], '#10B981');
            drawSparkline('spark-users', [5, 8, 12, 10, 22, 18, 30], '#6366F1');
            drawSparkline('spark-comments', [2, 5, 3, 8, 12, 10, 15], '#F59E0B');
            drawMainChart('main-chart');
        }, 100);
    }

    // ── Articles ───────────────────────────────────────
    function renderArticles(container) {
        const articles = ds.Articles.getAll();
        
        let html = `
            <div class="card glass-panel fade-in">
                <div class="card-header border-b border-color flex justify-between align-center">
                    <h2 class="card-title text-xl m-0 flex align-center gap-2">
                        <i data-lucide="file-text"></i> Articles
                    </h2>
                    <button class="btn btn-primary gap-2"><i data-lucide="plus"></i> New Article</button>
                </div>
                <div class="card-body p-0">
                    <div class="table-controls p-4 border-b border-color flex justify-between align-center bg-surface">
                        <div class="filter-group">
                            <select class="form-control" style="width:150px">
                                <option>All Status</option>
                                <option>Published</option>
                                <option>Draft</option>
                            </select>
                            <select class="form-control" style="width:150px">
                                <option>All Categories</option>
                                <option>News</option>
                                <option>Technology</option>
                            </select>
                        </div>
                        <div class="search-bar">
                            <i data-lucide="search" class="search-icon"></i>
                            <input type="text" class="form-control" placeholder="Search articles...">
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="table w-full">
                            <thead>
                                <tr>
                                    <th width="40"><input type="checkbox" class="selectAll"></th>
                                    <th class="cursor-pointer">Title <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                                    <th class="cursor-pointer">Author <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                                    <th class="cursor-pointer">Category <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                                    <th>Status</th>
                                    <th class="cursor-pointer">Date <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        articles.forEach(art => {
            const author = ds.Users.getById(art.authorId) || { name: 'Unknown' };
            const cat = ds.Categories ? ds.Categories.getById(art.categoryId) : { name: 'N/A' };
            const statusClass = art.status === 'published' ? 'success' : art.status === 'draft' ? 'neutral' : 'warning';
            
            html += `
                <tr class="cursor-pointer" onclick="const cb = this.querySelector('.row-checkbox'); cb.checked = !cb.checked; this.classList.toggle('selected')">
                    <td onclick="event.stopPropagation(); const tr = this.closest('tr'); const cb = this.querySelector('.row-checkbox'); if(cb) { tr.classList.toggle('selected', cb.checked); }"><input type="checkbox" class="row-checkbox"></td>
                    <td class="font-bold text-main">${art.title}</td>
                    <td><div class="flex align-center gap-2"><div class="w-6 h-6 rounded-full bg-surface-active flex-center text-xs text-primary">${author.name.substring(0,1)}</div>${author.name}</div></td>
                    <td><span class="badge badge-outline badge-sm">${cat ? cat.name : 'Uncategorized'}</span></td>
                    <td><span class="badge badge-${statusClass}"><span class="w-2 h-2 rounded-full bg-${statusClass} inline-block mr-1"></span>${art.status}</span></td>
                    <td class="text-sm text-muted">${new Date(art.createdAt).toLocaleDateString()}</td>
                    <td class="text-right" onclick="event.stopPropagation()">
                        <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                        <button class="btn-icon text-danger tooltip-wrap" data-tooltip="Delete"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container p-4">
                        <div class="text-sm text-muted">Showing 1 to ${articles.length} of ${articles.length} entries</div>
                        <div class="pagination-buttons">
                            <button class="page-btn" disabled><i data-lucide="chevron-left"></i></button>
                            <button class="page-btn active">1</button>
                            <button class="page-btn">2</button>
                            <button class="page-btn">3</button>
                            <button class="page-btn"><i data-lucide="chevron-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        // Select all logic
        const selectAll = container.querySelector('.selectAll');
        const checkboxes = container.querySelectorAll('.row-checkbox');
        if(selectAll) {
            selectAll.addEventListener('change', (e) => {
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    const tr = cb.closest('tr');
                    if(e.target.checked) tr.classList.add('selected');
                    else tr.classList.remove('selected');
                });
            });
        }
    }

    function renderUsers(container) {
        const users = ds.Users.getAll();
        let html = `
            <div class="card glass-panel fade-in">
                <div class="card-header border-b border-color flex justify-between align-center">
                    <h2 class="card-title text-xl m-0 flex align-center gap-2">
                        <i data-lucide="users"></i> User Management
                    </h2>
                    <button class="btn btn-primary gap-2" onclick="showModal('Add New User', '<form onsubmit=\'event.preventDefault(); showToast(\'User created successfully!\', \'success\'); this.closest(\'div.modal-overlay\').remove();\'><div class=\'form-group\'><label>Name</label><input type=\'text\' class=\'form-control\' required></div><div class=\'form-group\'><label>Email</label><input type=\'email\' class=\'form-control\' required></div><div class=\'form-group\'><label>Role</label><select class=\'form-control\'><option>Editor</option><option>Admin</option></select></div><button type=\'submit\' class=\'btn btn-primary w-full mt-4\'>Create User</button></form>')"><i data-lucide="user-plus"></i> Add User</button>
                </div>
                <div class="card-body p-0">
                    <div class="table-controls p-4 border-b border-color flex justify-between align-center bg-surface">
                        <div class="filter-group">
                            <select class="form-control" style="width:150px">
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Editor</option>
                            </select>
                        </div>
                        <div class="search-bar">
                            <i data-lucide="search" class="search-icon"></i>
                            <input type="text" class="form-control" placeholder="Search users...">
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="table w-full">
                            <thead>
                                <tr>
                                    <th width="40"><input type="checkbox" class="selectAll"></th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        users.forEach(u => {
            html += `
                <tr class="cursor-pointer" onclick="const cb = this.querySelector('.row-checkbox'); cb.checked = !cb.checked; this.classList.toggle('selected')">
                    <td onclick="event.stopPropagation(); const tr = this.closest('tr'); const cb = this.querySelector('.row-checkbox'); if(cb) { tr.classList.toggle('selected', cb.checked); }"><input type="checkbox" class="row-checkbox"></td>
                    <td>
                        <div class="flex align-center gap-3">
                            <div class="avatar bg-gradient-primary text-white w-10 h-10 rounded-full flex-center font-bold shadow-lg">${u.name.substring(0,2).toUpperCase()}</div>
                            <div>
                                <div class="font-bold text-main">${u.name}</div>
                                <div class="text-xs text-muted">${u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-primary">${u.role}</span></td>
                    <td><span class="badge badge-success"><span class="w-2 h-2 rounded-full bg-success inline-block mr-1"></span>Active</span></td>
                    <td class="text-sm text-muted">Just now</td>
                    <td class="text-right" onclick="event.stopPropagation()">
                        <button class="btn-icon tooltip-wrap" data-tooltip="Edit User"><i data-lucide="edit-2"></i></button>
                        <button class="btn-icon text-danger tooltip-wrap" data-tooltip="Delete User"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container p-4">
                        <div class="text-sm text-muted">Showing 1 to ${users.length} of ${users.length} users</div>
                        <div class="pagination-buttons">
                            <button class="page-btn" disabled><i data-lucide="chevron-left"></i></button>
                            <button class="page-btn active">1</button>
                            <button class="page-btn"><i data-lucide="chevron-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Select all logic
        const selectAll = container.querySelector('.selectAll');
        const checkboxes = container.querySelectorAll('.row-checkbox');
        if(selectAll) {
            selectAll.addEventListener('change', (e) => {
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    const tr = cb.closest('tr');
                    if(e.target.checked) tr.classList.add('selected');
                    else tr.classList.remove('selected');
                });
            });
        }
    }

    function renderCategories(container) {
        const cats = ds.Categories ? ds.Categories.getAll() : [];
        let html = `
            <div class="flex justify-between align-center mb-4">
                <h2>Categories</h2>
                <button class="btn btn-primary"><i data-lucide="plus"></i> Add Category</button>
            </div>
            <div class="grid grid-cols-4">
        `;
        
        cats.forEach(c => {
            html += `
                <div class="card flex-col align-center text-center gap-2">
                    <div class="avatar" style="background: ${c.color || 'var(--primary)'}; width: 3rem; height: 3rem;">
                        <i data-lucide="${c.icon || 'folder'}" class="text-white"></i>
                    </div>
                    <div class="font-bold text-lg">${c.name}</div>
                    <div class="text-sm text-muted">${c.description || 'No description'}</div>
                    <div class="flex gap-2 mt-2 w-full justify-center">
                        <button class="btn btn-outline btn-sm">Edit</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    // ── Comments ───────────────────────────────────────
    function renderComments(container) {
        const comments = ds.Comments ? ds.Comments.getAll() : [];
        let html = `
            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th class="cursor-pointer">Author <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                            <th>Comment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        comments.forEach(c => {
            let badge = c.status === 'approved' ? 'success' : c.status === 'spam' ? 'danger' : 'warning';
            html += `
                <tr>
                    <td class="font-bold">${c.authorName}</td>
                    <td class="text-sm">${c.content}</td>
                    <td><span class="badge badge-${badge}">${c.status}</span></td>
                    <td>
                        <button class="btn-icon text-success"><i data-lucide="check"></i></button>
                        <button class="btn-icon text-danger"><i data-lucide="x"></i></button>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    // ── Media ───────────────────────────────────────
    function renderMedia(container) {
        const media = ds.Media ? ds.Media.getAll() : [];
        let html = `
            <div class="flex justify-between align-center mb-4">
                <h2>Media Library</h2>
                <button class="btn btn-primary"><i data-lucide="upload"></i> Upload</button>
            </div>
            <div class="grid grid-cols-4 gap-4">
        `;
        
        if (media.length === 0) {
            html += `<div class="col-span-4 text-center p-6 text-muted">No media files found.</div>`;
        }
        media.forEach(m => {
            html += `
                <div class="card p-2">
                    <img src="${m.url}" style="width:100%; height:150px; object-fit:cover; border-radius:var(--border-radius)">
                    <div class="text-sm mt-2 truncate">${m.filename}</div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    // ── Analytics ───────────────────────────────────────
    function renderAnalytics(container) {
        container.innerHTML = `
            <div class="flex justify-between align-center mb-6">
                <h2 class="m-0 flex align-center gap-2"><i data-lucide="bar-chart-2"></i> Analytics Dashboard</h2>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm active">7D</button>
                    <button class="btn btn-outline btn-sm">30D</button>
                    <button class="btn btn-outline btn-sm">1Y</button>
                </div>
            </div>
            
            <div class="grid grid-cols-4 mb-6">
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value text-primary">124.5K</div>
                            <div class="stat-label">Page Views</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="eye" class="text-primary"></i></div>
                    </div>
                    <div class="mt-2 text-sm text-success flex align-center gap-1"><i data-lucide="trending-up" class="w-4 h-4"></i> +12.5% vs last week</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value text-success">45.2K</div>
                            <div class="stat-label">Unique Visitors</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="users" class="text-success"></i></div>
                    </div>
                    <div class="mt-2 text-sm text-success flex align-center gap-1"><i data-lucide="trending-up" class="w-4 h-4"></i> +8.2% vs last week</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value text-warning">03:24</div>
                            <div class="stat-label">Avg Time on Site</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="clock" class="text-warning"></i></div>
                    </div>
                    <div class="mt-2 text-sm text-danger flex align-center gap-1"><i data-lucide="trending-down" class="w-4 h-4"></i> -1.5% vs last week</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value text-danger">42.8%</div>
                            <div class="stat-label">Bounce Rate</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="activity" class="text-danger"></i></div>
                    </div>
                    <div class="mt-2 text-sm text-success flex align-center gap-1"><i data-lucide="trending-down" class="w-4 h-4"></i> -4.2% vs last week</div>
                </div>
            </div>

            <div class="grid grid-cols-3 mb-6">
                <div class="card col-span-2">
                    <h3 class="mb-4">Traffic Overview</h3>
                    <canvas id="analytics-chart" style="width:100%; height:300px;"></canvas>
                </div>
                <div class="card">
                    <h3 class="mb-4">Traffic Sources</h3>
                    <canvas id="pie-chart" style="width:100%; height:300px;"></canvas>
                    <div class="flex flex-col gap-2 mt-4">
                        <div class="flex justify-between text-sm"><span class="flex align-center gap-2"><span class="w-3 h-3 rounded-full bg-primary inline-block"></span> Organic Search</span> <span class="font-bold">45%</span></div>
                        <div class="flex justify-between text-sm"><span class="flex align-center gap-2"><span class="w-3 h-3 rounded-full bg-success inline-block"></span> Direct</span> <span class="font-bold">30%</span></div>
                        <div class="flex justify-between text-sm"><span class="flex align-center gap-2"><span class="w-3 h-3 rounded-full bg-warning inline-block"></span> Social Media</span> <span class="font-bold">15%</span></div>
                        <div class="flex justify-between text-sm"><span class="flex align-center gap-2"><span class="w-3 h-3 rounded-full bg-danger inline-block"></span> Referral</span> <span class="font-bold">10%</span></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div class="card">
                    <h3 class="mb-4">Top Articles</h3>
                    <table class="table w-full">
                        <thead><tr><th>Article</th><th class="text-right">Views</th></tr></thead>
                        <tbody>
                            <tr><td class="truncate" style="max-width: 200px;">Power Sector Master Plan 2040</td><td class="text-right font-bold text-primary">12,450</td></tr>
                            <tr><td class="truncate" style="max-width: 200px;">Solar Energy Initiatives</td><td class="text-right font-bold text-primary">8,230</td></tr>
                            <tr><td class="truncate" style="max-width: 200px;">Grid Modernization Project</td><td class="text-right font-bold text-primary">6,120</td></tr>
                            <tr><td class="truncate" style="max-width: 200px;">Renewable Energy Targets</td><td class="text-right font-bold text-primary">5,430</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="card">
                    <h3 class="mb-4">Geographic Distribution</h3>
                    <table class="table w-full">
                        <thead><tr><th>Region</th><th class="text-right">Users</th></tr></thead>
                        <tbody>
                            <tr><td>Dhaka</td><td class="text-right font-bold">45,210</td></tr>
                            <tr><td>Chittagong</td><td class="text-right font-bold">18,340</td></tr>
                            <tr><td>Sylhet</td><td class="text-right font-bold">12,120</td></tr>
                            <tr><td>Rajshahi</td><td class="text-right font-bold">9,450</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        setTimeout(() => {
            drawMainChart('analytics-chart', true);
            drawPieChart('pie-chart', [45, 30, 15, 10], ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']);
        }, 100);
    }

    // ── Settings ───────────────────────────────────────
    function renderSettings(container) {
        container.innerHTML = `
            <div class="grid grid-cols-3 gap-6">
                <div class="col-span-1 flex flex-col gap-2">
                    <div class="card bg-surface-active cursor-pointer font-bold"><i data-lucide="globe" class="inline-block mr-2 w-4 h-4"></i> General Settings</div>
                    <div class="card hover:bg-surface-active cursor-pointer"><i data-lucide="search" class="inline-block mr-2 w-4 h-4"></i> SEO Settings</div>
                    <div class="card hover:bg-surface-active cursor-pointer"><i data-lucide="share-2" class="inline-block mr-2 w-4 h-4"></i> Social Media</div>
                    <div class="card hover:bg-surface-active cursor-pointer"><i data-lucide="mail" class="inline-block mr-2 w-4 h-4"></i> Email Configuration</div>
                </div>
                <div class="col-span-2">
                    <div class="card">
                        <div class="card-header border-b border-color mb-4 pb-4">
                            <h2 class="m-0 text-xl">General Settings</h2>
                        </div>
                        <form onsubmit="event.preventDefault(); showToast('Settings saved successfully!', 'success');">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group col-span-2">
                                    <label>Site Title</label>
                                    <input type="text" class="form-control" value="ESB PowerLine">
                                    <small class="text-muted">The name of the site displayed in the header.</small>
                                </div>
                                <div class="form-group col-span-2">
                                    <label>Tagline</label>
                                    <input type="text" class="form-control" value="Bangladesh Energy & Power News">
                                </div>
                                <div class="form-group">
                                    <label>Contact Email</label>
                                    <input type="email" class="form-control" value="esbplbd@gmail.com">
                                </div>
                                <div class="form-group">
                                    <label>Items Per Page</label>
                                    <input type="number" class="form-control" value="12">
                                </div>
                            </div>
                            
                            <h3 class="mt-6 mb-4 border-b border-color pb-2 text-lg">Features Toggle</h3>
                            <div class="flex flex-col gap-4">
                                <div class="flex justify-between align-center p-3 bg-surface rounded-lg border border-color">
                                    <div>
                                        <div class="font-bold">Enable Comments</div>
                                        <div class="text-sm text-muted">Allow users to comment on articles</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex justify-between align-center p-3 bg-surface rounded-lg border border-color">
                                    <div>
                                        <div class="font-bold">Breaking News Ticker</div>
                                        <div class="text-sm text-muted">Show scrolling news ticker on homepage</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex justify-between align-center p-3 bg-surface rounded-lg border border-color">
                                    <div>
                                        <div class="font-bold">Maintenance Mode</div>
                                        <div class="text-sm text-muted">Restrict access to public site</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mt-6 flex justify-end">
                                <button type="submit" class="btn btn-primary gap-2"><i data-lucide="save"></i> Save Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // ── Ads ───────────────────────────────────────
    function renderAds(container) {
        container.innerHTML = `
            <div class="card glass-panel">
                <div class="flex justify-between align-center mb-6 border-b border-color pb-4">
                    <h2 class="m-0 flex align-center gap-2"><i data-lucide="megaphone"></i> Advertisement Manager</h2>
                    <button class="btn btn-primary gap-2"><i data-lucide="plus"></i> New Ad Placement</button>
                </div>
                <table class="table w-full">
                    <thead>
                        <tr>
                            <th>Position Name</th>
                            <th>Size</th>
                            <th>Current Campaign</th>
                            <th>Status</th>
                            <th>Impressions</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="font-bold">Header Leaderboard</td>
                            <td>728x90</td>
                            <td>SolarTech Promo</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td>45,210</td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">Sidebar Top Rectangle</td>
                            <td>300x250</td>
                            <td>PowerGrid Events</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td>22,140</td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">Article Inline Banner</td>
                            <td>468x60</td>
                            <td>-</td>
                            <td><span class="badge badge-neutral">Inactive</span></td>
                            <td>0</td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // ── Pages ───────────────────────────────────────
    function renderPages(container) {
        container.innerHTML = `
            <div class="card glass-panel">
                <div class="flex justify-between align-center mb-6 border-b border-color pb-4">
                    <h2 class="m-0 flex align-center gap-2"><i data-lucide="layout"></i> Static Pages</h2>
                    <button class="btn btn-primary gap-2"><i data-lucide="plus"></i> Create Page</button>
                </div>
                <table class="table w-full">
                    <thead>
                        <tr>
                            <th class="cursor-pointer">Title <i data-lucide="chevron-down" class="inline w-3 h-3 text-muted"></i></th>
                            <th>Slug</th>
                            <th>Last Updated</th>
                            <th>Status</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="font-bold">About Us</td>
                            <td class="text-muted">/about</td>
                            <td>Oct 12, 2025</td>
                            <td><span class="badge badge-success">Published</span></td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">Contact</td>
                            <td class="text-muted">/contact</td>
                            <td>Sep 05, 2025</td>
                            <td><span class="badge badge-success">Published</span></td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">Privacy Policy</td>
                            <td class="text-muted">/privacy</td>
                            <td>Jan 20, 2025</td>
                            <td><span class="badge badge-success">Published</span></td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">Terms of Service</td>
                            <td class="text-muted">/terms</td>
                            <td>Jan 20, 2025</td>
                            <td><span class="badge badge-warning">Draft</span></td>
                            <td class="text-right">
                                <button class="btn-icon tooltip-wrap" data-tooltip="Edit"><i data-lucide="edit-2"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // ── Activity ───────────────────────────────────────
    function renderActivity(container) {
        const logs = ds.Logs ? ds.Logs.getAll() : [];
        let html = `
            <div class="card glass-panel">
                <div class="flex justify-between align-center mb-6 border-b border-color pb-4">
                    <h2 class="m-0 flex align-center gap-2"><i data-lucide="activity"></i> System Activity Log</h2>
                    <div class="search-bar">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" class="form-control" placeholder="Search logs...">
                    </div>
                </div>
                <div class="table-container">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (logs.length === 0) {
            html += \`<tr><td colspan="4" class="text-center p-4 text-muted">No activity logs found.</td></tr>\`;
        } else {
            logs.forEach(l => {
                const user = ds.Users.getById(l.userId);
                const userName = user ? user.name : 'System';
                
                let actionColor = 'primary';
                if (l.action.includes('delete') || l.action.includes('remove')) actionColor = 'danger';
                if (l.action.includes('create') || l.action.includes('add')) actionColor = 'success';
                if (l.action.includes('update') || l.action.includes('edit')) actionColor = 'warning';

                html += \`
                    <tr>
                        <td class="text-sm text-muted whitespace-nowrap">\${new Date(l.timestamp).toLocaleString()}</td>
                        <td class="font-bold">\${userName}</td>
                        <td><span class="badge badge-outline badge-\${actionColor}">\${l.action}</span></td>
                        <td class="text-sm">\${l.message}</td>
                    </tr>
                \`;
            });
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
                <div class="pagination-container p-4 border-t border-color mt-4 flex justify-between align-center">
                    <div class="text-sm text-muted">Showing 1 to ${Math.min(10, logs.length)} of ${logs.length} logs</div>
                    <div class="pagination-buttons">
                        <button class="page-btn" disabled><i data-lucide="chevron-left"></i></button>
                        <button class="page-btn active">1</button>
                        <button class="page-btn"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // ── Newsletter ───────────────────────────────────────
    function renderNewsletter(container) {
        container.innerHTML = `
            <div class="grid grid-cols-4 gap-6 mb-6">
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">1,245</div>
                            <div class="stat-label">Total Subscribers</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="users" class="text-primary"></i></div>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">42</div>
                            <div class="stat-label">New This Week</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="user-plus" class="text-success"></i></div>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">24%</div>
                            <div class="stat-label">Avg Open Rate</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="mail-open" class="text-warning"></i></div>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">12</div>
                            <div class="stat-label">Campaigns Sent</div>
                        </div>
                        <div class="stat-icon"><i data-lucide="send" class="text-info"></i></div>
                    </div>
                </div>
            </div>
            
            <div class="card glass-panel">
                <div class="flex justify-between align-center mb-6 border-b border-color pb-4">
                    <h2 class="m-0 flex align-center gap-2"><i data-lucide="mail"></i> Subscriber List</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-outline gap-2"><i data-lucide="download"></i> Export CSV</button>
                        <button class="btn btn-primary gap-2"><i data-lucide="send"></i> New Campaign</button>
                    </div>
                </div>
                <table class="table w-full">
                    <thead>
                        <tr>
                            <th>Email Address</th>
                            <th>Subscribed Date</th>
                            <th>Status</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="font-bold">reader@example.com</td>
                            <td>Oct 15, 2025</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td class="text-right">
                                <button class="btn-icon text-danger tooltip-wrap" data-tooltip="Remove"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">john.doe@company.com</td>
                            <td>Oct 10, 2025</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td class="text-right">
                                <button class="btn-icon text-danger tooltip-wrap" data-tooltip="Remove"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="font-bold">jane.smith@agency.org</td>
                            <td>Sep 28, 2025</td>
                            <td><span class="badge badge-warning">Unsubscribed</span></td>
                            <td class="text-right">
                                <button class="btn-icon text-danger tooltip-wrap" data-tooltip="Remove"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // ── Backup ───────────────────────────────────────
    function renderBackup(container) {
        container.innerHTML = `
            <div class="card glass-panel" style="max-width: 800px; margin: 0 auto;">
                <div class="text-center mb-8 border-b border-color pb-6">
                    <div class="w-16 h-16 rounded-full bg-surface-active flex-center mx-auto mb-4">
                        <i data-lucide="database" class="w-8 h-8 text-primary"></i>
                    </div>
                    <h2 class="text-2xl m-0">Database Backup & Restore</h2>
                    <p class="text-muted mt-2">Manage your site data, export full backups, or restore from a previous state.</p>
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                    <div class="card bg-surface border border-color flex flex-col align-center text-center p-6 hover:border-primary transition-fast cursor-pointer" onclick="showToast('Backup process started. This may take a few moments.', 'info')">
                        <i data-lucide="download-cloud" class="w-12 h-12 text-success mb-4"></i>
                        <h3 class="text-lg m-0">Export Data</h3>
                        <p class="text-sm text-muted mt-2 mb-4">Download a full JSON backup of all articles, users, settings, and media references.</p>
                        <button class="btn btn-success w-full mt-auto">Generate Backup</button>
                    </div>
                    
                    <div class="card bg-surface border border-color flex flex-col align-center text-center p-6 hover:border-warning transition-fast cursor-pointer">
                        <i data-lucide="upload-cloud" class="w-12 h-12 text-warning mb-4"></i>
                        <h3 class="text-lg m-0">Restore Data</h3>
                        <p class="text-sm text-muted mt-2 mb-4">Upload a previously generated backup file to restore the database to that state.</p>
                        <button class="btn btn-warning w-full mt-auto">Upload Backup</button>
                    </div>
                </div>
                
                <div class="mt-8">
                    <h3 class="mb-4">Recent Backups</h3>
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Size</th>
                                <th>Type</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Oct 15, 2025 at 02:00 AM</td>
                                <td>4.2 MB</td>
                                <td><span class="badge badge-outline badge-primary">Automated</span></td>
                                <td class="text-right">
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Download"><i data-lucide="download"></i></button>
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Restore"><i data-lucide="rotate-ccw"></i></button>
                                </td>
                            </tr>
                            <tr>
                                <td>Oct 08, 2025 at 02:00 AM</td>
                                <td>4.1 MB</td>
                                <td><span class="badge badge-outline badge-primary">Automated</span></td>
                                <td class="text-right">
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Download"><i data-lucide="download"></i></button>
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Restore"><i data-lucide="rotate-ccw"></i></button>
                                </td>
                            </tr>
                            <tr>
                                <td>Oct 01, 2025 at 14:30 PM</td>
                                <td>3.9 MB</td>
                                <td><span class="badge badge-outline badge-info">Manual</span></td>
                                <td class="text-right">
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Download"><i data-lucide="download"></i></button>
                                    <button class="btn-icon tooltip-wrap" data-tooltip="Restore"><i data-lucide="rotate-ccw"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------------------------
    // 5. Utilities & UI Components
    // ----------------------------------------------------------------------
    window.showToast = function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'alert-circle';
        if (type === 'warning') icon = 'alert-triangle';

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${icon}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        if (window.lucide) lucide.createIcons({ root: toast });
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ----------------------------------------------------------------------
    // 6. Canvas Chart Renderers
    // ----------------------------------------------------------------------
    function drawSparkline(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth;
        const h = canvas.height = 50;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        
        const step = w / (data.length - 1);
        data.forEach((val, i) => {
            const x = i * step;
            const y = h - ((val - min) / range) * h * 0.8 - h * 0.1;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fill gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, color + '66'); // 40% opacity
        gradient.addColorStop(1, color + '00'); // 0% opacity
        
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function drawMainChart(canvasId, detailed = false) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth;
        const h = canvas.height = detailed ? 400 : 300;
        
        ctx.clearRect(0, 0, w, h);
        
        // Dummy data for last 7 days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const values = [1200, 1900, 1500, 2200, 1800, 2800, 2400];
        const max = Math.max(...values) * 1.2;
        
        // Draw grid
        ctx.strokeStyle = '#374151'; // border-color
        ctx.lineWidth = 1;
        ctx.font = '12px Inter';
        ctx.fillStyle = '#9ca3af'; // text-muted
        
        const padding = 40;
        const chartW = w - padding * 2;
        const chartH = h - padding * 2;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
            
            const val = Math.round(max - (max / 5) * i);
            ctx.fillText(val, 5, y + 4);
        }
        
        // Draw line
        ctx.beginPath();
        const step = chartW / (values.length - 1);
        
        values.forEach((val, i) => {
            const x = padding + i * step;
            const y = padding + chartH - (val / max) * chartH;
            
            if (i === 0) ctx.moveTo(x, y);
            else {
                // Bezier curve for smoothness
                const prevX = padding + (i - 1) * step;
                const prevY = padding + chartH - (values[i-1] / max) * chartH;
                const cp1x = prevX + step / 2;
                const cp2x = x - step / 2;
                ctx.bezierCurveTo(cp1x, prevY, cp2x, y, x, y);
            }
        });
        
        ctx.strokeStyle = '#3B82F6'; // primary
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw points and labels
        values.forEach((val, i) => {
            const x = padding + i * step;
            const y = padding + chartH - (val / max) * chartH;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#111827';
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(days[i], x - 10, h - 10);
        });
    }

    function drawPieChart(canvasId, data, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth;
        const h = canvas.height = 300;
        
        ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) * 0.8;
        
        const total = data.reduce((sum, val) => sum + val, 0);
        let startAngle = -Math.PI / 2;
        
        data.forEach((val, i) => {
            const sliceAngle = (val / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            // Draw gap
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#111827'; // bg-surface
            ctx.stroke();
            
            startAngle += sliceAngle;
        });
        
        // Inner circle for donut
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#111827';
        ctx.fill();
    }

    // ----------------------------------------------------------------------
    // 7. Boot
    // ----------------------------------------------------------------------
    checkAuth();
});

    window.showModal = function(title, contentHTML) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay fade-in';
        modalOverlay.innerHTML = `
            <div class="modal glass-panel border border-color" style="width: 500px; max-width: 90%; transform: scale(0.95); transition: transform 0.2s;">
                <div class="modal-header flex justify-between align-center p-4 border-b border-color">
                    <h3 class="m-0">${title}</h3>
                    <button class="btn-icon close-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body p-4">
                    ${contentHTML}
                </div>
            </div>
        `;
        document.getElementById('modal-container').appendChild(modalOverlay);
        if (window.lucide) lucide.createIcons({ root: modalOverlay });
        
        setTimeout(() => {
            modalOverlay.querySelector('.modal').style.transform = 'scale(1)';
        }, 10);

        const closeBtn = modalOverlay.querySelector('.close-modal');
        const close = () => {
            modalOverlay.classList.remove('fade-in');
            modalOverlay.style.opacity = '0';
            setTimeout(() => modalOverlay.remove(), 200);
        };
        closeBtn.addEventListener('click', close);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) close();
        });
    };
