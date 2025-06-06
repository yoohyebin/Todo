// ===== 전역 변수 =====
let currentView = 'all';
let currentSort = 'dueDate';
let currentSearch = '';
let currentTagId = null;
let allTodos = [];
let allTags = [];
let editingTodoId = null;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    loadTags();
    showAllTodos();
    setDefaultDate();
});

// ===== API 호출 함수들 =====
const API_BASE = '/api';

async function apiCall(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== 태그 관련 함수들 =====
async function loadTags() {
    try {
        console.log('태그 로딩 시작...'); // 디버깅용
        const response = await apiCall('/tags');
        console.log('태그 API 응답:', response); // 디버깅용
        allTags = response.data || response;
        console.log('로딩된 태그들:', allTags); // 디버깅용
        renderSidebarTags();
        renderModalTags();
        renderEditModalTags();
    } catch (error) {
        console.error('태그 로딩 실패:', error);
    }
}

function renderSidebarTags() {
    const tagList = document.getElementById('sidebarTagList');
    tagList.innerHTML = '';

    allTags.forEach(tag => {
        const li = document.createElement('li');
        li.className = 'tag-item';
        li.innerHTML = `
            <a href="#" class="tag-link" onclick="filterByTag(${tag.id})" data-tag-id="${tag.id}">
                <div class="tag-color" style="background-color: ${tag.color}"></div>
                ${tag.name}
            </a>
        `;
        tagList.appendChild(li);
    });
}

function renderModalTags() {
    const tagSelector = document.getElementById('modalTagSelector');
    tagSelector.innerHTML = '';

    allTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-option';
        tagElement.style.backgroundColor = tag.color;
        tagElement.textContent = tag.name;
        tagElement.setAttribute('data-tag-id', tag.id);
        tagElement.onclick = () => {
            console.log('태그 클릭됨:', tag.id, tag.name); // 디버깅용
            selectTag(tag.id);
        };
        tagSelector.appendChild(tagElement);
    });

    console.log('모달 태그 렌더링 완료:', allTags.length, '개'); // 디버깅용
}

function renderEditModalTags() {
    const tagSelector = document.getElementById('editModalTagSelector');
    tagSelector.innerHTML = '';

    allTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-option';
        tagElement.style.backgroundColor = tag.color;
        tagElement.textContent = tag.name;
        tagElement.setAttribute('data-tag-id', tag.id);
        tagElement.onclick = () => {
            console.log('수정 모달 태그 클릭됨:', tag.id, tag.name);
            selectEditTag(tag.id);
        };
        tagSelector.appendChild(tagElement);
    });
}

function selectTag(tagId) {
    // 모달 내의 모든 태그 선택 해제
    const modalTagSelector = document.getElementById('modalTagSelector');
    modalTagSelector.querySelectorAll('.tag-option').forEach(el => {
        el.classList.remove('selected');
    });

    // 선택된 태그 표시 (모달 내에서만 찾기)
    const selectedTag = modalTagSelector.querySelector(`[data-tag-id="${tagId}"]`);
    if (selectedTag) {
        selectedTag.classList.add('selected');
        console.log('태그 선택됨:', tagId); // 디버깅용
    } else {
        console.error('태그를 찾을 수 없음:', tagId); // 디버깅용
    }
}

function selectEditTag(tagId) {
    // 수정 모달 내의 모든 태그 선택 해제
    const editModalTagSelector = document.getElementById('editModalTagSelector');
    editModalTagSelector.querySelectorAll('.tag-option').forEach(el => {
        el.classList.remove('selected');
    });

    // 선택된 태그 표시
    const selectedTag = editModalTagSelector.querySelector(`[data-tag-id="${tagId}"]`);
    if (selectedTag) {
        selectedTag.classList.add('selected');
        console.log('수정 모달 태그 선택됨:', tagId);
    } else {
        console.error('수정 모달에서 태그를 찾을 수 없음:', tagId);
    }
}

// ===== 할일 관련 함수들 =====
async function loadTodos(params = {}) {
    try {
        const queryParams = new URLSearchParams();

        if (params.status) queryParams.append('status', params.status);
        if (params.priority) queryParams.append('priority', params.priority);
        if (params.search) queryParams.append('search', params.search);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.tagId) queryParams.append('tagId', params.tagId);

        const url = `/todos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const todos = await apiCall(url);
        allTodos = Array.isArray(todos) ? todos : (todos.data || []);
        renderTodos();
    } catch (error) {
        console.error('할일 로딩 실패:', error);
        showError('할일을 불러오는데 실패했습니다.');
    }
}

function renderTodos() {
    const mainContentArea = document.getElementById('mainContentArea');

    if (allTodos.length === 0) {
        mainContentArea.innerHTML = `
            <div class="empty-state">
                <h3>할일이 없습니다</h3>
                <p>새로운 할일을 추가해보세요!</p>
            </div>
        `;
        return;
    }

    const todoGrid = document.createElement('div');
    todoGrid.className = 'todo-grid';

    allTodos.forEach(todo => {
        const todoCard = createTodoCard(todo);
        todoGrid.appendChild(todoCard);
    });

    mainContentArea.innerHTML = '';
    mainContentArea.appendChild(todoGrid);
}

function createTodoCard(todo) {
    const card = document.createElement('div');
    card.className = `todo-card ${todo.status === 'DONE' ? 'completed' : ''}`;

    const dueDate = new Date(todo.dueDate);
    const formattedDate = dueDate.toLocaleDateString('ko-KR') + ' ' + dueDate.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});

    card.innerHTML = `
        <div class="todo-card-header">
            <div class="todo-checkbox ${todo.status === 'DONE' ? 'completed' : ''}" 
                 onclick="toggleTodoStatus(${todo.id}, '${todo.status}')">
            </div>
            <div class="todo-main">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.content ? `<div class="todo-description">${escapeHtml(todo.content)}</div>` : ''}
            </div>
        </div>
        
        <div class="todo-meta">
            <div class="todo-badges">
                <span class="badge priority-${todo.priority.toLowerCase()}">${getPriorityText(todo.priority)}</span>
                ${todo.tagName ? `<span class="tag-badge" style="background-color: ${todo.tagColor}">${escapeHtml(todo.tagName)}</span>` : ''}
            </div>
            <div class="todo-date">📅 ${formattedDate}</div>
        </div>
        
        <div class="todo-actions">
            <button class="action-btn" onclick="editTodo(${todo.id})">수정</button>
            <button class="action-btn delete" onclick="deleteTodo(${todo.id})">삭제</button>
        </div>
    `;

    return card;
}

function getPriorityText(priority) {
    switch(priority) {
        case 'HIGH': return '높음';
        case 'MEDIUM': return '중간';
        case 'LOW': return '낮음';
        default: return '중간';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 할일 상태 변경 =====
async function toggleTodoStatus(todoId, currentStatus) {
    try {
        const endpoint = currentStatus === 'DONE' ? 'restart' : 'complete';
        await apiCall(`/todos/${todoId}/${endpoint}`, { method: 'PATCH' });

        // 현재 보기에 따라 다시 로드
        loadCurrentView();
    } catch (error) {
        console.error('상태 변경 실패:', error);
        showError('할일 상태 변경에 실패했습니다.');
    }
}

// ===== 할일 삭제 =====
async function deleteTodo(todoId) {
    if (!confirm('정말로 이 할일을 삭제하시겠습니까?')) {
        return;
    }

    try {
        await apiCall(`/todos/${todoId}`, { method: 'DELETE' });
        loadCurrentView();
    } catch (error) {
        console.error('삭제 실패:', error);
        showError('할일 삭제에 실패했습니다.');
    }
}

// ===== 뷰 전환 함수들 =====
function showAllTodos() {
    currentView = 'all';
    updateActiveMenu('all');
    document.getElementById('contentTitle').textContent = '모든 할 일';
    loadTodos({ sort: currentSort });
}

function showCalendar() {
    currentView = 'calendar';
    updateActiveMenu('calendar');
    document.getElementById('contentTitle').textContent = '달력 보기';

    const mainContentArea = document.getElementById('mainContentArea');
    mainContentArea.innerHTML = `
        <div class="calendar-container">
            <div style="padding: 40px; text-align: center; color: #9aa0a6;">
                <h3>달력 기능 준비 중</h3>
                <p>곧 달력 보기 기능이 제공될 예정입니다.</p>
            </div>
        </div>
    `;
}

function showPendingTodos() {
    currentView = 'pending';
    updateActiveMenu('pending');
    document.getElementById('contentTitle').textContent = '예정된 일';
    loadTodos({ status: 'TODO', sort: currentSort });
}

function showCompletedTodos() {
    currentView = 'completed';
    updateActiveMenu('completed');
    document.getElementById('contentTitle').textContent = '완료된 일';
    loadTodos({ status: 'DONE', sort: currentSort });
}

function filterByTag(tagId) {
    currentView = 'tag';
    currentTagId = tagId;

    const tag = allTags.find(t => t.id === tagId);
    const tagName = tag ? tag.name : '태그';

    updateActiveMenu('tag', tagId);
    document.getElementById('contentTitle').textContent = `#${tagName}`;
    loadTodos({ tagId: tagId, sort: currentSort });
}

function updateActiveMenu(view, tagId = null) {
    // 모든 사이드바 링크에서 active 클래스 제거
    document.querySelectorAll('.sidebar-menu a, .tag-link').forEach(link => {
        link.classList.remove('active');
    });

    // 해당 뷰에 active 클래스 추가
    if (view === 'tag' && tagId) {
        const tagLink = document.querySelector(`[data-tag-id="${tagId}"]`);
        if (tagLink) tagLink.classList.add('active');
    } else {
        const menuLink = document.querySelector(`[data-view="${view}"]`);
        if (menuLink) menuLink.classList.add('active');
    }
}

// ===== 검색 및 정렬 =====
function handleMainSearch(event) {
    if (event.key === 'Enter') {
        currentSearch = event.target.value.trim();
        if (currentSearch) {
            currentView = 'search';
            document.getElementById('contentTitle').textContent = `"${currentSearch}" 검색 결과`;
            loadTodos({ search: currentSearch, sort: currentSort });
        } else {
            showAllTodos();
        }
    }
}

function handleSortChange() {
    currentSort = document.getElementById('sortSelect').value;
    loadCurrentView();
}

function loadCurrentView() {
    switch(currentView) {
        case 'all':
            showAllTodos();
            break;
        case 'pending':
            showPendingTodos();
            break;
        case 'completed':
            showCompletedTodos();
            break;
        case 'tag':
            filterByTag(currentTagId);
            break;
        case 'search':
            loadTodos({ search: currentSearch, sort: currentSort });
            break;
        default:
            showAllTodos();
    }
}

// ===== 모달 관련 함수들 =====
function openAddTodoModal() {
    document.getElementById('addTodoModal').classList.add('active');
    clearModalForm();
    setDefaultDate();
}

function closeAddTodoModal(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }
    document.getElementById('addTodoModal').classList.remove('active');
}

function openEditTodoModal(todoId) {
    editingTodoId = todoId;
    document.getElementById('editTodoModal').classList.add('active');
    clearEditModalForm();
    renderEditModalTags();
    loadTodoForEdit(todoId);
}

function closeEditTodoModal(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }
    document.getElementById('editTodoModal').classList.remove('active');
    editingTodoId = null;
}

function clearModalForm() {
    document.getElementById('todoTitle').value = '';
    document.getElementById('todoDescription').value = '';
    document.getElementById('todoPriority').value = 'MEDIUM';

    // 모달 내 태그 선택 해제
    const modalTagSelector = document.getElementById('modalTagSelector');
    modalTagSelector.querySelectorAll('.tag-option').forEach(el => {
        el.classList.remove('selected');
    });
}

function clearEditModalForm() {
    document.getElementById('editTodoTitle').value = '';
    document.getElementById('editTodoDescription').value = '';
    document.getElementById('editTodoPriority').value = 'MEDIUM';

    // 수정 모달 내 태그 선택 해제
    const editModalTagSelector = document.getElementById('editModalTagSelector');
    editModalTagSelector.querySelectorAll('.tag-option').forEach(el => {
        el.classList.remove('selected');
    });
}

function setDefaultDate() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    document.getElementById('todoDate').value = today;
    document.getElementById('todoTime').value = currentTime;
}

// ===== 할일 저장 =====
async function saveTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const content = document.getElementById('todoDescription').value.trim();
    const date = document.getElementById('todoDate').value;
    const time = document.getElementById('todoTime').value;
    const priority = document.getElementById('todoPriority').value;

    // 모달 내에서 선택된 태그 찾기
    const modalTagSelector = document.getElementById('modalTagSelector');
    const selectedTag = modalTagSelector.querySelector('.tag-option.selected');

    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }

    if (!selectedTag) {
        alert('태그를 선택해주세요.');
        return;
    }

    const tagId = parseInt(selectedTag.getAttribute('data-tag-id'));
    const dueDate = `${date}T${time}:00`;

    console.log('저장할 데이터:', { title, content, dueDate, priority, tagId }); // 디버깅용

    const todoData = {
        title: title,
        content: content,
        dueDate: dueDate,
        priority: priority,
        tagId: tagId
    };

    try {
        await apiCall('/todos', {
            method: 'POST',
            body: JSON.stringify(todoData)
        });

        closeAddTodoModal();
        loadCurrentView();
        showSuccess('할일이 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error('할일 저장 실패:', error);
        showError('할일 저장에 실패했습니다.');
    }
}

// ===== 태그 관리 =====
function openTagManager() {
    document.getElementById('tagManagerModal').classList.add('active');
    clearTagForm();
    renderTagManagerList();
}

function closeTagManagerModal(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }
    document.getElementById('tagManagerModal').classList.remove('active');
}

function clearTagForm() {
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagColor').value = '#6c757d';
}

function setTagColor(color) {
    document.getElementById('newTagColor').value = color;
}

async function renderTagManagerList() {
    const tagManagerList = document.getElementById('tagManagerList');

    if (allTags.length === 0) {
        tagManagerList.innerHTML = `
            <div class="empty-tags">
                <p>아직 생성된 태그가 없습니다.</p>
            </div>
        `;
        return;
    }

    tagManagerList.innerHTML = '';

    for (const tag of allTags) {
        // 태그별 할일 개수 가져오기
        let todoCount = 0;
        try {
            const response = await apiCall(`/tags/${tag.id}/stats`);
            const stats = response.data || response;
            todoCount = stats.totalTodos || 0;
        } catch (error) {
            console.error('태그 통계 로드 실패:', error);
        }

        const tagItem = document.createElement('div');
        tagItem.className = 'tag-manager-item';
        tagItem.dataset.tagId = tag.id;

        tagItem.innerHTML = `
            <div class="tag-info">
                <div class="tag-color-display" style="background-color: ${tag.color}"></div>
                <div class="tag-name-display">${escapeHtml(tag.name)}</div>
                <div class="tag-stats">${todoCount}개 할일</div>
            </div>
            
            <div class="tag-edit-form" id="editForm_${tag.id}">
                <input type="text" class="tag-edit-input" value="${escapeHtml(tag.name)}" maxlength="30">
                <input type="color" class="tag-edit-color" value="${tag.color}">
                <div class="tag-edit-actions">
                    <button class="tag-save-btn" onclick="saveTagEdit(${tag.id})">저장</button>
                    <button class="tag-cancel-btn" onclick="cancelTagEdit(${tag.id})">취소</button>
                </div>
            </div>
            
            <div class="tag-actions" id="actions_${tag.id}">
                <button class="tag-action-btn" onclick="editTag(${tag.id})">수정</button>
                <button class="tag-action-btn delete" onclick="deleteTag(${tag.id})">삭제</button>
            </div>
        `;

        tagManagerList.appendChild(tagItem);
    }
}

async function addNewTag() {
    const name = document.getElementById('newTagName').value.trim();
    const color = document.getElementById('newTagColor').value;

    if (!name) {
        alert('태그명을 입력해주세요.');
        return;
    }

    if (name.length > 30) {
        alert('태그명은 30자 이하로 입력해주세요.');
        return;
    }

    const tagData = {
        name: name,
        color: color
    };

    try {
        const response = await apiCall('/tags', {
            method: 'POST',
            body: JSON.stringify(tagData)
        });

        if (response.success === false) {
            alert(response.message || '태그 추가에 실패했습니다.');
            return;
        }

        clearTagForm();
        await loadTags(); // 전체 태그 목록 새로고침
        renderTagManagerList();
        showSuccess('태그가 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error('태그 추가 실패:', error);
        showError('태그 추가에 실패했습니다.');
    }
}

function editTag(tagId) {
    const tagItem = document.querySelector(`.tag-manager-item[data-tag-id="${tagId}"]`);
    const editForm = document.getElementById(`editForm_${tagId}`);
    const actions = document.getElementById(`actions_${tagId}`);

    tagItem.classList.add('editing');
    editForm.classList.add('active');
    actions.style.display = 'none';

    const nameInput = editForm.querySelector('.tag-edit-input');
    nameInput.focus();
    nameInput.select();
}

function cancelTagEdit(tagId) {
    const tagItem = document.querySelector(`.tag-manager-item[data-tag-id="${tagId}"]`);
    const editForm = document.getElementById(`editForm_${tagId}`);
    const actions = document.getElementById(`actions_${tagId}`);

    tagItem.classList.remove('editing');
    editForm.classList.remove('active');
    actions.style.display = 'flex';

    // 원래 값으로 복원
    const tag = allTags.find(t => t.id == tagId);
    if (tag) {
        editForm.querySelector('.tag-edit-input').value = tag.name;
        editForm.querySelector('.tag-edit-color').value = tag.color;
    }
}

async function saveTagEdit(tagId) {
    const editForm = document.getElementById(`editForm_${tagId}`);
    const name = editForm.querySelector('.tag-edit-input').value.trim();
    const color = editForm.querySelector('.tag-edit-color').value;

    if (!name) {
        alert('태그명을 입력해주세요.');
        return;
    }

    if (name.length > 30) {
        alert('태그명은 30자 이하로 입력해주세요.');
        return;
    }

    const tagData = {
        name: name,
        color: color
    };

    try {
        const response = await apiCall(`/tags/${tagId}`, {
            method: 'PUT',
            body: JSON.stringify(tagData)
        });

        if (response.success === false) {
            alert(response.message || '태그 수정에 실패했습니다.');
            return;
        }

        await loadTags(); // 전체 태그 목록 새로고침
        renderTagManagerList();
        showSuccess('태그가 성공적으로 수정되었습니다!');
    } catch (error) {
        console.error('태그 수정 실패:', error);
        showError('태그 수정에 실패했습니다.');
    }
}

async function deleteTag(tagId) {
    const tag = allTags.find(t => t.id == tagId);
    if (!tag) {
        showError('태그를 찾을 수 없습니다.');
        return;
    }

    const confirmMessage = `"${tag.name}" 태그를 정말로 삭제하시겠습니까?\n\n이 태그를 사용하는 할일이 있다면 삭제할 수 없습니다.`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await apiCall(`/tags/${tagId}`, {
            method: 'DELETE'
        });

        if (response.success === false) {
            if (response.errorCode === 'TAG_IN_USE') {
                alert(`이 태그를 사용하는 할일이 ${response.todoCount}개 있어 삭제할 수 없습니다.\n먼저 해당 할일들의 태그를 변경해주세요.`);
            } else {
                alert(response.message || '태그 삭제에 실패했습니다.');
            }
            return;
        }

        await loadTags(); // 전체 태그 목록 새로고침
        renderTagManagerList();
        loadCurrentView(); // 현재 보기도 새로고침 (태그 필터 중이었다면)
        showSuccess('태그가 성공적으로 삭제되었습니다!');
    } catch (error) {
        console.error('태그 삭제 실패:', error);
        showError('태그 삭제에 실패했습니다.');
    }
}

// ===== 할일 수정 (기본 구현) =====
function editTodo(todoId) {
    openEditTodoModal(todoId);
}

async function loadTodoForEdit(todoId) {
    try {
        const todo = await apiCall(`/todos/${todoId}`);
        const todoData = todo.data || todo;

        // 폼에 기존 데이터 채우기
        document.getElementById('editTodoTitle').value = todoData.title;
        document.getElementById('editTodoDescription').value = todoData.content || '';
        document.getElementById('editTodoPriority').value = todoData.priority;

        // 날짜와 시간 분리
        const dueDate = new Date(todoData.dueDate);
        const dateStr = dueDate.toISOString().split('T')[0];
        const timeStr = dueDate.toTimeString().slice(0, 5);

        document.getElementById('editTodoDate').value = dateStr;
        document.getElementById('editTodoTime').value = timeStr;

        // 기존 태그 선택
        if (todoData.tagId) {
            selectEditTag(todoData.tagId);
        } else {
            // tagId가 없다면 태그명으로 찾기
            const tag = allTags.find(t => t.name === todoData.tagName);
            if (tag) {
                selectEditTag(tag.id);
            }
        }

        console.log('수정용 데이터 로드 완료:', todoData);
    } catch (error) {
        console.error('할일 데이터 로드 실패:', error);
        showError('할일 데이터를 불러오는데 실패했습니다.');
    }
}

async function updateTodo() {
    if (!editingTodoId) {
        showError('수정할 할일을 찾을 수 없습니다.');
        return;
    }

    const title = document.getElementById('editTodoTitle').value.trim();
    const content = document.getElementById('editTodoDescription').value.trim();
    const date = document.getElementById('editTodoDate').value;
    const time = document.getElementById('editTodoTime').value;
    const priority = document.getElementById('editTodoPriority').value;

    // 수정 모달에서 선택된 태그 찾기
    const editModalTagSelector = document.getElementById('editModalTagSelector');
    const selectedTag = editModalTagSelector.querySelector('.tag-option.selected');

    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }

    if (!selectedTag) {
        alert('태그를 선택해주세요.');
        return;
    }

    const tagId = parseInt(selectedTag.getAttribute('data-tag-id'));
    const dueDate = `${date}T${time}:00`;

    const todoData = {
        title: title,
        content: content,
        dueDate: dueDate,
        priority: priority,
        tagId: tagId
    };

    console.log('수정할 데이터:', todoData);

    try {
        await apiCall(`/todos/${editingTodoId}`, {
            method: 'PUT',
            body: JSON.stringify(todoData)
        });

        closeEditTodoModal();
        loadCurrentView();
        showSuccess('할일이 성공적으로 수정되었습니다!');
    } catch (error) {
        console.error('할일 수정 실패:', error);
        showError('할일 수정에 실패했습니다.');
    }
}

// ===== 알림 함수들 =====
function showSuccess(message) {
    // 간단한 알림 (추후 토스트 메시지로 개선 가능)
    alert(message);
}

function showError(message) {
    alert(message);
}

// ===== ESC 키로 모달 닫기 =====
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAddTodoModal();
        closeEditTodoModal();
        closeTagManagerModal();
    }
});

// ===== 모달 외부 클릭으로 닫기 =====
document.getElementById('addTodoModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeAddTodoModal();
    }
});

document.getElementById('editTodoModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeEditTodoModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('tagManagerModal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeTagManagerModal();
        }
    });
});