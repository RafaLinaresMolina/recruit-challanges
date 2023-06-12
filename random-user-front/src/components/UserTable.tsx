import { useEffect, useState, ChangeEvent } from 'react';
import { SearchUser, User } from '../interfaces/User';
import { UserService } from '../services/UserService';
import { CSVService } from '../services/CSVService';
import styles from './UserTable.module.scss';


interface SearchInputProps {
    field: keyof User;
    handleSearch: (e: ChangeEvent<HTMLInputElement>, field: keyof User) => void;
}

enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}

const SearchInput: React.FC<SearchInputProps> = ({ field, handleSearch }) => (
    <div>
        <input type="text" placeholder="Search" onChange={e => handleSearch(e, field)} />
    </div>
);

interface UserHeaderProps {
    field: keyof User;
    sort: { field: keyof User | '', order: SortOrder.ASC | SortOrder.DESC };
    handleSort: (field: keyof User) => void;
    handleSearch: (e: ChangeEvent<HTMLInputElement>, field: keyof User) => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ field, sort, handleSort, handleSearch }) => (
    <th>
        <div>
            <div onClick={() => handleSort(field)}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sort.field === field && (sort.order === SortOrder.ASC ? ' ▲' : ' ▼')}
            </div>
            <SearchInput field={field} handleSearch={handleSearch} />
        </div>
    </th>
);

interface UserRowProps {
    user: User;
    handleSelect: (user: User) => void;
    selected: boolean;
}

const UserRow: React.FC<UserRowProps> = ({ user, handleSelect, selected }) => (
    <tr className={selected ? styles.selected : ''}>
        <td>
            <input type="checkbox" onChange={() => handleSelect(user)} checked={selected} />
        </td>
        <td>{user.name.first} {user.name.last}</td>
        <td>{user.gender}</td>
        <td>{user.email}</td>
    </tr>
);

const UserTable = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerms, setSearchTerms] = useState<SearchUser>({ name: '', gender: '', email: '' });
    const [sort, setSort] = useState<{ field: keyof User | '', order: SortOrder }>({ field: '', order: SortOrder.ASC });
    const [selectedRows, setSelectedRows] = useState<User[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const csvService = new CSVService();

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

    let filteredAndSortedUsers = users.filter(filterAndSortUsers);

    if (sort.field) {
        filteredAndSortedUsers = filteredAndSortedUsers.sort(sortFunction);
    }

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

    return (
        <>
            <div className={styles.container}>
                <button onClick={exportSelectedToCSV}>Export to CSV</button>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" onChange={handleSelectAll} checked={selectAll} />
                            </th>
                            <UserHeader field='name' sort={sort} handleSort={handleSort} handleSearch={handleSearch} />
                            <UserHeader field='gender' sort={sort} handleSort={handleSort} handleSearch={handleSearch} />
                            <UserHeader field='email' sort={sort} handleSort={handleSort} handleSearch={handleSearch} />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedUsers.map((user, index) => (
                            <UserRow key={index} user={user} handleSelect={handleSelect} selected={selectedRows.includes(user)} />
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserTable;