import { useEffect, useState } from 'react';
import { SearchUser, User } from '../../types/User';
import { UserService } from '../../services/UserService';
import { CSVService } from '../../services/CSVService';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import styles from './UserTable.module.scss';
import { SortOrder } from '../../types/ShortOrder';
import UserTableToDrop from './UserTableToDrop/UserTableToDrop';
import { UserTableToDrag } from './UserTableToDrag/UsertTableToDrag';


const UserTable = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerms, setSearchTerms] = useState<SearchUser>({ name: '', gender: '', email: '' });
    const [sort, setSort] = useState<{ field: keyof User | '', order: SortOrder }>({ field: '', order: SortOrder.ASC });
    const [selectedRows, setSelectedRows] = useState<User[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const [dragedUsers, setDraggedUsers] = useState<User[]>([]);
    const csvService = new CSVService();

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        if (source?.droppableId !== destination.droppableId) {
            const sourceList = source?.droppableId === "users" ? users : dragedUsers;
            const destinationList = destination.droppableId === "users" ? users : dragedUsers;
            const removed = sourceList[source.index];
            sourceList.splice(source.index, 1);
            destinationList.splice(destination.index, 0, removed);

            if (source?.droppableId === "users") {
                setUsers([...sourceList]);
                setDraggedUsers([...destinationList]);
            } else {
                setUsers([...destinationList]);
                setDraggedUsers([...sourceList]);
            }
        }
    };

    useEffect(() => {
        UserService.getRandomUsers()
            .then(setUsers)
            .catch(console.error);
    }, []);


    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
        setSearchTerms({ ...searchTerms, [field]: e.target.value });
    };

    const handleSort = (field: keyof User) => {
        const isCurrentField = sort.field === field;
        const order = isCurrentField && sort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        setSort({ field, order });
    };

    const handleSelect = (user: User) => {
        if (selectedRows.includes(user)) {
            setSelectedRows(selectedRows.filter(row => row !== user));
        } else {
            setSelectedRows([...selectedRows, user]);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows([...filteredAndSortedUsers]);
        }
        setSelectAll(!selectAll);
    };

    const filterAndSortUsers = (user: User) => {
        const fullName = `${user.name.first} ${user.name.last}`.toLowerCase();
        return (
            fullName.includes(searchTerms.name.toLowerCase()) &&
            (searchTerms.gender === '' || user.gender.toLowerCase().startsWith(searchTerms.gender.toLowerCase())) &&
            user.email.toLowerCase().includes(searchTerms.email.toLowerCase())
        );
    };

    const getSortValue = (user: User) => {
        if (sort.field === 'name') {
            return user.name.first;
        } else if (sort.field) {
            return String(user[sort.field]);
        }
        return '';
    };

    const sortFunction = (userA: User, userB: User) => {
        const a = getSortValue(userA);
        const b = getSortValue(userB);
        return sort.order === SortOrder.ASC ? a.localeCompare(b) : b.localeCompare(a);
    };

    const exportToCSV = (data: User[], headers: (keyof User)[], filename: string) => {
        const flattenedData = data.map(user => ({
            ...user,
            name: `${user.name.first} ${user.name.last}`
        }));
        const csvContent = csvService.generateCSVContent(flattenedData, headers);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = Date.now();
        link.setAttribute('download', `${filename}_${timestamp}.csv`);
        link.click();
    };

    const exportSelectedToCSV = () => {
        const headers: (keyof User)[] = ['name', 'gender', 'email'];
        exportToCSV(selectedRows.length ? selectedRows : users, headers, 'users');
    };

    const exportDragedToCSV = () => {
        const headers: (keyof User)[] = ['name', 'gender', 'email'];
        exportToCSV(dragedUsers.length ? dragedUsers : users, headers, 'draged_users');
    };

    let filteredAndSortedUsers = users.filter(filterAndSortUsers);

    if (sort.field) {
        filteredAndSortedUsers = filteredAndSortedUsers.sort(sortFunction);
    }

    return (
        <>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className={styles.flexContainer}>
                    <UserTableToDrag
                        users={filteredAndSortedUsers}
                        searchTerms={searchTerms}
                        sort={sort}
                        selectedRows={selectedRows}
                        selectAll={selectAll}
                        handleSearch={handleSearch}
                        handleSort={handleSort}
                        handleSelect={handleSelect}
                        handleSelectAll={handleSelectAll}
                        exportSelectedToCSV={exportSelectedToCSV}
                    />
                    <UserTableToDrop
                        dragedUsers={dragedUsers}
                        handleSelect={handleSelect}
                        selectedRows={selectedRows}
                        exportDragedToCSV={exportDragedToCSV}
                    />
                </div>
            </DragDropContext>
        </>
    );
};

export default UserTable;