// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TaskManagement {
    // Định nghĩa vai trò
    enum Role { Employee, TeamLead, Admin }
    
    // Định nghĩa trạng thái task
    enum TaskStatus { Created, Assigned, InProgress, Completed, Rejected }
    
    // Cấu trúc User
    struct User {
        address userAddress;
        string name;
        Role role;
        bool isActive;
    }
    
    // Cấu trúc Task
    struct Task {
        uint id;
        string title;
        string description;
        string ipfsHash;  // Lưu trữ dữ liệu chi tiết trên IPFS
        address assignedTo;
        address createdBy;
        TaskStatus status;
        uint createdAt;
        uint updatedAt;
    }
    
    // Lưu trữ users
    mapping(address => User) public users;
    address[] public userAddresses;
    
    // Lưu trữ tasks
    mapping(uint => Task) public tasks;
    uint public taskCount;

    // Các events
    event UserCreated(address indexed userAddress, string name, Role role);
    event TaskCreated(uint indexed id, string title, address createdBy);
    event TaskAssigned(uint indexed id, address assignedTo);
    event TaskStatusChanged(uint indexed id, TaskStatus status);
    event TaskUpdated(uint indexed id, string title, string description, string ipfsHash);
    event TaskArchived(uint indexed id);
    event UserStatusChanged(address indexed userAddress, bool isActive);
    event TransactionExecuted(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bool success
    );
    
    // Thêm mapping để track archived tasks
    mapping(uint => bool) public archivedTasks;
    
    // Modifier để kiểm tra quyền Admin
    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin, "Only admin can perform this action");
        _;
    }
    
    // Modifier để kiểm tra quyền TeamLead
    modifier onlyTeamLead() {
        require(users[msg.sender].role == Role.TeamLead, "Only team lead can perform this action");
        _;
    }
    
    // Hàm khởi tạo
    constructor() {
        // Tạo người dùng admin đầu tiên
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: "Admin",
            role: Role.Admin,
            isActive: true
        });
        userAddresses.push(msg.sender);
    }
    
    // Hàm tạo user mới (chỉ Admin)
    function createUser(address _userAddress, string memory _name, Role _role) public onlyAdmin {
        require(users[_userAddress].userAddress == address(0), "User already exists");
        
        users[_userAddress] = User({
            userAddress: _userAddress,
            name: _name,
            role: _role,
            isActive: true
        });
        
        userAddresses.push(_userAddress);
        emit UserCreated(_userAddress, _name, _role);
    }
    
    // Hàm tạo task mới (chỉ TeamLead)
    function createTask(string memory _title, string memory _description, string memory _ipfsHash) 
    public onlyTeamLead returns (uint) {
        uint taskId = taskCount++;
        
        tasks[taskId] = Task({
            id: taskId,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            assignedTo: address(0),
            createdBy: msg.sender,
            status: TaskStatus.Created,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit TaskCreated(taskId, _title, msg.sender);
        return taskId;
    }
    
    // Hàm phân công task (chỉ TeamLead)
    function assignTask(uint _taskId, address _assignedTo) public onlyTeamLead {
        require(_taskId < taskCount, "Task does not exist");
        require(users[_assignedTo].role == Role.Employee, "Only employees can be assigned tasks");
        
        Task storage task = tasks[_taskId];
        task.assignedTo = _assignedTo;
        task.status = TaskStatus.Assigned;
        task.updatedAt = block.timestamp;
        
        emit TaskAssigned(_taskId, _assignedTo);
    }
    
    // Hàm cập nhật trạng thái task (nhân viên)
    function updateTaskStatus(uint _taskId, TaskStatus _status) public {
        require(_taskId < taskCount, "Task does not exist");
        
        Task storage task = tasks[_taskId];
        require(task.assignedTo == msg.sender, "Only assigned employee can update this task");
        require(_status != TaskStatus.Created && _status != TaskStatus.Assigned, "Invalid status transition");
        
        task.status = _status;
        task.updatedAt = block.timestamp;
        
        emit TaskStatusChanged(_taskId, _status);
    }
    
    // Các hàm getter để truy vấn dữ liệu
    function getUserRole(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }
    
    function getTasksCount() public view returns (uint) {
        return taskCount;
    }
    
    function getUsersCount() public view returns (uint) {
        return userAddresses.length;
    }
    
    // Hàm cập nhật task
    function updateTask(
        uint _taskId, 
        string memory _title, 
        string memory _description, 
        string memory _ipfsHash
    ) public {
        require(_taskId < taskCount, "Task does not exist");
        Task storage task = tasks[_taskId];
        require(
            task.createdBy == msg.sender || 
            users[msg.sender].role == Role.TeamLead || 
            users[msg.sender].role == Role.Admin, 
            "Not authorized"
        );
        
        task.title = _title;
        task.description = _description;
        task.ipfsHash = _ipfsHash;
        task.updatedAt = block.timestamp;
        
        emit TaskUpdated(_taskId, _title, _description, _ipfsHash);
        emit TransactionExecuted(
            msg.sender,
            address(this),
            0,
            msg.data,
            true
        );
    }
    
    // Hàm archive task
    function archiveTask(uint _taskId) public {
        require(_taskId < taskCount, "Task does not exist");
        require(
            tasks[_taskId].createdBy == msg.sender || 
            users[msg.sender].role == Role.Admin,
            "Not authorized"
        );
        
        archivedTasks[_taskId] = true;
        emit TaskArchived(_taskId);
        emit TransactionExecuted(
            msg.sender,
            address(this),
            0,
            msg.data,
            true
        );
    }
    
    // Hàm thay đổi trạng thái user
    function toggleUserStatus(address _userAddress) public onlyAdmin {
        require(users[_userAddress].userAddress != address(0), "User does not exist");
        users[_userAddress].isActive = !users[_userAddress].isActive;
        emit UserStatusChanged(_userAddress, users[_userAddress].isActive);
        emit TransactionExecuted(
            msg.sender,
            address(this),
            0,
            msg.data,
            true
        );
    }
    
    // Hàm kiểm tra task có bị archive không
    function isTaskArchived(uint _taskId) public view returns (bool) {
        return archivedTasks[_taskId];
    }
    
    // Hàm lấy danh sách tasks của một user
    function getUserTasks(address _userAddress) public view returns (uint[] memory) {
        uint[] memory userTaskIds = new uint[](taskCount);
        uint count = 0;
        
        for (uint i = 0; i < taskCount; i++) {
            if (tasks[i].assignedTo == _userAddress && !archivedTasks[i]) {
                userTaskIds[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = userTaskIds[i];
        }
        
        return result;
    }
}