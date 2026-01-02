/**
 * DDRC Queue System - Main Application Logic
 */

const APP = {
    tempRegistrationState: null, // Stores data between Proceed and Pay steps

    init: () => {
        console.log("DDRC Queue System Initialized");
        APP.renderTestList();
        APP.setupEventListeners();
        APP.updateTime();

        // Search Listener
        const searchInput = document.getElementById('test-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                APP.renderTestList(e.target.value);
            });
        }

        setInterval(APP.updateTime, 60000);
    },

    // ... Navigation Logic remains same ...
    navigateTo: (viewId) => {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);

            if (viewId === 'queue-view') APP.renderQueueView();
            if (viewId === 'admin-view') APP.renderAdminView();
        }
    },

    renderTestList: (filterText = '') => {
        const container = document.getElementById('test-list-container');
        if (!container) return;

        const filteredTests = DATA.tests.filter(t =>
            t.name.toLowerCase().includes(filterText.toLowerCase()) ||
            t.code.toLowerCase().includes(filterText.toLowerCase())
        );

        container.innerHTML = filteredTests.map(test => `
            <label class="test-option">
                <input type="checkbox" name="tests" value="${test.id}" data-price="${test.price}" data-name="${test.name}">
                <div class="test-name">
                    ${test.name}
                    <div style="font-size:0.8rem; color:#888;">${test.code}</div>
                </div>
                <div class="test-price">₹ ${test.price}</div>
            </label>
        `).join('');
    },

    /**
     * REGISTRATION WIZARD LOGIC
     */
    handleProceed: () => {
        const name = document.getElementById('p-name').value;
        const mobile = document.getElementById('p-mobile').value;
        const age = document.getElementById('p-age').value;

        if (!name || !mobile || mobile.length !== 10 || !age) {
            alert("Please enter valid name, mobile number and age.");
            return;
        }

        const checkboxes = document.querySelectorAll('input[name="tests"]:checked');
        const selectedTests = Array.from(checkboxes).map(cb => ({
            id: cb.value,
            name: cb.dataset.name,
            price: parseInt(cb.dataset.price)
        }));

        if (selectedTests.length === 0) {
            alert("Please select at least one test.");
            return;
        }

        const totalAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);

        // Store temp state
        APP.tempRegistrationState = {
            name,
            mobile,
            age,
            tests: selectedTests.map(t => t.id),
            totalAmount
        };

        // Render Preview
        document.getElementById('pay-preview-name').textContent = name;
        document.getElementById('pay-preview-mobile').textContent = `${mobile} (Age: ${age})`;
        document.getElementById('pay-total-amount').textContent = `₹ ${totalAmount}`;

        document.getElementById('pay-test-list').innerHTML = selectedTests.map(t => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                <span>${t.name}</span>
                <span>₹ ${t.price}</span>
            </div>
        `).join('');

        APP.navigateTo('payment-view');
    },

    handlePayment: (mode) => {
        if (mode === 'desk') {
            APP.generateToken();
        } else if (mode === 'online') {
            const qrModal = document.getElementById('qr-modal');
            qrModal.classList.remove('hidden');
            qrModal.style.display = 'flex';
        }
    },

    confirmOnlinePayment: () => {
        const qrModal = document.getElementById('qr-modal');
        qrModal.classList.add('hidden');
        qrModal.style.display = 'none';
        APP.generateToken();
    },

    generateToken: () => {
        const data = APP.tempRegistrationState;
        if (!data) return;

        // Create Patient
        const newToken = DATA_CONTROLLER.generateToken();
        const firstTestId = data.tests[0];
        const initialDept = DATA_CONTROLLER.getDeptForTest(firstTestId);

        const newPatient = {
            id: Date.now(),
            name: data.name,
            mobile: data.mobile,
            age: data.age,
            token: newToken,
            tests: data.tests,
            status: 'waiting',
            completed: false,
            tags: []
        };

        DATA.state.patients.push(newPatient);
        if (initialDept && DATA.state.queues[initialDept.id]) {
            DATA.state.queues[initialDept.id].push(newToken);
        }

        // Show Success Modal
        document.getElementById('final-token-display').textContent = newToken;
        document.getElementById('final-name-display').textContent = data.name;
        document.getElementById('final-mobile-display').textContent = `Mobile: ${data.mobile} | Age: ${data.age}`;

        const successModal = document.getElementById('token-success-modal');
        successModal.classList.remove('hidden');
        successModal.style.display = 'flex';
    },

    doneRegistration: () => {
        // Reset form
        document.getElementById('registration-form').reset();
        const successModal = document.getElementById('token-success-modal');
        successModal.classList.add('hidden');
        successModal.style.display = 'none';
        APP.navigateTo('home-view');
    },

    /**
     * Render Public Queue Display
     */
    /**
     * Render Public Queue Display
     */
    renderQueueView: () => {
        const container = document.getElementById('queue-view');
        if (!container) return;

        // Ensure container has the dark theme class
        // Ensure container has the dark theme class
        container.className = 'view-section tv-display-container';
        // Note: 'hidden' is toggled by navigateTo

        const gridContent = DATA.departments.map(dept => {
            const queue = DATA_CONTROLLER.getQueueForDept(dept.id);
            // Current Token is the one serving? 
            // In our simple model, queue[0] is waiting. 
            // Usually "Serving Now" would be separate from "Waiting Queue", 
            // but let's assume the top of the queue is "called" or we track "serving".
            // For this design: 
            // "Serving Now" = Just popped or top of list for visual? 
            // Let's use top of queue as "Next/Serving" for display simplicity or find a served token.
            // Actually, `APP.currentServingToken` is global but that's for one staff. 
            // Let's show the first person in queue as "Serving Now" (Being Called)
            // and next 2 as "Next".

            const currentToken = queue.length > 0 ? queue[0] : '--';
            const nextTokens = queue.slice(1, 3); // Next 2

            // Pad next tokens if empty
            const nextToken1 = nextTokens[0] || '-';
            const nextToken2 = nextTokens[1] || '-';

            return `
            <div class="tv-card">
                <div class="tv-card-header">
                    <span class="tv-dept-name">${dept.name}</span>
                    <span class="tv-dept-code">${dept.code}</span>
                </div>

                <div class="tv-body">
                    <div class="tv-serving-label">Serving Now</div>
                    <div class="tv-serving-token">${currentToken}</div>
                </div>

                <div class="tv-footer">
                    <div class="tv-next-label">Next in Line</div>
                    <div class="tv-next-grid">
                        <div class="tv-next-box">${nextToken1}</div>
                        <div class="tv-next-box">${nextToken2}</div>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="tv-header">
                <button class="btn btn-secondary" onclick="APP.navigateTo('home-view')" style="margin-right: 20px; background: transparent; color: white; border: 1px solid #334155;">
                    ← Back
                </button>
                <div style="flex:1;">
                    <h1>
                        <span style="background:#00A699; color:white; padding:5px 12px; border-radius:8px; font-size:1.5rem;">DDRC</span>
                        Live Queue Status
                    </h1>
                </div>
                <div class="tv-clock" id="tv-clock-display">10:30 AM</div>
            </div>

            <div class="tv-grid">
                ${gridContent}
            </div>
        `;

        // Update Time immediately
        APP.updateTime();
    },

    /**
     * Admin Logic: Login
     */
    /**
     * Admin Logic: Login
     */
    handleLogin: (e) => {
        e.preventDefault();

        const loginType = document.getElementById('login-type') ? document.getElementById('login-type').value : 'admin';
        const username = document.getElementById('login-user').value;

        if (loginType === 'admin') {
            APP.currentUser = { name: "Administrator", role: "Super Admin" };
            APP.navigateTo('admin-dashboard-view');
            APP.switchAdminTab('tab-regions');
        } else {
            // Staff Login
            const staffUser = DATA.users.find(u => u.username === username);
            if (staffUser) {
                APP.currentUser = staffUser;
                APP.navigateTo('staff-dashboard-view');
                APP.renderStaffDashboard();
            } else {
                alert("Invalid Staff Username. Try 'sarah.j' or 'rahul.k'");
            }
        }
    },

    /**
     * Admin Logic: Switch Tabs
     */
    /**
     * Admin Logic: Switch Tabs
     */
    switchAdminTab: (tabId) => {
        // Update Sidebar UI
        document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
        // Find the nav item that matches this tabId
        // We look for the onclick attribute or potentially add data-tab in future.
        // For now, simpler to match onclick content as implemented before, OR add data-tab to HTML.
        // Let's stick to the working logic from the first implementation but robustify it.
        const activeNav = Array.from(document.querySelectorAll('.admin-nav-item'))
            .find(el => el.getAttribute('onclick') && el.getAttribute('onclick').includes(tabId));

        if (activeNav) activeNav.classList.add('active');

        // Update Content UI
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(tabId);
        if (target) target.classList.remove('hidden');

        // Trigger Data Render
        if (tabId === 'tab-branches') APP.renderBranchesTable();
        if (tabId === 'tab-depts') APP.renderDeptsTable();
        if (tabId === 'tab-users') APP.renderUsersTable();
        if (tabId === 'tab-tests') APP.renderTestsTable();

        // New Tabs Logic
        if (tabId === 'tab-queue') {
            APP.renderQueueDashboard();
        }

        if (tabId === 'tab-regions') {
            APP.renderRegionsTable();
        } else if (tabId === 'tab-branches') {
            APP.renderBranchesTable();
        } else if (tabId === 'tab-roles') {
            APP.renderRolesTable();
        }

        if (tabId === 'tab-customers') {
            APP.renderCustomersTable();
        }
    },

    /**
     * Render Branches Table
     */
    renderBranchesTable: () => {
        const tbody = document.getElementById('branches-table-body');
        if (!tbody) return;
        tbody.innerHTML = DATA.branches.map(b => {
            const region = DATA.regions.find(r => r.id === b.regionId);
            return `
            <tr>
                <td>${b.name}</td>
                <td>${region ? region.name : '-'}</td>
                <td>${b.code}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${b.status === 'Active' ? 'checked' : ''} onchange="APP.toggleBranchStatus('${b.id}')">
                        <span class="slider"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9rem;">${b.status === 'Active' ? 'Active' : 'Inactive'}</span>
                </td>
            </tr>
            `;
        }).join('');
    },

    toggleBranchStatus: (branchId) => {
        const branch = DATA.branches.find(b => b.id === branchId);
        if (branch) {
            branch.status = branch.status === 'Active' ? 'Inactive' : 'Active';
            APP.renderBranchesTable();
        }
    },

    toggleRegionStatus: (regionId) => {
        const region = DATA.regions.find(r => r.id === regionId);
        if (region) {
            region.status = region.status === 'Active' ? 'Inactive' : 'Active';
            APP.renderRegionsTable();
        }
    },

    openBranchEdit: (branchId) => {
        const isEdit = !!branchId;
        const branch = isEdit ? DATA.branches.find(b => b.id === branchId) : { id: '', name: '', code: '', regionId: '', status: 'Active' };

        document.getElementById('edit-branch-id').value = branchId || '';
        document.getElementById('branch-edit-title').textContent = isEdit ? 'Edit Branch' : 'Create New Branch';
        document.getElementById('edit-branch-name').value = branch.name;
        document.getElementById('edit-branch-code').value = branch.code;
        document.getElementById('edit-branch-status').checked = branch.status === 'Active';
        document.getElementById('branch-status-group').style.display = isEdit ? 'block' : 'none';

        // Populate Region Dropdown
        const regionSelect = document.getElementById('edit-branch-region');
        regionSelect.innerHTML = DATA.regions.map(r =>
            `<option value="${r.id}" ${r.id === branch.regionId ? 'selected' : ''}>${r.name}</option>`
        ).join('');

        APP.navigateTo('admin-branch-edit-view');
    },

    /**
     * Region Management
     */
    renderRegionsTable: () => {
        const tbody = document.getElementById('regions-table-body');
        if (!tbody) return;
        tbody.innerHTML = (DATA.regions || []).map(r => `
            <tr>
                <td>${r.name}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${r.status === 'Active' ? 'checked' : ''} onchange="APP.toggleRegionStatus('${r.id}')">
                        <span class="slider"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9rem;">${r.status === 'Active' ? 'Active' : 'Inactive'}</span>
                </td>
            </tr>
        `).join('');
    },

    openRegionEdit: (regionId) => {
        const isEdit = !!regionId;
        const region = isEdit ? DATA.regions.find(r => r.id === regionId) : { id: '', name: '' };

        document.getElementById('edit-region-id').value = regionId || '';
        document.getElementById('region-edit-title').textContent = isEdit ? 'Edit Region' : 'Create New Region';
        document.getElementById('edit-region-name').value = region.name;

        APP.navigateTo('admin-region-edit-view');
    },

    /**
     * Render Roles Table
     */
    renderRolesTable: () => {
        const tbody = document.getElementById('roles-table-body');
        if (!tbody) return;
        tbody.innerHTML = (DATA.roles || []).map(role => `
            <tr>
                <td>${role.name}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${role.status === 'Active' ? 'checked' : ''} disabled>
                        <span class="slider"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9rem;">${role.status === 'Active' ? 'Active' : 'Inactive'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="APP.openRoleEdit('${role.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    },

    openRoleEdit: (roleId) => {
        const isEdit = !!roleId;
        const role = isEdit ? DATA.roles.find(r => r.id === roleId) : { id: '', name: '', status: 'Active' };

        document.getElementById('edit-role-id').value = roleId || '';
        document.getElementById('role-edit-title').textContent = isEdit ? 'Edit Role' : 'Create New Role';
        document.getElementById('edit-role-name').value = role.name;

        // Populate permissions matrix
        const permissionsBody = document.getElementById('role-permissions-body');
        const rolePerms = DATA.rolePermissions[roleId] || {};

        permissionsBody.innerHTML = DATA.modules.map(mod => {
            const perms = rolePerms[mod.id] || { view: false, edit: false, create: false };
            return `
                <tr>
                    <td>
                        <strong>${mod.name}</strong><br>
                        <small style="color: #666;">${mod.description}</small>
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="perm-checkbox" data-module="${mod.id}" data-perm="view" ${perms.view ? 'checked' : ''}>
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="perm-checkbox" data-module="${mod.id}" data-perm="edit" ${perms.edit ? 'checked' : ''}>
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="perm-checkbox" data-module="${mod.id}" data-perm="create" ${perms.create ? 'checked' : ''}>
                    </td>
                </tr>
            `;
        }).join('');

        APP.navigateTo('admin-role-edit-view');
    },

    /**
     * Render Departments Table
     */
    renderDeptsTable: () => {
        const tbody = document.getElementById('depts-table-body');
        if (!tbody) return;
        tbody.innerHTML = DATA.departments.map(d => {
            const branchNames = (d.branchIds || []).map(bId => {
                const branch = DATA.branches.find(b => b.id === bId);
                return branch ? branch.name : 'Unknown';
            }).join(', ');

            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.code}</td>
                <td style="font-size: 0.85rem; color: #666;">${branchNames || '<span style="color:red">None</span>'}</td>
                <td><span class="badge ${d.status === 'Active' ? 'badge-active' : 'badge-paused'}">${d.status}</span></td>
                <td>
                     <button class="btn btn-sm btn-secondary" onclick="APP.openDeptEdit('${d.id}')">Edit</button>
                </td>
            </tr>
            `;
        }).join('');
    },

    openDeptEdit: (deptId) => {
        const dept = DATA.departments.find(d => d.id === deptId);
        if (!dept) return;

        document.getElementById('edit-dept-id').value = dept.id;
        document.getElementById('edit-dept-name').value = dept.name;
        document.getElementById('edit-dept-code').value = dept.code;
        document.getElementById('edit-dept-status').checked = dept.status === 'Active';

        // Populate Region Filter Dropdown
        const regionFilter = document.getElementById('dept-region-filter');
        if (regionFilter) {
            regionFilter.innerHTML = '<option value="">All Regions</option>' +
                DATA.regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        }

        // Populate Branch Multiselect (initially show all)
        APP.renderDeptBranchesMultiselect(dept.branchIds || []);

        APP.navigateTo('admin-dept-edit-view');
    },

    renderDeptBranchesMultiselect: (selectedBranchIds, regionFilter = '') => {
        const container = document.getElementById('edit-dept-branches-container');
        if (!container) return;

        let branchesToShow = DATA.branches;
        if (regionFilter) {
            branchesToShow = DATA.branches.filter(b => b.regionId === regionFilter);
        }

        container.innerHTML = branchesToShow.map(b => `
            <label class="multi-select-item">
                <input type="checkbox" value="${b.id}" class="dept-branch-checkbox" 
                    ${selectedBranchIds.includes(b.id) ? 'checked' : ''}>
                <span>${b.name}</span>
            </label>
        `).join('');
    },

    filterDeptBranchesByRegion: () => {
        const regionFilter = document.getElementById('dept-region-filter').value;
        const currentlySelected = Array.from(document.querySelectorAll('.dept-branch-checkbox:checked')).map(cb => cb.value);
        APP.renderDeptBranchesMultiselect(currentlySelected, regionFilter);
    },

    /**
     * Render Users Table
     */
    renderUsersTable: () => {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = DATA.users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.username}</td>
                <td>${u.role}</td>
                <td>${u.branch}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="APP.openUserEdit('${u.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    },

    showAddUserModal: () => {
        APP.openUserEdit(null); // Create mode
    },

    openUserEdit: (userId) => {
        const isEdit = !!userId;
        const user = isEdit ? DATA.users.find(u => u.id === userId) : {
            id: '', name: '', username: '', roleId: '', regionId: '', branchIds: [], status: 'Active'
        };

        document.getElementById('edit-user-id').value = userId || '';
        document.getElementById('user-edit-title').textContent = isEdit ? 'Edit User' : 'Create New User';
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-username').value = user.username;
        document.getElementById('edit-user-status').checked = user.status === 'Active';
        document.getElementById('user-status-group').style.display = isEdit ? 'block' : 'none';
        document.getElementById('btn-resend-creds').style.display = isEdit ? 'block' : 'none';
        document.getElementById('btn-save-user').textContent = isEdit ? 'Save User' : 'Save & Send Credentials';

        // Populate Role Dropdown
        const roleSelect = document.getElementById('edit-user-role');
        roleSelect.innerHTML = DATA.roles.map(r =>
            `<option value="${r.id}" ${r.id === user.roleId ? 'selected' : ''}>${r.name}</option>`
        ).join('');

        // Populate Region Dropdown
        const regionSelect = document.getElementById('edit-user-region');
        regionSelect.innerHTML = '<option value="">Select Region</option>' +
            DATA.regions.map(r => `<option value="${r.id}" ${r.id === user.regionId ? 'selected' : ''}>${r.name}</option>`).join('');

        // Populate Branch Multiselect (initially show all or filtered by region)
        APP.renderUserBranchesMultiselect(user.branchIds || [], user.regionId || '');

        APP.navigateTo('admin-user-edit-view');
    },

    renderUserBranchesMultiselect: (selectedBranchIds, regionFilter = '') => {
        const container = document.getElementById('edit-user-branches-container');
        if (!container) return;

        let branchesToShow = DATA.branches;
        if (regionFilter) {
            branchesToShow = DATA.branches.filter(b => b.regionId === regionFilter);
        }

        container.innerHTML = branchesToShow.map(b => `
            <label class="multi-select-item">
                <input type="checkbox" value="${b.id}" class="user-branch-checkbox" 
                    ${selectedBranchIds.includes(b.id) ? 'checked' : ''}>
                <span>${b.name}</span>
            </label>
        `).join('');
    },

    filterUserBranchesByRegion: () => {
        const regionFilter = document.getElementById('edit-user-region').value;
        const currentlySelected = Array.from(document.querySelectorAll('.user-branch-checkbox:checked')).map(cb => cb.value);
        APP.renderUserBranchesMultiselect(currentlySelected, regionFilter);
    },

    handleResendCreds: () => {
        alert("Login credentials have been resent to the user successfully.");
    },

    /**
     * Render Tests Table
     */
    renderTestsTable: () => {
        const tbody = document.getElementById('tests-table-body');
        if (!tbody) return;
        tbody.innerHTML = DATA.tests.map(t => {
            const dept = DATA_CONTROLLER.getDeptForTest(t.id);
            const branchNames = (t.branchIds || []).map(bId => {
                const branch = DATA.branches.find(b => b.id === bId);
                return branch ? branch.name : 'Unknown';
            }).join(', ');

            return `
            <tr>
                <td>${t.name}</td>
                <td>${t.code}</td>
                <td>₹${t.price}</td>
                <td style="font-size: 0.85rem; color: #666;">${branchNames || '-'}</td>
                <td>${dept ? dept.name : '<span style="color:red">Unassigned</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="APP.openTestEdit('${t.id}')">Edit</button>
                </td>
            </tr>
            `;
        }).join('');
    },

    openTestEdit: (testId) => {
        const isEdit = !!testId;
        const test = isEdit ? DATA.tests.find(t => t.id === testId) : { id: '', name: '', code: '', price: '', branchIds: [], deptId: '' };

        document.getElementById('edit-test-id').value = testId || '';
        document.getElementById('test-edit-title').textContent = isEdit ? 'Edit Test' : 'Create New Test';
        document.getElementById('edit-test-name').value = test.name;
        document.getElementById('edit-test-code').value = test.code;
        document.getElementById('edit-test-price').value = test.price;

        // Populate Region Filter Dropdown
        const regionFilter = document.getElementById('test-region-filter');
        if (regionFilter) {
            regionFilter.innerHTML = '<option value="">All Regions</option>' +
                DATA.regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        }

        // Populate Branch Multiselect (initially show all)
        APP.renderTestBranchesMultiselect(test.branchIds || []);

        // Populate Dept Dropdown
        const deptSelect = document.getElementById('edit-test-dept');
        deptSelect.innerHTML = DATA.departments.map(d =>
            `<option value="${d.id}" ${d.id === test.deptId ? 'selected' : ''}>${d.name}</option>`
        ).join('');

        APP.navigateTo('admin-test-edit-view');
    },

    renderTestBranchesMultiselect: (selectedBranchIds, regionFilter = '') => {
        const container = document.getElementById('edit-test-branches-container');
        if (!container) return;

        let branchesToShow = DATA.branches;
        if (regionFilter) {
            branchesToShow = DATA.branches.filter(b => b.regionId === regionFilter);
        }

        container.innerHTML = branchesToShow.map(b => `
            <label class="multi-select-item">
                <input type="checkbox" value="${b.id}" class="test-branch-checkbox" 
                    ${selectedBranchIds.includes(b.id) ? 'checked' : ''}>
                <span>${b.name}</span>
            </label>
        `).join('');
    },

    filterTestBranchesByRegion: () => {
        const regionFilter = document.getElementById('test-region-filter').value;
        const currentlySelected = Array.from(document.querySelectorAll('.test-branch-checkbox:checked')).map(cb => cb.value);
        APP.renderTestBranchesMultiselect(currentlySelected, regionFilter);
    },



    /**
     * Event Listeners Setup
     */
    /**
     * QUEUE MANAGEMENT & KANBAN
     */
    renderQueueDashboard: () => {
        const branchSelect = document.getElementById('queue-branch-select');
        let branchId = branchSelect ? branchSelect.value : DATA.branches[0].id;

        // Populate Select if empty
        if (branchSelect && branchSelect.options.length === 0) {
            branchSelect.innerHTML = DATA.branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            branchId = DATA.branches[0].id;
            branchSelect.value = branchId;
        }

        // Stats Calculation with Safe Access
        const safePatients = DATA.state.patients || [];
        const activeCustomers = safePatients.filter(p => !p.completed).length;
        const totalVisits = (DATA.state.tokenCounter || 100) - 100;
        const completedTests = safePatients.filter(p => p.completed).length;

        const statActive = document.getElementById('stat-active-customers');
        if (statActive) statActive.textContent = activeCustomers;

        const statTotal = document.getElementById('stat-total-visits');
        if (statTotal) statTotal.textContent = totalVisits;

        const statCompleted = document.getElementById('stat-tests-completed');
        if (statCompleted) statCompleted.textContent = completedTests;

        APP.renderKanbanBoard(branchId);
    },

    renderKanbanBoard: (branchId) => {
        const board = document.getElementById('kanban-board');
        const depts = DATA.departments.filter(d => (d.branchIds || []).includes(branchId));

        board.innerHTML = depts.map(dept => `
            <div class="kanban-column" 
                 ondragover="APP.allowDrop(event)" 
                 ondrop="APP.drop(event, '${dept.id}')"
                 ondragleave="APP.dragLeave(event)">
                 
                <div class="kanban-header">
                    <span>${dept.name}</span>
                    <span class="badge badge-active">${DATA.state.queues[dept.id]?.length || 0}</span>
                </div>
                
                <div class="kanban-list" id="col-${dept.id}">
                    ${(DATA.state.queues[dept.id] || []).map(token => {
            const patient = DATA_CONTROLLER.getPatientByToken(token);
            return `
                        <div class="kanban-card" 
                             draggable="true" 
                             ondragstart="APP.drag(event, '${token}')" 
                             id="card-${token}">
                            <h4>${token}</h4>
                            <p>${patient ? patient.name : 'Unknown'}</p>
                            <p style="font-size: 0.8rem; margin-top: 5px;">Wait: 5m</p>
                        </div>
                        `;
        }).join('')}
                    ${(!DATA.state.queues[dept.id] || DATA.state.queues[dept.id].length === 0) ?
                '<div style="text-align:center; padding:20px; color:#aaa; font-style:italic;">No Patients</div>' : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * DRAG & DROP HANDLERS
     */
    allowDrop: (ev) => {
        ev.preventDefault();
        // Visual feedback
        const col = ev.target.closest('.kanban-column');
        if (col) col.classList.add('drag-over');
    },

    dragLeave: (ev) => {
        const col = ev.target.closest('.kanban-column');
        if (col) col.classList.remove('drag-over');
    },

    drag: (ev, token) => {
        ev.dataTransfer.setData("text/plain", token);
        ev.dataTransfer.effectAllowed = "move";
    },

    drop: (ev, deptId) => {
        ev.preventDefault();

        // Remove visual feedback
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));

        const token = ev.dataTransfer.getData("text/plain");
        if (!token) return;

        // Logic to move patient
        // 1. Find current dept
        let currentDeptId = null;
        for (const [dId, q] of Object.entries(DATA.state.queues)) {
            if (q.includes(token)) {
                currentDeptId = dId;
                break;
            }
        }

        if (currentDeptId && currentDeptId !== deptId) {
            // Remove from old
            DATA.state.queues[currentDeptId] = DATA.state.queues[currentDeptId].filter(t => t !== token);
            // Add to new
            if (!DATA.state.queues[deptId]) DATA.state.queues[deptId] = [];
            DATA.state.queues[deptId].push(token);

            // Re-render
            APP.renderQueueDashboard();
        }
    },

    showAiSuggestions: () => {
        // Create a custom modal for suggestions if it doesn't exist
        let modal = document.getElementById('ai-suggestion-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ai-suggestion-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
            `;
            modal.innerHTML = `
                <div style="background: white; padding: 25px; border-radius: 12px; width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <h2 style="margin:0; color: var(--primary-color);">✨ AI Optimization Insights</h2>
                        <button onclick="document.getElementById('ai-suggestion-modal').style.display='none'" style="border:none; background:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>
                    <div style="font-size: 0.95rem; color: #444; line-height: 1.6;">
                        <p><strong>Analysis:</strong> High patient load detected in Radiology (Wait time > 20m).</p>
                        <div style="background: #f0f7ff; border-left: 4px solid #0056b3; padding: 15px; margin: 15px 0; border-radius: 4px;">
                            <h4 style="margin:0 0 5px 0;">Recommended Actions:</h4>
                            <ul style="margin:0; padding-left: 20px;">
                                <li style="margin-bottom: 8px;">Move <strong>T-100 (Albin)</strong> from <em>Radiology</em> to <em>Cardiology</em> to utilize free slot.</li>
                                <li style="margin-bottom: 8px;">Assign <strong>T-103 (Varun)</strong> to High Priority queue due to elderly status.</li>
                                <li>Open <strong>Counter 3</strong> in Phlebotomy for rapid sample collection.</li>
                            </ul>
                        </div>
                        <p style="font-size: 0.85rem; color: #888;">*Applying these changes will reduce average wait time by approx. 12 minutes.</p>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn btn-secondary" onclick="document.getElementById('ai-suggestion-modal').style.display='none'">Dismiss</button>
                        <button class="btn btn-primary" onclick="alert('Optimization Applied!'); document.getElementById('ai-suggestion-modal').style.display='none'">Apply Auto-Fix</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }
    },

    /**
     * CUSTOMER MANAGEMENT
     */
    renderCustomersTable: () => {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        // Populate Region Filter
        const regionFilter = document.getElementById('customer-region-filter');
        if (regionFilter && regionFilter.children.length === 1) {
            regionFilter.innerHTML = '<option value="">All Regions</option>' +
                DATA.regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        }

        // Populate Branch Filter (initially all branches)
        const branchFilter = document.getElementById('customer-branch-filter');
        if (branchFilter) {
            const selectedRegion = regionFilter ? regionFilter.value : '';
            const branches = selectedRegion ? DATA.branches.filter(b => b.regionId === selectedRegion) : DATA.branches;
            branchFilter.innerHTML = '<option value="">All Branches</option>' +
                branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }

        // Filter patients
        const selectedBranch = branchFilter ? branchFilter.value : '';
        let filteredPatients = DATA.state.patients;

        if (selectedBranch) {
            filteredPatients = filteredPatients.filter(p => p.branch === selectedBranch);
        }

        // Render table
        tbody.innerHTML = filteredPatients.map(p => {
            const branch = DATA.branches.find(b => b.id === p.branch);
            return `
            <tr>
                <td>${p.name}</td>
                <td>${p.mobile}</td>
                <td>${branch ? branch.name : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="APP.showCustomerDetails('${p.token}')">View</button>
                </td>
            </tr>
            `;
        }).join('');
    },

    filterCustomersByRegion: () => {
        const regionFilter = document.getElementById('customer-region-filter');
        const branchFilter = document.getElementById('customer-branch-filter');

        if (regionFilter && branchFilter) {
            const selectedRegion = regionFilter.value;
            const branches = selectedRegion ? DATA.branches.filter(b => b.regionId === selectedRegion) : DATA.branches;

            branchFilter.innerHTML = '<option value="">All Branches</option>' +
                branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }

        APP.renderCustomersTable();
    },

    filterCustomers: () => {
        APP.renderCustomersTable();
    },

    showCustomerDetails: (token) => {
        const patient = DATA_CONTROLLER.getPatientByToken(token);
        if (!patient) return;

        const content = document.getElementById('customer-detail-content');
        content.innerHTML = `
            <div class="flex-row">
                <div class="col-half">
                    <h3>${patient.name}</h3>
                    <p>Token: <strong>${patient.token}</strong></p>
                    <p>Mobile: ${patient.mobile}</p>
                </div>
                <div class="col-half" style="text-align: right;">
                    <span class="badge ${patient.completed ? 'badge-active' : 'badge-paused'}">${patient.completed ? 'Completed' : 'Active'}</span>
                </div>
            </div>
            
            <h4 style="margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Test History</h4>
            <table class="data-table">
                <thead><tr><th>Test</th><th>Status</th></tr></thead>
                <tbody>
                    ${patient.tests.map(t => {
            const test = DATA.tests.find(x => x.id === t);
            return `<tr><td>${test.name}</td><td>Pending</td></tr>`;
        }).join('')}
                </tbody>
            </table>
        `;
        APP.navigateTo('admin-customer-detail-view');
    },



    setupEventListeners: () => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', APP.handleLogin);
        }

        // Admin Edit Forms
        const deptForm = document.getElementById('dept-edit-form');
        if (deptForm) {
            deptForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-dept-id').value;
                const dept = DATA.departments.find(d => d.id === id);
                if (dept) {
                    const checkedIds = Array.from(document.querySelectorAll('.dept-branch-checkbox:checked')).map(cb => cb.value);
                    dept.branchIds = checkedIds;
                    dept.status = document.getElementById('edit-dept-status').checked ? 'Active' : 'Paused';
                    alert('Department updated successfully.');
                    APP.navigateTo('admin-dashboard-view');
                    APP.switchAdminTab('tab-depts');
                }
            });
        }

        const userForm = document.getElementById('user-edit-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-user-id').value;
                const selectedBranchIds = Array.from(document.querySelectorAll('.user-branch-checkbox:checked')).map(cb => cb.value);

                if (id) {
                    // Edit Mode
                    const user = DATA.users.find(u => u.id === id);
                    if (user) {
                        user.name = document.getElementById('edit-user-name').value;
                        user.username = document.getElementById('edit-user-username').value;
                        user.roleId = document.getElementById('edit-user-role').value;
                        user.regionId = document.getElementById('edit-user-region').value;
                        user.branchIds = selectedBranchIds;
                        user.status = document.getElementById('edit-user-status').checked ? 'Active' : 'Inactive';

                        // Update legacy fields for compatibility
                        const role = DATA.roles.find(r => r.id === user.roleId);
                        user.role = role ? role.name : '';
                        user.branch = selectedBranchIds.length > 0 ? selectedBranchIds[0] : '';

                        alert('User updated successfully.');
                    }
                } else {
                    // Create Mode
                    const roleId = document.getElementById('edit-user-role').value;
                    const role = DATA.roles.find(r => r.id === roleId);

                    const newUser = {
                        id: 'usr-' + Date.now(),
                        name: document.getElementById('edit-user-name').value,
                        username: document.getElementById('edit-user-username').value,
                        roleId: roleId,
                        role: role ? role.name : '',
                        regionId: document.getElementById('edit-user-region').value,
                        branchIds: selectedBranchIds,
                        branch: selectedBranchIds.length > 0 ? selectedBranchIds[0] : '',
                        status: 'Active'
                    };
                    DATA.users.push(newUser);
                    alert('Login credentials have been sent to the user successfully.');
                }
                APP.navigateTo('admin-dashboard-view');
                APP.switchAdminTab('tab-users');
            });
        }

        const roleForm = document.getElementById('role-edit-form');
        if (roleForm) {
            roleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-role-id').value;
                const name = document.getElementById('edit-role-name').value;

                // Collect permissions from checkboxes
                const permissions = {};
                document.querySelectorAll('.perm-checkbox').forEach(checkbox => {
                    const moduleId = checkbox.dataset.module;
                    const permType = checkbox.dataset.perm;

                    if (!permissions[moduleId]) {
                        permissions[moduleId] = { view: false, edit: false, create: false };
                    }
                    permissions[moduleId][permType] = checkbox.checked;
                });

                if (id) {
                    // Edit Mode
                    const role = DATA.roles.find(r => r.id === id);
                    if (role) {
                        role.name = name;
                        DATA.rolePermissions[id] = permissions;
                        alert('Role updated successfully.');
                    }
                } else {
                    // Create Mode
                    const newRoleId = 'role-' + Date.now();
                    DATA.roles.push({ id: newRoleId, name, status: 'Active' });
                    DATA.rolePermissions[newRoleId] = permissions;
                    alert('New Role created successfully.');
                }
                APP.navigateTo('admin-dashboard-view');
                APP.switchAdminTab('tab-roles');
            });
        }

        const regionForm = document.getElementById('region-edit-form');
        if (regionForm) {
            regionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-region-id').value;
                const name = document.getElementById('edit-region-name').value;

                if (id) {
                    const region = DATA.regions.find(r => r.id === id);
                    if (region) region.name = name;
                    alert('Region updated successfully.');
                } else {
                    DATA.regions.push({ id: 'reg-' + Date.now(), name });
                    alert('New Region created.');
                }
                APP.navigateTo('admin-dashboard-view');
                APP.switchAdminTab('tab-regions');
            });
        }

        const branchForm = document.getElementById('branch-edit-form');
        if (branchForm) {
            branchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-branch-id').value;
                const formData = {
                    name: document.getElementById('edit-branch-name').value,
                    regionId: document.getElementById('edit-branch-region').value,
                    code: document.getElementById('edit-branch-code').value,
                    status: document.getElementById('edit-branch-status').checked ? 'Active' : 'Paused'
                };

                if (id) {
                    const branch = DATA.branches.find(b => b.id === id);
                    if (branch) Object.assign(branch, formData);
                    alert('Branch updated successfully.');
                } else {
                    DATA.branches.push({ id: 'br-' + Date.now(), ...formData });
                    alert('New Branch created.');
                }
                APP.navigateTo('admin-dashboard-view');
                APP.switchAdminTab('tab-branches');
            });
        }

        const testForm = document.getElementById('test-edit-form');
        if (testForm) {
            testForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-test-id').value;

                const checkedBranchIds = Array.from(document.querySelectorAll('.test-branch-checkbox:checked')).map(cb => cb.value);
                const formData = {
                    name: document.getElementById('edit-test-name').value,
                    code: document.getElementById('edit-test-code').value,
                    price: parseInt(document.getElementById('edit-test-price').value),
                    branchIds: checkedBranchIds,
                    deptId: document.getElementById('edit-test-dept').value
                };

                if (id) {
                    const test = DATA.tests.find(t => t.id === id);
                    if (test) Object.assign(test, formData);
                    alert('Test mapping updated.');
                } else {
                    DATA.tests.push({ id: 'tst-' + Date.now(), ...formData });
                    alert('New Test created successfully.');
                }
                APP.navigateTo('admin-dashboard-view');
                APP.switchAdminTab('tab-tests');
            });
        }
    },

    /**
     * STAFF DASHBOARD LOGIC
     */
    switchLoginTab: (type) => {
        document.querySelectorAll('.login-tab').forEach(el => {
            el.classList.remove('active');
            el.style.borderBottom = 'none';
            el.style.color = '#aaa';
        });

        const activeTab = document.getElementById(`tab-login-${type}`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.borderBottom = '2px solid var(--primary-color)';
            activeTab.style.color = '#000';
        }

        document.getElementById('login-type').value = type;
        document.getElementById('login-title').textContent = type === 'admin' ? 'Admin Access' : 'Staff Portal';
        document.getElementById('login-subtitle').textContent = type === 'admin' ? 'System Configuration Dashboard' : 'Department Queue Management';
    },

    /**
     * UI Helpers
     */
    toggleSidebar: () => {
        const sidebar = document.getElementById('admin-sidebar-nav');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    },

    renderStaffDashboard: () => {
        const user = APP.currentUser;
        if (!user) return;

        // Determine Dept from Role
        let deptId = null;
        if (user.role.includes('Phlebotomy')) deptId = 'dept-phlebotomy';
        if (user.role.includes('Radiology')) deptId = 'dept-radiology';
        if (user.role.includes('Cardiology')) deptId = 'dept-cardiology';

        const dept = DATA.departments.find(d => d.id === deptId);

        document.getElementById('staff-welcome').textContent = `Welcome, ${user.name}`;
        document.getElementById('staff-dept-label').textContent = dept ? dept.name : 'General Staff';

        if (!dept) return;
        APP.currentStaffDeptId = dept.id;

        // Render Queue
        const queueTokens = DATA.state.queues[dept.id] || [];
        document.getElementById('staff-queue-count').textContent = `${queueTokens.length} Waiting`;

        const listContainer = document.getElementById('staff-queue-list');
        listContainer.innerHTML = queueTokens.map((token, index) => {
            const patient = DATA_CONTROLLER.getPatientByToken(token);
            const isSelected = APP.currentServingToken === token;

            // Generate Tags Logic
            let tagsHtml = '';
            if (patient && patient.tags && patient.tags.length > 0) {
                tagsHtml = patient.tags.map(tag => {
                    let badgeClass = 'badge'; // Default
                    if (tag === 'Urgent') badgeClass += ' badge-urgent';
                    else if (tag === 'Elderly') badgeClass += ' badge-elderly';
                    else badgeClass += ' badge-active'; // Fallback

                    return `<span class="${badgeClass}" style="margin-left: 8px; font-size: 0.7rem;">${tag}</span>`;
                }).join('');
            }

            return `
                <div class="staff-card ${isSelected ? 'active' : ''}" 
                     draggable="true"
                     ondragstart="APP.staffDragStart(event, '${token}', ${index})"
                     ondragover="APP.staffDragOver(event)"
                     ondrop="APP.staffDrop(event, ${index})"
                     style="background: ${isSelected ? '#e6fffa' : '#f8f9fa'}; padding: 15px; border-left: 5px solid ${isSelected ? 'var(--primary-color)' : '#ddd'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                     onclick="APP.selectStaffPatient('${token}')">
                    <div style="flex:1;">
                        <h3 style="margin:0; font-size: 1.2rem; display:flex; align-items:center gap:10px;">
                            ${token} ${tagsHtml}
                        </h3>
                        <p style="margin:0; color: #666; font-size: 0.9rem;">${patient ? patient.name : 'Unknown'}</p>
                    </div>
                    <div style="text-align: right;">
                         <span class="badge ${index === 0 ? 'badge-active' : ''}">${index === 0 ? 'Next' : 'Waiting'}</span>
                    </div>
                </div>
            `;
        }).join('');

        // If no selection but queue exists, auto select first? Or allow manual.
        // Let's keep manual or current selection
        if (!APP.currentServingToken && queueTokens.length > 0) {
            APP.selectStaffPatient(queueTokens[0]);
        }
    },

    // Staff Reordering Handlers
    staffDragStart: (ev, token, index) => {
        ev.dataTransfer.setData("text/plain", JSON.stringify({ token, index }));
        ev.dataTransfer.effectAllowed = "move";
    },

    staffDragOver: (ev) => {
        ev.preventDefault(); // Necessary for drop to work
        ev.dataTransfer.dropEffect = "move";
    },

    staffDrop: (ev, targetIndex) => {
        ev.preventDefault();
        const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
        const fromIndex = data.index;
        const deptId = APP.currentStaffDeptId;

        if (fromIndex === targetIndex) return;

        // Reorder Array
        const queue = DATA.state.queues[deptId];
        const item = queue.splice(fromIndex, 1)[0];
        queue.splice(targetIndex, 0, item);

        // Re-render
        APP.renderStaffDashboard();
    },

    selectStaffPatient: (token) => {
        APP.currentServingToken = token;
        const patient = DATA_CONTROLLER.getPatientByToken(token);

        document.getElementById('staff-serving-token').textContent = token;
        document.getElementById('staff-serving-name').textContent = patient ? patient.name : 'Unknown';
        document.getElementById('staff-actions').classList.remove('hidden');
        APP.renderStaffDashboard(); // Re-render to update active styling
    },

    clearStaffSelection: () => {
        APP.currentServingToken = null;
        document.getElementById('staff-serving-token').textContent = "--";
        document.getElementById('staff-serving-name').textContent = "No Active Patient";
        document.getElementById('staff-actions').classList.add('hidden');
    },

    callCustomer: () => {
        alert(`📢 Calling Token ${APP.currentServingToken} to Counter!`);
    },

    openAssignModal: () => {
        const token = APP.currentServingToken;
        if (!token) return;

        const patient = DATA_CONTROLLER.getPatientByToken(token);
        document.getElementById('assign-token-display').textContent = token;

        // Ensure Modal is Visible
        const modal = document.getElementById('assign-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Force flex display

        // Render Pending Tests
        const pendingList = document.getElementById('assign-pending-tests');
        pendingList.innerHTML = patient.tests.map(tId => {
            const test = DATA.tests.find(t => t.id === tId);
            return `<li>${test.name} (${test.code})</li>`;
        }).join('');

        // Populate Dept Dropdown (Exclude current)
        const select = document.getElementById('assign-next-dept');
        select.innerHTML = DATA.departments
            .filter(d => d.id !== APP.currentStaffDeptId)
            .map(d => `<option value="${d.id}">${d.name}</option>`)
            .join('');

        // AI Suggestion Logic
        document.getElementById('ai-suggestion-box').style.display = 'none'; // Reset
        const randomDept = DATA.departments.find(d => d.id !== APP.currentStaffDeptId && d.status === 'Active');
        if (randomDept) {
            document.getElementById('ai-suggestion-box').style.display = 'block';
            document.getElementById('ai-suggestion-text').textContent = `Recommended: ${randomDept.name} (Queue: Low, Wait < 10m)`;
            select.value = randomDept.id;
        }
    },

    closeAssignModal: () => {
        document.getElementById('assign-modal').style.display = 'none';
        // Also clear selection to reset view? Maybe not, keep context.
    },

    submitAssignment: () => {
        const nextDeptId = document.getElementById('assign-next-dept').value;
        const token = APP.currentServingToken;
        const currentDeptId = APP.currentStaffDeptId;

        if (token && nextDeptId && currentDeptId) {
            // Remove from current
            DATA.state.queues[currentDeptId] = DATA.state.queues[currentDeptId].filter(t => t !== token);

            // Add to next
            if (!DATA.state.queues[nextDeptId]) DATA.state.queues[nextDeptId] = [];
            DATA.state.queues[nextDeptId].push(token);

            alert(`✅ Patient ${token} transferred to ${DATA.departments.find(d => d.id === nextDeptId).name}`);

            // Clear selection after transfer
            APP.currentServingToken = null;
            APP.closeAssignModal();
            APP.renderStaffDashboard();
            // Also need to clear the action view details
            APP.clearStaffSelection();
        }
    },

    updateTime: () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const display = document.getElementById('time-display');
        if (display) display.textContent = timeString;

        const tvClock = document.getElementById('tv-clock-display');
        if (tvClock) tvClock.textContent = timeString;
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', APP.init);
