// ===== 전역 변수 =====
let currentView = 'all';
let currentSort = 'dueDate';
let currentSearch = '';
let currentTagId = null;
let allTodos = [];
let allTags = [];

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
    alert('태그 관리 기능은 준비 중입니다.');
    // TODO: 태그 관리 모달 구현
}

// ===== 할일 수정 (기본 구현) =====
function editTodo(todoId) {
    alert('할일 수정 기능은 준비 중입니다.');
    // TODO: 할일 수정 모달 구현
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
    }
});

// ===== 모달 외부 클릭으로 닫기 =====
document.getElementById('addTodoModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeAddTodoModal();
    }
});