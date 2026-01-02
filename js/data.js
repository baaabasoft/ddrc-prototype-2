/**
 * DDRC Queue System - Data Layer
 * Stores departments, tests, and current system state.
 */

const DATA = {
    // Region Data
    regions: [
        { id: 'reg-central', name: 'Central Region', status: 'Active' },
        { id: 'reg-north', name: 'North Region', status: 'Active' },
        { id: 'reg-south', name: 'South Region', status: 'Active' }
    ],

    // Mocked ERP Data
    branches: [
        // Central Region
        { id: 'br-kochi-main', name: 'Kochi Main Branch', code: 'KOC001', queueActive: true, status: 'Active', regionId: 'reg-central' },
        { id: 'br-aluva', name: 'Aluva Hub', code: 'ALV002', queueActive: true, status: 'Active', regionId: 'reg-central' },
        { id: 'br-kakkanad', name: 'Kakkanad Center', code: 'KAK003', queueActive: false, status: 'Paused', regionId: 'reg-central' },
        { id: 'br-trivandrum', name: 'Trivandrum City', code: 'TVM001', queueActive: true, status: 'Active', regionId: 'reg-south' },

        // North Region
        { id: 'br-calicut', name: 'Calicut Branch', code: 'CLT001', queueActive: true, status: 'Active', regionId: 'reg-north' },
        { id: 'br-kannur', name: 'Kannur Center', code: 'KNR002', queueActive: true, status: 'Active', regionId: 'reg-north' },
        { id: 'br-kasaragod', name: 'Kasaragod Hub', code: 'KSD003', queueActive: false, status: 'Paused', regionId: 'reg-north' },

        // South Region
        { id: 'br-kollam', name: 'Kollam Branch', code: 'KLM002', queueActive: true, status: 'Active', regionId: 'reg-south' },
        { id: 'br-alappuzha', name: 'Alappuzha Center', code: 'ALP003', queueActive: true, status: 'Active', regionId: 'reg-south' }
    ],

    departments: [
        { id: 'dept-phlebotomy', name: 'Phlebotomy (Sample Collection)', code: 'PHL', branchIds: ['br-kochi-main'], status: 'Active', order: 1 },
        { id: 'dept-radiology', name: 'Radiology (X-Ray/Scan)', code: 'RAD', branchIds: ['br-kochi-main'], status: 'Active', order: 2 },
        { id: 'dept-cardiology', name: 'Cardiology (ECG/Echo)', code: 'CRD', branchIds: ['br-kochi-main'], status: 'Active', order: 3 },
        { id: 'dept-biochemistry', name: 'Biochemistry Lab', code: 'BIO', branchIds: ['br-kochi-main'], status: 'Active', order: 4 },
        { id: 'dept-neurology', name: 'Neurology', code: 'NEU', branchIds: ['br-kochi-main'], status: 'Paused', order: 5 }
    ],

    // Expanded Test Database (50+ Items)
    tests: [
        { id: 'tst-cholesterol', name: 'Lipid Profile', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 500, code: 'LIP001' },
        { id: 'tst-cbc', name: 'Complete Blood Count (CBC)', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 300, code: 'HAE001' },
        { id: 'tst-thyroid', name: 'Thyroid Profile (T3, T4, TSH)', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 600, code: 'BIO001' },
        { id: 'tst-lft', name: 'Liver Function Test', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 550, code: 'BIO002' },
        { id: 'tst-kft', name: 'Kidney Function Test', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 600, code: 'BIO003' },
        { id: 'tst-hba1c', name: 'HbA1c (Glycosylated Hemoglobin)', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 400, code: 'BIO004' },
        { id: 'tst-vit-d', name: 'Vitamin D Total', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 1200, code: 'IMM001' },
        { id: 'tst-vit-b12', name: 'Vitamin B12', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 800, code: 'IMM002' },
        { id: 'tst-crp', name: 'C-Reactive Protein (CRP)', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 450, code: 'IMM003' },
        { id: 'tst-iron', name: 'Iron Studies', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 700, code: 'BIO005' },

        { id: 'tst-urine-rt', name: 'Urine Routine', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 150, code: 'CLI001' },
        { id: 'tst-stool-rt', name: 'Stool Routine', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 200, code: 'CLI002' },
        { id: 'tst-blood-group', name: 'Blood Grouping & Rh', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 100, code: 'HAE002' },
        { id: 'tst-esr', name: 'Erythrocyte Sedimentation Rate', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 80, code: 'HAE003' },
        { id: 'tst-ps', name: 'Peripheral Smear', deptId: 'dept-phlebotomy', branchIds: ['br-kochi-main'], price: 150, code: 'HAE004' },

        // Radiology
        { id: 'tst-xray-chest', name: 'X-Ray Chest PA', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 400, code: 'RAD001' },
        { id: 'tst-xray-spine', name: 'X-Ray C-Spine', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 500, code: 'RAD002' },
        { id: 'tst-xray-knee', name: 'X-Ray Knee (AP/LAT)', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 600, code: 'RAD003' },
        { id: 'tst-usg-abd', name: 'USG Abdomen', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 1200, code: 'RAD004' },
        { id: 'tst-usg-pelvis', name: 'USG Pelvis', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 1000, code: 'RAD005' },
        { id: 'tst-usg-thyroid', name: 'USG Thyroid', deptId: 'dept-radiology', branchIds: ['br-kochi-main'], price: 1100, code: 'RAD006' },

        // Cardiology
        { id: 'tst-ecg', name: 'ECG (12 Lead)', deptId: 'dept-cardiology', branchIds: ['br-kochi-main'], price: 250, code: 'CRD001' },
        { id: 'tst-echo', name: 'Echocardiogram', deptId: 'dept-cardiology', branchIds: ['br-kochi-main'], price: 1500, code: 'CRD002' },
        { id: 'tst-tmt', name: 'TMT (Treadmill Test)', deptId: 'dept-cardiology', branchIds: ['br-kochi-main'], price: 2200, code: 'CRD003' },

        // Biochemistry (Replaces Consultation)
        { id: 'tst-fbs', name: 'Fasting Blood Sugar', deptId: 'dept-biochemistry', branchIds: ['br-kochi-main'], price: 150, code: 'BIO006' },
        { id: 'tst-ppbs', name: 'Post Prandial Blood Sugar', deptId: 'dept-biochemistry', branchIds: ['br-kochi-main'], price: 150, code: 'BIO007' }
    ],

    // User Management Data
    users: [
        { id: 'usr-001', name: 'Rajesh Kumar', username: 'rajesh.kumar', role: 'Staff - Phlebotomy', roleId: 'role-staff', regionId: 'reg-central', branchIds: ['br-kochi-main'], branch: 'Kochi Main Branch', status: 'Active' },
        { id: 'usr-002', name: 'Priya Menon', username: 'priya.staff', role: 'Staff - Radiology', roleId: 'role-staff', regionId: 'reg-central', branchIds: ['br-aluva'], branch: 'Aluva Hub', status: 'Active' },
        { id: 'usr-003', name: 'Arun Nair', username: 'arun.tech', role: 'Staff - Cardiology', roleId: 'role-technician', regionId: 'reg-north', branchIds: ['br-calicut'], branch: 'Calicut Branch', status: 'Inactive' }
    ],

    // User Roles
    roles: [
        { id: 'role-admin', name: 'Administrator', status: 'Active' },
        { id: 'role-manager', name: 'Branch Manager', status: 'Active' },
        { id: 'role-staff', name: 'Staff Member', status: 'Active' },
        { id: 'role-technician', name: 'Lab Technician', status: 'Active' },
        { id: 'role-receptionist', name: 'Receptionist', status: 'Active' }
    ],

    // System Modules for Permission Management
    modules: [
        { id: 'mod-dashboard', name: 'Dashboard', description: 'View dashboard and analytics' },
        { id: 'mod-patients', name: 'Patient Management', description: 'Manage patient records and registrations' },
        { id: 'mod-queue', name: 'Queue Management', description: 'Manage patient queues and assignments' },
        { id: 'mod-tests', name: 'Test Management', description: 'Manage tests and test mappings' },
        { id: 'mod-departments', name: 'Department Management', description: 'Manage departments' },
        { id: 'mod-branches', name: 'Branch Management', description: 'Manage branches' },
        { id: 'mod-regions', name: 'Region Management', description: 'Manage regions' },
        { id: 'mod-users', name: 'User Management', description: 'Manage users and access' },
        { id: 'mod-roles', name: 'Role Management', description: 'Manage user roles and permissions' }
    ],

    // Role Permissions (moduleId -> {view, edit, create})
    rolePermissions: {
        'role-admin': {
            'mod-dashboard': { view: true, edit: true, create: true },
            'mod-patients': { view: true, edit: true, create: true },
            'mod-queue': { view: true, edit: true, create: true },
            'mod-tests': { view: true, edit: true, create: true },
            'mod-departments': { view: true, edit: true, create: true },
            'mod-branches': { view: true, edit: true, create: true },
            'mod-regions': { view: true, edit: true, create: true },
            'mod-users': { view: true, edit: true, create: true },
            'mod-roles': { view: true, edit: true, create: true }
        },
        'role-staff': {
            'mod-dashboard': { view: true, edit: false, create: false },
            'mod-patients': { view: true, edit: true, create: true },
            'mod-queue': { view: true, edit: true, create: false }
        },
        'role-technician': {
            'mod-dashboard': { view: true, edit: false, create: false },
            'mod-patients': { view: true, edit: false, create: false },
            'mod-queue': { view: true, edit: true, create: false },
            'mod-tests': { view: true, edit: false, create: false }
        }
    },

    // Initial State
    // Initial State with Mock Data
    state: {
        patients: [
            { id: 100, name: 'Albin', mobile: '9876543210', token: 'T-100', branch: 'br-kochi-main', tests: ['tst-xray-chest'], status: 'waiting', completed: true, tags: ['Urgent'] },
            { id: 101, name: 'Binu', mobile: '9876543211', token: 'T-101', branch: 'br-aluva', tests: ['tst-ecg'], status: 'waiting', completed: true, tags: [] },
            { id: 102, name: 'Catherine', mobile: '9876543212', token: 'T-102', branch: 'br-kakkanad', tests: ['tst-cbc'], status: 'waiting', completed: false, tags: ['Elderly'] },
            { id: 103, name: 'Varun', mobile: '9876543213', token: 'T-103', branch: 'br-trivandrum', tests: ['tst-fbs'], status: 'waiting', completed: true, tags: ['Urgent', 'Elderly'] },
            { id: 104, name: 'Elias', mobile: '9876543214', token: 'T-104', branch: 'br-calicut', tests: ['tst-xray-knee'], status: 'waiting', completed: false, tags: [] },
            { id: 105, name: 'Fathima', mobile: '9876543215', token: 'T-105', branch: 'br-kannur', tests: ['tst-usg-abd'], status: 'waiting', completed: true, tags: [] },
            { id: 106, name: 'Gopika', mobile: '9876543216', token: 'T-106', branch: 'br-kasaragod', tests: ['tst-cbc'], status: 'waiting', completed: false, tags: ['Urgent'] },
            { id: 107, name: 'Harish', mobile: '9876543217', token: 'T-107', branch: 'br-kollam', tests: ['tst-lft'], status: 'waiting', completed: false, tags: ['Elderly', 'Urgent'] },
            { id: 108, name: 'Ibrahim', mobile: '9876543218', token: 'T-108', branch: 'br-alappuzha', tests: ['tst-tsh'], status: 'waiting', completed: true, tags: [] },
            { id: 109, name: 'Jay', mobile: '9876543219', token: 'T-109', branch: 'br-kochi-main', tests: ['tst-lipid'], status: 'waiting', completed: false, tags: ['Elderly'] },
            { id: 110, name: 'Kavya', mobile: '9876543220', token: 'T-110', branch: 'br-aluva', tests: ['tst-rft'], status: 'waiting', completed: false, tags: ['Urgent'] }
        ],
        queues: {
            'dept-phlebotomy': ['T-102', 'T-106', 'T-107', 'T-109', 'T-110'],
            'dept-radiology': ['T-104'],
            'dept-cardiology': [],
            'dept-biochemistry': [],
            'dept-neurology': []
        },
        tokenCounter: 111,
    }
};

// Ensure all depts exist in queues
DATA.departments.forEach(dept => {
    if (!DATA.state.queues[dept.id]) DATA.state.queues[dept.id] = [];
});

/**
 * Helper to look up department by ID
 */
function getDepartmentById(id) {
    return DATA.departments.find(d => d.id === id);
}

/**
 * Helper to look up test by ID
 */
function getTestById(id) {
    return DATA.tests.find(t => t.id === id);
}

/**
 * Logic Methods
 */
const DATA_CONTROLLER = {
    generateToken: () => {
        const token = `T-${DATA.state.tokenCounter}`;
        DATA.state.tokenCounter++;
        return token;
    },

    addPatient: (patient) => {
        DATA.state.patients.push(patient);
        return patient;
    },

    addToQueue: (deptId, tokenId) => {
        if (DATA.state.queues[deptId]) {
            DATA.state.queues[deptId].push(tokenId);
            console.log(`Added ${tokenId} to ${deptId}`);
            return true;
        }
        return false;
    },

    getQueueForDept: (deptId) => {
        return DATA.state.queues[deptId] || [];
    },

    // Find the department a test belongs to
    getDeptForTest: (testId) => {
        const test = getTestById(testId);
        return test ? getDepartmentById(test.deptId) : null;
    },

    getPatientByToken: (token) => {
        return DATA.state.patients.find(p => p.token === token);
    }
};
