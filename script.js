// ==================== Autentikasi Login ====================

// Halaman Login
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Kredensial Login
        const validUsername = 'admin';
        const validPassword = 'altra2283';

        if (username === validUsername && password === validPassword) {
            // Simpan status login di sessionStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            // Redirect ke halaman tugas
            window.location.href = 'tasks.html';
        } else {
            // Tampilkan pesan error
            loginError.classList.remove('d-none');
        }
    });
}

// Halaman Tugas
if (document.getElementById('tasks-table')) {
    // Cek apakah pengguna sudah login
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });

    // ==================== Dark Mode ====================
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.body.classList.add(currentTheme);
    }

    darkModeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
        let theme = 'light';
        if (document.body.classList.contains('dark-mode')) {
            theme = 'dark-mode';
        }
        localStorage.setItem('theme', theme);
    });

    // ==================== Export/Import Data ====================
    const exportBtn = document.getElementById('export-btn');
    const importFileInput = document.getElementById('import-file');

    exportBtn.addEventListener('click', function () {
        const tasks = getTasks();
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks_export_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    saveTasks(importedTasks);
                    displayTasks();
                    alert('Data berhasil diimpor!');
                } else {
                    throw new Error('Format data tidak valid.');
                }
            } catch (error) {
                alert('Gagal mengimpor data: ' + error.message);
            }
        };
        reader.readAsText(file);
        // Reset the input
        this.value = '';
    });

    // ==================== Manajemen Tugas ====================

    // Ambil elemen-elemen dari DOM
    const taskForm = document.getElementById('task-form');
    const tasksTableBody = document.querySelector('#tasks-table tbody');
    const noTasksMsg = document.getElementById('no-tasks');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');

    // Form fields
    const taskIdField = document.getElementById('task-id');
    const titleField = document.getElementById('title');
    const descriptionField = document.getElementById('description');
    const dueDateField = document.getElementById('due-date');
    const labelField = document.getElementById('label');
    const priorityField = document.getElementById('priority');
    const statusField = document.getElementById('status');
    const fileField = document.getElementById('file');
    const filePreview = document.getElementById('file-preview');

    // Filter & Search fields
    const searchField = document.getElementById('search');
    const filterLabelField = document.getElementById('filter-label');
    const filterStatusField = document.getElementById('filter-status');
    const sortTasksField = document.getElementById('sort-tasks');
    const clearFiltersBtn = document.getElementById('clear-filters');

    // Fungsi untuk mendapatkan tugas dari Local Storage
    function getTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // Fungsi untuk menyimpan tugas ke Local Storage
    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Fungsi untuk menampilkan lampiran file
    function displayFile(file) {
        if (!file) return '-';
        const fileType = file.type.split('/')[0];
        if (fileType === 'image') {
            return `<img src="${file.data}" alt="${file.name}" class="img-thumbnail">`;
        } else {
            return `<a href="${file.data}" download="${file.name}">${file.name}</a>`;
        }
    }

    // Fungsi untuk menampilkan tugas di tabel dengan filter, pencarian, dan sortir
    function displayTasks() {
        let tasks = getTasks();
        const searchQuery = searchField.value.toLowerCase();
        const filterLabel = filterLabelField.value;
        const filterStatus = filterStatusField.value;
        const sortOption = sortTasksField.value;

        // Filter dan pencarian
        tasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery) ||
                (task.description && task.description.toLowerCase().includes(searchQuery));
            const matchesLabel = filterLabel ? task.label === filterLabel : true;
            const matchesStatus = filterStatus ? task.status === filterStatus : true;
            return matchesSearch && matchesLabel && matchesStatus;
        });

        // Sortir
        if (sortOption) {
            switch (sortOption) {
                case 'dueDateAsc':
                    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                    break;
                case 'dueDateDesc':
                    tasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
                    break;
                case 'priorityAsc':
                    tasks.sort((a, b) => priorityValue(a.priority) - priorityValue(b.priority));
                    break;
                case 'priorityDesc':
                    tasks.sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));
                    break;
                case 'labelAsc':
                    tasks.sort((a, b) => a.label.localeCompare(b.label));
                    break;
                case 'labelDesc':
                    tasks.sort((a, b) => b.label.localeCompare(a.label));
                    break;
                default:
                    break;
            }
        }

        tasksTableBody.innerHTML = '';

        if (tasks.length === 0) {
            noTasksMsg.style.display = 'block';
            return;
        } else {
            noTasksMsg.style.display = 'none';
        }

        tasks.forEach((task, index) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${task.title}</td>
                <td>${task.description || '-'}</td>
                <td>${task.label}</td>
                <td>${task.priority}</td>
                <td>${task.dueDate}</td>
                <td>${task.status}</td>
                <td>${displayFile(task.file)}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Hapus</button>
                </td>
            `;

            tasksTableBody.appendChild(tr);
        });
    }

    // Fungsi untuk menentukan nilai prioritas untuk sortir
    function priorityValue(priority) {
        const priorities = {
            'Sangat Tinggi': 5,
            'Tinggi': 4,
            'Sedang': 3,
            'Rendah': 2,
            'Sangat Rendah': 1
        };
        return priorities[priority] || 0;
    }

    // Fungsi untuk mengonversi file ke Base64
    function getFileData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
            }
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    name: file.name,
                    type: file.type,
                    data: reader.result
                });
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Fungsi untuk menambahkan atau memperbarui tugas
    taskForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = taskIdField.value;
        const title = titleField.value.trim();
        const description = descriptionField.value.trim();
        const dueDate = dueDateField.value;
        const label = labelField.value;
        const priority = priorityField.value;
        const status = statusField.value;
        const file = fileField.files[0];

        if (!title || !dueDate || !label || !priority || !status) {
            alert('Mohon lengkapi semua field yang diperlukan.');
            return;
        }

        let fileData = null;
        if (file) {
            try {
                fileData = await getFileData(file);
            } catch (error) {
                alert('Gagal membaca file.');
                return;
            }
        }

        let tasks = getTasks();

        if (id) {
            // Update tugas yang sudah ada
            tasks = tasks.map(task => {
                if (task.id === parseInt(id)) {
                    return {
                        id: task.id,
                        title,
                        description,
                        dueDate,
                        label,
                        priority,
                        status,
                        file: fileData ? fileData : task.file // Update file jika ada
                    };
                }
                return task;
            });
            alert('Tugas berhasil diperbarui!');
        } else {
            // Tambah tugas baru
            const newTask = {
                id: Date.now(),
                title,
                description,
                dueDate,
                label,
                priority,
                status,
                file: fileData
            };
            tasks.push(newTask);
            alert('Tugas berhasil ditambahkan!');
            // Cek notifikasi
            scheduleNotification(newTask);
        }

        saveTasks(tasks);
        displayTasks();
        taskForm.reset();
        filePreview.innerHTML = '';
        cancelEdit();
    });

    // Fungsi untuk mengedit tugas
    async function editTask(id) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Isi form dengan data tugas
        taskIdField.value = task.id;
        titleField.value = task.title;
        descriptionField.value = task.description;
        dueDateField.value = task.dueDate;
        labelField.value = task.label;
        priorityField.value = task.priority;
        statusField.value = task.status;

        // Tampilkan preview file jika ada
        if (task.file) {
            if (task.file.type.startsWith('image/')) {
                filePreview.innerHTML = `<img src="${task.file.data}" alt="${task.file.name}" class="img-thumbnail">`;
            } else {
                filePreview.innerHTML = `<a href="${task.file.data}" download="${task.file.name}">${task.file.name}</a>`;
            }
        } else {
            filePreview.innerHTML = '';
        }

        // Ubah tampilan form
        formTitle.textContent = 'Edit Tugas';
        submitBtn.textContent = 'Perbarui Tugas';
        cancelBtn.classList.remove('d-none');
    }

    // Fungsi untuk membatalkan edit
    function cancelEdit() {
        taskIdField.value = '';
        taskForm.reset();
        filePreview.innerHTML = '';
        formTitle.textContent = 'Tambah Tugas Baru';
        submitBtn.textContent = 'Tambah Tugas';
        cancelBtn.classList.add('d-none');
    }

    // Event listener untuk tombol batal
    cancelBtn.addEventListener('click', cancelEdit);

    // Fungsi untuk menghapus tugas
    function deleteTask(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

        let tasks = getTasks();
        tasks = tasks.filter(task => task.id !== id);
        saveTasks(tasks);
        displayTasks();
        alert('Tugas berhasil dihapus!');
    }

    // Event listener untuk preview file sebelum diunggah
    fileField.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) {
            filePreview.innerHTML = '';
            return;
        }

        const fileType = file.type.split('/')[0];
        if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = function (e) {
                filePreview.innerHTML = `<img src="${e.target.result}" alt="${file.name}" class="img-thumbnail">`;
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.innerHTML = `<p>${file.name}</p>`;
        }
    });

    // Fungsi untuk menerapkan filter, pencarian, dan sortir saat input berubah
    searchField.addEventListener('input', displayTasks);
    filterLabelField.addEventListener('change', displayTasks);
    filterStatusField.addEventListener('change', displayTasks);
    sortTasksField.addEventListener('change', displayTasks);

    // Fungsi untuk membersihkan filter
    clearFiltersBtn.addEventListener('click', function () {
        searchField.value = '';
        filterLabelField.value = '';
        filterStatusField.value = '';
        sortTasksField.value = '';
        displayTasks();
    });

    // Menampilkan tugas saat halaman dimuat
    document.addEventListener('DOMContentLoaded', function () {
        displayTasks();
        checkNotifications();
    });

    // Fungsi global untuk mengakses editTask dan deleteTask dari HTML
    window.editTask = editTask;
    window.deleteTask = deleteTask;

    // ==================== Export/Import Data ====================

    // Sudah ditangani sebelumnya

    // ==================== Notifikasi Pengingat ====================
    function scheduleNotification(task) {
        if (!('Notification' in window)) return;

        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const timeDifference = dueDate.getTime() - now.getTime();

        // Set notifikasi 1 hari sebelum tenggat
        const notificationTime = timeDifference - (24 * 60 * 60 * 1000);

        if (notificationTime > 0) {
            setTimeout(() => {
                new Notification('Pengingat Tugas', {
                    body: `Tugas "${task.title}" akan jatuh tempo besok!`,
                    icon: 'https://i.imgur.com/YourIconLink.png' // Ganti dengan link icon yang sesuai
                });
            }, notificationTime);
        }
    }

    function checkNotifications() {
        const tasks = getTasks();
        tasks.forEach(task => {
            if (task.status !== 'Selesai') {
                scheduleNotification(task);
            }
        });
    }

    // ==================== Dark Mode ====================
    // Sudah ditangani sebelumnya

    // ==================== Integrasi Kalender ====================
    // Menggunakan Google Calendar API membutuhkan setup OAuth yang kompleks.
    // Sebagai alternatif, kita bisa menyediakan link untuk menambahkan tugas ke Google Calendar secara manual.

    // Fungsi untuk mengonversi tugas ke format URL Google Calendar
    function addToGoogleCalendar(task) {
        const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
        const text = encodeURIComponent(task.title);
        const dates = encodeURIComponent(formatDateForCalendar(task.dueDate));
        const details = encodeURIComponent(task.description || '');
        const url = `${baseUrl}&text=${text}&dates=${dates}&details=${details}`;
        window.open(url, '_blank');
    }

    function formatDateForCalendar(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}T000000Z/${year}${month}${day}T235900Z`;
    }

    // Tambahkan tombol "Tambahkan ke Kalender" di aksi tugas
    function displayTasks() {
        let tasks = getTasks();
        const searchQuery = searchField.value.toLowerCase();
        const filterLabel = filterLabelField.value;
        const filterStatus = filterStatusField.value;
        const sortOption = sortTasksField.value;

        // Filter dan pencarian
        tasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery) ||
                (task.description && task.description.toLowerCase().includes(searchQuery));
            const matchesLabel = filterLabel ? task.label === filterLabel : true;
            const matchesStatus = filterStatus ? task.status === filterStatus : true;
            return matchesSearch && matchesLabel && matchesStatus;
        });

        // Sortir
        if (sortOption) {
            switch (sortOption) {
                case 'dueDateAsc':
                    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                    break;
                case 'dueDateDesc':
                    tasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
                    break;
                case 'priorityAsc':
                    tasks.sort((a, b) => priorityValue(a.priority) - priorityValue(b.priority));
                    break;
                case 'priorityDesc':
                    tasks.sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));
                    break;
                case 'labelAsc':
                    tasks.sort((a, b) => a.label.localeCompare(b.label));
                    break;
                case 'labelDesc':
                    tasks.sort((a, b) => b.label.localeCompare(a.label));
                    break;
                default:
                    break;
            }
        }

        tasksTableBody.innerHTML = '';

        if (tasks.length === 0) {
            noTasksMsg.style.display = 'block';
            return;
        } else {
            noTasksMsg.style.display = 'none';
        }

        tasks.forEach((task, index) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${task.title}</td>
                <td>${task.description || '-'}</td>
                <td>${task.label}</td>
                <td>${task.priority}</td>
                <td>${task.dueDate}</td>
                <td>${task.status}</td>
                <td>${displayFile(task.file)}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-sm btn-danger me-2" onclick="deleteTask(${task.id})">Hapus</button>
                    <button class="btn btn-sm btn-success" onclick="addToGoogleCalendar(getTaskById(${task.id}))">Tambahkan ke Kalender</button>
                </td>
            `;

            tasksTableBody.appendChild(tr);
        });
    }

    function getTaskById(id) {
        const tasks = getTasks();
        return tasks.find(task => task.id === id);
    }
}
